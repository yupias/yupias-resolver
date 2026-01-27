# 1. Base Debian Slim
FROM node:20-slim

# 2. Herramientas del sistema
RUN apt-get update && \
    apt-get install -y python3 python3-pip ffmpeg curl && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# 3. Motor yt-dlp
RUN pip3 install yt-dlp --break-system-packages

WORKDIR /app

# 4. Dependencias Node
COPY package*.json ./

# 🚨 CAMBIO AQUÍ: Usamos 'install' en vez de 'ci' para regenerar el lock si hace falta
RUN npm install --only=production

# 5. Resto del código
COPY . .

# 6. Puerto
EXPOSE 3333

# 7. Arranque
CMD ["node", "index.js"]
