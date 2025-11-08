
import React from 'react';

export const LoadingSpinner: React.FC = () => {
  return (
    <div className="flex justify-center items-center">
      <div className="w-8 h-8 border-4 border-t-purple-500 border-gray-600 rounded-full animate-spin"></div>
    </div>
  );
};
