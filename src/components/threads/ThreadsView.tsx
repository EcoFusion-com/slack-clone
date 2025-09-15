"use client"

import { useState, useEffect } from "react"
import { 
  MessageSquare, 
  Search, 
  Filter, 
  Pin,
  Clock,
  User,
  Hash,
  Reply
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { useApiClient, type Message } from "@/lib/api"
import { useUser } from "@clerk/clerk-react"
import { useToast } from "@/hooks/use-toast"

interface Thread {
  id: string
  parent_message: Message
  replies: Message[]
  reply_count: number
  last_activity: string
  is_unread: boolean
  is_pinned: boolean
  channel_name: string
  channel_id: string
}

export function ThreadsView() {
  const [threads, setThreads] = useState<Thread[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const { user } = useUser()
  const { toast } = useToast()
  const apiClient = useApiClient()

  useEffect(() => {
    loadThreads()
  }, [])

  const loadThreads = async () => {
    try {
      setIsLoading(true)
      
      // TODO: Implement real API call when backend endpoint is available
      // For now, show empty state
      setThreads([])
      
    } catch (error) {
      console.error('Failed to load threads:', error)
      toast({
        title: "Error",
        description: "Failed to load threads",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const filteredThreads = threads.filter(thread => {
    const matchesSearch = thread.parent_message.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         thread.channel_name.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesSearch
  })

  const formatLastActivity = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <MessageSquare className="h-8 w-8 animate-pulse mx-auto mb-2" />
          <p className="text-muted-foreground">Loading threads...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Threads</h1>
          <p className="text-muted-foreground">
            Continue conversations in threads
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search threads..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Threads List */}
      <Card>
        <CardHeader>
          <CardTitle>All Threads</CardTitle>
          <CardDescription>
            {filteredThreads.length} thread{filteredThreads.length !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredThreads.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">No threads found</h3>
              <p className="text-muted-foreground">
                Start a conversation by replying to a message
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredThreads.map((thread) => (
                <div 
                  key={thread.id} 
                  className={`p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer ${
                    thread.is_unread ? 'bg-blue-50 border-blue-200' : ''
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={thread.parent_message.user.avatar} />
                      <AvatarFallback>
                        {thread.parent_message.user.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-sm">
                          {thread.parent_message.user.name}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          <Hash className="h-3 w-3 mr-1" />
                          {thread.channel_name}
                        </Badge>
                        {thread.is_pinned && (
                          <Badge variant="secondary" className="text-xs">
                            <Pin className="h-3 w-3 mr-1" />
                            Pinned
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {formatLastActivity(thread.last_activity)}
                        </span>
                      </div>
                      
                      <p className="text-sm">{thread.parent_message.content}</p>
                      
                      <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <Reply className="h-3 w-3" />
                          <span>{thread.reply_count} repl{thread.reply_count !== 1 ? 'ies' : 'y'}</span>
                        </div>
                        {thread.replies.length > 0 && (
                          <div className="flex items-center space-x-1">
                            <User className="h-3 w-3" />
                            <span>Last reply by {thread.replies[thread.replies.length - 1].user.name}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {thread.is_unread && (
                      <div className="h-2 w-2 bg-blue-500 rounded-full" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}