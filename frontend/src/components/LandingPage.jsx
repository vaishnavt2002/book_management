import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const LandingPage = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center text-center px-4">
      <h1 className="text-4xl sm:text-5xl font-bold text-gray-800 mb-6">
        Welcome to Book Management
      </h1>
      <p className="text-lg sm:text-xl text-gray-600 mb-8 max-w-2xl">
        Organize your reading journey with ease. Create reading lists, manage books, and explore a world of
        literature.
      </p>
      {user ? (
        <div className="space-x-4">
          <Link
            to="/books"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-md text-lg font-medium hover:bg-blue-700 transition"
          >
            Explore Books
          </Link>
          <Link
            to="/reading-lists"
            className="inline-block bg-gray-600 text-white px-6 py-3 rounded-md text-lg font-medium hover:bg-gray-700 transition"
          >
            My Reading Lists
          </Link>
        </div>
      ) : (
        <div className="space-x-4">
          <Link
            to="/signup"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-md text-lg font-medium hover:bg-blue-700 transition"
          >
            Get Started
          </Link>
          <Link
            to="/login"
            className="inline-block border border-blue-600 text-blue-600 px-6 py-3 rounded-md text-lg font-medium hover:bg-blue-50 transition"
          >
            Login
          </Link>
        </div>
      )}
    </div>
  );
};

export default LandingPage;