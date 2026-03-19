import React, { useEffect } from 'react';
import './MediaPreview.css';
import { useTranslation } from "react-i18next";
import { IoMdClose } from "react-icons/io";

interface MediaPreviewProps {
  src: string;
  type: 'image' | 'video';
  title?: string;
  onClose: () => void;
}

const MediaPreview: React.FC<MediaPreviewProps> = ({ src, type, title, onClose }) => {
  const { t } = useTranslation();

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  return (
    <div className="media-preview-overlay" onClick={onClose}>
      <div className="media-preview-container" onClick={(e) => e.stopPropagation()}>
        <div className="media-preview-header">
          {title && <span className="media-preview-title">{title}</span>}
          <button className="media-preview-close" onClick={onClose} title={t("close_preview")}>
            <IoMdClose size={20} />
          </button>
        </div>
        <div className="media-preview-content">
          {type === 'image' ? (
            <img src={src} alt={title || 'Preview'} className="media-preview-image" />
          ) : (
            <video 
              src={src} 
              controls 
              autoPlay 
              className="media-preview-video"
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default MediaPreview;
