# ESTRATEGIA INVERTIDA: Usamos base Python (mejor para yt-dlp/curl-cffi)
FROM python:3.11-slim-bookworm

# 1. Instalamos herramientas básicas y Node.js (v20)
RUN apt-get update && \
    apt-get install -y curl gnupg build-essential libffi-dev ffmpeg && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# 2. Instalamos yt-dlp y curl-cffi (el camuflaje)
# Al estar en una imagen de Python nativa, esto suele compilar sin errores
RUN pip install --no-cache-dir --upgrade "yt-dlp[default]" curl-cffi

WORKDIR /app

# 3. Instalamos dependencias de Node
COPY package*.json ./
RUN npm install --only=production

# 4. Copiamos el resto del código
COPY . .

# 5. Puerto
EXPOSE 3333

# 6. Arranque
CMD ["node", "index.js"]
