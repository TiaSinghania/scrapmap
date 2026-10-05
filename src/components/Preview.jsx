import React, { useState } from 'react';
import '../style/Preview.css';

export default function Preview({ pin, onEdit, onDelete }) {
  const [isDeleting, setIsDeleting] = useState(false);
  if (!pin) return null;

  async function handleDeleteClick() {
    if (!window.confirm(`Delete "${pin.title}"? This also removes its photos and can't be undone.`)) return;
    setIsDeleting(true);
    try {
      await onDelete(pin);
    } catch (error) {
      console.error("Error deleting pin:", error);
      alert("Failed to delete pin. Check the console.");
      setIsDeleting(false);
    }
  }

  return (
    <div className="preview-container">
      <div>
        <h1 className="preview-title">{pin.title}</h1>
        <p className="preview-date">{pin.date}</p>
      </div>

      {pin.images && pin.images.length > 0 && (
        <div className="preview-photos-section">
          <h3 className="preview-photos-title">Photos</h3>
          <div className="preview-gallery">
            {pin.images.map((url, index) => (
              <img 
                key={index} 
                src={url} 
                alt={`${pin.title} - ${index}`} 
                className="preview-image"
              />
            ))}
          </div>
        </div>
      )}

      <div className="preview-actions">
        <button onClick={onEdit} disabled={isDeleting} className="btn-edit">
          Edit Details
        </button>
        <button onClick={handleDeleteClick} disabled={isDeleting} className="btn-delete">
          {isDeleting ? 'Deleting...' : 'Delete Pin'}
        </button>
      </div>
    </div>
  );
}