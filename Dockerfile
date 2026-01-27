# Imagen base oficial de Node (ligera y estable)
FROM node:20-alpine

# Directorio de trabajo dentro del contenedor
WORKDIR /app

# Copiamos package.json y lock primero (mejor cache)
COPY package*.json ./

# Instalamos dependencias
RUN npm ci --only=production

# Copiamos el resto del código
COPY . .

# Exponemos el puerto REAL del servicio
EXPOSE 3333

# Comando de arranque
CMD ["node", "index.js"]
