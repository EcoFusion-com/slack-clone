"use client"

import { useState } from "react"
import { 
  Plus, 
  Users, 
  FileText, 
  BarChart3, 
  Settings, 
  MessageSquare 
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { CreateTicketForm } from "@/components/tickets/CreateTicketForm"
import { useApiClient, type Ticket } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

interface QuickActionsProps {
  workspaceId?: string
  className?: string
}

export function QuickActions({ workspaceId = "1", className }: QuickActionsProps) {
  const [isCreateTicketOpen, setIsCreateTicketOpen] = useState(false)
  const apiClient = useApiClient()
  const { toast } = useToast()

  const handleTicketCreate = (ticket: Ticket) => {
    setIsCreateTicketOpen(false)
    toast({
      title: "Ticket created successfully",
      description: `Ticket "${ticket.title}" has been created`,
    })
  }

  const actions = [
    {
      title: "New Ticket",
      description: "Create a new support ticket",
      icon: Plus,
      onClick: () => setIsCreateTicketOpen(true),
      variant: "default" as const
    },
    {
      title: "View Users",
      description: "Manage team members",
      icon: Users,
      onClick: () => {
        // Navigate to people view - this would be handled by parent
        toast({
          title: "Navigate to Users",
          description: "This would navigate to the People view",
        })
      },
      variant: "outline" as const
    },
    {
      title: "Reports",
      description: "View analytics and reports",
      icon: BarChart3,
      onClick: () => {
        toast({
          title: "Reports",
          description: "This would open the reports view",
        })
      },
      variant: "outline" as const
    },
    {
      title: "Messages",
      description: "View recent messages",
      icon: MessageSquare,
      onClick: () => {
        toast({
          title: "Messages",
          description: "This would navigate to the chat view",
        })
      },
      variant: "outline" as const
    },
    {
      title: "Documents",
      description: "Manage documents",
      icon: FileText,
      onClick: () => {
        toast({
          title: "Documents",
          description: "This would open document management",
        })
      },
      variant: "outline" as const
    },
    {
      title: "Settings",
      description: "Configure dashboard",
      icon: Settings,
      onClick: () => {
        toast({
          title: "Settings",
          description: "This would open dashboard settings",
        })
      },
      variant: "outline" as const
    }
  ]

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>
          Common tasks and shortcuts
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {actions.map((action, index) => (
            <Button
              key={action.title}
              variant={action.variant}
              onClick={action.onClick}
              className="h-auto p-4 flex flex-col items-start space-y-2"
              aria-label={action.description}
            >
              <action.icon className="h-5 w-5" />
              <div className="text-left">
                <div className="font-medium text-sm">{action.title}</div>
                <div className="text-xs text-muted-foreground">
                  {action.description}
                </div>
              </div>
            </Button>
          ))}
        </div>

        {/* Create Ticket Dialog */}
        <Dialog open={isCreateTicketOpen} onOpenChange={setIsCreateTicketOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Ticket</DialogTitle>
              <DialogDescription>
                Create a new support ticket for your workspace
              </DialogDescription>
            </DialogHeader>
            <CreateTicketForm 
              workspaceId={workspaceId}
              onSuccess={handleTicketCreate}
              onCancel={() => setIsCreateTicketOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
