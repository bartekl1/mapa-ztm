ARG BASE_PYTHON_IMAGE=python:3.14-slim
ARG BASE_NODE_IMAGE=node:26


FROM ${BASE_PYTHON_IMAGE} AS requirements

RUN pip install --no-cache-dir --upgrade poetry
RUN pip install --no-cache-dir --upgrade poetry-plugin-export

WORKDIR /build

COPY pyproject.toml .
COPY poetry.lock .

RUN poetry install
RUN poetry export --format requirements.txt --output requirements.txt


FROM ${BASE_NODE_IMAGE} AS frontend

WORKDIR /build/frontend

COPY frontend/package.json .
COPY frontend/package-lock.json .

RUN npm ci

COPY pyproject.toml ..
COPY .git ../.git
COPY frontend .

RUN npm run build


FROM ${BASE_PYTHON_IMAGE} AS app

ARG UID=10001
ARG GID=10001

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1
ENV DEBIAN_FRONTEND=noninteractive

RUN addgroup --gid $GID appgroup && adduser --uid $UID --ingroup appgroup appuser

WORKDIR /app
RUN chown appuser:appgroup /app

RUN apt update && apt install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*

COPY --from=requirements --chown=appuser:appgroup /build/requirements.txt .
RUN pip install --no-cache-dir --upgrade --no-deps --requirement requirements.txt

COPY --chown=appuser:appgroup pyproject.toml .
COPY --chown=appuser:appgroup app app
COPY --from=frontend --chown=appuser:appgroup /build/frontend/dist frontend/dist

RUN mkdir cache && chown appuser:appgroup cache

USER appuser:appgroup

EXPOSE 8000

CMD ["fastapi", "run"]
