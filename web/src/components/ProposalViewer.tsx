import React from 'react';
import { X, FileText, Calendar } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useTheme } from './themeContext';

interface ProposalViewerProps {
  isOpen: boolean;
  onClose: () => void;
  proposalData: {
    parsed_text: string;
    uploaded_at: string;
  };
}

const ProposalViewer: React.FC<ProposalViewerProps> = ({
  isOpen,
  onClose,
  proposalData
}) => {
  const { theme } = useTheme();

  if (!isOpen) return null;

  // Debug logging
  console.log('ProposalViewer - proposalData:', proposalData);
  console.log('ProposalViewer - parsed_text:', proposalData?.parsed_text);

  // Convert plain text to markdown format
  const formatTextAsMarkdown = (text: string): string => {
    if (!text) return 'No content available.';
    
    return text
      // Convert main sections to headers
      .replace(/^Project Title:/gm, '## Project Title:')
      .replace(/^Objective:/gm, '## Objective:')
      .replace(/^Scope:/gm, '## Scope:')
      .replace(/^Team Composition:/gm, '## Team Composition:')
      .replace(/^Timeline:/gm, '## Timeline:')
      .replace(/^Resources:/gm, '## Resources:')
      .replace(/^Risks:/gm, '## Risks:')
      .replace(/^Success Criteria:/gm, '## Success Criteria:')
      // Convert bullet points to markdown lists
      .replace(/^● /gm, '- ')
      // Add line breaks before headers
      .replace(/\n(## )/g, '\n\n$1')
      // Ensure proper spacing around lists
      .replace(/(\n- .+)(\n- )/g, '$1\n$2')
      // Add line breaks before lists
      .replace(/(\n)(- .+)/g, '\n\n$2')
      // Clean up multiple consecutive line breaks
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center ${
        theme === 'dark' ? 'bg-black bg-opacity-75' : 'bg-black bg-opacity-50'
      }`}
      onClick={handleBackdropClick}
    >
      <div
        className={`relative w-full h-full max-w-4xl mx-4 my-8 ${
          theme === 'dark' ? 'bg-gray-900' : 'bg-white'
        } rounded-lg shadow-2xl flex flex-col`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${
          theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <div className="flex items-center">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
              <FileText className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className={`text-xl font-semibold ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                Project Proposal
              </h2>
              <div className="flex items-center text-sm text-gray-500 mt-1">
                <Calendar className="w-4 h-4 mr-1" />
                Uploaded: {new Date(proposalData.uploaded_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg hover:bg-gray-100 ${
              theme === 'dark' ? 'hover:bg-gray-800 text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'
            } transition-colors`}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className={`max-w-none prose prose-lg ${
            theme === 'dark' 
              ? 'prose-invert prose-headings:text-white prose-p:text-gray-300 prose-li:text-gray-300 prose-strong:text-white prose-code:text-gray-200 prose-code:bg-gray-800 prose-pre:bg-gray-800 prose-pre:text-gray-200 prose-blockquote:border-gray-600 prose-blockquote:text-gray-400' 
              : 'prose-headings:text-gray-900 prose-p:text-gray-700 prose-li:text-gray-700 prose-strong:text-gray-900 prose-code:text-gray-800 prose-code:bg-gray-100 prose-pre:bg-gray-100 prose-pre:text-gray-800 prose-blockquote:border-gray-300 prose-blockquote:text-gray-600'
          }`}>
            <ReactMarkdown
              components={{
                h1: ({ children }) => (
                  <h1 className={`text-3xl font-bold mb-6 mt-8 first:mt-0 ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>
                    {children}
                  </h1>
                ),
                h2: ({ children }) => (
                  <h2 className={`text-2xl font-semibold mb-4 mt-6 ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>
                    {children}
                  </h2>
                ),
                h3: ({ children }) => (
                  <h3 className={`text-xl font-semibold mb-3 mt-5 ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>
                    {children}
                  </h3>
                ),
                p: ({ children }) => (
                  <p className={`mb-4 leading-relaxed ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    {children}
                  </p>
                ),
                ul: ({ children }) => (
                  <ul className={`mb-4 pl-6 space-y-2 ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    {children}
                  </ul>
                ),
                ol: ({ children }) => (
                  <ol className={`mb-4 pl-6 space-y-2 ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    {children}
                  </ol>
                ),
                li: ({ children }) => (
                  <li className={`${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    {children}
                  </li>
                ),
                strong: ({ children }) => (
                  <strong className={`font-semibold ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>
                    {children}
                  </strong>
                ),
                code: ({ children }) => (
                  <code className={`px-2 py-1 rounded text-sm font-mono ${
                    theme === 'dark' 
                      ? 'bg-gray-800 text-gray-200' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {children}
                  </code>
                ),
                pre: ({ children }) => (
                  <pre className={`p-4 rounded-lg overflow-x-auto mb-4 ${
                    theme === 'dark' 
                      ? 'bg-gray-800 text-gray-200' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {children}
                  </pre>
                ),
                blockquote: ({ children }) => (
                  <blockquote className={`border-l-4 pl-4 my-4 italic ${
                    theme === 'dark' 
                      ? 'border-gray-600 text-gray-400' 
                      : 'border-gray-300 text-gray-600'
                  }`}>
                    {children}
                  </blockquote>
                ),
              }}
            >
              {formatTextAsMarkdown(proposalData.parsed_text)}
            </ReactMarkdown>
            
            {/* Debug info - remove this after fixing */}
            {!proposalData.parsed_text && (
              <div className={`mt-4 p-4 border rounded-lg ${
                theme === 'dark' ? 'bg-gray-800 border-gray-600' : 'bg-gray-50 border-gray-200'
              }`}>
                <h4 className={`font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  Debug Info:
                </h4>
                <pre className={`text-xs overflow-auto ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  {JSON.stringify(proposalData, null, 2)}
                </pre>
              </div>
            )}
            
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProposalViewer;
