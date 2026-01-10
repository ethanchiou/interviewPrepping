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
                        console.log("📨 Received:", message.type);
                        this.messageHandlers.forEach((handler) => handler(message));
                    } catch (error) {
                        console.error("Failed to parse WebSocket message:", error);
                    }
                };

                this.ws.onerror = (error) => {
                    console.error("WebSocket error occurred:", error);
                    // Don't reject here - the connection might still succeed
                    // The onclose handler will manage reconnection
                };

                this.ws.onclose = (event) => {
                    console.log(`WebSocket closed: code=${event.code}, reason=${event.reason}`);

                    // If we never connected (resolve wasn't called), reject now
                    if (this.reconnectAttempts === 0 && this.ws?.readyState !== WebSocket.OPEN) {
                        reject(new Error(`Failed to connect: ${event.reason || 'Connection closed'}`));
                    } else {
                        this.attemptReconnect();
                    }
                };

                // Add timeout for initial connection
                setTimeout(() => {
                    if (this.ws?.readyState !== WebSocket.OPEN) {
                        console.error("WebSocket connection timeout");
                        reject(new Error("Connection timeout"));
                        this.ws?.close();
                    }
                }, 10000); // 10 second timeout

            } catch (error) {
                console.error("WebSocket connection error:", error);
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

    isConnected(): boolean {
        return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
    }

    close() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
    }
}
