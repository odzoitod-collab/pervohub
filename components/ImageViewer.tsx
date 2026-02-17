import React from 'react';
import { X } from 'lucide-react';

interface ImageViewerProps {
  imageUrl: string | null;
  onClose: () => void;
}

export const ImageViewer: React.FC<ImageViewerProps> = ({ imageUrl, onClose }) => {
  if (!imageUrl) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center animate-fade-in" onClick={onClose}>
      <button 
        type="button"
        onClick={(e) => { e.stopPropagation(); onClose(); }}
        className="absolute top-4 right-4 min-w-11 min-h-11 flex items-center justify-center bg-white/10 rounded-full text-white hover:bg-white/20 active:scale-95 transition-all z-10 touch-manipulation"
        aria-label="Закрити"
      >
        <X size={24} />
      </button>
      <img 
        src={imageUrl} 
        alt="Full screen" 
        className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
        onClick={(e) => e.stopPropagation()} 
      />
    </div>
  );
};