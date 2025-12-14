'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Toast, ToastProps } from '@/components/Toast';

interface ToastData {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

interface ToastContextType {
  showToast: (toast: Omit<ToastData, 'id'>) => void;
  showSuccess: (message: string, duration?: number) => void;
  showError: (message: string, duration?: number) => void;
  showWarning: (message: string, duration?: number) => void;
  showInfo: (message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const showToast = ({ message, type, duration = 3000 }: Omit<ToastData, 'id'>) => {
    const id = Date.now().toString();
    const newToast: ToastData = { id, message, type, duration };
    
    setToasts(prev => [...prev, newToast]);
  };

  const showSuccess = (message: string, duration?: number) => {
    showToast({ message, type: 'success', duration });
  };

  const showError = (message: string, duration?: number) => {
    showToast({ message, type: 'error', duration });
  };

  const showWarning = (message: string, duration?: number) => {
    showToast({ message, type: 'warning', duration });
  };

  const showInfo = (message: string, duration?: number) => {
    showToast({ message, type: 'info', duration });
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  return (
    <ToastContext.Provider value={{
      showToast,
      showSuccess,
      showError,
      showWarning,
      showInfo
    }}>
      {children}
      
      {/* Toast 컨테이너 */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((toast, index) => (
          <Toast
            key={toast.id}
            id={index.toString()}
            message={toast.message}
            type={toast.type}
            duration={toast.duration}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}