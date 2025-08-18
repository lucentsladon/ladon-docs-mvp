import { Formality } from "@prisma/client"
import { ChevronsUpDown, FileText, Languages, Wand2 } from "lucide-react"
import { motion } from "motion/react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { formatBytes } from "@/lib/utils"

import { type FileData, type SupportedLanguage } from "./constants"
import { LanguagePopover } from "./language-popover"

interface ConfigureViewProps {
  fileData: FileData
  sourceLang: SupportedLanguage
  targetLang: SupportedLanguage
  userPrompt: string
  formality: Formality
  shouldDisableActions: boolean
  isLanguageSwapDisabled: boolean
  handleStartNew: () => void
  handleSourceLangChange: (value: string) => void
  handleTargetLangChange: (value: string) => void
  setUserPrompt: (value: string) => void
  setFormality: (value: Formality) => void
}

export function ConfigureView({
  fileData,
  sourceLang,
  targetLang,
  userPrompt,
  formality,
  shouldDisableActions,
  isLanguageSwapDisabled,
  handleStartNew,
  handleSourceLangChange,
  handleTargetLangChange,
  setUserPrompt,
  setFormality,
}: ConfigureViewProps) {
  const swapLanguages = () => {
    const temp = sourceLang
    handleSourceLangChange(targetLang.value)
    handleTargetLangChange(temp.value)
  }

  return (
    <motion.div
      key="configure"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="space-y-3">
        {/* <div className="bg-muted relative flex h-48 items-center justify-center rounded-lg border">
          <FileText className="h-16 w-16 text-gray-400" />
          <Button
            variant="destructive"
            size="icon"
            onClick={handleStartNew}
            className="absolute top-2 right-2 h-8 w-8 rounded-full shadow-lg"
            disabled={shouldDisableActions}
          >
            <X className="h-4 w-4" />
          </Button>
        </div> */}
        <div className="bg-muted/50 flex items-center gap-2 overflow-hidden rounded-md p-2">
          <FileText className="text-muted-foreground h-4 w-4 flex-shrink-0" />
          <span className="truncate text-sm font-medium">{fileData.file.name}</span>
          <Badge variant="secondary" className="ml-auto flex-shrink-0 text-xs font-normal">
            {formatBytes(fileData.file.size)}
          </Badge>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Languages className="text-primary h-4 w-4" />
            <span>Translation Languages</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1 text-xs"
            onClick={swapLanguages}
            disabled={isLanguageSwapDisabled}
          >
            <motion.div whileHover={{ rotate: 180 }} transition={{ duration: 0.3 }}>
              <ChevronsUpDown className="h-3 w-3" />
            </motion.div>
            Swap
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="source-lang" className="text-sm">
              From
            </Label>
            <LanguagePopover
              lang={sourceLang}
              onLangChange={handleSourceLangChange}
              isDisabled={shouldDisableActions}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="target-lang" className="text-sm">
              To
            </Label>
            <LanguagePopover
              lang={targetLang}
              onLangChange={handleTargetLangChange}
              isDisabled={shouldDisableActions}
            />
          </div>
        </div>
        {/* <div className="space-y-2">
          <Label htmlFor="formality" className="text-sm">
            Formality
          </Label>
          <Select
            value={formality}
            onValueChange={(value) => setFormality(value as Formality)}
            disabled={shouldDisableActions}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select formality" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Default</SelectItem>
              <SelectItem value="formal">Formal</SelectItem>
              <SelectItem value="informal">Informal</SelectItem>
            </SelectContent>
          </Select>
        </div> */}
      </div>

      <div className="space-y-2">
        <Label htmlFor="user-prompt" className="flex items-center gap-2 text-sm font-medium">
          <Wand2 className="text-primary h-4 w-4" />
          <span>Translation Context (Optional)</span>
        </Label>
        <Textarea
          id="user-prompt"
          placeholder="Add context or specific instructions to improve translation quality..."
          value={userPrompt}
          onChange={(e) => setUserPrompt(e.target.value)}
          className="min-h-[80px] resize-none"
          disabled={shouldDisableActions}
        />
        <p className="text-muted-foreground text-xs">
          Provide context about the content, specify terminology, or request a particular tone.
        </p>
      </div>
    </motion.div>
  )
}
