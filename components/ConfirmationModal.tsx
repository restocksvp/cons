import React from 'react';

export const ConfirmationModal = ({
  isOpen,
  title,
  message,
  onConfirm,
  onClose,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
}) => {
  if (!isOpen) return null;

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-bold text-gray-800 mb-4">{title}</h2>
        <div className="text-gray-600 space-y-2">{message}</div>
        <div className="mt-6 flex justify-end space-x-3">
          {onConfirm && (
            <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300">
              {cancelText}
            </button>
          )}
          <button
            onClick={handleConfirm}
            className={
              onConfirm
                ? 'px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700'
                : 'px-4 py-2 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700'
            }
          >
            {onConfirm ? confirmText : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
