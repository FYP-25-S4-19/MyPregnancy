# -----------------------------------------------------------------
# STAGE 1: The "Builder"
# This stage installs build tools and compiles your dependencies
# -----------------------------------------------------------------
FROM python:3.13.9-slim AS builder

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    python3-dev \
    libffi-dev \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

RUN pip install uv
RUN uv venv venv
COPY pyproject.toml .

# Install your PRODUCTION dependencies into the venv
# This automatically reads [project.dependencies] from pyproject.toml
# It skips the [dev] dependencies, which you don't want in prod.
RUN . venv/bin/activate && uv pip install --no-cache-dir .

# -----------------------------------------------------------------
# STAGE 2: The "Final" Image
# This stage is slim and only contains what's needed to run the app
# -----------------------------------------------------------------
FROM python:3.13.9-slim

WORKDIR /app

# Install *only* runtime dependencies for Python packages
# (psycopg2-binary needs libpq-dev)
#
# Install make, which is needed to run migrations (and other scripts) in the Makefile
# Unconventional, but it's easier for me to manage than writing separate shell scripts
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev \
    make \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy the pre-built virtual environment from the builder stage
COPY --from=builder /app/venv /app/venv

COPY ./app /app/app
COPY ./migrations /app/migrations
COPY ./alembic.ini /app/
COPY ./Makefile /app/
COPY ./seed_data /app/seed_data
# COPY ./secrets /app/secrets

ENV PATH="/app/venv/bin:$PATH"

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
