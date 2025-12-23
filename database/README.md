# Database

This directory contains database-related files for the Vibe Engineering Platform.

## Contents

### Schema Files

- `schema.sql` - PostgreSQL database schema with all tables, indexes, and triggers
- `seed.sql` - Sample data for development and testing
- `backup.sh` - Automated backup script

## Usage

### Running the Schema

The schema is automatically applied when starting the Docker containers:

```bash
docker-compose up -d postgres
```

### Manual Schema Updates

To apply schema changes manually:

```bash
psql -h localhost -U vibe_user -d vibe_db -f schema.sql
```

### Seeding Data

To seed the database with sample data:

```bash
psql -h localhost -U vibe_user -d vibe_db -f seed.sql
```

### Creating Backups

Create a backup of the database:

```bash
./backup.sh development
```

Backup files are stored in the `backups/` directory.

### Restoring from Backup

To restore a backup:

```bash
gunzip -c backups/development_vibe_db_20231215_120000.sql.gz | psql -h localhost -U vibe_user -d vibe_db
```

## Database Structure

The platform uses PostgreSQL with the following main tables:

- `users` - User accounts and authentication
- `projects` - Project metadata and configuration
- `project_members` - Project team membership
- `files` - File system information
- `deployments` - Deployment records
- `api_keys` - API key management
- `sessions` - User sessions
- `notifications` - User notifications
- `audit_logs` - Audit trail

## Performance Optimization

The schema includes appropriate indexes for common query patterns. For large datasets, consider:

- Partitioning the `files` table by `project_id`
- Using table partitioning for `audit_logs`
- Implementing read replicas for query-heavy workloads
