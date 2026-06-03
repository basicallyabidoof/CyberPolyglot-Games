# ── Bootstrap (run once before `terraform init`) ─────────────────────────────
# Create the state bucket and enable versioning:
#   aws s3 mb s3://cyberpolyglots-tfstate --region us-east-1
#   aws s3api put-bucket-versioning \
#     --bucket cyberpolyglots-tfstate \
#     --versioning-configuration Status=Enabled

terraform {
  required_version = ">= 1.5"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  backend "s3" {
    bucket  = "cyberpolyglots-tfstate"
    key     = "production/terraform.tfstate"
    region  = "us-east-1"
    encrypt = true
  }
}

provider "aws" {
  region = var.aws_region
}

# ── AMI ──────────────────────────────────────────────────────────────────────

data "aws_ami" "al2023_arm64" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["al2023-ami-*-arm64"]
  }
  filter {
    name   = "architecture"
    values = ["arm64"]
  }
}

# ── DNS ──────────────────────────────────────────────────────────────────────
# Requires cyberpolyglots.org to be hosted in Route 53.
# If it isn't, create a hosted zone first and update your registrar's nameservers.

data "aws_route53_zone" "cyberpolyglots" {
  name = "cyberpolyglots.org."
}

# ── Networking ───────────────────────────────────────────────────────────────

resource "aws_security_group" "game_server" {
  name        = "cyberpolyglots-game-server"
  description = "HTTP, HTTPS, and SSH for the game server"

  ingress {
    description = "SSH"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  ingress {
    description = "HTTP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  ingress {
    description = "HTTPS"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "cyberpolyglots-game-server" }
}

# ── IAM ──────────────────────────────────────────────────────────────────────
# Gives the instance permission to modify Route 53 records for
# certbot's DNS-01 ACME challenge (no HTTP port needed for verification).

resource "aws_iam_role" "game_server" {
  name = "cyberpolyglots-game-server"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Action    = "sts:AssumeRole"
      Principal = { Service = "ec2.amazonaws.com" }
    }]
  })
}

resource "aws_iam_role_policy" "certbot_route53" {
  name = "certbot-route53"
  role = aws_iam_role.game_server.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "route53:GetChange",
        "route53:ChangeResourceRecordSets",
        "route53:ListHostedZones",
        "route53:ListResourceRecordSets"
      ]
      Resource = "*"
    }]
  })
}

resource "aws_iam_instance_profile" "game_server" {
  name = "cyberpolyglots-game-server"
  role = aws_iam_role.game_server.name
}

# ── EC2 ──────────────────────────────────────────────────────────────────────

resource "aws_key_pair" "deployer" {
  key_name   = "cyberpolyglots-deployer"
  public_key = var.ssh_public_key
}

resource "aws_instance" "game_server" {
  ami                    = data.aws_ami.al2023_arm64.id
  instance_type          = "t4g.micro"
  key_name               = aws_key_pair.deployer.key_name
  vpc_security_group_ids = [aws_security_group.game_server.id]
  iam_instance_profile   = aws_iam_instance_profile.game_server.name

  user_data = templatefile("${path.module}/user_data.sh", {
    reset_password = var.reset_password
    admin_email    = var.admin_email
  })

  root_block_device {
    volume_size = 30
    volume_type = "gp3"
    encrypted   = true
  }

  tags = { Name = "cyberpolyglots-game-server" }
}

resource "aws_eip" "game_server" {
  instance = aws_instance.game_server.id
  domain   = "vpc"

  tags = { Name = "cyberpolyglots-game-server" }
}

# ── Route 53 A records ───────────────────────────────────────────────────────

resource "aws_route53_record" "osint" {
  zone_id = data.aws_route53_zone.cyberpolyglots.zone_id
  name    = "osint"
  type    = "A"
  ttl     = 60
  records = [aws_eip.game_server.public_ip]
}

resource "aws_route53_record" "lingua" {
  zone_id = data.aws_route53_zone.cyberpolyglots.zone_id
  name    = "lingua"
  type    = "A"
  ttl     = 60
  records = [aws_eip.game_server.public_ip]
}

resource "aws_route53_record" "siem" {
  zone_id = data.aws_route53_zone.cyberpolyglots.zone_id
  name    = "siem"
  type    = "A"
  ttl     = 60
  records = [aws_eip.game_server.public_ip]
}
