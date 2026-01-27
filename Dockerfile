# Usamos Debian Slim en lugar de Alpine para máxima compatibilidad con Python/yt-dlp
FROM node:20-slim

# Instalamos:
# 1. python3 + pip: OBLIGATORIO para que yt-dlp funcione bien
# 2. ffmpeg: OBLIGATORIO para unir audio/video en casos complejos
# 3. curl: OBLIGATORIO para el healthcheck de Coolify
RUN apt-get update && \
    apt-get install -y python3 python3-pip ffmpeg curl && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Instalamos dependencias de Node
COPY package*.json ./
RUN npm ci --only=production

# Copiamos el resto del código
COPY . .

# Puerto real
EXPOSE 3333

# Arrancamos
CMD ["node", "index.js"]
