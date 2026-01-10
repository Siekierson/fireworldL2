# FireWorld

Aplikacja społecznościowa z funkcjami czatu, postów, wiadomości i AI asystenta.

## 🚀 Uruchomienie

### Docker Compose

```bash
# 1. Utwórz .env.local z 5 zmiennymi (patrz .env.local.example)
# 2. Uruchom:
docker compose up -d --build
# 3. Otwórz: http://localhost:3000
```

### Lokalnie (bez Dockera)

```bash
# 1. Utwórz .env.local
# 2. Zainstaluj zależności:
npm install && cd backend && npm install && cd ..
# 3. Uruchom backend:
cd backend && npm run dev
# 4. W nowym terminalu - frontend:
npm run dev
# 5. Otwórz: http://localhost:3000
```

## 📋 Wymagane zmienne środowiskowe (.env.local)

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_NEWS_API_KEY=your_news_api_key
JWT_SECRET=your_jwt_secret_key_minimum_32_chars
OPENAI_API_KEY=your_openai_api_key
```

## 🛠 Technologie

- **Frontend**: Next.js 15, React 18, TypeScript, Tailwind CSS
- **Backend**: Express.js, Node.js
- **Database**: Supabase (cloud)
- **Cache**: Redis (opcjonalnie)
- **AI**: OpenAI API

## 📦 Struktura projektu

```
fireworldL2/
├── backend/          # Backend Express.js
├── src/              # Frontend Next.js (App Router)
├── public/           # Pliki statyczne
└── docker-compose.yml # Konfiguracja Docker
```
