import { useState } from "react"
import { Check, ChevronsUpDown, Globe } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

import { LANGUAGES, type SupportedLanguage } from "./constants"

interface LanguagePopoverProps {
  lang: SupportedLanguage
  onLangChange: (value: string) => void
  isDisabled: boolean
}

export function LanguagePopover({ lang, onLangChange, isDisabled }: LanguagePopoverProps) {
  const [popoverOpen, setPopoverOpen] = useState(false)

  return (
    <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={popoverOpen}
          className="w-full justify-between"
          disabled={isDisabled}
        >
          <div className="flex items-center gap-2">
            <Globe className="text-muted-foreground h-4 w-4" />
            <span>{lang ? lang.label : "Select..."}</span>
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0 sm:w-[--radix-popover-trigger-width]">
        <Command>
          <CommandInput placeholder="Search language..." />
          <CommandList>
            <CommandEmpty>No language found.</CommandEmpty>
            <CommandGroup className="max-h-60 overflow-y-auto">
              {LANGUAGES.map((l) => (
                <CommandItem
                  key={l.value}
                  value={l.value}
                  onSelect={(currentValue) => {
                    onLangChange(currentValue)
                    setPopoverOpen(false)
                  }}
                >
                  <div className="flex w-full items-center gap-2">
                    <Check className={"mr-2 h-4 w-4 " + (lang.value === l.value ? "opacity-100" : "opacity-0")} />
                    <span>{l.label}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
