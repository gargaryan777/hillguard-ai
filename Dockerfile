# Use lightweight Python 3.11 base image
FROM python:3.11-slim

# Install basic build tools (pip installs pre-compiled wheels for rasterio/numpy on most platforms)
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy requirements and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy all repository contents into Docker image
COPY . .

# Expose backend port
EXPOSE 8000

# Start FastAPI application
CMD ["uvicorn", "src.api.main:app", "--host", "0.0.0.0", "--port", "8000"]
