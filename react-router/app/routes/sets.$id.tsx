import type { Route } from "./+types/sets.$id"
import { db } from "../db/db.server"
import { Link } from "react-router"

export async function loader({ request, params }: Route.LoaderArgs) {
  const { id } = params
  if (!id) {
    throw new Response("Set ID is required", { status: 400 })
  }
  // Fetch sets from the database or any other source
  const set = await db.dJSet.findFirst({
    where: { id }
    , include: {
      dj: {
        select: {
          name: true
        }
      }
    }
  })

  if (!set) {
    throw new Response("Set not found", { status: 404 })
  }

  return { set }
}

export default function SetID({ loaderData }: Route.ComponentProps) {
  const { set } = loaderData

  return (
    <div className="flex w-full flex-col items-center justify-center">
      <h1 className="mb-4 text-3xl font-bold">Sets</h1>
      <ul className="list-disc">
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
      </ul>
    </div>
  )
}