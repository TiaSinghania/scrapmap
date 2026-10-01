import React, { useState } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, doc, setDoc } from 'firebase/firestore';
import { db, storage } from '../app/firebase';
import '../style/PreviewForm.css';

export default function PreviewForm({ pin, onComplete, onCancel }) {
  const [title, setTitle] = useState(pin?.title || '');
  const [date, setDate] = useState(pin?.date || '');
  const [imageFiles, setImageFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setIsUploading(true);

    try {
      const pinRef = pin.id ? doc(db, 'pins', pin.id) : doc(collection(db, 'pins'));
      const pinId = pinRef.id;

      const uploadedImageUrls = await Promise.all(
        imageFiles.map(async (file) => {
          const imageRef = ref(storage, `pins/${pinId}/${file.name}`);
          await uploadBytes(imageRef, file);
          return await getDownloadURL(imageRef);
        })
      );

      const existingImages = pin.images || [];
      const finalImageUrls = [...existingImages, ...uploadedImageUrls];

      await setDoc(pinRef, {
        title,
        date,
        lat: pin.lat,
        lon: pin.lon,
        images: finalImageUrls,
      });

      onComplete();
    } catch (error) {
      console.error("Error saving pin:", error);
      alert("Failed to save pin. Check the console.");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="preview-form">
      <label className="form-label">
        Title
        <input 
          type="text" 
          value={title} 
          onChange={e => setTitle(e.target.value)} 
          className="form-input"
          required 
        />
      </label>

      <label className="form-label">
        Date
        <input 
          type="date" 
          value={date} 
          onChange={e => setDate(e.target.value)} 
          className="form-input"
          required 
        />
      </label>

      <label className="form-label">
        Add Photos
        <input 
          type="file" 
          multiple 
          accept="image/*" 
          onChange={e => setImageFiles(Array.from(e.target.files))} 
          className="form-file-input"
        />
      </label>

      <div className="form-actions">
        <button type="button" onClick={onCancel} disabled={isUploading} className="btn-cancel">
          Cancel
        </button>
        <button type="submit" disabled={isUploading} className="btn-save">
          {isUploading ? 'Saving...' : 'Save Pin'}
        </button>
      </div>
    </form>
  );
}