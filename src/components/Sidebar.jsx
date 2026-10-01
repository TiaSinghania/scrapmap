import React from 'react';
import '../style/Sidebar.css';

export default function Sidebar({ children, onClose }) {
  return (
    <div className="sidebar-container">
      <div className="sidebar-header">
        <h2 className="sidebar-title">Pin Details</h2>
        <button onClick={onClose} className="sidebar-close">
          &times;
        </button>
      </div>
      <div className="sidebar-content">
        {children}
      </div>
    </div>
  );
}