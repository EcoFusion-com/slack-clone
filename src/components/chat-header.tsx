"use client"

import { useState } from "react"
import { 
  Hash, 
  Star, 
  Users, 
  Phone, 
  Video, 
  Info, 
  Settings, 
  Search,
  MoreVertical,
  Bell,
  BellOff,
  Pin,
  Archive,
  Moon,
  Sun,
  Monitor
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu"
import { useTheme } from "@/components/theme-provider"

interface ChatHeaderProps {
  channelName: string
  channelType: 'channel' | 'dm' | 'private'
  memberCount?: number
  topic?: string
  isStarred?: boolean
  isNotificationEnabled?: boolean
}

export function ChatHeader({ 
  channelName = "general", 
  channelType = "channel",
  memberCount = 42,
  topic = "Company announcements and general discussion",
  isStarred = false,
  isNotificationEnabled = true
}: ChatHeaderProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const { theme, setTheme } = useTheme()

  const getChannelIcon = () => {
    switch (channelType) {
      case 'channel':
        return <Hash className="h-4 w-4" />
      case 'private':
        return <Hash className="h-4 w-4" />
      case 'dm':
        return null
      default:
        return <Hash className="h-4 w-4" />
    }
  }

  const renderChannelInfo = () => {
    if (channelType === 'dm') {
      return (
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Avatar className="h-6 w-6">
              <AvatarImage src="/placeholder-avatar.jpg" />
              <AvatarFallback className="text-xs">SW</AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-status-online border border-background" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-bold text-foreground">{channelName}</h1>
              <div className="flex items-center space-x-1">
                <div className="h-2 w-2 rounded-full bg-status-online" />
                <span className="text-xs text-muted-foreground">Active</span>
              </div>
            </div>
          </div>
        </div>
      )
    }

    return (
      <div className="flex items-center space-x-2">
        {getChannelIcon()}
        <h1 className="text-lg font-bold text-foreground">{channelName}</h1>
        {memberCount && (
          <div className="flex items-center space-x-1">
            <Users className="h-3 w-3 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">{memberCount}</span>
          </div>
        )}
        {topic && (
          <>
            <span className="text-muted-foreground">|</span>
            <p className="text-sm text-muted-foreground truncate max-w-96">{topic}</p>
          </>
        )}
      </div>
    )
  }

  return (
    <div className="h-12 border-b border-border bg-background flex items-center justify-between px-4">
      <div className="flex items-center space-x-4 flex-1 min-w-0">
        {renderChannelInfo()}
      </div>

      <div className="flex items-center space-x-2">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search in channel"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 w-64 h-8 bg-muted border-border"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="sm"
            className={`h-8 w-8 p-0 ${isStarred ? 'text-warning' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <Star className={`h-4 w-4 ${isStarred ? 'fill-current' : ''}`} />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
          >
            <Phone className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
          >
            <Video className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
          >
            <Info className="h-4 w-4" />
          </Button>

          {/* More Options */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem>
                {isNotificationEnabled ? (
                  <>
                    <BellOff className="h-4 w-4 mr-2" />
                    Mute channel
                  </>
                ) : (
                  <>
                    <Bell className="h-4 w-4 mr-2" />
                    Unmute channel
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Pin className="h-4 w-4 mr-2" />
                Pin channel
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Archive className="h-4 w-4 mr-2" />
                Archive channel
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="h-4 w-4 mr-2" />
                Channel settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <Monitor className="h-4 w-4 mr-2" />
                  Theme
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuItem onClick={() => setTheme("light")}>
                    <Sun className="h-4 w-4 mr-2" />
                    Light
                    {theme === "light" && <Badge className="ml-auto h-4 text-xs">Active</Badge>}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme("dark")}>
                    <Moon className="h-4 w-4 mr-2" />
                    Dark
                    {theme === "dark" && <Badge className="ml-auto h-4 text-xs">Active</Badge>}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme("system")}>
                    <Monitor className="h-4 w-4 mr-2" />
                    System
                    {theme === "system" && <Badge className="ml-auto h-4 text-xs">Active</Badge>}
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  )
}