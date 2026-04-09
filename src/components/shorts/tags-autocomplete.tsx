"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { X, Plus } from "lucide-react"
import { useTranslations } from "@/lib/i18n/client"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

const MAX_TAGS = 10

interface TagsAutocompleteProps {
  value: string[]
  onChange: (tags: string[]) => void
  disabled?: boolean
  className?: string
}

interface TagSuggestion {
  id: string
  name: string
  slug: string
}

export function TagsAutocomplete({
  value,
  onChange,
  disabled = false,
  className
}: TagsAutocompleteProps) {
  const { t } = useTranslations("shorts")
  const [inputValue, setInputValue] = useState("")
  const [suggestions, setSuggestions] = useState<TagSuggestion[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  // Search for tags
  const searchTags = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSuggestions([])
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/api/tags/search?q=${encodeURIComponent(query)}`)
      if (response.ok) {
        const data = await response.json() as TagSuggestion[]
        // Filter out already selected tags
        const filtered = data.filter(tag => !value.includes(tag.name))
        setSuggestions(filtered)
      }
    } catch (error) {
      console.error("Failed to search tags:", error)
      setSuggestions([])
    } finally {
      setIsLoading(false)
    }
  }, [value])

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    if (inputValue.trim().length >= 2) {
      debounceRef.current = setTimeout(() => {
        searchTags(inputValue.trim())
      }, 300)
    } else {
      setSuggestions([])
    }

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [inputValue, searchTags])

  // Close suggestions on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const addTag = useCallback((tagName: string) => {
    const trimmed = tagName.trim()
    if (!trimmed) return
    if (value.length >= MAX_TAGS) return
    if (value.includes(trimmed)) return
    if (trimmed.length > 50) return

    onChange([...value, trimmed])
    setInputValue("")
    setSuggestions([])
    setSelectedIndex(-1)
    inputRef.current?.focus()
  }, [value, onChange])

  const removeTag = useCallback((tagToRemove: string) => {
    onChange(value.filter(tag => tag !== tagToRemove))
  }, [value, onChange])

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      if (selectedIndex >= 0 && suggestions[selectedIndex]) {
        addTag(suggestions[selectedIndex].name)
      } else if (inputValue.trim()) {
        addTag(inputValue)
      }
    } else if (e.key === "Backspace" && !inputValue && value.length > 0) {
      // Remove last tag when backspace pressed on empty input
      removeTag(value[value.length - 1])
    } else if (e.key === "ArrowDown") {
      e.preventDefault()
      setSelectedIndex(prev =>
        prev < suggestions.length - 1 ? prev + 1 : prev
      )
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setSelectedIndex(prev => prev > 0 ? prev - 1 : -1)
    } else if (e.key === "Escape") {
      setShowSuggestions(false)
      setSelectedIndex(-1)
    }
  }, [inputValue, value, suggestions, selectedIndex, addTag, removeTag])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value)
    setShowSuggestions(true)
    setSelectedIndex(-1)
  }, [])

  const handleSuggestionClick = useCallback((tag: TagSuggestion) => {
    addTag(tag.name)
    setShowSuggestions(false)
  }, [addTag])

  const canAddMore = value.length < MAX_TAGS

  return (
    <div ref={containerRef} className={cn("space-y-2", className)}>
      {/* Tag chips */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="flex items-center gap-1 pr-1"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                disabled={disabled}
                className="ml-1 rounded-full hover:bg-muted-foreground/20 p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Input field */}
      {canAddMore && (
        <div className="relative">
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => inputValue.length >= 2 && setShowSuggestions(true)}
            placeholder={t("wizard.metadata.fields.tagsPlaceholder")}
            disabled={disabled}
            maxLength={50}
          />

          {/* Suggestions dropdown */}
          {showSuggestions && (suggestions.length > 0 || (inputValue.trim().length >= 2 && !isLoading)) && (
            <div className="absolute z-10 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-48 overflow-y-auto">
              {suggestions.map((suggestion, index) => (
                <button
                  key={suggestion.id}
                  type="button"
                  onClick={() => handleSuggestionClick(suggestion)}
                  className={cn(
                    "w-full px-3 py-2 text-left text-sm hover:bg-accent",
                    selectedIndex === index && "bg-accent"
                  )}
                >
                  {suggestion.name}
                </button>
              ))}

              {/* Option to create new tag */}
              {inputValue.trim().length >= 2 && !suggestions.some(s => s.name.toLowerCase() === inputValue.trim().toLowerCase()) && (
                <button
                  type="button"
                  onClick={() => addTag(inputValue)}
                  className={cn(
                    "w-full px-3 py-2 text-left text-sm hover:bg-accent flex items-center gap-2 text-muted-foreground",
                    selectedIndex === suggestions.length && "bg-accent"
                  )}
                >
                  <Plus className="h-4 w-4" />
                  <span>{t("wizard.tags.create", { tag: inputValue.trim() })}</span>
                </button>
              )}
            </div>
          )}

          {isLoading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          )}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        {t("wizard.metadata.fields.tagsHint")} ({value.length}/{MAX_TAGS})
      </p>
    </div>
  )
}
