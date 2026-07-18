FROM node:22-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY packages/service-runtime/runtime.mjs packages/service-runtime/runtime.mjs
COPY services/gateway/package.json services/gateway/server.mjs services/gateway/
EXPOSE 4000
USER node
CMD ["node", "services/gateway/server.mjs"]
