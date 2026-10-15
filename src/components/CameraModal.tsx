import React, { useRef, useState, useEffect } from 'react';
import { Camera, X, RefreshCw, AlertCircle } from 'lucide-react';

interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (base64Image: string) => void;
}

export const CameraModal: React.FC<CameraModalProps> = ({
  isOpen,
  onClose,
  onCapture,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      return;
    }

    startCamera();

    return () => {
      stopCamera();
    };
  }, [isOpen, facingMode]);

  const startCamera = async () => {
    setIsInitializing(true);
    setError(null);
    stopCamera();

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsInitializing(false);
    } catch (err: unknown) {
      console.error('Camera access error:', err);
      setError('Unable to access camera. Please ensure camera permissions are allowed in your browser.');
      setIsInitializing(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const takeSnapshot = () => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);

    stopCamera();
    onCapture(dataUrl);
    onClose();
  };

  const toggleFacingMode = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
      <div className="relative flex flex-col w-full max-w-lg bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-700">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-slate-950/80 text-white border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-emerald-400" />
            <h3 className="font-semibold text-sm sm:text-base">Scan Medical Receipt</h3>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            type="button"
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video Area */}
        <div className="relative aspect-3/4 sm:aspect-4/5 w-full bg-black flex items-center justify-center overflow-hidden">
          {error ? (
            <div className="p-6 text-center text-rose-300 max-w-xs flex flex-col items-center gap-3">
              <AlertCircle className="w-10 h-10 text-rose-400" />
              <p className="text-sm">{error}</p>
              <button
                onClick={startCamera}
                className="mt-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg"
              >
                Retry Camera
              </button>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                playsInline
                muted
                className="w-full h-full object-cover"
              />

              {/* Viewfinder Target Framing */}
              <div className="absolute inset-8 border-2 border-dashed border-emerald-400/70 rounded-2xl pointer-events-none flex flex-col justify-between p-4 shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]">
                <div className="flex justify-between items-center text-[10px] text-emerald-300 font-mono tracking-wider bg-black/50 px-2.5 py-1 rounded-md backdrop-blur-xs self-center">
                  ALIGN RECEIPT WITHIN FRAME
                </div>
                <div className="flex justify-between text-emerald-400/80">
                  <span className="w-4 h-4 border-b-2 border-l-2 border-emerald-400" />
                  <span className="w-4 h-4 border-b-2 border-r-2 border-emerald-400" />
                </div>
              </div>

              {isInitializing && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-white text-xs">
                  <RefreshCw className="w-6 h-6 animate-spin text-emerald-400 mb-2" />
                </div>
              )}
            </>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center justify-around p-5 bg-slate-950 border-t border-slate-800">
          <button
            onClick={toggleFacingMode}
            type="button"
            className="p-3 text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded-full transition-colors"
            title="Switch Camera"
          >
            <RefreshCw className="w-5 h-5" />
          </button>

          <button
            onClick={takeSnapshot}
            disabled={Boolean(error) || isInitializing}
            type="button"
            className="w-16 h-16 rounded-full bg-emerald-500 hover:bg-emerald-400 active:scale-95 disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center shadow-lg shadow-emerald-500/30 border-4 border-white transition-all"
            title="Take Photo"
          >
            <div className="w-6 h-6 rounded-full bg-white" />
          </button>

          <div className="w-11" />
        </div>
      </div>
    </div>
  );
};
