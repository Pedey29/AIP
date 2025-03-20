import React from 'react';
import Button from './Button';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmButtonText?: string;
  cancelButtonText?: string;
  confirmButtonVariant?: 'primary' | 'danger' | 'warning';
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  message,
  confirmButtonText = 'Confirm',
  cancelButtonText = 'Cancel',
  confirmButtonVariant = 'primary',
  onConfirm,
  onCancel,
  isLoading = false
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onCancel}
      ></div>

      {/* Modal */}
      <div className="flex items-center justify-center min-h-screen p-4">
        <div
          className="relative bg-white rounded-lg max-w-md w-full shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">{title}</h3>
          </div>

          {/* Content */}
          <div className="px-6 py-4">
            <p className="text-gray-700">{message}</p>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
            >
              {cancelButtonText}
            </Button>
            <Button
              variant={confirmButtonVariant}
              onClick={onConfirm}
              isLoading={isLoading}
            >
              {confirmButtonText}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
