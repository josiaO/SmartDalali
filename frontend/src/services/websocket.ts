/**
 * WebSocket Service for Real-time Communications
 * Handles WebSocket connections for chat messaging and notifications
 */

export interface Message {
  id: number;
  sender_id: number;
  content: string;
  is_read: boolean;
  created_at: string;
  type?: 'message';
}

export interface TypingIndicator {
  type: 'typing';
  user_id: number;
  username: string;
  is_typing: boolean;
}

export interface ReadReceipt {
  type: 'read_receipt';
  message_id: number;
  user_id: number;
}

export interface Notification {
  type: 'notification';
  message: string;
  severity: 'info' | 'warning' | 'error' | 'success';
}

export interface ErrorMessage {
  type: 'error';
  message: string;
}

export type WebSocketMessage = Message | TypingIndicator | ReadReceipt | Notification | ErrorMessage;

export type MessageHandler = (message: WebSocketMessage) => void;
export type ConnectionHandler = () => void;
export type DisconnectionHandler = (code: number) => void;
export type ErrorHandler = (error: Event) => void;

class WebSocketService {
  private chatSocket: WebSocket | null = null;
  private notificationSocket: WebSocket | null = null;
  private conversationId: number | null = null;
  private messageHandlers: Set<MessageHandler> = new Set();
  private connectionHandlers: Set<ConnectionHandler> = new Set();
  private disconnectionHandlers: Set<DisconnectionHandler> = new Set();
  private errorHandlers: Set<ErrorHandler> = new Set();
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 3000; // 3 seconds
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private isManualClose: boolean = false;

  /**
   * Get WebSocket URL based on current location
   */
  private getWebSocketURL(path: string): string {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    // Update this to match your backend API URL
    const apiUrl = import.meta.env.VITE_API_URL || `${protocol}//${host}`;
    
    // Replace http/https with ws/wss
    const wsUrl = apiUrl.replace(/^https?/, (match) => match === 'https' ? 'wss' : 'ws');
    return `${wsUrl}${path}`;
  }

  /**
   * Connect to chat WebSocket for a specific conversation
   */
  connectToChat(conversationId: number, token?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        if (this.chatSocket && this.chatSocket.readyState === WebSocket.OPEN) {
          resolve();
          return;
        }

        this.conversationId = conversationId;
        this.isManualClose = false;

        const url = this.getWebSocketURL(`/ws/chat/${conversationId}/`);
        this.chatSocket = new WebSocket(url);

        this.chatSocket.onopen = () => {
          console.log(`Connected to chat room ${conversationId}`);
          this.reconnectAttempts = 0;
          this.connectionHandlers.forEach((handler) => handler());
          resolve();
        };

        this.chatSocket.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            this.messageHandlers.forEach((handler) => handler(message));
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

        this.chatSocket.onerror = (error) => {
          console.error('WebSocket error:', error);
          this.errorHandlers.forEach((handler) => handler(error));
          reject(error);
        };

        this.chatSocket.onclose = (event) => {
          console.log(`Disconnected from chat room ${conversationId}`);
          this.disconnectionHandlers.forEach((handler) => handler(event.code));
          
          // Attempt to reconnect if not a manual close
          if (!this.isManualClose && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.attemptReconnect();
          }
        };
      } catch (error) {
        console.error('Error connecting to chat:', error);
        reject(error);
      }
    });
  }

  /**
   * Connect to notifications WebSocket
   */
  connectToNotifications(token?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        if (this.notificationSocket && this.notificationSocket.readyState === WebSocket.OPEN) {
          resolve();
          return;
        }

        this.isManualClose = false;

        const url = this.getWebSocketURL('/ws/notifications/');
        this.notificationSocket = new WebSocket(url);

        this.notificationSocket.onopen = () => {
          console.log('Connected to notifications');
          this.connectionHandlers.forEach((handler) => handler());
          resolve();
        };

        this.notificationSocket.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            this.messageHandlers.forEach((handler) => handler(message));
          } catch (error) {
            console.error('Error parsing notification message:', error);
          }
        };

        this.notificationSocket.onerror = (error) => {
          console.error('Notification WebSocket error:', error);
          this.errorHandlers.forEach((handler) => handler(error));
          reject(error);
        };

        this.notificationSocket.onclose = (event) => {
          console.log('Disconnected from notifications');
          this.disconnectionHandlers.forEach((handler) => handler(event.code));
          
          if (!this.isManualClose && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.attemptReconnect();
          }
        };
      } catch (error) {
        console.error('Error connecting to notifications:', error);
        reject(error);
      }
    });
  }

  /**
   * Send a message through the chat WebSocket
   */
  sendMessage(content: string): void {
    if (!this.chatSocket || this.chatSocket.readyState !== WebSocket.OPEN) {
      console.error('Chat WebSocket is not connected');
      return;
    }

    const message = {
      type: 'message',
      content: content.trim(),
    };

    this.chatSocket.send(JSON.stringify(message));
  }

  /**
   * Send typing indicator
   */
  sendTypingIndicator(isTyping: boolean): void {
    if (!this.chatSocket || this.chatSocket.readyState !== WebSocket.OPEN) {
      return;
    }

    const message = {
      type: 'typing',
      is_typing: isTyping,
    };

    this.chatSocket.send(JSON.stringify(message));
  }

  /**
   * Send read receipt
   */
  sendReadReceipt(messageId: number): void {
    if (!this.chatSocket || this.chatSocket.readyState !== WebSocket.OPEN) {
      return;
    }

    const message = {
      type: 'read',
      message_id: messageId,
    };

    this.chatSocket.send(JSON.stringify(message));
  }

  /**
   * Register a message handler
   */
  onMessage(handler: MessageHandler): void {
    this.messageHandlers.add(handler);
  }

  /**
   * Unregister a message handler
   */
  offMessage(handler: MessageHandler): void {
    this.messageHandlers.delete(handler);
  }

  /**
   * Register a connection handler
   */
  onConnect(handler: ConnectionHandler): void {
    this.connectionHandlers.add(handler);
  }

  /**
   * Unregister a connection handler
   */
  offConnect(handler: ConnectionHandler): void {
    this.connectionHandlers.delete(handler);
  }

  /**
   * Register a disconnection handler
   */
  onDisconnect(handler: DisconnectionHandler): void {
    this.disconnectionHandlers.add(handler);
  }

  /**
   * Unregister a disconnection handler
   */
  offDisconnect(handler: DisconnectionHandler): void {
    this.disconnectionHandlers.delete(handler);
  }

  /**
   * Register an error handler
   */
  onError(handler: ErrorHandler): void {
    this.errorHandlers.add(handler);
  }

  /**
   * Unregister an error handler
   */
  offError(handler: ErrorHandler): void {
    this.errorHandlers.delete(handler);
  }

  /**
   * Disconnect from chat
   */
  disconnectChat(): void {
    if (this.chatSocket) {
      this.isManualClose = true;
      this.chatSocket.close();
      this.chatSocket = null;
    }
  }

  /**
   * Disconnect from notifications
   */
  disconnectNotifications(): void {
    if (this.notificationSocket) {
      this.isManualClose = true;
      this.notificationSocket.close();
      this.notificationSocket = null;
    }
  }

  /**
   * Disconnect from all WebSockets
   */
  disconnect(): void {
    this.disconnectChat();
    this.disconnectNotifications();
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
  }

  /**
   * Check if chat is connected
   */
  isChatConnected(): boolean {
    return this.chatSocket !== null && this.chatSocket.readyState === WebSocket.OPEN;
  }

  /**
   * Check if notifications is connected
   */
  isNotificationsConnected(): boolean {
    return this.notificationSocket !== null && this.notificationSocket.readyState === WebSocket.OPEN;
  }

  /**
   * Attempt to reconnect with exponential backoff
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    console.log(`Attempting to reconnect (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${delay}ms`);
    
    this.reconnectTimeout = setTimeout(() => {
      if (this.conversationId) {
        this.connectToChat(this.conversationId).catch((error) => {
          console.error('Reconnection failed:', error);
        });
      }
    }, delay);
  }

  /**
   * Reset reconnect attempts (called on successful connection)
   */
  resetReconnectAttempts(): void {
    this.reconnectAttempts = 0;
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
  }
}

// Export singleton instance
const websocketService = new WebSocketService();
export default websocketService;
