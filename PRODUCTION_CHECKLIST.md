# PRODUCTION CHECKLIST — CFI CIRAS Web Admin

À cocher avant l'ouverture isoprod aux utilisateurs (démo) et avant chaque
mise en prod.

## Build & dépendances

- [ ] `npm ci` passe sans warning bloquant en local
- [ ] `npm run build:isoprod` produit un `dist/` < 5 Mo gzippé
- [ ] `npm audit --production` : 0 vulnérabilité **High** ou **Critical**
- [ ] `package-lock.json` committé à jour
- [ ] `.nvmrc` à la racine avec la même version Node que `render.yaml`

## Configuration Render

- [ ] `render.yaml` à la racine du repo
- [ ] Service `cficiraswebadmin-isoprod` créé (branche `develop`)
- [ ] Service `cficiraswebadmin-prod` créé (branche `main`)
- [ ] `buildCommand` utilise bien `npm ci` (pas `npm install`)
- [ ] `staticPublishPath: ./dist`
- [ ] Rewrite SPA `/* → /index.html` actif (status implicite 200)
- [ ] `NODE_VERSION` = `20.17.0` dans les envVars
- [ ] `NPM_CONFIG_PRODUCTION=false` (sinon devDeps non installées)

## Sécurité

- [ ] HTTPS forcé (par défaut sur Render, vérifier la redirection)
- [ ] HSTS actif (`max-age=63072000; includeSubDomains; preload`)
- [ ] CSP en place, `connect-src` couvre le domaine Railway exact
- [ ] `X-Frame-Options: DENY`
- [ ] `X-Content-Type-Options: nosniff`
- [ ] `Referrer-Policy: strict-origin-when-cross-origin`
- [ ] Aucun secret serveur dans une variable `VITE_*`
- [ ] `.env.production` et `.env.isoprod` **non committés** si modifiés en local
- [ ] Note ≥ A sur securityheaders.com

## Backend & CORS

- [ ] Backend Railway isoprod déployé et joignable
- [ ] `/health` du backend retourne 200
- [ ] `/ready` du backend retourne 200
- [ ] Domaine Render isoprod whitelisted dans le CORS du backend
- [ ] Domaine Render prod whitelisted dans le CORS du backend
- [ ] JWT secret backend ≠ valeur par défaut, longueur ≥ 32 chars
- [ ] Rate limiting backend actif sur `/auth/*`

## Performance

- [ ] Lighthouse Performance ≥ 80 sur la page d'accueil
- [ ] Bundle principal < 500 Ko gzippé (sinon revoir `manualChunks`)
- [ ] `/assets/*` servi avec `Cache-Control: max-age=31536000, immutable`
- [ ] `index.html` servi avec `Cache-Control: no-cache`
- [ ] Images > 200 Ko optimisées (`public/img/`)

## SPA & routage

- [ ] Rafraîchir une page profonde (`/users/42/edit`) ne donne PAS un 404
- [ ] Navigation au clavier fonctionne
- [ ] Le titre `<title>` change selon la route (si router-meta utilisé)

## Observabilité

- [ ] Erreurs JS reportées (Sentry, LogRocket, ou au minimum console)
- [ ] `VITE_ENV` exposé en UI quelque part (footer discret) pour distinguer
      isoprod vs prod en démo
- [ ] Monitoring externe configuré (UptimeRobot / Better Stack)

## Données & UX démo (isoprod uniquement)

- [ ] Comptes de démo seedés côté backend
- [ ] Aucune donnée réelle d'étudiant / personnel en base isoprod
- [ ] Bandeau ou favicon distinct signalant "ISOPROD" / "DEMO"
- [ ] Possibilité de reset de la base isoprod documentée

## Rollback

- [ ] Procédure de rollback testée au moins une fois (cf. DEPLOYMENT.md §8)
- [ ] Tag Git posé sur chaque release prod (`v1.x.y`)
