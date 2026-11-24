FROM node:20-slim
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
ARG APP_VERSION=dev
ENV APP_VERSION=${APP_VERSION} PORT=3000 NODE_ENV=production
USER node
EXPOSE 3000
CMD ["node", "server.js"]
