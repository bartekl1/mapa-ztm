ARG BASE_IMAGE=python:3.14
FROM ${BASE_IMAGE}

ARG UID=10001
ARG GID=10001

ENV GUNICORN_WORKERS=1
ENV TZ="Europe/Warsaw"

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade -r requirements.txt

RUN addgroup --gid $GID appgroup \
    && adduser --uid $UID --ingroup appgroup appuser

COPY pyproject.toml .
COPY app.py .
COPY download_cache.py .
COPY modules modules
COPY frontend/dist frontend/dist

RUN mkdir cache

RUN chown -R appuser:appgroup /app

USER appuser:appgroup

EXPOSE 8080

CMD gunicorn --bind 0.0.0.0:8080 --workers ${GUNICORN_WORKERS} "app:create_app()"
