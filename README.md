# Vue 3 + Vite

This template should help get you started developing with Vue 3 in Vite. The template uses Vue 3 `<script setup>` SFCs, check out the [script setup docs](https://v3.vuejs.org/api/sfc-script-setup.html#sfc-script-setup) to learn more.

Learn more about IDE Support for Vue in the [Vue Docs Scaling up Guide](https://vuejs.org/guide/scaling-up/tooling.html#ide-support).

## Déploiement Render

Ce projet est prêt pour un déploiement Render en site statique.

1. Dans Render, connectez votre dépôt Git.
2. Créez un service `Static Site` pour la branche `develop` (démo) et un autre pour la branche `main` (production).
3. Utilisez ce fichier `render.yaml` à la racine pour la configuration automatique.
4. Commande de build : `npm install && npm run build`
5. Dossier publié : `dist`
6. Variables d’environnement recommandées :
   - `VITE_API_URL`
   - `VITE_APP_NAME`
   - `VITE_DEBUG`
   - `VITE_BASE_URL` (par défaut `/`)
   - `NODE_ENV=production`

Le service Render inclut une règle SPA pour rediriger toutes les routes vers `index.html`.
