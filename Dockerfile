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

WORKDIR /app

COPY --from=requirements /build/requirements.txt .
RUN pip install --no-cache-dir --upgrade --no-deps --requirement requirements.txt

COPY pyproject.toml .
COPY app app
COPY --from=frontend /build/frontend/dist frontend/dist

RUN mkdir cache

RUN addgroup --gid $GID appgroup && adduser --uid $UID --ingroup appgroup appuser
RUN chown -R appuser:appgroup /app
USER appuser:appgroup

EXPOSE 8000

CMD ["fastapi", "run"]
