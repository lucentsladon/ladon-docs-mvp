export type FileTranslationRequested = {
  data: {
    taskId: string
    videoUrl: string
    inputLanguage: string
    outputLanguage: string
    prompt?: string
  }
}

export type VideoTranslationRequested = {
  taskId: string
  videoUrl: string
  inputLanguage: string
  outputLanguage: string
  prompt?: string
}

export type YoutubeTranslationRequested = {
  taskId: string
  videoUrl: string
  videoId?: string
  originalYtUrl: string
  inputLanguage: string
  outputLanguage: string
  prompt?: string
}

export type DocumentTranslationRequested = {
  taskId: string
}

// A map of all events sent to Inngest
export type Events = {
  "video/translation.requested": {
    data: VideoTranslationRequested
  }
  "youtube/translation.requested": {
    data: YoutubeTranslationRequested
  },
  "document/translate": {
    data: DocumentTranslationRequested
  }
}
