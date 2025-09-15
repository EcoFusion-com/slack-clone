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
  X,
  Edit,
  Pin,
  Copy,
  Trash2,
  Eye,
  EyeOff,
  Link
} from "lucide-react"
import EmojiPicker from 'emoji-picker-react'
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
import { useChat } from "@/hooks/use-chat"
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
  const [isReacting, setIsReacting] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(message.content)
  const [isSaving, setIsSaving] = useState(false)
  const [showReplies, setShowReplies] = useState(false)
  const [replies, setReplies] = useState<Message[]>([])
  const [isLoadingReplies, setIsLoadingReplies] = useState(false)
  const [isPinned, setIsPinned] = useState(false)
  const [isUnread, setIsUnread] = useState(false)
  const apiClient = useApiClient()
  const { toast } = useToast()

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

  const handleReactionClick = async (emoji: string) => {
    if (isReacting) return
    
    try {
      setIsReacting(true)
      
      // Check if user already reacted with this emoji
      const existingReaction = message.reactions.find(r => r.emoji === emoji)
      
      if (existingReaction) {
        // Remove reaction
        await apiClient.removeMessageReaction(message.id, emoji)
        toast({
          title: "Reaction removed",
          description: `Removed ${emoji} reaction`,
        })
      } else {
        // Add reaction
        await apiClient.addMessageReaction(message.id, emoji)
        toast({
          title: "Reaction added",
          description: `Added ${emoji} reaction`,
        })
      }
    } catch (error) {
      console.error('Failed to toggle reaction:', error)
      toast({
        title: "Failed to update reaction",
        description: "Could not update message reaction",
        variant: "destructive",
      })
    } finally {
      setIsReacting(false)
    }
  }

  const handleEdit = () => {
    setIsEditing(true)
    setEditContent(message.content)
  }

  const handleSaveEdit = async () => {
    if (!editContent.trim() || editContent === message.content) {
      setIsEditing(false)
      return
    }

    try {
      setIsSaving(true)
      await apiClient.editMessage(message.id, editContent.trim())
      toast({
        title: "Message updated",
        description: "Your message has been edited",
      })
      setIsEditing(false)
    } catch (error) {
      console.error('Failed to edit message:', error)
      toast({
        title: "Failed to edit message",
        description: "Could not update your message",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditContent(message.content)
  }

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSaveEdit()
    } else if (e.key === 'Escape') {
      handleCancelEdit()
    }
  }

  const handleReply = (messageId: string) => {
    // This would typically open a reply input or thread view
    // For now, we'll just show a toast
    toast({
      title: "Reply to message",
      description: `Replying to message ${messageId}`,
    })
  }

  const handleToggleReplies = async () => {
    if (showReplies) {
      setShowReplies(false)
      return
    }

    try {
      setIsLoadingReplies(true)
      const response = await apiClient.getMessageReplies(message.id)
      setReplies(response.messages)
      setShowReplies(true)
    } catch (error) {
      console.error('Failed to load replies:', error)
      toast({
        title: "Failed to load replies",
        description: "Could not load message replies",
        variant: "destructive",
      })
    } finally {
      setIsLoadingReplies(false)
    }
  }

  const handlePinMessage = () => {
    setIsPinned(!isPinned)
    toast({
      title: isPinned ? "Message unpinned" : "Message pinned",
      description: isPinned ? "Message has been unpinned" : "Message has been pinned to this channel",
    })
  }

  const handleCopyLink = async () => {
    try {
      const messageLink = `${window.location.origin}/channel/${message.channel_id}/message/${message.id}`
      await navigator.clipboard.writeText(messageLink)
      toast({
        title: "Link copied",
        description: "Message link has been copied to clipboard",
      })
    } catch (error) {
      toast({
        title: "Failed to copy link",
        description: "Could not copy message link to clipboard",
        variant: "destructive",
      })
    }
  }

  const handleMarkUnread = () => {
    setIsUnread(!isUnread)
    toast({
      title: isUnread ? "Message marked as read" : "Message marked as unread",
      description: isUnread ? "Message has been marked as read" : "Message has been marked as unread",
    })
  }

  const handleDeleteMessage = async () => {
    try {
      // In a real app, this would call the API to delete the message
      await new Promise(resolve => setTimeout(resolve, 500))
      toast({
        title: "Message deleted",
        description: "Message has been deleted",
      })
      // In a real app, this would trigger a re-render or remove from the list
    } catch (error) {
      toast({
        title: "Failed to delete message",
        description: "Could not delete the message",
        variant: "destructive",
      })
    }
  }

  return (
    <div 
      className={`group px-4 py-2 hover:bg-message-hover relative ${
        message.isOwn ? 'bg-message-own/20' : ''
      } ${isPinned ? 'border-l-4 border-yellow-500 bg-yellow-50/50' : ''} ${
        isUnread ? 'bg-blue-50/50 border-l-4 border-blue-500' : ''
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
          
          {isEditing ? (
            <div className="space-y-2">
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                onKeyDown={handleEditKeyDown}
                className="min-h-[60px] resize-none"
                disabled={isSaving}
                autoFocus
              />
              <div className="flex items-center space-x-2">
                <Button
                  size="sm"
                  onClick={handleSaveEdit}
                  disabled={isSaving || !editContent.trim()}
                >
                  {isSaving ? "Saving..." : "Save"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCancelEdit}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-sm text-foreground leading-relaxed">
              {message.content}
              {message.is_edited && (
                <span className="text-xs text-muted-foreground ml-2">(edited)</span>
              )}
            </div>
          )}
          
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
                  className="h-6 px-2 bg-muted hover:bg-muted/80 text-xs cursor-pointer"
                  onClick={() => handleReactionClick(reaction.emoji)}
                  disabled={isReacting}
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
              onClick={handleToggleReplies}
              disabled={isLoadingReplies}
            >
              <MessageSquare className="h-3 w-3 mr-1" />
              {isLoadingReplies ? 'Loading...' : `${message.replies} ${message.replies === 1 ? 'reply' : 'replies'}`}
            </Button>
          )}
          
          {showReplies && replies.length > 0 && (
            <div className="mt-2 ml-4 border-l-2 border-muted pl-4 space-y-2">
              {replies.map((reply) => (
                <MessageItem key={reply.id} message={reply} showAvatar={false} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Message Actions */}
      {showActions && (
        <div className="absolute right-4 top-2 bg-background border border-border rounded-md shadow-md flex">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                <Smile className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <div className="grid grid-cols-6 gap-1 p-2">
                {['👍', '👎', '❤️', '😂', '😮', '😢', '😡', '🎉', '👏', '🔥', '💯', '🚀'].map((emoji) => (
                  <Button
                    key={emoji}
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-lg hover:bg-muted"
                    onClick={() => handleReactionClick(emoji)}
                    disabled={isReacting}
                  >
                    {emoji}
                  </Button>
                ))}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-7 w-7 p-0"
            onClick={() => handleReply(message.id)}
          >
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
            <DropdownMenuContent align="end" className="w-56">
              {message.isOwn && (
                <>
                  <DropdownMenuItem onClick={handleEdit}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit message
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleDeleteMessage} className="text-destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete message
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem onClick={handlePinMessage}>
                <Pin className={`h-4 w-4 mr-2 ${isPinned ? 'text-yellow-500' : ''}`} />
                {isPinned ? 'Unpin message' : 'Pin message'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleCopyLink}>
                <Link className="h-4 w-4 mr-2" />
                Copy link
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleMarkUnread}>
                {isUnread ? <Eye className="h-4 w-4 mr-2" /> : <EyeOff className="h-4 w-4 mr-2" />}
                {isUnread ? 'Mark as read' : 'Mark as unread'}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
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
  channelId?: string;
  workspaceId?: string;
}

export function ChatArea({ channelId, workspaceId = "1" }: ChatAreaProps) {
  const [message, setMessage] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [isFileDialogOpen, setIsFileDialogOpen] = useState(false)
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFileInfo[]>([])
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const emojiPickerRef = useRef<HTMLDivElement>(null)
  const { user } = useUser()
  const { toast } = useToast()
  
  // Use the new chat hook for state management (similar to ticket system pattern)
  const {
    messages,
    isLoadingMessages,
    isSendingMessage,
    sendMessage,
    typingUsers,
    isConnected
  } = useChat({ 
    workspaceId, 
    channelId: channelId || undefined 
  })

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]')
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight
      }
    }
  }, [messages])

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target as Node) &&
        !(event.target as HTMLElement).closest("[data-emoji-button]")
      ) {
        setIsEmojiPickerOpen(false)
      }
    }

    if (isEmojiPickerOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isEmojiPickerOpen])

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

  const handleEmojiClick = (emojiData: any) => {
    const emoji = emojiData.emoji
    
    if (textareaRef.current) {
      const textarea = textareaRef.current
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const newMessage = message.substring(0, start) + emoji + message.substring(end)
      setMessage(newMessage)
      
      // Focus back to textarea and set cursor position after emoji
      setTimeout(() => {
        textarea.focus()
        textarea.setSelectionRange(start + emoji.length, start + emoji.length)
      }, 0)
    }
    
    // Close picker after selection
    setIsEmojiPickerOpen(false)
  }

  const handleSendMessage = async () => {
    if ((!message.trim() && uploadedFiles.length === 0) || isSendingMessage) return

    try {
      // Use the chat hook's sendMessage method (includes optimistic updates)
      await sendMessage(message.trim(), uploadedFiles.map(file => ({
        filename: file.filename,
        original_filename: file.original_filename,
        file_size: file.file_size,
        mime_type: file.mime_type,
        file_url: file.file_url,
        width: file.width,
        height: file.height,
        duration: file.duration
      })))
      
      setMessage("")
      setUploadedFiles([])
      setIsFileDialogOpen(false)
    } catch (error) {
      console.error('Failed to send message:', error)
      // Error handling is done in the hook
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
    
    // Send typing indicator (if WebSocket is connected)
    if (isConnected) {
      if (e.target.value.trim() && !isTyping) {
        setIsTyping(true)
        // Note: Typing indicators are handled in the useChat hook
      } else if (!e.target.value.trim() && isTyping) {
        setIsTyping(false)
      }
    }
  }

  if (isLoadingMessages) {
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
              ref={textareaRef}
              placeholder="Message #general"
              value={message}
              onChange={handleTyping}
              onKeyDown={handleKeyPress}
              className="min-h-[36px] max-h-32 resize-none pr-20 bg-background border-border"
              rows={1}
                disabled={isSendingMessage}
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
              <Button 
                variant="ghost" 
                size="sm" 
                className={`h-6 w-6 p-0 ${isEmojiPickerOpen ? 'bg-primary/10' : ''}`}
                data-emoji-button
                onClick={(e) => {
                  e.stopPropagation()
                  setIsEmojiPickerOpen(!isEmojiPickerOpen)
                }}
              >
                <Smile className={`h-4 w-4 ${isEmojiPickerOpen ? 'text-primary' : 'text-muted-foreground'}`} />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 w-6 p-0"
                onClick={handleSendMessage}
                disabled={(!message.trim() && uploadedFiles.length === 0) || isSendingMessage}
              >
                <Send className={`h-4 w-4 ${(message.trim() || uploadedFiles.length > 0) && !isSendingMessage ? 'text-primary' : 'text-muted-foreground'}`} />
              </Button>
            </div>
          </div>
        </div>

        {/* Emoji Picker */}
        {isEmojiPickerOpen && (
          <div 
            ref={emojiPickerRef}
            className="fixed bottom-20 right-4 z-[9999]"
          >
            <div className="bg-white border border-border rounded-lg shadow-xl overflow-hidden">
              <EmojiPicker
                onEmojiClick={handleEmojiClick}
                width={350}
                height={400}
                searchDisabled={false}
                skinTonesDisabled={false}
                previewConfig={{
                  defaultEmoji: '1f60a',
                  defaultCaption: 'Choose your emoji!',
                  showPreview: true
                }}
                searchPlaceHolder="Search emojis..."
              />
            </div>
          </div>
        )}

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
