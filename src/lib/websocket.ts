/**
 * WebSocket client for real-time communication with Clerk authentication
 */

// Note: Clerk import is optional and will be available when @clerk/clerk-react is installed
// import { useAuth } from "@clerk/clerk-react";
import { getWebSocketUrlFromEnv } from "./websocket-utils";

const WS_BASE_URL = getWebSocketUrlFromEnv();

export interface WebSocketMessage {
  type: string;
  data: any;
}

export interface JoinChannelMessage {
  type: 'join_channel';
  data: { channel_id: string };
}

export interface SendMessageData {
  type: 'send_message';
  data: {
    channel_id: string;
    content: string;
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
  };
}

export interface NewMessageData {
  type: 'new_message';
  data: {
    id: string;
    user: {
      id: string;
      name: string;
      avatar?: string;
    };
    content: string;
    timestamp: string;
    channel_id: string;
    reactions: Array<{
      id: string;
      user_id: string;
      emoji: string;
      count: number;
      users: string[];
      created_at: string;
    }>;
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
  };
}

export interface UserTypingData {
  type: 'user_typing';
  data: {
    user_id: string;
    channel_id: string;
    is_typing: boolean;
  };
}

export interface UserStatusChangeData {
  type: 'user_status_change';
  data: {
    user_id: string;
    status: 'online' | 'away' | 'busy' | 'offline';
  };
}

export type WebSocketEventData = 
  | NewMessageData 
  | UserTypingData 
  | UserStatusChangeData;

export type WebSocketEventCallback = (data: WebSocketEventData) => void;

class WebSocketClient {
  private ws: WebSocket | null = null;
  private url: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private eventCallbacks: Map<string, WebSocketEventCallback[]> = new Map();
  private isConnecting = false;
  private getToken: (() => Promise<string | null>) | null = null;

  constructor(baseUrl: string = WS_BASE_URL) {
    this.url = baseUrl;
  }

  setAuth(getToken: () => Promise<string | null>) {
    this.getToken = getToken;
  }

  connect(channelId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        resolve();
        return;
      }

      if (this.isConnecting) {
        reject(new Error('Connection already in progress'));
        return;
      }

      this.isConnecting = true;

      if (!this.getToken) {
        this.isConnecting = false;
        reject(new Error('No authentication method available'));
        return;
      }

      this.getToken().then(token => {
        if (!token) {
          this.isConnecting = false;
          reject(new Error('No access token available'));
          return;
        }

        const wsUrl = `${this.url}/${channelId}?token=${token}`;
        
        try {
          this.ws = new WebSocket(wsUrl);

          this.ws.onopen = () => {
            console.log('WebSocket connected');
            this.isConnecting = false;
            this.reconnectAttempts = 0;
            resolve();
          };

          this.ws.onmessage = (event) => {
            try {
              const message: WebSocketMessage = JSON.parse(event.data);
              this.handleMessage(message);
            } catch (error) {
              console.error('Failed to parse WebSocket message:', error);
            }
          };

          this.ws.onclose = (event) => {
            console.log('WebSocket disconnected:', event.code, event.reason);
            this.isConnecting = false;
            
            if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
              this.attemptReconnect(channelId);
            }
          };

          this.ws.onerror = (error) => {
            console.error('WebSocket error:', error);
            this.isConnecting = false;
            reject(error);
          };

        } catch (error) {
          this.isConnecting = false;
          reject(error);
        }
      }).catch(error => {
        this.isConnecting = false;
        reject(error);
      });
    });
  }

  private attemptReconnect(channelId: string) {
    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);
    
    setTimeout(() => {
      this.connect(channelId).catch(error => {
        console.error('Reconnection failed:', error);
      });
    }, delay);
  }

  private handleMessage(message: WebSocketMessage) {
    const callbacks = this.eventCallbacks.get(message.type) || [];
    callbacks.forEach(callback => {
      try {
        callback(message as WebSocketEventData);
      } catch (error) {
        console.error('Error in WebSocket callback:', error);
      }
    });
  }

  sendMessage(data: SendMessageData['data']) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      const message: SendMessageData = {
        type: 'send_message',
        data
      };
      this.ws.send(JSON.stringify(message));
    } else {
      console.error('WebSocket is not connected');
    }
  }

  joinChannel(channelId: string) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      const message: JoinChannelMessage = {
        type: 'join_channel',
        data: { channel_id: channelId }
      };
      this.ws.send(JSON.stringify(message));
    } else {
      console.error('WebSocket is not connected');
    }
  }

  on(event: string, callback: WebSocketEventCallback) {
    if (!this.eventCallbacks.has(event)) {
      this.eventCallbacks.set(event, []);
    }
    this.eventCallbacks.get(event)!.push(callback);
  }

  off(event: string, callback: WebSocketEventCallback) {
    const callbacks = this.eventCallbacks.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
    this.eventCallbacks.clear();
  }

  getConnectionState(): number {
    return this.ws?.readyState || WebSocket.CLOSED;
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

// Create and export WebSocket client instance
export const wsClient = new WebSocketClient();

// Hook for using WebSocket client with Clerk authentication
export function useWebSocketClient() {
  // Note: This requires @clerk/clerk-react to be installed
  // Uncomment the following lines when Clerk is properly integrated:
  // const { getToken } = useAuth();
  // wsClient.setAuth(getToken);
  
  // For now, return client without authentication
  // This will work for development but requires proper Clerk integration for production
  console.warn('WebSocket client initialized without authentication. Install @clerk/clerk-react for full functionality.');
  
  return wsClient;
}