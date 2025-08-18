"use client"

import { memo } from "react"
import { TaskType } from "@prisma/client"
import ReactPlayer from "react-player"

import { YoutubePreview } from "./youtube-preview"

interface VideoThumbnailProps {
  taskType: TaskType
  videoUrl: string
  finalVideoUrl?: string | null
  translatedVttUrl?: string | null
  targetLanguage?: string | null
  status: string
  ytVideoThumbnailUrl?: string | null
  thumbnailUrl?: string | null
}

const VideoThumbnailComponent = ({
  taskType,
  videoUrl,
  finalVideoUrl,
  translatedVttUrl,
  targetLanguage,
  status,
  ytVideoThumbnailUrl,
  thumbnailUrl,
}: VideoThumbnailProps) => {
  const isYouTubeVideo = taskType === TaskType.youtube
  const displayUrl = finalVideoUrl || videoUrl

  const tracks =
    translatedVttUrl && status === "completed" && targetLanguage
      ? [
          {
            kind: "subtitles",
            src: translatedVttUrl,
            srcLang: targetLanguage,
            label: targetLanguage.charAt(0).toUpperCase() + targetLanguage.slice(1),
            default: true,
          },
        ]
      : []

  const renderContent = () => {
    if (isYouTubeVideo) {
      return <YoutubePreview ytVideoThumbnailUrl={ytVideoThumbnailUrl} />
    }

    // if (!thumbnailUrl) {
    //   return (
    //     <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
    //       <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-500"></div>
    //     </div>
    //   )
    // }

    return (
      <ReactPlayer
        src={displayUrl}
        // light={thumbnailUrl || undefined}
        preload="metadata"
        controls
        width="100%"
        height="100%"
        className="react-player"
        crossOrigin="anonymous"
      >
        {tracks.map((track, index) => (
          <track key={index} {...track} />
        ))}
      </ReactPlayer>
    )
  }

  return (
    <div className="relative aspect-video w-full cursor-pointer overflow-hidden rounded-t-3xl bg-gray-200">
      {renderContent()}
    </div>
  )
}

export const VideoThumbnail = memo(VideoThumbnailComponent)
