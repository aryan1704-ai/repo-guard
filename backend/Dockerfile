FROM python:3.12-slim

# Python settings
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Gitleaks version
ARG GITLEAKS_VERSION=8.30.1

# Application directory
WORKDIR /app

# Install system dependencies
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        git \
        curl \
        ca-certificates \
        tar \
    && rm -rf /var/lib/apt/lists/*

# Install Gitleaks
RUN curl -L \
    "https://github.com/gitleaks/gitleaks/releases/download/v${GITLEAKS_VERSION}/gitleaks_${GITLEAKS_VERSION}_linux_x64.tar.gz" \
    -o /tmp/gitleaks.tar.gz \
    && tar -xzf /tmp/gitleaks.tar.gz -C /usr/local/bin gitleaks \
    && chmod +x /usr/local/bin/gitleaks \
    && rm /tmp/gitleaks.tar.gz

# Copy Python dependencies
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Install Semgrep
RUN pip install --no-cache-dir semgrep

# Copy application
COPY app ./app

# Create non-root user
RUN useradd \
    --create-home \
    --shell /bin/bash \
    appuser

# Give application user access to application directory
RUN chown -R appuser:appuser /app

# Run as non-root user
USER appuser

# FastAPI port
EXPOSE 8000

# Start RepoGuard
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]