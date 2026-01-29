"use client"

import * as Select from "@radix-ui/react-select"
import { ChevronDown, Check, Cloud, Monitor } from "lucide-react"
import { cn } from "@/lib/utils"

interface Model {
  name: string
  model: string
  digest: string
}

interface ModelSelectProps {
  models: Model[]
  value: string
  onChange: (value: string) => void
}

export function ModelSelect({ models, value, onChange }: ModelSelectProps) {
  const cloudModels = models.filter(m => m.model.startsWith('gemini'))
  const localModels = models.filter(m => !m.model.startsWith('gemini'))

  const selectedModel = models.find(m => m.model === value)

  return (
    <Select.Root value={value} onValueChange={onChange}>
      <Select.Trigger
        className={cn(
          "inline-flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg text-sm",
          "bg-white/10 border border-white/10 hover:border-white/20",
          "focus:outline-none focus:ring-2 focus:ring-primary/50",
          "transition-all min-w-[160px]",
          "data-[placeholder]:text-muted-foreground"
        )}
        aria-label="Select model"
      >
        <Select.Value placeholder="Select model...">
          {selectedModel?.name || "Select model..."}
        </Select.Value>
        <Select.Icon>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </Select.Icon>
      </Select.Trigger>

      <Select.Portal>
        <Select.Content
          className={cn(
            "z-50 min-w-[200px] overflow-hidden rounded-xl",
            "bg-popover border border-white/10 shadow-xl",
            "animate-in fade-in-0 zoom-in-95"
          )}
          position="popper"
          sideOffset={5}
        >
          <Select.Viewport className="p-1">
            {models.length === 0 && (
              <div className="px-3 py-2 text-sm text-muted-foreground">
                Loading models...
              </div>
            )}

            {cloudModels.length > 0 && (
              <Select.Group>
                <Select.Label className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <Cloud className="h-3 w-3" />
                  Cloud Models
                </Select.Label>
                {cloudModels.map((model) => (
                  <SelectItem key={model.digest} value={model.model}>
                    {model.name}
                  </SelectItem>
                ))}
              </Select.Group>
            )}

            {localModels.length > 0 && (
              <Select.Group>
                {cloudModels.length > 0 && (
                  <Select.Separator className="h-px bg-white/10 my-1" />
                )}
                <Select.Label className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <Monitor className="h-3 w-3" />
                  Local Models (Ollama)
                </Select.Label>
                {localModels.map((model) => (
                  <SelectItem key={model.digest} value={model.model}>
                    {model.name}
                  </SelectItem>
                ))}
              </Select.Group>
            )}
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  )
}

function SelectItem({ children, value }: { children: React.ReactNode; value: string }) {
  return (
    <Select.Item
      value={value}
      className={cn(
        "relative flex items-center px-3 py-2 pl-8 rounded-lg text-sm cursor-pointer",
        "text-foreground outline-none",
        "hover:bg-white/10 focus:bg-white/10",
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        "data-[state=checked]:text-primary data-[state=checked]:font-medium",
        "transition-colors"
      )}
    >
      <Select.ItemIndicator className="absolute left-2 flex items-center justify-center">
        <Check className="h-4 w-4 text-primary" />
      </Select.ItemIndicator>
      <Select.ItemText>{children}</Select.ItemText>
    </Select.Item>
  )
}
