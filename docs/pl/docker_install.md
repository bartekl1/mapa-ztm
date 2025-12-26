# 🐳 Instalacja na Dockerze

## Wymagania

- [Docker](https://docs.docker.com/engine/install/) (w tym Docker Compose)
- `cron` (do automatycznej aktualizacji danych GTFS)
- `wget` lub podobne narzędzie (np. `curl`) do pobrania pliku `docker-compose.yml`

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

3. (Opcjonalnie) Dostosuj plik `docker-compose.yml` do swoich potrzeb (np. zmiana portów).

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

5. Usuń katalog z plikami kontenera
