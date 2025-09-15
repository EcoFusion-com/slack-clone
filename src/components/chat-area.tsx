"use client"

import { useState, useEffect, useRef } from "react"
import { 
  Smile, 
  Paperclip, 
  Send, 
  MoreVertical,
  Reply,
  MessageSquare,
  Plus,
  RotateCcw,
  Bookmark,
  AlertTriangle,
  Check,
  CheckCheck,
  X
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useApiClient, type Message } from "@/lib/api"
import { useWebSocketClient, type NewMessageData, type UserTypingData } from "@/lib/websocket"
import { useAuth, useUser } from "@clerk/clerk-react"
import { useToast } from "@/hooks/use-toast"
import { FileUpload } from "@/components/ui/file-upload"
import { fileUploadService, type UploadedFileInfo } from "@/lib/file-upload"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

// Message interface is imported from @/lib/api

interface MessageItemProps {
  message: Message
  showAvatar?: boolean
}

function MessageItem({ message, showAvatar = true }: MessageItemProps) {
  const [showActions, setShowActions] = useState(false)

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    })
  }

  const getReadStatusIcon = () => {
    switch (message.readStatus) {
      case 'sent':
        return <Check className="h-3 w-3 text-muted-foreground" />
      case 'delivered':
        return <CheckCheck className="h-3 w-3 text-muted-foreground" />
      case 'read':
        return <CheckCheck className="h-3 w-3 text-primary" />
      default:
        return null
    }
  }

  return (
    <div 
      className={`group px-4 py-2 hover:bg-message-hover relative ${
        message.isOwn ? 'bg-message-own/20' : ''
      }`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="flex space-x-3">
        {showAvatar ? (
          <div className="relative">
            <Avatar className="h-9 w-9">
              <AvatarImage src={message.user.avatar} />
              <AvatarFallback className="text-sm">
                {message.user.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            {message.user.isOnline && (
              <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-status-online border-2 border-background" />
            )}
          </div>
        ) : (
          <div className="w-9" />
        )}
        
        <div className="flex-1 min-w-0">
          {showAvatar && (
            <div className="flex items-center space-x-2 mb-1">
              <span className="font-semibold text-foreground text-sm">
                {message.user.name}
              </span>
              {message.user.role && (
                <Badge variant="secondary" className="text-xs px-1.5 py-0">
                  {message.user.role}
                </Badge>
              )}
              <span className="text-xs text-muted-foreground">
                {formatTime(message.timestamp)}
              </span>
              {message.isOwn && getReadStatusIcon()}
            </div>
          )}
          
          <div className="text-sm text-foreground leading-relaxed">
            {message.content}
          </div>
          
          {message.attachments && message.attachments.length > 0 && (
            <div className="mt-2 space-y-2">
              {message.attachments.map((attachment, index) => (
                <div 
                  key={attachment.id}
                  className="flex items-center space-x-2 p-2 bg-muted rounded border text-sm"
                >
                  <Paperclip className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{attachment.original_filename}</span>
                  <span className="text-muted-foreground">({attachment.mime_type})</span>
                </div>
              ))}
            </div>
          )}
          
          {message.reactions && message.reactions.length > 0 && (
            <div className="flex items-center space-x-1 mt-2">
              {message.reactions.map((reaction, index) => (
                <Button
                  key={reaction.id}
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 bg-muted hover:bg-muted/80 text-xs"
                >
                  <span className="mr-1">{reaction.emoji}</span>
                  <span>{reaction.count}</span>
                </Button>
              ))}
            </div>
          )}
          
          {message.replies && message.replies > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="mt-2 h-6 px-2 text-xs text-primary hover:bg-primary/10"
            >
              <MessageSquare className="h-3 w-3 mr-1" />
              {message.replies} {message.replies === 1 ? 'reply' : 'replies'}
            </Button>
          )}
        </div>
      </div>

      {/* Message Actions */}
      {showActions && (
        <div className="absolute right-4 top-2 bg-background border border-border rounded-md shadow-md flex">
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
            <Smile className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
            <Reply className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
            <MessageSquare className="h-4 w-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Bookmark className="h-4 w-4 mr-2" />
                Save message
              </DropdownMenuItem>
              <DropdownMenuItem>
                <RotateCcw className="h-4 w-4 mr-2" />
                Create reminder
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive">
                <AlertTriangle className="h-4 w-4 mr-2" />
                Report message
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  )
}

interface ChatAreaProps {
  channelId?: number;
}

export function ChatArea({ channelId = 1 }: ChatAreaProps) {
  const [message, setMessage] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [isFileDialogOpen, setIsFileDialogOpen] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFileInfo[]>([])
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const { user } = useUser()
  const { toast } = useToast()
  const wsClient = useWebSocketClient()
  const apiClient = useApiClient()

  // Load messages when channel changes
  useEffect(() => {
    if (channelId) {
      loadMessages()
      connectWebSocket()
    }
    
    return () => {
      wsClient.disconnect()
    }
  }, [channelId])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement;
      if (viewport) {
        requestAnimationFrame(() => {
          viewport.scrollTop = viewport.scrollHeight;
        });
      }
    }
  }, [messages])

  const loadMessages = async () => {
    try {
      setIsLoading(true)
      const response = await apiClient.getMessages(channelId.toString(), 1, 50)
      setMessages(response.messages)
    } catch (error) {
      console.error('Failed to load messages:', error)
      toast({
        title: "Failed to load messages",
        description: "Could not load messages from this channel",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const connectWebSocket = async () => {
    try {
      await wsClient.connect(channelId.toString())
      
      // Listen for new messages
      wsClient.on('new_message', (data: NewMessageData) => {
        if (data.data.channel_id === channelId.toString()) {
          const newMessage: Message = {
            id: data.data.id,
            content: data.data.content,
            message_type: 'text',
            user: {
              id: data.data.user.id,
              name: data.data.user.name,
              avatar: data.data.user.avatar,
              isOnline: false, // Default value since not provided in WebSocket data
              role: 'EMPLOYEE', // Default value since not provided in WebSocket data
            },
            channel_id: data.data.channel_id,
            timestamp: data.data.timestamp,
            reactions: data.data.reactions,
            replies: 0,
            isOwn: data.data.user.id === user?.id,
            readStatus: 'sent',
            attachments: data.data.attachments,
            is_edited: false,
            is_deleted: false,
            edit_count: 0,
            created_at: data.data.timestamp,
            updated_at: data.data.timestamp,
          }
          
          setMessages(prev => [...prev, newMessage])
        }
      })

      // Listen for typing indicators
      wsClient.on('user_typing', (data: UserTypingData) => {
        if (data.data.channel_id === channelId.toString() && data.data.user_id !== user?.id) {
          setTypingUsers(prev => {
            const newSet = new Set(prev)
            if (data.data.is_typing) {
              newSet.add(data.data.user_id)
            } else {
              newSet.delete(data.data.user_id)
            }
            return newSet
          })
        }
      })

    } catch (error) {
      console.error('Failed to connect WebSocket:', error)
      toast({
        title: "Connection failed",
        description: "Could not connect to real-time chat",
        variant: "destructive",
      })
    }
  }

  const handleFileUpload = async (files: File[]) => {
    try {
      const uploadedFiles = await fileUploadService.uploadFiles(files)
      setUploadedFiles(prev => [...prev, ...uploadedFiles])
      toast({
        title: "Files uploaded successfully",
        description: `${files.length} file(s) ready to send`,
      })
    } catch (error) {
      console.error('Failed to upload files:', error)
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload files",
        variant: "destructive",
      })
    }
  }

  const handleSendMessage = async () => {
    if ((!message.trim() && uploadedFiles.length === 0) || isSending) return

    try {
      setIsSending(true)
      
      // Send via WebSocket for real-time delivery
      wsClient.sendMessage({
        channel_id: channelId.toString(),
        content: message.trim(),
        attachments: uploadedFiles.map(file => ({
          filename: file.filename,
          original_filename: file.original_filename,
          file_size: file.file_size,
          mime_type: file.mime_type,
          file_url: file.file_url,
          width: file.width,
          height: file.height,
          duration: file.duration
        }))
      })
      
      setMessage("")
      setUploadedFiles([])
      setIsFileDialogOpen(false)
    } catch (error) {
      console.error('Failed to send message:', error)
      toast({
        title: "Failed to send message",
        description: "Could not send your message",
        variant: "destructive",
      })
    } finally {
      setIsSending(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleTyping = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value)
    
    // Send typing indicator
    if (e.target.value.trim() && !isTyping) {
      setIsTyping(true)
      // Send typing indicator via WebSocket
      wsClient.sendMessage({
        channel_id: channelId.toString(),
        content: ''
      })
    } else if (!e.target.value.trim() && isTyping) {
      setIsTyping(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col h-full bg-background items-center justify-center">
        <div className="text-muted-foreground">Loading messages...</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Messages */}
      <ScrollArea ref={scrollAreaRef} className="flex-1">
        <div className="py-4">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <div className="text-center">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No messages yet</p>
                <p className="text-sm">Start the conversation!</p>
              </div>
            </div>
          ) : (
            messages.map((msg, index) => {
            const prevMessage = messages[index - 1]
            const showAvatar = !prevMessage || prevMessage.user.name !== msg.user.name ||
                (new Date(msg.timestamp).getTime() - new Date(prevMessage.timestamp).getTime()) > 300000 // 5 minutes
            
            return (
              <MessageItem 
                key={msg.id} 
                message={msg} 
                showAvatar={showAvatar}
              />
            )
            })
          )}
        </div>
        
        {/* Typing Indicator */}
        {typingUsers.size > 0 && (
          <div className="px-4 py-2 text-sm text-muted-foreground">
            <div className="flex items-center space-x-1">
              <div className="flex space-x-1">
                <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <span className="ml-2">
                {typingUsers.size === 1 ? 'Someone is typing...' : `${typingUsers.size} people are typing...`}
              </span>
            </div>
          </div>
        )}
      </ScrollArea>

      {/* Message Input */}
      <div className="border-t border-border p-4">
        <div className="flex space-x-2">
          <Button variant="ghost" size="sm" className="h-9 w-9 p-0 shrink-0">
            <Plus className="h-4 w-4" />
          </Button>
          
          <div className="flex-1 relative">
            <Textarea
              placeholder="Message #general"
              value={message}
              onChange={handleTyping}
              onKeyDown={handleKeyPress}
              className="min-h-[36px] max-h-32 resize-none pr-20 bg-background border-border"
              rows={1}
              disabled={isSending}
            />
            
            <div className="absolute right-2 bottom-2 flex items-center space-x-1">
              <Dialog open={isFileDialogOpen} onOpenChange={setIsFileDialogOpen}>
                <DialogTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <Paperclip className="h-4 w-4 text-muted-foreground" />
              </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Upload Files</DialogTitle>
                    <DialogDescription>
                      Upload files to share in this channel
                    </DialogDescription>
                  </DialogHeader>
                  <FileUpload 
                    onUpload={handleFileUpload}
                    maxFiles={5}
                    maxSize={10 * 1024 * 1024} // 10MB
                    acceptedTypes={['image/*', 'video/*', 'audio/*', 'application/pdf', '.doc', '.docx', '.txt', '.zip', '.rar']}
                  />
                </DialogContent>
              </Dialog>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <Smile className="h-4 w-4 text-muted-foreground" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 w-6 p-0"
                onClick={handleSendMessage}
                disabled={(!message.trim() && uploadedFiles.length === 0) || isSending}
              >
                <Send className={`h-4 w-4 ${(message.trim() || uploadedFiles.length > 0) && !isSending ? 'text-primary' : 'text-muted-foreground'}`} />
              </Button>
            </div>
          </div>
        </div>

        {/* Uploaded Files Preview */}
        {uploadedFiles.length > 0 && (
          <div className="mt-2 p-2 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-muted-foreground">
                Files ready to send ({uploadedFiles.length})
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setUploadedFiles([])}
                className="h-6 w-6 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {uploadedFiles.map((file, index) => (
                <div key={index} className="flex items-center space-x-2 p-2 bg-background rounded border text-xs">
                  <Paperclip className="h-3 w-3 text-muted-foreground" />
                  <span className="truncate max-w-32">{file.original_filename}</span>
                  <span className="text-muted-foreground">({fileUploadService.formatFileSize(file.file_size)})</span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
          <div className="flex items-center space-x-4">
            <span>Press Enter to send, Shift + Enter for new line</span>
          </div>
          <div className="flex items-center space-x-2">
            <span>Aa</span>
            <span>@</span>
            <span>#</span>
          </div>
        </div>
      </div>
    </div>
  )
}
 