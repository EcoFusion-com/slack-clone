"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { useApiClient, type User } from "@/lib/api"
import { useDebounce } from "@/hooks/use-debounce"

interface MentionsAutocompleteProps {
  isVisible: boolean
  position: { top: number; left: number }
  query: string
  onSelect: (user: User) => void
  onClose: () => void
}

export function MentionsAutocomplete({
  isVisible,
  position,
  query,
  onSelect,
  onClose
}: MentionsAutocompleteProps) {
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const apiClient = useApiClient()
  const debouncedQuery = useDebounce(query, 300)
  const containerRef = useRef<HTMLDivElement>(null)

  // Search users when query changes
  useEffect(() => {
    if (!isVisible || !debouncedQuery.trim()) {
      setUsers([])
      return
    }

    const searchUsers = async () => {
      try {
        setIsLoading(true)
        const response = await apiClient.searchUsers(debouncedQuery, 10)
        setUsers(response.users)
        setSelectedIndex(0)
      } catch (error) {
        console.error('Failed to search users:', error)
        setUsers([])
      } finally {
        setIsLoading(false)
      }
    }

    searchUsers()
  }, [debouncedQuery, isVisible, apiClient])

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isVisible || users.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => (prev + 1) % users.length)
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => (prev - 1 + users.length) % users.length)
        break
      case 'Enter':
        e.preventDefault()
        if (users[selectedIndex]) {
          onSelect(users[selectedIndex])
        }
        break
      case 'Escape':
        e.preventDefault()
        onClose()
        break
    }
  }, [isVisible, users, selectedIndex, onSelect, onClose])

  // Add keyboard event listeners
  useEffect(() => {
    if (isVisible) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isVisible, handleKeyDown])

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    if (isVisible) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isVisible, onClose])

  if (!isVisible) return null

  return (
    <div
      ref={containerRef}
      className="absolute z-50 w-64 bg-background border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto"
      style={{
        top: position.top,
        left: position.left
      }}
    >
      {isLoading ? (
        <div className="p-3 text-sm text-muted-foreground text-center">
          Searching users...
        </div>
      ) : users.length === 0 ? (
        <div className="p-3 text-sm text-muted-foreground text-center">
          No users found
        </div>
      ) : (
        <div className="py-1">
          {users.map((user, index) => (
            <div
              key={user.id}
              className={`flex items-center space-x-3 px-3 py-2 cursor-pointer hover:bg-accent ${
                index === selectedIndex ? 'bg-accent' : ''
              }`}
              onClick={() => onSelect(user)}
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.avatar_url} alt={user.full_name || user.email} />
                <AvatarFallback>
                  {user.full_name ? user.full_name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium truncate">
                    {user.full_name || user.email}
                  </span>
                  {user.status === 'online' && (
                    <Badge variant="secondary" className="text-xs">
                      Online
                    </Badge>
                  )}
                </div>
                {user.username && (
                  <p className="text-xs text-muted-foreground truncate">
                    @{user.username}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
