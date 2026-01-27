# Base Python sólida
FROM python:3.11-slim-bookworm

# Herramientas de sistema (+git para bajar la última versión)
RUN apt-get update && \
    apt-get install -y curl gnupg build-essential libffi-dev ffmpeg git && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# 🚨 CAMBIO CLAVE:
# 1. Actualizamos pip
RUN pip install --no-cache-dir --upgrade pip

# 2. Instalamos las dependencias de camuflaje PRIMERO
RUN pip install --no-cache-dir curl-cffi certifi requests

# 3. Instalamos yt-dlp DIRECTAMENTE desde su código fuente (Versión Master/Nightly)
# Esto nos da los parches que salieron hace horas para TikTok
RUN pip install --force-reinstall https://github.com/yt-dlp/yt-dlp/archive/master.zip

WORKDIR /app

# Node dependencies
COPY package*.json ./
RUN npm install --only=production

COPY . .

EXPOSE 3333
CMD ["node", "index.js"]
