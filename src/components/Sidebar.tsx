import React from 'react';
import { Monitor, Square, LayoutTemplate, Box, AppWindow, Layers, Droplet, Check, Tablet, Film, Sparkles, Video, Mic, Music } from 'lucide-react';
import { type EditorState, type MockupType, type BackgroundType } from '../types';
import { cn } from '../utils';

interface SidebarProps {
  state: EditorState;
  setState: React.Dispatch<React.SetStateAction<EditorState>>;
  onRecord: () => void;
  onStopRecord: () => void;
  recordingStatus: 'idle' | 'recording' | 'recorded';
  onClear: () => void;
  errorMsg?: string | null;
  onOpenVideoGen: () => void;
}

export function Sidebar({ state, setState, onRecord, onStopRecord, recordingStatus, onClear, errorMsg, onOpenVideoGen }: SidebarProps) {
  const mockupOptions: { value: MockupType; label: string; icon: React.ReactNode }[] = [
    { value: 'none', label: 'None', icon: <Square className="w-4 h-4" /> },
    { value: 'macos', label: 'macOS', icon: <Box className="w-4 h-4" /> },
    { value: 'windows', label: 'Windows', icon: <AppWindow className="w-4 h-4" /> },
    { value: 'surface-pro', label: 'Surface Pro', icon: <Tablet className="w-4 h-4" /> },
    { value: 'surface-studio', label: 'Studio', icon: <Monitor className="w-4 h-4" /> },
    { value: 'browser', label: 'Browser', icon: <LayoutTemplate className="w-4 h-4" /> },
    { value: 'glass', label: 'Glass', icon: <Layers className="w-4 h-4" /> },
  ];

  const bgOptions: { value: BackgroundType; label: string; colors: string }[] = [
    { value: 'transparent', label: 'None', colors: 'bg-gray-200' },
    { value: 'solid-dark', label: 'Dark', colors: 'bg-gray-900' },
    { value: 'solid-light', label: 'Light', colors: 'bg-white border' },
    { value: 'gradient-1', label: 'Sunset', colors: 'bg-gradient-to-br from-orange-400 to-pink-600' },
    { value: 'gradient-2', label: 'Ocean', colors: 'bg-gradient-to-br from-blue-400 to-emerald-400' },
    { value: 'gradient-3', label: 'Purple', colors: 'bg-gradient-to-br from-indigo-500 to-purple-600' },
  ];

  return (
    <div className="w-80 border-r border-gray-200 bg-white h-full flex flex-col overflow-y-auto">
      <div className="p-4 border-b border-gray-100 flex items-center space-x-2">
        <Film className="w-5 h-5 text-indigo-600" />
        <h1 className="font-semibold text-gray-800">DemoKite Studio</h1>
      </div>

      <div className="p-5 space-y-8 flex-1">
        
        {/* Source / Record */}
        <div className="space-y-3">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Source</label>
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 leading-snug">
              {errorMsg}
            </div>
          )}
          {recordingStatus === 'idle' && (
             <button
                onClick={onRecord}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center justify-center space-x-2 transition-colors font-medium text-sm"
              >
                <div className="w-2.5 h-2.5 rounded-full bg-red-400 animate-pulse border border-white" />
                <span>Record Screen</span>
             </button>
          )}

          {recordingStatus === 'recording' && (
             <button
                onClick={onStopRecord}
                className="w-full py-2.5 border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg flex items-center justify-center space-x-2 transition-colors font-medium text-sm"
              >
                <Square className="w-4 h-4 fill-current" />
                <span>Stop Recording</span>
             </button>
          )}

          {recordingStatus === 'recorded' && (
             <div className="flex space-x-2">
               <button
                  onClick={onRecord}
                  className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg flex items-center justify-center space-x-2 transition-colors font-medium text-sm"
                >
                  <span>Re-record</span>
               </button>
               <button
                  onClick={onClear}
                  className="flex-none p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors text-sm"
                >
                  Clear
               </button>
             </div>
          )}
        </div>

        {/* Mockup Frame */}
        <div className="space-y-3">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Frame Mockup</label>
          <div className="grid grid-cols-2 gap-2">
            {mockupOptions.map(m => (
              <button
                key={m.value}
                onClick={() => setState(s => ({ ...s, mockup: m.value }))}
                className={cn(
                  "p-3 rounded-xl border flex flex-col items-center justify-center space-y-2 transition-all",
                  state.mockup === m.value 
                    ? "border-indigo-600 bg-indigo-50 text-indigo-700 ring-1 ring-indigo-600" 
                    : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:border-gray-300"
                )}
              >
                {m.icon}
                <span className="text-xs font-medium">{m.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Background */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Background</label>
            <Droplet className="w-3.5 h-3.5 text-gray-400" />
          </div>
          <div className="flex flex-wrap gap-2">
            {bgOptions.map(bg => (
              <button
                key={bg.value}
                title={bg.label}
                onClick={() => setState(s => ({ ...s, background: bg.value }))}
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-transform",
                  bg.colors,
                  state.background === bg.value ? "border-white shadow-md scale-110" : "border-transparent hover:scale-105"
                )}
              >
                {state.background === bg.value && <Check className="w-5 h-5 text-white drop-shadow-md" />}
              </button>
            ))}
          </div>
        </div>

        {/* Sliders */}
        <div className="space-y-5">
           <div className="space-y-3">
             <div className="flex justify-between items-center text-xs">
               <label className="font-semibold text-gray-500 uppercase tracking-wider">Padding</label>
               <span className="text-gray-400">{state.padding}px</span>
             </div>
             <input 
               type="range" 
               min="0" max="120" step="10"
               value={state.padding}
               onChange={(e) => setState(s => ({ ...s, padding: parseInt(e.target.value) }))}
               className="w-full accent-indigo-600 cursor-pointer"
             />
           </div>

           <div className="flex items-center justify-between pt-2">
              <label className="text-sm font-medium text-gray-700">Drop Shadow</label>
              <button 
                onClick={() => setState(s => ({ ...s, shadow: !s.shadow }))}
                className={cn("w-10 h-5 rounded-full relative transition-colors duration-200", state.shadow ? "bg-indigo-600" : "bg-gray-300")}
              >
                <div className={cn("w-3.5 h-3.5 bg-white rounded-full absolute top-[3px] transition-all duration-200", state.shadow ? "left-[22px]" : "left-[3px]")} />
              </button>
           </div>

           <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">3D Tilt Effect</label>
              <button 
                onClick={() => setState(s => ({ ...s, tilt: !s.tilt }))}
                className={cn("w-10 h-5 rounded-full relative transition-colors duration-200", state.tilt ? "bg-indigo-600" : "bg-gray-300")}
              >
                <div className={cn("w-3.5 h-3.5 bg-white rounded-full absolute top-[3px] transition-all duration-200", state.tilt ? "left-[22px]" : "left-[3px]")} />
              </button>
           </div>

           <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700 text-purple-700">Cinematic Lens Blur</label>
              <button 
                onClick={() => setState(s => ({ ...s, lensBlur: !s.lensBlur }))}
                className={cn("w-10 h-5 rounded-full relative transition-colors duration-200", state.lensBlur ? "bg-purple-600" : "bg-gray-300")}
              >
                <div className={cn("w-3.5 h-3.5 bg-white rounded-full absolute top-[3px] transition-all duration-200", state.lensBlur ? "left-[22px]" : "left-[3px]")} />
              </button>
           </div>
           
           <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">Auto Zoom</label>
              <button 
                onClick={() => setState(s => ({ ...s, autoZoom: !s.autoZoom }))}
                className={cn("w-10 h-5 rounded-full relative transition-colors duration-200", state.autoZoom ? "bg-indigo-600" : "bg-gray-300")}
              >
                <div className={cn("w-3.5 h-3.5 bg-white rounded-full absolute top-[3px] transition-all duration-200", state.autoZoom ? "left-[22px]" : "left-[3px]")} />
              </button>
           </div>
        </div>

        {/* AI Features */}
        <div className="space-y-3 pt-6 border-t border-gray-100">
           <label className="text-xs font-semibold bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-indigo-500 uppercase tracking-wider flex items-center gap-1.5 w-max">
             <Sparkles className="w-3.5 h-3.5 text-purple-500" />
             AI Features
           </label>
           
           <div className="space-y-2">
             <button onClick={onOpenVideoGen} className="w-full flex items-center justify-between p-3 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 hover:border-purple-300 hover:shadow-sm transition-all group">
               <div className="flex items-center space-x-3">
                 <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-50 to-purple-100 flex items-center justify-center text-purple-600 group-hover:from-purple-100 group-hover:to-purple-200 transition-all">
                   <Video className="w-4 h-4" />
                 </div>
                 <span className="text-sm font-medium text-gray-700">Animate images</span>
               </div>
             </button>
             
             <button className="w-full flex items-center justify-between p-3 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 hover:border-indigo-300 hover:shadow-sm transition-all group">
               <div className="flex items-center space-x-3">
                 <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-50 to-indigo-100 flex items-center justify-center text-indigo-600 group-hover:from-indigo-100 group-hover:to-indigo-200 transition-all">
                   <Mic className="w-4 h-4" />
                 </div>
                 <span className="text-sm font-medium text-gray-700">Voice conversations</span>
               </div>
             </button>

             <button className="w-full flex items-center justify-between p-3 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 hover:border-pink-300 hover:shadow-sm transition-all group">
               <div className="flex items-center space-x-3">
                 <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-50 to-pink-100 flex items-center justify-center text-pink-600 group-hover:from-pink-100 group-hover:to-pink-200 transition-all">
                   <Music className="w-4 h-4" />
                 </div>
                 <span className="text-sm font-medium text-gray-700">Generate music</span>
               </div>
             </button>
           </div>
        </div>

      </div>
    </div>
  );
}
