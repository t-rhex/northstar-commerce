FROM node:22-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY packages/service-runtime/runtime.mjs packages/service-runtime/runtime.mjs
COPY services/cart/package*.json services/cart/
RUN cd services/cart && npm ci --omit=dev
COPY services/cart/server.mjs services/cart/storage.mjs services/cart/
EXPOSE 4002
USER node
CMD ["node", "services/cart/server.mjs"]
