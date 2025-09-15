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

  useEffect(() => {
    loadMentionsAndReactions()
  }, [])

  const loadMentionsAndReactions = async () => {
    try {
      setIsLoading(true)
      
      // ⚠️ Using dummy data because backend API not implemented: /api/v1/mentions
      const dummyMentions: Mention[] = [
        {
          id: "1",
          message: {
            id: "msg-1",
            content: "Hey @john, can you review this PR?",
            channel_id: "1",
            timestamp: new Date().toISOString()
          },
          mentioned_by: {
            id: "2",
            name: "Jane Doe",
            avatar: "https://via.placeholder.com/40"
          },
          timestamp: new Date().toISOString(),
          is_read: false
        }
      ];
      
      const dummyReactions: Reaction[] = [
        {
          id: "1",
          message: {
            id: "msg-2",
            content: "Great work on the feature!",
            channel_id: "1",
            timestamp: new Date().toISOString()
          },
          emoji: "👍",
          count: 3,
          users: ["1", "2", "3"],
          timestamp: new Date().toISOString(),
          is_read: false
        }
      ];
      
      setMentions(dummyMentions)
      setReactions(dummyReactions)
      
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
      // ⚠️ Using dummy data because backend API not implemented: /api/v1/mentions/{id}/read
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
