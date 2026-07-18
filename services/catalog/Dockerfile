FROM node:22-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY packages/service-runtime/runtime.mjs packages/service-runtime/runtime.mjs
COPY services/catalog/package*.json services/catalog/
RUN cd services/catalog && npm ci --omit=dev
COPY services/catalog/server.mjs services/catalog/storage.mjs services/catalog/products.mjs services/catalog/
EXPOSE 4001
USER node
CMD ["node", "services/catalog/server.mjs"]
