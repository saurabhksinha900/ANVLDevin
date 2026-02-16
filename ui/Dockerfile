FROM node:20-alpine AS builder
WORKDIR /app
RUN npm config set strict-ssl false
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx ng build --configuration production

FROM nginx:alpine
COPY --from=builder /app/dist/ui/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
