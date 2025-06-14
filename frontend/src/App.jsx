import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/NavBar';
import LandingPage from './components/LandingPage';
import Login from './components/Login';
import Signup from './components/Signup';
import Loading from './components/Loading';

function App() {
  const { isLoading } = useAuth()
  if (isLoading) {
    return <Loading />;
  }

  return (
        <>
        <Navbar />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/books" element={<div>Books Page (To be implemented)</div>} />
          <Route path="/reading-lists" element={<div>Reading Lists Page (To be implemented)</div>} />
          <Route path="/profile" element={<div>Profile Page (To be implemented)</div>} />
        </Routes>
        </>
  )
}

export default App
