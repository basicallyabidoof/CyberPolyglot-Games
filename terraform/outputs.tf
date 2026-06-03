output "instance_id" {
  value = aws_instance.game_server.id
}

output "elastic_ip" {
  description = "Copy this value into the EC2_HOST GitHub Actions secret"
  value       = aws_eip.game_server.public_ip
}

output "osint_url"  { value = "https://osint.cyberpolyglots.org" }
output "lingua_url" { value = "https://lingua.cyberpolyglots.org" }
output "siem_url"   { value = "https://siem.cyberpolyglots.org" }
