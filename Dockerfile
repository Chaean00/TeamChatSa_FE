# 1) Build stage
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# --- Vite build-time envs (필요한 것만 ARG로 받기) ---
ARG VITE_API_BASE_URL
ARG VITE_APP_NAME
ARG VITE_KAKAO_CLIENT_ID
ARG VITE_KAKAO_REDIRECT_URI
ARG VITE_KAKAO_MAP_API_KEY

ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
ENV VITE_APP_NAME=${VITE_APP_NAME}
ENV VITE_KAKAO_CLIENT_ID=${VITE_KAKAO_CLIENT_ID}
ENV VITE_KAKAO_REDIRECT_URI=${VITE_KAKAO_REDIRECT_URI}
ENV VITE_KAKAO_MAP_API_KEY=${VITE_KAKAO_MAP_API_KEY}

RUN npm run build


# 2) Run stage
FROM nginx:1.27-alpine

# envsubst 제공
RUN apk add --no-cache gettext

# nginx 템플릿 복사
COPY ./nginx.conf /etc/nginx/templates/default.conf.template

# 빌드 산출물 복사
COPY --from=builder /app/dist /usr/share/nginx/html

# 컨테이너 시작 시 API_UPSTREAM을 템플릿에 주입 후 nginx 실행
CMD ["/bin/sh", "-c", "envsubst '$$API_UPSTREAM' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]

EXPOSE 80