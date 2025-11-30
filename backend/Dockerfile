FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Create a non-root user
RUN addgroup --system app && adduser --system --group app

WORKDIR /app

# Install dependencies
COPY requirements.txt ./requirements.txt
RUN pip install --upgrade pip && pip install -r requirements.txt

# Copy project files
COPY . .

# Create entrypoint
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Chown the application directory
RUN chown -R app:app /app

# Switch to the non-root user
USER app

EXPOSE 8000

CMD ["/entrypoint.sh"]
