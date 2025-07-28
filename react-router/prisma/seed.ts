import { db } from '../app/db/db.server';
import episodes from './backup/episodes.json';
import djsets from './backup/djsets.json';
import djs from './backup/djs.json';

async function main() {
  console.log('🌱 Starting seed...');

  // Seed DJs
  console.log('Seeding DJs...');
  for (const dj of djs) {
    await db.dJ.upsert({
      where: { id: dj.id },
      update: {},
      create: {
        id: dj.id,
        name: dj.name,
        createdAt: new Date(dj.createdAt),
        updatedAt: new Date(dj.updatedAt),
      },
    });
  }

  // Seed Episodes
  console.log('Seeding Episodes...');
  for (const episode of episodes) {
    // Extract episode number from title (e.g., "VIBEFLOW LIVE STREAM 001" -> 1)
    const episodeNumberMatch = episode.title.match(/(\d+)$/);
    const episodeNumber = episodeNumberMatch ? parseInt(episodeNumberMatch[1], 10) : 0;

    await db.episode.upsert({
      where: { id: episode.id },
      update: {},
      create: {
        id: episode.id,
        title: episode.title,
        episodeNumber: episodeNumber,
        releaseDate: new Date(episode.releaseDate),
        createdAt: new Date(episode.createdAt),
        updatedAt: new Date(episode.updatedAt),
      },
    });
  }

  // Seed DJ Sets
  console.log('Seeding DJ Sets...');
  for (const set of djsets) {
    await db.dJSet.upsert({
      where: { id: set.id },
      update: {},
      create: {
        id: set.id,
        title: set.title ?? null,
        duration: set.duration ?? null,
        vimeo: set.vimeo ?? null,
        soundcloud: set.soundcloud ?? null,
        mixcloud: set.mixcloud ?? null,
        mediaUrl: set.mediaUrl ?? null,
        orderInEpisode: set.orderInEpisode ?? null,
        createdAt: new Date(set.createdAt),
        updatedAt: new Date(set.updatedAt),
        episodeId: set.episodeId,
        djId: set.djId,
      },
    });
  }

  console.log('✅ Seed completed.');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
