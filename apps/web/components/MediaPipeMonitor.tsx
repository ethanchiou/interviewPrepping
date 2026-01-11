"use client";

import { useRef, useEffect, useState } from 'react';

export default function MediaPipeMonitor() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState('Click Start to begin');
  const [faceDetected, setFaceDetected] = useState(false);
  const [eyeContact, setEyeContact] = useState(false);
  const [leftEyeOpen, setLeftEyeOpen] = useState(false);
  const [rightEyeOpen, setRightEyeOpen] = useState(false);
  const [headTiltAngle, setHeadTiltAngle] = useState(0);
  
  const faceMeshRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const startCamera = async () => {
    try {
      setStatus('Loading MediaPipe...');

      // Load MediaPipe dynamically
      const { FaceMesh } = await import('@mediapipe/face_mesh');
      
      setStatus('Initializing FaceMesh...');

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

      setStatus('Requesting camera access...');

      // Get camera stream
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: 640, 
          height: 480,
          facingMode: 'user'
        }
      });

      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setStatus('Camera active - analyzing...');

      // Start processing frames
      processFrame();

    } catch (error: any) {
      console.error('Error:', error);
      if (error.name === 'NotAllowedError') {
        setStatus('Camera permission denied');
      } else if (error.name === 'NotFoundError') {
        setStatus('No camera found');
      } else {
        setStatus('Error: ' + error.message);
      }
    }
  };

  const processFrame = async () => {
    if (!videoRef.current || !faceMeshRef.current) return;
    
    if (videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
      await faceMeshRef.current.send({ image: videoRef.current });
    }
    
    animationFrameRef.current = requestAnimationFrame(processFrame);
  };

  // Calculate Eye Aspect Ratio (EAR) for precise eye detection
  const calculateEAR = (eye: any[]) => {
    // Vertical eye landmarks
    const vertical1 = Math.sqrt(
      Math.pow(eye[1].x - eye[5].x, 2) + 
      Math.pow(eye[1].y - eye[5].y, 2) + 
      Math.pow((eye[1].z || 0) - (eye[5].z || 0), 2)
    );
    const vertical2 = Math.sqrt(
      Math.pow(eye[2].x - eye[4].x, 2) + 
      Math.pow(eye[2].y - eye[4].y, 2) + 
      Math.pow((eye[2].z || 0) - (eye[4].z || 0), 2)
    );
    
    // Horizontal eye landmarks
    const horizontal = Math.sqrt(
      Math.pow(eye[0].x - eye[3].x, 2) + 
      Math.pow(eye[0].y - eye[3].y, 2) + 
      Math.pow((eye[0].z || 0) - (eye[3].z || 0), 2)
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
    // Use iris landmarks for more precise gaze tracking
    const leftIris = landmarks[468];
    const rightIris = landmarks[473];
    const noseTip = landmarks[1];
    
    // Calculate horizontal deviation from center
    const centerX = (leftIris.x + rightIris.x) / 2;
    const deviation = Math.abs(centerX - noseTip.x);
    
    // More strict threshold for better eye contact detection
    return deviation < 0.03;
  };

  const onResults = (results: any) => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear and draw video
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

    if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
      const landmarks = results.multiFaceLandmarks[0];
      
      setFaceDetected(true);

      // Left eye landmarks (6 points around eye)
      const leftEye = [
        landmarks[33],   // outer corner
        landmarks[160],  // top
        landmarks[158],  // top-inner
        landmarks[133],  // inner corner
        landmarks[153],  // bottom-inner
        landmarks[144]   // bottom
      ];

      // Right eye landmarks
      const rightEye = [
        landmarks[362],  // outer corner
        landmarks[385],  // top
        landmarks[387],  // top-inner
        landmarks[263],  // inner corner
        landmarks[373],  // bottom-inner
        landmarks[380]   // bottom
      ];

      // Calculate EAR for both eyes
      const leftEAR = calculateEAR(leftEye);
      const rightEAR = calculateEAR(rightEye);
      
      // Eye is open if EAR is above threshold (typically 0.2-0.25)
      const EAR_THRESHOLD = 0.21;
      const leftOpen = leftEAR > EAR_THRESHOLD;
      const rightOpen = rightEAR > EAR_THRESHOLD;
      
      setLeftEyeOpen(leftOpen);
      setRightEyeOpen(rightOpen);

      // Eye contact detection
      const goodEyeContact = calculateEyeContact(landmarks);
      setEyeContact(goodEyeContact);

      // Head tilt
      const tilt = calculateHeadTilt(landmarks);
      setHeadTiltAngle(Math.abs(tilt));

      // Draw eye indicators on canvas
      // Left eye
      ctx.fillStyle = leftOpen ? '#00ff00' : '#ff0000';
      ctx.beginPath();
      ctx.arc(leftEye[0].x * canvas.width, leftEye[0].y * canvas.height, 8, 0, 2 * Math.PI);
      ctx.fill();

      // Right eye
      ctx.fillStyle = rightOpen ? '#00ff00' : '#ff0000';
      ctx.beginPath();
      ctx.arc(rightEye[0].x * canvas.width, rightEye[0].y * canvas.height, 8, 0, 2 * Math.PI);
      ctx.fill();

      // Eye contact indicator
      ctx.fillStyle = goodEyeContact ? '#00ff00' : '#ff0000';
      ctx.fillRect(10, 10, 30, 30);
      
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 16px Arial';
      ctx.fillText(goodEyeContact ? 'Good Eye Contact ✓' : 'Look at Camera', 50, 30);

      // Draw EAR values for debugging
      ctx.fillStyle = '#ffff00';
      ctx.font = '12px Arial';
      ctx.fillText(`L-EAR: ${leftEAR.toFixed(3)}`, 10, canvas.height - 40);
      ctx.fillText(`R-EAR: ${rightEAR.toFixed(3)}`, 10, canvas.height - 20);
      ctx.fillText(`Tilt: ${tilt.toFixed(1)}°`, 150, canvas.height - 20);

    } else {
      setFaceDetected(false);
      setEyeContact(false);
      setLeftEyeOpen(false);
      setRightEyeOpen(false);
    }
  };

  const stopCamera = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }

    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }

    setStatus('Camera stopped');
    setFaceDetected(false);
    setEyeContact(false);
    setLeftEyeOpen(false);
    setRightEyeOpen(false);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <div className="p-4 bg-white rounded-lg shadow-lg max-w-2xl">
      <h2 className="text-2xl font-bold mb-4">MediaPipe Test (Enhanced)</h2>
      
      {/* Video/Canvas */}
      <div className="relative bg-black rounded-lg overflow-hidden mb-4">
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
          className="w-full"
        />
      </div>

      {/* Controls */}
      <div className="flex gap-3 mb-4">
        <button
          onClick={startCamera}
          className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg"
        >
          Start Camera
        </button>
        <button
          onClick={stopCamera}
          className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-6 rounded-lg"
        >
          Stop Camera
        </button>
      </div>

      {/* Status */}
      <div className="space-y-2">
        <div className="p-3 bg-blue-50 border-2 border-blue-200 rounded">
          <span className="font-semibold">Status: </span>
          <span>{status}</span>
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          <div className="p-3 bg-gray-100 rounded">
            <span className="font-semibold">Face Detected: </span>
            <span className={faceDetected ? 'text-green-600 font-bold' : 'text-red-600'}>
              {faceDetected ? 'YES' : 'NO'}
            </span>
          </div>
          
          <div className="p-3 bg-gray-100 rounded">
            <span className="font-semibold">Eye Contact: </span>
            <span className={eyeContact ? 'text-green-600 font-bold' : 'text-yellow-600'}>
              {eyeContact ? 'GOOD' : 'NEEDS WORK'}
            </span>
          </div>

          <div className="p-3 bg-gray-100 rounded">
            <span className="font-semibold">Left Eye: </span>
            <span className={leftEyeOpen ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>
              {leftEyeOpen ? 'OPEN' : 'CLOSED'}
            </span>
          </div>

          <div className="p-3 bg-gray-100 rounded">
            <span className="font-semibold">Right Eye: </span>
            <span className={rightEyeOpen ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>
              {rightEyeOpen ? 'OPEN' : 'CLOSED'}
            </span>
          </div>

          <div className="p-3 bg-gray-100 rounded col-span-2">
            <span className="font-semibold">Head Tilt: </span>
            <span className="text-gray-800 font-bold">
              {headTiltAngle.toFixed(1)}°
            </span>
            <span className={`ml-2 ${headTiltAngle < 10 ? 'text-green-600' : 'text-yellow-600'}`}>
              {headTiltAngle < 10 ? '(Good posture)' : '(Straighten head)'}
            </span>
          </div>
        </div>

        <div className="p-3 bg-yellow-50 border-2 border-yellow-200 rounded text-sm">
          <span className="font-semibold">💡 Tip: </span>
          Watch the green/red circles on your eyes and the L-EAR/R-EAR values at the bottom of the video.
          Eyes should show GREEN when open and RED when closed.
        </div>
      </div>
    </div>
  );
}
