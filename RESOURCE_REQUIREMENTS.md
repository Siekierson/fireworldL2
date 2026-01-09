# Wymagania zasobowe dla FireWorld

## Analiza wymagań dla 4 kontenerów

### CPU (2 vCPU) ✅ WYSTARCZA
- Frontend (Next.js): ~0.1-0.3 vCPU (niskie obciążenie)
- Backend (Node.js/Express): ~0.2-0.5 vCPU (średnie obciążenie)
- PostgreSQL: ~0.1-0.3 vCPU (tylko logi systemowe)
- Redis: ~0.05-0.1 vCPU (bardzo niskie obciążenie)
- **Razem: ~0.45-1.2 vCPU** - 2 vCPU daje zapas

### RAM (4 GB) ✅ WYSTARCZA
- Frontend: ~300-500 MB
- Backend: ~200-400 MB
- PostgreSQL: ~200-500 MB (dla małej bazy logów)
- Redis: ~50-100 MB
- System Ubuntu: ~500 MB
- Docker overhead: ~200 MB
- **Razem: ~1.45-2.2 GB** - 4 GB daje bezpieczny zapas

### Dysk (10 GB) ⚠️ ZA MAŁO - ZALECANE 20 GB
- System Ubuntu 22.04: ~3-4 GB
- Docker images:
  - Next.js image: ~800 MB
  - Node.js backend image: ~200 MB
  - PostgreSQL image: ~400 MB
  - Redis image: ~50 MB
  - **Razem images: ~1.5 GB**
- Docker volumes (baza danych):
  - Początkowo: ~100-500 MB
  - Z logami: może rosnąć do 1-2 GB
- Kod aplikacji: ~100 MB
- Docker system files: ~500 MB
- **Razem: ~5.5-8 GB minimum**
- **Z zapasem: 20 GB zalecane**

## Rekomendacja

✅ **CPU: 2 vCPU** - OK
✅ **RAM: 4 GB** - OK  
⚠️ **Dysk: Zwiększ do 20 GB** - dla bezpieczeństwa i miejsca na logi

## Koszt
- e2-medium (2 vCPU, 4 GB): ~27.91 USD/miesiąc
- Dysk 20 GB zamiast 10 GB: +1 USD/miesiąc
- **Łącznie: ~29 USD/miesiąc**

