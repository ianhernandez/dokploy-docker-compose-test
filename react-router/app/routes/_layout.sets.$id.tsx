import type { Route } from "./+types/_layout.sets.$id"
import { db } from "../db/db.server"
import { Link } from "react-router"
import { Fragment } from "react"
import { ThumbsDown, ThumbsUp, Share, Download } from 'lucide-react';
import { generateVimeoEmbedUrl, generateVimeoPageUrl } from '../lib/vimeo';

export async function loader({ request, params }: Route.LoaderArgs) {
  const { id } = params
  if (!id) {
    throw new Response("Set ID is required", { status: 400 })
  }
  // Fetch sets from the database or any other source
  const set = await db.dJSet.findFirst({
    where: { id },
    include: {
      dj: {
        select: {
          name: true
        }
      },
      episode: {
        select: {
          title: true,
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
  
  // Generate Vimeo URLs if we have a vimeo ID
  const vimeoEmbedUrl = set.vimeo ? generateVimeoEmbedUrl(set.vimeo) : null;
  const vimeoPageUrl = set.vimeo ? generateVimeoPageUrl(set.vimeo) : null;

  return (
  <Fragment>
    <div className="grid lg:grid-cols-[1fr_320px] min-h-screen p-4">
      {/* Main Video Section */}
      <div className="flex-1 lg:pr-8">
        {/* Video Player */}
        <div className="w-full bg-black aspect-video rounded-md overflow-hidden">
          {vimeoEmbedUrl ? (
            <iframe
              className="w-full h-full"
              src={vimeoEmbedUrl}
              title={`${set.dj.name} - ${set.episode.title}`}
              frameBorder="0"
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
            ></iframe>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white">
              No video available
            </div>
          )}
        </div>

        {/* Video Details */}
        <div className="mt-4">
          <h1 className="text-2xl font-semibold text-gray-900">
            {set.episode.title} w/ {set.dj.name}
          </h1>

          {/* Channel Info and Subscribe */}
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center">
              <img
                src="https://via.placeholder.com/40"
                alt="Channel Avatar"
                className="w-10 h-10 rounded-full"
              />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-800">Syntax</p>
                <p className="text-xs text-gray-500">411K subscribers</p>
              </div>
            </div>
            <button className="bg-red-600 text-white text-sm font-semibold px-4 py-2 rounded-md hover:bg-red-700">
              Subscribe
            </button>
          </div>

          {/* Actions: Like, Share, Download */}
          <div className="flex items-center space-x-6 mt-4 text-gray-700">
            <button className="flex items-center space-x-1 hover:text-gray-900">
              <ThumbsUp className="h-5 w-5" />
              <span>150</span>
            </button>
            <button className="flex items-center space-x-1 hover:text-gray-900">
              <ThumbsDown className="h-5 w-5" />
              <span>Dislike</span>
            </button>
            <button className="flex items-center space-x-1 hover:text-gray-900">
              <Share className="h-5 w-5" />
              <span>Share</span>
            </button>
            <button className="flex items-center space-x-1 hover:text-gray-900">
              <Download className="h-5 w-5" />
              <span>Download</span>
            </button>
          </div>

          {/* Description */}
          <div className="mt-4 bg-white p-4 rounded-md border border-gray-200">
            <p className="text-sm text-gray-800">
              Scott and Wes share their top strategies for getting high-quality results from AI coding tools
              like Cursor, Claude, ChatGPT, and Windsurf. From better prompting to building reusable rule sets,
              they cover practical tips for making AI your most productive coding partner. 🔥
            </p>
            <button className="mt-2 text-xs text-blue-600 hover:underline">
              Show more
            </button>
          </div>

          {/* Comments Section */}
          <div className="mt-6">
            <h2 className="text-lg font-medium text-gray-900">Comments</h2>
            <textarea
              className="w-full mt-2 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
              rows={3}
              placeholder="Add a public comment..."
            ></textarea>
            <div className="flex justify-end mt-2">
              <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                Comment
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar Recommendations */}
      <aside className="mt-8 lg:mt-0">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Up next</h3>
        <ul className="space-y-4">
          {[1, 2, 3, 4, 5].map((item) => (
            <li key={item} className="flex">
              <div className="w-40 h-24 bg-gray-300 rounded-md overflow-hidden flex-shrink-0">
                <img
                  src="https://via.placeholder.com/160x90"
                  alt="Video Thumbnail"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="ml-3 flex-1">
                <h4 className="text-sm font-medium text-gray-900">
                  Video Title {item}
                </h4>
                <p className="text-xs text-gray-600 mt-1">2.3M views • 1 week ago</p>
              </div>
            </li>
          ))}
        </ul>
      </aside>
    </div>
  </Fragment>
  )
}
