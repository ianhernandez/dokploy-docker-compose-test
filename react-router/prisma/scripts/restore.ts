import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

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

function isDatabaseEmpty(config: DatabaseConfig): boolean {
  try {
    const env = {
      ...process.env,
      PGPASSWORD: config.password
    };

    // Check if we're running locally (need to use Docker) or in container (use psql directly)
    const isLocal = !existsSync('/.dockerenv') && !process.env.DOKPLOY_PROJECT_NAME;

    const countQueries = [
      'SELECT COUNT(*) FROM "DJ";',
      'SELECT COUNT(*) FROM "Episode";',
      'SELECT COUNT(*) FROM "DJSet";'
    ];

    let totalRecords = 0;

    for (const query of countQueries) {
      let result: string;

      if (isLocal) {
        // Local development: use Docker to run psql
        result = execSync(`docker exec base-stack-db psql --username=${config.username} --dbname=${config.database} --no-password --tuples-only --command='${query}'`, {
          env: { ...process.env, PGPASSWORD: config.password },
          encoding: 'utf8'
        }).trim();
      } else {
        // Container environment: use psql directly
        result = execSync(`psql --host=${config.host} --port=${config.port} --username=${config.username} --dbname=${config.database} --no-password --tuples-only --command='${query}'`, {
          env,
          encoding: 'utf8'
        }).trim();
      }

      const count = parseInt(result, 10) || 0;
      totalRecords += count;
    }

    return totalRecords === 0;
  } catch (error) {
    console.warn('⚠️ Could not check database state, assuming empty:', error);
    return true;
  }
}

async function clearDatabase(config: DatabaseConfig, isLocal: boolean) {
  console.log('🧹 Clearing database to ensure clean restore...');

  const clearQueries = [
    'TRUNCATE TABLE "DJSet" RESTART IDENTITY CASCADE;',
    'TRUNCATE TABLE "DJ" RESTART IDENTITY CASCADE;',
    'TRUNCATE TABLE "Episode" RESTART IDENTITY CASCADE;',
    'TRUNCATE TABLE "Genre" RESTART IDENTITY CASCADE;',
    'TRUNCATE TABLE "User" RESTART IDENTITY CASCADE;',
    'TRUNCATE TABLE "Password" RESTART IDENTITY CASCADE;'
  ];

  const env = {
    ...process.env,
    PGPASSWORD: config.password
  };

  for (const query of clearQueries) {
    try {
      if (isLocal) {
        execSync(`docker exec base-stack-db psql --username=${config.username} --dbname=${config.database} --no-password --command='${query}'`, {
          env: { ...process.env, PGPASSWORD: config.password },
          stdio: 'pipe'
        });
      } else {
        execSync(`psql --host=${config.host} --port=${config.port} --username=${config.username} --dbname=${config.database} --no-password --command='${query}'`, {
          env,
          stdio: 'pipe'
        });
      }
    } catch (error) {
      // Some tables might not exist yet, which is fine
      console.log(`⚠️ Note: Could not clear table (may not exist): ${query.split(' ')[2]}`);
    }
  }

  console.log('✅ Database cleared successfully');
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
    const config = parseDatabaseUrl(databaseUrl);
    console.log(`📡 Connecting to database: ${config.database} on ${config.host}:${config.port}`);

    // Environment detection
    const isLocal = !existsSync('/.dockerenv') && !process.env.DOKPLOY_PROJECT_NAME;
    const isContainer = process.env.NODE_ENV === 'production' ||
      existsSync('/.dockerenv') ||
      process.env.DOKPLOY_PROJECT_NAME;

    console.log(`🔧 Environment: ${isLocal ? 'Local Development' : 'Container Deployment'}`);

    if (isLocal) {
      console.log('🏠 Local development environment detected.');
      console.log('✅ Skipping restore to preserve existing local data');
      console.log('💡 Your local data takes precedence in development mode');
      return;
    }

    if (isContainer) {
      console.log('🚀 Container deployment detected');
      console.log('📦 Local data dump will take complete precedence');

      // Always clear database in container deployments to avoid conflicts
      await clearDatabase(config, isLocal);
    }

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

      // Verify restore by checking record counts using raw SQL
      const countQueries = [
        { name: 'DJs', query: 'SELECT COUNT(*) FROM "DJ";' },
        { name: 'Episodes', query: 'SELECT COUNT(*) FROM "Episode";' },
        { name: 'DJ Sets', query: 'SELECT COUNT(*) FROM "DJSet";' }
      ];

      console.log('📊 Restored data summary:');

      for (const { name, query } of countQueries) {
        try {
          let result: string;

          if (isLocal) {
            result = execSync(`docker exec base-stack-db psql --username=${config.username} --dbname=${config.database} --no-password --tuples-only --command='${query}'`, {
              env: { ...process.env, PGPASSWORD: config.password },
              encoding: 'utf8'
            }).trim();
          } else {
            result = execSync(`psql --host=${config.host} --port=${config.port} --username=${config.username} --dbname=${config.database} --no-password --tuples-only --command='${query}'`, {
              env,
              encoding: 'utf8'
            }).trim();
          }

          const count = parseInt(result, 10) || 0;
          console.log(`   ${name}: ${count}`);
        } catch (verifyError) {
          console.warn(`⚠️ Could not verify ${name} count:`, verifyError);
        }
      }

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
  }
}

main().catch(console.error);
