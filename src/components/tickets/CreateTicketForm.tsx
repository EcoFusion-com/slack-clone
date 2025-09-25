"use client"

import { useState, useEffect, useCallback } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MessageInputWithMentions } from "@/components/mentions/MessageInputWithMentions"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { useApiClient, type Ticket, type TicketCreate, type User } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

const createTicketSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title must be less than 200 characters"),
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
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [isLoadingUsers, setIsLoadingUsers] = useState(false)
  const [description, setDescription] = useState("")
  const [mentions, setMentions] = useState<Array<{ userId: string; username: string; start: number; end: number }>>([])
  const { toast } = useToast()
  const apiClient = useApiClient()

  // Auto-save key for localStorage
  const AUTO_SAVE_KEY = `ticket-form-draft-${workspaceId}`

  // Load users for assignment
  const loadUsers = useCallback(async () => {
    if (isLoadingUsers) return
    
    try {
      setIsLoadingUsers(true)
      const usersData = await apiClient.getUsers()
      setUsers(usersData)
      console.log('👥 Loaded users for assignment:', usersData.length)
    } catch (error) {
      console.error('Failed to load users:', error)
      toast({
        title: "Error",
        description: "Failed to load users for assignment",
        variant: "destructive"
      })
    } finally {
      setIsLoadingUsers(false)
    }
  }, [apiClient, toast]) // ✅ Removed isLoadingUsers from dependencies to prevent infinite loop

  // Load users on component mount
  useEffect(() => {
    loadUsers()
  }, []) // ✅ Empty dependency array to run only once on mount

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

  // Load saved draft on component mount
  useEffect(() => {
    const savedDraft = localStorage.getItem(AUTO_SAVE_KEY)
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft)
        console.log('📄 Loading saved draft:', draft)
        
        // Restore form values
        if (draft.title) setValue('title', draft.title)
        if (draft.priority) setValue('priority', draft.priority)
        if (draft.category) setValue('category', draft.category)
        if (draft.tags) setValue('tags', draft.tags)
        if (draft.assigned_to) setValue('assigned_to', draft.assigned_to)
        if (draft.description) setDescription(draft.description)
        if (draft.mentions) setMentions(draft.mentions)
        
        // Restore due date
        if (draft.due_date) setDueDate(new Date(draft.due_date))
        
        // Restore last saved time
        if (draft.lastSaved) setLastSaved(new Date(draft.lastSaved))
        
        setHasUnsavedChanges(true)
        
        toast({
          title: "Draft restored",
          description: "Your previous work has been restored",
        })
      } catch (error) {
        console.error('Failed to load draft:', error)
        localStorage.removeItem(AUTO_SAVE_KEY)
      }
    }
  }, [AUTO_SAVE_KEY, setValue, toast])

  // Auto-save function
  const autoSave = useCallback(() => {
    const formData = watch()
    const draft = {
      title: formData.title || '',
      priority: formData.priority || 'medium',
      category: formData.category || '',
      tags: formData.tags || '',
      assigned_to: formData.assigned_to || undefined,
      description: description,
      mentions: mentions,
      due_date: dueDate?.toISOString() || undefined,
      lastSaved: new Date().toISOString(),
    }
    
    localStorage.setItem(AUTO_SAVE_KEY, JSON.stringify(draft))
    setLastSaved(new Date())
    setHasUnsavedChanges(false)
    console.log('💾 Auto-saved draft')
  }, [watch, dueDate, AUTO_SAVE_KEY]) // ✅ Removed description and mentions from dependencies to prevent infinite loop

  // Auto-save every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (hasUnsavedChanges) {
        autoSave()
      }
    }, 30000) // 30 seconds

    return () => clearInterval(interval)
  }, [autoSave, hasUnsavedChanges])

  // Clear draft on successful submission
  const clearDraft = useCallback(() => {
    localStorage.removeItem(AUTO_SAVE_KEY)
    setLastSaved(null)
    setHasUnsavedChanges(false)
  }, [AUTO_SAVE_KEY])

  // Track form changes for auto-save
  const handleFormChange = useCallback(() => {
    setHasUnsavedChanges(true)
  }, [])

  // Handle description changes from MessageInputWithMentions
  const handleDescriptionChange = useCallback((content: string, newMentions?: Array<{ userId: string; username: string; start: number; end: number }>) => {
    setDescription(content)
    if (newMentions) {
      setMentions(newMentions)
    }
    setHasUnsavedChanges(true)
  }, [])

  // Handle description input (prevent clearing on Enter)
  const handleDescriptionInput = useCallback((content: string, newMentions?: Array<{ userId: string; username: string; start: number; end: number }>) => {
    setDescription(content)
    if (newMentions) {
      setMentions(newMentions)
    }
    setHasUnsavedChanges(true)
    // Don't clear the input - this is for form input, not message sending
  }, [])

  // Auto-save on form changes (debounced)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (hasUnsavedChanges) {
        autoSave()
      }
    }, 2000) // 2 second debounce

    return () => clearTimeout(timeoutId)
  }, [hasUnsavedChanges, autoSave])

  const onSubmit = async (data: CreateTicketFormData) => {
    // Validate description
    if (!description.trim()) {
      toast({
        title: "Description required",
        description: "Please provide a description for the ticket",
        variant: "destructive"
      })
      return
    }

    try {
      setIsLoading(true)
      
      const ticketData: TicketCreate = {
        title: data.title,
        description: description.trim(),
        priority: data.priority,
        category: data.category || undefined,
        tags: data.tags || undefined,
        due_date: dueDate ? dueDate.toISOString() : undefined,
        workspace_id: workspaceId,
        assigned_to: data.assigned_to?.toString() || undefined,
      }

      const newTicket = await apiClient.createTicket(ticketData)
      
      // Clear draft on successful submission
      clearDraft()
      
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
      {/* Auto-save status indicator */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <div className="flex items-center space-x-2">
          {hasUnsavedChanges ? (
            <span className="text-amber-600">● Unsaved changes</span>
          ) : lastSaved ? (
            <span className="text-green-600">✓ Saved {lastSaved.toLocaleTimeString()}</span>
          ) : null}
        </div>
        <div className="text-xs">
          Auto-saves every 30 seconds
        </div>
      </div>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">Title *</Label>
          <Input
            id="title"
            placeholder="Enter ticket title"
            {...register("title")}
            onChange={(e) => {
              register("title").onChange(e)
              handleFormChange()
            }}
            disabled={isLoading}
          />
          {errors.title && (
            <p className="text-sm text-red-500">{errors.title.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description *</Label>
          <MessageInputWithMentions
            onSendMessage={handleDescriptionInput}
            placeholder="Describe the ticket details... (use @username to mention someone)"
            disabled={isLoading}
            autoSaveKey={`ticket-description-draft-${workspaceId}`}
            onDraftChange={handleDescriptionChange}
            showSendButton={false}
          />
          {!description.trim() && (
            <p className="text-sm text-red-500">Description is required</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="priority">Priority *</Label>
            <Select
              value={watch("priority")}
              onValueChange={(value) => {
                setValue("priority", value as any)
                handleFormChange()
              }}
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
              onChange={(e) => {
                register("category").onChange(e)
                handleFormChange()
              }}
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
            onChange={(e) => {
              register("tags").onChange(e)
              handleFormChange()
            }}
            disabled={isLoading}
          />
          {errors.tags && (
            <p className="text-sm text-red-500">{errors.tags.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="assigned_to">Assign to</Label>
          <Select
            value={watch("assigned_to")?.toString() || "none"}
            onValueChange={(value) => {
              setValue("assigned_to", value === "none" ? undefined : parseInt(value))
              handleFormChange()
            }}
            disabled={isLoading || isLoadingUsers}
          >
            <SelectTrigger>
              <SelectValue placeholder={isLoadingUsers ? "Loading users..." : "Select a user (optional)"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No assignment</SelectItem>
              {users.map((user) => (
                <SelectItem key={user.id} value={user.id.toString()}>
                  <div className="flex items-center space-x-2">
                    <span>{user.full_name || user.username || user.email}</span>
                    <span className="text-xs text-muted-foreground">({user.email})</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.assigned_to && (
            <p className="text-sm text-red-500">{errors.assigned_to.message}</p>
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
                onSelect={(date) => {
                  setDueDate(date)
                  handleFormChange()
                }}
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
              onClick={() => {
                setDueDate(undefined)
                handleFormChange()
              }}
              className="text-xs"
            >
              Clear date
            </Button>
          )}
        </div>
      </div>

      <div className="flex justify-between items-center">
        <div className="flex space-x-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={autoSave}
            disabled={isLoading || !hasUnsavedChanges}
            className="text-xs"
          >
            💾 Save Draft
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              if (confirm('Are you sure you want to clear the draft? This action cannot be undone.')) {
                clearDraft()
                setDueDate(undefined)
                setValue('title', '')
                setValue('category', '')
                setValue('tags', '')
                setValue('priority', 'medium')
                setDescription('')
                setMentions([])
                toast({
                  title: "Draft cleared",
                  description: "All form data has been cleared",
                })
              }
            }}
            disabled={isLoading}
            className="text-xs text-red-600 hover:text-red-700"
          >
            🗑️ Clear Draft
          </Button>
        </div>
        
        <div className="flex space-x-2">
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
      </div>
    </form>
  )
}
