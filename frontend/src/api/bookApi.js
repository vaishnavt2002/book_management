import axiosInstance from "./axiosInstance";

const bookApi = {
  getBooks: (searchQuery = '') => {
    const params = searchQuery ? { search: searchQuery } : {};
    return axiosInstance.get('books/', { params });
  },
  getBook: (id) => axiosInstance.get(`books/${id}/`),
  createBook: (data) => axiosInstance.post('books/', data),
  updateBook: (id, data) => axiosInstance.put(`books/${id}/`, data),
  deleteBook: (id) => axiosInstance.delete(`books/${id}/`),
  getBookPDF: (id) => axiosInstance.get(`books/${id}/pdf/`, { responseType: 'blob' }),
  getReadingLists: () => axiosInstance.get('reading-lists/'),
  createReadingList: (data) => axiosInstance.post('reading-lists/', data),
  updateReadingList: (id, data) => axiosInstance.put(`reading-lists/${id}/`, data),
  deleteReadingList: (id) => axiosInstance.delete(`reading-lists/${id}/`),
  addBookToList: (listId, bookId) => axiosInstance.post(`reading-lists/${listId}/add-book/`, { book_id: bookId }),
  removeBookFromList: (listId, bookId) =>
    axiosInstance.delete(`reading-lists/${listId}/remove-book/${bookId}/`),
  reorderBooks: (listId, bookOrders) =>
    axiosInstance.post(`reading-lists/${listId}/reorder-books/`, { book_orders: bookOrders }),
  markBookCompleted: (listId, bookId) =>
    axiosInstance.post(`reading-lists/${listId}/mark-completed/${bookId}/`),
};

export default bookApi;