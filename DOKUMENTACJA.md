# FireWorld - Dokumentacja Projektu

## 1. Opis Projektu

FireWorld to portal społecznościowy, który umożliwia użytkownikom dzielenie się postami, komentowanie ich, lajkowanie oraz komunikację między sobą. Aplikacja została zbudowana w technologii Next.js z wykorzystaniem React i Tailwind CSS.
Projekt wykorzystuje tylko Next.js i Tailwind CSS zgodnie z wymaganiami. Wszystkie komponenty zostały napisane od zera bez użycia gotowych komponentów UI. Aplikacja jest w pełni funkcjonalna i gotowa do użycia.
Aplikacja jest zahostowana na vercelu, live version: https://fireworld-l2.vercel.app
### Główne Funkcjonalności. 

Aplikacja oferuje następujące możliwości:
- Rejestracja i logowanie użytkowników
- Główny feed z automatycznym ładowaniem kolejnych postów (infinite scroll)
- Integracja z NewsAPI - wyświetlanie aktualnych wiadomości obok postów użytkowników
- Tworzenie, lajkowanie i komentowanie postów
- Edycja profilu użytkownika
- Czat między użytkownikami
- Chatbot AI wykorzystujący OpenAI
- Responsywny interfejs dostosowany do różnych urządzeń

---

## 2. Realizacja Wymagań

### Rejestracja i logowanie użytkowników

Zaimplementowano formularz rejestracji z walidacją - nazwa użytkownika musi mieć minimum 3 znaki, a hasło minimum 6 znaków. Formularz logowania pozwala na uwierzytelnienie istniejących użytkowników. W przypadku błędów wyświetlane są odpowiednie komunikaty. Sesja użytkownika jest przechowywana w przeglądarce.

Funkcjonalność znajduje się na stronie `/login`.

### Główny feed z infinite scrollem i integracją z NewsAPI

Feed automatycznie ładuje kolejne posty podczas przewijania strony w dół. Wyświetlane są zarówno posty użytkowników, jak i aktualne wiadomości pobierane z NewsAPI. Posty i wiadomości są mieszane ze sobą w jednym feedzie. Na każdą stronę ładuje się po 5 postów i 5 wiadomości.

Funkcjonalność znajduje się na stronie głównej `/`.

### Możliwość pisania, lajkowania i komentowania postów

Użytkownicy mogą tworzyć nowe posty poprzez formularz z limitem 500 znaków. Licznik znaków pokazuje aktualną liczbę w czasie rzeczywistym. Po utworzeniu posta feed automatycznie się odświeża.

Każdy post można polubić - przycisk like/unlike pozwala na dodanie lub usunięcie lajka. Licznik pokazuje aktualną liczbę polubień. Można cofnąć lajk poprzez ponowne kliknięcie.

Pod każdym postem znajduje się sekcja komentarzy. Użytkownicy mogą dodawać komentarze, które są wyświetlane wraz z informacjami o autorze. Komentarze również można lajkować.

Funkcjonalności znajdują się w komponentach `CreatePost`, `PostCard` oraz `Comments`.

### Edycja profilu użytkownika

Na stronie profilu użytkownik może zobaczyć swoje dane - nazwę i zdjęcie profilowe. Dostępny jest formularz do edycji nazwy użytkownika oraz możliwość zmiany zdjęcia profilowego. Na profilu wyświetlana jest również lista wszystkich postów użytkownika. Formularz posiada walidację danych.

Funkcjonalność znajduje się na stronie `/profile`.

### Czat między użytkownikami

Aplikacja umożliwia komunikację między użytkownikami. Dostępna jest lista wszystkich użytkowników, z którymi można rozpocząć konwersację. Okno czatu wyświetla historię wiadomości. Wiadomości są wysyłane w czasie rzeczywistym i automatycznie pojawiają się u odbiorcy. Okno czatu automatycznie przewija się do najnowszych wiadomości.

Funkcjonalność znajduje się na stronach `/messages` dla czatu z konkretnym użytkownikiem.

### Panel z chatbotem AI

W panelu bocznym dostępny jest chatbot wykorzystujący OpenAI API. Użytkownik może wysyłać wiadomości do AI i otrzymywać odpowiedzi. Historia konwersacji jest zapisywana w czasie sesji. Podczas oczekiwania na odpowiedź wyświetlany jest wskaźnik ładowania.

Panel jest widoczny na desktopie, na urządzeniach mobilnych ukryty, do otwracia przyciskiem.

Funkcjonalność znajduje się w komponencie `ChatAssistant`.

### Dynamiczny routing między stronami

Aplikacja wykorzystuje dynamiczny routing Next.js. Dostępne są następujące strony:
- Strona główna `/` - feed z postami
- `/login` - logowanie i rejestracja
- `/profile` - profil użytkownika
- `/messages` - lista konwersacji
- `/messages/[userId]` - czat z konkretnym użytkownikiem (dynamiczny routing)

Aplikacja automatycznie przekierowuje użytkownika po wykonaniu akcji, np. po zalogowaniu przekierowuje na stronę główną.

### Responsywny interfejs (RWD)

Wszystkie komponenty i strony są responsywne i dostosowują się do rozmiaru ekranu. Menu nawigacyjne jest ukryte na telefonie i widoczne na komputerze. Na urządzeniach mobilnych dostępne jest hamburger menu. Panel AI jest ukryty na telefonie, a widoczny na komputerze. Formularze i karty postów są dostosowane do rozmiaru ekranu. Tekst i elementy są skalowane dla różnych urządzeń.

Wykorzystano Tailwind CSS z breakpointami (sm, md, lg, xl) do obsługi różnych rozmiarów ekranów.

### Formularze z walidacją danych

Wszystkie formularze w aplikacji posiadają walidację danych:

**Rejestracja/Logowanie:** Sprawdzana jest długość nazwy (minimum 3 znaki) i hasła (minimum 6 znaków). Formularz sprawdza czy pola nie są puste i wyświetla odpowiednie komunikaty błędów.

**Tworzenie Posta:** Formularz ma limit 500 znaków z licznikiem pokazującym aktualną liczbę w czasie rzeczywistym. Nie można wysłać pustego posta.

**Dodawanie Komentarza:** Komentarz nie może być pusty, wyświetlane są odpowiednie komunikaty błędów.

**Edycja Profilu:** Walidowana jest nazwa użytkownika i sprawdzane są wymagane pola.

Wszystkie formularze mają walidację po stronie klienta przed wysłaniem danych do serwera.

---

## 3. Użyte Technologie

### Frontend
- Next.js 15 - framework React z wbudowanym routingiem
- React 18 - biblioteka do budowy interfejsu użytkownika
- Tailwind CSS - framework CSS wykorzystujący tylko utility classes, bez gotowych komponentów
- TypeScript - typowanie kodu dla większej niezawodności  niz czysty JS

### Backend/API
- Next.js API Routes - endpointy backendowe zintegrowane z aplikacją
- Supabase - baza danych przechowująca użytkowników, posty, komentarze i wiadomości
- OpenAI API - integracja z chatbotem AI
- NewsAPI - pobieranie aktualnych wiadomości do wyświetlenia w feedzie

### Zgodność z wymaganiami
Projekt wykorzystuje tylko Next.js i Tailwind CSS zgodnie z wymaganiami zadania. Wszystkie komponenty zostały napisane od zera używając wyłącznie Tailwind utility classes - nie użyto żadnych gotowych komponentów UI. Wszystkie wymagane funkcjonalności zostały zaimplementowane.

---

## 4. Struktura Projektu

### Główne Komponenty

- Feed - główny feed z postami i wiadomościami, obsługuje infinite scroll
- PostCard - wyświetlanie pojedynczego posta z możliwością lajkowania i komentowania
- CreatePost - formularz do tworzenia nowych postów
- NewsCard - wyświetlanie wiadomości pobranych z NewsAPI
- Sidebar - menu nawigacyjne z responsywnym zachowaniem
- ChatAssistant - panel z chatbotem AI
- Comments - zestaw komponentów do komentowania (AddComment, CommentList, CommentItem)

### Główne Strony

- `/` - strona główna z feedem postów i wiadomości
- `/login` - strona logowania i rejestracji użytkowników
- `/profile` - strona profilu użytkownika z możliwością edycji
- `/messages` - strona z czatem między użytkownikami

### API Endpoints

- `/api/auth` - endpoint do rejestracji i logowania użytkowników
- `/api/posts` - endpoint do tworzenia i pobierania postów
- `/api/activity` - endpoint do lajkowania i komentowania
- `/api/messages` - endpoint do obsługi wiadomości między użytkownikami
- `/api/chat` - endpoint do komunikacji z chatbotem AI (OpenAI)
- `/api/users` - endpoint do pobierania danych użytkowników

---

## 5. Instrukcja Uruchomienia Lokalnego

### Wymagania wstępne

Aby uruchomić projekt lokalnie, potrzebne są:
- Node.js (wersja 18 lub nowsza)
- npm lub yarn

### Krok 1: Klonowanie i instalacja zależności

Najpierw sklonuj repozytorium projektu (jeśli jeszcze tego nie zrobiłeś) i przejdź do katalogu projektu:

```bash
cd fireworldCOPY
```

Zainstaluj wszystkie wymagane zależności:

```bash
npm install
```

### Krok 2: Konfiguracja zmiennych środowiskowych

Utwórz plik `.env.local` w głównym katalogu projektu i dodaj następujące zmienne:

NEXT_PUBLIC_SUPABASE_URL=https://qmzuqzuzjrnviflqgzjx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFtenVxenV6anJudmlmbHFnemp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3MzU4MDQsImV4cCI6MjA3OTMxMTgwNH0.lF6VvWNujZnT_qElX5P9TbTpF3lG6vcNqDpVA1Avf44
NEXT_PUBLIC_NEWS_API_KEY=iXq7d0CUYAxu75Sdy4ECXpBNOqNM72VzTSfMMqEL
JWT_SECRET=l5pxCj42crf9l/PYfWgeSDUPCg5IjvTm+APMQq7WqRViHr//kabHIoQyEXWoElmLwrodruRhKF2UfalpjmHdvw==
OPENAI_API_KEY=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



### Krok 3: Uruchomienie serwera deweloperskiego

Po skonfigurowaniu zmiennych środowiskowych uruchom serwer:

```bash
npm run dev
```

Aplikacja będzie dostępna pod adresem: `http://localhost:3000`

### Krok 4: Uruchomienie testów (opcjonalnie)

Aby uruchomić testy:

```bash
npm test
```

### Krok 5: Budowanie aplikacji produkcyjnej (opcjonalnie)

Aby zbudować aplikację do produkcji:

```bash
npm run build
```

Aby uruchomić zbudowaną aplikację:

```bash
npm start
```





