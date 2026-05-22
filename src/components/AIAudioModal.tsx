import React, { useState, useEffect } from 'react';
import { X, Mic, Loader2 } from 'lucide-react';

interface AIAudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAudioGenerated: (url: string) => void;
}

export function AIAudioModal({ isOpen, onClose, onAudioGenerated }: AIAudioModalProps) {
  const [text, setText] = useState('');
  const [voice, setVoice] = useState('Kore');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setText('');
      setIsGenerating(false);
      setError(null);
    }
  }, [isOpen]);

  const handleGenerate = async () => {
    if (!text.trim()) return;
    
    setIsGenerating(true);
    setError(null);
    
    try {
      const res = await fetch('/api/generate-speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voice }),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate speech');
      
      const binary = atob(data.audio);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      
      // Typical Gemini TTS response is raw PCM or WAV, we can assume WAV for playback in browser
      const blob = new Blob([bytes], { type: 'audio/wav' });
      const url = URL.createObjectURL(blob);
      onAudioGenerated(url);
      onClose();

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred during generation');
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600">
              <Mic className="w-4 h-4" />
            </div>
            <h2 className="font-semibold text-gray-800">Generate Voice Over</h2>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Script
              </label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Welcome to our new app demo..."
                className="w-full h-32 p-3 text-sm border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-0 outline-none resize-none transition-colors"
                disabled={isGenerating}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Voice
              </label>
              <select 
                 value={voice}
                 onChange={(e) => setVoice(e.target.value)}
                 className="w-full p-2.5 text-sm border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-0 outline-none"
                 disabled={isGenerating}
              >
                 <option value="Kore">Kore (Neutral)</option>
                 <option value="Puck">Puck (Warm)</option>
                 <option value="Charon">Charon (Deep)</option>
                 <option value="Zephyr">Zephyr (Bright)</option>
                 <option value="Fenrir">Fenrir (Authoritative)</option>
              </select>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100">
              {error}
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
            disabled={!text.trim() || isGenerating}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Generating</span>
              </>
            ) : (
              <span>Generate Audio</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
