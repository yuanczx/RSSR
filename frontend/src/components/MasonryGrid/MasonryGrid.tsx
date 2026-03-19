import React, { useMemo } from 'react';
import './MasonryGrid.css';

interface MediaItem {
  id: number;
  type: 'image' | 'video';
  src: string;
  thumbnail?: string;
  title?: string;
  articleId?: number;
}

interface MasonryGridProps {
  items: MediaItem[];
  onItemClick?: (item: MediaItem) => void;
}

const MasonryGrid: React.FC<MasonryGridProps> = ({ items, onItemClick }) => {
  const columns = useMemo(() => {
    const cols: MediaItem[][] = [[], [], [], []];
    items.forEach((item, index) => {
      cols[index % 4].push(item);
    });
    return cols;
  }, [items]);

  if (items.length === 0) {
    return (
      <div className="masonry-empty">
        <div className="masonry-empty-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <polyline points="21 15 16 10 5 21"/>
          </svg>
        </div>
        <p>No media found</p>
      </div>
    );
  }

  return (
    <div className="masonry-container">
      <div className="masonry-grid">
        {columns.map((col, colIndex) => (
          <div key={colIndex} className="masonry-column">
            {col.map((item) => (
              <div
                key={item.id}
                className={`masonry-item ${item.type}`}
                onClick={() => onItemClick?.(item)}
              >
                {item.type === 'image' ? (
                  <img
                    src={item.src}
                    alt={item.title || 'Image'}
                    loading="lazy"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <video
                    src={item.src}
                    poster={item.thumbnail}
                    preload="metadata"
                    onError={(e) => {
                      (e.target as HTMLVideoElement).style.display = 'none';
                    }}
                  />
                )}
                {item.title && <div className="masonry-item-title">{item.title}</div>}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export function extractMediaFromArticle(article: { content?: string; summary?: string }): MediaItem[] {
  const items: MediaItem[] = [];
  const html = article.content || article.summary || '';
  
  const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
  let match;
  while ((match = imgRegex.exec(html)) !== null) {
    const src = match[1];
    if (src && !src.includes('data:image') && !src.includes('feedburner') && !src.includes('pixel')) {
      items.push({
        id: Math.random(),
        type: 'image',
        src: src,
        title: '',
      });
    }
  }
  
  const videoRegex = /<video[^>]+src=["']([^"']+)["'][^>]*>|<(?:iframe|embed)[^>]+src=["']([^"']+)["'][^>]*>/gi;
  while ((match = videoRegex.exec(html)) !== null) {
    const src = match[1] || match[2];
    if (src) {
      const isYouTube = src.includes('youtube.com') || src.includes('youtu.be');
      const isVimeo = src.includes('vimeo.com');
      
      items.push({
        id: Math.random(),
        type: 'video',
        src: src,
        title: '',
      });
    }
  }
  
  return items;
}

export type { MediaItem };
export default MasonryGrid;
