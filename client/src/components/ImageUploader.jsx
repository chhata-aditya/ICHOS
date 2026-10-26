import { useEffect, useRef, useState } from 'react';
import { ImagePlus, Trash2 } from 'lucide-react';
import './ImageUploader.css';

const acceptedTypes = ['image/jpeg', 'image/png', 'image/webp'];

function ImageUploader({ onImageChange, disabled = false }) {
  const inputRef = useRef(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [error, setError] = useState('');

  useEffect(() => () => previewUrl && URL.revokeObjectURL(previewUrl), [previewUrl]);

  const selectImage = (file) => {
    if (!file) return;
    if (!acceptedTypes.includes(file.type)) return setError('Choose a JPG, PNG, or WEBP image.');
    if (file.size > 5 * 1024 * 1024) return setError('Choose an image smaller than 5 MB.');
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(file));
    setError('');
    onImageChange?.(file);
  };

  const removeImage = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl('');
    setError('');
    onImageChange?.(null);
  };

  return (
    <div className="image-uploader">
      {previewUrl ? (
        <div className="image-uploader__preview-wrap">
          <img className="image-uploader__preview" src={previewUrl} alt="Selected vibe reference" />
          <button type="button" className="btn btn-ghost image-uploader__remove" onClick={removeImage} disabled={disabled}>
            <Trash2 size={16} /> Remove image
          </button>
        </div>
      ) : (
        <button type="button" className="image-uploader__dropzone" disabled={disabled} onClick={() => inputRef.current?.click()} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); selectImage(event.dataTransfer.files[0]); }}>
          <ImagePlus size={26} />
          <span>Drop an image here or choose a file</span>
          <small>JPG, PNG, or WEBP · maximum 5 MB</small>
        </button>
      )}
      <input ref={inputRef} className="image-uploader__input" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => selectImage(event.target.files[0])} />
      {error ? <p className="image-uploader__error">{error}</p> : null}
    </div>
  );
}

export default ImageUploader;
