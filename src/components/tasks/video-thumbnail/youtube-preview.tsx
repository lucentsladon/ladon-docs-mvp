import Image from "next/image"

export const YoutubePreview = ({ ytVideoThumbnailUrl }: { ytVideoThumbnailUrl: string | null | undefined }) => {
  if (ytVideoThumbnailUrl) {
    return (
      <div className="relative h-full w-full">
        <Image src={ytVideoThumbnailUrl} alt="YouTube video thumbnail" fill className="object-cover blur-xs" />
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/30 backdrop-blur-[2px]">
          <div className="text-center">
            <p className="text-lg font-medium text-white">YouTube Video Preview</p>
            <p className="text-sm text-white/80">Coming Soon</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
      <div className="text-center">
        <p className="text-lg font-medium text-gray-600">YouTube Video Preview</p>
        <p className="text-sm text-gray-500">Coming Soon</p>
      </div>
    </div>
  )
}
