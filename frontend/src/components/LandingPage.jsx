import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const LandingPage = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center text-center">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-light text-slate-800 tracking-tight mb-6">
          Welcome to Book Hub
        </h1>
        <p className="text-slate-500 mb-8 max-w-2xl">
          Organize your reading journey with ease. Create reading lists, manage books, and explore a world of
          literature.
        </p>
        {user ? (
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/books"
              className="px-6 py-3 bg-slate-800 text-white rounded-lg text-lg font-medium hover:bg-slate-700 transition"
            >
              Explore Books
            </Link>
            <Link
              to="/reading-lists"
              className="px-6 py-3 bg-slate-600 text-white rounded-lg text-lg font-medium hover:bg-slate-500 transition"
            >
              My Reading Lists
            </Link>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/signup"
              className="px-6 py-3 bg-slate-800 text-white rounded-lg text-lg font-medium hover:bg-slate-700 transition"
            >
              Get Started
            </Link>
            <Link
              to="/login"
              className="px-6 py-3 border border-slate-600 text-slate-600 rounded-lg text-lg font-medium hover:bg-slate-100 transition"
            >
              Login
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default LandingPage;