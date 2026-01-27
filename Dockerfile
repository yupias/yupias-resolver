# 1. Base Debian Slim
FROM node:20-slim

# 2. Instalamos herramientas de compilación (necesarias para el camuflaje)
# Añadimos gcc, python3-dev y libffi-dev para poder compilar librerías potentes
RUN apt-get update && \
    apt-get install -y python3 python3-pip ffmpeg curl build-essential python3-dev libffi-dev && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# 3. Instalamos yt-dlp CON el soporte de camuflaje (curl-cffi)
# Esto es lo que nos pide el error de TikTok
RUN pip3 install "yt-dlp[default]" curl-cffi --break-system-packages

WORKDIR /app

# 4. Dependencias Node
COPY package*.json ./
RUN npm install --only=production

# 5. Resto del código
COPY . .

# 6. Puerto
EXPOSE 3333

# 7. Arranque
CMD ["node", "index.js"]
