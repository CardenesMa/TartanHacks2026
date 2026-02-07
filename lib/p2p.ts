import Peer, { DataConnection } from 'peerjs';

export interface GameMessage {
  type: 'join' | 'leave' | 'draw' | 'update' | 'start';
  data: any;
  timestamp: number;
  from?: string;
}

export interface User {
  id: string;
  name: string;
  isHost: boolean;
  joinedAt: number;
}

export class P2PManager {
  private peer: Peer | null = null;
  private peerId: string;
  private connections: Map<string, DataConnection> = new Map();
  private sharedState: Map<string, any> = new Map();
  private messageHandlers: ((message: GameMessage) => void)[] = [];
  private userList: User[] = [];
  
  constructor() {
    // Generate ID immediately
    this.peerId = 'peer-' + Math.random().toString(36).substr(2, 9);
    
    if (typeof window !== 'undefined') {
      this.initPeer();
    }
  }

  private initPeer() {
    // For demo purposes, we'll create a mock peer that works locally
    // In production, you would configure this with a proper PeerJS server
    try {
      this.peer = new Peer(this.peerId, {
        host: 'localhost',
        port: 9000,
        path: '/myapp',
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' }
          ]
        }
      });

      this.peer.on('open', (id) => {
        console.log('My peer ID is: ' + id);
        this.peerId = id;
      });

      this.peer.on('connection', (conn) => {
        this.handleConnection(conn);
      });

      this.peer.on('error', (err) => {
        console.error('Peer error:', err);
        // Keep using the generated ID for demo purposes
      });
    } catch (err) {
      console.error('Failed to initialize peer:', err);
      // Continue with the generated ID
    }
  }

  private handleConnection(conn: DataConnection) {
    this.connections.set(conn.peer, conn);

    conn.on('data', (data) => {
      const message = data as GameMessage;
      this.handleMessage(message);
    });

    conn.on('close', () => {
      this.connections.delete(conn.peer);
      this.handleUserLeave(conn.peer);
    });

    conn.on('error', (err) => {
      console.error('Connection error:', err);
    });
  }

  private handleMessage(message: GameMessage) {
    // Update shared state based on message
    if (message.type === 'update') {
      Object.entries(message.data).forEach(([key, value]) => {
        this.sharedState.set(key, value);
      });
    } else if (message.type === 'join') {
      this.userList.push(message.data as User);
    } else if (message.type === 'leave') {
      this.userList = this.userList.filter(u => u.id !== message.data.id);
    }

    // Notify all handlers
    this.messageHandlers.forEach(handler => handler(message));
  }

  private handleUserLeave(userId: string) {
    const message: GameMessage = {
      type: 'leave',
      data: { id: userId },
      timestamp: Date.now()
    };
    this.handleMessage(message);
  }

  getMyId(): string {
    return this.peerId;
  }

  connectToPeer(peerId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.peer) {
        reject(new Error('Peer not initialized'));
        return;
      }

      const conn = this.peer.connect(peerId, { reliable: true });
      
      conn.on('open', () => {
        this.handleConnection(conn);
        resolve();
      });

      conn.on('error', (err) => {
        reject(err);
      });
    });
  }

  sendMessage(message: Omit<GameMessage, 'timestamp' | 'from'>) {
    const fullMessage: GameMessage = {
      ...message,
      timestamp: Date.now(),
      from: this.peerId
    };

    this.connections.forEach((conn) => {
      if (conn.open) {
        conn.send(fullMessage);
      }
    });

    // Handle locally as well
    this.handleMessage(fullMessage);
  }

  onMessage(handler: (message: GameMessage) => void) {
    this.messageHandlers.push(handler);
    return () => {
      this.messageHandlers = this.messageHandlers.filter(h => h !== handler);
    };
  }

  getSharedState(): Map<string, any> {
    return this.sharedState;
  }

  updateSharedState(updates: Record<string, any>) {
    this.sendMessage({
      type: 'update',
      data: updates
    });
  }

  getUserList(): User[] {
    return this.userList;
  }

  addUser(user: User) {
    this.sendMessage({
      type: 'join',
      data: user
    });
  }

  destroy() {
    this.connections.forEach(conn => conn.close());
    this.connections.clear();
    this.peer?.destroy();
    this.messageHandlers = [];
  }
}

// Singleton instance
let p2pInstance: P2PManager | null = null;

export function getP2PManager(): P2PManager {
  if (typeof window === 'undefined') {
    // Server-side: return a mock
    return new P2PManager();
  }
  
  if (!p2pInstance) {
    p2pInstance = new P2PManager();
  }
  return p2pInstance;
}
