# CFI/CIRAS — Web Admin (frontend)

Front d'administration de l'ERP académique. Vue 3 (`<script setup>`) + Vite + Pinia + Bootstrap 5,
Chart.js / ECharts pour les graphiques. Français partout : UI, commentaires, messages de commit.

```bash
npm run dev          # Vite, port 5173
npm run lint         # 0 erreur attendue sur le code migré (2 erreurs legacy connues, §2.3 du doc d'état)
npm test             # vitest
npm run build
```

## Les trois dépôts

| Dépôt                             | Rôle                          | À savoir                                                                  |
| --------------------------------- | ----------------------------- | ------------------------------------------------------------------------- |
| `~/cfiprojects/cficiraswebadmin`  | ce front                      |                                                                           |
| `~/cfiprojects/cfibackend`        | API Express, port **3500**    | **modifiable** quand une route manque ou est cassée — c'est arrivé 5 fois |
| `~/cfiprojects/erp-academique-db` | schéma PostgreSQL, migrations | base de démo dans Docker : conteneur `erp-db-demo`, port **5435**         |

**Vérifier avant de coder.** Lint, tests et build ne parlent pas au backend : ils passent au vert
sur un module bâti sur des routes inexistantes (c'est arrivé, cf. §2.6 du doc d'état). Avant
d'écrire un écran, lire les routes réellement exposées et interroger la base :

```bash
cat ~/cfiprojects/cfibackend/src/routes/academique/<entité>.routes.js
docker exec erp-db-demo psql -U erp_user -d erp_academique -c "\sv v_<vue>"   # définition d'une vue
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:3500/api/academique/<chemin>
```

Les routes sont protégées : pour les exercer, prendre un jeton sur le jeu de démonstration
(comptes `admin`, `scolarite`, `pedagogie`… mot de passe `Demo@2026`).

```bash
T=$(curl -s -X POST http://localhost:3500/api/auth/login -H 'Content-Type: application/json' \
     -d '{"username":"admin","password":"Demo@2026"}' | python3 -c 'import sys,json;print(json.load(sys.stdin)["data"]["token"])')
curl -s -H "Authorization: Bearer $T" http://localhost:3500/api/academique/classes | head -c 400
```

Un **200 ne signifie pas succès** : `POST /modules/assigner` répond 200 avec `data.statut = ERREUR`.
Lire le corps.

## Architecture

```
src/core/      httpClient (déballe la réponse, normalise les erreurs) · createResource · createCrudStore
               router + guards (tout est protégé par défaut) · authStore
src/shared/    AppTabs · ItemActions · ConfirmModal · EmptyState · LoadingSpinner · PageHeader ·
               PageCard · ExportMenu · useTableExport · usePagination · utils (date, text, cache…)
src/modules/   un dossier par domaine métier : api.js · store.js · constants.js · composables/ ·
               components/tabs/ · views/ · routes.js
src/components/shared/Pagination.vue   ← le composant de pagination du projet (chemin historique)
src/views/, src/routes/, src/stores/   ← legacy non migré, ne rien y ajouter
```

Règle de dépendance : `modules → shared → core`. Une dépendance entre modules est permise mais se
**déclare en commentaire** (ex. `semestre → matieres`, `stats → examens`).

Modèle de référence : `src/modules/structure-academique/` — six sous-domaines (annee, cycle,
filiere, niveau, classe, semestre). Le plus abouti pour un onglet statistique :
`filiere/components/tabs/StatistiquesTab.vue` + les getters dérivés de `filiere/store.js`.

### Contrats à connaître

- `run()` de `createCrudStore` renvoie **`undefined` en cas d'échec** ; l'UI s'y fie :
  `if (result !== undefined) close()`.
- Les méthodes d'`api.js` renvoient **le corps déjà déballé** : pas de `response.data` à extraire
  côté store, mais la charge utile métier est toujours dans `data`.
- `AppTabs` ne monte que l'onglet actif : un onglet = une requête, au moment où on l'ouvre.
- Un `<script setup>` ne peut pas contenir `</` suivi de `script>`, même en commentaire.

## Conventions d'écriture

- Commentaires en français, qui expliquent **pourquoi** — pas ce que le code fait déjà voir. Le
  dépôt documente systématiquement les pièges du domaine à l'endroit où ils mordent.
- Tests colocalisés (`*.test.js`), qui verrouillent les pièges plutôt que les évidences.
- Pas de bouton qui ment : si l'endpoint n'existe pas ou si la donnée est fabriquée, on retire
  l'élément d'interface plutôt que d'entretenir l'illusion.

## Pièges de données confirmés en base

- **`pg` sert `COUNT`, `SUM` et `NUMERIC` en chaînes.** `'9' + '12'` vaut `'912'` : convertir avant
  toute addition (`nombre()` dans `shared/utils/remplissage.js`).
- **Vues à fan-out — agrégats faux.** `v_organisation_filieres`, `v_organisation_cycles` et
  `v_dashboard_global_classe` somment `capacite_max` **après** une jointure sur `inscriptions` : la
  capacité est multipliée par le nombre d'inscrits (5 400 places réelles affichées 36 325), et tous
  les taux de remplissage qui en découlent sont faux (~2,45 % partout). Sources saines pour les
  capacités : **`v_classes_effectifs`** (`GET /classes`) et **`v_organisation_classes`**
  (`GET /classes/stats/organisations`), toutes deux groupées par classe.
- **`/semestres/analytics/dashboard` contient des chiffres inventés** : `taux_assiduite_global` est
  la constante `92.4` en dur, `matrix.moyenne_generale` est un `RANDOM()` (valeur différente à
  chaque appel), `typology` ne renvoie qu'une seule ligne à 100 %, et `llm_summary` n'existe pas.
  Ne rien afficher de tout cela tel quel.
- **`GET /semestres/courants/actifs` ment sur son nom** : il renvoie les semestres de l'année
  académique **active**, pas ceux dont `est_actif` est vrai.
- La table `cycle` n'a **pas** de colonne `nom` (seulement `code` et `diplome`) ; un niveau n'a pas
  de désignation (son `code` — L1, M2 — est son libellé) ; un semestre n'a **pas** de niveau.
- `v_classes_effectifs` compte **toutes** les inscriptions de l'année active ; `v_organisation_classes`
  ne compte que `ACTIVE` / `VALIDEE`. Écart réel : 893 contre 832.
- Routes **absentes** : `GET/PUT/DELETE /etudiants/:id` (le détail passe par `/:id/complet`), toute
  route d'absence / assiduité.

## Documentation du dépôt

| Fichier                                 | Quand l'ouvrir                                                                                                                          |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `docs/ETAT-REFACTORISATION.md`          | **point de reprise** : ce qui est fait, ce qui reste, les pièges par module. Peut être en retard sur le code — recouper avec `git log`. |
| `docs/ARCHITECTURE.md`                  | structure et règle de dépendance                                                                                                        |
| `docs/GUIDE-MODULE.md`                  | recette pas à pas pour créer ou migrer un module                                                                                        |
| `docs/09-api-et-integration-backend.md` | ⚠️ reconstitué **depuis le frontend** : décrit ce que le front appelle, pas ce que le serveur offre                                     |

À tenir à jour : toute évolution notable se consigne dans `docs/ETAT-REFACTORISATION.md`.

## Méthode de travail attendue

Un module est **fini** avant qu'on passe au suivant. Avant de déclarer terminé :
`npm run lint && npm test && npm run build`, **puis** exercer les endpoints réellement appelés
contre `localhost:3500`.
