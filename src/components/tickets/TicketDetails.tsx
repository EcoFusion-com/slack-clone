"use client"

import React, { useState } from "react"
import { 
  X, 
  Edit, 
  MessageSquare, 
  Calendar, 
  User, 
  Clock, 
  AlertCircle,
  CheckCircle,
  XCircle,
  Paperclip,
  Send,
  MoreVertical
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogPortal, DialogOverlay } from "@/components/ui/dialog"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { cn } from "@/lib/utils"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useApiClient, type Ticket } from "@/lib/api"
import { useAuth, useUser } from "@clerk/clerk-react"
import { useToast } from "@/hooks/use-toast"

interface TicketDetailsProps {
  ticket: Ticket;
  onClose: () => void;
  onUpdate: (ticket: Ticket) => void;
}

export function TicketDetails({ ticket, onClose, onUpdate }: TicketDetailsProps) {
  const [newComment, setNewComment] = useState("")
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  const { user } = useUser()
  const { toast } = useToast()
  const apiClient = useApiClient()

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'in_progress':
        return <AlertCircle className="h-4 w-4 text-blue-500" />
      case 'submitted':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-gray-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'submitted':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'cancelled':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleStatusUpdate = async (newStatus: string) => {
    try {
      setIsUpdatingStatus(true)

      // Map status changes to backend actions
      if (newStatus === 'in_progress') {
        await apiClient.acknowledgeTicket(ticket.id, { comment: undefined })
      } else if (newStatus === 'submitted') {
        await apiClient.submitTicket(ticket.id, { comment: undefined, attachments: [] })
      } else if (newStatus === 'approved') {
        await apiClient.approveTicket(ticket.id, { comment: undefined })
      } else if (newStatus === 'rejected') {
        await apiClient.rejectTicket(ticket.id, { reason: "Rejected by admin", comment: undefined })
      } else {
        // For statuses without a direct endpoint, no-op
      }

      // Reload the ticket from backend to reflect the latest state
      const refreshed = await apiClient.getTicket(ticket.id)
      onUpdate(refreshed)
      toast({
        title: "Status updated",
        description: `Ticket status changed to ${newStatus.replace('_', ' ')}`,
      })
    } catch (error) {
      console.error('Failed to update status:', error)
      toast({
        title: "Failed to update status",
        description: "Could not update ticket status",
        variant: "destructive",
      })
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  const handleAddComment = async () => {
    if (!newComment.trim()) return

    try {
      setIsSubmittingComment(true)
      
      const comment = await apiClient.addTicketComment(ticket.id, {
        content: newComment,
        is_internal: false
      })
      
      // Reload the ticket to get updated comments
      const refreshed = await apiClient.getTicket(ticket.id)
      onUpdate(refreshed)
      
      toast({
        title: "Comment added",
        description: "Your comment has been added to the ticket",
      })
      setNewComment("")
    } catch (error) {
      console.error('Failed to add comment:', error)
      toast({
        title: "Failed to add comment",
        description: "Could not add comment to the ticket",
        variant: "destructive",
      })
    } finally {
      setIsSubmittingComment(false)
    }
  }

  // Custom DialogContent without built-in close button
  const CustomDialogContent = React.forwardRef<
    React.ElementRef<typeof DialogPrimitive.Content>,
    React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
  >(({ className, children, ...props }, ref) => (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(
          "fixed left-[50%] top-[50%] z-50 grid w-full max-w-4xl translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
          className,
        )}
        {...props}
      >
        {children}
      </DialogPrimitive.Content>
    </DialogPortal>
  ))
  CustomDialogContent.displayName = DialogPrimitive.Content.displayName

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <CustomDialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <DialogTitle className="text-xl font-bold">{ticket.title}</DialogTitle>
              <div className="flex items-center space-x-2 mt-2">
                <Badge className={`text-xs ${getStatusColor(ticket.status)}`}>
                  {getStatusIcon(ticket.status)}
                  <span className="ml-1 capitalize">{ticket.status.replace('_', ' ')}</span>
                </Badge>
                <Badge className={`text-xs ${getPriorityColor(ticket.priority)}`}>
                  {ticket.priority.toUpperCase()}
                </Badge>
                {ticket.is_overdue && (
                  <Badge className="text-xs bg-red-100 text-red-800 border-red-200">
                    OVERDUE
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Select
                value={ticket.status}
                onValueChange={handleStatusUpdate}
                disabled={isUpdatingStatus}
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="ghost" size="sm" onClick={onClose} className="shrink-0">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6 overflow-y-auto pr-2">
              {/* Description */}
              <div>
                <h3 className="font-semibold mb-2">Description</h3>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="text-sm whitespace-pre-wrap">{ticket.description}</p>
                </div>
              </div>

              {/* Attachments */}
              {ticket.attachments.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Attachments</h3>
                  <div className="space-y-2">
                    {ticket.attachments.map((attachment) => (
                      <div key={attachment.id} className="flex items-center space-x-2 p-2 bg-muted/50 rounded">
                        <Paperclip className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium truncate">{attachment.original_filename}</span>
                        <span className="text-xs text-muted-foreground shrink-0">({attachment.mime_type})</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Comments */}
              <div className="space-y-4">
                <h3 className="font-semibold">Comments ({ticket.comments.length})</h3>
                <div className="border rounded-lg p-4 max-h-80 overflow-y-auto">
                  <div className="space-y-4">
                    {ticket.comments.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No comments yet. Be the first to comment!
                      </p>
                    ) : (
                      ticket.comments.map((comment) => (
                        <div key={comment.id} className="flex space-x-3">
                          <Avatar className="h-8 w-8 shrink-0">
                            <AvatarImage src={comment.user_avatar} />
                            <AvatarFallback className="text-xs">
                              {comment.user_name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="text-sm font-medium">{comment.user_name}</span>
                              <span className="text-xs text-muted-foreground">
                                {formatDate(comment.created_at)}
                              </span>
                              {comment.is_internal && (
                                <Badge variant="secondary" className="text-xs">
                                  Internal
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm whitespace-pre-wrap break-words">{comment.content}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Add Comment */}
                <div className="space-y-2">
                  <Textarea
                    placeholder="Add a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    rows={3}
                    disabled={isSubmittingComment}
                    className="resize-none"
                  />
                  <div className="flex justify-end">
                    <Button 
                      onClick={handleAddComment}
                      disabled={!newComment.trim() || isSubmittingComment}
                      size="sm"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Add Comment
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6 overflow-y-auto">
              {/* Ticket Info */}
              <div>
                <h3 className="font-semibold mb-3">Ticket Information</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2 text-sm">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Created by:</span>
                    <span className="font-medium">{ticket.creator_name}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Created:</span>
                    <span className="font-medium">{formatDate(ticket.created_at)}</span>
                  </div>
                  {ticket.due_date && (
                    <div className="flex items-center space-x-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Due:</span>
                      <span className={`font-medium ${ticket.is_overdue ? 'text-red-600' : ''}`}>
                        {formatDate(ticket.due_date)}
                      </span>
                    </div>
                  )}
                  {ticket.assigned_to && (
                    <div className="flex items-center space-x-2 text-sm">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Assigned to:</span>
                      <span className="font-medium">{ticket.assignee_name}</span>
                    </div>
                  )}
                  {ticket.category && (
                    <div className="flex items-center space-x-2 text-sm">
                      <span className="text-muted-foreground">Category:</span>
                      <span className="font-medium">{ticket.category}</span>
                    </div>
                  )}
                  {ticket.tags && (
                    <div className="flex items-center space-x-2 text-sm">
                      <span className="text-muted-foreground">Tags:</span>
                      <span className="font-medium">{ticket.tags}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* History */}
              {ticket.history.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3">History</h3>
                  <ScrollArea className="h-48">
                    <div className="space-y-3">
                      {ticket.history.map((entry) => (
                        <div key={entry.id} className="text-sm">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">{entry.user_name || 'System'}</span>
                            <span className="text-muted-foreground">
                              {formatDate(entry.created_at)}
                            </span>
                          </div>
                          <p className="text-muted-foreground mt-1">{entry.description}</p>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}
            </div>
          </div>
        </div>
      </CustomDialogContent>
    </Dialog>
  )
}
