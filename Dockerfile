# syntax=docker/dockerfile:1

# --- Dépendances npm (Blockly) ---
FROM node:22-alpine AS deps

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci --omit=dev


# --- Production : site statique via nginx (Sliplane) ---
FROM nginx:1.27-alpine AS production

# Sliplane route le trafic vers le port défini par la variable PORT (8080–65535).
# Le template nginx est rendu au démarrage par l'entrypoint officiel de l'image.
ENV PORT=8080

RUN rm -f /etc/nginx/conf.d/default.conf

COPY docker/nginx.conf.template /etc/nginx/templates/default.conf.template

WORKDIR /usr/share/nginx/html

COPY index.html blockly.html editor.html ./
COPY js ./js
COPY vendor ./vendor
COPY models ./models
COPY audio ./audio
COPY sprites ./sprites
COPY --from=deps /app/node_modules ./node_modules

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
