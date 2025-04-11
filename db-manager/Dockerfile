FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY db-manager/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy db cleaner script
COPY db-manager/db_cleaner.py .

# Run the script
CMD ["python", "db_cleaner.py"] 