from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from .serializers import *
import logging
from django.db import transaction
from datetime import datetime
from django.db import models, IntegrityError
from django.db.models import Q
from django.http import HttpResponse, Http404
import os


logger = logging.getLogger(__name__)

class BookListView(APIView):
    permission_classes = [AllowAny]
    
    def get(self, request):
        logger.info(f"Fetching book list with search query: {request.query_params.get('search', '')}")
        search_query = request.query_params.get('search', '')
        books = Book.objects.all()
        
        if search_query:
            books = books.filter(
                Q(title__icontains=search_query) |
                Q(authors__icontains=search_query) |
                Q(genre__icontains=search_query)
            )
        
        serializer = BookSerializer(books, many=True)
        logger.debug(f"Returning {len(serializer.data)} books")
        return Response(serializer.data)

    def post(self, request):
        if not request.user.is_authenticated:
            logger.warning("Unauthorized attempt to create book")
            return Response({'detail': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)
        logger.info(f"User {request.user} attempting to create new book")
        serializer = BookSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            logger.info(f"Book created successfully: {serializer.data.get('title')}")
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        logger.error(f"Book creation failed: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class MyBooksView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        logger.info(f"Fetching books for user {request.user}")
        books = Book.objects.filter(created_by=request.user)
        serializer = BookSerializer(books, many=True)
        logger.debug(f"Returning {len(serializer.data)} books for user {request.user}")
        return Response(serializer.data)

class BookDetailView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request, pk):
        logger.info(f"Fetching book details for book ID {pk}")
        try:
            book = Book.objects.get(pk=pk)
            serializer = BookSerializer(book)
            logger.debug(f"Book details retrieved: {book.title}")
            return Response(serializer.data)
        except Book.DoesNotExist:
            logger.error(f"Book not found: ID {pk}")
            return Response({'detail': 'Book not found'}, status=status.HTTP_404_NOT_FOUND)
    
    def put(self, request, pk):
        logger.info(f"User {request.user} attempting to update book ID {pk}")
        try:
            book = Book.objects.get(pk=pk)
            if book.created_by != request.user:
                logger.warning(f"Unauthorized update attempt by {request.user} on book ID {pk}")
                return Response({'detail': 'Not authorized to edit this book'}, status=status.HTTP_403_FORBIDDEN)
            serializer = BookSerializer(book, data=request.data, context={'request': request}, partial=True)
            if serializer.is_valid():
                serializer.save()
                logger.info(f"Book updated successfully: {book.title}")
                return Response(serializer.data)
            logger.error(f"Book update failed: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Book.DoesNotExist:
            logger.error(f"Book not found for update: ID {pk}")
            return Response({'detail': 'Book not found'}, status=status.HTTP_404_NOT_FOUND)
    
    def delete(self, request, pk):
        logger.info(f"User {request.user} attempting to delete book ID {pk}")
        try:
            book = Book.objects.get(pk=pk)
            if book.created_by != request.user:
                logger.warning(f"Unauthorized delete attempt by {request.user} on book ID {pk}")
                return Response({'detail': 'Not authorized to delete this book'}, status=status.HTTP_403_FORBIDDEN)
            book.delete()
            logger.info(f"Book deleted successfully: ID {pk}")
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Book.DoesNotExist:
            logger.error(f"Book not found for deletion: ID {pk}")
            return Response({'detail': 'Book not found'}, status=status.HTTP_404_NOT_FOUND)

class BookPDFView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request, pk):
        logger.info(f"User {request.user} requesting PDF for book ID {pk}")
        try:
            book = Book.objects.get(pk=pk)
            if not book.pdf_file:
                logger.warning(f"No PDF file available for book ID {pk}")
                return Response({'detail': 'PDF file not available'}, status=status.HTTP_404_NOT_FOUND)
            
            if not os.path.exists(book.pdf_file.path):
                logger.error(f"PDF file not found on server for book ID {pk}")
                return Response({'detail': 'PDF file not found'}, status=status.HTTP_404_NOT_FOUND)
            
            with open(book.pdf_file.path, 'rb') as pdf_file:
                response = HttpResponse(pdf_file.read(), content_type='application/pdf')
                response['Content-Disposition'] = f'inline; filename="{book.title}.pdf"'
                logger.info(f"PDF served successfully for book: {book.title}")
                return response
                
        except Book.DoesNotExist:
            logger.error(f"Book not found for PDF request: ID {pk}")
            return Response({'detail': 'Book not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.exception(f"Error serving PDF for book ID {pk}: {str(e)}")
            return Response({'detail': 'Error serving PDF file'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class ReadingListView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        logger.info(f"Fetching reading lists for user {request.user}")
        reading_lists = ReadingList.objects.filter(user=request.user)
        serializer = ReadingListSerializer(reading_lists, many=True)
        logger.debug(f"Returning {len(serializer.data)} reading lists")
        return Response(serializer.data)

    def post(self, request):
        logger.info(f"User {request.user} creating new reading list")
        serializer = ReadingListSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            logger.info(f"Reading list created successfully")
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        logger.error(f"Reading list creation failed: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ReadingListDetailView(APIView):
    permission_classes = [IsAuthenticated]
    
    def put(self, request, pk):
        logger.info(f"User {request.user} updating reading list ID {pk}")
        try:
            reading_list = ReadingList.objects.get(pk=pk, user=request.user)
            serializer = ReadingListSerializer(reading_list, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                logger.info(f"Reading list updated successfully: ID {pk}")
                return Response(serializer.data)
            logger.error(f"Reading list update failed: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except ReadingList.DoesNotExist:
            logger.error(f"Reading list not found: ID {pk}")
            return Response({'detail': 'Reading list not found'}, status=status.HTTP_404_NOT_FOUND)

    def delete(self, request, pk):
        logger.info(f"User {request.user} deleting reading list ID {pk}")
        try:
            reading_list = ReadingList.objects.get(pk=pk, user=request.user)
            reading_list.delete()
            logger.info(f"Reading list deleted successfully: ID {pk}")
            return Response(status=status.HTTP_204_NO_CONTENT)
        except ReadingList.DoesNotExist:
            logger.error(f"Reading list not found for deletion: ID {pk}")
            return Response({'detail': 'Reading list not found'}, status=status.HTTP_404_NOT_FOUND)

class ReadingListAddBookView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request, pk):
        logger.info(f"User {request.user} adding book to reading list ID {pk}")
        try:
            reading_list = ReadingList.objects.get(pk=pk, user=request.user)
            book_id = request.data.get('book_id')
            book = Book.objects.get(pk=book_id)
            max_order = reading_list.reading_list_books.aggregate(models.Max('order'))['order__max'] or 0
            ReadingListBook.objects.create(
                reading_list=reading_list,
                book=book,
                order=max_order + 1
            )
            logger.info(f"Book ID {book_id} added to reading list ID {pk}")
            return Response(ReadingListSerializer(reading_list).data)
        except ReadingList.DoesNotExist:
            logger.error(f"Reading list not found: ID {pk}")
            return Response({'detail': 'Reading list not found'}, status=status.HTTP_404_NOT_FOUND)
        except Book.DoesNotExist:
            logger.error(f"Book not found: ID {book_id}")
            return Response({'detail': 'Book not found'}, status=status.HTTP_404_NOT_FOUND)
        except IntegrityError:
            logger.warning(f"Book ID {book_id} already in reading list ID {pk}")
            return Response({'detail': 'Book already in reading list'}, status=status.HTTP_400_BAD_REQUEST)

class ReadingListRemoveBookView(APIView):
    permission_classes = [IsAuthenticated]
    
    def delete(self, request, list_id, book_id):
        logger.info(f"User {request.user} removing book ID {book_id} from reading list ID {list_id}")
        try:
            reading_list = ReadingList.objects.get(pk=list_id, user=request.user)
            reading_list_book = reading_list.reading_list_books.get(book=book_id)
            reading_list_book.delete()
            for index, item in enumerate(reading_list.reading_list_books.order_by('order')):
                item.order = index + 1
                item.save()
            logger.info(f"Book ID {book_id} removed from reading list ID {list_id}")
            return Response(ReadingListSerializer(reading_list).data)
        except ReadingList.DoesNotExist:
            logger.error(f"Reading list not found: ID {list_id}")
            return Response({'detail': 'Reading list not found'}, status=status.HTTP_404_NOT_FOUND)
        except ReadingListBook.DoesNotExist:
            logger.error(f"Book ID {book_id} not in reading list ID {list_id}")
            return Response({'detail': 'Book not in reading list'}, status=status.HTTP_404_NOT_FOUND)

class ReadingListReorderBooksView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request, pk):
        logger.info(f"User {request.user} reordering books in reading list ID {pk}")
        try:
            reading_list = ReadingList.objects.get(pk=pk, user=request.user)
            book_orders = request.data.get('book_orders', [])
            with transaction.atomic():
                for item in book_orders:
                    reading_list_book = reading_list.reading_list_books.get(book=item['book_id'])
                    reading_list_book.order = item['order']
                    reading_list_book.save()
            logger.info(f"Books reordered successfully in reading list ID {pk}")
            return Response(ReadingListSerializer(reading_list).data)
        except ReadingList.DoesNotExist:
            logger.error(f"Reading list not found: ID {pk}")
            return Response({'detail': 'Reading list not found'}, status=status.HTTP_404_NOT_FOUND)
        except ReadingListBook.DoesNotExist:
            logger.error(f"Book not found in reading list ID {pk}")
            return Response({'detail': 'Book not in reading list'}, status=status.HTTP_404_NOT_FOUND)

class ReadingListMarkCompletedView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request, list_id, book_id):
        logger.info(f"User {request.user} marking book ID {book_id} as completed in reading list ID {list_id}")
        try:
            reading_list = ReadingList.objects.get(pk=list_id, user=request.user)
            reading_list_book = reading_list.reading_list_books.get(book=book_id)
            reading_list_book.is_completed = True
            reading_list_book.completed_at = datetime.now()
            reading_list_book.save()
            for index, item in enumerate(
                reading_list.reading_list_books.filter(is_completed=False).order_by('order')
            ):
                item.order = index + 1
                item.save()
            logger.info(f"Book ID {book_id} marked as completed in reading list ID {list_id}")
            return Response(ReadingListSerializer(reading_list).data)
        except ReadingList.DoesNotExist:
            logger.error(f"Reading list not found: ID {list_id}")
            return Response({'detail': 'Reading list not found'}, status=status.HTTP_404_NOT_FOUND)
        except ReadingListBook.DoesNotExist:
            logger.error(f"Book ID {book_id} not in reading list ID {list_id}")
            return Response({'detail': 'Book not in reading list'}, status=status.HTTP_404_NOT_FOUND)