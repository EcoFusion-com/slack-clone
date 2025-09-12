"use client"

import { useState, useEffect } from "react"
import { 
  Users, 
  Search, 
  Filter,
  UserPlus, 
  Mail,
  Phone,
  MapPin,
  Calendar,
  Clock,
  MoreVertical
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useApiClient, type User } from "@/lib/api"
import { useUser } from "@clerk/clerk-react"
import { useToast } from "@/hooks/use-toast"

export function PeopleAndGroups() {
  const [users, setUsers] = useState<User[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [isLoading, setIsLoading] = useState(true)
  const { user: currentUser } = useUser()
  const { toast } = useToast()
  const apiClient = useApiClient()

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      setIsLoading(true)
      const usersData = await apiClient.getUsers()
      console.log('Users data received:', usersData)
      // Ensure usersData is an array
      if (Array.isArray(usersData)) {
        setUsers(usersData)
      } else {
        console.error('Users data is not an array:', usersData)
        setUsers([])
        toast({
          title: "Error",
          description: "Invalid users data format",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Failed to load users:', error)
      setUsers([])
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const filteredUsers = Array.isArray(users) ? users.filter(user => {
    const matchesSearch = user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || user.status === statusFilter
    
    return matchesSearch && matchesStatus
  }) : []

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'default'
      case 'away': return 'secondary'
      case 'busy': return 'destructive'
      case 'offline': return 'outline'
      default: return 'secondary'
    }
  }

  const formatLastSeen = (lastSeen?: string) => {
    if (!lastSeen) return 'Never'
    const date = new Date(lastSeen)
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
          <Users className="h-8 w-8 animate-pulse mx-auto mb-2" />
          <p className="text-muted-foreground">Loading users...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
        {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">People & Groups</h1>
          <p className="text-muted-foreground">
            Manage team members and groups
          </p>
            </div>
                <Button>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Invite People
                </Button>
        </div>

        {/* Search and Filters */}
          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search people..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
              />
            </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Status: {statusFilter === "all" ? "All" : statusFilter}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setStatusFilter("all")}>
              All
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter("online")}>
              Online
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter("away")}>
              Away
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter("busy")}>
              Busy
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter("offline")}>
              Offline
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        </div>

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
          <CardDescription>
            {filteredUsers.length} of {users.length} members
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
              {filteredUsers.map((user) => (
              <div key={user.id} className="flex items-center space-x-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={user.avatar_url} />
                            <AvatarFallback>
                    {user.full_name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                
                <div className="flex-1 space-y-1">
                          <div className="flex items-center space-x-2">
                    <h3 className="font-medium">
                      {user.full_name || user.email}
                    </h3>
                    {user.id === currentUser?.id && (
                      <Badge variant="outline" className="text-xs">You</Badge>
                            )}
                          </div>
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    <div className="flex items-center space-x-1">
                      <Mail className="h-3 w-3" />
                      <span>{user.email}</span>
                    </div>
                    {user.phone && (
                      <div className="flex items-center space-x-1">
                        <Phone className="h-3 w-3" />
                        <span>{user.phone}</span>
                        </div>
                    )}
                    <div className="flex items-center space-x-1">
                      <Clock className="h-3 w-3" />
                      <span>Last seen {formatLastSeen(user.last_seen)}</span>
                      </div>
                    </div>
                  {user.bio && (
                    <p className="text-sm text-muted-foreground">{user.bio}</p>
                  )}
            </div>
            
                      <div className="flex items-center space-x-2">
                  <Badge variant={getStatusColor(user.status)}>
                    {user.status}
                        </Badge>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem>
                        <Mail className="h-4 w-4 mr-2" />
                        Send Message
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Add to Group
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                      </div>
                    </div>
            ))}
            
            {filteredUsers.length === 0 && (
              <div className="text-center py-8">
                <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">No users found</h3>
                <p className="text-muted-foreground">
                  Try adjusting your search or filter criteria
                </p>
                    </div>
            )}
                    </div>
                  </CardContent>
                </Card>
    </div>
  )
}
