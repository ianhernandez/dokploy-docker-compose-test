import type { Route } from "./+types/sets"
import { db } from "../db/db.server"

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
          </li>
        ))}
      </ul>
    </div>
  )
}
