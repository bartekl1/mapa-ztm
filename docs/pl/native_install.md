# 📦 Instalacja natywna (bez Dockera)

## Wymagania

- [Python 3.9+](https://www.python.org/downloads/)
- [Node.js 20.19+](https://nodejs.org/en/download/)
- [Poetry](https://python-poetry.org/docs/#installation)
- [Git](https://git-scm.com/)
- systemd (do uruchomienia aplikacji jako usługi)

## Instrukcje instalacji

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

6. Zainstaluj zależności backendu oraz Gunicorn do uruchomienia serwera produkcyjnego
```bash
poetry install --extras="gunicorn"
```

7. Utwórz plik usługi systemd, np. `mapa-ztm.service`
```bash
sudo nano /etc/systemd/system/mapa-ztm.service
```

Wklej poniższą konfigurację:
```ini
[Unit]
Description=Mapa pojazdów ZTM Poznań
After=network.target

[Service]
Type=simple
User=<username>
WorkingDirectory=<path_to_project_files>
ExecStart=/home/<username>/.local/bin/poetry run gunicorn --bind 127.0.0.1:8080 --workers 4 "app:create_app()"
Restart=always

[Install]
WantedBy=multi-user.target
```

> [!NOTE]
> Zamień `<username>` na swoją nazwę użytkownika oraz `<path_to_project_files>` na pełną ścieżkę do katalogu z plikami projektu. \
> Upewnij się, że ścieżka do `poetry` jest poprawna (może się różnić w zależności od sposobu instalacji). \
> Możesz dostosować liczbę workerów przez zmianę wartości `--workers`. \
> Możesz również zmienić wartość `--bind` na inną, jeśli chcesz, aby aplikacja była dostępna na innym porcie lub interfejsie. Zalecane jest, aby aplikacja była dostępna wyłącznie z poziomu `localhost` i użycie serwera reverse proxy (np. Nginx) do dostępu z zewnątrz.

9. Uruchom i aktywuj usługę
```bash
sudo systemctl daemon-reload
sudo systemctl start mapa-ztm
sudo systemctl enable mapa-ztm
```

10. Skonfiguruj `cron` do automatycznego aktualizowania danych GTFS.
```bash
crontab -e
```
Dodaj poniższą linię:
```text
5 */6 * * * cd <path_to_project_files> && /home/<username>/.local/bin/poetry run python <path_to_project_files>/download_cache.py
```

> [!NOTE]
> Zamień `<username>` na swoją nazwę użytkownika oraz `<path_to_project_files>` na pełną ścieżkę do katalogu z plikami projektu. \
> Upewnij się, że ścieżka do `poetry` jest poprawna (może się różnić w zależności od sposobu instalacji).

## Aktualizowanie aplikacji

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

## Usuwanie aplikacji

1. Zatrzymaj usługę systemd
```bash
sudo systemctl stop mapa-ztm
sudo systemctl disable mapa-ztm
```

2. Usuń plik usługi
```bash
sudo rm /etc/systemd/system/mapa-ztm.service
sudo systemctl daemon-reload
```

3. Usuń wpis `cron`

4. Usuń katalog z plikami projektu
