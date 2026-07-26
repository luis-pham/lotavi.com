#!/usr/bin/env bash
# Runs on the VPS as root.
set -euo pipefail

APP_DIR=/opt/lotavi
REPO_URL="${REPO_URL:-https://github.com/luis-pham/lotavi.com.git}"
BRANCH="${BRANCH:-main}"
COMPOSE_DIR="$APP_DIR/infra/compose"
ENV_FILE="$COMPOSE_DIR/.env.hostinger"
COMPOSE_FILE="$COMPOSE_DIR/docker-compose.hostinger.yml"

echo "==> Deploy Lotavi on shared Hostinger VPS (nginx keeps 80/443)"

apt-get update -y
apt-get install -y git curl ca-certificates openssl

if [[ ! -d "$APP_DIR/.git" ]]; then
  rm -rf "$APP_DIR"
  git clone --branch "$BRANCH" "$REPO_URL" "$APP_DIR"
fi

cd "$COMPOSE_DIR"

if [[ ! -f "$COMPOSE_FILE" ]]; then
  echo "Missing $COMPOSE_FILE — copy docker-compose.hostinger.yml onto the VPS first."
  exit 1
fi

if [[ ! -f "$ENV_FILE" ]]; then
  SESSION_SECRET="$(openssl rand -hex 32)"
  POSTGRES_PASSWORD="$(openssl rand -hex 24)"
  cat >"$ENV_FILE" <<EOF
POSTGRES_USER=lotiva
POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
POSTGRES_DB=lotiva
DATABASE_URL=postgres://lotiva:${POSTGRES_PASSWORD}@postgres:5432/lotiva
SESSION_SECRET=${SESSION_SECRET}
EOF
  chmod 600 "$ENV_FILE"
  echo "Created $ENV_FILE"
fi

echo "==> Building stack (this can take several minutes)"
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d --build

echo "==> Installing nginx vhost"
cp "$COMPOSE_DIR/nginx.lotavi.com.conf" /etc/nginx/conf.d/lotavi.com.conf
nginx -t
systemctl reload nginx

echo "==> Waiting for API health"
for i in $(seq 1 60); do
  if curl -fsS http://127.0.0.1:4010/health >/dev/null 2>&1; then
    echo "API healthy"
    break
  fi
  sleep 3
  if [[ "$i" -eq 60 ]]; then
    echo "API health timeout — check: docker compose -f $COMPOSE_FILE logs api"
    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" ps
    exit 1
  fi
done

docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" ps
echo "==> HTTP check via nginx (pre-TLS)"
curl -sI -H 'Host: lotavi.com' http://127.0.0.1/ | head -5 || true

if command -v certbot >/dev/null 2>&1; then
  echo "==> Requesting Let's Encrypt certs (requires DNS A records)"
  certbot --nginx -n --agree-tos --register-unsafely-without-email \
    -d lotavi.com -d www.lotavi.com -d app.lotavi.com -d api.lotavi.com \
    || echo "Certbot failed — fix DNS then rerun certbot."
else
  apt-get install -y certbot python3-certbot-nginx
  certbot --nginx -n --agree-tos --register-unsafely-without-email \
    -d lotavi.com -d www.lotavi.com -d app.lotavi.com -d api.lotavi.com \
    || echo "Certbot failed — fix DNS then rerun certbot."
fi

echo "==> Done. Green Ruby nginx sites left intact."
echo "Rotate root password if it was shared in chat."
