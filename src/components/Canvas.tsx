import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { type EditorState, type BackgroundType } from '../types';
import { cn } from '../utils';

interface CanvasProps {
  state: EditorState;
  videoStream: MediaStream | null;
  recordedUrl: string | null;
}

const getBgClasses = (bg: BackgroundType) => {
  switch (bg) {
    case 'transparent': return 'bg-gray-100/50 backdrop-blur-sm [background-image:radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]';
    case 'solid-dark': return 'bg-gray-900';
    case 'solid-light': return 'bg-gray-50';
    case 'gradient-1': return 'bg-gradient-to-br from-orange-400 via-pink-500 to-purple-600';
    case 'gradient-2': return 'bg-gradient-to-br from-blue-400 via-teal-400 to-emerald-400';
    case 'gradient-3': return 'bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500';
    default: return 'bg-gray-100';
  }
};

export function Canvas({ state, videoStream, recordedUrl }: CanvasProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const ambientVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const attachStream = (el: HTMLVideoElement | null) => {
      if (el) {
        if (recordedUrl) {
            el.srcObject = null;
            el.src = recordedUrl;
            el.play().catch(() => {});
        } else if (videoStream) {
            el.src = '';
            el.srcObject = videoStream;
            el.play().catch(() => {});
        } else {
          el.srcObject = null;
          el.src = '';
        }
      }
    };

    attachStream(videoRef.current);
    attachStream(ambientVideoRef.current);
  }, [videoStream, recordedUrl, state.lensBlur]);

  return (
    <div className="flex-1 bg-neutral-100 overflow-hidden relative flex items-center justify-center p-4 md:p-8">
      {/* Aspect Ratio Container for Output (16:9 like) */}
      <div 
         id="render-canvas"
         className={cn(
             "w-full max-w-5xl aspect-video rounded-md overflow-hidden relative flex items-center justify-center transition-all duration-500 ease-out",
             getBgClasses(state.background)
         )}
         style={{ padding: `${state.padding}px` }}
      >
        {!videoStream && !recordedUrl ? (
           <div className="text-center font-medium bg-white/80 backdrop-blur px-6 py-4 rounded-2xl shadow-lg border border-white max-w-sm text-gray-600 z-10">
               Click "Record Screen" in the sidebar to start creating your stunning demo.
           </div>
        ) : (
          <>
            {/* Ambient Cinematic Lens Blur Layer */}
            <AnimatePresence>
              {state.lensBlur && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.7 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-0 overflow-hidden pointer-events-none scale-110 blur-[64px]"
                >
                  <video 
                    ref={ambientVideoRef}
                    className="w-full h-full object-cover brightness-110"
                    autoPlay
                    muted
                    loop={!!recordedUrl}
                    playsInline
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div
              layout
              transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
              className={cn(
                "relative z-10 w-full h-full flex flex-col overflow-hidden max-h-full max-w-full m-auto",
              state.mockup === 'macos' ? "rounded-xl border border-gray-900/10 bg-black" : "",
              state.mockup === 'windows' ? "rounded-xl border border-gray-900/10 bg-black" : "",
              state.mockup === 'browser' ? "rounded-xl border border-gray-900/10 bg-white" : "",
              state.mockup === 'glass' ? "rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md p-1" : "",
              state.mockup === 'surface-pro' ? "rounded-2xl sm:rounded-3xl border-[16px] sm:border-[24px] border-black bg-black" : "",
              state.mockup === 'surface-studio' ? "rounded-xl sm:rounded-2xl border-[12px] sm:border-[16px] border-b-[24px] sm:border-b-[32px] border-black bg-black outline outline-1 outline-gray-800" : "",
              state.shadow && state.mockup !== 'none' ? "shadow-2xl shadow-black/40" : "",
              state.mockup !== 'glass' && state.mockup !== 'browser' ? "bg-black" : ""
            )}
            style={{
              transform: state.tilt ? "perspective(1000px) rotateX(15deg) rotateY(-10deg) rotateZ(2deg) scale(0.9)" : "none",
              transition: "transform 0.4s ease-out"
            }}
          >
            <AnimatePresence initial={false}>
              {/* macOS Header */}
              {state.mockup === 'macos' && (
                <motion.div 
                   key="macos-header"
                   initial={{ height: 0, opacity: 0 }}
                   animate={{ height: 32, opacity: 1 }}
                   exit={{ height: 0, opacity: 0 }}
                   transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                   className="bg-gray-100/90 backdrop-blur flex items-center px-4 space-x-2 border-b border-gray-200 shrink-0 overflow-hidden"
                >
                  <div className="w-2.5 h-2.5 rounded-full bg-red-400 shrink-0"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-green-400 shrink-0"></div>
                </motion.div>
              )}

              {/* Windows 11 Header */}
              {state.mockup === 'windows' && (
                <motion.div
                   key="windows-header"
                   initial={{ height: 0, opacity: 0 }}
                   animate={{ height: 32, opacity: 1 }}
                   exit={{ height: 0, opacity: 0 }}
                   transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                   className="bg-gray-100/90 backdrop-blur flex items-center justify-between px-3 border-b border-gray-200 shrink-0 text-gray-500 overflow-hidden"
                >
                   <div className="text-[11px] font-medium pl-1 text-gray-700 whitespace-nowrap">App</div>
                   <div className="flex space-x-4 pr-1 text-gray-500 items-center shrink-0">
                     <svg width="10" height="1" viewBox="0 0 10 1"><path fill="currentColor" d="M0 0h10v1H0z"/></svg>
                     <svg width="10" height="10" viewBox="0 0 10 10"><path fill="none" stroke="currentColor" d="M.5.5h9v9h-9z"/></svg>
                     <svg width="10" height="10" viewBox="0 0 10 10"><path fill="currentColor" d="M10 .71L9.29 0 5 4.29.71 0 0 .71 4.29 5 0 9.29.71 10 5 5.71 9.29 10 10 9.29 5.71 5z"/></svg>
                   </div>
                </motion.div>
              )}

              {/* Browser Header */}
              {state.mockup === 'browser' && (
                <motion.div
                   key="browser-header"
                   initial={{ height: 0, opacity: 0 }}
                   animate={{ height: 40, opacity: 1 }}
                   exit={{ height: 0, opacity: 0 }}
                   transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                   className="bg-gray-100/90 backdrop-blur flex items-center px-4 space-x-4 border-b border-gray-200 shrink-0 overflow-hidden"
                >
                  <div className="flex space-x-2 shrink-0">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-400"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-400"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-green-400"></div>
                  </div>
                  <div className="flex-1 bg-white rounded-md h-6 border border-gray-200 mx-4 flex items-center justify-center shrink-0">
                     <div className="w-full max-w-[33%] bg-gray-100 rounded-full h-2"></div>
                  </div>
                </motion.div>
              )}
              
              {/* Glass Inner Frame */}
              {state.mockup === 'glass' && (
                 <motion.div
                    key="glass-frame"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4 }}
                    className="absolute inset-0 rounded-2xl pointer-events-none ring-1 ring-white/30 z-10" 
                 />
              )}
            </AnimatePresence>

            <div className={cn("flex-1 bg-black relative overflow-hidden", state.mockup === 'glass' && "rounded-xl")}>
              <video 
                ref={videoRef}
                className={cn("w-full h-full object-contain outline-none transition-transform duration-1000 ease-in-out origin-center", state.autoZoom ? "scale-[1.3] translate-y-[-5%]" : "scale-100")}
                autoPlay
                controls={!!recordedUrl}
                muted={!recordedUrl}
                loop={!!recordedUrl}
                playsInline
              />
            </div>
          </motion.div>
          </>
        )}
      </div>
    </div>
  );
}
