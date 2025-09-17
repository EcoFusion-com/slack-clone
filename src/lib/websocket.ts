/**
 * WebSocket client for real-time communication with Clerk authentication
 */

import { useAuth } from "@clerk/clerk-react";
import { config } from './config';

// Use configured WebSocket URL
const WS_BASE_URL = config.websocketUrl;

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
  private currentChannelId: string | null = null;

  constructor(baseUrl: string = WS_BASE_URL) {
    this.url = baseUrl;
  }

  setAuth(getToken: () => Promise<string | null>) {
    this.getToken = getToken;
  }

  getCurrentChannel(): string | null {
    return this.currentChannelId;
  }

  connect(channelId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const connectionId = `ws_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // console.log(`[WebSocket ${connectionId}] Connection attempt started`, {
      //   channelId,
      //   currentState: this.ws?.readyState,
      //   isConnecting: this.isConnecting,
      //   reconnectAttempts: this.reconnectAttempts
      // });
      
      // Check if already connected to the same channel
      if (this.ws?.readyState === WebSocket.OPEN && this.currentChannelId === channelId) {
        // console.log(`[WebSocket ${connectionId}] Already connected to same channel`);
        resolve();
        return;
      }
      
      // If connected to different channel, disconnect first
      if (this.ws?.readyState === WebSocket.OPEN && this.currentChannelId !== channelId) {
        // console.log(`[WebSocket ${connectionId}] Switching channels, disconnecting first`);
        this.ws.close(1000, 'Switching channel');
        this.ws = null;
        this.currentChannelId = null;
      }

      if (this.isConnecting) {
        // console.log(`[WebSocket ${connectionId}] Waiting for existing connection`);
        // Wait for existing connection to complete instead of rejecting
        const checkConnection = () => {
          if (this.ws?.readyState === WebSocket.OPEN) {
            // console.log(`[WebSocket ${connectionId}] Existing connection completed`);
            resolve();
          } else if (!this.isConnecting) {
            // console.log(`[WebSocket ${connectionId}] Previous connection failed, retrying`);
            // Previous connection failed, try again
            this.connect(channelId).then(resolve).catch(reject);
          } else {
            // Still connecting, wait a bit more
            setTimeout(checkConnection, 100);
          }
        };
        checkConnection();
        return;
      }

      this.isConnecting = true;

      if (!this.getToken) {
        console.error(`[WebSocket ${connectionId}] No authentication method available`);
        this.isConnecting = false;
        reject(new Error('No authentication method available'));
        return;
      }

      this.getToken().then(token => {
        if (!token) {
          console.error(`[WebSocket ${connectionId}] No access token available`);
          this.isConnecting = false;
          reject(new Error('No access token available'));
          return;
        }

        const wsUrl = `${this.url}/${channelId}?token=${token}`;
        // console.log(`[WebSocket ${connectionId}] Attempting to connect`, {
        //   wsUrl: wsUrl.replace(token, '[TOKEN]'),
        //   tokenLength: token.length,
        //   channelId
        // });
        
        try {
          this.ws = new WebSocket(wsUrl);

          this.ws.onopen = () => {
            // console.log(`[WebSocket ${connectionId}] Connected successfully`);
            this.isConnecting = false;
            this.reconnectAttempts = 0;
            this.currentChannelId = channelId;
            resolve();
          };

          this.ws.onmessage = (event) => {
            try {
              const message: WebSocketMessage = JSON.parse(event.data);
              // console.log(`[WebSocket ${connectionId}] Message received`, {
              //   type: message.type,
              //   dataKeys: Object.keys(message.data || {}),
              //   messageSize: event.data.length
              // });
              this.handleMessage(message);
            } catch (error) {
              console.error(`[WebSocket ${connectionId}] Failed to parse message`, {
                error: error instanceof Error ? error.message : String(error),
                data: event.data
              });
            }
          };

          this.ws.onclose = (event) => {
            // console.log(`[WebSocket ${connectionId}] Disconnected`, {
            //   code: event.code,
            //   reason: event.reason,
            //   wasClean: event.wasClean,
            //   reconnectAttempts: this.reconnectAttempts,
            //   maxReconnectAttempts: this.maxReconnectAttempts
            // });
            this.isConnecting = false;
            
            if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
              this.attemptReconnect(channelId);
            }
          };

          this.ws.onerror = (error) => {
            console.error(`[WebSocket ${connectionId}] Error occurred`, {
              error: error instanceof Error ? error.message : String(error),
              wsUrl: wsUrl.replace(token, '[TOKEN]'),
              readyState: this.ws?.readyState
            });
            this.isConnecting = false;
            reject(error);
          };

        } catch (error) {
          console.error(`[WebSocket ${connectionId}] Connection failed`, {
            error: error instanceof Error ? error.message : String(error),
            errorType: error instanceof Error ? error.constructor.name : typeof error
          });
          this.isConnecting = false;
          reject(error);
        }
      }).catch(error => {
        console.error(`[WebSocket ${connectionId}] Token retrieval failed`, {
          error: error instanceof Error ? error.message : String(error)
        });
        this.isConnecting = false;
        reject(error);
      });
    });
  }

  private attemptReconnect(channelId: string) {
    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    // console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);
    
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

  sendTypingIndicator(channelId: string, isTyping: boolean) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      const message = {
        type: 'user_typing',
        data: {
          channel_id: channelId,
          is_typing: isTyping
        }
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
    this.currentChannelId = null;
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
  const { getToken } = useAuth();
  
  // Set the authentication method
  wsClient.setAuth(getToken);
  
  return wsClient;
}