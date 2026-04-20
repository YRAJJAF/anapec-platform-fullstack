#!/bin/sh
# Run this once to initialise the database
# Usage: sh prisma/init-db.sh

set -e
echo "🗄️  Initialising ANAPEC database..."

# Generate Prisma client
npx prisma generate

# Create and apply migration
npx prisma migrate dev --name init --skip-seed

# Seed demo data
npx ts-node prisma/seed.ts

echo "✅ Database ready!"
echo ""
echo "Demo accounts:"
echo "  candidat@demo.ma   / Demo1234!"
echo "  admin@demo.ma      / Demo1234!"
echo "  superadmin@anapec.ma / Admin2024!"
