import { useEffect, useRef, useState, useCallback } from 'react';
import { X, Camera, RotateCcw, Check, SwitchCamera } from 'lucide-react';
import toast from 'react-hot-toast';

// Opens the device camera in a modal, lets the user snap a photo, and returns
// it to the caller as a JPEG File via onCapture(file).
export default function CameraCapture({ onCapture, onClose }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [photoUrl, setPhotoUrl] = useState(null);
  const [error, setError] = useState(null);
  const [facing, setFacing] = useState('environment'); // 'environment' = back camera, 'user' = front

  const startCamera = useCallback((mode) => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    navigator.mediaDevices?.getUserMedia({ video: { facingMode: mode } })
      .then(stream => {
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
        setError(null);
      })
      .catch(() => setError('Could not access camera. Check browser permissions.'));
  }, []);

  useEffect(() => {
    startCamera(facing);
    return () => streamRef.current?.getTracks().forEach(t => t.stop());
  }, [facing, startCamera]);

  const flipCamera = () => setFacing(f => (f === 'environment' ? 'user' : 'environment'));

  const takePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !video.videoWidth) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    setPhotoUrl(canvas.toDataURL('image/jpeg', 0.92));
  };

  const retake = () => setPhotoUrl(null);

  const usePhoto = () => {
    canvasRef.current.toBlob(blob => {
      if (!blob) { toast.error('Could not process photo'); return; }
      const file = new File([blob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
      onCapture(file);
      onClose();
    }, 'image/jpeg', 0.92);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl overflow-hidden w-full max-w-md">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <span className="font-semibold text-gray-900 flex items-center gap-2">
            <Camera className="w-4 h-4" /> Take Photo
          </span>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-black aspect-[4/3] relative flex items-center justify-center">
          {error ? (
            <p className="text-white text-sm p-6 text-center">{error}</p>
          ) : photoUrl ? (
            <img src={photoUrl} alt="Captured" className="w-full h-full object-contain" />
          ) : (
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-contain" />
          )}
          <canvas ref={canvasRef} className="hidden" />

          {!photoUrl && !error && (
            <button onClick={flipCamera} title="Switch camera"
              className="absolute top-3 right-3 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-colors">
              <SwitchCamera className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="p-4 flex gap-3">
          {photoUrl ? (
            <>
              <button onClick={retake} className="btn-secondary flex-1 flex items-center justify-center gap-2">
                <RotateCcw className="w-4 h-4" /> Retake
              </button>
              <button onClick={usePhoto} className="btn-primary flex-1 flex items-center justify-center gap-2">
                <Check className="w-4 h-4" /> Use Photo
              </button>
            </>
          ) : (
            <button onClick={takePhoto} disabled={!!error} className="btn-primary flex-1 flex items-center justify-center gap-2">
              <Camera className="w-4 h-4" /> Capture
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
