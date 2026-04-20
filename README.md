# ANAPEC — Plateforme de Tests de Langues et de Remédiation Linguistique

[![NestJS](https://img.shields.io/badge/Backend-NestJS-e0234e?logo=nestjs)](https://nestjs.com)
[![Next.js](https://img.shields.io/badge/Frontend-Next.js%2014-black?logo=next.js)](https://nextjs.org)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL-336791?logo=postgresql)](https://postgresql.org)

> Plateforme numérique d'évaluation linguistique CECRL et de remédiation pour les bénéficiaires de l'ANAPEC (Appel d'offres GIZ N° 7000005926).

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│                     Nginx (80/443)                   │
├────────────────────┬────────────────────────────────┤
│   Next.js Frontend │     NestJS API (:3001)          │
│   (:3000)          │     /api/v1/*                   │
├────────────────────┴────────────────────────────────┤
│   PostgreSQL (:5432)  │  Redis (:6379)               │
│   MinIO S3 (:9000)    │  (sessions & cache)          │
└─────────────────────────────────────────────────────┘
```

---

## 🚀 Démarrage rapide (Docker)

### Prérequis
- Docker ≥ 24 + Docker Compose ≥ 2
- Node.js ≥ 20 (pour le développement local)

### 1. Cloner et configurer

```bash
git clone <repo-url> anapec-platform
cd anapec-platform

# Copier le fichier d'environnement
cp .env.example .env

# Éditer .env avec vos valeurs (JWT secrets, OpenAI key, etc.)
nano .env
```

### 2. Lancer avec Docker Compose

```bash
docker compose up -d

# Voir les logs
docker compose logs -f backend

# La plateforme est disponible sur :
# Frontend  → http://localhost:3000
# API       → http://localhost:3001/api/v1
# Swagger   → http://localhost:3001/api/docs (dev only)
# MinIO UI  → http://localhost:9001
```

### 3. Comptes de démonstration

| Rôle       | Email                    | Mot de passe |
|------------|--------------------------|--------------|
| Candidat   | candidat@demo.ma         | Demo1234!    |
| Admin      | admin@demo.ma            | Demo1234!    |
| Coach      | coach@demo.ma            | Demo1234!    |
| Super Admin| superadmin@anapec.ma     | Admin2024!   |

---

## 💻 Développement local

### Backend

```bash
cd backend
npm install

# Démarrer PostgreSQL & Redis via Docker (only those)
docker compose up postgres redis minio -d

# Copier l'env
cp ../.env.example .env
# Modifier DATABASE_URL pour pointer vers localhost

# Migrations
npx prisma migrate dev --name init
npx ts-node prisma/seed.ts

# Dev server
npm run start:dev

# Swagger → http://localhost:3001/api/docs
```

### Frontend

```bash
cd frontend
npm install

# Créer .env.local
echo "NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1" > .env.local

npm run dev
# → http://localhost:3000
```

---

## 📁 Structure du projet

```
anapec-platform/
├── backend/                  # NestJS API
│   ├── prisma/
│   │   ├── schema.prisma     # 12 tables PostgreSQL
│   │   └── seed.ts           # Données de démonstration
│   └── src/
│       ├── auth/             # JWT, guards, RBAC
│       ├── users/            # Gestion candidats, import bulk
│       ├── languages/        # 8 langues CECRL
│       ├── tests/            # Moteur de test + scoring
│       ├── remediation/      # Cours et leçons
│       ├── reporting/        # Analytics et rapports
│       ├── certificates/     # Génération PDF (PDFKit)
│       ├── coaching/         # Sessions live
│       ├── ai-scoring/       # OpenAI Whisper + GPT-4o
│       └── common/           # Prisma, S3, filtres
│
├── frontend/                 # Next.js 14 (App Router)
│   └── src/app/
│       ├── auth/             # Login, inscription
│       ├── dashboard/        # Espace candidat
│       ├── test/             # Moteur de test
│       ├── remediation/      # Catalogue cours
│       └── admin/            # Tableau de bord admin
│
├── docker/
│   └── nginx/nginx.conf      # Reverse proxy
├── docker-compose.yml
└── .env.example
```

---

## 🔑 API Endpoints principaux

| Méthode | Endpoint                          | Description                    |
|---------|-----------------------------------|--------------------------------|
| POST    | /api/v1/auth/register             | Inscription candidat           |
| POST    | /api/v1/auth/login                | Connexion + tokens JWT         |
| GET     | /api/v1/languages                 | Liste des 8 langues            |
| GET     | /api/v1/tests                     | Tests disponibles              |
| POST    | /api/v1/sessions/start            | Démarrer une session de test   |
| POST    | /api/v1/sessions/:id/answer       | Soumettre une réponse          |
| POST    | /api/v1/sessions/:id/answer/audio | Réponse audio (speaking)       |
| POST    | /api/v1/sessions/:id/complete     | Terminer + scoring CECRL       |
| GET     | /api/v1/remediation/courses       | Catalogue de cours             |
| POST    | /api/v1/remediation/courses/:id/enroll | Inscription à un cours    |
| GET     | /api/v1/certificates/my           | Mes certificats                |
| GET     | /api/v1/reporting/overview        | Vue d'ensemble (admin)         |

---

## 🤖 Fonctionnalités IA (optionnelles)

La plateforme intègre OpenAI pour l'évaluation automatique :

- **Speaking (oral)** : Transcription via Whisper → Évaluation GPT-4o (fluidité, prononciation, vocabulaire, grammaire)
- **Writing (écrit)** : Analyse GPT-4o (cohérence, vocabulaire, grammaire, accomplissement de la tâche)
- **Fallback** : Si la clé OpenAI n'est pas configurée, les évaluations sont mises en file d'attente pour révision manuelle

Configurer dans `.env` :
```
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o
```

---

## 🌍 Langues supportées

| Code | Langue          | Niveaux |
|------|-----------------|---------|
| `fr` | Français        | A1→C2   |
| `de` | Allemand        | A1→C2   |
| `en` | Anglais         | A1→C2   |
| `es` | Espagnol        | A1→C2   |
| `it` | Italien         | A1→C2   |
| `pt` | Portugais       | A1→C2   |
| `nl` | Néerlandais     | A1→C2   |
| `ar` | Arabe classique | A1→C2   |

---

## 🔒 Sécurité

- Authentification JWT (access 15min + refresh 7j)
- Hachage bcrypt (12 rounds)
- Rate limiting (Throttler NestJS)
- Helmet.js pour les headers HTTP
- CORS configuré
- Validation des données (class-validator + Zod)
- Rôles : CANDIDATE, ADMIN, SUPER_ADMIN, EVALUATOR, COACH

---

## 📊 Variables d'environnement requises

| Variable              | Obligatoire | Description                        |
|-----------------------|-------------|-------------------------------------|
| `DATABASE_URL`        | ✅          | URL PostgreSQL                      |
| `JWT_ACCESS_SECRET`   | ✅          | Secret JWT (min 32 chars)          |
| `JWT_REFRESH_SECRET`  | ✅          | Secret refresh JWT                  |
| `AWS_ACCESS_KEY_ID`   | ✅          | Clé S3/MinIO                        |
| `AWS_SECRET_ACCESS_KEY`| ✅         | Secret S3/MinIO                     |
| `OPENAI_API_KEY`      | ❌          | Optionnel — active l'IA scoring     |
| `MAIL_HOST`           | ❌          | Optionnel — notifications email     |

---

## 📄 Licence

Développé dans le cadre de l'appel d'offres GIZ N° 7000005926 — Projet ZME (G-012342-145).
