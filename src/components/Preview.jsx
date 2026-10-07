import '../style/Preview.css';

// Display only. Edit/delete live in the sidebar header now.
export default function Preview({ pin }) {
  if (!pin) return null;

  return (
    <div className="preview-container">
      <div>
        <h1 className="preview-title">{pin.title}</h1>
        <p className="preview-location">{pin.location}</p>
        <p className="preview-date">{pin.date}</p>
      </div>

      {pin.images && pin.images.length > 0 && (
        <div className="preview-photos-section">
          <h3 className="preview-photos-title">Memories</h3>
          <div className="preview-gallery">
            {pin.images.map((url, index) => (
              <figure key={index} className="preview-photo">
                <img
                  src={url}
                  alt={`${pin.title} - ${index + 1}`}
                  className="preview-image"
                />
              </figure>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
