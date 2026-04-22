# Deploy ANAPEC Platform to Production

## Quick Deploy (Single Command)

```bash
curl -sSL https://raw.githubusercontent.com/your-repo/anapec-platform/main/deploy.sh | bash
```

Or manually:

## 1. Server Setup (gehub)

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo apt install docker-compose-plugin

# Install Certbot for SSL
sudo apt install certbot python3-certbot-nginx
```

## 2. Configure Environment

```bash
cd /opt/anapec-platform

# Create production .env
cat > .env << 'EOF'
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://user:password@host:5432/anapec_db
JWT_ACCESS_SECRET=$(openssl rand -hex 32)
JWT_REFRESH_SECRET=$(openssl rand -hex 32)
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=change_me
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=minioadmin
AWS_SECRET_ACCESS_KEY=minioadmin123
AWS_S3_BUCKET=anapec-platform
AWS_S3_ENDPOINT=http://minio:9000
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=minioadmin123
NEXT_PUBLIC_API_URL=https://wecandigitalsolutions.ma/api/v1
FRONTEND_URL=https://wecandigitalsolutions.ma
OPENAI_API_KEY=
POSTGRES_PASSWORD=change_me
EOF
```

## 3. DNS Configuration

Go to your domain registrar and add:
- **A Record**: `@` → `YOUR_SERVER_IP`
- **A Record**: `www` → `YOUR_SERVER_IP`

Verify:
```bash
dig wecandigitalsolutions.ma
```

## 4. Get SSL Certificate

```bash
sudo certbot --nginx -d wecandigitalsolutions.ma -d www.wecandigitalsolutions.ma --email your@email.com --agree-tos --redirect
```

## 5. Deploy

```bash
cd /opt/anapec-platform
docker compose up -d --build

# Check status
docker compose ps

# View logs
docker compose logs -f
```

## 6. Verify

```bash
# Check containers
curl https://wecandigitalsolutions.ma/health

# Check API
curl https://wecandigitalsolutions.ma/api/v1/languages
```

## Maintenance

```bash
# Restart
docker compose restart

# Update
git pull
docker compose build
docker compose up -d

# Backup database
docker exec anapec_postgres pg_dump -U anapec_user anapec_db > backup.sql
```

## Troubleshooting

```bash
# Check logs
docker compose logs backend
docker compose logs frontend

# Restart specific service
docker compose restart backend

# Check ports
sudo netstat -tlnp | grep -E '80|443|3000|3001'
```