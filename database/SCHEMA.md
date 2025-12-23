# Vibe Engineering Platform - Database Schema Documentation

## Overview

This document provides a comprehensive overview of the Vibe Engineering Platform database schema. The database is built on PostgreSQL 15+ and uses modern features like JSONB, UUIDs, and advanced indexing for optimal performance.

---

## Table of Contents

1. [Core Tables](#core-tables)
2. [AI & Analytics Tables](#ai--analytics-tables)
3. [Infrastructure Tables](#infrastructure-tables)
4. [Enumerations](#enumerations)
5. [Indexes](#indexes)
6. [Triggers & Functions](#triggers--functions)
7. [Views & Materialized Views](#views--materialized-views)
8. [Entity Relationship Diagram](#entity-relationship-diagram)
9. [Schema Conventions](#schema-conventions)

---

## Core Tables

### users

**Purpose:** Stores all user account information including authentication details and profile data.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique user identifier |
| email | VARCHAR(255) | UNIQUE, NOT NULL | User email address (used for login) |
| password_hash | VARCHAR(255) | NOT NULL | BCrypt hashed password |
| name | VARCHAR(255) | NOT NULL | Display name |
| avatar_url | VARCHAR(500) | NULL | URL to user avatar image |
| role | user_role | DEFAULT 'developer' | User role (admin, developer, viewer) |
| subscription_tier | VARCHAR(50) | DEFAULT 'free' | Subscription level (free, pro, enterprise) |
| email_verified | BOOLEAN | DEFAULT FALSE | Whether email is verified |
| two_factor_enabled | BOOLEAN | DEFAULT FALSE | Whether 2FA is enabled |
| two_factor_secret | VARCHAR(255) | NULL | Encrypted TOTP secret |
| last_login_at | TIMESTAMP WITH TIME ZONE | NULL | Timestamp of last login |
| created_at | TIMESTAMP WITH TIME ZONE | DEFAULT NOW() | Record creation timestamp |
| updated_at | TIMESTAMP WITH TIME ZONE | DEFAULT NOW() | Record last update timestamp |

**Indexes:**
- `idx_users_email` - Fast email lookups for authentication
- `idx_users_role` - Filter users by role

**Relationships:**
- One-to-many: `projects` (as owner)
- One-to-many: `project_members`
- One-to-many: `api_keys`
- One-to-many: `sessions`
- One-to-many: `notifications`

---

### projects

**Purpose:** Stores project metadata, configuration, and quality metrics.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique project identifier |
| name | VARCHAR(255) | NOT NULL | Project name |
| description | TEXT | NULL | Project description |
| owner_id | UUID | REFERENCES users(id) ON DELETE CASCADE | Project owner |
| visibility | visibility | DEFAULT 'private' | Visibility level |
| status | project_status | DEFAULT 'planning' | Current project status |
| tech_stack | JSONB | DEFAULT '{}' | Technology stack configuration |
| architecture | JSONB | DEFAULT '{}' | Architecture diagram/data |
| repository_url | VARCHAR(500) | NULL | Git repository URL |
| deployed_url | VARCHAR(500) | NULL | Production deployment URL |
| current_version | VARCHAR(100) | NULL | Current version string |
| quality_score | DECIMAL(5,2) | NULL | Calculated quality score (0-100) |
| file_count | INTEGER | DEFAULT 0 | Number of files in project |
| total_lines | INTEGER | DEFAULT 0 | Total lines of code |

**Indexes:**
- `idx_projects_owner` - Find projects by owner
- `idx_projects_status` - Filter by status
- `idx_projects_visibility` - Filter by visibility
- `idx_projects_created` - Sort by creation date

**Example tech_stack JSON:**
```json
{
  "frontend": ["React", "Next.js", "TypeScript"],
  "backend": ["Node.js", "Express", "PostgreSQL"],
  "ai": ["OpenAI", "TensorFlow"],
  "infrastructure": ["Docker", "AWS", "Terraform"]
}
```

---

### project_members

**Purpose:** Manages many-to-many relationship between users and projects with roles.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique identifier |
| project_id | UUID | REFERENCES projects(id) ON DELETE CASCADE | Project reference |
| user_id | UUID | REFERENCES users(id) ON DELETE CASCADE | User reference |
| role | user_role | DEFAULT 'developer' | User's role in project |
| joined_at | TIMESTAMP WITH TIME ZONE | DEFAULT NOW() | When user joined project |

**Constraints:**
- Unique: `(project_id, user_id)` - Prevents duplicate memberships

---

### files

**Purpose:** Stores file system information including content, metadata, and language detection.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique identifier |
| project_id | UUID | REFERENCES projects(id) ON DELETE CASCADE | Parent project |
| parent_id | UUID | REFERENCES files(id) ON DELETE CASCADE | Parent folder |
| name | VARCHAR(255) | NOT NULL | File/folder name |
| path | VARCHAR(1000) | NOT NULL, UNIQUE (with project_id) | Full path from root |
| type | VARCHAR(50) | NOT NULL | 'file' or 'folder' |
| content | TEXT | NULL | File content (for text files) |
| language | VARCHAR(50) | NULL | Detected programming language |
| size_bytes | INTEGER | DEFAULT 0 | File size in bytes |
| metadata | JSONB | DEFAULT '{}' | Additional metadata |

**Indexes:**
- `idx_files_project` - Find all files in project
- `idx_files_path` - Lookup by path
- `idx_files_type` - Filter by type
- `idx_files_language` - Group by language

---

### deployments

**Purpose:** Records all deployment information including status, metrics, and logs.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique identifier |
| project_id | UUID | REFERENCES projects(id) ON DELETE CASCADE | Project reference |
| environment | VARCHAR(50) | NOT NULL | Deployment environment |
| status | deployment_status | DEFAULT 'pending' | Current status |
| version | VARCHAR(100) | NULL | Deployed version |
| container_id | VARCHAR(255) | NULL | Container/Docker ID |
| container_port | INTEGER | NULL | Exposed port |
| deployment_url | VARCHAR(500) | NULL | Public URL |
| config | JSONB | DEFAULT '{}' | Environment config |
| logs | TEXT[] | NULL | Deployment logs |
| metrics | JSONB | DEFAULT '{}' | Performance metrics |
| started_at | TIMESTAMP WITH TIME ZONE | NULL | Deployment start time |
| completed_at | TIMESTAMP WITH TIME ZONE | NULL | Deployment end time |

**Indexes:**
- `idx_deployments_project` - Find deployments by project
- `idx_deployments_status` - Filter by status
- `idx_deployments_environment` - Filter by environment

---

## AI & Analytics Tables

### code_reviews

**Purpose:** Stores AI-generated code review results for files.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique identifier |
| project_id | UUID | REFERENCES projects(id) | Project reference |
| file_path | VARCHAR(1000) | NOT NULL | Path to reviewed file |
| language | VARCHAR(50) | NULL | Programming language |
| score | INTEGER | NOT NULL | Quality score (0-100) |
| issues | JSONB | DEFAULT '[]' | Array of review issues |
| summary | TEXT | NULL | Review summary |
| highlights | JSONB | DEFAULT '[]' | Positive highlights |

**Example issues JSON:**
```json
[
  {
    "line": 15,
    "column": 10,
    "severity": "warning",
    "category": "performance",
    "message": "Inefficient loop detected",
    "suggestion": "Consider using map() instead of for loop"
  }
]
```

### test_results

**Purpose:** Stores AI-generated test results including unit, integration, and E2E tests.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Unique identifier |
| project_id | UUID | REFERENCES projects(id) |
| file_path | VARCHAR(1000) | Path to source file |
| test_type | VARCHAR(50) | 'unit', 'integration', or 'e2e' |
| framework | VARCHAR(50) | Test framework used |
| test_code | TEXT | Generated test code |
| edge_cases | JSONB | Detected edge cases |
| coverage_goal | INTEGER | Target coverage percentage |

### cicd_pipelines & cicd_executions

**Purpose:** Stores generated CI/CD pipeline configurations and execution history.

| Table | Description |
|-------|-------------|
| cicd_pipelines | Stores pipeline configurations (YAML/JSON) |
| cicd_executions | Records execution history, status, and logs |

---

## Infrastructure Tables

### api_keys

**Purpose:** Manages API keys for programmatic access.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Unique identifier |
| user_id | UUID | Owner user |
| name | VARCHAR(255) | Key name |
| key_hash | VARCHAR(255) | Hashed key value |
| key_prefix | VARCHAR(20) | First 20 chars (for identification) |
| permissions | JSONB | Array of permissions |
| expires_at | TIMESTAMP | Optional expiration |
| last_used_at | TIMESTAMP | Last usage time |

### sessions

**Purpose:** Manages user authentication sessions.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Unique identifier |
| user_id | UUID | User reference |
| token | VARCHAR(500) | Session token |
| device_info | JSONB | Browser/device info |
| ip_address | VARCHAR(50) | Client IP |
| expires_at | TIMESTAMP | Session expiration |

### notifications

**Purpose:** Stores user notifications.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Unique identifier |
| user_id | UUID | Recipient |
| type | VARCHAR(100) | Notification type |
| title | VARCHAR(255) | Notification title |
| message | TEXT | Notification message |
| data | JSONB | Additional data |
| read_at | TIMESTAMP | When read |

### audit_logs

**Purpose:** Tracks all significant actions for compliance and security.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Unique identifier |
| user_id | UUID | Actor (nullable) |
| action | VARCHAR(100) | Action performed |
| resource_type | VARCHAR(100) | Resource type |
| resource_id | UUID | Resource identifier |
| details | JSONB | Action details |
| ip_address | VARCHAR(50) | Client IP |

---

## Enumerations

### project_status
- `planning` - Project is being planned
- `in_progress` - Actively being developed
- `review` - Under review
- `deployed` - Deployed to production
- `archived` - Archived/historical

### user_role
- `admin` - Full system access
- `developer` - Standard developer access
- `viewer` - Read-only access

### visibility
- `private` - Only team members
- `team` - All team members
- `public` - Anyone can view

### deployment_status
- `pending` - Queued for deployment
- `building` - Currently building
- `running` - Successfully running
- `failed` - Deployment failed
- `stopped` - Manually stopped
- `rolled_back` - Rolled back to previous version

---

## Indexes

### Automatic Indexes (via triggers)
- All primary keys are automatically indexed
- All foreign keys have indexes
- `updated_at` columns have indexes for sorting

### Custom Indexes
See individual table sections for specific indexes.

---

## Triggers & Functions

### update_updated_at_column()

**Purpose:** Automatically updates the `updated_at` timestamp when a row is modified.

**Tables with this trigger:**
- users
- projects
- files
- deployments
- api_keys

### log_audit_event()

**Purpose:** Generic function to log audit events.

```sql
SELECT log_audit_event(
    'user-id-here',
    'CREATE',
    'projects',
    'project-id-here',
    '{"action": "Project created"}'::jsonb,
    '192.168.1.1'
);
```

### archive_old_records()

**Purpose:** Archives old deployment records to improve performance.

```sql
SELECT archive_old_records(90); -- Archive records older than 90 days
```

### calculate_project_quality()

**Purpose:** Calculates and updates the project quality score.

```sql
SELECT calculate_project_quality('project-id-here');
```

---

## Views & Materialized Views

### v_recent_activity

Provides recent activity for dashboard feeds.

### v_project_file_stats

File statistics per project including counts and sizes.

### v_deployment_success_rate

Deployment success rates and metrics per project.

### mv_daily_project_stats

Aggregated daily statistics for analytics (refreshed hourly).

### mv_user_activity

User activity summary for leaderboards.

### mv_system_health

System-wide health metrics.

---

## Entity Relationship Diagram

```
┌─────────────┐       ┌──────────────────┐       ┌─────────────┐
│    users    │───────│  project_members │───────│   projects  │
└─────────────┘       └──────────────────┘       └─────────────┘
      │                                               │
      │                                               │
      ├───────────────┬───────────────────────────────┤
      │               │                               │
      ▼               ▼                               ▼
┌──────────┐   ┌─────────────┐               ┌──────────────┐
│ sessions │   │  api_keys   │               │    files     │
└──────────┘   └─────────────┘               └──────────────┘
                                                           │
                                                           ▼
                                                  ┌──────────────┐
                                                  │  deployments │
                                                  └──────────────┘
```

---

## Schema Conventions

### Naming Conventions
- **Tables:** Snake_case, plural (e.g., `user_accounts`)
- **Columns:** Snake_case, descriptive
- **Primary Keys:** `id` (UUID)
- **Foreign Keys:** `table_id` (e.g., `user_id`)
- **Timestamps:** `*_at` suffix (e.g., `created_at`)
- **Booleans:** `*_enabled` or `*_verified` suffix

### Data Types
- **Primary Keys:** UUID
- **Text:** VARCHAR (with limits) or TEXT
- **JSON Data:** JSONB for querying
- **Timestamps:** TIMESTAMP WITH TIME ZONE

### Constraints
- All tables have `created_at` and `updated_at`
- Soft delete via `status` field where appropriate
- Foreign keys with CASCADE delete
- Unique constraints where needed

---

## Migrations

| Version | Description |
|---------|-------------|
| V1 | Initial schema with core tables |
| V2 | AI features, enhanced security |
| V3 | Performance optimizations, materialized views |

---

## Performance Considerations

1. **Indexes:** All frequently queried columns are indexed
2. **JSONB:** Used for flexible schema data with GIN indexes
3. **Materialized Views:** For expensive aggregations
4. **Archival:** Old records can be archived automatically

---

## Security

1. **Password Hashing:** BCrypt with cost factor 10
2. **API Keys:** Hashed before storage
3. **Audit Logging:** All significant actions logged
4. **Session Management:** Secure token-based sessions
5. **2FA Support:** TOTP-based two-factor authentication
