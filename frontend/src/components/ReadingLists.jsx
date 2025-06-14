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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 text-blue-600">
          <svg viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Reading Lists</h2>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <form onSubmit={handleCreateList} className="mb-8 bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-medium text-gray-700 mb-4">Create New Reading List</h3>
        <div className="flex space-x-4">
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            placeholder="Reading List Name"
            required
          />
          <button
            type="submit"
            disabled={isSubmitting.create}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition flex items-center disabled:bg-blue-400"
          >
            {isSubmitting.create ? (
              <>
                <svg className="animate-spin h-5 w-5 mr-2 text-white" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Creating...
              </>
            ) : (
              'Create'
            )}
          </button>
        </div>
      </form>
      <div className="space-y-6">
        {readingLists.map((list) => (
          <div key={list.id} className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-800">{list.name}</h3>
              <button
                onClick={() => handleDeleteList(list.id)}
                className="text-red-600 hover:text-red-800 text-sm"
                disabled={isSubmitting[list.id] === 'delete'}
              >
                {isSubmitting[list.id] === 'delete' ? 'Deleting...' : 'Delete List'}
              </button>
            </div>
            <h4 className="text-md font-medium text-gray-700 mb-2">Reading List</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              {list.reading_list_books
                .filter((item) => !item.is_completed)
                .sort((a, b) => a.order - b.order)
                .map((item, index, array) => (
                  <div
                    key={item.book.id}
                    className="flex justify-between items-center p-2 bg-gray-50 rounded-md"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-800">{item.book.title}</p>
                      <p className="text-sm text-gray-600">Author(s): {item.book.authors}</p>
                    </div>
                    <div className="flex space-x-2">
                      {item.book.pdf_file && (
                        <button
                          onClick={() => handleViewPDF(item.book.id)}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                          disabled={isSubmitting[item.book.id] === 'pdf'}
                        >
                          {isSubmitting[item.book.id] === 'pdf' ? 'Loading PDF...' : 'View PDF'}
                        </button>
                      )}
                      <button
                        onClick={() => handleMoveBook(list.id, item.book.id, 'up')}
                        disabled={isSubmitting[`${list.id}-${item.book.id}`] || index === 0}
                        className="text-blue-600 hover:text-blue-800 text-sm disabled:text-gray-400"
                        title="Move Up"
                      >
                        ↑
                      </button>
                      <button
                        onClick={() => handleMoveBook(list.id, item.book.id, 'down')}
                        disabled={isSubmitting[`${list.id}-${item.book.id}`] || index === array.length - 1}
                        className="text-blue-600 hover:text-blue-800 text-sm disabled:text-gray-400"
                        title="Move Down"
                      >
                        ↓
                      </button>
                      <button
                        onClick={() => handleMarkCompleted(list.id, item.book.id)}
                        className="text-green-600 hover:text-green-800 text-sm"
                        disabled={isSubmitting[`${list.id}-${item.book.id}`] === 'complete'}
                      >
                        {isSubmitting[`${list.id}-${item.book.id}`] === 'complete' ? 'Marking...' : 'Mark Completed'}
                      </button>
                      <button
                        onClick={() => handleRemoveBook(list.id, item.book.id)}
                        className="text-red-600 hover:text-red-800 text-sm"
                        disabled={isSubmitting[`${list.id}-${item.book.id}`] === 'remove'}
                      >
                        {isSubmitting[`${list.id}-${item.book.id}`] === 'remove' ? 'Removing...' : 'Remove'}
                      </button>
                    </div>
                  </div>
                ))}
            </div>
            <h4 className="text-md font-medium text-gray-700 mb-2">Completed Books</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {list.reading_list_books
                .filter((item) => item.is_completed) // Fixed filter to show completed books
                .sort((a, b) => new Date(b.completed_at) - new Date(a.completed_at))
                .map((item) => (
                  <div
                    key={item.book.id}
                    className="flex justify-between items-center p-2 bg-gray-50 rounded-md"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-800">{item.book.title}</p>
                      <p className="text-sm text-gray-600">Author(s): {item.book.authors}</p>
                      <p className="text-sm text-gray-600">
                        Completed: {new Date(item.completed_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      {item.book.pdf_file && (
                        <button
                          onClick={() => handleViewPDF(item.book.id)}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                          disabled={isSubmitting[item.book.id] === 'pdf'}
                        >
                          {isSubmitting[item.book.id] === 'pdf' ? 'Loading PDF...' : 'View PDF'}
                        </button>
                      )}
                      <button
                        onClick={() => handleRemoveBook(list.id, item.book.id)}
                        className="text-red-600 hover:text-red-800 text-sm"
                        disabled={isSubmitting[`${list.id}-${item.book.id}`] === 'remove'}
                      >
                        {isSubmitting[`${list.id}-${item.book.id}`] === 'remove' ? 'Removing...' : 'Remove'}
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReadingLists;