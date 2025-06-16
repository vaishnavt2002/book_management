import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import bookApi from '../api/bookApi';

const Books = () => {
  const { user, isLoading } = useAuth();
  const [books, setBooks] = useState([]);
  const [readingLists, setReadingLists] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState({});
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showReadingListModal, setShowReadingListModal] = useState(null);
  const navigate = useNavigate();
  const baseURL = import.meta.env.VITE_MEDIA_URL;

  useEffect(() => {
    if (!user && !isLoading) {
      navigate('/login');
    } else if (user) {
      fetchBooks();
      fetchReadingLists();
    }
  }, [user, isLoading, navigate]);

  const fetchBooks = async () => {
    try {
      const res = await bookApi.getBooks(searchQuery);
      setBooks(res.data);
    } catch (err) {
      setError('Failed to fetch books');
    }
  };

  const fetchReadingLists = async () => {
    try {
      const res = await bookApi.getReadingLists();
      setReadingLists(res.data);
    } catch (err) {
      setError('Failed to fetch reading lists');
    }
  };

  useEffect(() => {
    if (user) {
      fetchBooks();
    }
  }, [searchQuery, user]);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleViewPDF = async (bookId) => {
    setIsSubmitting({ ...isSubmitting, [bookId]: 'pdf' });
    try {
      const response = await bookApi.getBookPDF(bookId);
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      window.open(url, '_blank');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load PDF');
    } finally {
      setIsSubmitting({ ...isSubmitting, [bookId]: false });
    }
  };

  const handleAddToList = async (bookId, listId) => {
    setIsSubmitting({ ...isSubmitting, [bookId]: 'add' });
    try {
      await bookApi.addBookToList(listId, bookId);
      setShowReadingListModal(null);
      setShowSuccessModal(true);
      fetchBooks();
      fetchReadingLists();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to add book to list');
      setShowReadingListModal(null);
    } finally {
      setIsSubmitting({ ...isSubmitting, [bookId]: false });
    }
  };

  useEffect(() => {
    if (showSuccessModal) {
      const timer = setTimeout(() => setShowSuccessModal(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showSuccessModal]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <div className="animate-spin h-6 w-6 border-2 border-slate-300 border-t-slate-600 rounded-full"></div>
          <span className="text-slate-600 font-medium">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-3xl font-light text-slate-800 tracking-tight">Books</h1>
          <p className="text-slate-500 mt-2">Explore and add books to your reading lists</p>
        </div>

        {/* Search Bar */}
        <div className="mb-8">
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-400 focus:border-transparent outline-none transition-all"
            placeholder="Search by title, author, or genre"
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-8 p-4 bg-red-50 border-l-4 border-red-400 rounded-r-lg">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Success Modal */}
        {showSuccessModal && (
          <div className="fixed inset-0 bg-slate-600 bg-opacity-50 backdrop-blur-none flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 max-w-md w-full">
              <h3 className="text-lg font-medium text-slate-800 mb-4">Book Added</h3>
              <p className="text-slate-600 mb-6">Your book has been successfully added to the reading list!</p>
              <button
                onClick={() => setShowSuccessModal(false)}
                className="w-full px-6 py-3 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* Reading List Selection Modal */}
        {showReadingListModal && (
          <div className="fixed inset-0 bg-slate-600 bg-opacity-50 backdrop-blur-none flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 max-w-md w-full">
              <h3 className="text-lg font-medium text-slate-800 mb-4">Add to Reading List</h3>
              {readingLists.length > 0 ? (
                <div className="space-y-2 mb-6">
                  {readingLists.map((list) => (
                    <button
                      key={list.id}
                      onClick={() => handleAddToList(showReadingListModal, list.id)}
                      className="w-full px-4 py-2 text-left text-sm text-slate-600 hover:bg-slate-100 rounded-md transition-colors flex items-center justify-between"
                      disabled={isSubmitting[showReadingListModal] === 'add'}
                    >
                      <span>{list.name}</span>
                      {isSubmitting[showReadingListModal] === 'add' && (
                        <div className="animate-spin h-4 w-4 border-2 border-slate-600 border-t-transparent rounded-full"></div>
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-slate-600 mb-6">No reading lists available. Create one first.</p>
              )}
              <button
                onClick={() => setShowReadingListModal(null)}
                className="w-full px-6 py-3 bg-slate-600 text-white rounded-lg hover:bg-slate-500 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Books Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {books.length > 0 ? (
            books.map((book) => (
              <div key={book.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4">
                  {book.cover_image && (
                    <img
                      src={baseURL + book.cover_image}
                      alt={book.title}
                      className="w-full h-48 rounded-lg object-contain mb-4"
                    />
                  )}
                  <h3 className="text-lg font-medium text-slate-800 mb-2">{book.title}</h3>
                  <p className="text-sm text-slate-500 mb-1">Author(s): {book.authors}</p>
                  <p className="text-sm text-slate-500 mb-1">Genre: {book.genre}</p>
                  <p className="text-sm text-slate-500 mb-2">
                    Published: {new Date(book.publication_date).toLocaleDateString()}
                  </p>
                  {book.description && (
                    <p className="text-sm text-slate-600 mb-4 line-clamp-2">{book.description}</p>
                  )}
                  {user && (
                    <div className="flex flex-col gap-2">
                      {book.pdf_file && (
                        <button
                          onClick={() => handleViewPDF(book.id)}
                          className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors disabled:opacity-50"
                          disabled={isSubmitting[book.id] === 'pdf'}
                        >
                          {isSubmitting[book.id] === 'pdf' ? (
                            <>
                              <div className="animate-spin h-4 w-4 border-2 border-slate-600 border-t-transparent rounded-full mr-2 inline-block"></div>
                              Loading PDF...
                            </>
                          ) : (
                            'View PDF'
                          )}
                        </button>
                      )}
                      <button
                        onClick={() => setShowReadingListModal(book.id)}
                        className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors disabled:opacity-50"
                        disabled={isSubmitting[book.id] === 'add'}
                      >
                        {isSubmitting[book.id] === 'add' ? (
                          <>
                            <div className="animate-spin h-4 w-4 border-2 border-slate-600 border-t-transparent rounded-full mr-2 inline-block"></div>
                            Adding...
                          </>
                        ) : (
                          'Add to Reading List'
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <p className="text-slate-400 text-lg">No books found. Try adjusting your search.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Books;