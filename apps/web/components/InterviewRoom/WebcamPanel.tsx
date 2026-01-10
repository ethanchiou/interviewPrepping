"use client";

import { useEffect, useRef, useState } from "react";

export default function WebcamPanel() {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [error, setError] = useState<string>("");
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let stream: MediaStream | null = null;

        const startWebcam = async () => {
            try {
                setIsLoading(true);
                stream = await navigator.mediaDevices.getUserMedia({
                    video: true,
                    audio: false,
                });

                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
            } catch (err) {
                console.error("Webcam access error:", err);
                setError("Could not access camera. Please allow permissions.");
            } finally {
                setIsLoading(false);
            }
        };

        startWebcam();

        return () => {
            if (stream) {
                stream.getTracks().forEach((track) => track.stop());
            }
        };
    }, []);

    return (
        <div className="flex flex-col h-full bg-gray-100 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
            <div className="flex-1 relative flex items-center justify-center overflow-hidden bg-black">
                {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                        Loading camera...
                    </div>
                )}

                {error ? (
                    <div className="absolute inset-0 flex items-center justify-center text-red-400 p-4 text-center">
                        {error}
                    </div>
                ) : (
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover transform scale-x-[-1]" // Mirror effect
                    />
                )}
            </div>
        </div>
    );
}
