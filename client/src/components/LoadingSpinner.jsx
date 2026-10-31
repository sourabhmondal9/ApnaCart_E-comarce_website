import React from 'react';

const LoadingSpinner = ({ label = 'Loading...' }) => (
  <div className="loading-spinner" role="status" aria-live="polite">
    <div className="spinner" aria-hidden="true" />
    <span>{label}</span>
  </div>
);

export default LoadingSpinner;
