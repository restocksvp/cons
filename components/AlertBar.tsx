import React from 'react';

export const AlertBar = ({ message, type, onClose }) => {
  const baseClasses = 'fixed top-5 left-1/2 -translate-x-1/2 transform transition-all duration-300 z-50 p-4 rounded-md shadow-lg flex items-center gap-3 text-white max-w-md w-full';
  
  const typeClasses = {
    success: 'bg-green-400',
    error: 'bg-red-400',
    info: 'bg-blue-400',
  };

  const icons = {
    success: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    error: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    info: (
       <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  };

  return (
    <div className={`${baseClasses} ${typeClasses[type]}`}>
      {icons[type]}
      <span className="flex-grow">{message}</span>
      <button onClick={onClose} className="text-xl font-bold leading-none">&times;</button>
    </div>
  );
};

export default AlertBar;
