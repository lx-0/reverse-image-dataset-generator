# Database Configuration Guide

## Overview

This project uses PostgreSQL with Drizzle ORM for database operations. The setup is provider-agnostic and can work with any PostgreSQL-compatible database service (Supabase, Neon, local PostgreSQL, etc.).

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
