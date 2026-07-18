FROM node:22-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY packages/service-runtime/runtime.mjs packages/service-runtime/runtime.mjs
COPY services/notifications/package*.json services/notifications/
RUN cd services/notifications && npm ci --omit=dev
COPY services/notifications/server.mjs services/notifications/server.mjs
EXPOSE 4004
USER node
CMD ["node", "services/notifications/server.mjs"]
