import React, { useState, useRef, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { Canvas } from './components/Canvas';
import { AIVideoModal } from './components/AIVideoModal';
import { AIAudioModal } from './components/AIAudioModal';
import { AIMusicModal } from './components/AIMusicModal';
import { type EditorState } from './types';
import { Download, Share2 } from 'lucide-react';

export default function App() {
  const [state, setState] = useState<EditorState>({
    mockup: 'macos',
    background: 'gradient-1',
    padding: 60,
    shadow: true,
    tilt: false,
    lensBlur: false,
    autoZoom: false,
  });

  const [recordingStatus, setRecordingStatus] = useState<'idle' | 'recording' | 'recorded'>('idle');
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [isSpeechModalOpen, setIsSpeechModalOpen] = useState(false);
  const [isMusicModalOpen, setIsMusicModalOpen] = useState(false);
  
  const [generatedSpeechUrl, setGeneratedSpeechUrl] = useState<string | null>(null);
  const [generatedMusicUrl, setGeneratedMusicUrl] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      // Prompt user for screen sharing
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          displaySurface: 'monitor',
        },
        audio: true, // Try to capture audio as well
      });
      
      setVideoStream(stream);
      setRecordingStatus('recording');
      setRecordedUrl(null);
      setErrorMsg(null);
      recordedChunksRef.current = [];

      const options = { mimeType: 'video/webm; codecs=vp8,opus' };
      // Fallback
      const mimeType = MediaRecorder.isTypeSupported(options.mimeType) ? options.mimeType : 'video/webm';
      
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(blob);
        setRecordedUrl(url);
        setVideoStream(null);
        setRecordingStatus('recorded');
        
        // Cleanup all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      // Also listen to the user clicking "Stop sharing" on the native browser bar
      stream.getVideoTracks()[0].onended = () => {
        if (mediaRecorder.state !== 'inactive') {
          mediaRecorder.stop();
        }
      };

      mediaRecorder.start();
    } catch (err: any) {
      console.error("Failed to start recording:", err);
      if (err.message && err.message.includes('permissions policy')) {
         setErrorMsg('Screen capture is blocked in this embedded preview. Please click "Share" -> "Open App in New Tab", or use a standalone browser window to record your screen.');
      } else if (err.name === 'NotAllowedError' || (err.message && err.message.toLowerCase().includes('permission denied'))) {
         setErrorMsg('Screen recording was canceled or permission was denied.');
      } else {
         setErrorMsg('Failed to start recording: ' + err.message);
      }
      // Reset state if canceled or failed
      setRecordingStatus('idle');
      setVideoStream(null);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };

  const clearRecording = () => {
    if (recordedUrl) {
      URL.revokeObjectURL(recordedUrl);
      setRecordedUrl(null);
    }
    setRecordingStatus('idle');
    setVideoStream(null);
    setErrorMsg(null);
  };

  const handleDownload = () => {
    if (!recordedUrl) return;
    const a = document.createElement('a');
    a.href = recordedUrl;
    a.download = `demokite-recording-${new Date().getTime()}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="flex flex-col md:flex-row h-[100dvh] bg-neutral-50 overflow-hidden font-sans">
      <div className="flex-1 md:flex-none md:w-80 overflow-y-auto order-last md:order-first bg-white border-t md:border-t-0 md:border-r border-gray-200">
        <Sidebar 
           state={state} 
           setState={setState} 
           onRecord={startRecording}
           onStopRecord={stopRecording}
           recordingStatus={recordingStatus}
           onClear={clearRecording}
           errorMsg={errorMsg}
           onOpenVideoGen={() => setIsVideoModalOpen(true)}
           onOpenSpeechGen={() => setIsSpeechModalOpen(true)}
           onOpenMusicGen={() => setIsMusicModalOpen(true)}
        />
      </div>
      
      <div className="flex-none h-[55dvh] md:h-auto md:flex-1 flex flex-col min-w-0 order-first md:order-last relative">
        <header className="h-14 border-b border-gray-200 bg-white/80 backdrop-blur shrink-0 flex items-center justify-between px-4 md:px-6 z-10">
           <div className="text-sm font-medium text-gray-500">
             {recordingStatus === 'recording' ? (
                <div className="flex items-center space-x-2 text-red-500">
                   <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                   <span>Recording live screen...</span>
                </div>
             ) : 'Studio Canvas'}
           </div>
           
           <div className="flex space-x-3">
              <button className="h-9 px-4 rounded-md border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-medium flex items-center space-x-2 transition-colors">
                 <Share2 className="w-4 h-4" />
                 <span>Share</span>
              </button>
              <button 
                 onClick={handleDownload}
                 disabled={!recordedUrl}
                 className="h-9 px-4 rounded-md bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm font-medium flex items-center space-x-2 transition-colors shadow-sm"
              >
                 <Download className="w-4 h-4" />
                 <span>Download Raw Video</span>
              </button>
           </div>
        </header>
        
        <main className="flex-1 flex flex-col relative">
           <Canvas 
             state={state}
             videoStream={videoStream}
             recordedUrl={recordedUrl}
           />
           {/* Timeline Context (Visual placeholder) */}
           <div className="h-48 border-t border-gray-200 bg-white shrink-0 p-4 overflow-y-auto">
             <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Timeline</div>
             <div className="bg-gray-50 border border-gray-200 rounded-lg h-24 flex items-center px-4 relative overflow-x-auto">
                {!recordedUrl && !videoStream && !generatedSpeechUrl && !generatedMusicUrl ? (
                   <span className="text-gray-400 text-sm italic mx-auto">No clips recorded yet.</span>
                ) : (
                  <>
                   {recordedUrl || videoStream ? (
                   <div className="h-16 shrink-0 min-w-[200px] w-1/3 bg-indigo-100 border border-indigo-200 rounded-md relative group flex flex-col shadow-sm">
                      {/* Fake Thumbnails */}
                      <div className="absolute inset-0 flex opacity-30 pointer-events-none overflow-hidden rounded-md">
                         <div className="w-16 h-full border-r border-indigo-200"></div>
                         <div className="w-16 h-full border-r border-indigo-200"></div>
                         <div className="w-16 h-full border-r border-indigo-200"></div>
                         <div className="w-16 h-full border-r border-indigo-200"></div>
                      </div>
                      <div className="h-1.5 w-full bg-indigo-500 rounded-t-md shrink-0"></div>
                      <div className="flex-1 flex items-center px-3 z-10 w-full overflow-hidden">
                         <span className="text-xs font-medium text-indigo-800 pr-2 truncate">
                           {recordingStatus === 'recording' ? 'Recording...' : 'Screen Recording.webm'}
                         </span>
                      </div>
                   </div>
                   ) : null}
                   
                   {generatedSpeechUrl && (
                      <div className="h-16 shrink-0 w-64 bg-blue-100 border border-blue-200 rounded-md relative flex flex-col shadow-sm ml-4">
                         <div className="h-1.5 w-full bg-blue-500 rounded-t-md shrink-0"></div>
                         <div className="flex-1 flex items-center px-3 justify-between z-10 w-full overflow-hidden">
                            <span className="text-xs font-medium text-blue-800 pr-2 truncate">Voice Over</span>
                            <audio src={generatedSpeechUrl} autoPlay controls className="h-8 max-w-[120px]" />
                         </div>
                      </div>
                   )}
                   {generatedMusicUrl && (
                      <div className="h-16 shrink-0 w-64 bg-pink-100 border border-pink-200 rounded-md relative flex flex-col shadow-sm ml-4">
                         <div className="h-1.5 w-full bg-pink-500 rounded-t-md shrink-0"></div>
                         <div className="flex-1 flex items-center px-3 justify-between z-10 w-full overflow-hidden">
                            <span className="text-xs font-medium text-pink-800 pr-2 truncate">BG Music</span>
                            <audio src={generatedMusicUrl} autoPlay controls className="h-8 max-w-[120px]" />
                         </div>
                      </div>
                   )}
                  </>
                )}
             </div>
           </div>
        </main>
      </div>
      
      <AIVideoModal 
        isOpen={isVideoModalOpen} 
        onClose={() => setIsVideoModalOpen(false)} 
        onVideoGenerated={(url) => {
          setRecordedUrl(url);
          setRecordingStatus('recorded');
          setVideoStream(null);
        }} 
      />
      <AIAudioModal
        isOpen={isSpeechModalOpen}
        onClose={() => setIsSpeechModalOpen(false)}
        onAudioGenerated={(url) => {
          setGeneratedSpeechUrl(url);
        }}
      />
      <AIMusicModal
        isOpen={isMusicModalOpen}
        onClose={() => setIsMusicModalOpen(false)}
        onMusicGenerated={(url) => {
          setGeneratedMusicUrl(url);
        }}
      />
    </div>
  );
}
