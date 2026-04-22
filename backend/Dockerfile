FROM node:20-alpine

WORKDIR /app

COPY package*.json package-lock.json* ./
RUN npm ci --omit=dev

COPY prisma ./prisma/
COPY dist ./dist/
COPY tsconfig.json nest-cli.json ./

RUN npx prisma generate

ENV NODE_ENV=production
EXPOSE 3001

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main"]