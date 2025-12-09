import magic
from django.core.exceptions import ValidationError
from django.utils.deconstruct import deconstructible

@deconstructible
class FileTypeValidator:
    def __init__(self, allowed_mimetypes):
        self.allowed_mimetypes = allowed_mimetypes

    def __call__(self, file):
        try:
            # Read a small portion of the file to determine its MIME type
            mime_type = magic.from_buffer(file.read(2048), mime=True)
            file.seek(0)  # Reset file pointer to the beginning
            if mime_type not in self.allowed_mimetypes:
                raise ValidationError(f"File type '{mime_type}' is not supported.")
        except Exception as e:
            raise ValidationError(f"Could not determine file type. Error: {e}")

    def __eq__(self, other):
        return (
            isinstance(other, FileTypeValidator) and
            self.allowed_mimetypes == other.allowed_mimetypes
        )
