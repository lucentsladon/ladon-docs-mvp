export type FileTranslationRequested = {
  data: {
    taskId: string
    videoUrl: string
    inputLanguage: string
    outputLanguage: string
    prompt?: string
  }
}

export type DocumentTranslationRequested = {
  taskId: string
}

// A map of all events sent to Inngest
export type Events = {
  "document/translate": {
    data: DocumentTranslationRequested
  }
}
