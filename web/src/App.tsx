import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import SignIn from './view_pages/manager/signIn';
import SignUp from './view_pages/manager/signUp'; 
import MainFrame from './view_pages/manager/mainFrame'; 
import MainProjects from './view_pages/manager/projects_main'; 
import Projects from './view_pages/manager/monitorProjects'; 
import CreateProject from './view_pages/manager/createProjects'; 
import CreateTask from './view_pages/manager/createTask'; 
import Performance from './view_pages/manager/performance'; 
import Settings from './view_pages/manager/settings'; 

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
        <Route path="/main-projects" element={<MainProjects />} />
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