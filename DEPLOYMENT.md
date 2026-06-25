# DEPLOYMENT — CFI CIRAS Web Admin sur Render

Guide complet de déploiement isoprod et production du frontend Vue 3 + Vite
sur **Render Static Sites**, aligné avec le backend `cfibackend` déployé sur
Railway.

---

## 1. Architecture cible

```
┌──────────────────────────────┐         ┌────────────────────────────────┐
│  Render — Static Site        │         │  Railway — Node/Express         │
│  cficiraswebadmin-isoprod    │ ──HTTPS▶│  cfibackend-isoprod             │
│  (branche develop)           │  /api/* │  PostgreSQL + JWT + Pino        │
└──────────────────────────────┘         └────────────────────────────────┘
┌──────────────────────────────┐         ┌────────────────────────────────┐
│  Render — Static Site        │         │  Railway — Node/Express         │
│  cficiraswebadmin-prod       │ ──HTTPS▶│  cfibackend (prod)              │
│  (branche main)              │  /api/* │  PostgreSQL + JWT + Pino        │
└──────────────────────────────┘         └────────────────────────────────┘
```

Le frontend est un **SPA statique** : Vite build → `dist/` → servi par le CDN
de Render. Toutes les routes côté client sont rewritées vers `index.html` via
la règle `routes` du `render.yaml`.

---

## 2. Pré-requis

| Élément                                                    | Statut      |
| ---------------------------------------------------------- | ----------- |
| Compte Render                                              | requis      |
| Dépôt Git connecté (GitHub/GitLab)                         | requis      |
| Backend `cfibackend` déployé sur Railway (isoprod ET prod) | requis      |
| URL Railway publique du backend isoprod                    | à récupérer |
| URL Railway publique du backend prod                       | à récupérer |
| CORS configuré côté backend pour les domaines Render       | à valider   |

---

## 3. Configuration backend à valider AVANT le déploiement frontend

Sur le backend Railway, vérifier que les domaines Render sont whitelisted
dans le middleware CORS :

```js
// cfibackend/src/app.js (ou équivalent)
app.use(
  cors({
    origin: [
      'https://cficiraswebadmin-isoprod.onrender.com',
      'https://cficiraswebadmin-prod.onrender.com',
      // + domaines custom une fois ajoutés
    ],
    credentials: true,
  })
);
```

Sans ça, le frontend recevra des erreurs CORS dès le premier appel API.

---

## 4. Déploiement initial via Blueprint (recommandé)

Render lit le `render.yaml` à la racine du repo et crée les services
automatiquement.

### Étapes

1. **Committer** les fichiers livrés ici à la racine du repo :

   - `render.yaml`
   - `.nvmrc`
   - `.env.example`
   - `.env.isoprod`
   - `.env.production` (mis à jour)
   - `vite.config.js` (mis à jour)
   - `package.json` (mis à jour)

2. **Ajuster les URLs** dans `render.yaml` :

   - Remplacer `cfibackend-isoprod.up.railway.app` par l'URL Railway réelle
   - Remplacer `cfibackend.up.railway.app` par l'URL Railway prod réelle
   - Idem dans la directive `Content-Security-Policy` (`connect-src`)

3. **Push** sur les branches concernées :

   ```bash
   git checkout develop && git push origin develop
   git checkout main    && git push origin main
   ```

4. **Sur Render** :

   - Dashboard → **New +** → **Blueprint**
   - Sélectionner le repo
   - Render détecte `render.yaml` et propose les deux services
   - Confirmer → premier build lancé

5. **Attendre les builds** (3–6 min pour un projet Vite de cette taille).

6. **URLs par défaut générées** :
   - `https://cficiraswebadmin-isoprod.onrender.com`
   - `https://cficiraswebadmin-prod.onrender.com`

---

## 5. Domaines personnalisés (optionnel mais recommandé pour la prod)

1. Render → service → **Settings → Custom Domains** → _Add_
2. Saisir le domaine (`admin.cfi-ciras.example.com`)
3. Render donne un enregistrement `CNAME` à ajouter chez le registrar
4. Une fois propagé (5–30 min), TLS Let's Encrypt automatique
5. **Mettre à jour** le `connect-src` du CSP et la liste CORS du backend
6. **Mettre à jour** `VITE_API_URL` si le backend a aussi un domaine custom

---

## 6. Vérification post-déploiement (smoke test isoprod)

```bash
# 1. Le site répond
curl -I https://cficiraswebadmin-isoprod.onrender.com
# → 200 OK, et entêtes Strict-Transport-Security, X-Frame-Options, CSP...

# 2. Le SPA fallback fonctionne (route inconnue → index.html)
curl -I https://cficiraswebadmin-isoprod.onrender.com/dashboard
# → 200 OK, Content-Type: text/html

# 3. Les assets sont bien cachés
curl -I https://cficiraswebadmin-isoprod.onrender.com/assets/<hash>.js
# → Cache-Control: public, max-age=31536000, immutable

# 4. index.html n'est PAS caché
curl -I https://cficiraswebadmin-isoprod.onrender.com/
# → Cache-Control: no-cache, no-store, must-revalidate

# 5. Le backend est joignable depuis le navigateur (depuis la console du site)
fetch('https://cfibackend-isoprod.up.railway.app/health')
  .then(r => r.json()).then(console.log)
# → { status: 'ok', ... }
```

Tests manuels dans le navigateur :

- DevTools → Network : le bundle est chargé en gzip/brotli
- DevTools → Application → SW : aucun service worker fantôme
- DevTools → Console : aucune erreur CORS, aucune var `VITE_*` undefined
- securityheaders.com → scan du domaine → note minimum A

---

## 7. Variables d'environnement Vite

| Variable        | isoprod                                     | prod                                | Notes                     |
| --------------- | ------------------------------------------- | ----------------------------------- | ------------------------- |
| `VITE_API_URL`  | `https://cfibackend-isoprod.up.railway.app` | `https://cfibackend.up.railway.app` | Sans trailing slash       |
| `VITE_APP_NAME` | `CFI CIRAS Web Admin — ISOPROD`             | `CFI CIRAS Web Admin`               | Affiché en UI             |
| `VITE_DEBUG`    | `true`                                      | `false`                             | Active logs verbeux       |
| `VITE_BASE_URL` | `/`                                         | `/`                                 | Si servi sous sous-chemin |
| `VITE_ENV`      | `isoprod`                                   | `production`                        | Tag pour Sentry/bandeaux  |
| `NODE_VERSION`  | `20.17.0`                                   | `20.17.0`                           | Pin Render                |
| `NODE_ENV`      | `production`                                | `production`                        | Vite mode                 |

⚠️ **Toutes** les `VITE_*` sont **inlinées dans le bundle** et donc lisibles
publiquement. Aucune ne doit contenir de secret serveur.

---

## 8. Rollback

Render conserve les builds précédents. Pour rollback :

1. Dashboard → service → **Deploys**
2. Sélectionner un déploiement antérieur réussi
3. **Rollback to this deploy**

Aucun re-build, bascule CDN quasi-immédiate (< 30s).

---

## 9. Monitoring

- **Build logs** : Dashboard Render → service → Logs (rétention 7j sur plan gratuit)
- **Bandwidth** : Dashboard → service → Metrics (limite 100 GB/mois en gratuit)
- **Uptime externe** : configurer UptimeRobot ou Better Stack sur l'URL
  publique (Render n'envoie pas d'alertes natives sur un static site)

---

## 10. Coûts attendus

| Plan             | Coût                        | Limites pertinentes                   |
| ---------------- | --------------------------- | ------------------------------------- |
| Static Site Free | 0 $                         | 100 GB bw / 500 build min / 100 sites |
| Static Site Pro  | inclus dans Team ($19/mois) | bandwidth illimité, support           |

Pour un usage isoprod + démo client, le tier gratuit suffit.

---

## 11. Checklist finale avant ouverture aux utilisateurs

Voir `PRODUCTION_CHECKLIST.md`.
