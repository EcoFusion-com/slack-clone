"use client"

import { useState, useEffect } from "react"
import { 
  MessageSquare, 
  Send, 
  X,
  Reply,
  Edit,
  Trash2,
  MoreHorizontal
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { useApiClient, type Thread, type Message, type ThreadCreate } from "@/lib/api"
import { useUser } from "@clerk/clerk-react"
import { useToast } from "@/hooks/use-toast"
import { useWebSocketClient } from "@/lib/websocket"

interface ThreadDetailProps {
  threadId: string
  onClose: () => void
}

export function ThreadDetail({ threadId, onClose }: ThreadDetailProps) {
  const [thread, setThread] = useState<Thread | null>(null)
  const [replyText, setReplyText] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const { user } = useUser()
  const { toast } = useToast()
  const apiClient = useApiClient()
  const wsClient = useWebSocketClient()

  useEffect(() => {
    loadThread()
  }, [threadId])

  // Set up WebSocket listener for new replies
  useEffect(() => {
    const handleThreadReply = (data: any) => {
      if (data.type === 'thread_reply_added' && data.data.thread_id === threadId) {
        // Add the new reply to the thread
        const newReply: Message = {
          id: data.data.reply.id,
          content: data.data.reply.content,
          message_type: 'text',
          user: {
            id: data.data.reply.user.id,
            name: data.data.reply.user.name,
            avatar: data.data.reply.user.avatar,
            isOnline: false,
            role: 'MEMBER'
          },
          channel_id: thread?.channel_id || '',
          timestamp: data.data.reply.timestamp,
          reactions: [],
          replies: 0,
          isOwn: data.data.reply.user.id === user?.id,
          attachments: [],
          is_edited: false,
          is_deleted: false,
          edit_count: 0,
          created_at: data.data.reply.timestamp,
          updated_at: data.data.reply.timestamp
        }

        setThread(prev => prev ? {
          ...prev,
          replies: [...prev.replies, newReply],
          reply_count: prev.reply_count + 1,
          last_activity: data.data.reply.timestamp
        } : null)
      }
    }

    wsClient.on('thread_reply_added', handleThreadReply)

    return () => {
      wsClient.off('thread_reply_added', handleThreadReply)
    }
  }, [threadId, thread, user, wsClient])

  const loadThread = async () => {
    try {
      setIsLoading(true)
      const threadData = await apiClient.getThread(threadId)
      setThread(threadData)
    } catch (error) {
      console.error('Failed to load thread:', error)
      toast({
        title: "Error",
        description: "Failed to load thread",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendReply = async () => {
    if (!replyText.trim() || !thread) return

    try {
      setIsSending(true)
      const replyData: ThreadCreate = {
        content: replyText.trim(),
        message_type: 'text'
      }

      await apiClient.addThreadReply(threadId, replyData)
      setReplyText("")
      
      toast({
        title: "Success",
        description: "Reply sent successfully",
        variant: "default"
      })
    } catch (error) {
      console.error('Failed to send reply:', error)
      toast({
        title: "Error",
        description: "Failed to send reply",
        variant: "destructive"
      })
    } finally {
      setIsSending(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendReply()
    }
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleString()
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <MessageSquare className="h-8 w-8 animate-pulse mx-auto mb-2" />
          <p className="text-muted-foreground">Loading thread...</p>
        </div>
      </div>
    )
  }

  if (!thread) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <MessageSquare className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-muted-foreground">Thread not found</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center space-x-2">
          <MessageSquare className="h-5 w-5" />
          <h2 className="text-lg font-semibold">Thread</h2>
          <Badge variant="outline">
            {thread.reply_count} repl{thread.reply_count !== 1 ? 'ies' : 'y'}
          </Badge>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Thread Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Parent Message */}
        <Card>
          <CardContent className="p-4">
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
                  <span className="text-xs text-muted-foreground">
                    {formatTimestamp(thread.parent_message.timestamp)}
                  </span>
                </div>
                <p className="text-sm">{thread.parent_message.content}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Replies */}
        <div className="space-y-3">
          {thread.replies.map((reply) => (
            <div key={reply.id} className="flex items-start space-x-3 pl-4 border-l-2 border-muted">
              <Avatar className="h-6 w-6">
                <AvatarImage src={reply.user.avatar} />
                <AvatarFallback>
                  {reply.user.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-xs">
                    {reply.user.name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatTimestamp(reply.timestamp)}
                  </span>
                  {reply.isOwn && (
                    <Badge variant="secondary" className="text-xs">
                      You
                    </Badge>
                  )}
                </div>
                <p className="text-sm">{reply.content}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Reply Input */}
      <div className="p-4 border-t">
        <div className="flex items-end space-x-2">
          <div className="flex-1">
            <Textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Reply to thread..."
              className="min-h-[40px] max-h-32 resize-none"
              rows={1}
            />
          </div>
          <Button
            onClick={handleSendReply}
            disabled={!replyText.trim() || isSending}
            size="sm"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

