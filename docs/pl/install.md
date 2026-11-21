# Instalacja

## Metoda 1 - Docker Compose

### Wymagania

[Docker](https://docs.docker.com/engine/install/) oraz Docker Compose

### Instalacja

1. Utwórz katalog na pliki kontenera

```bash
mkdir mapa-ztm
cd mapa-ztm
```

2. Pobierz plik [`docker-compose.yml`](https://github.com/bartekl1/mapa-ztm/blob/main/docker-compose.yml)

```bash
wget https://raw.githubusercontent.com/bartekl1/mapa-ztm/main/docker-compose.yml
```

3. (Opcjonalnie) Dostosuj konfigurację Docker Compose

4. Uruchom kontener

```bash
docker compose up -d
```

### Konfiguracja Docker Compose i możliwe modyfikacje

```yaml
services:
  mapaztm:
    image: ghcr.io/bartekl1/mapa-ztm:latest
    container_name: mapa-ztm
    restart: unless-stopped
    ports:
      - 127.0.0.1:8000:8000
    volumes:
      - cache:/app/cache
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000"]
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 60s

volumes:
  cache:
```

#### Użycie bind volume zamiast named volume

Aby użyć bind volume zamiast named volume należy zmienić konfigurację w następujący sposób:
```diff
  services:
    mapaztm:
      image: ghcr.io/bartekl1/mapa-ztm:latest
      container_name: mapa-ztm
      restart: unless-stopped
      ports:
        - 127.0.0.1:8000:8000
      volumes:
-        - cache:/app/cache
+        - ./cache:/app/cache
      healthcheck:
        test: ["CMD", "curl", "-f", "http://localhost:8000"]
        interval: 30s
        timeout: 5s
        retries: 3
        start_period: 60s

-  volumes:
-    cache:
```

Następnie należy utworzyć katalog wolumenu i nadać mu odpowiednie uprawnienia:
```bash
mkdir cache
sudo chown -R 10001:10001 cache
```

### Aktualizacja

Przejdź do katalogu z plikami kontenera i uruchom:

```bash
docker compose pull
docker compose down
docker compose up -d
```

### Usuwanie

Przejdź do katalogu z plikami kontenera i uruchom:

```bash
docker compose down
```

Po usunięciu kontenera można usunąć obraz:

```bash
docker rmi ghcr.io/bartekl1/mapa-ztm
```

Można usunąć też wolumen `cache`:

```bash
docker volume rm mapa-ztm_cache
```
Nazwa wolumenu może się różnić. Można ją sprawdzić za pomocą polecenia `docker volume ls`.

Po wykonaniu powyższych kroków można usunąć katalog z plikami kontenera.

### Budowanie obrazu

Aby samemu zbudować obraz Docker należy najpierw sklonować repozytorium:
```bash
git clone https://github.com/bartekl1/mapa-ztm.git
cd mapa-ztm
```

Następnie należy wykonać polecenie:
```bash
docker build -t mapa-ztm .
```

Obraz będzie gotowy pod nazwą `mapa-ztm`.

### Podman zamiast Dockera

Możliwe jest użycie Podmana zamiast Dockera. Aby to zrobić należy wykonać powyższe polecenia, ale zamiast polecenia `docker` należy użyć `podman`, a zamiast `docker compose` należy użyć `podman-compose`.

## Metoda 2 - usługa systemd

### Wymagania

- [Python 3.9+](https://www.python.org/downloads/)
- [Node.js 20.19+](https://nodejs.org/en/download/)
- [Poetry](https://python-poetry.org/docs/#installation)
- [Git](https://git-scm.com/)
- systemd

### Instalacja

1. Sklonuj repozytorium
```bash
git clone https://github.com/bartekl1/mapa-ztm.git
cd mapa-ztm
```

2. Przejdź do plików frontendu
```bash
cd frontend
```

3. Zainstaluj zależności frontendu
```bash
npm install
```

4. Zbuduj frontend
```bash
npm run build
```

5. Wróć do katalogu głównego projektu
```bash
cd ..
```

6. Zainstaluj zależności backendu
```bash
poetry install
```

7. Utwórz plik usługi systemd, np. `mapa-ztm.service`
```bash
sudo nano /etc/systemd/system/mapa-ztm.service
```

Wklej poniższą konfigurację:
```ini
[Unit]
Description=Mapa ZTM
After=network.target

[Service]
Type=simple
User=<username>
WorkingDirectory=<path_to_project_files>
ExecStart=/home/<username>/.local/bin/poetry run fastapi run
Restart=always

[Install]
WantedBy=multi-user.target
```

> [!NOTE]
> Zamień `<username>` na swoją nazwę użytkownika oraz `<path_to_project_files>` na pełną ścieżkę do katalogu z plikami projektu. \
> Upewnij się, że ścieżka do `poetry` jest poprawna (może się różnić w zależności od sposobu instalacji).

9. Uruchom i aktywuj usługę
```bash
sudo systemctl daemon-reload
sudo systemctl enable --now mapa-ztm
```

### Aktualizacja

1. Przejdź do katalogu z plikami projektu

2. Pobierz najnowsze zmiany z repozytorium
```bash
git pull
```

3. Zaktualizuj zależności backendu
```bash
poetry install
```

4. Przejdź do plików frontendu, zainstaluj zależności i zbuduj frontend ponownie
```bash
cd frontend
npm install
npm run build
```

5. Uruchom ponownie usługę systemd
```bash
sudo systemctl restart mapa-ztm
```

### Usuwanie

1. Zatrzymaj usługę systemd
```bash
sudo systemctl disable --now mapa-ztm
```

2. Usuń plik usługi
```bash
sudo rm /etc/systemd/system/mapa-ztm.service
```

3. Usuń katalog z plikami projektu

## Metoda 3 - uruchomienie deweloperskie

### Wymagania

- [Python 3.9+](https://www.python.org/downloads/)
- [Node.js 20.19+](https://nodejs.org/en/download/)
- [Poetry](https://python-poetry.org/docs/#installation)
- [Git](https://git-scm.com/)

### Uruchomienie

1. Sklonuj repozytorium
```bash
git clone https://github.com/bartekl1/mapa-ztm.git
cd mapa-ztm
```

2. Zainstaluj zależności backendu
```bash
poetry install
```

3. Uruchom serwer backendu (FastAPI w trybie deweloperskim)
```bash
poetry run fastapi dev
```

4. W osobnym terminalu przejdź do plików frontendu
```bash
cd frontend
```

5. Zainstaluj zależności frontendu
```bash
npm install
```

6. Uruchom serwer frontendu (Vite w trybie deweloperskim)
```bash
npm run dev
```

7. Otwórz przeglądarkę i przejdź pod [http://localhost:5173](http://localhost:5173)

## Reverse proxy

W środowisku produkcyjnym zalecane jest uruchomienie aplikacji z poziomu localhosta (brak dostępu z sieci) oraz użycie reverse proxy w celu dostępu z poziomu Internetu.

Przykładowa konfiguracja nginx dostępna jest w pliku [nginx.conf](../../nginx.conf).
