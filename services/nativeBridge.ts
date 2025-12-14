import { useEffect, useMemo, useState } from 'react';

export type WebSocketMessage =
  | CommandMessage
  | EventMessage
  | ResponseMessage
  | StreamMessage;

export interface BaseMessage {
  type: 'command' | 'event' | 'response' | 'stream';
  id?: string;
  timestamp: number;
}

export interface CommandMessage extends BaseMessage {
  type: 'command';
  command: string;
  payload: any;
}

export interface EventMessage extends BaseMessage {
  type: 'event';
  event: string;
  data: any;
}

export interface ResponseMessage extends BaseMessage {
  type: 'response';
  result?: any;
  error?: { message: string };
}

export interface StreamMessage extends BaseMessage {
  type: 'stream';
  streamType: 'meter' | 'audio' | 'spectrum';
  data: any;
}

const COMMANDS = {
  TRANSPORT_PLAY: 'transport.play',
  TRANSPORT_STOP: 'transport.stop',
  TRANSPORT_SEEK: 'transport.seek',
  TRACK_CREATE: 'track.create',
  TRACK_DELETE: 'track.delete',
  TRACK_SET_VOLUME: 'track.setVolume',
  PLUGIN_ADD: 'plugin.add',
  PLUGIN_REMOVE: 'plugin.remove',
  PLUGIN_SET_PARAM: 'plugin.setParam',
  CLIP_LOAD: 'clip.load',
  CLIP_MOVE: 'clip.move',
  CLIP_TRIM: 'clip.trim',
  RENDER_START: 'render.start',
  RENDER_CANCEL: 'render.cancel'
} as const;

export class NativeBridge {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private pendingRequests = new Map<
    string,
    {
      resolve: (value: any) => void;
      reject: (error: Error) => void;
      timeout: ReturnType<typeof setTimeout>;
    }
  >();
  private listeners = new Map<string, Set<(data: any) => void>>();

  async connect(host: string = 'localhost', port: number = 8765): Promise<void> {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(`ws://${host}:${port}`);

      this.ws.onopen = () => {
        this.reconnectAttempts = 0;
        resolve();
      };

      this.ws.onmessage = this.handleMessage.bind(this);
      this.ws.onerror = (error) => reject(error);
      this.ws.onclose = this.handleDisconnect.bind(this);
    });
  }

  private handleDisconnect = () => {
    this.ws = null;
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts += 1;
      setTimeout(() => this.connect().catch(() => {}), 500 * this.reconnectAttempts);
    }
  };

  async sendCommand<T = any>(command: string, payload?: any, timeoutMs = 5000): Promise<T> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket not connected');
    }
    return new Promise((resolve, reject) => {
      const messageId = crypto.randomUUID();
      const message: CommandMessage = {
        type: 'command',
        id: messageId,
        timestamp: Date.now(),
        command,
        payload
      };

      const timeout = setTimeout(() => {
        this.pendingRequests.delete(messageId);
        reject(new Error(`Command ${command} timeout after ${timeoutMs}ms`));
      }, timeoutMs);

      this.pendingRequests.set(messageId, {
        resolve,
        reject,
        timeout
      });

      this.ws?.send(JSON.stringify(message));
    });
  }

  on(event: string, callback: (data: any) => void): () => void {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event)!.add(callback);
    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  private dispatchEvent(event: string, data: any) {
    const callbacks = this.listeners.get(event);
    if (!callbacks) return;
    callbacks.forEach((cb) => cb(data));
  }

  private handleMessage = (event: MessageEvent) => {
    const message: WebSocketMessage = JSON.parse(event.data);

    if (message.type === 'response' && message.id) {
      const pending = this.pendingRequests.get(message.id);
      if (pending) {
        clearTimeout(pending.timeout);
        pending.resolve(message.result ?? message);
        this.pendingRequests.delete(message.id);
      }
    } else if (message.type === 'event') {
      this.dispatchEvent(message.event, message.data);
    } else if (message.type === 'stream') {
      this.dispatchEvent(message.streamType, message.data);
    }
  };

  async streamAudio(trackId: string, audioBuffer: AudioBuffer): Promise<string> {
    const channels = audioBuffer.numberOfChannels;
    const samples = audioBuffer.length;
    const interleaved = new Float32Array(channels * samples);

    for (let channel = 0; channel < channels; channel++) {
      const channelData = audioBuffer.getChannelData(channel);
      for (let i = 0; i < samples; i++) {
        interleaved[i * channels + channel] = channelData[i];
      }
    }

    const metadata = await this.sendCommand<{ clipId: string }>(COMMANDS.CLIP_LOAD, {
      trackId,
      format: 'float32',
      sampleRate: audioBuffer.sampleRate,
      channels,
      samples,
      name: `Clip_${Date.now()}`
    });

    const CHUNK_SIZE = 65536;
    const clipId = metadata.clipId;

    for (let i = 0; i < interleaved.length; i += CHUNK_SIZE) {
      const chunk = interleaved.slice(i, i + CHUNK_SIZE);
      const message: StreamMessage = {
        type: 'stream',
        streamType: 'audio',
        timestamp: Date.now(),
        data: {
          clipId,
          chunkIndex: Math.floor(i / CHUNK_SIZE),
          totalChunks: Math.ceil(interleaved.length / CHUNK_SIZE),
          data: Array.from(chunk)
        }
      };
      this.ws?.send(JSON.stringify(message));
      await new Promise((resolve) => setTimeout(resolve, 1));
    }

    return clipId;
  }
}

export function useNativeBridge() {
  const bridge = useMemo(() => new NativeBridge(), []);
  const [isConnected, setIsConnected] = useState(false);
  const [transport, setTransport] = useState<any>(null);
  const [meters, setMeters] = useState<any>(null);

  useEffect(() => {
    bridge.connect().then(() => setIsConnected(true)).catch(() => setIsConnected(false));

    const unsubTransport = bridge.on('transport.update', setTransport);
    const unsubMeters = bridge.on('meter.update', setMeters);

    return () => {
      unsubTransport();
      unsubMeters();
    };
  }, [bridge]);

  return { bridge, isConnected, transport, meters };
}

