from rest_framework import serializers
from .models import Book, ReadingList, ReadingListBook
from rest_framework import serializers
from django.core.validators import FileExtensionValidator
from django.utils import timezone
from datetime import date
import re
from .models import Book
from PIL import Image

class BookSerializer(serializers.ModelSerializer):
    cover_image = serializers.ImageField(
        required=False,
        validators=[FileExtensionValidator(allowed_extensions=['jpg', 'jpeg', 'png', 'gif', 'webp'])]
    )
    pdf_file = serializers.FileField(
        required=True,
        validators=[FileExtensionValidator(allowed_extensions=['pdf'])]
    )
    created_by = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = Book
        fields = ['id', 'title', 'authors', 'genre', 'publication_date', 'description', 'cover_image', 'pdf_file', 'created_by']

    def create(self, validated_data):
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)

    def validate_title(self, value):
        if len(value.strip()) < 2:
            raise serializers.ValidationError("Title must be at least 2 characters long.")
        return value.strip()

    def validate_authors(self, value):
        if len(value.strip()) < 2:
            raise serializers.ValidationError("Author name must be at least 2 characters long.")
        return value.strip()

    def validate_genre(self, value):
        value = value.strip()
        if len(value) < 2:
            raise serializers.ValidationError("Genre must be at least 2 characters long.")
        
        if not re.match(r'^[a-zA-Z\s\-]+$', value):
            raise serializers.ValidationError("Genre must contain only alphabets, spaces, and hyphens.")
        
        return value

    def validate_publication_date(self, value):
        today = date.today()
        if value > today:
            raise serializers.ValidationError("Publication date cannot be in the future.")
        return value

    def validate_cover_image(self, value):
        if value:
            if value.size > 5 * 1024 * 1024:
                raise serializers.ValidationError("Cover image size cannot exceed 5MB.")
            
            try:
                
                img = Image.open(value)
                img.verify()
            except Exception:
                raise serializers.ValidationError("Invalid image format. Please upload a valid image file.")
        
        return value

    def validate_pdf_file(self, value):
        if not value:
            raise serializers.ValidationError("PDF file is required.")
        
        if not value.name.lower().endswith('.pdf'):
            raise serializers.ValidationError("Only PDF files are allowed.")
        
        return value

    def validate_description(self, value):
        if value and len(value.strip()) > 2000:
            raise serializers.ValidationError("Description cannot exceed 2000 characters.")
        return value.strip() if value else value
    

class ReadingListBookSerializer(serializers.ModelSerializer):
    book = BookSerializer(read_only=True)
    book_id = serializers.PrimaryKeyRelatedField(queryset=Book.objects.all(), source='book', write_only=True)

    class Meta:
        model = ReadingListBook
        fields = ['book', 'book_id', 'order', 'is_completed', 'completed_at']

class ReadingListSerializer(serializers.ModelSerializer):
    reading_list_books = ReadingListBookSerializer(many=True, read_only=True)
    user = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = ReadingList
        fields = ['id', 'name', 'user', 'reading_list_books', 'created_at']

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)