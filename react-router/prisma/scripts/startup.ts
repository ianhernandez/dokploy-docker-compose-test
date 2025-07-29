import { execSync } from 'child_process';
import { existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runPrismaGenerate() {
  console.log('🔧 Generating Prisma client...');
  try {
    execSync('npx prisma generate', {
      stdio: 'inherit',
      cwd: process.cwd()
    });
    console.log('✅ Prisma client generated');
  } catch (error) {
    console.error('❌ Failed to generate Prisma client:', error);
    throw error;
  }
}

async function runMigrations() {
  console.log('🚀 Running database migrations...');
  try {
    execSync('npx prisma migrate deploy', {
      stdio: 'inherit',
      cwd: process.cwd()
    });
    console.log('✅ Database migrations completed');
  } catch (error) {
    console.error('❌ Failed to run migrations:', error);
    throw error;
  }
}

async function runDataRestore() {
  console.log('🔄 Checking for data restore...');

  const restoreScriptPath = path.join(__dirname, 'restore.ts');

  if (!existsSync(restoreScriptPath)) {
    console.log('⚠️ Restore script not found, skipping data restore');
    return;
  }

  // Environment detection
  const isLocal = !existsSync('/.dockerenv') && !process.env.DOKPLOY_PROJECT_NAME;
  const isContainer = process.env.NODE_ENV === 'production' ||
    existsSync('/.dockerenv') ||
    process.env.DOKPLOY_PROJECT_NAME;

  console.log(`🔧 Environment: ${isLocal ? 'Local Development' : 'Container Deployment'}`);

  if (isLocal) {
    console.log('🏠 Local development detected - restore script will preserve your existing data');
  } else if (isContainer) {
    console.log('📦 Container deployment detected - local data dump will take precedence');
  }

  try {
    execSync('npx tsx prisma/scripts/restore.ts', {
      stdio: 'inherit',
      cwd: process.cwd()
    });
  } catch (error) {
    console.error('❌ Data restore failed:', error);
    // Don't throw here - we want the app to start even if restore fails
    console.log('⚠️ Continuing startup despite restore failure...');
  }
}

async function main() {
  console.log('🚀 Starting database initialization...');

  try {
    // Step 1: Generate Prisma client
    await runPrismaGenerate();

    // Step 2: Run migrations to ensure schema is up to date
    await runMigrations();

    // Step 3: Restore data if needed (in container environments)
    await runDataRestore();

    console.log('✅ Database initialization completed successfully!');

  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  }
}

// Run the main function when script is executed directly
main().catch(console.error);

export { main as initializeDatabase };
