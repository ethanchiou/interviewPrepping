/**
 * WebSocket client utility
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
        this.sessionId = sessionId;
        this.token = token;
        const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000/ws";
        this.url = `${wsUrl}?session_id=${sessionId}&token=${token}`;
    }

    connect(): Promise<void> {
        return new Promise((resolve, reject) => {
            try {
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

                this.ws.onerror = (error) => {
                    console.error("WebSocket error:", error);
                    reject(error);
                };

                this.ws.onclose = () => {
                    console.log("WebSocket closed");
                    this.attemptReconnect();
                };
            } catch (error) {
                reject(error);
            }
        });
    }

    private attemptReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`Reconnecting... (attempt ${this.reconnectAttempts})`);
            setTimeout(() => {
                this.connect().catch(console.error);
            }, 2000 * this.reconnectAttempts);
        }
    }

    send<T>(type: string, payload: T) {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            console.error("WebSocket not connected");
            return;
        }

        const message: WSMessage<T> = {
            type,
            ts_ms: Date.now(),
            session_id: this.sessionId,
            payload,
        };

        this.ws.send(JSON.stringify(message));
    }

    onMessage(handler: MessageHandler) {
        this.messageHandlers.push(handler);
    }

    close() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
    }
}
