# Konfiguracja dla dostępu z innych urządzeń

## Problem

Aplikacja domyślnie używa `localhost`, co działa tylko na tym samym komputerze. Aby działała z innych urządzeń w sieci lokalnej, musisz:

## ✅ Rozwiązanie

### 1. Znajdź IP swojego komputera

**macOS/Linux:**
```bash
ifconfig | grep 'inet ' | grep -v 127.0.0.1 | awk '{print $2}' | head -1
```

**Windows:**
```bash
ipconfig | findstr IPv4
```

**Przykład:** `192.168.0.206`

### 2. Dodaj IP do `.env.local`

Edytuj plik `.env.local` i dodaj (lub zaktualizuj) `NEXT_PUBLIC_BACKEND_URL`:

```env
NEXT_PUBLIC_BACKEND_URL=http://192.168.0.206:3001
```

**Uwaga:** Zastąp `192.168.0.206` swoim prawdziwym IP!

### 3. Restart aplikacji

```bash
# Jeśli używasz Docker:
docker compose down
docker compose up -d --build

# Jeśli lokalnie:
# Zatrzymaj backend (Ctrl+C) i uruchom ponownie:
cd backend
npm run dev
```

### 4. Dostęp z innych urządzeń

Teraz możesz uzyskać dostęp do aplikacji z innych urządzeń w tej samej sieci:

- **Frontend:** http://192.168.0.206:3000
- **Backend:** http://192.168.0.206:3001/health

## 🔧 Automatyczne wykrywanie IP

### Opcja 1: Skrypt pomocniczy

**Sprawdź swoje aktualne IP:**
```bash
./get-local-ip.sh
```

**Uruchom aplikację z automatycznym wykryciem IP:**
```bash
./start-with-ip.sh
```

### Opcja 2: NPM script

**Użyj gotowego skryptu npm:**
```bash
npm run dev:network
```

To automatycznie wykryje Twoje IP i uruchomi frontend.

### Opcja 3: Ręczne wykrycie IP

**macOS/Linux:**
```bash
ifconfig | grep 'inet ' | grep -v 127.0.0.1 | awk '{print $2}' | head -1
```

**Windows:**
```bash
ipconfig | findstr IPv4
```

**Następnie dodaj do `.env.local`:**
```env
NEXT_PUBLIC_BACKEND_URL=http://ZNALEZIONE_IP:3001
```

### Opcja 4: Ustaw w terminalu przed uruchomieniem

```bash
export NEXT_PUBLIC_BACKEND_URL=http://$(ifconfig | grep 'inet ' | grep -v 127.0.0.1 | awk '{print $2}' | head -1):3001
npm run dev
```

## ⚠️ Uwagi

1. **Firewall:** Upewnij się, że porty 3000 i 3001 są otwarte w firewallu
2. **Zmiana IP:** Jeśli IP się zmieni (np. przy zmianie sieci), zaktualizuj `.env.local`
3. **Bezpieczeństwo:** To rozwiązanie działa tylko w sieci lokalnej

## 🐛 Troubleshooting

**Problem:** `ERR_CONNECTION_REFUSED`
- Sprawdź czy backend działa: `curl http://localhost:3001/health`
- Sprawdź czy backend nasłuchuje na `0.0.0.0` (zostało naprawione w `server.js`)

**Problem:** Nie można połączyć się z IP
- Sprawdź firewall: `sudo ufw status` (Linux)
- Sprawdź czy urządzenia są w tej samej sieci Wi-Fi/LAN

