# ── HillGuard AI — FastAPI backend (Render / Railway / any Docker host) ──
FROM python:3.11-slim

# rasterio needs libgdal at runtime; build-essential for any source builds
RUN apt-get update && apt-get install -y --no-install-recommends \
        build-essential \
        libgdal-dev \
        gdal-bin \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python deps first (better layer caching)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the full app — model, DEM, geojson, backend code, src/
COPY . .

# Render injects PORT; default to 8000 for local / Railway
ENV PORT=8000
EXPOSE 8000

# uvicorn binds to $PORT so Render's health check reaches it
CMD ["sh", "-c", "uvicorn src.api.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
