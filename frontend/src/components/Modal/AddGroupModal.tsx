import React, { useState, useEffect } from 'react';
import './Modal.css';

interface AddGroupModalProps {
  onClose: () => void;
  onSubmit: (name: string) => void;
}

const AddGroupModal: React.FC<AddGroupModalProps> = ({ onClose, onSubmit }) => {
  const [name, setName] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Enter' && name.trim()) {
        onSubmit(name.trim());
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [name, onClose, onSubmit]);

  const handleSubmit = () => {
    if (!name.trim()) return;
    onSubmit(name.trim());
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-title">New Group</div>
        
        <label>Group Name</label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="e.g. Technology"
          autoFocus
        />
        
        <div className="modal-actions">
          <button className="btn-cancel" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-primary" onClick={handleSubmit}>
            Create Group
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddGroupModal;