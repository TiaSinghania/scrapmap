import { PencilIcon, TrashIcon, CloseIcon } from './Icons';
import '../style/Sidebar.css';

function IconButton({ label, onClick, disabled, danger, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={`sidebar-icon-btn${danger ? ' sidebar-icon-btn--danger' : ''}`}
    >
      {children}
    </button>
  );
}

// onEdit / onDelete are optional: pass them only when there's a saved pin to act on.
export default function Sidebar({ children, onClose, onEdit, onDelete, isDeleting }) {
  return (
    <aside className="sidebar-container" aria-label="Pin details">
      <header className="sidebar-header">
        {onEdit && (
          <IconButton label="Edit pin" onClick={onEdit} disabled={isDeleting}>
            <PencilIcon />
          </IconButton>
        )}
        {onDelete && (
          <IconButton label="Delete pin" onClick={onDelete} disabled={isDeleting} danger>
            <TrashIcon />
          </IconButton>
        )}
        <IconButton label="Close" onClick={onClose} disabled={isDeleting}>
          <CloseIcon />
        </IconButton>
      </header>
      <div className="sidebar-content">{children}</div>
    </aside>
  );
}
