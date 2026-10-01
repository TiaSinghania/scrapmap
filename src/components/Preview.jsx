import React from 'react';
import '../style/Preview.css';

export default function Preview({ pin, onEdit }) {
  if (!pin) return null;

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

      <button onClick={onEdit} className="btn-edit">
        Edit Details
      </button>
    </div>
  );
}