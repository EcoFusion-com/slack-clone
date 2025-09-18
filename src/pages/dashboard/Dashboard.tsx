"use client"

import { useState, useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { 
  Ticket, 
  Users, 
  CheckCircle, 
  Clock,
  AlertCircle,
  TrendingUp
} from "lucide-react"
import { Header } from "./Header"
import { StatsCard } from "./StatsCard"
import { QuickActions } from "./QuickActions"
import { ActivityFeed } from "./ActivityFeed"
import { useApiClient } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

interface DashboardStats {
  totalTickets: number
  openTickets: number
  submittedTickets: number
  highPriorityTickets: number 
  activeUsers: number
}

interface DashboardProps {
  workspaceId?: string
  className?: string
}

export function Dashboard({ workspaceId = "1", className }: DashboardProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const apiClient = useApiClient()
  const { toast } = useToast()

  // Fetch dashboard stats
  const { data: stats, isLoading: statsLoading, error: statsError } = useQuery({
    queryKey: ['dashboard', 'stats', workspaceId],
    queryFn: async (): Promise<DashboardStats> => {
      try {
        // Fetch all tickets data in parallel
        const [totalTicketsRes, openTicketsRes, submittedTicketsRes, highPriorityRes, usersRes] = await Promise.all([
          apiClient.getTickets({ size: 1 }),
          apiClient.getTickets({ 
            status: ['pending', 'in_progress'], 
            size: 1 
          }),
          apiClient.getTickets({ 
            status: ['submitted'], 
            size: 1 
          }),
          apiClient.getTickets({ 
            priority: ['high', 'urgent'], 
            size: 1 
          }),
          apiClient.getUsers()
        ])

        return {
          totalTickets: totalTicketsRes.total,
          openTickets: openTicketsRes.total,
          submittedTickets: submittedTicketsRes.total,
          highPriorityTickets: highPriorityRes.total,  
          activeUsers: usersRes.length
        }
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error)
        throw error
      }
    },
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 10000, // Consider data stale after 10 seconds
    retry: 2
  })

  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query)
    if (query.trim()) {
      toast({
        title: "Search",
        description: `Searching for: "${query}"`,
      })
    }
  }

  // Handle stats error
  useEffect(() => {
    if (statsError) {
      toast({
        title: "Error loading dashboard",
        description: "Failed to load some dashboard data. Please try refreshing.",
        variant: "destructive"
      })
    }
  }, [statsError, toast])

  return (
    <div className={`h-full bg-background flex flex-col ${className || ''}`}>
      <Header onSearch={handleSearch} />
      
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Stats Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatsCard
              title="Total Tickets"
              value={stats?.totalTickets ?? 0}
              description="All tickets in workspace"
              icon={Ticket}
              isLoading={statsLoading}
              trend={{
                value: 12,
                label: "vs last month",
                isPositive: true
              }}
            />
            
            <StatsCard
              title="Open Tickets"
              value={stats?.openTickets ?? 0}
              description="Pending and in-progress"
              icon={Clock}
              isLoading={statsLoading}
              trend={{
                value: -5,
                label: "vs last week",
                isPositive: false
              }}
            />
            
            <StatsCard
              title="Submitted Tickets"
              value={stats?.submittedTickets ?? 0}
              description="Awaiting review"
              icon={CheckCircle}
              isLoading={statsLoading}
            />
            
            <StatsCard
              title="Active Users"
              value={stats?.activeUsers ?? 0}
              description="Total users in workspace"
              icon={Users}
              isLoading={statsLoading}
              trend={{
                value: 8,
                label: "vs last week",
                isPositive: true
              }}
            />
          </div>

          {/* Main Content Grid */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Quick Actions - Takes up 1 column */}
            <div className="lg:col-span-1">
              <QuickActions workspaceId={workspaceId} />
            </div>

            {/* Activity Feed - Takes up 2 columns */}
            <div className="lg:col-span-2">
              <ActivityFeed />
            </div>
          </div>

          {/* Additional Stats Row */}
          <div className="grid gap-4 md:grid-cols-3">
            <StatsCard
              title="Response Time"
              value="2.4h"
              description="Average response time"
              icon={TrendingUp}
              trend={{
                value: -15,
                label: "vs last month",
                isPositive: true
              }}
            />
            
            <StatsCard
              title="Resolution Rate"
              value="94%"
              description="Tickets resolved successfully"
              icon={CheckCircle}
              trend={{
                value: 3,
                label: "vs last month",
                isPositive: true
              }}
            />
            
            <StatsCard
              title="High Priority"
              value={stats?.highPriorityTickets ?? 0} 
              description="Urgent and high priority tickets"
              icon={AlertCircle}
              className="border-destructive/20"
            />
          </div>
        </div>
      </div>
    </div>
  )
}