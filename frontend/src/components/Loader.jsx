import React from 'react';

export const Loader = ({ progress }) => {
  return (
    <div className="loader-container">
      <div className="progress-bar">
        <div 
          className="progress-fill" 
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      <p className="progress-text">{progress}% Complete</p>
    </div>
  );
};