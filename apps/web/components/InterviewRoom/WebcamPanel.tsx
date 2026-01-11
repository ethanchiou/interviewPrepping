"use client";

import { useEffect, useRef, useState } from "react";

interface MediaPipeMetrics {
  eyeContact: boolean;
  leftEyeOpen: boolean;
  rightEyeOpen: boolean;
  headTiltAngle: number;
  faceDetected: boolean;
}

interface WebcamPanelProps {
  onMetricsUpdate?: (metrics: MediaPipeMetrics) => void;
}

export default function WebcamPanel({ onMetricsUpdate }: WebcamPanelProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [metrics, setMetrics] = useState<MediaPipeMetrics>({
    eyeContact: false,
    leftEyeOpen: false,
    rightEyeOpen: false,
    headTiltAngle: 0,
    faceDetected: false
  });

  const faceMeshRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    let mounted = true;

    const startWebcam = async () => {
      try {
        setIsLoading(true);

        // Load MediaPipe
        const { FaceMesh } = await import('@mediapipe/face_mesh');

        if (!mounted) return;

        // Initialize FaceMesh
        const faceMesh = new FaceMesh({
          locateFile: (file: string) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
          }
        });

        faceMesh.setOptions({
          maxNumFaces: 1,
          refineLandmarks: true,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5
        });

        faceMesh.onResults(onResults);
        faceMeshRef.current = faceMesh;

        // Get camera stream
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { 
            width: 640, 
            height: 480,
            facingMode: 'user'
          },
          audio: false
        });

        if (!mounted) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        setIsLoading(false);

        // Start processing frames
        processFrame();

      } catch (err: any) {
        console.error("Error accessing webcam:", err);
        if (err.name === 'NotAllowedError') {
          setError("Camera permission denied. Please allow camera access.");
        } else if (err.name === 'NotFoundError') {
          setError("No camera found.");
        } else {
          setError("Could not access camera.");
        }
        setIsLoading(false);
      }
    };

    startWebcam();

    return () => {
      mounted = false;
      
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const processFrame = async () => {
    if (!videoRef.current || !faceMeshRef.current) return;
    
    if (videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
      await faceMeshRef.current.send({ image: videoRef.current });
    }
    
    animationFrameRef.current = requestAnimationFrame(processFrame);
  };

  const calculateEAR = (eye: any[]) => {
    const vertical1 = Math.sqrt(
      Math.pow(eye[1].x - eye[5].x, 2) + 
      Math.pow(eye[1].y - eye[5].y, 2)
    );
    const vertical2 = Math.sqrt(
      Math.pow(eye[2].x - eye[4].x, 2) + 
      Math.pow(eye[2].y - eye[4].y, 2)
    );
    const horizontal = Math.sqrt(
      Math.pow(eye[0].x - eye[3].x, 2) + 
      Math.pow(eye[0].y - eye[3].y, 2)
    );
    
    return (vertical1 + vertical2) / (2.0 * horizontal);
  };

  const calculateHeadTilt = (landmarks: any[]) => {
    const leftEye = landmarks[33];
    const rightEye = landmarks[263];
    
    const deltaY = rightEye.y - leftEye.y;
    const deltaX = rightEye.x - leftEye.x;
    
    return Math.atan2(deltaY, deltaX) * (180 / Math.PI);
  };

  const calculateEyeContact = (landmarks: any[]) => {
    const leftIris = landmarks[468];
    const rightIris = landmarks[473];
    const noseTip = landmarks[1];
    
    const centerX = (leftIris.x + rightIris.x) / 2;
    const deviation = Math.abs(centerX - noseTip.x);
    
    return deviation < 0.03;
  };

  const onResults = (results: any) => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

    if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
      const landmarks = results.multiFaceLandmarks[0];

      // Left eye
      const leftEye = [
        landmarks[33], landmarks[160], landmarks[158],
        landmarks[133], landmarks[153], landmarks[144]
      ];

      // Right eye
      const rightEye = [
        landmarks[362], landmarks[385], landmarks[387],
        landmarks[263], landmarks[373], landmarks[380]
      ];

      const leftEAR = calculateEAR(leftEye);
      const rightEAR = calculateEAR(rightEye);
      
      const EAR_THRESHOLD = 0.21;
      const leftOpen = leftEAR > EAR_THRESHOLD;
      const rightOpen = rightEAR > EAR_THRESHOLD;

      const goodEyeContact = calculateEyeContact(landmarks);
      const tilt = calculateHeadTilt(landmarks);

      const newMetrics: MediaPipeMetrics = {
        eyeContact: goodEyeContact,
        leftEyeOpen: leftOpen,
        rightEyeOpen: rightOpen,
        headTiltAngle: Math.abs(tilt),
        faceDetected: true
      };

      setMetrics(newMetrics);
      
      if (onMetricsUpdate) {
        onMetricsUpdate(newMetrics);
      }

      // Draw small indicators
      ctx.fillStyle = goodEyeContact ? '#00ff00' : '#ff0000';
      ctx.fillRect(10, 10, 20, 20);
      
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 14px Arial';
      ctx.shadowColor = 'rgba(0,0,0,0.8)';
      ctx.shadowBlur = 4;
      ctx.fillText(goodEyeContact ? '✓ Eye Contact' : '⚠ Look Here', 40, 25);
      ctx.shadowBlur = 0;

    } else {
      const newMetrics: MediaPipeMetrics = {
        eyeContact: false,
        leftEyeOpen: false,
        rightEyeOpen: false,
        headTiltAngle: 0,
        faceDetected: false
      };
      
      setMetrics(newMetrics);
      
      if (onMetricsUpdate) {
        onMetricsUpdate(newMetrics);
      }
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
      <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center text-gray-400">
            Loading camera with AI tracking...
          </div>
        )}

        {error ? (
          <div className="text-red-400 text-center p-4">
            <p>{error}</p>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              className="hidden"
              playsInline
              muted
            />
            <canvas
              ref={canvasRef}
              width="640"
              height="480"
              className="w-full h-full object-cover transform scale-x-[-1]"
            />
          </>
        )}

        {/* Metrics overlay */}
        {!isLoading && !error && (
          <div className="absolute bottom-4 left-4 right-4 bg-black bg-opacity-70 text-white p-3 rounded-lg text-xs">
            <div className="grid grid-cols-3 gap-2">
              <div>
                <span className="opacity-70">Face:</span>{' '}
                <span className={metrics.faceDetected ? 'text-green-400' : 'text-red-400'}>
                  {metrics.faceDetected ? '✓' : '✗'}
                </span>
              </div>
              <div>
                <span className="opacity-70">Eyes:</span>{' '}
                <span className={metrics.leftEyeOpen && metrics.rightEyeOpen ? 'text-green-400' : 'text-yellow-400'}>
                  {metrics.leftEyeOpen && metrics.rightEyeOpen ? '✓' : '⚠'}
                </span>
              </div>
              <div>
                <span className="opacity-70">Posture:</span>{' '}
                <span className={metrics.headTiltAngle < 10 ? 'text-green-400' : 'text-yellow-400'}>
                  {metrics.headTiltAngle < 10 ? '✓' : '⚠'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}