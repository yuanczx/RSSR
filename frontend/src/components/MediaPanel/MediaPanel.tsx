import React from 'react';
import MasonGrid from '../MasonryGrid/MasonryGrid';
import type { MediaItem } from '../MasonryGrid/MasonryGrid';
import './MediaPanel.css';

interface MediaPanelProps {
  title: string;
  items: MediaItem[];
  onRefresh: () => void;
  onItemClick: (item: MediaItem) => void;
}

const MediaPanel: React.FC<MediaPanelProps> = ({
  title,
  items,
  onRefresh,
  onItemClick,
}) => {
  return (
    <div className="media-panel">
      <div className="panel-top">
        <div className="panel-header">
          <div className="panel-title">{title}</div>
          <div className="panel-meta">
            {items.length} media item{items.length !== 1 ? 's' : ''}
          </div>
        </div>
        <div className='panel-toolbar'>
          <button
            className="toolbar-btn"
            onClick={onRefresh}
            title="Refresh">
            ↻
          </button>
        </div>
      </div>
      <MasonGrid items={items} onItemClick={onItemClick} />
    </div>
  );
};

export default MediaPanel;
