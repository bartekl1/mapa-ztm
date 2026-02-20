# 🐳 Instalacja na Dockerze

## Wymagania

- [Docker](https://docs.docker.com/engine/install/) (w tym Docker Compose)
- `cron` (do automatycznej aktualizacji danych GTFS)
- `wget` lub podobne narzędzie (np. `curl`) do pobrania pliku `docker-compose.yml`

## O obrazie

Dostępny jest obraz automatycznie budowany przez GitHub Actions i hostowany w GitHub Container Registry: [ghcr.io/bartekl1/mapa-ztm](https://ghcr.io/bartekl1/mapa-ztm).

Obraz jest dostępny w dwóch wariantach: standardowy `:latest` (oparty o `python:3.14`) oraz lżejszy `:slim` (oparty o `python:3.14-slim`). Oba zawierają tą samą wersję aplikacji, ale różnią się narzędziami systemowymi (np. obraz `:slim` nie zawiera `curl` który jest przydatny do health checków).

Obraz ma ustawioną strefę czasową na `Europe/Warsaw` co jest ważne dla poprawnego działania aktualizacji danych GTFS i nie powoduje problemów z działaniem aplikacji w innych strefach czasowych.

Obraz ma użytkownika `appuser` z UID 10001, który należy do grupy `appgroup` z GID 10001. Nie jest wymagana żadna dodatkowa konfiguracja, aby uruchamiać kontener w trybie bez uprawnień root.

Obie wersje obrazu są dostępne pod architektury `amd64` i `arm64`.

## Pliki Docker Compose

Pełny [`docker-compose.yml`](../../docker-compose.yml)

```yaml
services:
  mapaztm:
    image: ghcr.io/bartekl1/mapa-ztm:latest
    container_name: mapa-ztm
    restart: unless-stopped
    environment:
      GUNICORN_WORKERS: 4
    ports:
      - 127.0.0.1:8000:8080
    volumes:
      # - ./config.yaml:/app/config.yaml:ro
      - cache:/app/cache
      # - ./cache:/app/cache
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080"]
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 60s

volumes:
  cache:
```

Minimalny [`docker-compose-minimal.yml`](../../docker-compose-minimal.yml)

```yaml
services:
  mapaztm:
    image: ghcr.io/bartekl1/mapa-ztm:slim
    container_name: mapa-ztm
    restart: unless-stopped
    ports:
      - 8080:8080
```

## Instrukcje instalacji

1. Utwórz katalog na pliki kontenera

```bash
mkdir mapa-ztm
cd mapa-ztm
```

2. Pobierz plik [`docker-compose.yml`](https://github.com/bartekl1/mapa-ztm/blob/main/docker-compose.yml) z repozytorium

```bash
wget https://raw.githubusercontent.com/bartekl1/mapa-ztm/main/docker-compose.yml
```

Możesz również użyć prostszego wariantu [`docker-compose-minimal.yml`](https://github.com/bartekl1/mapa-ztm/blob/main/docker-compose-minimal.yml)

```bash
wget https://github.com/bartekl1/mapa-ztm/blob/main/docker-compose-minimal.yml -O docker-compose.yml
```

3. (Opcjonalnie) Dostosuj plik `docker-compose.yml` do swoich potrzeb (np. zmiana portów).

> [!WARNING]
> W przypadku użycia bind mount do katalogu `cache` (`./cache:/app/cache`) należy ręcznie utworzyć ten folder na hoście i ustawić odpowiedniego właściciela (`mkdir cache && sudo chown -R 10001:10001 cache`).

4. Uruchom kontener

```bash
docker compose up -d
```

> [!NOTE]
> Aplikacja przy starcie pobiera dane GTFS Schedule i zapisuje je do SQLite. \
> Pierwsze uruchomienie może chwilę potrwać (max. 3 minuty).

5. Skonfiguruj `cron` do automatycznego aktualizowania danych GTFS.

```bash
crontab -e
```

Dodaj poniższą linię:

```text
5 */6 * * * docker exec mapa-ztm poetry run python download_cache.py
```

> [!TIP]
> Ten wpis `cron` należy dodać na hoście, na którym działa Docker.

> [!NOTE]
> `mapa-ztm` to nazwa kontenera, w którym działa aplikacja. \
> Upewnij się, że używasz poprawnej nazwy, jeśli została zmieniona w pliku `docker-compose.yml`.

6. Aplikacja powinna być teraz dostępna pod adresem [http://localhost:8000](http://localhost:8000) (lub innym, jeśli zmieniłeś porty).

7. Zalecane jest, aby kontener Docker był dostępny wyłącznie z poziomu `localhost`. Do dostępu z zewnątrz zalecane jest użycie serwera reverse proxy (np. Nginx).

## Aktualizowanie aplikacji

1. Przejdź do katalogu z plikami kontenera

2. Pobierz nowy obraz, usuń stary kontener i uruchom ponownie

```bash
docker compose pull
docker compose down
docker compose up -d
```

## Usuwanie aplikacji

1. Przejdź do katalogu z plikami kontenera

2. Zatrzymaj i usuń kontener

```bash
docker compose down
```

3. Usuń wpis `cron`

4. Usuń obraz

```bash
docker rmi ghcr.io/bartekl1/mapa-ztm
```

> [!WARNING]
> Jeśli aplikacja była aktualizowana możliwe jest, że pobranych jest kilka wersji obrazów. Należy je usunąć ręcznie za pomocą `docker rmi <image_id>`.

5. Usuń named volume `cache` (jeśli był używany)

```bash
docker volume rm mapa-ztm_cache
```

6. Usuń katalog z plikami kontenera
