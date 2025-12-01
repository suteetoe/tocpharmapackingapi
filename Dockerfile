FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci

COPY . .

RUN npx prisma generate
RUN npm run build

# Prune dev dependencies to reduce size
RUN npm prune --production

# Final stage
FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma

EXPOSE 3000

CMD ["npm", "start"]
