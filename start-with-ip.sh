#!/bin/bash
# Automatyczne uruchomienie aplikacji z wykrytym IP

# Wykryj IP
IP=$(ifconfig | grep 'inet ' | grep -v 127.0.0.1 | awk '{print $2}' | head -1)

if [ -z "$IP" ]; then
    echo "❌ Nie znaleziono IP. Uruchamiam z localhost..."
    export NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
else
    echo "📍 Wykryto IP: $IP"
    export NEXT_PUBLIC_BACKEND_URL=http://$IP:3001
    echo "✅ NEXT_PUBLIC_BACKEND_URL=$NEXT_PUBLIC_BACKEND_URL"
fi

echo ""
echo "🚀 Uruchamianie aplikacji..."
echo ""

# Uruchom frontend
npm run dev

