import React from 'react';
import { CheckCircle, X } from 'lucide-react';
import { useTheme } from './themeContext';

interface RegenerationSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type: 'overview' | 'backlog';
}

const RegenerationSuccessModal: React.FC<RegenerationSuccessModalProps> = ({
  isOpen,
  onClose,
  title,
  message,
  type
}) => {
  const { theme } = useTheme();

  if (!isOpen) return null;

  const getIconColor = () => {
    return type === 'overview' ? 'text-blue-600' : 'text-green-600';
  };

  const getBgColor = () => {
    return type === 'overview' ? 'bg-blue-50' : 'bg-green-50';
  };

  const getBorderColor = () => {
    return type === 'overview' ? 'border-blue-200' : 'border-green-200';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className={`relative w-full max-w-md ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-xl`}>
        {/* Close button */}
        <button
          onClick={onClose}
          className={`absolute top-4 right-4 p-1 rounded-full hover:bg-opacity-20 transition-colors ${
            theme === 'dark' ? 'text-gray-400 hover:bg-gray-600' : 'text-gray-500 hover:bg-gray-200'
          }`}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Content */}
        <div className="p-6">
          {/* Icon */}
          <div className="flex justify-center mb-4">
            <div className={`w-16 h-16 rounded-full ${getBgColor()} ${getBorderColor()} border-2 flex items-center justify-center`}>
              <CheckCircle className={`w-8 h-8 ${getIconColor()}`} />
            </div>
          </div>

          {/* Title */}
          <h3 className={`text-xl font-semibold text-center mb-2 ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            {title}
          </h3>

          {/* Message */}
          <p className={`text-center mb-6 ${
            theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
          }`}>
            {message}
          </p>

          {/* Action button */}
          <div className="flex justify-center">
            <button
              onClick={onClose}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                type === 'overview'
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              Got it!
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegenerationSuccessModal;
