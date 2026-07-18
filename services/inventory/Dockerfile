FROM node:22-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY packages/service-runtime/runtime.mjs packages/service-runtime/runtime.mjs
COPY services/inventory/package.json services/inventory/server.mjs services/inventory/
EXPOSE 4005
USER node
CMD ["node", "services/inventory/server.mjs"]
