import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { db } from '../../app/db/db.server';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface DatabaseConfig {
  host: string;
  port: string;
  database: string;
  username: string;
  password: string;
}

function parseDatabaseUrl(url: string): DatabaseConfig {
  const parsedUrl = new URL(url);
  return {
    host: parsedUrl.hostname,
    port: parsedUrl.port || '5432',
    database: parsedUrl.pathname.slice(1), // Remove leading slash
    username: parsedUrl.username,
    password: parsedUrl.password || '',
  };
}

async function isDatabaseEmpty(): Promise<boolean> {
  try {
    // Check if any data exists in main tables
    const [djCount, episodeCount, setCount] = await Promise.all([
      db.dJ.count(),
      db.episode.count(),
      db.dJSet.count(),
    ]);

    return djCount === 0 && episodeCount === 0 && setCount === 0;
  } catch (error) {
    console.warn('⚠️ Could not check database state, assuming empty:', error);
    return true;
  }
}

async function main() {
  console.log('🔄 Starting database restore...');

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL environment variable is not set');
    process.exit(1);
  }

  const backupPath = path.join(__dirname, '../backups/data-dump.sql');

  // Check if backup file exists
  if (!existsSync(backupPath)) {
    console.error(`❌ Backup file not found: ${backupPath}`);
    console.log('💡 Run the backup script first to create a data dump');
    process.exit(1);
  }

  try {
    // Check if database is empty
    const isEmpty = await isDatabaseEmpty();

    if (!isEmpty) {
      console.log('🔍 Database contains data. Checking deployment context...');

      // Simple heuristic: if we're in a container environment, it's likely a deployment
      const isContainer = process.env.NODE_ENV === 'production' ||
        existsSync('/.dockerenv') ||
        process.env.DOKPLOY_PROJECT_NAME;

      if (isContainer) {
        console.log('🚀 Container deployment detected, proceeding with restore...');
      } else {
        console.log('⚠️ Local development with existing data detected.');
        console.log('💡 If you want to restore anyway, clear your database first with: pnpm run db:reset');
        console.log('✅ Skipping restore to preserve existing data');
        return;
      }
    }

    const config = parseDatabaseUrl(databaseUrl);
    console.log(`📡 Connecting to database: ${config.database} on ${config.host}:${config.port}`);

    // Read the SQL backup file
    const sqlData = readFileSync(backupPath, 'utf8');
    console.log(`📊 Backup file size: ${Math.round(sqlData.length / 1024)} KB`);

    if (sqlData.trim().length === 0) {
      console.log('⚠️ Backup file is empty, nothing to restore');
      return;
    }

    // Set password as environment variable for psql
    const env = {
      ...process.env,
      PGPASSWORD: config.password
    };

    // Create temporary file for the SQL data (psql works better with files)
    const tempSqlPath = path.join(__dirname, '../backups/temp-restore.sql');

    try {
      console.log('🔄 Running restore...');

      // Check if we're running locally (need to use Docker) or in container (use psql directly)
      const isLocal = !existsSync('/.dockerenv') && !process.env.DOKPLOY_PROJECT_NAME;

      if (isLocal) {
        // Local development: use Docker to run psql
        console.log('🐳 Using Docker container for psql...');

        // Copy the backup file into the container and run psql
        execSync(`docker cp ${backupPath} base-stack-db:/tmp/restore.sql`, {
          stdio: 'inherit'
        });

        const dockerCommand = [
          'docker',
          'exec',
          'base-stack-db',
          'psql',
          `--username=${config.username}`,
          `--dbname=${config.database}`,
          '--no-password',
          '--quiet',
          '--file',
          '/tmp/restore.sql'
        ].join(' ');

        execSync(dockerCommand, {
          env: { ...process.env, PGPASSWORD: config.password },
          stdio: 'inherit',
          maxBuffer: 1024 * 1024 * 10 // 10MB buffer
        });

        // Clean up the temporary file
        execSync('docker exec base-stack-db rm /tmp/restore.sql', {
          stdio: 'inherit'
        });

      } else {
        // Container environment: use psql directly
        const psqlCommand = [
          'psql',
          `--host=${config.host}`,
          `--port=${config.port}`,
          `--username=${config.username}`,
          `--dbname=${config.database}`,
          '--no-password',
          '--quiet',
          '--file',
          backupPath
        ].join(' ');

        execSync(psqlCommand, {
          env,
          stdio: 'inherit',
          maxBuffer: 1024 * 1024 * 10 // 10MB buffer
        });
      }

      console.log('✅ Database restore completed successfully!');

      // Verify restore by checking record counts
      const [djCount, episodeCount, setCount] = await Promise.all([
        db.dJ.count(),
        db.episode.count(),
        db.dJSet.count(),
      ]);

      console.log('📊 Restored data summary:');
      console.log(`   DJs: ${djCount}`);
      console.log(`   Episodes: ${episodeCount}`);
      console.log(`   DJ Sets: ${setCount}`);

    } catch (restoreError) {
      console.error('❌ Restore failed:', restoreError);
      throw restoreError;
    }

  } catch (error) {
    console.error('❌ Database restore failed:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
    }
    process.exit(1);
  } finally {
    await db.$disconnect();
  }
}

main().catch(console.error);
