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
