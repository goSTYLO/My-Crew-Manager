import React, { useState, useEffect } from 'react';
import { useTheme } from './themeContext';

interface LoadingSpinnerProps {
  customMessages?: string[];
  interval?: number;
  className?: string;
  isOpen: boolean;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  customMessages, 
  interval = 2500,
  className = "",
  isOpen
}) => {
  const { theme } = useTheme();
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

  const defaultMessages = [
    "AI is thinking...",
    "Analyzing your proposal...",
    "Processing requirements...",
    "Generating insights...",
    "Structuring data...",
    "Organizing tasks...",
    "Almost there...",
    "Finalizing details...",
    "Thank you for your patience..."
  ];

  const messages = customMessages || defaultMessages;

  useEffect(() => {
    if (!isOpen) return;
    
    const messageInterval = setInterval(() => {
      setCurrentMessageIndex((prevIndex) => 
        (prevIndex + 1) % messages.length
      );
    }, interval);

    return () => clearInterval(messageInterval);
  }, [messages.length, interval, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 ${
          theme === 'dark' ? 'bg-black bg-opacity-70' : 'bg-black bg-opacity-50'
        }`}
      />
      
      {/* Modal Content */}
      <div className={`relative rounded-lg shadow-xl p-8 max-w-md w-full mx-4 ${
        theme === 'dark' ? 'bg-gray-900' : 'bg-white'
      }`}>
        
        {/* Spinner Content */}
        <div className={`flex flex-col items-center justify-center space-y-4 ${className}`}>
          {/* Spinner */}
          <div className="relative">
            <div className={`w-12 h-12 border-4 rounded-full animate-spin ${
              theme === 'dark' ? 'border-gray-600 border-t-blue-500' : 'border-gray-200 border-t-blue-600'
            }`}></div>
            <div className={`absolute inset-0 w-12 h-12 border-4 border-transparent rounded-full animate-spin ${
              theme === 'dark' ? 'border-r-purple-400' : 'border-r-purple-500'
            }`} style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
          </div>
          
          {/* Rotating Message */}
          <div className="text-center">
            <p className={`text-lg font-medium transition-all duration-500 ${
              theme === 'dark' ? 'text-white' : 'text-gray-800'
            }`}>
              {messages[currentMessageIndex]}
            </p>
            <div className="flex justify-center space-x-1 mt-2">
              {messages.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    index === currentMessageIndex
                      ? 'bg-blue-600 scale-125'
                      : theme === 'dark' 
                        ? 'bg-gray-600' 
                        : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
          
          {/* Info Message */}
          <div className="text-center mt-4">
            <p className={`text-sm ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>
              This process cannot be canceled once started
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingSpinner;
