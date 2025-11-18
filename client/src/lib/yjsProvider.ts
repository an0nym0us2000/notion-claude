import { io, Socket } from 'socket.io-client';
import * as Y from 'yjs';
import * as encoding from 'lib0/encoding';
import * as decoding from 'lib0/decoding';
import * as syncProtocol from 'y-protocols/sync';
import * as awarenessProtocol from 'y-protocols/awareness';

const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:4000';

export class YjsProvider {
  private socket: Socket | null = null;
  private doc: Y.Doc;
  private awareness: awarenessProtocol.Awareness;
  private pageId: string;
  private token: string;
  private synced = false;
  private connected = false;

  constructor(pageId: string, doc: Y.Doc, token: string) {
    this.pageId = pageId;
    this.doc = doc;
    this.token = token;
    this.awareness = new awarenessProtocol.Awareness(doc);

    this.connect();
  }

  private connect() {
    // Connect to Yjs namespace
    this.socket = io(`${WS_URL}/yjs`, {
      auth: {
        token: this.token,
      },
      autoConnect: false,
    });

    // Handle connection
    this.socket.on('connect', () => {
      console.log('✅ Connected to Yjs server');
      this.connected = true;
      this.socket!.emit('join-page', this.pageId);
    });

    // Handle disconnection
    this.socket.on('disconnect', () => {
      console.log('❌ Disconnected from Yjs server');
      this.connected = false;
      this.synced = false;
    });

    // Handle Yjs protocol messages
    this.socket.on('yjs-message', (message: Uint8Array) => {
      const decoder = decoding.createDecoder(message);
      const messageType = decoding.readVarUint(decoder);

      if (messageType === 0) {
        // Sync protocol message
        const encoder = encoding.createEncoder();
        const syncMessageType = decoding.readVarUint(decoder);

        switch (syncMessageType) {
          case syncProtocol.messageYjsSyncStep1:
            syncProtocol.readSyncStep1(decoder, encoder, this.doc);
            if (encoding.length(encoder) > 0) {
              const response = encoding.createEncoder();
              encoding.writeVarUint(response, 0); // Sync message type
              encoding.writeUint8Array(response, encoding.toUint8Array(encoder));
              this.socket!.emit('yjs-message', encoding.toUint8Array(response));
            }
            break;

          case syncProtocol.messageYjsSyncStep2:
            syncProtocol.readSyncStep2(decoder, this.doc, this);
            this.synced = true;
            console.log('✅ Yjs document synced');
            break;

          case syncProtocol.messageYjsUpdate:
            syncProtocol.readUpdate(decoder, this.doc, this);
            break;
        }
      } else if (messageType === 1) {
        // Awareness protocol message
        awarenessProtocol.applyAwarenessUpdate(
          this.awareness,
          decoding.readVarUint8Array(decoder),
          this
        );
      }
    });

    // Handle errors
    this.socket.on('yjs-error', (error: string) => {
      console.error('Yjs error:', error);
    });

    // Send updates to server
    this.doc.on('update', (update: Uint8Array, origin: any) => {
      if (origin !== this && this.connected) {
        const encoder = encoding.createEncoder();
        encoding.writeVarUint(encoder, 0); // Sync message type
        encoding.writeVarUint(encoder, syncProtocol.messageYjsUpdate);
        encoding.writeVarUint8Array(encoder, update);
        this.socket!.emit('yjs-message', encoding.toUint8Array(encoder));
      }
    });

    // Send awareness updates
    this.awareness.on('update', ({ added, updated, removed }: any) => {
      const changedClients = added.concat(updated).concat(removed);
      const encoder = encoding.createEncoder();
      encoding.writeVarUint(encoder, 1); // Awareness message type
      encoding.writeVarUint8Array(
        encoder,
        awarenessProtocol.encodeAwarenessUpdate(this.awareness, changedClients)
      );
      this.socket!.emit('yjs-message', encoding.toUint8Array(encoder));
    });

    // Connect
    this.socket.connect();
  }

  public setAwarenessField(field: string, value: any) {
    this.awareness.setLocalStateField(field, value);
  }

  public getAwareness(): awarenessProtocol.Awareness {
    return this.awareness;
  }

  public isSynced(): boolean {
    return this.synced;
  }

  public isConnected(): boolean {
    return this.connected;
  }

  public destroy() {
    if (this.socket) {
      this.socket.emit('leave-page');
      this.socket.disconnect();
      this.socket = null;
    }
    this.awareness.destroy();
  }
}
