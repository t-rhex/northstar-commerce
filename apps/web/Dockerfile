FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG VITE_GATEWAY_URL=/api/v1
ARG VITE_JAEGER_URL=http://localhost:16686
ENV VITE_GATEWAY_URL=$VITE_GATEWAY_URL
ENV VITE_JAEGER_URL=$VITE_JAEGER_URL
RUN npm run build

FROM node:22-alpine
WORKDIR /app
COPY --from=build /app/package*.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
EXPOSE 3000
ENV PORT=3000 HOST=0.0.0.0
USER node
CMD ["npm", "run", "start"]
