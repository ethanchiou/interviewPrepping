/**
 * Speech-to-Text client using Web Speech API
 */

export type STTCallback = (text: string, isFinal: boolean) => void;

export class STTClient {
    private recognition: any = null;
    private callback: STTCallback;
    private isRunning = false;

    constructor(callback: STTCallback) {
        this.callback = callback;

        // Check if browser supports Web Speech API
        const SpeechRecognition =
            (window as any).SpeechRecognition ||
            (window as any).webkitSpeechRecognition;

        if (SpeechRecognition) {
            this.recognition = new SpeechRecognition();
            this.recognition.continuous = true;
            this.recognition.interimResults = true;
            this.recognition.lang = "en-US";

            this.recognition.onresult = (event: any) => {
                let interimTranscript = "";
                let finalTranscript = "";

                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const transcript = event.results[i][0].transcript;
                    if (event.results[i].isFinal) {
                        finalTranscript += transcript + " ";
                    } else {
                        interimTranscript += transcript;
                    }
                }

                if (finalTranscript) {
                    this.callback(finalTranscript.trim(), true);
                } else if (interimTranscript) {
                    this.callback(interimTranscript.trim(), false);
                }
            };

            this.recognition.onerror = (event: any) => {
                console.error("Speech recognition error:", event.error);
                
                // Auto-restart on certain errors
                if (event.error === "no-speech" || event.error === "audio-capture") {
                    if (this.isRunning) {
                        setTimeout(() => this.start(), 1000);
                    }
                }
            };

            this.recognition.onend = () => {
                // Auto-restart if we're supposed to be running
                if (this.isRunning) {
                    try {
                        this.recognition.start();
                    } catch (e) {
                        console.error("Error restarting recognition:", e);
                    }
                }
            };
        }
    }

    isAvailable(): boolean {
        return this.recognition !== null;
    }

    start() {
        if (!this.recognition) {
            console.warn("Speech recognition not available");
            return;
        }

        if (this.isRunning) {
            return;
        }

        try {
            this.isRunning = true;
            this.recognition.start();
            console.log("🎤 Speech recognition started");
        } catch (error) {
            console.error("Error starting speech recognition:", error);
        }
    }

    stop() {
        if (!this.recognition) {
            return;
        }

        this.isRunning = false;
        try {
            this.recognition.stop();
            console.log("🛑 Speech recognition stopped");
        } catch (error) {
            console.error("Error stopping speech recognition:", error);
        }
    }
}