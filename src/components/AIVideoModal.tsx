import React, { useState, useRef, useEffect } from 'react';
import { X, Video, Loader2, Image as ImageIcon, Upload } from 'lucide-react';
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
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) {
      setPrompt('');
      setIsGenerating(false);
      setStatusText('');
      setError(null);
      setImageFile(null);
      setImagePreview(null);
    }
  }, [isOpen]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const url = URL.createObjectURL(file);
      setImagePreview(url);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim() && !imageFile) return;
    
    setIsGenerating(true);
    setError(null);
    setStatusText('Starting generation...');
    
    try {
      let imageBytes: string | undefined;
      let imageMimeType: string | undefined;
      
      if (imageFile) {
        const reader = new FileReader();
        imageBytes = await new Promise((resolve, reject) => {
          reader.onload = () => {
            const base64String = (reader.result as string).split(',')[1];
            resolve(base64String);
          };
          reader.onerror = reject;
          reader.readAsDataURL(imageFile);
        });
        imageMimeType = imageFile.type;
      }

      // 1. Start generation
      const startRes = await fetch('/api/generate-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, imageBytes, imageMimeType }),
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
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Starting Image (Optional)
              </label>
              <div 
                onClick={() => !isGenerating && fileInputRef.current?.click()}
                className={cn(
                  "w-full h-32 border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-colors overflow-hidden group",
                  imagePreview ? "border-purple-200" : "border-gray-200 hover:border-purple-300 hover:bg-purple-50",
                  isGenerating && "opacity-50 cursor-not-allowed"
                )}
              >
                {imagePreview ? (
                  <div className="relative w-full h-full flex items-center justify-center bg-gray-50">
                    <img src={imagePreview} className="h-full object-contain" alt="Preview" />
                    {!isGenerating && (
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-white text-sm font-medium flex items-center space-x-2">
                           <Upload className="w-4 h-4" /> <span>Change Image</span>
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center text-gray-400 space-y-2 group-hover:text-purple-500 transition-colors">
                    <ImageIcon className="w-6 h-6" />
                    <span className="text-sm font-medium">Click to upload image</span>
                  </div>
                )}
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImageUpload} 
                accept="image/*" 
                className="hidden" 
              />
            </div>
          
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Video Prompt
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="A neon hologram of a cat driving at top speed..."
                className="w-full h-32 p-3 text-sm border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-0 outline-none resize-none transition-colors"
                disabled={isGenerating}
              />
            </div>
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
            disabled={!(prompt.trim() || imageFile) || isGenerating}
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
