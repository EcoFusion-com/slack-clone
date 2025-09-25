"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Send, AtSign } from "lucide-react"
import { MentionsAutocomplete } from "./MentionsAutocomplete"
import { useApiClient, type User } from "@/lib/api"

interface MessageInputWithMentionsProps {
  onSendMessage: (content: string, mentions?: Array<{ userId: string; username: string; start: number; end: number }>) => void
  placeholder?: string
  disabled?: boolean
  autoSaveKey?: string // Optional auto-save key for draft persistence
  onDraftChange?: (content: string, mentions?: Array<{ userId: string; username: string; start: number; end: number }>) => void // Callback for draft changes
  showSendButton?: boolean // Whether to show the send button (default: true)
}

export function MessageInputWithMentions({
  onSendMessage,
  placeholder = "Type a message...",
  disabled = false,
  autoSaveKey,
  onDraftChange,
  showSendButton = true
}: MessageInputWithMentionsProps) {
  const [message, setMessage] = useState("")
  const [showMentions, setShowMentions] = useState(false)
  const [mentionsPosition, setMentionsPosition] = useState({ top: 0, left: 0 })
  const [mentionsQuery, setMentionsQuery] = useState("")
  const [cursorPosition, setCursorPosition] = useState(0)
  const [mentions, setMentions] = useState<Array<{ userId: string; username: string; start: number; end: number }>>([])
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const apiClient = useApiClient()

  // Auto-save functionality
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Load saved draft on mount
  useEffect(() => {
    if (autoSaveKey) {
      const savedDraft = localStorage.getItem(autoSaveKey)
      if (savedDraft) {
        try {
          const draft = JSON.parse(savedDraft)
          if (draft.content) {
            setMessage(draft.content)
            if (draft.mentions) {
              setMentions(draft.mentions)
            }
            console.log('📄 MessageInput: Loaded saved draft')
          }
        } catch (error) {
          console.error('Failed to load message draft:', error)
          localStorage.removeItem(autoSaveKey)
        }
      }
    }
  }, [autoSaveKey])

  // Auto-save function
  const autoSave = useCallback(() => {
    if (autoSaveKey && message.trim()) {
      const draft = {
        content: message,
        mentions: mentions,
        lastSaved: new Date().toISOString()
      }
      localStorage.setItem(autoSaveKey, JSON.stringify(draft))
      console.log('💾 MessageInput: Auto-saved draft')
    }
  }, [autoSaveKey, message, mentions])

  // Auto-save on message change (debounced)
  useEffect(() => {
    if (autoSaveKey && message.trim()) {
      // Clear existing timeout
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current)
      }
      
      // Set new timeout for auto-save
      autoSaveTimeoutRef.current = setTimeout(() => {
        autoSave()
      }, 2000) // 2 second debounce
    }

    // Cleanup timeout on unmount
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current)
      }
    }
  }, [autoSaveKey, message]) // ✅ Removed autoSave from dependencies to prevent infinite loop

  // Notify parent of draft changes
  useEffect(() => {
    if (onDraftChange) {
      onDraftChange(message, mentions)
    }
  }, [message, mentions]) // ✅ Removed onDraftChange from dependencies to prevent infinite loop

  // Handle text change
  const handleTextChange = (value: string) => {
    setMessage(value)
    
    // Check for @ mentions
    const cursorPos = textareaRef.current?.selectionStart || 0
    const textBeforeCursor = value.substring(0, cursorPos)
    const mentionMatch = textBeforeCursor.match(/@(\w*)$/)
    
    if (mentionMatch) {
      const query = mentionMatch[1]
      console.log('🔍 Mention detected:', { query, mentionMatch })
      setMentionsQuery(query)
      
      // Calculate position for mentions dropdown
      if (textareaRef.current) {
        const rect = textareaRef.current.getBoundingClientRect()
        console.log('📍 Setting mentions position:', { top: rect.bottom + 5, left: rect.left })
        setMentionsPosition({
          top: -200, // Position well above the textarea
          left: 0
        })
      }
      
      console.log('👁️ Showing mentions dropdown')
      setShowMentions(true)
    } else {
      setShowMentions(false)
    }
  }

  // Handle user selection from mentions
  const handleUserSelect = (user: User) => {
    const cursorPos = textareaRef.current?.selectionStart || 0
    const textBeforeCursor = message.substring(0, cursorPos)
    const textAfterCursor = message.substring(cursorPos)
    
    // Replace the @query with @username
    const mentionMatch = textBeforeCursor.match(/@\w*$/)
    if (mentionMatch) {
      const beforeMention = textBeforeCursor.substring(0, textBeforeCursor.lastIndexOf(mentionMatch[0]))
      const newMessage = beforeMention + `@${user.username || user.email} ` + textAfterCursor
      
      setMessage(newMessage)
      setShowMentions(false)
      
      // Focus back to textarea
      setTimeout(() => {
        textareaRef.current?.focus()
        const newCursorPos = beforeMention.length + `@${user.username || user.email} `.length
        textareaRef.current?.setSelectionRange(newCursorPos, newCursorPos)
      }, 0)
    }
  }

  // Handle send message
  const handleSend = () => {
    if (message.trim() && !disabled) {
      // Process mentions in the message content
      const { processedContent, mentions } = processMentions(message.trim())
      onSendMessage(processedContent, mentions)
      
      // Clear message and mentions
      setMessage("")
      setMentions([])
      setShowMentions(false)
      
      // Clear saved draft
      if (autoSaveKey) {
        localStorage.removeItem(autoSaveKey)
        console.log('🗑️ MessageInput: Cleared draft after send')
      }
    }
  }

  // Process mentions in message content
  const processMentions = (content: string): { processedContent: string; mentions: Array<{ userId: string; username: string; start: number; end: number }> } => {
    const mentions: Array<{ userId: string; username: string; start: number; end: number }> = []
    let processedContent = content
    
    // Find all @username patterns in the content
    const mentionRegex = /@(\w+)/g
    let match
    let offset = 0
    
    while ((match = mentionRegex.exec(content)) !== null) {
      const username = match[1]
      const start = match.index
      const end = start + match[0].length
      
      // For now, we'll use the username as both userId and username
      // In a real implementation, you'd resolve the username to actual user ID
      mentions.push({
        userId: username, // Use username as userId for now
        username: username,
        start: start - offset,
        end: end - offset
      })
      
      // Keep the original @username format for now
      // The backend will handle the mention parsing
      processedContent = processedContent // Don't modify the content
    }
    
    return { processedContent, mentions }
  }

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    } else if (e.key === 'Escape') {
      setShowMentions(false)
    }
  }

  // Handle cursor position change
  const handleCursorChange = () => {
    if (textareaRef.current) {
      setCursorPosition(textareaRef.current.selectionStart || 0)
    }
  }

  return (
    <div className="relative">
      <div className="flex items-end space-x-2 p-3 border-t bg-background">
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => handleTextChange(e.target.value)}
            onKeyDown={handleKeyPress}
            onSelect={handleCursorChange}
            onKeyUp={handleCursorChange}
            placeholder={placeholder}
            disabled={disabled}
            className="min-h-[40px] max-h-32 resize-none pr-10"
            rows={1}
          />
          
          {/* @ symbol indicator */}
          <div className="absolute right-2 top-2">
            <AtSign className="h-4 w-4 text-muted-foreground" />
          </div>
          
          {/* Mentions autocomplete - positioned relative to textarea container */}
          <MentionsAutocomplete
            isVisible={showMentions}
            position={mentionsPosition}
            query={mentionsQuery}
            onSelect={handleUserSelect}
            onClose={() => setShowMentions(false)}
          />
        </div>
        
        {showSendButton && (
          <Button
            onClick={handleSend}
            disabled={!message.trim() || disabled}
            size="sm"
            className="h-10 w-10 p-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
}
