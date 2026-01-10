#!/bin/bash
# Automatyczna konfiguracja .env.local na GCP

echo "🔍 Wykrywanie External IP na GCP..."

EXTERNAL_IP=$(curl -s -H "Metadata-Flavor: Google" http://169.254.169.254/computeMetadata/v1/instance/network-interfaces/0/access-configs/0/external-ip)

if [ -z "$EXTERNAL_IP" ]; then
    echo "❌ Nie można wykryć External IP. Użyj ręcznie:"
    echo "   curl -H \"Metadata-Flavor: Google\" http://169.254.169.254/computeMetadata/v1/instance/network-interfaces/0/access-configs/0/external-ip"
    exit 1
fi

echo "✅ Znalezione External IP: $EXTERNAL_IP"
echo ""

if [ ! -f ".env.local" ]; then
    echo "📝 Tworzenie .env.local..."
    touch .env.local
fi

if grep -q "NEXT_PUBLIC_BACKEND_URL" .env.local; then
    echo "⚠️  NEXT_PUBLIC_BACKEND_URL już istnieje. Aktualizowanie..."
    sed -i "s|NEXT_PUBLIC_BACKEND_URL=.*|NEXT_PUBLIC_BACKEND_URL=http://$EXTERNAL_IP:3001|g" .env.local
else
    echo "➕ Dodawanie NEXT_PUBLIC_BACKEND_URL do .env.local..."
    echo "NEXT_PUBLIC_BACKEND_URL=http://$EXTERNAL_IP:3001" >> .env.local
fi

echo ""
echo "✅ Zaktualizowano .env.local:"
echo "   NEXT_PUBLIC_BACKEND_URL=http://$EXTERNAL_IP:3001"
echo ""
echo "📋 Pamiętaj aby dodać pozostałe 5 zmiennych:"
echo "   - NEXT_PUBLIC_SUPABASE_URL"
echo "   - NEXT_PUBLIC_SUPABASE_ANON_KEY"
echo "   - NEXT_PUBLIC_NEWS_API_KEY"
echo "   - JWT_SECRET"
echo "   - OPENAI_API_KEY"
echo ""
echo "🔄 Po dodaniu wszystkich zmiennych, zrestartuj aplikację:"
echo "   docker compose down"
echo "   docker compose up -d --build"

