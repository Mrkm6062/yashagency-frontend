import React from 'react';

const LoadingSpinner = React.memo(function LoadingSpinner() {
  return (
    <div className="flex justify-center items-center py-12 min-h-[200px]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
    </div>
  );
});

export default LoadingSpinner;