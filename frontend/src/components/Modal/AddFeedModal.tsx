import React, { useState, useEffect } from 'react';
import type { Group } from '../../types';
import './Modal.css';

interface AddFeedModalProps {
  groups: Group[];
  onClose: () => void;
  onSubmit: (url: string, groupId?: number) => void;
}

const AddFeedModal: React.FC<AddFeedModalProps> = ({ groups, onClose, onSubmit }) => {
  const [url, setUrl] = useState('');
  const [groupId, setGroupId] = useState<string>('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Enter' && url.trim()) {
        onSubmit(url.trim(), groupId ? parseInt(groupId) : undefined);
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [url, groupId, onClose, onSubmit]);

  const handleSubmit = () => {
    if (!url.trim()) return;
    onSubmit(url.trim(), groupId ? parseInt(groupId) : undefined);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-title">Add Feed</div>
        
        <label>Feed URL</label>
        <input
          type="url"
          value={url}
          onChange={e => setUrl(e.target.value)}
          placeholder="https://example.com/feed.xml"
          autoFocus
        />
        
        <label>Group (optional)</label>
        <select 
          value={groupId} 
          onChange={e => setGroupId(e.target.value)}
        >
          <option value="">No group</option>
          {groups.map(group => (
            <option key={group.id} value={group.id}>
              {group.name}
            </option>
          ))}
        </select>
        
        <div className="modal-actions">
          <button className="btn-cancel" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-primary" onClick={handleSubmit}>
            Add Feed
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddFeedModal;
