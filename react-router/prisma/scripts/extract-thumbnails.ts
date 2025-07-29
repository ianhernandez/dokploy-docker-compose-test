import { execSync } from 'child_process';
import { existsSync } from 'fs';
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

function decodeHtmlEntities(text: string): string {
  return text.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
}

async function extractVimeoThumbnail(vimeoUrl: string): Promise<string | null> {
  try {
    console.log(`🔍 Fetching: ${vimeoUrl}`);
    const response = await fetch(vimeoUrl);

    if (!response.ok) {
      console.log(`❌ Failed to fetch ${vimeoUrl}: ${response.status}`);
      return null;
    }

    const html = await response.text();

    // Extract og:image content using regex
    const match = html.match(/<meta property="og:image" content="([^"]+)"/);

    if (match && match[1]) {
      // Decode HTML entities like &amp; to &
      const decodedUrl = decodeHtmlEntities(match[1]);
      console.log(`✅ Found thumbnail: ${decodedUrl}`);
      return decodedUrl;
    } else {
      console.log(`❌ No og:image found in ${vimeoUrl}`);
      return null;
    }
  } catch (error) {
    console.log(`❌ Error fetching ${vimeoUrl}:`, error instanceof Error ? error.message : error);
    return null;
  }
}

function executeQuery(query: string, config: DatabaseConfig, isLocal: boolean): string {
  if (isLocal) {
    // Local development: use Docker exec
    return execSync(`docker exec base-stack-db psql --username=${config.username} --dbname=${config.database} --no-password --tuples-only --command='${query}'`, {
      encoding: 'utf8',
      env: { ...process.env, PGPASSWORD: config.password }
    });
  } else {
    // Container environment: use psql directly
    return execSync(`psql --host=${config.host} --port=${config.port} --username=${config.username} --dbname=${config.database} --no-password --tuples-only --command='${query}'`, {
      encoding: 'utf8',
      env: { ...process.env, PGPASSWORD: config.password }
    });
  }
}

async function main() {
  console.log('🎬 Starting Vimeo thumbnail extraction...');

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL environment variable is not set');
    process.exit(1);
  }

  try {
    const config = parseDatabaseUrl(databaseUrl);

    // Environment detection
    const isLocal = !existsSync('/.dockerenv') && !process.env.DOKPLOY_PROJECT_NAME;
    console.log(`🔧 Environment: ${isLocal ? 'Local (Docker)' : 'Container'}`);

    // Get DJSets with Vimeo URLs that are missing thumbnails (or use --force to get all)
    const forceUpdate = process.argv.includes('--force');
    const selectQuery = forceUpdate
      ? 'SELECT id, vimeo, "thumbnailUrl" FROM "DJSet" WHERE vimeo IS NOT NULL ORDER BY id;'
      : 'SELECT id, vimeo, "thumbnailUrl" FROM "DJSet" WHERE vimeo IS NOT NULL AND ("thumbnailUrl" IS NULL OR "thumbnailUrl" = $empty$$empty$) ORDER BY id;';

    const result = executeQuery(selectQuery, config, isLocal);

    // Parse the result
    const lines = result.trim().split('\n').filter(line => line.trim());
    const djSets = lines.map(line => {
      const parts = line.split('|').map(part => part.trim());
      return {
        id: parts[0],
        vimeo: parts[1],
        thumbnailUrl: parts[2] === '' ? null : parts[2]
      };
    });

    if (forceUpdate) {
      console.log(`📊 Found ${djSets.length} DJ Sets with Vimeo URLs (--force mode)`);
    } else {
      console.log(`📊 Found ${djSets.length} DJ Sets missing thumbnails`);
    }

    let processed = 0;
    let successful = 0;
    let failed = 0;
    let skipped = 0;

    for (const djSet of djSets) {
      processed++;
      console.log(`\n⏳ Processing ${processed}/${djSets.length}: ${djSet.vimeo}`);

      // Skip if thumbnail already exists and not using --force (this should rarely happen now with updated query)
      if (djSet.thumbnailUrl && !forceUpdate) {
        console.log(`⏭️ Skipping - thumbnail already exists: ${djSet.thumbnailUrl}`);
        skipped++;
        continue;
      }

      const thumbnailUrl = await extractVimeoThumbnail(djSet.vimeo);

      if (thumbnailUrl) {
        try {
          // Use dollar-quoted strings to avoid escaping issues - separate tags for URL and ID
          const updateQuery = `UPDATE "DJSet" SET "thumbnailUrl" = $url$${thumbnailUrl}$url$, "updatedAt" = NOW() WHERE id = $id$${djSet.id}$id$;`;
          executeQuery(updateQuery, config, isLocal);
          console.log(`💾 Updated database for ${djSet.id}`);
          successful++;
        } catch (error) {
          console.log(`❌ Database update failed for ${djSet.id}:`, error instanceof Error ? error.message : error);
          failed++;
        }
      } else {
        failed++;
      }

      // Small delay to be respectful to Vimeo's servers
      if (processed < djSets.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    console.log('\n📈 Final Results:');
    console.log(`- ✅ ${successful} thumbnails extracted and stored successfully`);
    console.log(`- ❌ ${failed} failed extractions`);
    console.log(`- ⏭️ ${skipped} skipped (already have thumbnails)`);
    console.log(`- 📊 Total processed: ${processed}/${djSets.length}`);

    if (successful > 0) {
      console.log('\n🎉 Thumbnail extraction completed successfully!');
    }

  } catch (error) {
    console.error('❌ Script failed:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
    }
    process.exit(1);
  }
}

main().catch(console.error);
