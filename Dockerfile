ARG BASE_IMAGE=python:3.14
FROM ${BASE_IMAGE}
ARG UID=10001
ARG GID=10001
ENV GUNICORN_WORKERS=1
ENV TZ="Europe/Warsaw"
RUN addgroup --gid $GID appgroup \
    && adduser --uid $UID --ingroup appgroup appuser
RUN pip install poetry
WORKDIR /app
COPY pyproject.toml .
COPY poetry.lock .
COPY app.py .
COPY download_cache.py .
COPY modules modules
COPY frontend/dist frontend/dist
RUN mkdir cache
RUN poetry config virtualenvs.in-project true
RUN poetry install --extras="gunicorn"
RUN chown -R appuser:appgroup /app
USER appuser:appgroup
EXPOSE 8080
CMD poetry run gunicorn --bind 0.0.0.0:8080 --workers ${GUNICORN_WORKERS} "app:create_app()"
