from django.urls import path
from .views import *

urlpatterns = [
    path('books/', BookListView.as_view(), name='book_list'),
    path('books/my-books/', MyBooksView.as_view(), name='my_books'),
    path('books/<int:pk>/', BookDetailView.as_view(), name='book_detail'),
    path('books/<int:pk>/pdf/', BookPDFView.as_view(), name='book_pdf'),
    path('reading-lists/', ReadingListView.as_view(), name='reading_list'),
    path('reading-lists/<int:pk>/', ReadingListDetailView.as_view(), name='reading_list_detail'),
    path('reading-lists/<int:pk>/add-book/', ReadingListAddBookView.as_view(), name='reading_list_add_book'),
    path('reading-lists/<int:list_id>/remove-book/<int:book_id>/', ReadingListRemoveBookView.as_view(), name='reading_list_remove_book'),
    path('reading-lists/<int:pk>/reorder-books/', ReadingListReorderBooksView.as_view(), name='reading_list_reorder_books'),
    path('reading-lists/<int:list_id>/mark-completed/<int:book_id>/', ReadingListMarkCompletedView.as_view(), name='reading_list_mark_completed'),
]