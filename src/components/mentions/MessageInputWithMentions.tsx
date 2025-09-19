"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Send, AtSign } from "lucide-react"
import { MentionsAutocomplete } from "./MentionsAutocomplete"
import { useApiClient, type User } from "@/lib/api"

interface MessageInputWithMentionsProps {
  onSendMessage: (content: string) => void
  placeholder?: string
  disabled?: boolean
}

export function MessageInputWithMentions({
  onSendMessage,
  placeholder = "Type a message...",
  disabled = false
}: MessageInputWithMentionsProps) {
  const [message, setMessage] = useState("")
  const [showMentions, setShowMentions] = useState(false)
  const [mentionsPosition, setMentionsPosition] = useState({ top: 0, left: 0 })
  const [mentionsQuery, setMentionsQuery] = useState("")
  const [cursorPosition, setCursorPosition] = useState(0)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const apiClient = useApiClient()

  // Handle text change
  const handleTextChange = (value: string) => {
    setMessage(value)
    
    // Check for @ mentions
    const cursorPos = textareaRef.current?.selectionStart || 0
    const textBeforeCursor = value.substring(0, cursorPos)
    const mentionMatch = textBeforeCursor.match(/@(\w*)$/)
    
    if (mentionMatch) {
      const query = mentionMatch[1]
      setMentionsQuery(query)
      
      // Calculate position for mentions dropdown
      if (textareaRef.current) {
        const rect = textareaRef.current.getBoundingClientRect()
        setMentionsPosition({
          top: rect.bottom + 5,
          left: rect.left
        })
      }
      
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
      onSendMessage(message.trim())
      setMessage("")
      setShowMentions(false)
    }
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
        </div>
        
        <Button
          onClick={handleSend}
          disabled={!message.trim() || disabled}
          size="sm"
          className="h-10 w-10 p-0"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
      
      {/* Mentions autocomplete */}
      <MentionsAutocomplete
        isVisible={showMentions}
        position={mentionsPosition}
        query={mentionsQuery}
        onSelect={handleUserSelect}
        onClose={() => setShowMentions(false)}
      />
    </div>
  )
}
