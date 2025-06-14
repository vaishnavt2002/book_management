import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/NavBar';
import LandingPage from './components/LandingPage';
import Login from './components/Login';
import Signup from './components/Signup';
import Loading from './components/Loading';
import Books from './components/Books';
import ReadingLists from './components/ReadingLists';
import Profile from './components/Profile';

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
          <Route path="/books" element={<Books />} />
          <Route path="/reading-lists" element={<ReadingLists />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
        </>
  )
}

export default App
