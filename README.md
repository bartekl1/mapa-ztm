# 🚊🚌🗺️ Mapa pojazdów ZTM Poznań

🇵🇱 Polski
<!-- 🇵🇱 Polski | [🇬🇧 English](README.md) -->

> [!NOTE]
> English README and documentation are not yet available. \
> The application currently supports only Polish.

## ℹ️ O projekcie

Aplikacja webowa do śledzenia na żywo pojazdów komunikacji miejskiej w Poznaniu i okolicach. \
Wykorzystuje dane **GTFS Realtime** oraz **GTFS Schedule** udostępniane przez **Zarząd Transportu Miejskiego w Poznaniu**.

Wyświetlane są dane dotyczące pojazdów kursujących na terenie Poznania (transport realizowany przez Miejskie Przedsiębiorstwo Komunikacyjne w Poznaniu) oraz okolicznych gmin, które przesyłają dane do ZTM (m.in. Swarzędz, Luboń, Komorniki, Suchy Las).

## ✨ Funkcje

- Wyświetlanie pojazdów na mapie w czasie rzeczywistym
- Wyświetlanie szczegółów kursów i pojazdów (przebieg trasy, przystanki, itp.)
- Progresywna Aplikacja Webowa (PWA)

## 📆 Planowane funkcje

- Lokalizacje wszystkich przystanków
- Szczegóły przystanków (linie, najbliższe odjazdy)
- Lokalizacje punktów sprzedaży biletów
- Rozkłady jazdy dla dowolnych linii i przystanków
- Łatwe wyszukiwanie (linie, pojazdy, kursy i przystanki)
- Informacje o opóźnieniach i przewidywanym czasie przyjazdu
- Lepsze wsparcie offline (np. rozkłady jazdy)
- Poprawki błędów i ulepszenia UI/UX

## 📌 Status

Projekt ma charakter **hobbystyczny i edukacyjny**. \
Jest rozwijany w wolnym czasie i może zawierać błędy lub niekompletne funkcje. \
Prezentowane dane pochodzą z systemów zewnętrznych i mogą być niepełne, opóźnione, chwilowo nieaktualne lub chwilowo nieprawidłowe. \
Aplikacja jest w trakcie ciągłego rozwoju i ulepszania.

## ⚠️ Zastrzeżenie

Projekt oraz autor aplikacji **nie są w żaden sposób powiązani** z Zarządem Transportu Miejskiego w Poznaniu, Miejskim Przedsiębiorstwem Komunikacyjnym w Poznaniu ani innymi operatorami transportu publicznego.

Aplikacja korzysta wyłącznie z **publicznie dostępnych, otwartych danych** i **nie stanowi oficjalnego źródła informacji** o komunikacji miejskiej.

## 🛠️ Źródła danych i najważniejsze technologie

**Dane GTFS (Realtime i Schedule):** [API ZTM Poznań](https://www.ztm.poznan.pl/otwarte-dane/dla-deweloperow/) \
**Mapy:** [OpenStreetMap](https://www.openstreetmap.org/) \
**Frontend:** [Leaflet](https://leafletjs.com/), [Shoelace](https://shoelace.style/), [Vite](https://vite.dev/) \
**Backend:** [Flask](https://flask.palletsprojects.com/), [gtfs-realtime-bindings](https://github.com/MobilityData/gtfs-realtime-bindings)

## 🚀 Uruchomienie lokalne

> [!NOTE]
> Poniższe instrukcje są przeznaczone tylko do uruchomienia w celach testowych i deweloperskich. \
> Do uruchomienia produkcyjnego należy użyć odpowiedniego serwera i narzędzi. Szczegóły w dokumentacji.

1. Wymagania
    - [Python 3.9+](https://www.python.org/downloads/)
    - [Node.js 20.19+](https://nodejs.org/en/download/)
    - [Poetry](https://python-poetry.org/docs/#installation)
    - [Git](https://git-scm.com/)

2. Sklonuj repozytorium
```bash
git clone https://github.com/bartekl1/mapa-ztm.git
cd mapa-ztm
```

3. Zainstaluj zależności backendu
```bash
poetry install
```

4. Uruchom serwer backendu (Flask w trybie deweloperskim)
```bash
poetry run python app.py
```

5. W osobnym terminalu przejdź do plików frontendu
```bash
cd frontend
```

6. Zainstaluj zależności frontendu
```bash
npm install
```

7. Uruchom serwer frontendu (Vite w trybie deweloperskim)
```bash
npm run dev
```

8. Otwórz przeglądarkę i przejdź pod [http://localhost:5173](http://localhost:5173)

## 🏭 Uruchomienie produkcyjne

[🐳 Instalacja na Dockerze](docs/pl/docker_install.md) \
[🏗️ Ręczne budowanie obrazu Docker](docs/pl/docker_building.md) \
[📦 Instalacja natywna (bez Dockera)](docs/pl/native_install.md)

## 📜 Licencja

Projekt jest publikowany na licencji [GNU Affero General Public License v3.0](LICENSE).
