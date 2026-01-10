#!/bin/bash
# Automatyczne wykrywanie IP lokalnego komputera

IP=$(ifconfig | grep 'inet ' | grep -v 127.0.0.1 | awk '{print $2}' | head -1)

if [ -z "$IP" ]; then
    echo "❌ Nie znaleziono IP"
    exit 1
fi

echo "📍 Znalezione IP: $IP"
echo ""
echo "📝 Dodaj do .env.local:"
echo "NEXT_PUBLIC_BACKEND_URL=http://$IP:3001"
echo ""
echo "Lub użyj tego w terminalu przed uruchomieniem:"
echo "export NEXT_PUBLIC_BACKEND_URL=http://$IP:3001"

