from rest_framework import serializers
from .models import Book, ReadingList, ReadingListBook

class BookSerializer(serializers.ModelSerializer):
    cover_image = serializers.ImageField(required=False)
    pdf_file = serializers.FileField(required=False)  # New field for PDF
    created_by = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = Book
        fields = ['id', 'title', 'authors', 'genre', 'publication_date', 'description', 'cover_image', 'pdf_file', 'created_by']

    def create(self, validated_data):
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)

    def validate_pdf_file(self, value):
        if value and not value.name.endswith('.pdf'):
            raise serializers.ValidationError("Only PDF files are allowed.")
        return value

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