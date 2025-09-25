"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { 
  Hash, 
  Lock, 
  Plus, 
  ChevronDown, 
  ChevronRight,
  MessageCircle,
  User,
  Settings,
  Bell,
  Search,
  Ticket,
  Users,
  Shield,
  X,
  BarChart3
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useApiClient, type Channel, type Workspace, type User as UserType } from "@/lib/api"
import { useAuth, useUser, UserButton } from "@clerk/clerk-react"
import { useNotifications } from "@/hooks/use-notifications"
import { useToast } from "@/hooks/use-toast"
import { useChat } from "@/hooks/use-chat"
import { useWorkspace } from "@/hooks/use-workspace"

// Channel interface is imported from @/lib/api

interface SidebarSectionProps {
  title: string
  children: React.ReactNode
  collapsible?: boolean
  defaultOpen?: boolean
  count?: number
}

function SidebarSection({ title, children, collapsible = true, defaultOpen = true, count }: SidebarSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className="mb-4">
      <Button
        variant="ghost"
        size="sm"
        className="w-full justify-between text-sidebar-foreground hover:bg-sidebar-hover p-2 h-auto"
        onClick={() => collapsible && setIsOpen(!isOpen)}
      >
        <span className="text-xs font-semibold uppercase tracking-wider">
          {title}
          {count !== undefined && (
            <Badge className="ml-2 h-4 text-xs bg-accent text-accent-foreground">
              {count}
            </Badge>
          )}
        </span>
        {collapsible && (
          isOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />
        )}
      </Button>
      {isOpen && (
        <div className="mt-2 space-y-1">
          {children}
        </div>
      )}
    </div>
  )
}

interface SlackSidebarProps {
  selectedChannelId?: string;
  onChannelSelect?: (channelId: string) => void;
  currentView?: 'chat' | 'tickets' | 'threads' | 'mentions' | 'people' | 'admin' | 'dashboard';
  onViewChange?: (view: 'chat' | 'tickets' | 'threads' | 'mentions' | 'people' | 'admin' | 'dashboard') => void;
  ticketCount?: number;
}

export function SlackSidebar({ selectedChannelId, onChannelSelect, currentView, onViewChange, ticketCount = 0 }: SlackSidebarProps) {
  const { stats } = useNotifications()
  const [searchQuery, setSearchQuery] = useState("")
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingWorkspaces, setIsLoadingWorkspaces] = useState(false) // New state
  
  // Use the workspace hook instead of local state
  const { currentWorkspaceId, isLoading: isLoadingWorkspace } = useWorkspace()
  const [isCreateChannelOpen, setIsCreateChannelOpen] = useState(false)
  const [newChannelName, setNewChannelName] = useState("")
  const [newChannelDescription, setNewChannelDescription] = useState("")
  const [isCreatingChannel, setIsCreatingChannel] = useState(false)
  const { user } = useUser()
  const { toast } = useToast()
  const apiClient = useApiClient()
  
  // Stabilize workspace ID to prevent infinite loops in useChat hook
  const stableWorkspaceId = useMemo(() => {
    return currentWorkspaceId || null
  }, [currentWorkspaceId])
  
  const {
    channels = [], // Initialize with empty array to prevent map errors
    currentChannel,
    isLoadingChannels,
    isConnected
  } = useChat({ 
    workspaceId: stableWorkspaceId || "1", 
    channelId: selectedChannelId 
  })

  // Load workspaces on mount only when user is authenticated
  useEffect(() => {
    if (user && user.id) { // Enhanced authentication check
      console.log('👤 User authenticated, loading workspaces...')
      // Add a delay to prevent overwhelming the server with simultaneous requests
      setTimeout(() => {
        loadWorkspaces()
      }, 400)
    } else {
      console.log('⏳ Waiting for user authentication...')
    }
  }, [user?.id]) // ✅ Only depend on user ID to prevent infinite loop

  const loadWorkspaces = useCallback(async () => {
    // Prevent multiple simultaneous calls
    if (isLoadingWorkspaces) {
      console.log('⏸️ Workspaces already loading, skipping...')
      return
    }
    
    try {
      console.log('🔄 Loading workspaces...')
      setIsLoadingWorkspaces(true) // Set loading true
      setIsLoading(true)
      const workspacesData = await apiClient.getWorkspaces()
      setWorkspaces(workspacesData)
      console.log('✅ Workspaces loaded successfully:', workspacesData.length)
    } catch (error) {
      console.error('❌ Failed to load workspaces:', error)
      toast({
        title: "Error",
        description: "Failed to load workspaces",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
      setIsLoadingWorkspaces(false) // Set loading false
    }
  }, [apiClient, toast, isLoadingWorkspaces]) // Added isLoadingWorkspaces to dependencies

  const handleCreateChannel = async () => {
    if (!newChannelName.trim()) {
      toast({
        title: "Error",
        description: "Channel name is required",
        variant: "destructive"
      })
      return
    }

    try {
      setIsCreatingChannel(true)
      const newChannel = await apiClient.createChannel(
        currentWorkspaceId || "1",
        {
          name: newChannelName.trim(),
          description: newChannelDescription.trim() || undefined,
        }
      )

      toast({
        title: "Success",
        description: `Channel "${newChannel.name}" created successfully`,
      })

      // Reset form
      setNewChannelName("")
      setNewChannelDescription("")
      setIsCreateChannelOpen(false)

      // Select the new channel
      onChannelSelect?.(newChannel.id)
    } catch (error) {
      console.error('Failed to create channel:', error)
      toast({
        title: "Error",
        description: "Failed to create channel",
        variant: "destructive"
      })
    } finally {
      setIsCreatingChannel(false)
    }
  }

  const filteredChannels = channels.filter(channel =>
    channel.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (isLoading || isLoadingWorkspace) {
    return (
      <div className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col">
        <div className="p-4">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded"></div>
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-lg font-semibold text-sidebar-foreground">Slack Clone</h1>
          <UserButton afterSignOutUrl="/" />
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-sidebar-foreground/50" />
          <Input
            placeholder="Search channels..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-sidebar-accent border-sidebar-border text-sidebar-foreground placeholder:text-sidebar-foreground/50"
          />
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto p-4">
        <SidebarSection title="Navigation">
          <Button 
            variant="ghost" 
            size="sm" 
            className={`w-full justify-start text-sidebar-foreground hover:bg-sidebar-hover ${
              currentView === 'dashboard' ? 'bg-sidebar-accent text-sidebar-accent-foreground' : ''
            }`}
            onClick={() => onViewChange?.('dashboard')}
          >
            <BarChart3 className="h-4 w-4 mr-3" />
            HR Dashboard
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className={`w-full justify-start text-sidebar-foreground hover:bg-sidebar-hover ${
              currentView === 'threads' ? 'bg-sidebar-accent text-sidebar-accent-foreground' : ''
            }`}
            onClick={() => onViewChange?.('threads')}
          >
            <MessageCircle className="h-4 w-4 mr-3" />
            Threads
            <Badge className="ml-auto h-4 text-xs bg-accent text-accent-foreground">3</Badge>
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className={`w-full justify-start text-sidebar-foreground hover:bg-sidebar-hover ${
              currentView === 'mentions' ? 'bg-sidebar-accent text-sidebar-accent-foreground' : ''
            }`}
            onClick={() => onViewChange?.('mentions')}
          >
            <Bell className="h-4 w-4 mr-3" />
            Mentions & reactions
            {stats.unread > 0 && (
              <Badge className="ml-auto h-4 text-xs bg-accent text-accent-foreground">
                {stats.unread > 99 ? '99+' : stats.unread}
              </Badge>
            )}
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className={`w-full justify-start text-sidebar-foreground hover:bg-sidebar-hover ${
              currentView === 'tickets' ? 'bg-sidebar-accent text-sidebar-accent-foreground' : ''
            }`}
            onClick={() => onViewChange?.('tickets')}
          >
            <Ticket className="h-4 w-4 mr-3" />
            Ticket Center
            <Badge className="ml-auto h-4 text-xs bg-accent text-accent-foreground">{ticketCount}</Badge>
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className={`w-full justify-start text-sidebar-foreground hover:bg-sidebar-hover ${
              currentView === 'people' ? 'bg-sidebar-accent text-sidebar-accent-foreground' : ''
            }`}
            onClick={() => onViewChange?.('people')}
          >
            <Users className="h-4 w-4 mr-3" />
            People & user groups
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className={`w-full justify-start text-sidebar-foreground hover:bg-sidebar-hover ${
              currentView === 'admin' ? 'bg-sidebar-accent text-sidebar-accent-foreground' : ''
            }`}
            onClick={() => onViewChange?.('admin')}
          >
            <Shield className="h-4 w-4 mr-3" />
            Admin Dashboard
          </Button>
        </SidebarSection>

        {/* Channels */}
        <SidebarSection title="Channels" count={channels.length}>
          {isLoadingChannels ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-8 bg-muted rounded animate-pulse"></div>
              ))}
            </div>
          ) : (
            <ScrollArea className="max-h-64">
              <div className="space-y-1">
                {filteredChannels.map((channel) => (
                  <Button
                    key={channel.id}
                    variant="ghost"
                    size="sm"
                    className={`w-full justify-start text-sidebar-foreground hover:bg-sidebar-hover ${
                      selectedChannelId === channel.id ? 'bg-sidebar-accent text-sidebar-accent-foreground' : ''
                    }`}
                    onClick={() => onChannelSelect?.(channel.id)}
                  >
                    <Hash className="h-4 w-4 mr-3" />
                    {channel.name}
                  </Button>
                ))}
              </div>
            </ScrollArea>
          )}
          
          {/* Create Channel Button */}
          <Dialog open={isCreateChannelOpen} onOpenChange={setIsCreateChannelOpen}>
            <DialogTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-hover mt-2"
              >
                <Plus className="h-4 w-4 mr-3" />
                Create Channel
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Channel</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="channel-name">Channel Name</Label>
                  <Input
                    id="channel-name"
                    value={newChannelName}
                    onChange={(e) => setNewChannelName(e.target.value)}
                    placeholder="e.g. general"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="channel-description">Description (Optional)</Label>
                  <Textarea
                    id="channel-description"
                    value={newChannelDescription}
                    onChange={(e) => setNewChannelDescription(e.target.value)}
                    placeholder="What's this channel about?"
                    className="mt-1"
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setIsCreateChannelOpen(false)}
                    disabled={isCreatingChannel}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleCreateChannel}
                    disabled={isCreatingChannel || !newChannelName.trim()}
                  >
                    {isCreatingChannel ? "Creating..." : "Create"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </SidebarSection>

        {/* Workspaces */}
        <SidebarSection title="Workspaces" count={workspaces.length}>
          <ScrollArea className="max-h-32">
            <div className="space-y-1">
              {workspaces.map((workspace) => (
                <Button
                  key={workspace.id}
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-hover"
                >
                  <div className="h-4 w-4 mr-3 rounded bg-gradient-to-br from-blue-500 to-purple-500"></div>
                  {workspace.name}
                </Button>
              ))}
            </div>
          </ScrollArea>
        </SidebarSection>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center space-x-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user?.imageUrl} alt={user?.fullName || "User"} />
            <AvatarFallback>
              <User className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-foreground truncate">
              {user?.fullName || user?.emailAddresses[0]?.emailAddress}
            </p>
            <p className="text-xs text-sidebar-foreground/70 truncate">
              {isConnected ? "Online" : "Offline"}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}