import { Link } from "react-router"

interface VideoListItemProps {
  id: string
  title?: string | null
  djName: string
  episodeTitle: string
  thumbnailUrl?: string | null
  vimeo?: string | null
  duration?: number | null
  className?: string
}

export function VideoListItem({ 
  id, 
  title, 
  djName, 
  episodeTitle, 
  thumbnailUrl, 
  vimeo,
  duration,
  className = "" 
}: VideoListItemProps) {
  // Format duration if available
  const formatDuration = (seconds?: number | null) => {
    if (!seconds) return null
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const displayTitle = title || `${episodeTitle} w/ ${djName}`

  return (
    <li className={`flex ${className}`}>
      <Link to={`/sets/${id}`} className="flex w-full">
        <div className="w-40 h-24 bg-gray-300 rounded-md overflow-hidden flex-shrink-0">
          {thumbnailUrl ? (
            <img
              src={thumbnailUrl}
              alt={`${djName} - ${episodeTitle}`}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gray-600 flex items-center justify-center text-gray-400 text-xs">
              No Thumbnail
            </div>
          )}
        </div>
        <div className="ml-3 flex-1">
          <h4 className="text-sm font-medium line-clamp-2">
            {displayTitle}
          </h4>
          <p className="text-xs text-gray-400 mt-1">
            {djName}
          </p>
          {duration && (
            <p className="text-xs text-gray-500 mt-0.5">
              {formatDuration(duration)}
            </p>
          )}
        </div>
      </Link>
    </li>
  )
}
