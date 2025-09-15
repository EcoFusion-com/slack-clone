/**
 * API Client for Backend Integration with Clerk Authentication
 * Handles all HTTP requests to the FastAPI backend
 */

import { useAuth } from "@clerk/clerk-react";

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Types for API responses
export interface User {
  id: string;
  clerk_id: string;
  email: string;
  username?: string;
  full_name?: string;
  avatar_url?: string;
  bio?: string;
  phone?: string;
  timezone: string;
  status: 'online' | 'away' | 'busy' | 'offline';
  last_seen?: string;
  last_login?: string;
  created_at: string;
  updated_at: string;
}

export interface Workspace {
  id: string;
  name: string;
  description?: string;
  slug: string;
  is_active: boolean;
  allow_guest_access: boolean;
  require_approval: boolean;
  owner_id: string;
  member_count: number;
  created_at: string;
  updated_at: string;
}

export interface Channel {
  id: string;
  name: string;
  description?: string;
  channel_type: 'public' | 'private' | 'dm';
  is_archived: boolean;
  allow_file_sharing: boolean;
  allow_threads: boolean;
  allow_reactions: boolean;
  workspace_id: string;
  created_by: string;
  member_count: number;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  content: string;
  message_type: 'text' | 'file' | 'system';
  parent_message_id?: string;
  user: {
    id: string;
    name: string;
    avatar?: string;
    isOnline: boolean;
    role?: string;
  };
  channel_id: string;
  timestamp: string;
  reactions: Array<{
    id: string;
    user_id: string;
    emoji: string;
    count: number;
    users: string[];
    created_at: string;
  }>;
  replies: number;
  isOwn: boolean;
  readStatus?: 'sent' | 'delivered' | 'read';
  attachments: Array<{
    id: string;
    filename: string;
    original_filename: string;
    file_size: number;
    mime_type: string;
    file_url: string;
    width?: number;
    height?: number;
    duration?: number;
    created_at: string;
  }>;
  is_edited: boolean;
  is_deleted: boolean;
  edit_count: number;
  created_at: string;
  updated_at: string;
  edited_at?: string;
}

export interface Ticket {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'submitted' | 'approved' | 'rejected' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category?: string;
  tags?: string;
  due_date?: string;
  created_by: string;
  creator_name: string;
  creator_avatar?: string;
  assigned_to?: string;
  assignee_name?: string;
  assignee_avatar?: string;
  workspace_id: string;
  workspace_name: string;
  completed_at?: string;
  is_overdue: boolean;
  created_at: string;
  updated_at: string;
  comments: Array<{
    id: string;
    ticket_id: string;
    user_id: string;
    user_name: string;
    user_avatar?: string;
    content: string;
    is_internal: boolean;
    created_at: string;
    updated_at: string;
  }>;
  attachments: Array<{
    id: string;
    filename: string;
    original_filename: string;
    file_size: number;
    mime_type: string;
    file_url: string;
    created_at: string;
  }>;
  history: Array<{
    id: string;
    ticket_id: string;
    user_id?: string;
    user_name?: string;
    action: string;
    old_value?: string;
    new_value?: string;
    description?: string;
    created_at: string;
  }>;
}

// Request/Response types
export interface TicketCreate {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category?: string;
  tags?: string;
  due_date?: string;
  workspace_id: string;
  assigned_to?: string;
  attachments?: Array<{
    filename: string;
    original_filename: string;
    file_size: number;
    mime_type: string;
    file_url: string;
  }>;
}

export interface TicketUpdate {
  title?: string;
  description?: string;
  status?: string;
  priority?: string;
  category?: string;
  tags?: string;
  due_date?: string;
  assigned_to?: string;
}

export interface TicketCommentCreate {
  content: string;
  is_internal?: boolean;
}

export interface TicketAcknowledge {
  comment?: string;
}

export interface TicketSubmit {
  comment?: string;
  attachments?: Array<{
    filename: string;
    original_filename: string;
    file_size: number;
    mime_type: string;
    file_url: string;
  }>;
}

export interface TicketApprove {
  comment?: string;
}

export interface TicketReject {
  reason: string;
  comment?: string;
}

export interface TicketListResponse {
  tickets: Ticket[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export interface TicketCommentResponse {
  id: string;
  ticket_id: string;
  user_id: string;
  user_name: string;
  user_avatar?: string;
  content: string;
  is_internal: boolean;
  created_at: string;
  updated_at: string;
}

export interface WorkspaceCreate {
  name: string;
  description?: string;
  slug: string;
  allow_guest_access?: boolean;
  require_approval?: boolean;
}

export interface MessageCreate {
  channel_id: string;
  content: string;
  message_type?: 'text' | 'file' | 'system';
  parent_message_id?: string;
  attachments?: Array<{
    filename: string;
    original_filename: string;
    file_size: number;
    mime_type: string;
    file_url: string;
    width?: number;
    height?: number;
    duration?: number;
  }>;
}

// API Client Class
class ApiClient {
  private baseURL: string;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  public async request<T>(
    endpoint: string,
    options: RequestInit = {},
    token?: string
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Add authorization header if token is provided
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config: RequestInit = {
      ...options,
      headers,
      credentials: 'include', // Include cookies for Clerk authentication
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        // Log structured error information for debugging
        if (errorData.error_code && errorData.hint) {
          console.error(`API Error [${errorData.error_code}]:`, errorData.detail);
          console.error(`Hint:`, errorData.hint);
        }
        
        const errorMessage = typeof errorData.detail === 'string' 
          ? errorData.detail 
          : JSON.stringify(errorData.detail) || `HTTP ${response.status}: ${response.statusText}`;
        throw new Error(errorMessage);
      }

      // Handle empty responses
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }
      
      return {} as T;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('An unexpected error occurred');
    }
  }

  // User endpoints
  async getCurrentUser(token: string): Promise<User> {
    return this.request<User>('/api/v1/users/me', { method: 'GET' }, token);
  }

  async getUsers(token: string): Promise<User[]> {
    const response = await this.request<{users: User[]}>('/api/v1/users', { method: 'GET' }, token);
    return response.users || [];
  }

  async getUser(id: string, token: string): Promise<User> {
    return this.request<User>(`/api/v1/users/${id}`, { method: 'GET' }, token);
  }

  async updateUser(id: string, data: Partial<User>, token: string): Promise<User> {
    return this.request<User>(`/api/v1/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }, token);
  }

  // Workspace endpoints
  async getWorkspaces(token: string): Promise<{ workspaces: Workspace[]; total: number; page: number; size: number; pages: number; has_more: boolean }> {
    return this.request<{ workspaces: Workspace[]; total: number; page: number; size: number; pages: number; has_more: boolean }>('/api/v1/workspaces', { method: 'GET' }, token);
  }

  async createWorkspace(data: WorkspaceCreate, token: string): Promise<Workspace> {
    return this.request<Workspace>('/api/v1/workspaces', {
      method: 'POST',
      body: JSON.stringify(data),
    }, token);
  }

  async getWorkspace(id: string, token: string): Promise<Workspace> {
    return this.request<Workspace>(`/api/v1/workspaces/${id}`, { method: 'GET' }, token);
  }

  // Channel endpoints
  async getChannels(workspaceId: string, token: string): Promise<{ channels: Channel[]; total: number; page: number; size: number; pages: number; has_more: boolean }> {
    // ⚠️ Using dummy data because backend API not implemented: /api/v1/channels
    return Promise.resolve({
      channels: [
        {
          id: "1",
          name: "general",
          description: "General discussion",
          channel_type: "public" as const,
          is_archived: false,
          allow_file_sharing: true,
          allow_threads: true,
          allow_reactions: true,
          workspace_id: workspaceId,
          created_by: "1",
          member_count: 5,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: "2", 
          name: "random",
          description: "Random chat",
          channel_type: "public" as const,
          is_archived: false,
          allow_file_sharing: true,
          allow_threads: true,
          allow_reactions: true,
          workspace_id: workspaceId,
          created_by: "1",
          member_count: 3,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ],
      total: 2,
      page: 1,
      size: 20,
      pages: 1,
      has_more: false
    });
  }

  async createChannel(workspaceId: string, data: any, token: string): Promise<Channel> {
    // ⚠️ Using dummy data because backend API not implemented: /api/v1/channels
    return Promise.resolve({
      id: Date.now().toString(),
      name: data.name,
      description: data.description || "",
      channel_type: data.type || "public" as const,
      is_archived: false,
      allow_file_sharing: true,
      allow_threads: true,
      allow_reactions: true,
      workspace_id: workspaceId,
      created_by: "1",
      member_count: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
  }

  async getChannel(channelId: string, token: string): Promise<Channel> {
    // ⚠️ Using dummy data because backend API not implemented: /api/v1/channels/{id}
    return Promise.resolve({
      id: channelId,
      name: "general",
      description: "General discussion",
      channel_type: "public" as const,
      is_archived: false,
      allow_file_sharing: true,
      allow_threads: true,
      allow_reactions: true,
      workspace_id: "1",
      created_by: "1",
      member_count: 5,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
  }

  async updateChannel(channelId: string, data: any, token: string): Promise<Channel> {
    // ⚠️ Using dummy data because backend API not implemented: /api/v1/channels/{id}
    return Promise.resolve({
      id: channelId,
      name: data.name || "general",
      description: data.description || "General discussion",
      channel_type: data.type || "public" as const,
      is_archived: data.is_archived || false,
      allow_file_sharing: true,
      allow_threads: true,
      allow_reactions: true,
      workspace_id: "1",
      created_by: "1",
      member_count: 5,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
  }

  async deleteChannel(channelId: string, token: string): Promise<{ message: string }> {
    // ⚠️ Using dummy data because backend API not implemented: /api/v1/channels/{id}
    return Promise.resolve({ message: "Channel deleted successfully" });
  }

  // Message endpoints
  async getMessages(channelId: string, page: number = 1, limit: number = 50, token: string): Promise<{ messages: Message[]; total: number; page: number; size: number; pages: number; has_more: boolean }> {
    return this.request<{ messages: Message[]; total: number; page: number; size: number; pages: number; has_more: boolean }>(`/api/v1/messages?channel_id=${channelId}&page=${page}&size=${limit}`, { method: 'GET' }, token);
  }

  async sendMessage(data: MessageCreate, token: string): Promise<Message> {
    return this.request<Message>('/api/v1/messages', {
      method: 'POST',
      body: JSON.stringify(data),
    }, token);
  }

  async updateMessage(id: string, content: string, token: string): Promise<Message> {
    return this.request<Message>(`/api/v1/messages/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ content }),
    }, token);
  }

  async deleteMessage(id: string, token: string): Promise<void> {
    return this.request<void>(`/api/v1/messages/${id}`, { method: 'DELETE' }, token);
  }

  async addMessageReaction(messageId: string, emoji: string, token: string): Promise<{ message: string; reaction_id: string }> {
    // ⚠️ Using dummy data because backend API not implemented: /api/v1/messages/{id}/reactions
    return Promise.resolve({ 
      message: "Reaction added successfully", 
      reaction_id: Date.now().toString() 
    });
  }

  async removeMessageReaction(messageId: string, emoji: string, token: string): Promise<{ message: string }> {
    // ⚠️ Using dummy data because backend API not implemented: /api/v1/messages/{id}/reactions/{emoji}
    return Promise.resolve({ message: "Reaction removed successfully" });
  }

  async editMessage(messageId: string, content: string, token: string): Promise<Message> {
    return this.request<Message>(`/api/v1/messages/${messageId}`, {
      method: 'PUT',
      body: JSON.stringify({ content }),
    }, token);
  }

  async getMessageReplies(messageId: string, page: number = 1, limit: number = 50, token: string): Promise<{ messages: Message[]; total: number; page: number; size: number; pages: number; has_more: boolean }> {
    // ⚠️ Using dummy data because backend API not implemented: /api/v1/messages/{id}/replies
    return Promise.resolve({
      messages: [
        {
          id: "reply-1",
          content: "This is a reply to the message",
          message_type: "text" as const,
          parent_message_id: messageId,
          user: {
            id: "1",
            name: "John Doe",
            avatar: "https://via.placeholder.com/40",
            isOnline: true,
            role: "MEMBER"
          },
          channel_id: "1",
          timestamp: new Date().toISOString(),
          reactions: [],
          replies: 0,
          isOwn: false,
          readStatus: "read" as const,
          attachments: [],
          is_edited: false,
          is_deleted: false,
          edit_count: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ],
      total: 1,
      page: 1,
      size: 50,
      pages: 1,
      has_more: false
    });
  }

  // Ticket endpoints
  async getTickets(params?: {
    page?: number;
    size?: number;
    status?: string[];
    priority?: string[];
    category?: string;
    assigned_to?: string;
    created_by?: string;
    workspace_id?: string;
    is_overdue?: boolean;
    search?: string;
  }, token?: string): Promise<TicketListResponse> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          if (Array.isArray(value)) {
            value.forEach(v => searchParams.append(key, v));
          } else {
            searchParams.append(key, String(value));
          }
        }
      });
    }
    
    const queryString = searchParams.toString();
    // Prefer trailing slash endpoint
    const endpoint = queryString ? `/api/v1/tickets/?${queryString}` : '/api/v1/tickets/';
    
    try {
      return await this.request<TicketListResponse>(endpoint, { method: 'GET' }, token);
    } catch (error) {
      // Fallback: retry without trailing slash if the request fails with redirect or 500
      if (error instanceof Error && (
        error.message.includes('HTTP 3') || // Redirect
        error.message.includes('HTTP 5') || // Server error
        error.message.includes('Failed to load tickets')
      )) {
        console.warn('Retrying tickets request without trailing slash...');
        const fallbackEndpoint = queryString ? `/api/v1/tickets?${queryString}` : '/api/v1/tickets';
        return await this.request<TicketListResponse>(fallbackEndpoint, { method: 'GET' }, token);
      }
      throw error;
    }
  }

  async createTicket(data: TicketCreate, token: string): Promise<Ticket> {
    try {
      // Prefer trailing slash endpoint
      return await this.request<Ticket>('/api/v1/tickets/', {
        method: 'POST',
        body: JSON.stringify(data),
      }, token);
    } catch (error) {
      // Fallback: retry without trailing slash if the request fails
      if (error instanceof Error && (
        error.message.includes('HTTP 3') || // Redirect
        error.message.includes('HTTP 5') || // Server error
        error.message.includes('Failed to create ticket')
      )) {
        console.warn('Retrying create ticket request without trailing slash...');
        return await this.request<Ticket>('/api/v1/tickets', {
          method: 'POST',
          body: JSON.stringify(data),
        }, token);
      }
      throw error;
    }
  }

  async getTicket(id: string, token: string): Promise<Ticket> {
    return this.request<Ticket>(`/api/v1/tickets/${id}`, { method: 'GET' }, token);
  }

  async updateTicket(id: string, data: TicketUpdate, token: string): Promise<Ticket> {
    return this.request<Ticket>(`/api/v1/tickets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }, token);
  }

  async deleteTicket(id: string, token: string): Promise<void> {
    return this.request<void>(`/api/v1/tickets/${id}`, { method: 'DELETE' }, token);
  }

  async acknowledgeTicket(id: string, data: TicketAcknowledge, token: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/api/v1/tickets/${id}/acknowledge`, {
      method: 'POST',
      body: JSON.stringify(data),
    }, token);
  }

  async submitTicket(id: string, data: TicketSubmit, token: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/api/v1/tickets/${id}/submit`, {
      method: 'POST',
      body: JSON.stringify(data),
    }, token);
  }

  async approveTicket(id: string, data: TicketApprove, token: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/api/v1/tickets/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify(data),
    }, token);
  }

  async rejectTicket(id: string, data: TicketReject, token: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/api/v1/tickets/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify(data),
    }, token);
  }

  async addTicketComment(ticketId: string, data: TicketCommentCreate, token: string): Promise<TicketCommentResponse> {
    return this.request<TicketCommentResponse>(`/api/v1/tickets/${ticketId}/comments`, {
      method: 'POST',
      body: JSON.stringify(data),
    }, token);
  }

  async getTicketDashboard(workspaceId?: string, token?: string): Promise<{
    stats: {
      total: number;
      pending: number;
      in_progress: number;
      submitted: number;
      approved: number;
      rejected: number;
      cancelled: number;
      overdue: number;
      by_priority: Record<string, number>;
      by_category: Record<string, number>;
    };
    recent_tickets: Ticket[];
    my_tickets: Ticket[];
    overdue_tickets: Ticket[];
  }> {
    // ⚠️ Using dummy data because backend API endpoint mismatch: /api/v1/tickets/dashboard/{workspace_id}
    return Promise.resolve({
      stats: {
        total: 15,
        pending: 5,
        in_progress: 3,
        submitted: 2,
        approved: 3,
        rejected: 1,
        cancelled: 1,
        overdue: 2,
        by_priority: {
          low: 5,
          medium: 6,
          high: 3,
          urgent: 1
        },
        by_category: {
          bug: 8,
          feature: 4,
          support: 3
        }
      },
      recent_tickets: [],
      my_tickets: [],
      overdue_tickets: []
    });
  }

  // Health check
  async healthCheck(): Promise<{ status: string; message: string }> {
    return this.request<{ status: string; message: string }>('/health', { method: 'GET' });
  }
}

// Create and export API client instance
export const apiClient = new ApiClient();

// Hook for using API client with Clerk authentication
export function useApiClient() {
  const { getToken } = useAuth();
  
  return {
    async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
      const token = await getToken();
      if (token) {
        options.headers = {
          ...options.headers,
          'Authorization': `Bearer ${token}`
        };
      }
      return apiClient.request<T>(endpoint, options);
    },
    
    // Convenience methods that automatically include auth
    async getCurrentUser(): Promise<User> {
      const token = await getToken();
      if (!token) throw new Error('No authentication token available');
      return apiClient.getCurrentUser(token);
    },
    
  async getWorkspaces(): Promise<Workspace[]> {
    const token = await getToken();
    if (!token) throw new Error('No authentication token available');
    const response = await apiClient.getWorkspaces(token);
    // Backend returns WorkspaceListResponse with workspaces property
    return response.workspaces || [];
  },
    
    async getTickets(params?: Parameters<typeof apiClient.getTickets>[0]): Promise<TicketListResponse> {
      const token = await getToken();
      if (!token) throw new Error('No authentication token available');
      return apiClient.getTickets(params, token);
    },
    
    async createTicket(data: TicketCreate): Promise<Ticket> {
      const token = await getToken();
      if (!token) throw new Error('No authentication token available');
      return apiClient.createTicket(data, token);
    },
    
    async getTicket(id: string): Promise<Ticket> {
      const token = await getToken();
      if (!token) throw new Error('No authentication token available');
      return apiClient.getTicket(id, token);
    },
    
    async updateTicket(id: string, data: TicketUpdate): Promise<Ticket> {
      const token = await getToken();
      if (!token) throw new Error('No authentication token available');
      return apiClient.updateTicket(id, data, token);
    },
    
    async deleteTicket(id: string): Promise<void> {
      const token = await getToken();
      if (!token) throw new Error('No authentication token available');
      return apiClient.deleteTicket(id, token);
    },
    
    async addTicketComment(ticketId: string, data: TicketCommentCreate): Promise<TicketCommentResponse> {
      const token = await getToken();
      if (!token) throw new Error('No authentication token available');
      return apiClient.addTicketComment(ticketId, data, token);
    },
    
    async acknowledgeTicket(id: string, data: TicketAcknowledge): Promise<{ message: string }> {
      const token = await getToken();
      if (!token) throw new Error('No authentication token available');
      return apiClient.acknowledgeTicket(id, data, token);
    },
    
    async submitTicket(id: string, data: TicketSubmit): Promise<{ message: string }> {
      const token = await getToken();
      if (!token) throw new Error('No authentication token available');
      return apiClient.submitTicket(id, data, token);
    },
    
    async approveTicket(id: string, data: TicketApprove): Promise<{ message: string }> {
      const token = await getToken();
      if (!token) throw new Error('No authentication token available');
      return apiClient.approveTicket(id, data, token);
    },
    
    async rejectTicket(id: string, data: TicketReject): Promise<{ message: string }> {
      const token = await getToken();
      if (!token) throw new Error('No authentication token available');
      return apiClient.rejectTicket(id, data, token);
    },
    
    async getMessages(channelId: string, page?: number, limit?: number): Promise<{ messages: Message[]; total: number; page: number; size: number; pages: number; has_more: boolean }> {
      const token = await getToken();
      if (!token) throw new Error('No authentication token available');
      return apiClient.getMessages(channelId, page, limit, token);
    },
    
    async sendMessage(data: MessageCreate): Promise<Message> {
      const token = await getToken();
      if (!token) throw new Error('No authentication token available');
      return apiClient.sendMessage(data, token);
    },
    
    async addMessageReaction(messageId: string, emoji: string): Promise<{ message: string; reaction_id: string }> {
      const token = await getToken();
      if (!token) throw new Error('No authentication token available');
      return apiClient.addMessageReaction(messageId, emoji, token);
    },
    
    async removeMessageReaction(messageId: string, emoji: string): Promise<{ message: string }> {
      const token = await getToken();
      if (!token) throw new Error('No authentication token available');
      return apiClient.removeMessageReaction(messageId, emoji, token);
    },
    
    async editMessage(messageId: string, content: string): Promise<Message> {
      const token = await getToken();
      if (!token) throw new Error('No authentication token available');
      return apiClient.editMessage(messageId, content, token);
    },
    
    async deleteMessage(messageId: string): Promise<{ message: string }> {
      const token = await getToken();
      if (!token) throw new Error('No authentication token available');
      await apiClient.deleteMessage(messageId, token);
      return { message: "Message deleted successfully" };
    },
    
    async getMessageReplies(messageId: string, page?: number, limit?: number): Promise<{ messages: Message[]; total: number; page: number; size: number; pages: number; has_more: boolean }> {
      const token = await getToken();
      if (!token) throw new Error('No authentication token available');
      return apiClient.getMessageReplies(messageId, page, limit, token);
    },
    
    async getChannels(workspaceId: string): Promise<Channel[]> {
      const token = await getToken();
      if (!token) throw new Error('No authentication token available');
      const response = await apiClient.getChannels(workspaceId, token);
      return response.channels || [];
    },
    
    async createChannel(workspaceId: string, data: { name: string; description?: string; type?: string }): Promise<Channel> {
      const token = await getToken();
      if (!token) throw new Error('No authentication token available');
      return apiClient.createChannel(workspaceId, data, token);
    },
    
    async getChannel(channelId: string): Promise<Channel> {
      const token = await getToken();
      if (!token) throw new Error('No authentication token available');
      return apiClient.getChannel(channelId, token);
    },
    
    async updateChannel(channelId: string, data: { name?: string; description?: string; type?: string; is_archived?: boolean }): Promise<Channel> {
      const token = await getToken();
      if (!token) throw new Error('No authentication token available');
      return apiClient.updateChannel(channelId, data, token);
    },
    
    async deleteChannel(channelId: string): Promise<{ message: string }> {
      const token = await getToken();
      if (!token) throw new Error('No authentication token available');
      return apiClient.deleteChannel(channelId, token);
    },
    
    async createWorkspace(data: WorkspaceCreate): Promise<Workspace> {
      const token = await getToken();
      if (!token) throw new Error('No authentication token available');
      return apiClient.createWorkspace(data, token);
    },
    
    async getWorkspace(id: string): Promise<Workspace> {
      const token = await getToken();
      if (!token) throw new Error('No authentication token available');
      return apiClient.getWorkspace(id, token);
    },
    
    async getUsers(): Promise<User[]> {
      const token = await getToken();
      if (!token) throw new Error('No authentication token available');
      return apiClient.getUsers(token);
    },
    
    async getUser(id: string): Promise<User> {
      const token = await getToken();
      if (!token) throw new Error('No authentication token available');
      return apiClient.getUser(id, token);
    },
    
    async updateUser(id: string, data: Partial<User>): Promise<User> {
      const token = await getToken();
      if (!token) throw new Error('No authentication token available');
      return apiClient.updateUser(id, data, token);
    },
    
    async getTicketDashboard(workspaceId?: string): Promise<{
      stats: {
        total: number;
        pending: number;
        in_progress: number;
        submitted: number;
        approved: number;
        rejected: number;
        cancelled: number;
        overdue: number;
        by_priority: Record<string, number>;
        by_category: Record<string, number>;
      };
      recent_tickets: Ticket[];
      my_tickets: Ticket[];
      overdue_tickets: Ticket[];
    }> {
      const token = await getToken();
      if (!token) throw new Error('No authentication token available');
      return apiClient.getTicketDashboard(workspaceId, token);
    }
  };
}