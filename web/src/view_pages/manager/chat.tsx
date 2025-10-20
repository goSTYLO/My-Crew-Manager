import React, { useState } from 'react';
import { Send, Search, MoreVertical, Paperclip, Smile, Phone, Video, MessageSquare, ArrowLeft } from 'lucide-react';
import Sidebar from "../../components/sidebarLayout";
import TopNavbar from "../../components/topbarLayouot";
import { useTheme } from "../../components/themeContext"; // <-- import ThemeContext


const ChatApp = () => {
  const { theme } = useTheme(); // <-- use theme
  const [selectedChat, setSelectedChat] = useState<number | null>(null);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Record<number, any[]>>({});
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showContactList, setShowContactList] = useState(true);

  const contacts = [
    { id: 1, name: 'Sarah Johnson', role: 'Project Manager', avatar: 'SJ', online: true, lastMessage: 'The mobile app design looks great!', time: '2m ago', unread: 2 },
    { id: 2, name: 'Mike Chen', role: 'Developer', avatar: 'MC', online: true, lastMessage: 'I\'ll review the code shortly', time: '15m ago', unread: 0 },
    { id: 3, name: 'Emma Wilson', role: 'Designer', avatar: 'EW', online: false, lastMessage: 'Thanks for the feedback', time: '1h ago', unread: 0 },
    { id: 4, name: 'David Park', role: 'QA Engineer', avatar: 'DP', online: true, lastMessage: 'Found some bugs in Project 2', time: '2h ago', unread: 1 },
    { id: 5, name: 'Lisa Anderson', role: 'Team Lead', avatar: 'LA', online: false, lastMessage: 'Meeting at 3 PM tomorrow', time: '3h ago', unread: 0 },
  ];

  const defaultMessages = {
    1: [
      { id: 1, sender: 'them', text: 'Hey! How is the Mobile App Design project going?', time: '10:30 AM' },
      { id: 2, sender: 'me', text: 'Going well! We\'re making good progress on Projects 1-4', time: '10:32 AM' },
      { id: 3, sender: 'them', text: 'The mobile app design looks great!', time: '10:35 AM' },
      { id: 4, sender: 'them', text: 'Can we schedule a review session?', time: '10:36 AM' },
    ],
    2: [
      { id: 1, sender: 'them', text: 'I\'ll review the code shortly', time: '9:45 AM' },
      { id: 2, sender: 'me', text: 'Sounds good, let me know if you need anything', time: '9:50 AM' },
    ]
  };

  const handleSendMessage = () => {
    if (message.trim() && selectedChat) {
      const newMessage = {
        id: Date.now(),
        sender: 'me',
        text: message,
        time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
      };
      
      setMessages(prev => ({
        ...prev,
        [selectedChat]: [...(prev[selectedChat] || defaultMessages[selectedChat] || []), newMessage]
      }));
      setMessage('');
    }
  };

  const handleSelectChat = (id: number) => {
    setSelectedChat(id);
    setShowContactList(false);
  };

  const handleBackToContacts = () => {
    setShowContactList(true);
  };

  const getCurrentMessages = () => {
    return messages[selectedChat] || defaultMessages[selectedChat] || [];
  };

  const selectedContact = contacts.find(c => c.id === selectedChat);

  return (
    <div className={`min-h-screen flex flex-col ${theme === "dark" ? "bg-gray-900" : "bg-gray-50"}`}>
      {/* Top Navbar */}
      <TopNavbar onMenuClick={() => setSidebarOpen(true)} />

      <div className="flex flex-1">
        {/* Sidebar */}
        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        {/* Chat Interface */}
        <div className={`flex-1 mt-[70px] rounded-none md:rounded-lg shadow-none md:shadow-lg overflow-hidden flex flex-col ${
          theme === "dark" ? "bg-gray-800" : "bg-white"
        }`}>
          <div className="flex h-full">
            {/* Contacts Sidebar */}
            <div className={`${showContactList ? 'flex' : 'hidden'} md:flex w-full md:w-80 flex-col ${
              theme === "dark" ? "border-r border-gray-700" : "border-r border-gray-200"
            }`}>
              {/* Search */}
              <div className={`p-4 ${theme === "dark" ? "border-b border-gray-700" : "border-b border-gray-200"}`}>
                <div className="relative">
                  <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${
                    theme === "dark" ? "text-gray-500" : "text-gray-400"
                  }`} />
                  <input
                    type="text"
                    placeholder="Search conversations..."
                    className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      theme === "dark" 
                        ? "bg-gray-900 border-gray-700 text-white placeholder-gray-500" 
                        : "border-gray-300"
                    }`}
                  />
                </div>
              </div>

              {/* Contact List */}
              <div className="flex-1 overflow-y-auto">
                {contacts.map(contact => (
                  <div
                    key={contact.id}
                    onClick={() => handleSelectChat(contact.id)}
                    className={`p-4 cursor-pointer transition-colors ${
                      theme === "dark" 
                        ? `border-b border-gray-700 hover:bg-gray-700 ${selectedChat === contact.id ? 'bg-gray-700' : ''}`
                        : `border-b border-gray-100 hover:bg-gray-50 ${selectedChat === contact.id ? 'bg-blue-50' : ''}`
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="relative">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                          {contact.avatar}
                        </div>
                        {contact.online && (
                          <div className={`absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full ${
                            theme === "dark" ? "border-2 border-gray-800" : "border-2 border-white"
                          }`}></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className={`font-semibold truncate ${
                            theme === "dark" ? "text-white" : "text-gray-800"
                          }`}>{contact.name}</h3>
                          <span className={`text-xs ${
                            theme === "dark" ? "text-gray-400" : "text-gray-500"
                          }`}>{contact.time}</span>
                        </div>
                        <p className={`text-sm truncate ${
                          theme === "dark" ? "text-gray-400" : "text-gray-500"
                        }`}>{contact.role}</p>
                        <p className={`text-sm truncate mt-1 ${
                          theme === "dark" ? "text-gray-300" : "text-gray-600"
                        }`}>{contact.lastMessage}</p>
                      </div>
                      {contact.unread > 0 && (
                        <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                          {contact.unread}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Chat Area */}
            <div className={`${!showContactList || selectedChat ? 'flex' : 'hidden'} md:flex flex-1 flex-col w-full md:w-auto`}>
              {selectedChat ? (
                <>
                  {/* Chat Header */}
                  <div className={`p-4 ${
                    theme === "dark" 
                      ? "border-b border-gray-700 bg-gray-800" 
                      : "border-b border-gray-200 bg-white"
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={handleBackToContacts}
                          className={`md:hidden p-2 rounded-lg transition-colors ${
                            theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-100"
                          }`}
                        >
                          <ArrowLeft className={`w-5 h-5 ${
                            theme === "dark" ? "text-gray-300" : "text-gray-600"
                          }`} />
                        </button>
                        <div className="relative">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                            {selectedContact?.avatar}
                          </div>
                          {selectedContact?.online && (
                            <div className={`absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full ${
                              theme === "dark" ? "border-2 border-gray-800" : "border-2 border-white"
                            }`}></div>
                          )}
                        </div>
                        <div>
                          <h2 className={`font-semibold ${
                            theme === "dark" ? "text-white" : "text-gray-800"
                          }`}>{selectedContact?.name}</h2>
                          <p className={`text-sm ${
                            theme === "dark" ? "text-gray-400" : "text-gray-500"
                          }`}>{selectedContact?.role}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 md:gap-2">
                        <button className={`p-2 rounded-lg transition-colors ${
                          theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-100"
                        }`}>
                          <Phone className={`w-4 h-4 md:w-5 md:h-5 ${
                            theme === "dark" ? "text-gray-300" : "text-gray-600"
                          }`} />
                        </button>
                        <button className={`p-2 rounded-lg transition-colors ${
                          theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-100"
                        }`}>
                          <Video className={`w-4 h-4 md:w-5 md:h-5 ${
                            theme === "dark" ? "text-gray-300" : "text-gray-600"
                          }`} />
                        </button>
                        <button className={`p-2 rounded-lg transition-colors ${
                          theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-100"
                        }`}>
                          <MoreVertical className={`w-4 h-4 md:w-5 md:h-5 ${
                            theme === "dark" ? "text-gray-300" : "text-gray-600"
                          }`} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className={`flex-1 overflow-y-auto p-3 md:p-4 ${
                    theme === "dark" ? "bg-gray-900" : "bg-gray-50"
                  }`}>
                    <div className="space-y-3 md:space-y-4">
                      {getCurrentMessages().map(msg => (
                        <div
                          key={msg.id}
                          className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[85%] md:max-w-md px-3 md:px-4 py-2 rounded-lg ${
                              msg.sender === 'me'
                                ? 'bg-blue-600 text-white'
                                : theme === "dark"
                                ? 'bg-gray-800 text-gray-100 border border-gray-700'
                                : 'bg-white text-gray-800 border border-gray-200'
                            }`}
                          >
                            <p className="text-sm">{msg.text}</p>
                            <p
                              className={`text-xs mt-1 ${
                                msg.sender === 'me' 
                                  ? 'text-blue-200' 
                                  : theme === "dark"
                                  ? 'text-gray-400'
                                  : 'text-gray-500'
                              }`}
                            >
                              {msg.time}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Message Input */}
                  <div className={`p-3 md:p-4 ${
                    theme === "dark"
                      ? "bg-gray-800 border-t border-gray-700"
                      : "bg-white border-t border-gray-200"
                  }`}>
                    <div className="flex items-center gap-1 md:gap-2">
                      <button className={`p-2 rounded-lg transition-colors ${
                        theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-100"
                      }`}>
                        <Paperclip className={`w-4 h-4 md:w-5 md:h-5 ${
                          theme === "dark" ? "text-gray-300" : "text-gray-600"
                        }`} />
                      </button>
                      <button className={`p-2 rounded-lg transition-colors hidden sm:block ${
                        theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-100"
                      }`}>
                        <Smile className={`w-5 h-5 ${
                          theme === "dark" ? "text-gray-300" : "text-gray-600"
                        }`} />
                      </button>
                      <input
                        type="text"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        placeholder="Type a message..."
                        className={`flex-1 px-3 md:px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm md:text-base ${
                          theme === "dark"
                            ? "bg-gray-900 border-gray-700 text-white placeholder-gray-500"
                            : "border-gray-300"
                        }`}
                      />
                      <button
                        onClick={handleSendMessage}
                        className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <Send className="w-4 h-4 md:w-5 md:h-5" />
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className={`flex-1 flex items-center justify-center ${
                  theme === "dark" ? "bg-gray-900" : "bg-gray-50"
                }`}>
                  <div className="text-center px-4">
                    <div className={`w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${
                      theme === "dark" ? "bg-gray-800" : "bg-gray-200"
                    }`}>
                      <MessageSquare className={`w-8 h-8 md:w-10 md:h-10 ${
                        theme === "dark" ? "text-gray-600" : "text-gray-400"
                      }`} />
                    </div>
                    <h3 className={`text-lg md:text-xl font-semibold mb-2 ${
                      theme === "dark" ? "text-gray-200" : "text-gray-700"
                    }`}>Select a conversation</h3>
                    <p className={`text-sm md:text-base ${
                      theme === "dark" ? "text-gray-400" : "text-gray-500"
                    }`}>Choose a team member to start chatting</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatApp;