import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import Toast, { ToastType, ToastProps } from '../components/Toast';

interface ToastContextType {
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  showSuccess: (message: string, duration?: number) => void;
  showError: (message: string, duration?: number) => void;
  showWarning: (message: string, duration?: number) => void;
  showInfo: (message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};

interface ToastProviderProps {
  children: React.ReactNode;
}

interface QueuedToast extends ToastProps {
  id: string;
}

const MAX_QUEUE_SIZE = 5;

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [queue, setQueue] = useState<QueuedToast[]>([]);
  const idCounter = useRef(0);

  const showToast = useCallback(
    (message: string, type: ToastType = 'success', duration: number = 3000) => {
      setQueue((prev) => {
        // Deduplicate: skip if same message already in queue
        if (prev.some((t) => t.message === message && t.type === type)) {
          return prev;
        }
        // Limit queue size
        const trimmed = prev.length >= MAX_QUEUE_SIZE ? prev.slice(1) : prev;
        const id = `toast_${++idCounter.current}`;
        return [...trimmed, { id, message, type, duration }];
      });
    },
    []
  );

  const showSuccess = useCallback((message: string, duration: number = 3000) => {
    showToast(message, 'success', duration);
  }, [showToast]);

  const showError = useCallback((message: string, duration: number = 3000) => {
    showToast(message, 'error', duration);
  }, [showToast]);

  const showWarning = useCallback((message: string, duration: number = 3000) => {
    showToast(message, 'warning', duration);
  }, [showToast]);

  const showInfo = useCallback((message: string, duration: number = 3000) => {
    showToast(message, 'info', duration);
  }, [showToast]);

  const handleHide = useCallback(() => {
    setQueue((prev) => prev.slice(1));
  }, []);

  const currentToast = queue[0] || null;

  return (
    <ToastContext.Provider
      value={{
        showToast,
        showSuccess,
        showError,
        showWarning,
        showInfo,
      }}
    >
      {children}
      {currentToast && (
        <Toast
          key={currentToast.id}
          message={currentToast.message}
          type={currentToast.type}
          duration={currentToast.duration}
          onHide={handleHide}
        />
      )}
    </ToastContext.Provider>
  );
};
