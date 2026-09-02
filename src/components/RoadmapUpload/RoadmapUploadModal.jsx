import React from 'react';
import { useApp } from '../../context/AppContext';
import { X } from 'lucide-react';
import { RoadmapUploadFlow } from '../Roadmap/RoadmapUploadFlow';

export const RoadmapUploadModal = () => {
  const { isUploadModalOpen, setIsUploadModalOpen } = useApp();

  if (!isUploadModalOpen) return null;

  return (
    <div className="modal-overlay" onClick={() => setIsUploadModalOpen(false)}>
      <div 
        className="modal-content-sheet" 
        onClick={(e) => e.stopPropagation()}
        style={{ padding: '22px', maxWidth: '520px', maxHeight: '90vh', overflowY: 'auto' }}
      >
        <RoadmapUploadFlow 
          onCancel={() => setIsUploadModalOpen(false)}
          onComplete={() => setIsUploadModalOpen(false)}
        />
      </div>
    </div>
  );
};
