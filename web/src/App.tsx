import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import SignIn from './pages/signIn';
import SignUp from './pages/signUp'; 
import MainFrame from './pages/mainFrame'; 
import Projects from './pages/projects'; 
import CreateTask from './pages/createTask'; 
import CreateProject from './pages/createProject'; 
import Performance from './pages/performance'; 
import Settings from './pages/settings'; 

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
        <Route path="/signUp" element={<SignUp />} />
        <Route path="/create" element={<CreateTask />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/create-project" element={<CreateProject />} />
        <Route path="/performance" element={<Performance />} />
        <Route path="/settings" element={<Settings />} />
        
        <Route path="*" element={<Navigate to="/signIn" replace />} />
      </Routes>
    </Router>
  );
};

export default App;