"use client"

import { useState, useEffect } from "react"
import { 
  Users, 
  Settings, 
  BarChart3, 
  Activity,
  TrendingUp,
  CheckCircle,
  Clock
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useApiClient, type User, type Workspace } from "@/lib/api"
import { useUser } from "@clerk/clerk-react"
import { useToast } from "@/hooks/use-toast"

interface BasicStats {
  totalUsers: number
  totalWorkspaces: number
  totalTickets: number
}

export function AdminDashboard() {
  const [users, setUsers] = useState<User[]>([])
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [stats, setStats] = useState<BasicStats>({
    totalUsers: 0,
    totalWorkspaces: 0,
    totalTickets: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const { user } = useUser()
  const { toast } = useToast()
  const apiClient = useApiClient()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setIsLoading(true)
      
      // ⚠️ Using dummy data because backend API not implemented: /api/v1/admin/stats
      const dummyUsers: User[] = [
        {
          id: "1",
          clerk_id: "user_1",
          email: "john@example.com",
          username: "john",
          full_name: "John Doe",
          avatar_url: "https://via.placeholder.com/40",
          bio: "Software Developer",
          phone: "+1234567890",
          timezone: "UTC",
          status: "online" as const,
          last_seen: new Date().toISOString(),
          last_login: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: "2",
          clerk_id: "user_2",
          email: "jane@example.com",
          username: "jane",
          full_name: "Jane Smith",
          avatar_url: "https://via.placeholder.com/40",
          bio: "Product Manager",
          phone: "+1234567891",
          timezone: "UTC",
          status: "away" as const,
          last_seen: new Date(Date.now() - 3600000).toISOString(),
          last_login: new Date(Date.now() - 3600000).toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];
      
      const dummyWorkspaces: Workspace[] = [
        {
          id: "1",
          name: "Main Workspace",
          description: "Primary workspace for the team",
          slug: "main-workspace",
          is_active: true,
          allow_guest_access: false,
          require_approval: true,
          owner_id: "1",
          member_count: 5,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];
      
      setUsers(dummyUsers)
      setWorkspaces(dummyWorkspaces)
      
      // Calculate basic stats
      setStats({
        totalUsers: dummyUsers.length,
        totalWorkspaces: dummyWorkspaces.length,
        totalTickets: 15 // Dummy ticket count
      })
      
    } catch (error) {
      console.error('Failed to load data:', error)
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Activity className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {user?.fullName || user?.emailAddresses[0]?.emailAddress}
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              Active members in the workspace
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Workspaces</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalWorkspaces}</div>
            <p className="text-xs text-muted-foreground">
              Available workspaces
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tickets</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTickets}</div>
            <p className="text-xs text-muted-foreground">
              Total support tickets
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="workspaces">Workspaces</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Users</CardTitle>
              <CardDescription>
                All users in the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {users.map((user) => (
                  <div key={user.id} className="flex items-center space-x-4">
                    <Avatar>
                      <AvatarImage src={user.avatar_url} />
                      <AvatarFallback>
                        {user.full_name?.charAt(0) || user.email.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {user.full_name || user.email}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={user.status === 'online' ? 'default' : 'secondary'}>
                        {user.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {user.last_seen ? new Date(user.last_seen).toLocaleDateString() : 'Never'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="workspaces" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Workspaces</CardTitle>
              <CardDescription>
                All workspaces in the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {workspaces.map((workspace) => (
                  <div key={workspace.id} className="flex items-center space-x-4">
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {workspace.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {workspace.description || 'No description'}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={workspace.is_active ? 'default' : 'secondary'}>
                        {workspace.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {workspace.member_count} members
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}