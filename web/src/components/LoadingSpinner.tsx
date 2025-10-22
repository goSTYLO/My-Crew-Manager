import React, { useState, useEffect } from 'react';
import { useTheme } from './themeContext';

interface LoadingSpinnerProps {
  customMessages?: string[];
  interval?: number;
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  customMessages, 
  interval = 2500,
  className = ""
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
    const messageInterval = setInterval(() => {
      setCurrentMessageIndex((prevIndex) => 
        (prevIndex + 1) % messages.length
      );
    }, interval);

    return () => clearInterval(messageInterval);
  }, [messages.length, interval]);

  return (
    <div className={`flex flex-col items-center justify-center space-y-4 ${className}`}>
      {/* Spinner */}
      <div className="relative">
        <div className="w-12 h-12 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div>
        <div className="absolute inset-0 w-12 h-12 border-4 border-transparent border-r-purple-500 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
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
    </div>
  );
};

export default LoadingSpinner;
