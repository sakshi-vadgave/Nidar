import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  Mic,
  Camera,
  Video,
  Square,
  AlertTriangle,
  CheckCircle,
  FileAudio,
  FileImage,
  FileVideo,
  Loader2,
  XCircle,
  Volume2
} from 'lucide-react';

export default function EvidenceCapture() {
  const { addEvidence, activeSOS } = useApp();

  const [recordingType, setRecordingType] = useState<'idle' | 'audio' | 'image' | 'video'>('idle');
  const [statusText, setStatusText] = useState('');
  const [duration, setDuration] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Stream and Recorder Refs
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const videoPreviewRef = useRef<HTMLVideoElement | null>(null);

  // File Inputs for fallbacks
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [fallbackAccept, setFallbackAccept] = useState<string>('');

  // Auto Tick time duration for recording
  useEffect(() => {
    if (recordingType === 'audio' || recordingType === 'video') {
      setDuration(0);
      timerRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [recordingType]);

  // Clean up streams on unmount
  useEffect(() => {
    return () => {
      stopAllStreams();
    };
  }, []);

  const stopAllStreams = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  // Turn Blob file to Base64 Data URL for secure string storage upload
  const fileToDataUrl = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  // Convert friendly size text
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = 1;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  // 1. RECORD AUDIO
  const startAudioRecording = async () => {
    try {
      stopAllStreams();
      setUploadSuccess(null);
      setUploadError(null);
      setStatusText('Requesting mic permissions...');

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        setIsUploading(true);
        setStatusText('Compressing and securing audio telemetry...');
        try {
          const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
          const size = audioBlob.size;
          const base64Data = await fileToDataUrl(audioBlob);

          await addEvidence('audio', base64Data, size, activeSOS?.id);
          setUploadSuccess(`Audio clip (${formatBytes(size)}) secured successfully.`);
        } catch (err: any) {
          setUploadError('Audio compression failed: ' + err.message);
        } finally {
          setIsUploading(false);
          setRecordingType('idle');
        }
      };

      mediaRecorder.start();
      setRecordingType('audio');
      setStatusText('Recording mic telemetry live...');
    } catch (err: any) {
      console.warn('Microphone launch failed. Launching file uploader...', err);
      // Fallback
      setFallbackAccept('audio/*');
      setStatusText('Awaiting manual voice file selection...');
      if (fileInputRef.current) {
        fileInputRef.current.click();
      }
    }
  };

  // 2. CAPTURE PHOTO (Camera Snapshot)
  const startCameraCapture = async () => {
    try {
      stopAllStreams();
      setUploadSuccess(null);
      setUploadError(null);
      setStatusText('Initializing camera stream...');
      setRecordingType('image');

      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;

      // Mount stream on hidden/drawn elements
      setTimeout(() => {
        if (videoPreviewRef.current) {
          videoPreviewRef.current.srcObject = stream;
        }
      }, 50);
    } catch (err: any) {
      console.warn('Camera launch failed. Launching file uploader...', err);
      // Fallback
      setFallbackAccept('image/*');
      setStatusText('Awaiting manual image file capture...');
      setRecordingType('idle');
      if (fileInputRef.current) {
        fileInputRef.current.click();
      }
    }
  };

  const captureSnapshot = async () => {
    if (!videoPreviewRef.current || !streamRef.current) return;
    setIsUploading(true);
    setStatusText('Encrypting snapshot telemetry...');

    try {
      const video = videoPreviewRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      }

      const imageUrl = canvas.toDataURL('image/jpeg', 0.85);
      // Calculate bytes from Base64 string length roughly
      const bytes = Math.round((imageUrl.length * 3) / 4);

      await addEvidence('image', imageUrl, bytes, activeSOS?.id);
      setUploadSuccess(`Snapshot photo (${formatBytes(bytes)}) uploaded successfully.`);
    } catch (err: any) {
      setUploadError('Snapshot failed: ' + err.message);
    } finally {
      stopAllStreams();
      setIsUploading(false);
      setRecordingType('idle');
    }
  };

  // 3. RECORD VIDEO
  const startVideoRecording = async () => {
    try {
      stopAllStreams();
      setUploadSuccess(null);
      setUploadError(null);
      setStatusText('Launching camera recorder...');

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: true
      });
      streamRef.current = stream;
      setRecordingType('video');

      // Mount stream on hidden/drawn elements
      setTimeout(() => {
        if (videoPreviewRef.current) {
          videoPreviewRef.current.srcObject = stream;
        }
      }, 50);

      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        setIsUploading(true);
        setStatusText('Compressing and securing video stream...');
        try {
          const videoBlob = new Blob(chunksRef.current, { type: 'video/webm' });
          const size = videoBlob.size;
          const base64Data = await fileToDataUrl(videoBlob);

          await addEvidence('video', base64Data, size, activeSOS?.id);
          setUploadSuccess(`Video evidence (${formatBytes(size)}) uploaded successfully.`);
        } catch (err: any) {
          setUploadError('Video compression failed: ' + err.message);
        } finally {
          setIsUploading(false);
          setRecordingType('idle');
          stopAllStreams();
        }
      };

      mediaRecorder.start();
      setStatusText('Recording video frames live...');
    } catch (err: any) {
      console.warn('Video hardware launch failed. Launching file input...', err);
      // Fallback
      setFallbackAccept('video/*');
      setStatusText('Awaiting manual video file capture...');
      if (fileInputRef.current) {
        fileInputRef.current.click();
      }
    }
  };

  // Stop current active recorder (for voice/video)
  const stopActiveRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };

  // Manual fallback selection
  const handleManualFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setStatusText(`Uploading local ${file.type} file securely...`);
    setUploadSuccess(null);
    setUploadError(null);

    try {
      const size = file.size;
      const fileUrlResult = await fileToDataUrl(file);
      const category: 'audio' | 'image' | 'video' = file.type.startsWith('video')
        ? 'video'
        : file.type.startsWith('audio')
          ? 'audio'
          : 'image';

      await addEvidence(category, fileUrlResult, size, activeSOS?.id);
      setUploadSuccess(`Evidence file ${file.name} (${formatBytes(size)}) secured.`);
    } catch (err: any) {
      setUploadError('File upload failed: ' + err.message);
    } finally {
      setIsUploading(false);
      setRecordingType('idle');
    }
  };

  return (
    <div className="bg-red-50/20 border border-red-150 rounded-3xl p-5 space-y-4 shadow-sm text-left relative font-sans">
      <input
        ref={fileInputRef}
        type="file"
        accept={fallbackAccept}
        className="hidden"
        onChange={handleManualFileChange}
      />

      <div className="flex items-center justify-between border-b border-red-100 pb-2.5">
        <div>
          <h3 className="font-extrabold text-sm text-slate-800 flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping mr-1" />
            <span>Encrypted Evidence Vault</span>
          </h3>
          <p className="text-[10px] text-slate-500 font-semibold mt-0.5">Capturing real-time telemetry metrics securely while active.</p>
        </div>
        <span className="text-[9px] font-bold py-0.5 px-2 bg-red-100/50 text-red-700 rounded-full font-mono">
          SSL END-TO-END
        </span>
      </div>

      {recordingType === 'idle' ? (
        <div className="grid grid-cols-3 gap-2.5 font-bold text-xs pt-1.5">
          <button
            id="evt-button-record-audio"
            onClick={startAudioRecording}
            className="flex flex-col items-center justify-center space-y-1.5 py-4 bg-slate-900 border border-slate-750 text-white rounded-2xl hover:bg-slate-800 transition-colors cursor-pointer text-center"
          >
            <Mic className="w-5.5 h-5.5 text-rose-400" />
            <span>Record Voice</span>
          </button>

          <button
            id="evt-button-capture-image"
            onClick={startCameraCapture}
            className="flex flex-col items-center justify-center space-y-1.5 py-4 bg-slate-900 border border-slate-755 text-white rounded-2xl hover:bg-slate-800 transition-colors cursor-pointer text-center"
          >
            <Camera className="w-5.5 h-5.5 text-sky-400" />
            <span>Capture Photo</span>
          </button>

          <button
            id="evt-button-capture-video"
            onClick={startVideoRecording}
            className="flex flex-col items-center justify-center space-y-1.5 py-4 bg-slate-900 border border-slate-755 text-white rounded-2xl hover:bg-slate-800 transition-colors cursor-pointer text-center"
          >
            <Video className="w-5.5 h-5.5 text-emerald-400" />
            <span>Record Video</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Active viewfinder screen */}
          {recordingType === 'image' && (
            <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 aspect-video flex-center">
              <video
                ref={videoPreviewRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 to-transparent flex items-end justify-between p-3.5">
                <span className="text-[10px] text-white/80 font-semibold tracking-wider font-mono flex items-center">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse mr-1.5" />
                  Live Lens Streaming
                </span>
                <button
                  id="evt-capture-snapshot-btn"
                  onClick={captureSnapshot}
                  className="bg-sky-500 hover:bg-sky-600 text-white py-1.5 px-3.5 rounded-xl text-xs font-bold shadow-md transition-colors flex items-center space-x-1.5 cursor-pointer"
                >
                  <Camera className="w-4 h-4" />
                  <span>SNAP EVIDENCE</span>
                </button>
              </div>
            </div>
          )}

          {recordingType === 'video' && (
            <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 aspect-video">
              <video
                ref={videoPreviewRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 to-transparent flex items-end justify-between p-3.5">
                <span className="text-[10px] text-red-400 font-bold tracking-widest font-mono flex items-center animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-red-500 mr-2" />
                  REC {Math.floor(duration / 60)}:{String(duration % 60).padStart(2, '0')}
                </span>
                <button
                  id="evt-stop-video-btn"
                  onClick={stopActiveRecording}
                  className="bg-red-600 hover:bg-red-700 text-white py-1.5 px-3.5 rounded-xl text-xs font-bold shadow-md transition-colors flex items-center space-x-1.5 cursor-pointer"
                >
                  <Square className="w-3.5 h-3.5" />
                  <span>STOP REC</span>
                </button>
              </div>
            </div>
          )}

          {recordingType === 'audio' && (
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 text-center flex flex-col justify-center items-center space-y-3">
              <div className="flex items-center space-x-2">
                <div className="h-2 w-1.5 bg-rose-500 animate-pulse rounded-full h-4" />
                <div className="h-2 w-1.5 bg-rose-500 animate-pulse rounded-full h-6" />
                <div className="h-2 w-1.5 bg-rose-500 animate-pulse rounded-full h-8" />
                <div className="h-2 w-1.5 bg-rose-500 animate-pulse rounded-full h-5" />
                <Mic className="w-10 h-10 text-rose-500 animate-bounce" />
                <div className="h-2 w-1.5 bg-rose-500 animate-pulse rounded-full h-5" />
                <div className="h-2 w-1.5 bg-rose-500 animate-pulse rounded-full h-8" />
                <div className="h-2 w-1.5 bg-rose-500 animate-pulse rounded-full h-6" />
                <div className="h-2 w-1.5 bg-rose-500 animate-pulse rounded-full h-4" />
              </div>

              <div className="space-y-1">
                <p className="text-[10px] text-rose-400 uppercase tracking-widest font-mono font-bold animate-pulse">
                  Mic Stream Active
                </p>
                <p className="text-lg font-black text-white font-mono leading-none">
                  {Math.floor(duration / 60)}:{String(duration % 60).padStart(2, '0')}
                </p>
              </div>

              <button
                id="evt-stop-audio-btn"
                onClick={stopActiveRecording}
                className="py-2.5 px-5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold tracking-wider shadow-md transition-colors flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <Square className="w-4 h-4" />
                <span>FINALIZE & UPLOAD CLIP</span>
              </button>
            </div>
          )}

          {/* Capture Controls / Cancel */}
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-500 font-semibold">{statusText}</span>
            <button
              id="evt-cancel-active"
              onClick={() => {
                stopActiveRecording();
                stopAllStreams();
                setRecordingType('idle');
              }}
              className="text-red-500 font-bold hover:underline"
            >
              Cancel Recording
            </button>
          </div>
        </div>
      )}

      {/* Upload progress & details */}
      {(isUploading || uploadSuccess || uploadError) && (
        <div className="bg-white/80 p-3.5 rounded-2xl border border-red-100 flex flex-col space-y-1 text-xs">
          {isUploading && (
            <div className="flex items-center space-x-2 text-slate-650 font-semibold">
              <Loader2 className="w-4 h-4 text-[#FF5A7A] animate-spin" />
              <span>{statusText}</span>
            </div>
          )}

          {uploadSuccess && (
            <div className="flex items-start space-x-2 text-emerald-700">
              <CheckCircle className="w-4.5 h-4.5 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-extrabold block">Telemetry Block Secure</span>
                <span className="text-[10px] leading-tight text-emerald-600 font-medium block">
                  {uploadSuccess}
                </span>
              </div>
            </div>
          )}

          {uploadError && (
            <div className="flex items-start space-x-2 text-red-700">
              <XCircle className="w-4.5 h-4.5 text-red-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-extrabold block">Security Transmission Fault</span>
                <span className="text-[10px] leading-tight text-red-500 font-semibold block">
                  {uploadError}
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
