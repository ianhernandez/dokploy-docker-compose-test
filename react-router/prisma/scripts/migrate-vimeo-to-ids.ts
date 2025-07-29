import { execSync } from 'child_process';

async function migrateVimeoUrls() {
  console.log('🔄 Starting Vimeo URL to ID migration...');

  try {
    // First, let's see what we're working with
    console.log('📊 Current vimeo data:');
    const currentData = execSync(
      `docker exec base-stack-db psql -U prisma -d local_db -c "SELECT COUNT(*) as total_vimeo_records FROM \\"DJSet\\" WHERE vimeo IS NOT NULL;"`,
      { encoding: 'utf-8' }
    );
    console.log(currentData);

    // Show a few examples before migration
    console.log('📝 Sample URLs before migration:');
    const samplesBefore = execSync(
      `docker exec base-stack-db psql -U prisma -d local_db -c "SELECT id, vimeo FROM \\"DJSet\\" WHERE vimeo IS NOT NULL LIMIT 3;"`,
      { encoding: 'utf-8' }
    );
    console.log(samplesBefore);

    // Execute the migration using PostgreSQL regex to extract video ID
    console.log('⚡ Executing migration...');
    const migrationResult = execSync(`docker exec base-stack-db psql -U prisma -d local_db -c "
      UPDATE \\"DJSet\\" 
      SET vimeo = SUBSTRING(vimeo FROM 'vimeo\\.com/(\\d+)')
      WHERE vimeo IS NOT NULL 
      AND vimeo LIKE '%vimeo.com%';
    "`, { encoding: 'utf-8' });

    console.log('✅ Migration executed:');
    console.log(migrationResult);

    // Verify the results
    console.log('🔍 Sample results after migration:');
    const samplesAfter = execSync(
      `docker exec base-stack-db psql -U prisma -d local_db -c "SELECT id, vimeo FROM \\"DJSet\\" WHERE vimeo IS NOT NULL LIMIT 3;"`,
      { encoding: 'utf-8' }
    );
    console.log(samplesAfter);

    // Final count verification
    console.log('📈 Final verification:');
    const finalCount = execSync(
      `docker exec base-stack-db psql -U prisma -d local_db -c "SELECT COUNT(*) as migrated_records FROM \\"DJSet\\" WHERE vimeo IS NOT NULL AND vimeo NOT LIKE '%http%';"`,
      { encoding: 'utf-8' }
    );
    console.log(finalCount);

    console.log('🎉 Migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrateVimeoUrls();
