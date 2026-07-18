FROM node:22-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY packages/service-runtime/runtime.mjs packages/service-runtime/runtime.mjs
COPY services/checkout/package.json services/checkout/server.mjs services/checkout/
EXPOSE 4007
USER node
CMD ["node", "services/checkout/server.mjs"]
