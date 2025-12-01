FROM node:20.10-slim AS builder
RUN apt-get update -y && apt-get install -y openssl
RUN apt update && apt install tzdata -y
ENV TZ="Asia/Bangkok"

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci

COPY . .

RUN npx prisma generate
RUN npm run build

# Prune dev dependencies to reduce size
RUN npm prune --production

# # Final stage
FROM node:20.10-slim
RUN apt-get update -y && apt-get install -y openssl
RUN apt update && apt install tzdata -y
ENV TZ="Asia/Bangkok"

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma

EXPOSE 3000

CMD ["npm", "start"]
