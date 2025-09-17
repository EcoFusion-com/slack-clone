import { useState, useEffect, useCallback, useMemo } from 'react'
import { useApiClient, type Message, type Channel, type User } from '@/lib/api'
import { useWebSocketClient } from '@/lib/websocket'
import { useToast } from '@/hooks/use-toast'
import { useErrorHandler } from './use-error-handler'

interface UseChatOptions {
  workspaceId: string
  channelId?: string
}

interface UseChatReturn {
  // Channel state
  channels: Channel[]
  currentChannel: Channel | null
  isLoadingChannels: boolean
  
  // Message state
  messages: Message[]
  isLoadingMessages: boolean
  isSendingMessage: boolean
  
  // Actions
  createChannel: (data: { name: string; description?: string; type?: string }) => Promise<Channel | null>
  selectChannel: (channelId: string) => void
  sendMessage: (content: string, attachments?: any[]) => Promise<void>
  loadMessages: () => Promise<void>
  loadChannels: () => Promise<void>
  refreshMessages: () => Promise<void>
  
  // WebSocket state
  isConnected: boolean
  typingUsers: Set<string>
}

export function useChat({ workspaceId, channelId }: UseChatOptions): UseChatReturn {
  // Stabilize workspaceId to prevent infinite loops
  const safeWorkspaceId = useMemo(() => workspaceId?.toString() || null, [workspaceId])
  
  // Authentication handled by useApiClient
  
  // Error handling
  const { handleError, handleApiError, handleWebSocketError } = useErrorHandler()
  
  // Channel state
  const [channels, setChannels] = useState<Channel[]>([])
  const [currentChannel, setCurrentChannel] = useState<Channel | null>(null)
  const [isLoadingChannels, setIsLoadingChannels] = useState(true)
  
  // Message state
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)
  const [isSendingMessage, setIsSendingMessage] = useState(false)
  
  // User state
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  
  // WebSocket state
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set())
  
  const apiClient = useApiClient()
  const wsClient = useWebSocketClient()
  const { toast } = useToast()
  
  // Load current user
  const loadCurrentUser = useCallback(async () => {
    try {
      const user = await apiClient.getCurrentUser()
      setCurrentUser(user)
    } catch (error) {
      console.error('Failed to load current user:', error)
    }
  }, [])
  
  // Load channels on mount and workspace change
  const loadChannels = useCallback(async () => {
    try {
      setIsLoadingChannels(true)
      const channelsData = await apiClient.getChannels(safeWorkspaceId)
      setChannels(channelsData)
      
      // If no channels exist, show empty state
      if (channelsData.length === 0) {
        // console.log('No channels found in workspace')
        setChannels([])
        setCurrentChannel(null)
      } else {
        // Set current channel from localStorage or prioritize general channel
        const savedChannelId = localStorage.getItem('selectedChannelId')
        let targetChannel = null
        
        if (savedChannelId) {
          // Try to find the saved channel
          targetChannel = channelsData.find(c => c.id === savedChannelId)
        }
        
        // If no saved channel or saved channel not found, prioritize general channel
        if (!targetChannel) {
          targetChannel = channelsData.find(c => c.name === 'general') || channelsData[0]
        }
        
        setCurrentChannel(targetChannel)
        if (targetChannel) {
          localStorage.setItem('selectedChannelId', targetChannel.id)
        }
      }
    } catch (error) {
      console.error('Failed to load channels:', error)
      toast({
        title: "Failed to load channels",
        description: "Could not load channels for this workspace",
        variant: "destructive",
      })
    } finally {
      setIsLoadingChannels(false)
    }
  }, [safeWorkspaceId, toast])
  
  // Load messages for current channel
  const loadMessages = useCallback(async () => {
    if (!currentChannel) return
    
    try {
      setIsLoadingMessages(true)
      const response = await apiClient.getMessages(currentChannel.id, 1, 50)
      setMessages(response.messages)
    } catch (error) {
      console.error('Failed to load messages:', error)
      toast({
        title: "Failed to load messages",
        description: "Could not load messages from this channel",
        variant: "destructive",
      })
    } finally {
      setIsLoadingMessages(false)
    }
  }, [currentChannel, toast])
  
  // Refresh messages (useful after edit/delete operations)
  const refreshMessages = useCallback(async () => {
    if (!currentChannel) return
    await loadMessages()
  }, [currentChannel, loadMessages])

  // Create new channel
  const createChannel = useCallback(async (data: { name: string; description?: string; type?: string }): Promise<Channel | null> => {
    try {
      const newChannel = await apiClient.createChannel(safeWorkspaceId, data)
      
      // Add to local state immediately (optimistic update)
      setChannels(prev => [...(prev || []), newChannel])
      
      // Select the new channel
      setCurrentChannel(newChannel)
      localStorage.setItem('selectedChannelId', newChannel.id)
      
      toast({
        title: "Channel created",
        description: `Channel #${newChannel.name} has been created successfully`,
      })
      
      return newChannel
    } catch (error) {
      console.error('Failed to create channel:', error)
      toast({
        title: "Failed to create channel",
        description: "Could not create the new channel",
        variant: "destructive",
      })
      return null
    }
  }, [safeWorkspaceId, toast])
  
  // Select channel
  const selectChannel = useCallback((channelId: string) => {
    const channel = channels.find(c => c.id === channelId)
    if (channel) {
      setCurrentChannel(channel)
      localStorage.setItem('selectedChannelId', channelId)
    }
  }, [channels])
  
  // Send message with optimistic updates
  const sendMessage = useCallback(async (content: string, attachments: any[] = []) => {
    if (!currentChannel || !content.trim()) return
    
    const tempId = `temp-${Date.now()}`
    
    try {
      setIsSendingMessage(true)
      
      // Create optimistic message (similar to ticket system pattern)
      const optimisticMessage: Message = {
        id: tempId,
        content: content.trim(),
        message_type: 'text',
        user: {
          id: currentUser?.id || 'current-user',
          name: currentUser?.full_name || currentUser?.email || 'You',
          avatar: currentUser?.avatar_url,
          isOnline: true,
          role: 'USER'
        },
        channel_id: currentChannel.id,
        timestamp: new Date().toISOString(),
        reactions: [],
        replies: 0,
        isOwn: true,
        readStatus: 'sent',
        attachments: attachments.map(file => ({
          id: `temp-attachment-${Date.now()}`,
          filename: file.filename,
          original_filename: file.original_filename,
          file_size: file.file_size,
          mime_type: file.mime_type,
          file_url: file.file_url,
          width: file.width,
          height: file.height,
          duration: file.duration,
          created_at: new Date().toISOString()
        })),
        is_edited: false,
        is_deleted: false,
        edit_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      
      // Add optimistic message to local state immediately
      setMessages(prev => [...(prev || []), optimisticMessage])
      
      // Send via WebSocket (with API fallback)
      try {
        wsClient.sendMessage({
          channel_id: currentChannel.id,
          content: content.trim(),
          attachments: attachments
        })
      } catch (wsError) {
        // Fallback to API if WebSocket fails
        console.warn('WebSocket failed, falling back to API:', wsError)
        const response = await apiClient.sendMessage({
          channel_id: currentChannel.id,
          content: content.trim(),
          attachments: attachments
        })
        
        // Replace optimistic message with real one
        setMessages(prev => (prev || []).map(m => 
          m.id === tempId ? response : m
        ))
      }
      
    } catch (error) {
      console.error('Failed to send message:', error)
      
      // Remove optimistic message on error
      setMessages(prev => (prev || []).filter(m => m.id !== tempId))
      
      toast({
        title: "Failed to send message",
        description: "Could not send your message",
        variant: "destructive",
      })
    } finally {
      setIsSendingMessage(false)
    }
  }, [currentChannel, wsClient, toast])
  
  // WebSocket event handlers
  useEffect(() => {
    if (!currentChannel) return
    
    const handleNewMessage = (data: any) => {
      if (data.type === 'new_message' && data.data.channel_id === currentChannel.id) {
        setMessages(prev => {
          // Replace optimistic message with real one or add new message
          const filtered = (prev || []).filter(m => !m.id.startsWith('temp-'))
          return [...filtered, data.data]
        })
      }
    }
    
    const handleUserTyping = (data: any) => {
      if (data.type === 'user_typing' && data.data.channel_id === currentChannel.id) {
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
    }
    
    // Set up event listeners
    wsClient.on('new_message', handleNewMessage)
    wsClient.on('user_typing', handleUserTyping)
    
    return () => {
      wsClient.off('new_message', handleNewMessage)
      wsClient.off('user_typing', handleUserTyping)
    }
  }, [wsClient, currentChannel])
  
  // Connect to WebSocket when channel changes
  useEffect(() => {
    if (currentChannel) {
      // Only reconnect if we're not already connected to this channel
      if (!wsClient.isConnected() || wsClient.getCurrentChannel() !== currentChannel.id) {
        // Disconnect from previous channel if connected
        if (wsClient.isConnected()) {
          wsClient.disconnect()
        }
        
        // Connect to new channel
        wsClient.connect(currentChannel.id).catch(error => {
          console.error('Failed to connect WebSocket:', error)
        })
      }
    }
  }, [currentChannel?.id, wsClient]) // Only depend on channel ID, not the entire channel object
  
  // Load current user on mount
  useEffect(() => {
    loadCurrentUser()
  }, [loadCurrentUser])
  
  // Load data on mount and when workspace changes
  useEffect(() => {
    // Only load channels if we have a valid workspace ID (not null/undefined)
    if (safeWorkspaceId) {
      loadChannels()
    }
  }, [safeWorkspaceId]) // Only depend on safeWorkspaceId, not loadChannels
  
  // Handle channelId prop changes from parent component
  useEffect(() => {
    if (channelId && channels.length > 0) {
      const targetChannel = channels.find(c => c.id === channelId)
      if (targetChannel && targetChannel.id !== currentChannel?.id) {
        setCurrentChannel(targetChannel)
        localStorage.setItem('selectedChannelId', targetChannel.id)
      }
    }
  }, [channelId, channels])

  // Load messages when channel changes
  useEffect(() => {
    if (currentChannel) {
      loadMessages()
    }
  }, [currentChannel]) // Remove loadMessages from dependencies to prevent infinite loop
  
  return {
    // Channel state
    channels: channels || [], // Ensure channels is always an array
    currentChannel,
    isLoadingChannels,
    
    // Message state
    messages: messages || [], // Ensure messages is always an array
    isLoadingMessages,
    isSendingMessage,
    
    // Actions
    createChannel,
    selectChannel,
    sendMessage,
    loadMessages,
    loadChannels,
    refreshMessages,
    
    // WebSocket state
    isConnected: wsClient.isConnected(),
    typingUsers
  }
}

