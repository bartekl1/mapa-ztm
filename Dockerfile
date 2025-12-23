FROM python:3.14-slim
ENV GUNICORN_WORKERS=1
RUN pip install poetry
WORKDIR /app
COPY . .
RUN poetry install
RUN poetry add gunicorn
EXPOSE 8080
CMD poetry run gunicorn --bind 0.0.0.0:8080 --workers ${GUNICORN_WORKERS} "app:create_app()"
