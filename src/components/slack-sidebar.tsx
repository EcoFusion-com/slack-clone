"use client"

import { useState, useEffect } from "react"
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
  Shield
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { useApiClient, type Channel, type Workspace, type User as UserType } from "@/lib/api"
import { useAuth, useUser } from "@clerk/clerk-react"
import { useToast } from "@/hooks/use-toast"

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
        className="w-full justify-start px-2 h-6 text-sidebar-foreground hover:bg-sidebar-hover font-medium text-xs"
        onClick={() => collapsible && setIsOpen(!isOpen)}
      >
        {collapsible && (
          <>
            {isOpen ? <ChevronDown className="h-3 w-3 mr-1" /> : <ChevronRight className="h-3 w-3 mr-1" />}
          </>
        )}
        <span className="uppercase tracking-wide">{title}</span>
        {count !== undefined && (
          <Badge variant="secondary" className="ml-auto h-4 text-xs bg-sidebar-muted text-sidebar-foreground">
            {count}
          </Badge>
        )}
      </Button>
      {isOpen && <div className="mt-1 space-y-0.5">{children}</div>}
    </div>
  )
}

interface ChannelItemProps {
  channel: Channel
  isActive?: boolean
  onClick?: () => void
}

function ChannelItem({ channel, isActive = false, onClick }: ChannelItemProps) {
  const getIcon = () => {
    switch (channel.channel_type) {
      case 'public':
        return <Hash className="h-4 w-4 mr-2 text-sidebar-foreground/70" />
      case 'private':
        return <Lock className="h-4 w-4 mr-2 text-sidebar-foreground/70" />
      case 'dm':
        return (
          <div className="relative mr-2">
            <div className="h-2 w-2 rounded-full bg-sidebar-foreground/70" />
          </div>
        )
      default:
        return <Hash className="h-4 w-4 mr-2 text-sidebar-foreground/70" />
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className={`w-full justify-start px-2 h-7 font-normal text-sm hover:bg-sidebar-hover ${
        isActive 
          ? 'bg-sidebar-accent text-sidebar-accent-foreground' 
          : 'text-sidebar-foreground'
      }`}
      onClick={onClick}
    >
      {getIcon()}
      <span className="truncate">{channel.name}</span>
      {channel.member_count > 0 && (
        <Badge className="ml-auto h-4 text-xs bg-sidebar-muted text-sidebar-foreground">
          {channel.member_count}
        </Badge>
      )}
    </Button>
  )
}

interface SlackSidebarProps {
  selectedChannelId?: string;
  onChannelSelect?: (channelId: string) => void;
  currentView?: 'chat' | 'tickets' | 'threads' | 'mentions' | 'people' | 'admin';
  onViewChange?: (view: 'chat' | 'tickets' | 'threads' | 'mentions' | 'people' | 'admin') => void;
  ticketCount?: number;
}

export function SlackSidebar({ selectedChannelId, onChannelSelect, currentView, onViewChange, ticketCount = 0 }: SlackSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [channels, setChannels] = useState<Channel[]>([])
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { user } = useUser()
  const { toast } = useToast()
  const apiClient = useApiClient()

  // Load workspaces and channels
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setIsLoading(true)
      
      // Load workspaces
      const workspacesData = await apiClient.getWorkspaces()
      setWorkspaces(workspacesData)
      
      if (workspacesData.length > 0) {
        setCurrentWorkspace(workspacesData[0])
        
        // Load channels for the first workspace
        const channelsData = await apiClient.getChannels(workspacesData[0].id)
        setChannels(channelsData)
      }
    } catch (error) {
      console.error('Failed to load sidebar data:', error)
      toast({
        title: "Failed to load data",
        description: "Could not load workspaces and channels",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="w-64 bg-gradient-sidebar border-r border-sidebar-border flex flex-col h-full">
        <div className="p-4 border-b border-sidebar-border">
          <div className="flex items-center space-x-3">
            <div className="h-9 w-9 rounded bg-gradient-primary flex items-center justify-center">
              <span className="text-white font-bold text-lg">W</span>
            </div>
            <div>
              <h2 className="font-bold text-sidebar-foreground">Loading...</h2>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-64 bg-gradient-sidebar border-r border-sidebar-border flex flex-col h-full">
      {/* Workspace Header */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center space-x-3">
          <div className="h-9 w-9 rounded bg-gradient-primary flex items-center justify-center">
            <span className="text-white font-bold text-lg">
              {currentWorkspace?.name.charAt(0).toUpperCase() || 'W'}
            </span>
          </div>
          <div>
            <h2 className="font-bold text-sidebar-foreground">
              {currentWorkspace?.name || 'Workspace'}
            </h2>
            <div className="flex items-center space-x-1">
              <div className="h-2 w-2 rounded-full bg-status-online" />
              <span className="text-xs text-sidebar-foreground/70">
                {user?.fullName || 'User'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="p-3 border-b border-sidebar-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-sidebar-foreground/50" />
          <Input
            placeholder="Search Workspace"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-sidebar-muted border-sidebar-border text-sidebar-foreground placeholder:text-sidebar-foreground/50 focus:bg-card"
          />
        </div>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-2">
          {/* Quick Actions */}
          <div className="space-y-1">
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
              <Badge className="ml-auto h-4 text-xs bg-accent text-accent-foreground">7</Badge>
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
          </div>

          <div className="border-t border-sidebar-border my-4" />

          {/* Channels */}
          <SidebarSection title="Channels" count={channels.length}>
            {channels.map((channel) => (
              <ChannelItem 
                key={channel.id} 
                channel={channel} 
                isActive={channel.id === selectedChannelId}
                onClick={() => onChannelSelect?.(channel.id)}
              />
            ))}
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start px-2 h-7 text-sidebar-foreground/70 hover:bg-sidebar-hover"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add channels
            </Button>
          </SidebarSection>
        </div>
      </ScrollArea>

      {/* User Profile */}
      <div className="p-3 border-t border-sidebar-border">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user?.imageUrl} />
              <AvatarFallback className="bg-gradient-primary text-white">
                {user?.fullName?.split(' ').map(n => n[0]).join('') || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-status-online border-2 border-sidebar" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-foreground truncate">
              {user?.fullName || 'User'}
            </p>
            <p className="text-xs text-sidebar-foreground/70 truncate">
              Member
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-sidebar-foreground/70 hover:bg-sidebar-hover"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}