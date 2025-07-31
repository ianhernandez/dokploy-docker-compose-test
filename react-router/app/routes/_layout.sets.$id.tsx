import type { Route } from "./+types/_layout.sets.$id"
import { db } from "../db/db.server"
import { Link } from "react-router"
import { Fragment, useState, useEffect } from "react"
import { ThumbsDown, ThumbsUp, Share, Download, MoreHorizontal } from 'lucide-react';
import { generateVimeoEmbedUrl, generateVimeoPageUrl } from '../lib/vimeo';
import { VideoListItem } from '../components/VideoListItem';
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../components/ui/popover"

export async function loader({ request, params }: Route.LoaderArgs) {
  const { id } = params
  if (!id) {
    throw new Response("Set ID is required", { status: 400 })
  }
  
  // Fetch current set with episode info
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
          episodeNumber: true,
        }
      }
    }
  })

  if (!set) {
    throw new Response("Set not found", { status: 404 })
  }

  // Fetch other sets in the same episode (excluding current set)
  const otherSetsInEpisode = await db.dJSet.findMany({
    where: { 
      episodeId: set.episodeId,
      id: { not: set.id }
    },
    orderBy: { orderInEpisode: 'asc' },
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

  // Fetch previous episode and its sets
  const previousEpisode = await db.episode.findFirst({
    where: { 
      episodeNumber: { lt: set.episode.episodeNumber }
    },
    orderBy: { episodeNumber: 'desc' },
    include: {
      sets: {
        orderBy: { orderInEpisode: 'asc' },
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
      }
    }
  })

  // Fetch next episode and its sets
  const nextEpisode = await db.episode.findFirst({
    where: { 
      episodeNumber: { gt: set.episode.episodeNumber }
    },
    orderBy: { episodeNumber: 'asc' },
    include: {
      sets: {
        orderBy: { orderInEpisode: 'asc' },
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
      }
    }
  })

  return { 
    set,
    otherSetsInEpisode,
    previousEpisode,
    nextEpisode
  }
}

export default function SetID({ loaderData }: Route.ComponentProps) {
  const { set, otherSetsInEpisode, previousEpisode, nextEpisode } = loaderData
  
  // Generate Vimeo URLs if we have a vimeo ID
  const vimeoEmbedUrl = set.vimeo ? generateVimeoEmbedUrl(set.vimeo) : null;
  const vimeoPageUrl = set.vimeo ? generateVimeoPageUrl(set.vimeo) : null;

  // Get DJ's first initial for avatar
  const djInitial = set.dj.name.charAt(0).toUpperCase();

  return (
  <Fragment>
    <div className="grid lg:grid-cols-[1fr_380px] min-h-screen p-4">
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
        <div className="p-6 rounded-lg shadow-md mt-4">
          {/* Title */}
          <div className="flex items-center text-white text-xl font-semibold">
            {set.episode.title} | {set.dj.name}
          </div>

          {/* Channel / Actions */}
          <div className="mt-5 flex items-center justify-between">
            {/* Channel Info + Subscribe */}
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-zinc-600 flex items-center justify-center">
                <span className="text-white font-semibold text-lg">{djInitial}</span>
              </div>
              <div>
                <p className="text-white font-medium">{set.dj.name}</p>
                <p className="text-zinc-400 text-sm">411K subscribers</p>
              </div>
              <button className="ml-4 bg-zinc-600 hover:bg-zinc-500 text-white font-medium px-4 py-2 rounded-full">
                Subscribe
              </button>
            </div>

            {/* Action Icons */}
            <div className="flex items-center gap-4">
              <button className="flex items-center p-2 rounded-full hover:bg-zinc-700">
                <ThumbsUp className="w-5 h-5 text-white" />
                <span className="ml-1 text-white text-sm">150</span>
              </button>
              <button className="p-2 rounded-full hover:bg-zinc-700">
                <ThumbsDown className="w-5 h-5 text-white" />
              </button>
              <ShareButton />
              <button className="p-2 rounded-full hover:bg-zinc-700">
                <Download className="w-5 h-5 text-white" />
              </button>
              <button className="p-2 rounded-full hover:bg-zinc-700">
                <MoreHorizontal className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="mt-4 bg-zinc-900 p-8 rounded-2xl">
          <p className="text-sm text-white">
            I'm baby retro iPhone shabby chic, artisan tattooed wolf squid quinoa poutine farm-to-table disrupt. Copper mug photo booth pork belly whatever mixtape ugh. Fanny pack fit fam, marxism sus vice tacos typewriter af activated charcoal ascot tumeric.
          </p>
          <button className="mt-2 text-xs text-blue-600 hover:underline">
            Show more
          </button>
        </div>

        {/* Comments Section */}
        <div className="mt-6">
          <h2 className="text-lg font-medium text-white">Comments</h2>
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

      {/* Sidebar Recommendations */}
      <aside className="mt-8 lg:mt-0 text-white">
        {/* Up Next - Other sets in current episode */}
        {otherSetsInEpisode.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4">Up next</h3>
            <ul className="space-y-4">
              {otherSetsInEpisode.map((setItem) => (
                <VideoListItem
                  key={setItem.id}
                  id={setItem.id}
                  title={setItem.title}
                  djName={setItem.dj.name}
                  episodeTitle={setItem.episode.title}
                  thumbnailUrl={setItem.thumbnailUrl}
                  vimeo={setItem.vimeo}
                  duration={setItem.duration}
                />
              ))}
            </ul>
          </div>
        )}

        {/* Next Episode */}
        {nextEpisode && nextEpisode.sets.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4">Next Episode</h3>
            <ul className="space-y-4">
              {nextEpisode.sets.map((setItem) => (
                <VideoListItem
                  key={setItem.id}
                  id={setItem.id}
                  title={setItem.title}
                  djName={setItem.dj.name}
                  episodeTitle={setItem.episode.title}
                  thumbnailUrl={setItem.thumbnailUrl}
                  vimeo={setItem.vimeo}
                  duration={setItem.duration}
                />
              ))}
            </ul>
          </div>
        )}

        {/* Previous Episode */}
        {previousEpisode && previousEpisode.sets.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4">Previous Episode</h3>
            <ul className="space-y-4">
              {previousEpisode.sets.map((setItem) => (
                <VideoListItem
                  key={setItem.id}
                  id={setItem.id}
                  title={setItem.title}
                  djName={setItem.dj.name}
                  episodeTitle={setItem.episode.title}
                  thumbnailUrl={setItem.thumbnailUrl}
                  vimeo={setItem.vimeo}
                  duration={setItem.duration}
                />
              ))}
            </ul>
          </div>
        )}
      </aside>
    </div>
  </Fragment>
  )
}

export function ShareButton() {
  const [currentUrl, setCurrentUrl] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCurrentUrl(window.location.href)
    }
  }, [])

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy URL:', err)
    }
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="p-2 rounded-full hover:bg-zinc-700">
          <Share className="w-5 h-5 text-white" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Share</h4>
          </div>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="share-url" className="text-xs text-muted-foreground">
                Link
              </Label>
              <div className="flex gap-2">
                <Input
                  id="share-url"
                  value={currentUrl}
                  readOnly
                  className="flex-1 text-xs"
                />
                <Button
                  onClick={handleCopyUrl}
                  variant="outline"
                  size="sm"
                  className="px-3"
                >
                  {copied ? 'Copied!' : 'Copy'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
