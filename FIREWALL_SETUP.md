# Konfiguracja Firewall na GCP

## ⚠️ Ważne
Firewall **NIE MOŻE** być tworzony z poziomu instancji GCP. Musisz użyć:
- Konsoli GCP (najprostsze) ✅
- Cloud Shell
- gcloud CLI z lokalnego komputera

## 🎯 OPCJA 1: Konsola GCP (ZALECANE - Najprostsze)

### Krok 1: Otwórz konsolę GCP
Przejdź do: https://console.cloud.google.com/networking/firewalls/list

### Krok 2: Utwórz regułę firewall
1. Kliknij **"CREATE FIREWALL RULE"** (lub "Utwórz regułę firewall")

2. Wypełnij formularz:
   - **Name** (Nazwa): `allow-fireworld-ports`
   - **Description** (Opis): `Allow FireWorld application ports`
   - **Network** (Sieć): wybierz domyślną sieć VPC (zazwyczaj `default`)
   - **Direction of traffic** (Kierunek ruchu): **Ingress** (Ruch przychodzący)
   - **Action on match** (Akcja przy dopasowaniu): **Allow** (Zezwól)
   - **Targets** (Cele): **All instances in the network** (Wszystkie instancje w sieci)
   - **Source IP ranges** (Zakresy adresów IP źródłowych): `0.0.0.0/0`
   - **Protocols and ports** (Protokoły i porty):
     - Wybierz **tcp**
     - W polu portów wpisz: `3000,3001,22`
     - Lub zaznacz **"Specified protocols and ports"** i dodaj:
       - `tcp:3000`
       - `tcp:3001`
       - `tcp:22`

3. Kliknij **"CREATE"** (Utwórz)

### Krok 3: Sprawdź
Po utworzeniu powinieneś zobaczyć regułę `allow-fireworld-ports` na liście.

---

## 🖥️ OPCJA 2: Cloud Shell

### Krok 1: Otwórz Cloud Shell
1. Przejdź do: https://console.cloud.google.com/
2. Kliknij ikonę terminala w prawym górnym rogu (Cloud Shell)

### Krok 2: Utwórz firewall
```bash
gcloud compute firewall-rules create allow-fireworld-ports \
  --allow tcp:3000,tcp:3001,tcp:22 \
  --source-ranges 0.0.0.0/0 \
  --description "Allow FireWorld application ports"
```

---

## 💻 OPCJA 3: gcloud CLI (lokalny komputer)

### Krok 1: Instalacja gcloud CLI

**macOS (Homebrew):**
```bash
brew install google-cloud-sdk
```

**macOS (Instalacja ręczna):**
1. Pobierz: https://cloud.google.com/sdk/docs/install
2. Rozpakuj i uruchom: `./install.sh`

**Linux:**
```bash
curl https://sdk.cloud.google.com | bash
exec -l $SHELL
```

### Krok 2: Konfiguracja
```bash
gcloud init
# Postępuj zgodnie z instrukcjami
# Wybierz swój projekt
# Zaloguj się
```

### Krok 3: Utwórz firewall
```bash
gcloud compute firewall-rules create allow-fireworld-ports \
  --allow tcp:3000,tcp:3001,tcp:22 \
  --source-ranges 0.0.0.0/0 \
  --description "Allow FireWorld application ports"
```

---

## ✅ Weryfikacja

Sprawdź czy firewall został utworzony:

**W konsoli GCP:**
- Przejdź do: https://console.cloud.google.com/networking/firewalls/list
- Powinieneś zobaczyć `allow-fireworld-ports`

**Z Cloud Shell lub gcloud CLI:**
```bash
gcloud compute firewall-rules list | grep allow-fireworld
```

---

## 🔍 Test dostępu

Po utworzeniu firewallu, aplikacja powinna być dostępna:

- **Frontend**: http://34.78.248.22:3000
- **Backend**: http://34.78.248.22:3001/health

(Zastąp `34.78.248.22` swoim External IP)

---

## 🐛 Troubleshooting

**Problem:** Nadal nie działa po utworzeniu firewall
- Poczekaj 1-2 minuty na propagację reguł
- Sprawdź czy aplikacja działa: `curl http://localhost:3001/health` (na instancji)
- Sprawdź czy `NEXT_PUBLIC_BACKEND_URL` jest ustawione na External IP w `.env.local`
- Zrestartuj aplikację: `docker compose down && docker compose up -d --build`

