import React from 'react';
import { AlertTriangle, Loader2, X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isProcessing: boolean;
}

export default function CancelConfirmModal({ isOpen, onClose, onConfirm, isProcessing }: Props) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Cancel Subscription</h3>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="text-gray-400 hover:text-gray-500 disabled:opacity-50"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="mb-6">
          <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-lg mb-4">
            <AlertTriangle className="w-6 h-6 text-amber-500 flex-shrink-0" />
            <p className="text-sm text-amber-700">
              Are you sure you want to cancel your subscription? You'll lose access to all premium features at the end of your billing period.
            </p>
          </div>
          
          <div className="text-sm text-gray-600">
            <p>What happens when you cancel:</p>
            <ul className="mt-2 space-y-1 list-disc list-inside">
              <li>Your subscription will remain active until the end of the current billing period</li>
              <li>You won't be charged again</li>
              <li>You can reactivate your subscription at any time</li>
            </ul>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50"
          >
            Keep Subscription
          </button>
          <button
            onClick={onConfirm}
            disabled={isProcessing}
            className="flex-1 px-4 py-2 text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Canceling...
              </>
            ) : (
              'Confirm Cancel'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}