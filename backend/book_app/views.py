from rest_framework.views import APIView
from auth_app.serializers import *
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
        # Add search functionality
        search_query = request.query_params.get('search', '')
        books = Book.objects.all()
        
        if search_query:
            books = books.filter(
                Q(title__icontains=search_query) |
                Q(authors__icontains=search_query) |
                Q(genre__icontains=search_query)
            )
        
        serializer = BookSerializer(books, many=True)
        return Response(serializer.data)

    def post(self, request):
        if not request.user.is_authenticated:
            return Response({'detail': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)
        serializer = BookSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class BookDetailView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request, pk):
        try:
            book = Book.objects.get(pk=pk)
            serializer = BookSerializer(book)
            return Response(serializer.data)
        except Book.DoesNotExist:
            return Response({'detail': 'Book not found'}, status=status.HTTP_404_NOT_FOUND)
    
    def delete(self, request, pk):
        try:
            book = Book.objects.get(pk=pk)
            if book.created_by != request.user:
                return Response({'detail': 'Not authorized to delete this book'}, status=status.HTTP_403_FORBIDDEN)
            book.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Book.DoesNotExist:
            return Response({'detail': 'Book not found'}, status=status.HTTP_404_NOT_FOUND)

class BookPDFView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request, pk):
        try:
            book = Book.objects.get(pk=pk)
            if not book.pdf_file:
                return Response({'detail': 'PDF file not available'}, status=status.HTTP_404_NOT_FOUND)
            
            # Check if file exists
            if not os.path.exists(book.pdf_file.path):
                return Response({'detail': 'PDF file not found'}, status=status.HTTP_404_NOT_FOUND)
            
            # Return file response
            with open(book.pdf_file.path, 'rb') as pdf_file:
                response = HttpResponse(pdf_file.read(), content_type='application/pdf')
                response['Content-Disposition'] = f'inline; filename="{book.title}.pdf"'
                return response
                
        except Book.DoesNotExist:
            return Response({'detail': 'Book not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'detail': 'Error serving PDF file'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class ReadingListView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        reading_lists = ReadingList.objects.filter(user=request.user)
        serializer = ReadingListSerializer(reading_lists, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = ReadingListSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ReadingListDetailView(APIView):
    permission_classes = [IsAuthenticated]
    
    def put(self, request, pk):
        try:
            reading_list = ReadingList.objects.get(pk=pk, user=request.user)
            serializer = ReadingListSerializer(reading_list, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except ReadingList.DoesNotExist:
            return Response({'detail': 'Reading list not found'}, status=status.HTTP_404_NOT_FOUND)

    def delete(self, request, pk):
        try:
            reading_list = ReadingList.objects.get(pk=pk, user=request.user)
            reading_list.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except ReadingList.DoesNotExist:
            return Response({'detail': 'Reading list not found'}, status=status.HTTP_404_NOT_FOUND)

class ReadingListAddBookView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request, pk):
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
            return Response(ReadingListSerializer(reading_list).data)
        except ReadingList.DoesNotExist:
            return Response({'detail': 'Reading list not found'}, status=status.HTTP_404_NOT_FOUND)
        except Book.DoesNotExist:
            return Response({'detail': 'Book not found'}, status=status.HTTP_404_NOT_FOUND)
        except IntegrityError:
            return Response({'detail': 'Book already in reading list'}, status=status.HTTP_400_BAD_REQUEST)

class ReadingListRemoveBookView(APIView):
    permission_classes = [IsAuthenticated]
    
    def delete(self, request, list_id, book_id):
        try:
            reading_list = ReadingList.objects.get(pk=list_id, user=request.user)
            reading_list_book = reading_list.reading_list_books.get(book=book_id)
            reading_list_book.delete()
            # Reorder remaining books
            for index, item in enumerate(reading_list.reading_list_books.order_by('order')):
                item.order = index + 1
                item.save()
            return Response(ReadingListSerializer(reading_list).data)
        except ReadingList.DoesNotExist:
            return Response({'detail': 'Reading list not found'}, status=status.HTTP_404_NOT_FOUND)
        except ReadingListBook.DoesNotExist:
            return Response({'detail': 'Book not in reading list'}, status=status.HTTP_404_NOT_FOUND)

class ReadingListReorderBooksView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request, pk):
        try:
            reading_list = ReadingList.objects.get(pk=pk, user=request.user)
            book_orders = request.data.get('book_orders', [])  # List of {book_id, order}
            with transaction.atomic():
                for item in book_orders:
                    reading_list_book = reading_list.reading_list_books.get(book=item['book_id'])
                    reading_list_book.order = item['order']
                    reading_list_book.save()
            return Response(ReadingListSerializer(reading_list).data)
        except ReadingList.DoesNotExist:
            return Response({'detail': 'Reading list not found'}, status=status.HTTP_404_NOT_FOUND)
        except ReadingListBook.DoesNotExist:
            return Response({'detail': 'Book not in reading list'}, status=status.HTTP_404_NOT_FOUND)

class ReadingListMarkCompletedView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request, list_id, book_id):
        try:
            reading_list = ReadingList.objects.get(pk=list_id, user=request.user)
            reading_list_book = reading_list.reading_list_books.get(book=book_id)
            reading_list_book.is_completed = True
            reading_list_book.completed_at = datetime.now()
            reading_list_book.save()
            # Reorder remaining books
            for index, item in enumerate(
                reading_list.reading_list_books.filter(is_completed=False).order_by('order')
            ):
                item.order = index + 1
                item.save()
            return Response(ReadingListSerializer(reading_list).data)
        except ReadingList.DoesNotExist:
            return Response({'detail': 'Reading list not found'}, status=status.HTTP_404_NOT_FOUND)
        except ReadingListBook.DoesNotExist:
            return Response({'detail': 'Book not in reading list'}, status=status.HTTP_404_NOT_FOUND)