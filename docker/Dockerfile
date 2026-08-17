# Image du frontend CFI/CIRAS — build Vite, puis nginx.
#
# ## Le choix qui structure ce fichier : l'API se joint en *même origine*
#
# `httpClient.js` construit son `baseURL` ainsi :
#
#     `${import.meta.env.VITE_API_URL}/api${prefix}`
#
# Or `VITE_*` est **figée au moment du build** : elle est réécrite en dur dans
# le bundle, pas lue au démarrage du conteneur. Une image construite avec
# `VITE_API_URL=https://api.exemple.org` ne parle qu'à ce serveur-là — la
# repromouvoir d'iso-prod vers la production supposerait de la reconstruire, et
# donc de déployer un binaire qui n'a jamais été testé.
#
# D'où le défaut retenu : `VITE_API_URL` **vide**. Le bundle appelle alors
# `/api/...`, en relatif, et nginx renvoie ces chemins vers le service `api` du
# réseau interne (voir `nginx.conf`). Trois conséquences, toutes bonnes :
#
#   · la même image tourne en dev-docker, en iso-prod et en production ;
#   · aucune requête n'est cross-origin : plus de CORS à accorder, plus de
#     préflight, et `CORS_ORIGIN` côté backend cesse d'être un point de panne ;
#   · les cookies et en-têtes ne traversent aucune frontière d'origine.
#
# ⚠️ Sur **Render en site statique**, il n'y a pas de nginx à nous : le front
# est servi par un CDN et l'API vit sur un autre domaine. Là, et seulement là,
# on construit avec `VITE_API_URL=https://<service-api>.onrender.com` et on
# accorde le CORS côté backend. Voir `cfideploy/docs/02-render.md`.

# ─── Étape 1 : build ─────────────────────────────────────────────────────────
FROM node:20-alpine AS build

WORKDIR /app

# Playwright est en devDependency : `npm ci` tenterait sinon de télécharger les
# navigateurs (plusieurs centaines de Mo) pour une image qui n'exécute aucun
# test.
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1

COPY package.json package-lock.json ./

# Pas de `--omit=dev` ici, contrairement au backend : Vite, le plugin Vue et
# les resolvers de composants sont tous des devDependencies. Sans eux, aucun
# build.
RUN npm ci

COPY . .

# Vide par défaut — voir l'en-tête. `ARG` plutôt qu'`ENV` pour que la valeur ne
# survive pas dans l'image finale, qui de toute façon ne contient plus Node.
ARG VITE_API_URL=""
ARG VITE_APP_NAME="CFI CIRAS Web Admin"
ARG VITE_ENV="production"
ARG VITE_DEBUG="false"
ARG VITE_BASE_URL="/"

ENV VITE_API_URL=$VITE_API_URL \
    VITE_APP_NAME=$VITE_APP_NAME \
    VITE_ENV=$VITE_ENV \
    VITE_DEBUG=$VITE_DEBUG \
    VITE_BASE_URL=$VITE_BASE_URL \
    NODE_ENV=production

# `--mode production` et non le `.env` du dépôt : les `.env*` sont écartés par
# le `.dockerignore` justement pour qu'un fichier local — pointant `localhost`
# — ne se retrouve jamais gravé dans une image déployée.
RUN npm run build

# ─── Étape 2 : service ───────────────────────────────────────────────────────
FROM nginx:1.27-alpine AS production

RUN apk add --no-cache curl

# Notre configuration remplace la principale, pas seulement un `conf.d` : c'est
# elle qui déplace le fichier PID et les répertoires temporaires vers /tmp, sans
# quoi nginx ne peut pas démarrer sous un utilisateur non privilégié.
COPY docker/nginx.conf /etc/nginx/nginx.conf

COPY --from=build /app/dist /usr/share/nginx/html

# nginx écoute en 8080 et non en 80 : sous l'utilisateur `nginx`, les ports
# inférieurs à 1024 sont interdits. Le proxy frontal publie 80/443 de son côté.
EXPOSE 8080

# `/usr/share/nginx/html` est servi en lecture seule ; seuls les temporaires
# doivent être inscriptibles.
RUN chown -R nginx:nginx /var/cache/nginx /var/log/nginx

USER nginx

# Interroge la page d'accueil : c'est le seul contrat que ce conteneur porte.
# La disponibilité de l'API se mesure sur `/ready` de l'API, pas ici — un front
# qui répond alors que la base est coupée est un état normal, pas une panne.
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -fsS http://127.0.0.1:8080/ >/dev/null || exit 1

CMD ["nginx", "-g", "daemon off;"]
