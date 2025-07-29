import type { Route } from "./+types/sets._index"
import { db } from "../db/db.server"
import { Link } from "react-router"

export async function loader({ request }: Route.LoaderArgs) {
  
  // Fetch sets from the database or any other source
  const sets = await db.dJSet.findMany({
    include: {
      dj: {
        select: {
          name: true
        }
      }
    }
  })

  return { sets }
}

export default function Sets({ loaderData }: Route.ComponentProps) {
  const { sets } = loaderData

  return (
    <div className="flex w-full flex-col items-center justify-center">
      <h1 className="mb-4 text-3xl font-bold">Sets</h1>
      <ul className="list-disc">
        {sets.map((set) => (
          <li key={set.id} className="mb-2">
            {set.dj.name}
            {set.vimeo}
            <Link to={`/sets/${set.id}`} className="text-blue-500 hover:underline">
              View Details
            </Link>
            {set.thumbnailUrl ? (
              <img src={set.thumbnailUrl} alt={`${set.dj.name} thumbnail`} className="aspect-video h-20 object-cover" />
            ) : null }
          </li>
        ))}
      </ul>
    </div>
  )
}
