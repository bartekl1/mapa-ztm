# 🏗️ Ręczne budowanie obrazu Docker

## Wymagania

- [Docker](https://docs.docker.com/engine/install/)
- [Node.js 20.19+](https://nodejs.org/en/download/)
- [Git](https://git-scm.com/)

## Instrukcje budowania

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

6. Zbuduj obraz Docker
```bash
docker build -t mapa-ztm .
```

> [!NOTE]
> `mapa-ztm` to nazwa obrazu Docker. Możesz ją zmienić według własnych potrzeb.

7. Kontener można uruchomić zgodnie z instrukcjami [instalacji na Dockerze](docker_intall.md). Należy jednak zmienić nazwę obrazu w pliku `docker-compose.yml` (krok 2-3).
