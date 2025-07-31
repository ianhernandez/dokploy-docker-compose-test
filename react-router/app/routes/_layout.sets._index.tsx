import type { Route } from "./+types/_layout.sets._index"
import { db } from "../db/db.server"
import { Link } from "react-router"

export async function loader({ request }: Route.LoaderArgs) {
  
  // Fetch sets from the database ordered by latest episodes first
  const sets = await db.dJSet.findMany({
    include: {
      dj: {
        select: {
          name: true
        }
      },
      episode: {
        select: {
          episodeNumber: true,
          releaseDate: true
        }
      }
    },
    orderBy: [
      {
        episode: {
          episodeNumber: 'desc'
        }
      },
      {
        orderInEpisode: 'asc'
      }
    ]
  })

  return { sets }
}

export default function Sets({ loaderData }: Route.ComponentProps) {
  const { sets } = loaderData

  return (
    <div className="flex w-full flex-col items-center justify-center">
      <ul className="grid grid-cols-1 lg:grid-cols-3 gap-8 w-full">
        {sets.map((set) => (
          <li key={set.id} className="mb-2">
            <Link to={`/sets/${set.id}`} className="block">
              {set.thumbnailUrl ? (
                <img src={set.thumbnailUrl} alt={`${set.dj.name} thumbnail`} className="w-full h-auto rounded-2xl" />
              ) : null }
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
