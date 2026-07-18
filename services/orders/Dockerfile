FROM node:22-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY packages/service-runtime/runtime.mjs packages/service-runtime/runtime.mjs
COPY services/orders/package*.json services/orders/
RUN cd services/orders && npm ci --omit=dev
COPY services/orders/server.mjs services/orders/event-bus.mjs services/orders/storage.mjs services/orders/
EXPOSE 4003
USER node
CMD ["node", "services/orders/server.mjs"]
