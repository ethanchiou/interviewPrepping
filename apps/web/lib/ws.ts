/**
 * WebSocket client utility (Interview Session)
 */

import { WSMessage } from "./types";

export type MessageHandler = (message: WSMessage) => void;

export class WSClient {
  private ws: WebSocket | null = null;
  private url: string;
  private sessionId: string;
  private token: string;
  private messageHandlers: MessageHandler[] = [];
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  constructor(sessionId: string, token: string) {
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000/ws";
    this.url = wsUrl;
    this.sessionId = sessionId;
    this.token = token;
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        console.log(`🔌 Connecting to WebSocket: ${this.url}`);
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
          console.log("✅ WebSocket connected");
          this.reconnectAttempts = 0;
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message: WSMessage = JSON.parse(event.data);
            this.messageHandlers.forEach((handler) => handler(message));
          } catch (error) {
            console.error("Failed to parse WebSocket message:", error);
          }
        };

        this.ws.onerror = (error) => console.error("WebSocket error:", error);

        this.ws.onclose = () => {
          console.warn("WebSocket closed");
          this.attemptReconnect();
        };

        setTimeout(() => {
          if (this.ws?.readyState !== WebSocket.OPEN) {
            reject(new Error("WebSocket connection timeout"));
            this.ws?.close();
          }
        }, 10000);
      } catch (err) {
        reject(err);
      }
    });
  }

  private attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) return;

    this.reconnectAttempts++;
    setTimeout(() => {
      this.connect().catch(console.error);
    }, 2000 * this.reconnectAttempts);
  }

  // ----------------------------
  // Interview-Specific Commands
  // ----------------------------

  startInterview() {
    this.send({ type: "start" });
  }

  sendTranscript(text: string) {
    this.send({ type: "transcript", payload: { text } });
  }

  askQuestion(text: string) {
    this.send({ type: "question", payload: { text } });
  }

  endInterview() {
    this.send({ type: "end" });
  }

  // ----------------------------
  // Core send
  // ----------------------------

  private send(message: Partial<WSMessage>) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error("WebSocket not connected");
      return;
    }

    const fullMessage: WSMessage = {
      ...message,
      ts_ms: Date.now(),
      session_id: this.sessionId,
      payload: message.payload || {},
      type: message.type || "unknown",
    } as WSMessage;

    this.ws.send(JSON.stringify(fullMessage));
  }

  onMessage(handler: MessageHandler) {
    this.messageHandlers.push(handler);
  }

  close() {
    this.ws?.close();
    this.ws = null;
  }
}
