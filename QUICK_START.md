# Szybki start - Wdrożenie FireWorld na GCP

## ✅ Krok 1: Instancja utworzona
- **Nazwa**: fireworld-vm
- **External IP**: 34.78.248.220
- **Zone**: europe-west1-b

## 🔥 Krok 2: Konfiguracja Firewall

W Cloud Shell wykonaj:

```bash
gcloud compute firewall-rules create allow-fireworld-ports \
  --allow tcp:3000,tcp:3001,tcp:22 \
  --source-ranges 0.0.0.0/0 \
  --description "Allow FireWorld application ports"
```

## 🔌 Krok 3: Połączenie z instancją

```bash
gcloud compute ssh fireworld-vm --zone=europe-west1-b
```

## 💾 Krok 4: Sprawdzenie i resize dysku (jeśli potrzebne)

Po połączeniu z instancją:

```bash
df -h
sudo growpart /dev/sda 1
sudo resize2fs /dev/sda1
df -h
```

## 🐳 Krok 5: Instalacja Dockera

```bash
sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg lsb-release

sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

sudo usermod -aG docker $USER
newgrp docker

docker --version
docker compose version
```

## 📦 Krok 6: Przesłanie kodu

### Opcja A: Przez Git (zalecane)

```bash
sudo apt-get install -y git
git clone https://github.com/Siekierson/fireworldL2.git
cd fireworldL2
git checkout microservices-architecture
```

### Opcja B: Przez gcloud compute scp (z lokalnego komputera)

```bash
gcloud compute scp --recurse ./fireworldL2 fireworld-vm:~/ --zone=europe-west1-b
```

## ⚙️ Krok 7: Konfiguracja zmiennych środowiskowych

```bash
cd ~/fireworldL2
nano .env
```

Dodaj:
```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
NEXT_PUBLIC_SUPABASE_URL=twoj_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=twoj_supabase_anon_key
JWT_SECRET=twoj_jwt_secret_key
OPENAI_API_KEY=twoj_openai_api_key
NEWS_API_KEY=twoj_news_api_key
```

Zapisz: `Ctrl+O`, `Enter`, `Ctrl+X`

## 🚀 Krok 8: Uruchomienie aplikacji

```bash
docker compose up -d --build
```

Sprawdź status:
```bash
docker compose ps
docker compose logs -f
```

## 🌐 Krok 9: Dostęp do aplikacji

Otwórz w przeglądarce:
```
http://34.78.248.220:3000
```

## ✅ Krok 10: Weryfikacja

### Health check backendu:
```bash
curl http://localhost:3001/health
```

### Sprawdź logi w bazie:
```bash
docker compose exec database psql -U postgres -d fireworld -c "SELECT * FROM system_logs ORDER BY created_at DESC LIMIT 10;"
```

### Sprawdź Redis:
```bash
docker compose exec redis redis-cli PUBSUB CHANNELS
```

## 📝 Uwagi

- Ostrzeżenie o dysku 20GB jest normalne - Ubuntu automatycznie zresizuje partycję
- Jeśli partycja nie została zresizowana, użyj komend z Kroku 4
- External IP może się zmienić po restarcie - rozważ użycie statycznego IP dla produkcji

