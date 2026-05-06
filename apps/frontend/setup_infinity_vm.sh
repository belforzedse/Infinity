#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 3 ]]; then
  echo "Usage: $0 <environment: prod|staging|experimental> <frontend_domain> <api_domain> [panel_domain]" >&2
  exit 1
fi

ENVIRONMENT="$1"
FRONTEND_DOMAIN="$2"
API_DOMAIN="$3"
PANEL_DOMAIN="${4:-}"

if [[ $EUID -ne 0 ]]; then
  echo "Please run as root (sudo bash ...)" >&2
  exit 1
fi

echo "==> Running setup for $ENVIRONMENT"
echo "    Frontend domain: $FRONTEND_DOMAIN"
echo "    API domain: $API_DOMAIN"
if [[ -n "$PANEL_DOMAIN" ]]; then
  echo "    Panel domain: $PANEL_DOMAIN"
fi

echo "==> Updating apt and installing dependencies..."
apt update
apt upgrade -y
apt install -y curl docker.io  nginx certbot python3-certbot-nginx ufw jq

if ! id -u deploy >/dev/null 2>&1; then
  echo "==> Creating deploy user..."
  useradd -m -s /bin/bash deploy
fi

echo "==> Ensuring Docker service is running..."
systemctl enable --now docker

usermod -aG docker deploy || true

echo "==> Configuring UFW..."
ufw allow 22/tcp || true
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 3031/tcp
ufw allow 9001/tcp
ufw --force enable

echo "==> Creating directories..."
mkdir -p /opt/infinity/frontend /opt/infinity/backend
chown -R deploy:deploy /opt/infinity

echo "==> Writing nginx reverse proxy config..."
cat <<NGINX >/etc/nginx/sites-available/infinitycolor.org
server {
    listen 80;
    server_name ${FRONTEND_DOMAIN} www.${FRONTEND_DOMAIN};

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}

server {
    listen 80;
    server_name ${API_DOMAIN};

    location / {
        proxy_pass http://127.0.0.1:1337;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
NGINX

if [[ -n "$PANEL_DOMAIN" ]]; then
cat <<NGINX >>/etc/nginx/sites-available/infinitycolor.org

server {
    listen 80;
    server_name ${PANEL_DOMAIN};

    location / {
        proxy_pass https://127.0.0.1:9443;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_ssl_verify off;
    }
}
NGINX
fi

rm -f /etc/nginx/sites-enabled/default
ln -sf /etc/nginx/sites-available/infinitycolor.org /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx

echo "==> Installing Portainer agent..."
docker volume create portainer_agent_data >/dev/null
docker rm -f portainer_agent >/dev/null 2>&1 || true
docker run -d \
  -p 9001:9001 \
  --name portainer_agent \
  --restart=unless-stopped \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v /var/lib/docker/volumes:/var/lib/docker/volumes \
  portainer/agent:latest

echo "==> Done. Next steps:"
echo "  - GitHub Actions will deploy frontend/backend via Docker compose; no manual copy needed."
echo "  - Run Certbot: sudo certbot --nginx -d ${FRONTEND_DOMAIN} -d www.${FRONTEND_DOMAIN} -d ${API_DOMAIN}${PANEL_DOMAIN:+ -d ${PANEL_DOMAIN}}"
echo "  - Add Portainer agent (tcp://${HOSTNAME}:9001) to your central Portainer server."
