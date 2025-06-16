import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import bookApi from '../api/bookApi';

const MyBooks = () => {
  const { user, isLoading } = useAuth();
  const [books, setBooks] = useState([]);
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
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(null);
  const navigate = useNavigate();
  const baseURL = import.meta.env.VITE_MEDIA_URL;

  useEffect(() => {
    if (!user && !isLoading) {
      navigate('/login');
    } else if (user) {
      fetchBooks();
    }
  }, [user, isLoading, navigate]);

  useEffect(() => {
    if (showModal) {
      const timer = setTimeout(() => setShowModal(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showModal]);

  const fetchBooks = async () => {
    try {
      const res = await bookApi.getBooksByUser();
      setBooks(res.data || []);
    } catch (err) {
      setErrors({ general: 'Failed to fetch your books' });
      setBooks([]);
    }
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setFormData({ ...formData, [name]: files ? files[0] : value });
    // Clear error for the field when user starts typing
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validateForm = () => {
    const newErrors = {};
    const today = new Date().toISOString().split('T')[0];

    // Title validation
    if (!formData.title || formData.title.trim().length < 2) {
      newErrors.title = 'Title must be at least 2 characters long.';
    }

    // Authors validation
    if (!formData.authors || formData.authors.trim().length < 2) {
      newErrors.authors = 'Author name must be at least 2 characters long.';
    }

    // Genre validation
    if (!formData.genre || formData.genre.trim().length < 2) {
      newErrors.genre = 'Genre must be at least 2 characters long.';
    } else if (!/^[a-zA-Z\s\-]+$/.test(formData.genre.trim())) {
      newErrors.genre = 'Genre must contain only alphabets, spaces, and hyphens.';
    }

    // Publication date validation
    if (!formData.publication_date) {
      newErrors.publication_date = 'Publication date is required.';
    } else if (formData.publication_date > today) {
      newErrors.publication_date = 'Publication date cannot be in the future.';
    }

    // Description validation
    if (formData.description && formData.description.trim().length > 2000) {
      newErrors.description = 'Description cannot exceed 2000 characters.';
    }

    // Cover image validation
    if (formData.cover_image) {
      if (formData.cover_image.size > 5 * 1024 * 1024) {
        newErrors.cover_image = 'Cover image size cannot exceed 5MB.';
      } else if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(formData.cover_image.type)) {
        newErrors.cover_image = 'Invalid image format. Please upload a valid image file (jpg, jpeg, png, gif, webp).';
      }
    }

    // PDF file validation
    if (!editBookId && !formData.pdf_file) {
      newErrors.pdf_file = 'PDF file is required.';
    } else if (formData.pdf_file && !formData.pdf_file.name.toLowerCase().endsWith('.pdf')) {
      newErrors.pdf_file = 'Only PDF files are allowed.';
    }

    return newErrors;
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
    setShowForm(true);
    setErrors({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validateForm();

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting({ ...isSubmitting, [editBookId ? 'edit' : 'create']: true });
    try {
      const data = new FormData();
      data.append('title', formData.title);
      data.append('authors', formData.authors);
      data.append('genre', formData.genre);
      data.append('publication_date', formData.publication_date);
      data.append('description', formData.description);
      if (formData.cover_image) data.append('cover_image', formData.cover_image);
      if (formData.pdf_file) data.append('pdf_file', formData.pdf_file);

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
      setShowForm(false);
      setShowModal(true);
      fetchBooks();
    } catch (err) {
      setErrors({ general: err.response?.data?.detail || `Failed to ${editBookId ? 'update' : 'create'} book` });
    } finally {
      setIsSubmitting({ ...isSubmitting, [editBookId ? 'edit' : 'create']: false });
    }
  };

  const handleDelete = async (id) => {
    setIsSubmitting({ ...isSubmitting, [id]: 'delete' });
    try {
      await bookApi.deleteBook(id);
      fetchBooks();
      setShowDeleteModal(null);
    } catch (err) {
      setErrors({ general: 'Failed to delete book' });
    } finally {
      setIsSubmitting({ ...isSubmitting, [id]: false });
    }
  };

  const handleViewPDF = async (bookId) => {
    setIsSubmitting({ ...isSubmitting, [bookId]: 'pdf' });
    try {
      const response = await bookApi.getBookPDF(bookId);
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      window.open(url, '_blank');
    } catch (err) {
      setErrors({ general: err.response?.data?.detail || 'Failed to load PDF' });
    } finally {
      setIsSubmitting({ ...isSubmitting, [bookId]: false });
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
          <h1 className="text-3xl font-light text-slate-800 tracking-tight">My Books</h1>
          <p className="text-slate-500 mt-2">Manage your personal book collection</p>
        </div>

        {/* General Error Message */}
        {errors.general && (
          <div className="mb-8 p-4 bg-red-50 border-l-4 border-red-400 rounded-r-lg">
            <p className="text-red-700 text-sm">{errors.general}</p>
          </div>
        )}

        {/* Create/Edit Book Form */}
        <div className="mb-12">
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-6 py-3 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors mb-6"
          >
            {showForm ? 'Hide Form' : 'Create New Book'}
          </button>
          {showForm && (
            <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
              <h2 className="text-lg font-medium text-slate-800 mb-6">{editBookId ? 'Edit Book' : 'Add New Book'}</h2>
              <div className="flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-slate-600">Title</label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      className={`mt-1 w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-slate-400 focus:border-transparent outline-none transition-all ${
                        errors.title ? 'border-red-400' : 'border-slate-200'
                      }`}
                      placeholder="Enter book title"
                      required
                    />
                    {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-slate-600">Author(s)</label>
                    <input
                      type="text"
                      name="authors"
                      value={formData.authors}
                      onChange={handleChange}
                      className={`mt-1 w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-slate-400 focus:border-transparent outline-none transition-all ${
                        errors.authors ? 'border-red-400' : 'border-slate-200'
                      }`}
                      placeholder="Enter author(s)"
                      required
                    />
                    {errors.authors && <p className="mt-1 text-sm text-red-600">{errors.authors}</p>}
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-slate-600">Genre</label>
                    <input
                      type="text"
                      name="genre"
                      value={formData.genre}
                      onChange={handleChange}
                      className={`mt-1 w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-slate-400 focus:border-transparent outline-none transition-all ${
                        errors.genre ? 'border-red-400' : 'border-slate-200'
                      }`}
                      placeholder="Enter genre"
                      required
                    />
                    {errors.genre && <p className="mt-1 text-sm text-red-600">{errors.genre}</p>}
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-slate-600">Publication Date</label>
                    <input
                      type="date"
                      name="publication_date"
                      value={formData.publication_date}
                      onChange={handleChange}
                      className={`mt-1 w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-slate-400 focus:border-transparent outline-none transition-all ${
                        errors.publication_date ? 'border-red-400' : 'border-slate-200'
                      }`}
                      required
                    />
                    {errors.publication_date && (
                      <p className="mt-1 text-sm text-red-600">{errors.publication_date}</p>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600">Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    className={`mt-1 w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-slate-400 focus:border-transparent outline-none transition-all ${
                      errors.description ? 'border-red-400' : 'border-slate-200'
                    }`}
                    rows="4"
                    placeholder="Enter book description"
                  />
                  {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
                </div>
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-slate-600">Cover Image</label>
                    <input
                      type="file"
                      name="cover_image"
                      onChange={handleChange}
                      className={`mt-1 w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 ${
                        errors.cover_image ? 'border-red-400' : ''
                      }`}
                      accept="image/*"
                    />
                    {errors.cover_image && <p className="mt-1 text-sm text-red-600">{errors.cover_image}</p>}
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-slate-600">PDF File</label>
                    <input
                      type="file"
                      name="pdf_file"
                      onChange={handleChange}
                      className={`mt-1 w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 ${
                        errors.pdf_file ? 'border-red-400' : ''
                      }`}
                      accept="application/pdf"
                      required={!editBookId}
                    />
                    {errors.pdf_file && <p className="mt-1 text-sm text-red-600">{errors.pdf_file}</p>}
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    type="submit"
                    disabled={isSubmitting.create || isSubmitting.edit}
                    className="flex-1 px-6 py-3 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {isSubmitting.create || isSubmitting.edit ? (
                      <>
                        <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                        {editBookId ? 'Updating Book...' : 'Adding Book...'}
                      </>
                    ) : (
                      editBookId ? 'Update Book' : 'Add Book'
                    )}
                  </button>
                  {(editBookId || showForm) && (
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
                        setShowForm(false);
                        setErrors({});
                      }}
                      className="flex-1 px-6 py-3 bg-slate-600 text-white rounded-lg hover:bg-slate-500 transition-colors"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            </form>
          )}
        </div>

        {/* Success Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-slate-600 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 max-w-md w-full">
              <h3 className="text-lg font-medium text-slate-800 mb-4">Book {editBookId ? 'Updated' : 'Created'}</h3>
              <p className="text-slate-600 mb-6">Your book has been successfully {editBookId ? 'updated' : 'created'}!</p>
              <button
                onClick={() => setShowModal(false)}
                className="w-full px-6 py-3 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-slate-600 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 max-w-md w-full">
              <h3 className="text-lg font-medium text-slate-800 mb-4">Confirm Delete</h3>
              <p className="text-slate-600 mb-6">
                Are you sure you want to delete "{books.find((b) => b.id === showDeleteModal)?.title}"? This action cannot be undone.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => handleDelete(showDeleteModal)}
                  className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center disabled:bg-red-400 disabled:cursor-not-allowed"
                  disabled={isSubmitting[showDeleteModal] === 'delete'}
                >
                  {isSubmitting[showDeleteModal] === 'delete' ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                      Deleting...
                    </>
                  ) : (
                    'Delete'
                  )}
                </button>
                <button
                  onClick={() => setShowDeleteModal(null)}
                  className="flex-1 px-6 py-3 bg-slate-600 text-white rounded-lg hover:bg-slate-500 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Books List */}
        <div className="space-y-8">
          {books.length > 0 ? (
            books.map((book) => (
              <div key={book.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-8">
                  <div className="flex flex-col sm:flex-row gap-6">
                    {book.cover_image && (
                      <div className="flex-shrink-0">
                        <img
                          src={baseURL + book.cover_image}
                          alt={book.title}
                          className="w-full sm:w-48 rounded-lg object-contain"
                        />
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="text-xl font-medium text-slate-800 mb-2">{book.title}</h3>
                      <p className="text-sm text-slate-500 mb-1">Author(s): {book.authors}</p>
                      <p className="text-sm text-slate-500 mb-1">Genre: {book.genre}</p>
                      <p className="text-sm text-slate-500 mb-2">
                        Published: {new Date(book.publication_date).toLocaleDateString()}
                      </p>
                      {book.description && (
                        <p className="text-sm text-slate-600 mb-4">{book.description}</p>
                      )}
                      <div className="flex flex-col sm:flex-row gap-2">
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
                          onClick={() => handleEdit(book)}
                          className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors disabled:opacity-50"
                          disabled={isSubmitting[book.id]}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setShowDeleteModal(book.id)}
                          className="px-3 py-1.5 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
                          disabled={isSubmitting[book.id] === 'delete'}
                        >
                          {isSubmitting[book.id] === 'delete' ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <p className="text-slate-400 text-lg">No books created yet. Create your first one above!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyBooks;