variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "ssh_public_key" {
  description = "SSH public key material for EC2 access (paste the contents of your .pub file)"
  type        = string
}

variable "admin_email" {
  description = "Email for Let's Encrypt certificate registration"
  type        = string
}

variable "reset_password" {
  description = "Leaderboard reset password shared across all three games"
  type        = string
  default     = "gamemaster"
  sensitive   = true
}
