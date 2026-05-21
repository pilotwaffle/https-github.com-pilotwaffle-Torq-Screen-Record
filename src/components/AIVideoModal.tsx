import React, { useState, useEffect } from 'react';
import { X, Video, Loader2 } from 'lucide-react';
import { cn } from '../utils';

interface AIVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVideoGenerated: (url: string) => void;
}

export function AIVideoModal({ isOpen, onClose, onVideoGenerated }: AIVideoModalProps) {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setPrompt('');
      setIsGenerating(false);
      setStatusText('');
      setError(null);
    }
  }, [isOpen]);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    setIsGenerating(true);
    setError(null);
    setStatusText('Starting generation...');
    
    try {
      // 1. Start generation
      const startRes = await fetch('/api/generate-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      
      const startData = await startRes.json();
      if (!startRes.ok) throw new Error(startData.error || 'Failed to start generation');
      
      const operationName = startData.operationName;
      setStatusText('Generating video... This may take a few minutes.');
      
      // 2. Poll status every 5 seconds
      let isDone = false;
      while (!isDone) {
        await new Promise(resolve => setTimeout(resolve, 5000));
        const statusRes = await fetch('/api/video-status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ operationName }),
        });
        const statusData = await statusRes.json();
        if (!statusRes.ok) throw new Error(statusData.error || 'Failed to poll status');
        
        isDone = statusData.done;
      }

      setStatusText('Formatting the final output...');

      // 3. Download the video
      const downloadRes = await fetch('/api/video-download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operationName }),
      });
      
      if (!downloadRes.ok) {
        const errText = await downloadRes.text();
        throw new Error(errText || 'Failed to download video');
      }

      const blob = await downloadRes.blob();
      const url = URL.createObjectURL(blob);
      onVideoGenerated(url);
      onClose();

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred during generation');
    } finally {
      setIsGenerating(false);
      setStatusText('');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600">
              <Video className="w-4 h-4" />
            </div>
            <h2 className="font-semibold text-gray-800">Generate AI Video</h2>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              What do you want to generate?
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="A neon hologram of a cat driving at top speed..."
              className="w-full h-32 p-3 text-sm border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-0 outline-none resize-none transition-colors"
              disabled={isGenerating}
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100">
              {error}
            </div>
          )}

          {isGenerating && (
            <div className="flex items-center space-x-3 text-sm text-purple-700 bg-purple-50 p-4 rounded-xl border border-purple-100">
              <Loader2 className="w-5 h-5 animate-spin shrink-0" />
              <span>{statusText}</span>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-100 flex justify-end space-x-3 bg-gray-50">
          <button
            onClick={onClose}
            disabled={isGenerating}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleGenerate}
            disabled={!prompt.trim() || isGenerating}
            className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Generating</span>
              </>
            ) : (
              <span>Generate Video</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
