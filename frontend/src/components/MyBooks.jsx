import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import bookApi from '../api/bookApi';

const MyBooks = () => {
  const { user, isLoading } = useAuth();
  const [books, setBooks] = useState([]); // Initialize with empty array
  const [formData, setFormData] = useState({
    id: null,
    title: '',
    authors: '',
    genre: '',
    publication_date: '',
    description: '',
    cover_image: null,
    pdf_file: null,
  });
  const [editBookId, setEditBookId] = useState(null);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState({});
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();
  const baseURL = import.meta.env.VITE_BASE_URL;

  useEffect(() => {
    if (!user && !isLoading) {
      navigate('/login');
    } else if (user) {
      fetchBooks();
    }
  }, [user, isLoading, navigate]);

  const fetchBooks = async () => {
    try {
      const res = await bookApi.getBooks();
      setBooks(res.data.filter(book => book.created_by === user.id) || []);
    } catch (err) {
      setError('Failed to fetch books');
      setBooks([]); // Ensure books is an array even on error
    }
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setFormData({ ...formData, [name]: files ? files[0] : value });
  };

  const handleEdit = (book) => {
    setEditBookId(book.id);
    setFormData({
      id: book.id,
      title: book.title,
      authors: book.authors,
      genre: book.genre,
      publication_date: book.publication_date,
      description: book.description,
      cover_image: null,
      pdf_file: null,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting({ ...isSubmitting, [editBookId ? 'edit' : 'create']: true });
    try {
      const data = new FormData();
      data.append('title', formData.title);
      data.append('authors', formData.authors);
      data.append('genre', formData.genre);
      data.append('publication_date', formData.publication_date);
      data.append('description', formData.description);
      if (formData.cover_image) {
        data.append('cover_image', formData.cover_image);
      }
      if (formData.pdf_file) {
        data.append('pdf_file', formData.pdf_file);
      }
      if (editBookId) {
        await bookApi.updateBook(formData.id, data);
      } else {
        await bookApi.createBook(data);
      }
      setFormData({
        id: null,
        title: '',
        authors: '',
        genre: '',
        publication_date: '',
        description: '',
        cover_image: null,
        pdf_file: null,
      });
      setEditBookId(null);
      setShowModal(true);
      fetchBooks();
    } catch (err) {
      setError(err.response?.data?.detail || `Failed to ${editBookId ? 'update' : 'create'} book`);
    } finally {
      setIsSubmitting({ ...isSubmitting, [editBookId ? 'edit' : 'create']: false });
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this book?')) {
      setIsSubmitting({ ...isSubmitting, [id]: 'delete' });
      try {
        await bookApi.deleteBook(id);
        fetchBooks();
      } catch (err) {
        setError('Failed to delete book');
      } finally {
        setIsSubmitting({ ...isSubmitting, [id]: false });
      }
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
      <h2 className="text-2xl font-bold text-gray-800 mb-6">My Books</h2>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <form onSubmit={handleSubmit} className="mb-8 bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-medium text-gray-700 mb-4">{editBookId ? 'Edit Book' : 'Add New Book'}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Title</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Author(s)</label>
            <input
              type="text"
              name="authors"
              value={formData.authors}
              onChange={handleChange}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Genre</label>
            <input
              type="text"
              name="genre"
              value={formData.genre}
              onChange={handleChange}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Publication Date</label>
            <input
              type="date"
              name="publication_date"
              value={formData.publication_date}
              onChange={handleChange}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              rows="4"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700">Cover Image</label>
            <input
              type="file"
              name="cover_image"
              onChange={handleChange}
              className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              accept="image/*"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700">PDF File</label>
            <input
              type="file"
              name="pdf_file"
              onChange={handleChange}
              className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              accept="application/pdf"
              required={!editBookId}
            />
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          <button
            type="submit"
            disabled={isSubmitting.create || isSubmitting.edit}
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition flex items-center justify-center disabled:bg-blue-400"
          >
            {isSubmitting.create || isSubmitting.edit ? (
              <>
                <svg className="animate-spin h-5 w-5 mr-2 text-white" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                {editBookId ? 'Updating Book...' : 'Adding Book...'}
              </>
            ) : (
              editBookId ? 'Update Book' : 'Add Book'
            )}
          </button>
          {editBookId && (
            <button
              type="button"
              onClick={() => {
                setEditBookId(null);
                setFormData({
                  id: null,
                  title: '',
                  authors: '',
                  genre: '',
                  publication_date: '',
                  description: '',
                  cover_image: null,
                  pdf_file: null,
                });
              }}
              className="w-full bg-gray-600 text-white py-2 rounded-md hover:bg-gray-700 transition"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-800 mb-4">Book {editBookId ? 'Updated' : 'Created'}</h3>
            <p className="text-gray-600 mb-4">Your book has been successfully {editBookId ? 'updated' : 'created'}!</p>
            <button
              onClick={() => setShowModal(false)}
              className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition"
            >
              Close
            </button>
          </div>
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {books.length > 0 ? (
          books.map((book) => (
            <div key={book.id} className="bg-white p-4 rounded-lg shadow-md">
              {book.cover_image && (
                <img
                  src={baseURL + book.cover_image}
                  alt={book.title}
                  className="w-full h-48 object-cover rounded-md mb-4"
                />
              )}
              <h3 className="text-lg font-medium text-gray-800">{book.title}</h3>
              <p className="text-sm text-gray-600">Author(s): {book.authors}</p>
              <p className="text-sm text-gray-600">Genre: {book.genre}</p>
              <p className="text-sm text-gray-600">
                Published: {new Date(book.publication_date).toLocaleDateString()}
              </p>
              {book.description && (
                <p className="text-sm text-gray-600 mt-2">{book.description}</p>
              )}
              <div className="mt-4 flex flex-col gap-2">
                {book.pdf_file && (
                  <button
                    onClick={() => handleViewPDF(book.id)}
                    className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
                    disabled={isSubmitting[book.id] === 'pdf'}
                  >
                    {isSubmitting[book.id] === 'pdf' ? (
                      <>
                        <svg className="animate-spin h-5 w-5 mr-2 text-blue-600" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                        </svg>
                        Loading PDF...
                      </>
                    ) : (
                      'View PDF'
                    )}
                  </button>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(book)}
                    className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
                    disabled={isSubmitting[book.id]}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(book.id)}
                    className="text-red-600 hover:text-red-800 text-sm flex items-center"
                    disabled={isSubmitting[book.id] === 'delete'}
                  >
                    {isSubmitting[book.id] === 'delete' ? (
                      <>
                        <svg className="animate-spin h-5 w-5 mr-2 text-red-600" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                        </svg>
                        Deleting...
                      </>
                    ) : (
                      'Delete'
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="text-gray-600">No books created yet.</p>
        )}
      </div>
    </div>
  );
};

export default MyBooks;