FROM node:20-slim AS build

WORKDIR /app

ARG VITE_BASE_URL_BACKEND=http://localhost:8080
ARG VITE_BASE_URL_FRONTEND=http://localhost:5173

ENV VITE_BASE_URL_BACKEND=$VITE_BASE_URL_BACKEND
ENV VITE_BASE_URL_FRONTEND=$VITE_BASE_URL_FRONTEND

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .
RUN npx vite build

FROM nginx:alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
