# Infrastructure

This directory contains infrastructure configuration files for deploying the Vibe Engineering Platform.

## Contents

### Docker Configuration

- `docker-compose.yml` - Docker Compose configuration for all services
- `Dockerfile` files (in backend/ and frontend/) - Container builds

### Server Configuration

- `nginx.conf` - Nginx reverse proxy configuration
- `minio-setup.sh` - MinIO bucket initialization script
- `.env.example` - Environment variables template

## Quick Start

### Development Environment

1. Copy the environment template:
   ```bash
   cp infrastructure/.env.example .env
   ```

2. Update `.env` with your configuration

3. Start all services:
   ```bash
   docker-compose up -d
   ```

4. Access the application:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001
   - API Health: http://localhost:3001/health
   - MinIO Console: http://localhost:9001

### Production Environment

1. Configure SSL certificates in `infrastructure/ssl/`

2. Uncomment the HTTPS server block in `nginx.conf`

3. Update `docker-compose.yml` profiles:
   ```yaml
   nginx:
     profiles:
       - production
   ```

4. Start with production profile:
   ```bash
   docker-compose --profile production up -d
   ```

## Services

| Service | Port | Description |
|---------|------|-------------|
| PostgreSQL | 5432 | Primary database |
| Redis | 6379 | Caching and sessions |
| MinIO | 9000 (API), 9001 (Console) | S3-compatible storage |
| Backend | 3001 | API server |
| Frontend | 3000 | Next.js application |
| Nginx | 80, 443 | Reverse proxy (production) |

## MinIO Setup

After starting MinIO, initialize the storage bucket:

```bash
chmod +x infrastructure/minio-setup.sh
./infrastructure/minio-setup.sh
```

## Environment Variables

### Required

- `POSTGRES_PASSWORD` - Database password (strong password in production)
- `JWT_SECRET` - Secret key for JWT tokens (use strong random string)
- `MINIO_ROOT_PASSWORD` - MinIO admin password

### Optional

- `OPENAI_API_KEY` - For AI-powered features
- `ANTHROPIC_API_KEY` - For Claude AI features
- `SMTP_*` - Email configuration

## Security Considerations

1. **Never commit `.env` to version control**
2. **Use strong, unique passwords for each environment**
3. **Configure SSL/TLS for production**
4. **Restrict database access to internal network**
5. **Enable firewall rules for production ports**
6. **Regularly rotate API keys and secrets**

## Monitoring

### Health Checks

All services include health check endpoints:

- PostgreSQL: `pg_isready`
- Redis: `redis-cli ping`
- Backend: `http://localhost:3001/health`
- Nginx: `http://localhost/health`

### Logs

Container logs can be viewed with:

```bash
docker-compose logs -f [service_name]
```

## Scaling

For horizontal scaling:

1. Use a managed PostgreSQL service (Cloud SQL, RDS, etc.)
2. Use a managed Redis service (ElastiCache, Memorystore, etc.)
3. Configure load balancing for frontend and backend
4. Use Kubernetes for container orchestration
