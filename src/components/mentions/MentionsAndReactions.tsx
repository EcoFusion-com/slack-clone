"use client"

import { useState, useEffect } from "react"
import { 
  AtSign, 
  Heart, 
  Search, 
  Filter,
  MessageSquare,
  Clock,
  User,
  Hash
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useApiClient, type Message } from "@/lib/api"
import { useUser } from "@clerk/clerk-react"
import { useToast } from "@/hooks/use-toast"
import { useWebSocketClient } from "@/lib/websocket"

interface Mention {
  id: string
  message: Message
  mentioned_by: {
    id: string
    name: string
    avatar?: string
  }
  channel_name: string
  channel_id: string
  timestamp: string
  is_read: boolean
}

interface Reaction {
  id: string
  message: Message
  emoji: string
  count: number
  users: string[]
  channel_name: string
  channel_id: string
  timestamp: string
  is_read: boolean
}

export function MentionsAndReactions() {
  const [mentions, setMentions] = useState<Mention[]>([])
  const [reactions, setReactions] = useState<Reaction[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const { user } = useUser()
  const { toast } = useToast()
  const apiClient = useApiClient()
  const wsClient = useWebSocketClient()

  useEffect(() => {
    loadMentionsAndReactions()
  }, [])

  // WebSocket event handlers for real-time updates
  useEffect(() => {
    // ✅ BACKGROUND EVENT: mention_created - only show toast, no state update
    const handleMentionCreated = (data: any) => {
      if (data.type === 'mention_created') {
        // ✅ Only show toast notification - no state update to prevent re-render
        toast({
          title: "You were mentioned!",
          description: `Someone mentioned you in a message`,
        })
        
        // ✅ Log the event but don't update state to prevent re-render
        console.log('🔔 Mention event received (no state update):', {
          mentionId: data.data.mention_id,
          messageId: data.data.message_id,
          authorId: data.data.author_id,
          channelId: data.data.channel_id,
          timestamp: new Date().toISOString()
        })
      }
    }

    // ✅ BACKGROUND EVENT: notification - only show toast, no state update
    const handleNotification = (data: any) => {
      if (data.type === 'notification') {
        // ✅ Only show notification toast - no state update to prevent re-render
        toast({
          title: data.data.title,
          description: data.data.message,
          variant: "default"
        })
        
        // ✅ Log the event but don't update state to prevent re-render
        console.log('🔔 Notification event received (no state update):', {
          id: data.data.id,
          type: data.data.type,
          title: data.data.title,
          timestamp: new Date().toISOString()
        })
      }
    }

    // Set up event listeners
    wsClient.on('mention_created', handleMentionCreated)
    wsClient.on('notification', handleNotification)

    return () => {
      wsClient.off('mention_created', handleMentionCreated)
      wsClient.off('notification', handleNotification)
    }
  }, [wsClient, toast])

  const loadMentionsAndReactions = async () => {
    try {
      setIsLoading(true)
      
      // TODO: Implement real API calls when backend endpoints are available
      // For now, show empty state
      setMentions([])
      setReactions([])
      
    } catch (error) {
      console.error('Failed to load mentions and reactions:', error)
      toast({
        title: "Error",
        description: "Failed to load mentions and reactions",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const markAsRead = async (id: string, type: 'mention' | 'reaction') => {
    try {
      // TODO: Implement API call to mark as read
      if (type === 'mention') {
        setMentions(prev => prev.map(m => 
          m.id === id ? { ...m, is_read: true } : m
        ))
      } else {
        setReactions(prev => prev.map(r => 
          r.id === id ? { ...r, is_read: true } : r
        ))
      }
    } catch (error) {
      console.error('Failed to mark as read:', error)
    }
  }

  const filteredMentions = mentions.filter(mention => {
    const matchesSearch = mention.message.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         mention.mentioned_by.name.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesSearch
  })

  const filteredReactions = reactions.filter(reaction => {
    const matchesSearch = reaction.message.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         reaction.emoji.includes(searchQuery.toLowerCase())
    return matchesSearch
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AtSign className="h-8 w-8 animate-pulse mx-auto mb-2" />
          <p className="text-muted-foreground">Loading mentions and reactions...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
        {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Mentions & Reactions</h1>
          <p className="text-muted-foreground">
            Stay updated with mentions and reactions
          </p>
        </div>
        </div>

      {/* Search */}
      <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search mentions and reactions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
        </div>

      {/* Tabs */}
      <Tabs defaultValue="mentions" className="space-y-4">
          <TabsList>
          <TabsTrigger value="mentions" className="flex items-center space-x-2">
            <AtSign className="h-4 w-4" />
            <span>Mentions</span>
            {mentions.filter(m => !m.is_read).length > 0 && (
              <Badge variant="destructive" className="ml-1">
                {mentions.filter(m => !m.is_read).length}
              </Badge>
            )}
            </TabsTrigger>
          <TabsTrigger value="reactions" className="flex items-center space-x-2">
            <Heart className="h-4 w-4" />
            <span>Reactions</span>
            {reactions.filter(r => !r.is_read).length > 0 && (
              <Badge variant="destructive" className="ml-1">
                {reactions.filter(r => !r.is_read).length}
              </Badge>
            )}
            </TabsTrigger>
          </TabsList>

        <TabsContent value="mentions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Mentions</CardTitle>
              <CardDescription>
                Messages where you were mentioned
              </CardDescription>
            </CardHeader>
            <CardContent>
                {filteredMentions.length === 0 ? (
                <div className="text-center py-8">
                      <AtSign className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">No mentions found</h3>
                      <p className="text-muted-foreground">
                    You haven't been mentioned in any messages yet
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredMentions.map((mention) => (
                    <div 
                      key={mention.id} 
                      className={`p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer ${
                        !mention.is_read ? 'bg-blue-50 border-blue-200' : ''
                      }`}
                      onClick={() => markAsRead(mention.id, 'mention')}
                    >
                      <div className="flex items-start space-x-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={mention.mentioned_by.avatar} />
                            <AvatarFallback>
                            {mention.mentioned_by.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                        <div className="flex-1 space-y-2">
                              <div className="flex items-center space-x-2">
                            <span className="font-medium text-sm">
                              {mention.mentioned_by.name}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              <Hash className="h-3 w-3 mr-1" />
                              {mention.channel_name}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                              {new Date(mention.timestamp).toLocaleString()}
                                </span>
                              </div>
                          <p className="text-sm">{mention.message.content}</p>
                            </div>
                        {!mention.is_read && (
                          <div className="h-2 w-2 bg-blue-500 rounded-full" />
                              )}
                            </div>
                          </div>
                  ))}
                        </div>
              )}
                      </CardContent>
                    </Card>
          </TabsContent>

        <TabsContent value="reactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Reactions</CardTitle>
              <CardDescription>
                Messages with reactions
              </CardDescription>
            </CardHeader>
            <CardContent>
                {filteredReactions.length === 0 ? (
                <div className="text-center py-8">
                      <Heart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">No reactions found</h3>
                      <p className="text-muted-foreground">
                    No messages with reactions yet
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredReactions.map((reaction) => (
                    <div 
                      key={reaction.id} 
                      className={`p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer ${
                        !reaction.is_read ? 'bg-green-50 border-green-200' : ''
                      }`}
                      onClick={() => markAsRead(reaction.id, 'reaction')}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex-1 space-y-2">
                              <div className="flex items-center space-x-2">
                            <span className="text-lg">{reaction.emoji}</span>
                            <span className="font-medium text-sm">
                              {reaction.count} reaction{reaction.count !== 1 ? 's' : ''}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              <Hash className="h-3 w-3 mr-1" />
                              {reaction.channel_name}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                              {new Date(reaction.timestamp).toLocaleString()}
                                </span>
                              </div>
                          <p className="text-sm">{reaction.message.content}</p>
                        </div>
                        {!reaction.is_read && (
                          <div className="h-2 w-2 bg-green-500 rounded-full" />
                                )}
                              </div>
                            </div>
                  ))}
                          </div>
              )}
                      </CardContent>
                    </Card>
          </TabsContent>
        </Tabs>
    </div>
  )
}
