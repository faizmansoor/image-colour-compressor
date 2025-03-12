import React, { useRef } from 'react';

export const FileUploader = ({ onFileChange, selectedFile }) => {
  const fileInputRef = useRef(null);

  const handleClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    onFileChange(file);
  };

  return (
    <div className="form-group file-uploader">
      <label htmlFor="file-input">Select Image to Compress</label>
      
      <div 
        className={`drop-area ${selectedFile ? 'has-file' : ''}`}
        onClick={handleClick}
      >
        <input
          type="file"
          ref={fileInputRef}
          id="file-input"
          accept="image/*"
          onChange={handleFileChange}
          className="file-input"
        />
        
        {selectedFile ? (
          <div className="file-preview">
            <img
              src={URL.createObjectURL(selectedFile)}
              alt="Preview"
              className="preview-image"
            />
            <div className="file-info">
              <p className="file-name">{selectedFile.name}</p>
              <p className="file-size">{(selectedFile.size / 1024).toFixed(1)} KB</p>
            </div>
          </div>
        ) : (
          <div className="upload-prompt">
            <svg className="upload-icon" viewBox="0 0 24 24">
              <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z" />
            </svg>
            <p>Click to browse or drop an image here</p>
          </div>
        )}
      </div>
    </div>
  );
};
