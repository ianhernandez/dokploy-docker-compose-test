# Database Backup & Restore System

This system provides reliable data persistence for your React Router + PostgreSQL + Prisma application when deploying with Dokploy.

## Overview

The system automatically:
- ✅ Backs up your local development data to SQL dumps
- ✅ Restores data during container deployment
- ✅ Preserves data in production after it goes "live"
- ✅ Works seamlessly with Docker and Dokploy

## Commands

### Backup (Local Development)
```bash
# Export current database to SQL dump
pnpm run db:backup
```
Creates: `prisma/backups/data-dump.sql`

### Restore (Testing/Manual)
```bash
# Import SQL dump to current database
pnpm run db:restore
```

### Database Initialization (Container Startup)
```bash
# Run migrations + data restore (used in Dockerfile)
pnpm run db:init
```

## How It Works

### 1. Development Workflow
```bash
# 1. Work on your app locally with real data
pnpm run dev

# 2. Before deploying, backup your current data
pnpm run db:backup

# 3. Commit the backup file to git
git add prisma/backups/data-dump.sql
git commit -m "Update database backup"

# 4. Deploy with Dokploy
# -> Container automatically restores your data!
```

### 2. Smart Restoration Logic

The restore script automatically detects the environment:

**Local Development (with existing data):**
- ⚠️ Skips restore to preserve your work
- 💡 Suggests using `pnpm run db:reset` if you want to restore anyway

**Container Deployment (Dokploy):**
- 🚀 Automatically restores data from backup
- ✅ Perfect for getting your development data into production

**Production (after going live):**
- 🔒 Preserves live user data
- 🔄 Only restores if database is completely empty

### 3. File Structure
```
prisma/
├── backups/
│   ├── data-dump.sql          # Your exportable data
│   └── README.md              # This file
├── scripts/
│   ├── backup.ts              # Export local DB to SQL
│   ├── restore.ts             # Import SQL to current DB
│   └── startup.ts             # Container startup logic
└── schema.prisma              # Your database schema
```

## Environment Detection

The system works differently based on where it's running:

| Environment | Backup Method | Restore Method | Auto-Restore |
|-------------|---------------|----------------|--------------|
| Local Dev   | Docker exec   | Docker exec    | No (preserves existing data) |
| Container   | Direct pg_dump| Direct psql    | Yes (if database empty) |

## Production Lifecycle

### Initial Production Deployment
1. **First deploy:** Container is empty → Restores your dev data ✅
2. **Users start using app:** Data accumulates in production
3. **Subsequent deploys:** Detects existing data → Preserves it ✅

### Managing Production Data

**To update production with new development data:**
1. Clear production database (if safe to do so)
2. Run new deployment → Will restore latest backup

**To backup production data:**
```bash
# SSH into your production server
docker exec your-db-container pg_dump --username=user --dbname=db > production-backup.sql
```

## Troubleshooting

### "pg_dump: command not found" (Local)
- ✅ **Fixed:** System uses Docker automatically for local development

### "Backup file not found"
```bash
# Run backup first
pnpm run db:backup
```

### "Database contains data" (Local restore)
```bash
# Reset database if you want to restore
pnpm run db:reset
# Then restore
pnpm run db:restore
```

### "Container deployment detected but restore failed"
- Check Docker logs for specific error
- Ensure backup file is committed to git
- Verify PostgreSQL container is healthy

## Benefits

✅ **No data loss** during deployments  
✅ **Consistent data** across environments  
✅ **Easy backup** of current state  
✅ **Team collaboration** with shared datasets  
✅ **Production-safe** with smart detection  
✅ **Docker-native** using PostgreSQL tools  

## Advanced Usage

### Custom Backup Location
```bash
# Backup script uses: prisma/backups/data-dump.sql
# To change, modify: prisma/scripts/backup.ts
```

### Manual Container Testing
```bash
# Build and test container locally
docker build -t your-app .
docker run -e DATABASE_URL=your-url your-app

# Check logs to see restore process
docker logs container-id
```

### Selective Table Backup
Modify `backup.ts` to exclude tables:
```typescript
'--exclude-table=table_name',
```

## Security Notes

- 🔒 SQL dumps contain actual data - be careful with sensitive info
- 🔒 Consider `.gitignore` for sensitive backups
- 🔒 Use proper database credentials in production
- 🔒 Backup files are created with restrictive permissions

---

**Remember:** Always test your deployment process in a staging environment first!
