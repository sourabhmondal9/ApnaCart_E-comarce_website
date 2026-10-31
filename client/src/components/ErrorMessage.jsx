import React from 'react';
import { AlertTriangle } from 'lucide-react';

const ErrorMessage = ({ message = 'Something went wrong.', onRetry }) => (
  <div className="error-message" role="alert">
    <AlertTriangle size={20} aria-hidden="true" />
    <span>{message}</span>
    {onRetry && (
      <button type="button" className="btn btn-secondary btn-sm" onClick={onRetry}>
        Retry
      </button>
    )}
  </div>
);

export default ErrorMessage;
