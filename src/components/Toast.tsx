import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react';

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info';
  onClose: () => void;
  duration?: number;
}

export const Toast: React.FC<ToastProps> = ({ message, type, onClose, duration = 4000 }) => {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(onClose, 300);
  };

  const icons = {
    success: <CheckCircle className="w-5 h-5" />,
    error: <XCircle className="w-5 h-5" />,
    info: <AlertCircle className="w-5 h-5" />
  };

  const colors = {
    success: 'bg-green-50 border-green-500 text-green-800',
    error: 'bg-red-50 border-red-500 text-red-800',
    info: 'bg-blue-50 border-blue-500 text-blue-800'
  };

  return (
    <div
      className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg border-l-4 shadow-lg max-w-md transition-all duration-300 ${
        colors[type]
      } ${isExiting ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'}`}
    >
      <div className="flex-shrink-0">{icons[type]}</div>
      <p className="flex-1 text-sm font-medium">{message}</p>
      <button
        onClick={handleClose}
        className="flex-shrink-0 hover:opacity-70 transition-opacity"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export const ToastContainer: React.FC = () => {
  return <div id="toast-container" className="pointer-events-none" />;
};

let toastId = 0;
const activeToasts = new Map<number, () => void>();

export const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info', duration = 4000) => {
  const id = toastId++;
  const container = document.getElementById('toast-container');

  if (!container) {
    console.error('Toast container not found');
    return;
  }

  const toastElement = document.createElement('div');
  toastElement.id = `toast-${id}`;
  container.appendChild(toastElement);

  const closeToast = () => {
    const element = document.getElementById(`toast-${id}`);
    if (element) {
      element.remove();
    }
    activeToasts.delete(id);
  };

  activeToasts.set(id, closeToast);

  import('react-dom/client').then(({ createRoot }) => {
    const root = createRoot(toastElement);
    root.render(<Toast message={message} type={type} onClose={closeToast} duration={duration} />);
  });
};
