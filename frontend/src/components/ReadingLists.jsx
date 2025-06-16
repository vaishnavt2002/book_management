import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import bookApi from '../api/bookApi';

const ReadingLists = () => {
  const { user, isLoading } = useAuth();
  const [readingLists, setReadingLists] = useState([]);
  const [formData, setFormData] = useState({ name: '' });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    if (!user && !isLoading) {
      navigate('/login');
    } else if (user) {
      fetchReadingLists();
    }
  }, [user, isLoading, navigate]);

  const fetchReadingLists = async () => {
    try {
      const res = await bookApi.getReadingLists();
      setReadingLists(res.data);
    } catch (err) {
      setError('Failed to fetch reading lists');
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCreateList = async (e) => {
    e.preventDefault();
    setIsSubmitting({ ...isSubmitting, create: true });
    try {
      await bookApi.createReadingList({ name: formData.name });
      setFormData({ name: '' });
      fetchReadingLists();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create reading list');
    } finally {
      setIsSubmitting({ ...isSubmitting, create: false });
    }
  };

  const handleDeleteList = async (id) => {
    if (window.confirm('Are you sure you want to delete this reading list?')) {
      setIsSubmitting({ ...isSubmitting, [id]: 'delete' });
      try {
        await bookApi.deleteReadingList(id);
        fetchReadingLists();
      } catch (err) {
        setError('Failed to delete reading list');
      } finally {
        setIsSubmitting({ ...isSubmitting, [id]: false });
      }
    }
  };

  const handleRemoveBook = async (listId, bookId) => {
    setIsSubmitting({ ...isSubmitting, [`${listId}-${bookId}`]: 'remove' });
    try {
      await bookApi.removeBookFromList(listId, bookId);
      fetchReadingLists();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to remove book from list');
    } finally {
      setIsSubmitting({ ...isSubmitting, [`${listId}-${bookId}`]: false });
    }
  };

  const handleMarkCompleted = async (listId, bookId) => {
    setIsSubmitting({ ...isSubmitting, [`${listId}-${bookId}`]: 'complete' });
    try {
      await bookApi.markBookCompleted(listId, bookId);
      fetchReadingLists();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to mark book as completed');
    } finally {
      setIsSubmitting({ ...isSubmitting, [`${listId}-${bookId}`]: false });
    }
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

  const handleMoveBook = async (listId, bookId, direction) => {
    setIsSubmitting({ ...isSubmitting, [`${listId}-${bookId}`]: 'move' });
    try {
      const list = readingLists.find((l) => l.id === listId);
      const activeBooks = list.reading_list_books
        .filter((item) => !item.is_completed)
        .sort((a, b) => a.order - b.order);
      const currentIndex = activeBooks.findIndex((item) => item.book.id === bookId);

      if (
        (direction === 'up' && currentIndex === 0) ||
        (direction === 'down' && currentIndex === activeBooks.length - 1)
      ) {
        setIsSubmitting({ ...isSubmitting, [`${listId}-${bookId}`]: false });
        return;
      }

      const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
      [activeBooks[currentIndex], activeBooks[newIndex]] = [
        activeBooks[newIndex],
        activeBooks[currentIndex],
      ];

      const bookOrders = activeBooks.map((item, index) => ({
        book_id: item.book.id,
        order: index + 1,
      }));

      await bookApi.reorderBooks(listId, bookOrders);
      fetchReadingLists();
    } catch (err) {
      setError('Failed to reorder books');
    } finally {
      setIsSubmitting({ ...isSubmitting, [`${listId}-${bookId}`]: false });
    }
  };

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
          <h1 className="text-3xl font-light text-slate-800 tracking-tight">Reading Lists</h1>
          <p className="text-slate-500 mt-2">Organize your reading journey</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-8 p-4 bg-red-50 border-l-4 border-red-400 rounded-r-lg">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Create New List Form */}
        <div className="mb-12">
          <form onSubmit={handleCreateList} className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
            <h2 className="text-lg font-medium text-slate-800 mb-6">Create New Reading List</h2>
            <div className="flex flex-col sm:flex-row gap-4">
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="flex-1 px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-400 focus:border-transparent outline-none transition-all"
                placeholder="Enter list name"
                required
              />
              <button
                type="submit"
                disabled={isSubmitting.create}
                className="px-6 py-3 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed flex items-center justify-center min-w-[120px]"
              >
                {isSubmitting.create ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                    Creating...
                  </>
                ) : (
                  'Create List'
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Reading Lists */}
        <div className="space-y-8">
          {readingLists.map((list) => (
            <div key={list.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              {/* List Header */}
              <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center">
                <h3 className="text-xl font-medium text-slate-800">{list.name}</h3>
                <button
                  onClick={() => handleDeleteList(list.id)}
                  className="px-4 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                  disabled={isSubmitting[list.id] === 'delete'}
                >
                  {isSubmitting[list.id] === 'delete' ? 'Deleting...' : 'Delete List'}
                </button>
              </div>

              <div className="p-8">
                {/* Active Books Section */}
                <div className="mb-8">
                  <h4 className="text-sm font-medium text-slate-600 uppercase tracking-wide mb-4">Current Reading</h4>
                  {list.reading_list_books.filter((item) => !item.is_completed).length === 0 ? (
                    <p className="text-slate-400 italic">No books in this list yet</p>
                  ) : (
                    <div className="space-y-3">
                      {list.reading_list_books
                        .filter((item) => !item.is_completed)
                        .sort((a, b) => a.order - b.order)
                        .map((item, index, array) => (
                          <div
                            key={item.book.id}
                            className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-100"
                          >
                            <div className="flex-1">
                              <h5 className="font-medium text-slate-800">{item.book.title}</h5>
                              <p className="text-sm text-slate-500 mt-1">{item.book.authors}</p>
                            </div>
                            <div className="flex items-center space-x-2 ml-4">
                              {item.book.pdf_file && (
                                <button
                                  onClick={() => handleViewPDF(item.book.id)}
                                  className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors disabled:opacity-50"
                                  disabled={isSubmitting[item.book.id] === 'pdf'}
                                >
                                  {isSubmitting[item.book.id] === 'pdf' ? 'Loading...' : 'View PDF'}
                                </button>
                              )}
                              <div className="flex">
                                <button
                                  onClick={() => handleMoveBook(list.id, item.book.id, 'up')}
                                  disabled={isSubmitting[`${list.id}-${item.book.id}`] || index === 0}
                                  className="p-1.5 text-slate-400 hover:text-slate-600 disabled:opacity-30 transition-colors"
                                  title="Move Up"
                                >
                                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => handleMoveBook(list.id, item.book.id, 'down')}
                                  disabled={isSubmitting[`${list.id}-${item.book.id}`] || index === array.length - 1}
                                  className="p-1.5 text-slate-400 hover:text-slate-600 disabled:opacity-30 transition-colors"
                                  title="Move Down"
                                >
                                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                  </svg>
                                </button>
                              </div>
                              <button
                                onClick={() => handleMarkCompleted(list.id, item.book.id)}
                                className="px-3 py-1.5 text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-md transition-colors disabled:opacity-50"
                                disabled={isSubmitting[`${list.id}-${item.book.id}`] === 'complete'}
                              >
                                {isSubmitting[`${list.id}-${item.book.id}`] === 'complete' ? 'Marking...' : 'Complete'}
                              </button>
                              <button
                                onClick={() => handleRemoveBook(list.id, item.book.id)}
                                className="px-3 py-1.5 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
                                disabled={isSubmitting[`${list.id}-${item.book.id}`] === 'remove'}
                              >
                                {isSubmitting[`${list.id}-${item.book.id}`] === 'remove' ? 'Removing...' : 'Remove'}
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>

                {/* Completed Books Section */}
                <div>
                  <h4 className="text-sm font-medium text-slate-600 uppercase tracking-wide mb-4">Completed</h4>
                  {list.reading_list_books.filter((item) => item.is_completed).length === 0 ? (
                    <p className="text-slate-400 italic">No completed books yet</p>
                  ) : (
                    <div className="space-y-3">
                      {list.reading_list_books
                        .filter((item) => item.is_completed)
                        .sort((a, b) => new Date(b.completed_at) - new Date(a.completed_at))
                        .map((item) => (
                          <div
                            key={item.book.id}
                            className="flex items-center justify-between p-4 bg-emerald-50 rounded-lg border border-emerald-100"
                          >
                            <div className="flex-1">
                              <h5 className="font-medium text-slate-800">{item.book.title}</h5>
                              <p className="text-sm text-slate-500 mt-1">{item.book.authors}</p>
                              <p className="text-xs text-emerald-600 mt-1">
                                Completed: {new Date(item.completed_at).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="flex items-center space-x-2 ml-4">
                              {item.book.pdf_file && (
                                <button
                                  onClick={() => handleViewPDF(item.book.id)}
                                  className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors disabled:opacity-50"
                                  disabled={isSubmitting[item.book.id] === 'pdf'}
                                >
                                  {isSubmitting[item.book.id] === 'pdf' ? 'Loading...' : 'View PDF'}
                                </button>
                              )}
                              <button
                                onClick={() => handleRemoveBook(list.id, item.book.id)}
                                className="px-3 py-1.5 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
                                disabled={isSubmitting[`${list.id}-${item.book.id}`] === 'remove'}
                              >
                                {isSubmitting[`${list.id}-${item.book.id}`] === 'remove' ? 'Removing...' : 'Remove'}
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {readingLists.length === 0 && (
          <div className="text-center py-12">
            <p className="text-slate-400 text-lg">No reading lists yet. Create your first one above!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReadingLists;