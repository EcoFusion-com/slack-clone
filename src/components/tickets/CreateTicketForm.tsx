"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { useApiClient, type Ticket, type TicketCreate } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

const createTicketSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title must be less than 200 characters"),
  description: z.string().min(1, "Description is required").max(2000, "Description must be less than 2000 characters"),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  category: z.string().optional(),
  tags: z.string().optional(),
  due_date: z.date().optional(),
  assigned_to: z.number().optional(),
})

type CreateTicketFormData = z.infer<typeof createTicketSchema>

interface CreateTicketFormProps {
  workspaceId: string;
  onSuccess: (ticket: Ticket) => void;
  onCancel: () => void;
}

export function CreateTicketForm({ workspaceId, onSuccess, onCancel }: CreateTicketFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined)
  const { toast } = useToast()
  const apiClient = useApiClient()

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateTicketFormData>({
    resolver: zodResolver(createTicketSchema),
    defaultValues: {
      priority: 'medium',
    },
  })

  const onSubmit = async (data: CreateTicketFormData) => {
    try {
      setIsLoading(true)
      
      const ticketData: TicketCreate = {
        title: data.title,
        description: data.description,
        priority: data.priority,
        category: data.category || undefined,
        tags: data.tags || undefined,
        due_date: dueDate ? dueDate.toISOString() : undefined,
        workspace_id: workspaceId,
        assigned_to: data.assigned_to?.toString() || undefined,
      }

      const newTicket = await apiClient.createTicket(ticketData)
      onSuccess(newTicket)
      
      toast({
        title: "Ticket created successfully",
        description: `Ticket "${newTicket.title}" has been created`,
      })
    } catch (error) {
      console.error('Failed to create ticket:', error)
      toast({
        title: "Failed to create ticket",
        description: error instanceof Error ? error.message : "An error occurred while creating the ticket",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">Title *</Label>
          <Input
            id="title"
            placeholder="Enter ticket title"
            {...register("title")}
            disabled={isLoading}
          />
          {errors.title && (
            <p className="text-sm text-red-500">{errors.title.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description *</Label>
          <Textarea
            id="description"
            placeholder="Describe the ticket details..."
            rows={4}
            {...register("description")}
            disabled={isLoading}
          />
          {errors.description && (
            <p className="text-sm text-red-500">{errors.description.message}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="priority">Priority *</Label>
            <Select
              value={watch("priority")}
              onValueChange={(value) => setValue("priority", value as any)}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
            {errors.priority && (
              <p className="text-sm text-red-500">{errors.priority.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Input
              id="category"
              placeholder="e.g., Bug, Feature, Task"
              {...register("category")}
              disabled={isLoading}
            />
            {errors.category && (
              <p className="text-sm text-red-500">{errors.category.message}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="tags">Tags</Label>
          <Input
            id="tags"
            placeholder="e.g., frontend, backend, urgent"
            {...register("tags")}
            disabled={isLoading}
          />
          {errors.tags && (
            <p className="text-sm text-red-500">{errors.tags.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Due Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !dueDate && "text-muted-foreground"
                )}
                disabled={isLoading}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dueDate ? format(dueDate, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dueDate}
                onSelect={setDueDate}
                disabled={(date) => date < new Date()}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          {dueDate && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setDueDate(undefined)}
              className="text-xs"
            >
              Clear date
            </Button>
          )}
        </div>
      </div>

      <div className="flex justify-end space-x-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Create Ticket
        </Button>
      </div>
    </form>
  )
}
