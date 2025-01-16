# Database Configuration Guide

## Overview

This project uses PostgreSQL with Drizzle ORM for database operations. By default, it's configured to use Supabase (cloud PostgreSQL), but it can also work with any PostgreSQL-compatible database service (Neon, local PostgreSQL, etc.).

## Default Setup (Supabase)

1. Create a Supabase project and get your database connection string
2. Update your environment file with the Supabase connection details:

```env
DATABASE_URL=postgres://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
DATABASE_SCHEMA=reverse_image_dataset_generator_prod
DATABASE_SSL=true
```

## Alternative: Local PostgreSQL Setup

The Docker Compose files include a commented-out PostgreSQL service configuration. To use a local database instead of Supabase:

1. Uncomment the `db` service and `volumes` sections in your Docker Compose file:

   ```yaml
   services:
     # ... app service configuration ...

     db:
       container_name: reverse-image-dataset-generator-dev-db
       image: postgres:16-alpine
       ports:
         - "${DB_PORT:-5432}:5432"
       # ... rest of db configuration ...

   volumes:
     pgdata_dev:
   ```

2. Update your environment file to use local PostgreSQL:

   ```env
   DATABASE_URL=postgres://postgres:postgres@db:5432/postgres
   DATABASE_SCHEMA=reverse_image_dataset_generator_dev
   DATABASE_SSL=false
   ```

3. Add the database dependency to the app service:

   ```yaml
   services:
     app:
       # ... other app configuration ...
       depends_on:
         db:
           condition: service_healthy
   ```

## Port Configuration

The application uses configurable ports for its services:

```env
# Server ports
PORT=5050            # Main application port
VITE_PORT=5173      # Vite dev server (development only)
```

To resolve port conflicts, adjust these values in your environment files:
- `.env.development` for development
- `.env.production` for production

### Default Ports

| Service | Development | Production | Environment Variable |
|---------|------------|------------|---------------------|
| App Server | 5050 | 5050 | PORT |
| Vite Dev Server | 5173 | N/A | VITE_PORT |

Note: Database port is specified in the `DATABASE_URL` connection string and varies by provider:
- Supabase: typically 5432
- Neon: custom ports
- Local PostgreSQL: typically 5432 (when using the optional local database configuration)

## Configuration

### Environment Variables

```env
DATABASE_URL=postgres://[USER]:[PASSWORD]@[HOST]:[PORT]/[DATABASE]
DATABASE_SCHEMA=reverse_image_dataset_generator_prod
DATABASE_SSL=true  # Required for most cloud providers
```

### Connection Examples

1. **Supabase**

   ```
   DATABASE_URL=postgres://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
   DATABASE_SSL=true
   ```

2. **Neon**

   ```
   DATABASE_URL=postgres://[USER]:[PASSWORD]@[HOST]/[DATABASE]
   DATABASE_SSL=true
   ```

3. **Local PostgreSQL**

   ```
   DATABASE_URL=postgres://postgres:postgres@localhost:5432/postgres
   DATABASE_SSL=false
   ```

## Schema Management

The database uses a dedicated schema `reverse_image_dataset_generator_prod` (configurable via `DATABASE_SCHEMA`) for isolation. This allows:
- Clear separation of project tables
- Easy cleanup/removal of project data
- Multiple projects sharing the same database

### Current Schema

```sql
-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

## Migration Commands

```bash
# Generate migrations
npm run db:generate

# Push schema changes
npm run db:push

# View database in Drizzle Studio
npm run db:studio
```

## Security Considerations

1. **SSL Configuration**
   - SSL is enabled by default for cloud providers
   - `rejectUnauthorized: false` is set to support various cloud providers
   - Can be disabled for local development

2. **Schema Isolation**
   - All tables are created in a dedicated schema
   - Prevents table name conflicts
   - Enables easy cleanup

3. **Environment Variables**
   - Never commit `.env` file
   - Use `.env.example` as a template
   - Different configurations for development/production

## Troubleshooting

1. **Connection Issues**
   - Verify DATABASE_URL format
   - Check if DATABASE_SSL is properly set
   - Ensure database user has proper permissions

2. **Migration Issues**
   - Check if schema exists
   - Verify user has CREATE/ALTER permissions
   - Review migration files in `db/migrations`

## Provider-Specific Notes

### Supabase

- Uses port 5432 by default
- Requires SSL
- Default database name is 'postgres'

### Neon

- Uses custom ports
- Requires SSL
- Supports serverless connections

### Local PostgreSQL

- Default port 5432
- SSL typically disabled
- Requires local PostgreSQL installation

# Docker Environment Setup

## Port Configuration

Both development and production environments support configurable ports through environment variables:

```env
# Server ports
PORT=5050            # Main application port
VITE_PORT=5173      # Vite dev server (development only)
DB_PORT=5432        # PostgreSQL port
```

To resolve port conflicts, adjust these values in your environment files:
- `.env.development` for development
- `.env.production` for production

### Default Ports

| Service | Development | Production | Environment Variable |
|---------|------------|------------|---------------------|
| App Server | 5050 | 5050 | PORT |
| Vite Dev Server | 5173 | N/A | VITE_PORT |
| PostgreSQL | 5432 | 5432 | DB_PORT |

## Development

When using Docker for development:

```
