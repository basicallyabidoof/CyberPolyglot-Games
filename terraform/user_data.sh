#!/bin/bash
# Terraform templatefile — ${reset_password} and ${admin_email} are substituted at plan time.
# $$ in nginx blocks becomes a literal $ in the rendered script.
set -euo pipefail
exec > >(tee /var/log/user-data.log | logger -t user-data -s 2>/dev/console) 2>&1

REPO_DIR=/opt/cyberpolyglot-games
VENV=$REPO_DIR/venv

# ── System packages ───────────────────────────────────────────────────────────
echo "==> Installing system packages"
dnf update -y
dnf install -y python3 python3-pip nginx git

# ── Clone repo ────────────────────────────────────────────────────────────────
echo "==> Cloning repository"
# For a private repo, replace the URL with:
#   https://<PAT>@github.com/basicallyabidoof/CyberPolyglot-Games.git
git clone https://github.com/basicallyabidoof/CyberPolyglot-Games.git "$REPO_DIR"
chown -R ec2-user:ec2-user "$REPO_DIR"

# ── Virtual environment ───────────────────────────────────────────────────────
echo "==> Creating virtual environment"
python3 -m venv "$VENV"
"$VENV/bin/pip" install --upgrade pip
"$VENV/bin/pip" install flask flask-cors gunicorn certbot certbot-dns-route53

# ── Shared env file (RESET_PASSWORD for all games) ───────────────────────────
echo "==> Writing environment config"
mkdir -p /etc/cyberpolyglots
printf 'RESET_PASSWORD=%s\n' '${reset_password}' > /etc/cyberpolyglots/env
chmod 600 /etc/cyberpolyglots/env

# ── Initialize databases ──────────────────────────────────────────────────────
echo "==> Initializing databases"

# Malware Analysis — relative DB_PATH so must run from its own directory
cd "$REPO_DIR/Malware Analysis"
"$VENV/bin/python" init_db.py

# OSINT Puzzles
cd "$REPO_DIR/Multilingual OSINT Puzzles"
"$VENV/bin/python" init_db.py
mkdir -p uploads && chown ec2-user:ec2-user uploads

# Localized Phishing — init_db() lives in app.py but only runs under __main__;
# call it directly so gunicorn starts with an initialised DB
cd "$REPO_DIR/Localized Phishing"
"$VENV/bin/python" -c "from app import init_db, DB_PATH; import os; init_db() if not os.path.exists(DB_PATH) else None"

# ── Systemd services ──────────────────────────────────────────────────────────
echo "==> Creating systemd services"

cat > /etc/systemd/system/lingua-game.service << 'SVCEOF'
[Unit]
Description=Lingua — Localized Phishing Game
After=network.target

[Service]
User=ec2-user
WorkingDirectory=/opt/cyberpolyglot-games/Localized Phishing
EnvironmentFile=/etc/cyberpolyglots/env
ExecStart=/opt/cyberpolyglot-games/venv/bin/gunicorn \
    --workers 2 --bind 127.0.0.1:5001 --timeout 60 app:app
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
SVCEOF

cat > /etc/systemd/system/siem-game.service << 'SVCEOF'
[Unit]
Description=SIEM — Malware Analysis Game
After=network.target

[Service]
User=ec2-user
WorkingDirectory=/opt/cyberpolyglot-games/Malware Analysis
EnvironmentFile=/etc/cyberpolyglots/env
ExecStart=/opt/cyberpolyglot-games/venv/bin/gunicorn \
    --workers 2 --bind 127.0.0.1:5000 --timeout 60 app:app
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
SVCEOF

cat > /etc/systemd/system/osint-game.service << 'SVCEOF'
[Unit]
Description=Multilingual OSINT Puzzles
After=network.target

[Service]
User=ec2-user
WorkingDirectory=/opt/cyberpolyglot-games/Multilingual OSINT Puzzles
EnvironmentFile=/etc/cyberpolyglots/env
ExecStart=/opt/cyberpolyglot-games/venv/bin/gunicorn \
    --workers 2 --bind 127.0.0.1:5002 --timeout 60 app:app
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
SVCEOF

# Allow ec2-user to restart these services without a password (used by GitHub Actions)
cat > /etc/sudoers.d/cyberpolyglots << 'SUDOEOF'
ec2-user ALL=(root) NOPASSWD: \
  /usr/bin/systemctl restart lingua-game, \
  /usr/bin/systemctl restart siem-game, \
  /usr/bin/systemctl restart osint-game, \
  /usr/bin/systemctl reload nginx
SUDOEOF
chmod 440 /etc/sudoers.d/cyberpolyglots

systemctl daemon-reload
systemctl enable --now lingua-game siem-game osint-game

# ── nginx — HTTP only (serves while certbot runs) ─────────────────────────────
echo "==> Configuring nginx (HTTP)"
rm -f /etc/nginx/conf.d/default.conf

cat > /etc/nginx/conf.d/cyberpolyglots.conf << 'NGINXEOF'
server {
    listen 80;
    server_name lingua.cyberpolyglots.org;
    location / {
        proxy_pass         http://127.0.0.1:5001;
        proxy_set_header   Host              $host;
        proxy_set_header   X-Real-IP         $remote_addr;
        proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        client_max_body_size 10M;
    }
}
server {
    listen 80;
    server_name siem.cyberpolyglots.org;
    location / {
        proxy_pass         http://127.0.0.1:5000;
        proxy_set_header   Host              $host;
        proxy_set_header   X-Real-IP         $remote_addr;
        proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        client_max_body_size 10M;
    }
}
server {
    listen 80;
    server_name osint.cyberpolyglots.org;
    location / {
        proxy_pass         http://127.0.0.1:5002;
        proxy_set_header   Host              $host;
        proxy_set_header   X-Real-IP         $remote_addr;
        proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        client_max_body_size 50M;
    }
}
NGINXEOF

systemctl enable --now nginx

# ── TLS certificates (DNS-01 via instance IAM role → no HTTP dependency) ─────
echo "==> Obtaining TLS certificates"
CERTBOT="$VENV/bin/certbot"
EMAIL="${admin_email}"

for DOMAIN in lingua.cyberpolyglots.org siem.cyberpolyglots.org osint.cyberpolyglots.org; do
    "$CERTBOT" certonly --dns-route53 \
        -d "$DOMAIN" \
        --email "$EMAIL" \
        --agree-tos --non-interactive \
    || echo "WARNING: certbot failed for $DOMAIN — run manually after DNS propagates"
done

# ── nginx — HTTPS (written after certs exist) ─────────────────────────────────
echo "==> Configuring nginx (HTTPS)"
cat > /etc/nginx/conf.d/cyberpolyglots.conf << 'NGINXEOF'
# Redirect all HTTP to HTTPS
server {
    listen 80;
    server_name lingua.cyberpolyglots.org siem.cyberpolyglots.org osint.cyberpolyglots.org;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name lingua.cyberpolyglots.org;
    ssl_certificate     /etc/letsencrypt/live/lingua.cyberpolyglots.org/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/lingua.cyberpolyglots.org/privkey.pem;
    include             /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam         /etc/letsencrypt/ssl-dhparams.pem;
    location / {
        proxy_pass         http://127.0.0.1:5001;
        proxy_set_header   Host              $host;
        proxy_set_header   X-Real-IP         $remote_addr;
        proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        client_max_body_size 10M;
    }
}

server {
    listen 443 ssl;
    server_name siem.cyberpolyglots.org;
    ssl_certificate     /etc/letsencrypt/live/siem.cyberpolyglots.org/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/siem.cyberpolyglots.org/privkey.pem;
    include             /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam         /etc/letsencrypt/ssl-dhparams.pem;
    location / {
        proxy_pass         http://127.0.0.1:5000;
        proxy_set_header   Host              $host;
        proxy_set_header   X-Real-IP         $remote_addr;
        proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        client_max_body_size 10M;
    }
}

server {
    listen 443 ssl;
    server_name osint.cyberpolyglots.org;
    ssl_certificate     /etc/letsencrypt/live/osint.cyberpolyglots.org/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/osint.cyberpolyglots.org/privkey.pem;
    include             /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam         /etc/letsencrypt/ssl-dhparams.pem;
    location / {
        proxy_pass         http://127.0.0.1:5002;
        proxy_set_header   Host              $host;
        proxy_set_header   X-Real-IP         $remote_addr;
        proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        client_max_body_size 50M;
    }
}
NGINXEOF

nginx -t && systemctl reload nginx || echo "WARNING: nginx config test failed — check /var/log/nginx/error.log"

# ── Certificate auto-renewal ──────────────────────────────────────────────────
mkdir -p /etc/letsencrypt/renewal-hooks/deploy
cat > /etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh << 'EOF'
#!/bin/bash
systemctl reload nginx
EOF
chmod +x /etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh

echo "0 3 1,15 * * root $VENV/bin/certbot renew --quiet" > /etc/cron.d/certbot-renewal

echo "==> Bootstrap complete — games are live"
