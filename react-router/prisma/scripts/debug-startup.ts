import { execSync } from 'child_process';

console.log('🔍 DEBUG: Container startup debugging...');
console.log('🔍 NODE_ENV:', process.env.NODE_ENV);
console.log('🔍 DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : 'NOT SET');
console.log('🔍 Current working directory:', process.cwd());

try {
  console.log('🔍 Listing prisma directory:');
  execSync('ls -la prisma/', { stdio: 'inherit' });
} catch (error) {
  console.error('❌ Failed to list prisma directory:', error);
}

try {
  console.log('🔍 Checking if data-dump.sql exists:');
  execSync('ls -la prisma/backups/', { stdio: 'inherit' });
} catch (error) {
  console.error('❌ Failed to list backups directory:', error);
}

try {
  console.log('🔍 Testing database connection:');
  execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit' });
} catch (error) {
  console.error('❌ Database connection failed:', error);
}

console.log('🔍 Debug completed');
