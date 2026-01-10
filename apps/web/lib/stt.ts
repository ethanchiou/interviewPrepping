/**
 * Speech-to-text utility using Web Speech API
 */

export type STTCallback = (text: string, isFinal: boolean) => void;

export class STTClient {
    private recognition: any = null;
    private callback: STTCallback;
    private isSupported: boolean;

    constructor(callback: STTCallback) {
        this.callback = callback;

        // Check for Web Speech API support
        const SpeechRecognition =
            (window as any).SpeechRecognition ||
            (window as any).webkitSpeechRecognition;

        this.isSupported = !!SpeechRecognition;

        if (this.isSupported) {
            this.recognition = new SpeechRecognition();
            this.recognition.continuous = true;
            this.recognition.interimResults = true;
            this.recognition.lang = "en-US";

            this.recognition.onresult = (event: any) => {
                const results = event.results;
                const lastResult = results[results.length - 1];
                const transcript = lastResult[0].transcript;
                const isFinal = lastResult.isFinal;

                this.callback(transcript, isFinal);
            };

            this.recognition.onerror = (event: any) => {
                console.error("Speech recognition error:", event.error);
            };

            this.recognition.onend = () => {
                // Auto-restart if stopped unexpectedly
                if (this.isSupported) {
                    try {
                        this.recognition.start();
                    } catch (error) {
                        console.error("Failed to restart recognition:", error);
                    }
                }
            };
        }
    }

    isAvailable(): boolean {
        return this.isSupported;
    }

    start() {
        if (this.recognition) {
            try {
                this.recognition.start();
                console.log("🎤 Speech recognition started");
            } catch (error) {
                console.error("Failed to start speech recognition:", error);
            }
        }
    }

    stop() {
        if (this.recognition) {
            this.recognition.stop();
            console.log("🎤 Speech recognition stopped");
        }
    }
}
