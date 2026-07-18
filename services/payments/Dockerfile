FROM node:22-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY packages/service-runtime/runtime.mjs packages/service-runtime/runtime.mjs
COPY services/payments/package.json services/payments/server.mjs services/payments/
EXPOSE 4006
USER node
CMD ["node", "services/payments/server.mjs"]
