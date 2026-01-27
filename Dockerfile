# 1. Usamos una base muy compatible (Debian Slim)
# Es mejor que Alpine para temas de video y Python
FROM node:20-slim

# 2. Instalamos las herramientas del sistema necesarias
# - python3 + pip: Para ejecutar el motor de descargas
# - ffmpeg: Para procesar audio/video si hiciera falta
# - curl: Para que Coolify pueda hacer el healthcheck
RUN apt-get update && \
    apt-get install -y python3 python3-pip ffmpeg curl && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# 3. Instalamos el motor yt-dlp usando Python (pip)
# Usamos --break-system-packages porque en Docker no es peligroso y simplifica todo
RUN pip3 install yt-dlp --break-system-packages

# 4. Preparamos el directorio de la app
WORKDIR /app

# 5. Instalamos primero las dependencias de Node (para aprovechar la caché)
COPY package*.json ./
RUN npm ci --only=production

# 6. Copiamos el resto del código (tu index.js)
COPY . .

# 7. Exponemos el puerto correcto
EXPOSE 3333

# 8. Arrancamos el servidor
CMD ["node", "index.js"]
