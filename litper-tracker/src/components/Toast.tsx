import React from 'react';
import { CheckCircle, X } from 'lucide-react';
import { useTrackerStore } from '../stores/trackerStore';

const Toast: React.FC = () => {
  const { toastMessage, toastVisible, hideToast } = useTrackerStore();

  if (!toastVisible) return null;

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 animate-slide-up">
      <div className="bg-emerald-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3">
        <CheckCircle className="w-5 h-5 text-white" />
        <span className="text-sm font-medium">{toastMessage}</span>
        <button
          onClick={hideToast}
          className="ml-2 p-1 hover:bg-emerald-700 rounded transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default Toast;
