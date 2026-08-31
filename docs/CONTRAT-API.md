# Contrat d'API et pièges de données

Ce que le serveur expose réellement, comment il répond, et les endroits où il ment. **À lire avant
d'écrire un écran** — dans ce dépôt comme dans une reconstruction.

Le backend vit dans `~/cfiprojects/cfibackend` (Express, port **3500**) et le schéma dans
`~/cfiprojects/erp-academique-db` (PostgreSQL ; base de démonstration en Docker, conteneur
`erp-db-demo`, port **5435**).

## 1. Vérifier avant de coder

Lint, tests et build **ne parlent pas au backend**. Ils passent au vert sur un module entier bâti
sur des routes inexistantes — c'est arrivé.

```bash
# Ce que le serveur expose réellement
cat ~/cfiprojects/cfibackend/src/routes/academique/<entité>.routes.js

# La définition d'une vue
docker exec erp-db-demo psql -U erp_user -d erp_academique -c "\sv v_<vue>"

# Et le vérifier en marche : 404 = la route n'existe pas ; 400 = elle existe
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:3500/api/academique/<chemin>
```

Les routes sont protégées. Comptes de démonstration (`admin`, `scolarite`, `pedagogie`…), mot de
passe `Demo@2026` :

```bash
T=$(curl -s -X POST http://localhost:3500/api/auth/login -H 'Content-Type: application/json' \
     -d '{"username":"admin","password":"Demo@2026"}' | python3 -c 'import sys,json;print(json.load(sys.stdin)["data"]["token"])')
curl -s -H "Authorization: Bearer $T" http://localhost:3500/api/academique/classes | head -c 400
```

## 2. L'enveloppe de réponse

Toute réponse réussie a cette forme :

```json
{ "success": true, "message": "…", "data": { … }, "meta": { … } }
```

**La charge utile est toujours dans `data`.** Une liste arrive en `data: [...]`, avec parfois un
`meta` de pagination ou de totaux. Cette règle a un contre-exemple, documenté au §5.

Le client HTTP du projet **déballe l'enveloppe Axios** (`response.data`), pas l'enveloppe métier :
un `api.js` renvoie `{ success, message, data, meta }`, et le store lit `.data`.

### Un 200 ne veut pas dire succès

`POST /academique/modules/assigner` répond **200 avec `success: true`** même quand rien n'a été
assigné : le verdict réel est dans `data.statut` (`SUCCES` | `AVERTISSEMENT` | `ERREUR`).

```json
{ "success": true,
  "message": "Module assigné à la classe avec succès",
  "data": { "statut": "ERREUR",
            "message": "Module introuvable avec le code : NEXISTEPAS" } }
```

**Lire le corps.** Le frontend le fait dans `matieres/constants.js → readAssignationResult()`.
Pire : le message d'erreur serveur est construit par concaténation SQL, et une concaténation avec
`NULL` vaut `NULL` — l'échec peut donc remonter **sans le moindre message**. D'où le libellé de
repli.

## 3. Les quatre formes d'erreur

Le backend renvoie ses erreurs sous quatre formes différentes :

| Forme                        | Exemple                                     |
| ---------------------------- | ------------------------------------------- |
| `data.message`               | `{ "message": "Quota dépassé." }`           |
| `data.error.message`         | `{ "error": { "message": "…" } }`           |
| `data.errors[champ][]`       | `{ "errors": { "email": ["invalide"] } }`   |
| chaîne brute                 | `"Erreur interne"`                          |

Un seul endroit du frontend connaît cette hétérogénéité (`core/api/apiError.js`), et tout ressort
sous une forme unique : `message` lisible, `status`, `fieldErrors`, plus les prédicats
`isUnauthorized` (401), `isNetworkError` (aucune réponse HTTP), `isValidationError` (422 ou
`fieldErrors` non vide).

⚠️ Le serveur **répète souvent le même texte** dans `message` et `error.message` — c'est le cas
chaque fois qu'un contrôleur remonte le message d'une exception métier. Sans comparaison, on
affiche la phrase deux fois, la seconde entre parenthèses.

## 4. Les domaines

| Préfixe          | Ce qu'il sert                                                          |
| ---------------- | ---------------------------------------------------------------------- |
| `/auth`          | connexion, inscription, profil, mot de passe                          |
| `/academique`    | années, cycles, filières, niveaux, classes, semestres, modules, étudiants, inscriptions, salles, imports |
| `/evaluations`   | sessions, épreuves, notes, bulletins, statistiques de résultats       |
| `/gestion`       | concours, épreuves de concours, candidats                             |
| `/finance`       | plans, échéanciers, factures, paiements, rapports                     |
| `/pedagogies`    | enseignants, départements, contrats, attributions, créneaux, maquette |
| `/coordination`  | travaux de recherche, finalistes, soutenances, jurys, PV              |
| `/documents`     | types de documents, demandes, statistiques du guichet                 |
| `/bibliotheque`  | ouvrages, mémoires, statistiques du fonds                             |
| `/assistant`     | questions, conversations, audit, santé, catalogue                     |
| *(racine)*       | `/parametres`, `/utilisateurs`, `/notifications`, `/journaux`          |

L'URL complète est `${VITE_API_URL}/api<préfixe><chemin>`. En conteneur, `VITE_API_URL` est
**vide** : les appels partent en relatif vers `/api/...` et nginx les renvoie au service `api` —
même origine, donc pas de CORS. Sur Render en site statique, il faut au contraire construire avec
l'URL absolue de l'API.

## 5. Chemins doublés, pluriels trompeurs

Ces anomalies sont **ce que le serveur expose**. Les corriger côté backend casserait l'API sans
nécessité ; le frontend les documente là où il les subit.

| Ce qu'on écrirait naturellement          | Ce qu'il faut appeler                                    |
| ---------------------------------------- | -------------------------------------------------------- |
| `/evaluations/evaluations`               | `/evaluations/evaluation` — **singulier**                |
| `/evaluations/evaluations/:id/notes`     | `/evaluations/notes/evaluations/:id/notes`               |
| `/evaluations/notes/:id`                 | `/evaluations/notes/notes/:id`                           |
| `/pedagogies/attributions`               | `/pedagogies/attribution/attributions`                   |
| `/pedagogies/enseignants`                | `/pedagogies/enseignant/enseignants`                     |
| `/pedagogies/schedule/details`           | `/pedagogies/schedule/schedule/details`                  |

Et deux pluriels à ne pas confondre : le domaine des enseignants est `/pedagogies` (**pluriel**) ;
`/pedagogie` n'existe pas — tous les appels de l'ancien code y répondaient 404.

**Trois routes de `/pedagogies/schedule` répondent un tableau brut**, sans l'enveloppe
`{success, data}`. Les stores concernés lisent donc le résultat directement.

## 6. Routes absentes — et ce qui les remplace

| Ce qui n'existe pas                    | Ce qu'on fait à la place                                          |
| -------------------------------------- | ------------------------------------------------------------------ |
| `GET /academique/etudiants/:id`        | `GET /etudiants/:id/complet`                                       |
| `PUT` / `DELETE /academique/etudiants/:id` | rien : on ne modifie ni ne supprime un étudiant. Boutons retirés |
| `DELETE /academique/inscriptions/:id`  | changement de statut (`REJETEE`, `ABANDON`) — la trace est gardée  |
| `GET /gestion/candidats`               | `GET /candidats/concours/:concoursId` — un candidat n'existe que dans un concours |
| `GET /gestion/epreuves`                | `GET /concours/:concoursId/epreuves`                               |
| `POST /evaluations/notes`              | les notes préexistent ; saisie en lot par matricule                |
| `PUT /finance/factures/:id`            | une facture ne se modifie pas, elle s'annule                       |
| `DELETE /utilisateurs/:id`             | désactivation — onze tables désignent un compte pour dire qui a fait quoi |
| `GET /gestion/concours/types`          | la liste des 7 types est figée côté front, à l'image de la table    |
| toute route d'absence / assiduité      | rien. L'écran a été retiré                                          |
| le domaine `/statistiques`             | **supprimé** du backend, code mort (9 requêtes sur 11 échouent). Réécrit sur `/evaluations/resultats` |

## 7. Session et rôles

`POST /auth/login` prend un **`username`**, jamais un `email` : le contrôleur ne cherche que par
`username`. Il répond `{ data: { token, user } }` — le jeton est dans `data`, pas à la racine.

Le rôle arrive **en majuscules** (`"ADMIN"`). Le front le normalise en minuscules en un seul
endroit (`authStore.userRole`).

Les huit rôles, miroir de la contrainte `users_role_check` :

| Code           | Mission                                                          |
| -------------- | ---------------------------------------------------------------- |
| `ADMIN`        | accès complet, y compris paramètres, comptes et audit           |
| `DIRECTEUR`    | publie les notes validées, consulte les bilans                  |
| `SCOLARITE`    | dossiers, inscriptions, validation des notes                    |
| `PEDAGOGIE`    | enseignants, attributions, emplois du temps                     |
| `C_CYCLE`      | suivi pédagogique d'un cycle                                    |
| `FINANCES`     | encaissements, factures, recouvrement                           |
| `ENSEIGNANT`   | saisit et corrige les notes de ses cours                        |
| `GESTIONNAIRE` | vérifie la conformité des grilles, gère les imports             |

> **Le cloisonnement par rôle est celui du serveur.** Les miroirs côté client (capacités de
> l'espace de notes, onglets de l'écran Paramètres, garde ADMIN de l'audit) ne servent qu'à ne pas
> afficher un bouton qui répondrait 403. Ce n'est **pas** une sécurité : le serveur réapplique la
> règle à chaque appel.

Un **401** signifie que le jeton n'est plus valide : purger la session locale *et* le cache, puis
renvoyer vers la connexion — celle de l'espace courant.

## 8. Pièges de données confirmés en base

Ce sont des faits vérifiés, pas des soupçons. Les reproduire dans toute reconstruction.

### 8.1 `pg` sert ses nombres en chaînes

`COUNT`, `SUM` et `NUMERIC` arrivent en chaînes : `nb_etudiants: '9'`, `taux: '45.00'`,
`montant: "575000.00"`. **`'9' + '12'` vaut `'912'`.** Un total faux ne lève aucune erreur : il
s'affiche. Convertir à l'entrée du store (`nombre()` dans `shared/utils/remplissage.js`).

`AVG` d'un ensemble vide vaut `null` — sans garde, un filtre sans résultat affiche « NaN/20 ».

### 8.2 Trois vues à fan-out : leurs agrégats sont faux

`v_organisation_filieres`, `v_organisation_cycles` et `v_dashboard_global_classe` somment
`capacite_max` **après** une jointure sur `inscriptions` : la capacité de chaque classe y est
multipliée par son nombre d'inscrits.

| Vue                         | Capacité annoncée | Capacité réelle |
| --------------------------- | ----------------- | --------------- |
| `v_dashboard_global_classe` | 36 325            | 5 400           |
| `v_organisation_cycles`     | 11 130            | 1 800           |

Tous les taux de remplissage qui en découlent sont faux (~2,45 % partout), et `statut` avec eux.
**Sources saines**, groupées par classe : `v_classes_effectifs` (`GET /classes`) et
`v_organisation_classes` (`GET /classes/stats/organisations`). Les onglets « Organisation » et
« Statistiques » recomposent les agrégats depuis celles-là.

Seul `total_etudiants_inscrits` résiste dans la vue globale : c'est un `COUNT(DISTINCT)`.

### 8.3 Deux comptages d'effectif, deux résultats

`v_classes_effectifs` compte **toutes** les inscriptions de l'année active ;
`v_organisation_classes` ne compte que `ACTIVE` / `VALIDEE`. Écart réel mesuré : **893 contre
832**. Ce n'est pas un bug — c'est deux questions différentes. Dire laquelle on pose.

### 8.4 `/semestres/analytics/dashboard` contient des chiffres inventés

- `taux_assiduite_global` est la constante **`92.4` en dur** ;
- `matrix.moyenne_generale` est un **`RANDOM()`** — valeur différente à chaque appel ;
- `typology` ne renvoie qu'une seule ligne, à 100 % ;
- `llm_summary` n'existe pas.

**Ne rien afficher de tout cela tel quel.**

### 8.5 `GET /semestres/courants/actifs` ment sur son nom

Il renvoie les semestres de l'année académique **active**, pas ceux dont `est_actif` est vrai.

### 8.6 Deux vocabulaires pour les années académiques

| Endpoint                  | Statuts servis                                        |
| ------------------------- | ----------------------------------------------------- |
| `/annees`, `/annees/:id`  | `OUVERTE` · `PLANIFIEE` · `CLOTUREE`                  |
| `/annees/history`         | `active` · `en_preparation` · `terminee` · `archivee` |

L'écart est dans l'API. Le front l'isole dans un seul fichier plutôt que de le laisser se
propager en `switch` dupliqués.

### 8.7 Deux vocabulaires pour les statuts d'inscription

| `GET /inscriptions` | `GET /inscriptions/finances` |
| ------------------- | ---------------------------- |
| `EN_ATTENTE`        | `"en attente"`               |
| `VALIDEE`           | `"validée"`                  |
| `ACTIVE`            | `"active"`                   |
| `REJETEE`           | **`"annulée"`**              |

Le dernier n'est pas qu'une casse : c'est une **traduction**. Et la clé change aussi (`id` contre
`inscription_id`). Normaliser en un seul endroit.

### 8.8 Le schéma, tel qu'il est

- La table `cycle` n'a **pas** de colonne `nom` : seulement `code` et `diplome`.
- Un **niveau** n'a pas de désignation : son `code` (L1, M2) *est* son libellé.
- Un **semestre** n'a pas de niveau.
- `concours.nb_places` n'existe pas.
- `nationalite` est un code ISO sur **deux** lettres (`character(2)`) : « CG », pas « CONGOLAISE ».
- Le chemin d'une pièce justificative doit respecter `^/uploads/.*\.(pdf|jpg|jpeg|png)$` —
  contrainte portée par la **base**, donc un chemin mal formé remonte en erreur SQL brute.

### 8.9 Les contraintes `CHECK` font foi

Aucune migration n'est versionnée pour la partie ancienne du schéma : les énumérations du front
sont relevées **sur les contraintes `CHECK`**, pas devinées. Chaque `constants.js` de module cite
la sienne. En inventer une valeur fait échouer l'écriture en `23514`, que le backend remonte en
500 générique — illisible.

Le recensement complet par module est dans les fiches de [modules/](./modules/).

## 9. Conventions d'écriture des imports

Deux conventions de champ coexistent côté serveur, et il n'y a pas de règle :

| Route                                        | Champ fichier | Autres champs   |
| -------------------------------------------- | ------------- | --------------- |
| `POST /academique/imports/etudiants`         | `file`        | `code_annee` **obligatoire** |
| `POST /academique/imports/tuteurs`           | `file`        | —               |
| `POST /academique/inscriptions/import`       | `fichier`     | `code_annee`    |
| `POST /academique/inscriptions/import-reinscription` | `fichier` | `code_annee`  |
| `POST /gestion/candidats/import`             | `file`        | `concours_id`   |
| `POST /gestion/candidats/import/notes`       | `file`        | `concours_id`   |

Les fichiers désignent toujours les entités par leur **code** (`GI`, `GI-L1`, `INF101`,
`ETU-2024-0001`), jamais par un identifiant : personne ne saisit un UUID dans un classeur. La
résolution code → identifiant se fait à l'envoi, ligne par ligne, et une correspondance
introuvable devient un rejet motivé plutôt qu'un 400 opaque.

## 10. Corrections apportées au backend pendant la refonte

Le dépôt `cfibackend` est **modifiable** quand une route manque ou est cassée. Ce qui a été
corrigé, et qui vaut avertissement pour tout reconstructeur qui repartirait d'un backend plus
ancien :

| Domaine    | Ce qui était cassé                                                                                     |
| ---------- | ------------------------------------------------------------------------------------------------------- |
| modules    | `GET /modules` n'existait pas (404) ; `POST` échouait en SQL 42702 ; `PUT` écrivait dans une colonne inexistante |
| évaluations| 4 routes CRUD sur 5 appelaient des méthodes absentes du modèle → 500 systématique. Filtres `anneeId`/`semestreId` interprétés comme un `sessionId` |
| sessions   | chemin doublé → `PATCH …/etat` répondait 404                                                            |
| notes      | saisie en lot inexistante : une évaluation jamais notée ne pouvait pas l'être                           |
| concours   | `calculer_moyennes_et_rangs` est `RETURNS void` ; le contrôleur prenait ce `NULL` pour un échec → 404 sur un calcul réussi |
| concours   | `POST /candidats/import` **commenté**, contrôleur pourtant implémenté → 404                            |
| concours   | `PUT`/`DELETE /concours/epreuves/:id` visaient un chemin avec `/gestions/` en trop → 404               |
| salles     | table peuplée, **aucune route** ne l'exposait                                                           |
| pédagogie  | tables `schedule`, `maquette_pedagogique`, colonne `heures`, vues `vue_infos_enseignants` / `vue_attributions_cours` / `vue_horaire_details` : créées (migrations 006 à 011) |
| résultats  | le calcul des bulletins (`POST /resultats/classes/:id/bulletins/generer`) n'existait pas : la table restait vide |
| plateforme | `/parametres`, `/utilisateurs`, `/notifications`, `/journaux` : créés (migration 019)                   |
| nouveaux   | `/bibliotheque` (014), `/coordination` (015), `/documents` (016) : domaines créés avec leurs écrans     |
