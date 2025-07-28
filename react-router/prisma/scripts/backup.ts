import { execSync } from 'child_process';
import { writeFileSync, existsSync } from 'fs';
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

async function main() {
  console.log('🗄️ Starting database backup...');

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL environment variable is not set');
    process.exit(1);
  }

  try {
    const config = parseDatabaseUrl(databaseUrl);
    const backupPath = path.join(__dirname, '../backups/data-dump.sql');

    console.log(`📡 Connecting to database: ${config.database} on ${config.host}:${config.port}`);

    // Use pg_dump to create a complete SQL dump
    const pgDumpCommand = [
      'pg_dump',
      `--host=${config.host}`,
      `--port=${config.port}`,
      `--username=${config.username}`,
      `--dbname=${config.database}`,
      '--no-password', // We'll use PGPASSWORD env var
      '--verbose',
      '--no-owner', // Don't include ownership information
      '--no-privileges', // Don't include privilege information
      '--data-only', // Only export data, not schema (since we have migrations)
      '--inserts', // Use INSERT statements instead of COPY
    ].join(' ');

    // Set password as environment variable for pg_dump
    const env = {
      ...process.env,
      PGPASSWORD: config.password
    };

    console.log('🔄 Running pg_dump...');

    // Check if we're running locally (need to use Docker) or in container (use pg_dump directly)
    const isLocal = !existsSync('/.dockerenv') && !process.env.DOKPLOY_PROJECT_NAME;

    let sqlData: string;

    if (isLocal) {
      // Local development: use Docker to run pg_dump
      console.log('🐳 Using Docker container for pg_dump...');
      const dockerCommand = [
        'docker',
        'exec',
        'base-stack-db', // container name from docker-compose.yml
        'pg_dump',
        `--username=${config.username}`,
        `--dbname=${config.database}`,
        '--no-password',
        '--no-owner',
        '--no-privileges',
        '--data-only',
        '--inserts'
      ].join(' ');

      sqlData = execSync(dockerCommand, {
        env: { ...process.env, PGPASSWORD: config.password },
        encoding: 'utf8',
        maxBuffer: 1024 * 1024 * 10 // 10MB buffer
      });
    } else {
      // Container environment: use pg_dump directly
      sqlData = execSync(pgDumpCommand, {
        env,
        encoding: 'utf8',
        maxBuffer: 1024 * 1024 * 10 // 10MB buffer
      });
    }

    // Write the SQL dump to file
    writeFileSync(backupPath, sqlData);

    console.log(`✅ Database backup completed successfully!`);
    console.log(`📁 Backup saved to: ${backupPath}`);
    console.log(`📊 Backup size: ${Math.round(sqlData.length / 1024)} KB`);

  } catch (error) {
    console.error('❌ Backup failed:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
    }
    process.exit(1);
  }
}

main().catch(console.error);
