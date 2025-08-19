import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import SignIn from './pages/signIn';
import MainFrame from './pages/mainFrame'; 
const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        {/* Root path shows Sign In */}
        <Route path="/" element={<SignIn />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/sign-in" element={<SignIn />} />
        
        {/* Fallback: redirect unknown paths to root */}
        <Route path="/main" element={<MainFrame />} />
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

export default App;