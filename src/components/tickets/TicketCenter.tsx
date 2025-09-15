"use client"

import { useState, useEffect } from "react"
import { 
  Plus, 
  Filter, 
  Search, 
  Calendar,
  User,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  RefreshCw
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useApiClient, type Ticket } from "@/lib/api"
import { useUser } from "@clerk/clerk-react"
import { useToast } from "@/hooks/use-toast"
import { CreateTicketForm } from "./CreateTicketForm"
import { TicketDetails } from "./TicketDetails"
import { useWebSocketClient } from "@/lib/websocket"

interface TicketCenterProps {
  workspaceId?: string;
  onTicketCountChange?: (count: number) => void;
}

export function TicketCenter({ workspaceId = "1", onTicketCountChange }: TicketCenterProps) {
  // Ensure workspaceId is always a string
  const safeWorkspaceId = workspaceId?.toString() || "1"
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [filteredTickets, setFilteredTickets] = useState<Ticket[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [priorityFilter, setPriorityFilter] = useState<string>("all")
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const { user } = useUser()
  const { toast } = useToast()
  const apiClient = useApiClient()
  
  // WebSocket connection for real-time updates
  const wsClient = useWebSocketClient()
  
  // Track processed ticket IDs to prevent duplicates
  const [processedTicketIds, setProcessedTicketIds] = useState<Set<string>>(new Set())
  
  // Debounce mechanism to prevent rapid API calls
  const [isLoadingDebounced, setIsLoadingDebounced] = useState(false)
  
  // Clean up processed IDs periodically to prevent memory leaks
  useEffect(() => {
    const cleanup = setInterval(() => {
      setProcessedTicketIds(prev => {
        // Keep only IDs that are currently in the tickets list
        const currentTicketIds = new Set(tickets.map(ticket => ticket.id))
        return new Set([...prev].filter(id => currentTicketIds.has(id)))
      })
    }, 60000) // Clean up every minute
    
    return () => clearInterval(cleanup)
  }, [tickets])
  
  // Connect to WebSocket when component mounts
  useEffect(() => {
    if (wsClient && !wsClient.isConnected) {
      // Use a workspace-specific channel ID for tickets
      const workspaceChannelId = `workspace-${safeWorkspaceId}`
      wsClient.connect(workspaceChannelId).catch(error => {
        console.error('Failed to connect WebSocket for tickets:', error)
      })
    }
  }, [wsClient, safeWorkspaceId])

  useEffect(() => {
    loadTickets()
    
    // Set up periodic refresh every 5 minutes to ensure data persistence
    const refreshInterval = setInterval(() => {
      console.log('Auto-refreshing tickets...')
      loadTickets()
    }, 300000) // 5 minutes
    
    return () => clearInterval(refreshInterval)
  }, [safeWorkspaceId])

  // Reload tickets when component becomes visible (for navigation persistence)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && safeWorkspaceId) {
        loadTickets()
      }
    }

    const handleFocus = () => {
      if (safeWorkspaceId) {
        loadTickets()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleFocus)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
    }
  }, [safeWorkspaceId])

  // Listen for WebSocket events - only set up once
  useEffect(() => {
    console.log('Setting up WebSocket event listeners')

    const handleTicketCreated = (data: any) => {
      console.log('Received ticket_created event:', data)
      const newTicket = data.data.ticket
      
      // Check if we've already processed this ticket
      setProcessedTicketIds(prev => {
        if (prev.has(newTicket.id)) {
          console.log('Ticket already processed, skipping duplicate:', newTicket.id)
          return prev
        }
        
        // Mark as processed
        const newSet = new Set(prev)
        newSet.add(newTicket.id)
        
        // Add to tickets only if not already present
        setTickets(tickets => {
          const exists = tickets.some(ticket => ticket.id === newTicket.id)
          if (exists) {
            console.log('Ticket already in list, skipping duplicate:', newTicket.id)
            return tickets
          }
          console.log('Adding new ticket to list:', newTicket.id)
          return [newTicket, ...tickets]
        })
        
        toast({
          title: "New Ticket Created",
          description: `${newTicket.title} has been created`,
        })
        
        return newSet
      })
    }

    const handleTicketUpdated = (data: any) => {
      console.log('Received ticket_updated event:', data)
      const updatedTicket = data.data.ticket
      setTickets(prev => prev.map(ticket => 
        ticket.id === updatedTicket.id ? updatedTicket : ticket
      ))
      toast({
        title: "Ticket Updated",
        description: `${updatedTicket.title} has been updated`,
      })
    }

    const handleWebSocketReconnect = () => {
      console.log('WebSocket reconnected, refreshing tickets')
      loadTickets()
    }

    // Add event listeners
    wsClient.on('ticket_created', handleTicketCreated)
    wsClient.on('ticket_updated', handleTicketUpdated)
    wsClient.on('reconnect', handleWebSocketReconnect)

    // Cleanup
    return () => {
      console.log('Cleaning up WebSocket event listeners')
      wsClient.off('ticket_created', handleTicketCreated)
      wsClient.off('ticket_updated', handleTicketUpdated)
      wsClient.off('reconnect', handleWebSocketReconnect)
    }
  }, []) // Empty dependency array - only set up once

  useEffect(() => {
    filterTickets()
  }, [tickets, searchQuery, statusFilter, priorityFilter])

  // Notify parent of ticket count changes
  useEffect(() => {
    if (onTicketCountChange) {
      onTicketCountChange(tickets.length)
    }
  }, [tickets.length, onTicketCountChange])

  const loadTickets = async () => {
    // Prevent rapid successive calls
    if (isLoadingDebounced) {
      console.log('Loading already in progress, skipping...')
      return
    }
    
    try {
      setIsLoading(true)
      setIsLoadingDebounced(true)
      console.log('Loading tickets for workspace:', safeWorkspaceId)
      
      const response = await apiClient.getTickets({
        workspace_id: safeWorkspaceId,
        page: 1,
        size: 100
      })
      
      console.log('Tickets response:', response)
      
      // Ensure we have a valid response with tickets array
      if (response && Array.isArray(response.tickets)) {
        // Merge with existing tickets to avoid duplicates
        setTickets(prev => {
          const existingIds = new Set(prev.map(ticket => ticket.id))
          const newTickets = response.tickets.filter(ticket => !existingIds.has(ticket.id))
          const mergedTickets = [...newTickets, ...prev]
          
          // Sort by creation date (newest first)
          return mergedTickets.sort((a, b) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          )
        })
        
        // Update processed IDs set with loaded tickets
        setProcessedTicketIds(prev => {
          const newSet = new Set(prev)
          response.tickets.forEach(ticket => newSet.add(ticket.id))
          return newSet
        })
        console.log('Loaded tickets:', response.tickets.length)
      } else {
        console.warn('Invalid tickets response:', response)
        setTickets([])
        toast({
          title: "No tickets found",
          description: "No tickets were returned from the server",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Failed to load tickets:', error)
      setTickets([]) // Ensure tickets array is empty on error
      toast({
        title: "Failed to load tickets",
        description: error instanceof Error ? error.message : "Could not load tickets from the server",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
      // Reset debounce flag after a short delay
      setTimeout(() => setIsLoadingDebounced(false), 1000)
    }
  }

  const filterTickets = () => {
    // First, deduplicate tickets by ID
    const uniqueTickets = tickets.reduce((acc, ticket) => {
      if (!acc.find(t => t.id === ticket.id)) {
        acc.push(ticket)
      }
      return acc
    }, [] as Ticket[])

    let filtered = uniqueTickets

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(ticket => 
        ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ticket.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ticket.creator_name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(ticket => ticket.status === statusFilter)
    }

    // Priority filter
    if (priorityFilter !== "all") {
      filtered = filtered.filter(ticket => ticket.priority === priorityFilter)
    }

    setFilteredTickets(filtered)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />
      case 'in_progress':
        return <AlertCircle className="h-4 w-4" />
      case 'submitted':
        return <CheckCircle className="h-4 w-4" />
      case 'approved':
        return <CheckCircle className="h-4 w-4" />
      case 'rejected':
        return <XCircle className="h-4 w-4" />
      case 'cancelled':
        return <XCircle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
      case 'submitted':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
      case 'approved':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
      case 'cancelled':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
      case 'high':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300'
      case 'urgent':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      })
    } else if (diffInHours < 24 * 7) {
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        hour: '2-digit',
        minute: '2-digit'
      })
    } else {
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    }
  }

  const formatDueDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diffInDays < 0) {
      return `Overdue (${Math.abs(diffInDays)} days ago)`
    } else if (diffInDays === 0) {
      return 'Due today'
    } else if (diffInDays === 1) {
      return 'Due tomorrow'
    } else if (diffInDays <= 7) {
      return `Due in ${diffInDays} days`
    } else {
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    }
  }

  const handleTicketUpdate = (updatedTicket: Ticket) => {
    setTickets(prev => prev.map(ticket => 
      ticket.id === updatedTicket.id ? updatedTicket : ticket
    ))
    setSelectedTicket(updatedTicket)
  }

  const handleTicketCreate = (newTicket: Ticket) => {
    // Add to processed IDs to prevent duplicates
    setProcessedTicketIds(prev => new Set([...prev, newTicket.id]))
    
    setTickets(prev => [newTicket, ...prev])
    setIsCreateDialogOpen(false)
    toast({
      title: "Ticket created",
      description: `Ticket "${newTicket.title}" has been created successfully`,
    })
  }

  const handleTicketDelete = async (ticketId: string) => {
    try {
      await apiClient.deleteTicket(ticketId)
      setTickets(prev => prev.filter(ticket => ticket.id !== ticketId))
      setSelectedTicket(null)
      toast({
        title: "Ticket deleted",
        description: "Ticket has been deleted successfully",
      })
    } catch (error) {
      console.error('Failed to delete ticket:', error)
      toast({
        title: "Failed to delete ticket",
        description: "Could not delete the ticket",
        variant: "destructive",
      })
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading tickets...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full bg-background flex flex-col">
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-4">
              <div>
                <h1 className="text-3xl font-bold text-foreground">Tickets</h1>
                <p className="text-muted-foreground">
                  Manage and track support tickets
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    console.log('Manual refresh triggered')
                    loadTickets()
                  }}
                  disabled={isLoading}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Ticket
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Create New Ticket</DialogTitle>
                      <DialogDescription>
                          Create a new support ticket for your workspace
                      </DialogDescription>
                    </DialogHeader>
                    <CreateTicketForm 
                        workspaceId={safeWorkspaceId}
                      onSuccess={handleTicketCreate}
                      onCancel={() => setIsCreateDialogOpen(false)}
                    />
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-4 mb-6">
              <div className="relative flex-1 max-w-md w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tickets..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="flex space-x-4 w-full sm:w-auto">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="submitted">Submitted</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priority</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Tickets List */}
          <div className="space-y-4">
            {filteredTickets.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No tickets found</h3>
                  <p className="text-muted-foreground mb-4">
                    {searchQuery || statusFilter !== "all" || priorityFilter !== "all"
                      ? "Try adjusting your search or filter criteria"
                      : "Create your first ticket to get started"
                    }
                  </p>
                  <div className="text-sm text-muted-foreground">
                    <p>Total tickets in database: {tickets.length}</p>
                    <p>Workspace ID: {safeWorkspaceId}</p>
                    <p>WebSocket connected: {wsClient.isConnected() ? 'Yes' : 'No'}</p>
                    <p>Last API response: {tickets.length > 0 ? 'Success' : 'Empty response'}</p>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      console.log('Debug: Refreshing tickets manually')
                      loadTickets()
                    }}
                    className="mt-4"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Try Again
                  </Button>
                </CardContent>
              </Card>
            ) : (
                filteredTickets.map((ticket, index) => (
              <Card key={`${ticket.id}-${index}`} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold truncate">{ticket.title}</h3>
                        <Badge className={getStatusColor(ticket.status)}>
                              {getStatusIcon(ticket.status)}
                              <span className="ml-1 capitalize">{ticket.status.replace('_', ' ')}</span>
                            </Badge>
                        <Badge className={getPriorityColor(ticket.priority)}>
                              {ticket.priority.toUpperCase()}
                            </Badge>
                          </div>
                      <p className="text-muted-foreground mb-3 line-clamp-2">
                        {ticket.description}
                      </p>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                            <div className="flex items-center space-x-1">
                          <User className="h-4 w-4" />
                              <span>{ticket.creator_name}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4" />
                          <span>Created {formatDate(ticket.created_at)}</span>
                        </div>
                          {ticket.assigned_to && (
                          <div className="flex items-center space-x-1">
                            <span>Assigned to: {ticket.assignee_name}</span>
                          </div>
                        )}
                            {ticket.due_date && (
                              <div className="flex items-center space-x-1">
                            <Clock className="h-4 w-4" />
                            <span className={ticket.is_overdue ? 'text-red-600 font-medium' : ''}>
                              {formatDueDate(ticket.due_date)}
                            </span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 ml-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedTicket(ticket)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedTicket(ticket)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleTicketDelete(ticket.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Ticket Details Dialog */}
      {selectedTicket && (
        <TicketDetails 
          ticket={selectedTicket}
          onClose={() => setSelectedTicket(null)}
          onUpdate={handleTicketUpdate}
        />
      )}
    </div>
  )
}