# Uruchomienie projektu na GCP (Ubuntu)

## 🔌 1. Połączenie z instancją GCP

```bash
gcloud compute ssh fireworld-vm --zone=europe-west1-b
```

Lub jeśli masz inną nazwę instancji:
```bash
gcloud compute ssh NAZWA_INSTANCJI --zone=STREFA
```

## 📦 2. Klonowanie repozytorium (pierwsze uruchomienie)

```bash
# Zainstaluj git jeśli nie ma
sudo apt-get update
sudo apt-get install -y git

# Sklonuj repozytorium
git clone https://github.com/Siekierson/fireworldL2.git
cd fireworldL2
git checkout microservices-architecture
```

Lub zaktualizuj istniejące repo:
```bash
cd fireworldL2
git pull origin microservices-architecture
```

## ⚙️ 3. Konfiguracja zmiennych środowiskowych

```bash
# Utwórz plik .env.local
nano .env.local
```

Dodaj następujące 5 zmiennych:
```env
NEXT_PUBLIC_SUPABASE_URL=twoj_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=twoj_supabase_anon_key
NEXT_PUBLIC_NEWS_API_KEY=twoj_news_api_key
JWT_SECRET=twoj_jwt_secret_key_minimum_32_znaki
OPENAI_API_KEY=twoj_openai_api_key
```

Zapisz (Ctrl+O, Enter, Ctrl+X)

## 🐳 4. Instalacja Dockera (jeśli nie jest zainstalowany)

```bash
# Sprawdź czy Docker jest zainstalowany
docker --version

# Jeśli nie, zainstaluj:
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
```

## 🚀 5. Uruchomienie projektu

```bash
cd fireworldL2
docker compose up -d --build
```

## 📊 6. Sprawdzenie statusu

```bash
# Sprawdź działające kontenery
docker compose ps

# Zobacz logi
docker compose logs -f

# Tylko backend
docker compose logs -f backend

# Tylko frontend
docker compose logs -f frontend
```

## 🔄 7. Restart (po aktualizacji kodu)

```bash
cd fireworldL2
git pull origin microservices-architecture
docker compose down
docker compose up -d --build
```

## 🛑 8. Zatrzymanie

```bash
docker compose down
```

## 🌐 9. Sprawdzenie IP i dostęp do aplikacji

### Sprawdzenie External IP

**Z lokalnego komputera:**
```bash
# Pojedyncza instancja
gcloud compute instances describe fireworld-vm --zone=europe-west1-b --format='get(networkInterfaces[0].accessConfigs[0].natIP)'

# Lista wszystkich instancji z IP
gcloud compute instances list
```

**Z poziomu instancji Ubuntu (po SSH):**
```bash
# External IP
curl ifconfig.me
# lub
curl -H "Metadata-Flavor: Google" http://169.254.169.254/computeMetadata/v1/instance/network-interfaces/0/access-configs/0/external-ip

# Internal IP
hostname -I
```

### Dostęp do aplikacji

- **Frontend**: http://EXTERNAL_IP:3000
- **Backend**: http://EXTERNAL_IP:3001/health

**Przykład:**
Jeśli External IP to `34.78.248.220`:
- Frontend: http://34.78.248.220:3000
- Backend: http://34.78.248.220:3001/health

## 🔥 10. Konfiguracja firewall (jeśli porty nie są otwarte)

```bash
gcloud compute firewall-rules create allow-fireworld-ports \
  --allow tcp:3000,tcp:3001,tcp:22 \
  --source-ranges 0.0.0.0/0 \
  --description "Allow FireWorld application ports"
```

