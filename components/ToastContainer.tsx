import React from 'react';
import { useToast } from '../hooks/useToast';
import { XIcon, CheckCircleIcon } from './Icons';

const Toast: React.FC<{ message: string; type: string; onDismiss: () => void }> = ({ message, type, onDismiss }) => {
  const styles = {
    success: { bg: 'bg-emerald-600/95', border: 'border-emerald-500', icon: <CheckCircleIcon className="w-5 h-5"/> },
    error: { bg: 'bg-red-600/95', border: 'border-red-500', icon: <XIcon className="w-5 h-5"/> },
    info: { bg: 'bg-sky-600/95', border: 'border-sky-500', icon: <SparklesIcon className="w-5 h-5"/> },
  }[type] || { bg: 'bg-gray-600/95', border: 'border-gray-500', icon: null };

  return (
    <div className={`toast flex items-center w-full max-w-xs p-4 text-white ${styles.bg} rounded-lg shadow-2xl border ${styles.border} backdrop-blur-sm`}>
      <div className="flex-shrink-0 mr-3">{styles.icon}</div>
      <div className="text-sm font-medium flex-1">{message}</div>
      <button onClick={onDismiss} className="ml-4 -mr-1.5 p-1.5 rounded-full hover:bg-white/20 inline-flex items-center justify-center h-8 w-8">
        <span className="sr-only">Close</span>
        <XIcon className="w-5 h-5" />
      </button>
    </div>
  );
};


// Custom SparklesIcon for info toast
const SparklesIcon: React.FC<{className?: string}> = ({className}) => (
  <svg className={className || "w-5 h-5"} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8M4 4h16M4 8h16M4 12h16M4 16h16"></path><path d="M12 2v2m-4.2 1.8l-1.4 1.4m8.4 0l1.4-1.4m-4.2 11.2V20M4.9 16.1l-1.4 1.4M19.1 16.1l1.4 1.4"></path></svg>
);


export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToast();

  return (
    <div className="toast-container">
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onDismiss={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
};