import MediaPipeMonitor from '../../components/MediaPipeMonitor';

export default function MediaPipeTestPage() {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center">
          MediaPipe Camera Test
        </h1>
        
        <MediaPipeMonitor />

        <div className="mt-8 p-6 bg-blue-50 border-2 border-blue-200 rounded-lg">
          <h3 className="font-bold text-lg mb-2">Instructions:</h3>
          <ol className="list-decimal list-inside space-y-1">
            <li>Click "Start Camera" and allow camera permission</li>
            <li>Position your face in front of the camera</li>
            <li>Look directly at the camera to see "Good Eye Contact"</li>
            <li>Look away to see the indicator change</li>
          </ol>
        </div>
      </div>
    </div>
  );
}