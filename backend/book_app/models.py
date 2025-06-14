from django.db import models
from auth_app.models import CustomUser

class Book(models.Model):
    title = models.CharField(max_length=200)
    authors = models.CharField(max_length=200)
    genre = models.CharField(max_length=100)
    publication_date = models.DateField()
    description = models.TextField(blank=True, null=True)
    cover_image = models.ImageField(upload_to='book_covers/', blank=True, null=True)
    pdf_file = models.FileField(upload_to='book_pdfs/', blank=True, null=True)  # New field for PDF
    created_by = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='books')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title

class ReadingList(models.Model):
    name = models.CharField(max_length=200)
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='reading_lists')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} by {self.user.email}"

class ReadingListBook(models.Model):
    reading_list = models.ForeignKey(ReadingList, on_delete=models.CASCADE, related_name='reading_list_books')
    book = models.ForeignKey(Book, on_delete=models.CASCADE, related_name='reading_list_books')
    order = models.PositiveIntegerField(default=0)
    is_completed = models.BooleanField(default=False)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ('reading_list', 'book')
        ordering = ['order']

    def __str__(self):
        return f"{self.book.title} in {self.reading_list.name}"