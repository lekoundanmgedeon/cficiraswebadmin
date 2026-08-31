# Reconstruire ce frontend dans une autre technologie

Ce document s'adresse à une équipe — ou à un agent — qui reconstruirait ce back-office en React,
Next.js, Angular, Nuxt, SvelteKit, Solid ou autre. Il dit **ce qui doit être reproduit**, **ce qui
peut être remplacé librement**, et **dans quel ordre avancer**.

Il ne remplace pas les fiches de [modules/](./modules/) : chacune décrit un module dans le détail
nécessaire à sa reconstruction. Ce document-ci porte ce qui leur est commun.

## 1. Ce qu'est cette application

Un back-office d'ERP académique en régime LMD, pour un établissement d'enseignement supérieur.
Il couvre huit domaines :

| Domaine                   | Ce qu'on y fait                                                                 |
| ------------------------- | --------------------------------------------------------------------------------- |
| **Structure académique**  | Années, cycles, filières, niveaux, classes, semestres — l'ossature de l'école     |
| **Scolarité**             | Étudiants, inscriptions, réinscriptions, dossiers et pièces justificatives        |
| **Évaluations**           | Sessions, épreuves, saisie et validation des notes, bulletins, délibération       |
| **Concours**              | Éditions, épreuves, candidatures, notes, classement, proclamation                 |
| **Finances**              | Plans de paiement, échéanciers, factures, encaissements, recouvrement, rapports   |
| **Pédagogie**             | Enseignants, attribution des cours, créneaux, emploi du temps, maquette           |
| **Coordination**          | Thèmes et mémoires, soutenances, jurys, procès-verbaux, statut des finalistes     |
| **Plateforme**            | Bibliothèque, guichet des documents, paramètres, comptes, notifications, assistant IA |

C'est une **SPA d'administration** : pas de portail étudiant, pas de mobile. La barre latérale
reste visible, réduite à ses icônes quand la place manque ; sous 1024 px la page prend une largeur
minimale et défile horizontalement plutôt que de se disloquer. C'est une limite assumée.

Le backend n'est pas dans ce dépôt. Il est **modifiable** quand une route manque ou est cassée
(c'est arrivé une dizaine de fois — voir [CONTRAT-API.md](./CONTRAT-API.md) §10).

## 2. Ce qui doit être reproduit à l'identique

Ces points ne relèvent pas du choix de pile. Les manquer donne une application qui *paraît*
fonctionner et ment sur ses chiffres, ou qui ferme une modale sur un enregistrement raté.

### 2.1 Le déballage et la normalisation, en un seul endroit

| Invariant                                                                                       | Pourquoi                                                                     |
| ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------ |
| Un client HTTP **par domaine backend**, avec le préfixe en dur                                  | Un `api.js` de module n'écrit alors que des chemins courts                    |
| Le jeton injecté par intercepteur, jamais par l'appelant                                        | Une source unique de vérité pour la session                                   |
| **Le `Content-Type` retiré sur un `FormData`**                                                  | Seul le navigateur connaît la « boundary » du multipart                       |
| **L'enveloppe HTTP déballée** à l'entrée                                                        | Aucun appelant ne doit lire `response.data.data`                              |
| **Toutes les erreurs ramenées à une forme unique** (`message`, `status`, `fieldErrors`)         | Le serveur en produit quatre formes différentes                               |
| Le **401** traité par un point d'accroche que le routeur remplit                                | Sinon le client HTTP importe le routeur, et le cycle d'imports est immédiat   |

### 2.2 Le contrat d'action

> **Une action qui échoue renvoie `undefined` (ou l'équivalent « rien » de votre langage), pas une
> exception, pas `false`.**

L'interface s'y fie partout :

```js
const result = await store.create(form);
if (result !== undefined) close();   // la modale ne se ferme que si ça a vraiment marché
```

Dans une pile à hooks ou à requêtes déclaratives (TanStack Query, RTK Query), c'est l'équivalent
`isSuccess` d'une mutation qui joue ce rôle : ce qui compte est qu'**aucun écran ne conclue au
succès sans preuve**. Le bug d'origine était exactement celui-là — une modale qui affichait
« créée avec succès » puis se fermait après 1,2 seconde, sans rien vérifier.

L'action porte aussi la notification (succès et échec). **Un composant ne notifie pas lui-même**
le résultat d'une action.

### 2.3 Un onglet, une requête

Les onglets ne doivent monter que le panneau actif, et mémoriser ceux déjà visités. Voir
[UI-PARTAGEE.md](./UI-PARTAGEE.md) §1.1 : c'est le principal gain de performance de l'application,
et le motif le plus facile à perdre en reconstruisant avec un composant d'onglets tout fait.

### 2.4 Les conversions et les énumérations

- **`pg` sert `COUNT`, `SUM` et `NUMERIC` en chaînes** : convertir à l'entrée du store, jamais à
  l'affichage. `'9' + '12' === '912'` ne lève aucune erreur — le total faux s'affiche.
- **Les énumérations sont relevées sur les contraintes `CHECK`**, pas inventées. Chaque fiche de
  module porte les siennes. Une valeur inventée fait échouer l'écriture en `23514`, que le backend
  remonte en 500 générique.
- **Deux vocabulaires coexistent** pour les années académiques et pour les statuts d'inscription :
  normaliser en **un seul endroit** par module, pas par des `includes()` disséminés dans les
  composants (c'est ce que faisait l'ancien code, avec quatre variantes divergentes).

### 2.5 Les deux portées de session

L'espace de gestion des notes s'ouvre dans une **fenêtre distincte** et exige sa propre connexion :
son jeton est rangé sous une clé propre, décidée **une fois au démarrage** d'après l'URL. Sans
cela, entrer dans l'espace de notes déconnecterait l'application ouverte dans l'autre fenêtre —
même navigateur, donc même stockage.

L'espace de chat, lui, **partage** la session de l'application : c'est ce qui permet d'y retrouver
ses conversations sans se reconnecter.

### 2.6 Protégé par défaut

> Toute route est protégée. Une route publique se déclare explicitement.

Un oubli doit **fermer** la porte, pas l'ouvrir. L'application d'origine déclarait
`meta: { requiresAuth: true }` sur ses routes mais n'avait **aucune garde** pour le lire : toute
URL interne tapée à la main s'ouvrait sans session.

### 2.7 Ne pas reproduire les quatre cycles entre modules

Le dépôt pose la règle « entre modules, jamais de cycle » — et **ne la tient pas encore** :
`structure-academique ↔ matieres`, `etudiants ↔ scolarite`, `notes ↔ espace-notes`, et
`etudiants → scolarite → finances → etudiants`. Aucun n'est un cycle d'imports ES, mais tous
rendent deux modules inséparables.

Une reconstruction est l'occasion de les défaire. Les trois causes, et leur remède :

| Cause | Remède |
| ----- | ------ |
| un module lit les **libellés** d'un autre (`dossierInfo`, `sexeLabel`, `STATUTS_PUBLIABLES`) | remonter l'énumération dans le domaine qui la possède, ou dupliquer sciemment trois libellés |
| un composant **va chercher une entité dans le store d'un autre module** (`SuiviEtudiant` → `etudiants/store`) | la recevoir en propriété |
| un onglet **monte la modale d'un autre module** (`UesSemestreTab` → `matieres/AssignationModal`) | déplacer la modale, ou lui passer ses référentiels |

Le détail est en [ARCHITECTURE.md](./ARCHITECTURE.md) §2 et
[DETTE-TECHNIQUE.md](./DETTE-TECHNIQUE.md) §7.

### 2.8 Pas de bouton qui ment

Si l'endpoint n'existe pas, si la donnée est fabriquée, si le chiffre vient d'un `RANDOM()` côté
serveur : **retirer l'élément d'interface**. Ne pas afficher un tableau codé en dur en attendant le
backend. La moitié du travail de refonte a consisté à défaire cela.

## 3. Ce que vous pouvez remplacer librement

| Choix actuel                        | Remplaçable par                                                    |
| ----------------------------------- | ------------------------------------------------------------------- |
| Vue 3 `<script setup>`              | n'importe quel framework à composants                              |
| Pinia + `createCrudStore`           | Zustand / Redux Toolkit / signaux / TanStack Query — voir §4        |
| Vue Router                          | le routeur de la pile, avec routage paresseux                      |
| Bootstrap 5 + `mdi` / `bootstrap-icons` | tout système de design                                          |
| ant-design-vue (Table, Tabs)        | rien : deux composants seulement sont enregistrés, peu utilisés    |
| Chart.js + ECharts                  | n'importe quelle bibliothèque de graphiques                        |
| SheetJS / jsPDF / pdfmake           | l'équivalent, ou une génération côté serveur                       |
| Axios                               | `fetch` + une couche d'intercepteurs équivalente                   |

Le balisage Bootstrap n'a **aucune valeur à conserver**. Ce qui compte est la structure d'écran
(§5 de [UI-PARTAGEE.md](./UI-PARTAGEE.md)) et le comportement, pas les classes utilitaires.

## 4. Équivalences de patterns

### La fabrique de store

`createCrudStore({ id, resource, label, cacheKey, state, getters, actions })` produit un store
complet à partir d'une ressource REST. Elle existe parce que la même séquence
`loading = true` → `try` → appel → `notifyError` → `finally` était répétée **jusqu'à quatorze fois
par fichier**, et représentait l'essentiel des 3 391 lignes de l'ancien dossier `stores/`.

| Ici                            | Ailleurs                                                                     |
| ------------------------------ | ------------------------------------------------------------------------------ |
| `createCrudStore`              | une fabrique de slice (RTK) · un `createStore` générique (Zustand) · un ensemble de hooks générés |
| `fetchAll({ force, params })`  | `useQuery(['entité', params])` avec `staleTime`                              |
| `invalidate()`                 | `queryClient.invalidateQueries(['entité'])`                                  |
| `run(call, { success, … })`    | `useMutation({ onSuccess, onError })` — à condition de garder le contrat §2.2 |
| `cacheKey` + TTL               | `staleTime` / `gcTime`, ou un cache local à clés préfixées                    |

⚠️ Le cache ne s'applique qu'à la **liste non filtrée** : une liste filtrée dépend de ses
paramètres et n'a pas la même clé. Et il est **purgé à la déconnexion** — sans cela, les données
d'un utilisateur restent lisibles par le suivant sur le même poste (le bug était réel).

### Les stores qui ne sont pas des CRUD

Six objets métier ne sont **pas** des ressources REST, et leurs stores réimplémentent le contrat
sans la fabrique. C'est une information de conception, pas un accident :

| Objet                       | Pourquoi ce n'est pas un CRUD                                                |
| --------------------------- | ------------------------------------------------------------------------------ |
| Bulletin                    | ne se liste que dans le triplet (classe, semestre, année) ; ne se crée pas — il résulte des notes |
| Note                        | préexiste (une ligne par couple étudiant/évaluation) ; pas de `POST`         |
| Dossier scolaire            | existe déjà pour chaque étudiant ; on agit sur ses pièces                     |
| Candidat de concours        | n'a de sens que dans un concours ; pas de `GET /candidats`                    |
| Épreuve de concours         | vit sous `/concours`, pas sous une ressource à elle                           |
| Demande de document         | se dépose puis **avance dans un circuit** ; ni `PUT` ni édition libre         |

## 5. Le plan de reconstruction

L'ordre suit les dépendances : chaque étape n'a besoin que des précédentes.

### Étape 0 — le socle (aucun écran)

1. Client HTTP par domaine, jeton, déballage, normalisation d'erreur, point d'accroche 401.
2. Fabrique de ressource REST (`list`, `getById`, `create`, `update`, `patch`, `remove`).
3. Fabrique de store, avec le contrat de `run` (§2.2).
4. Routeur protégé par défaut, deux portées de jeton, trois coquilles (application, espace de
   notes, espace de chat).
5. Le socle partagé : onglets paresseux, pagination, export, import, notifications, formats.

C'est l'étape à ne pas bâcler : **tout le reste en dépend, et une erreur ici se répète vingt
fois**. Elle est aussi la mieux couverte par les tests existants.

### Étape 1 — la racine du référentiel

| Module                 | Pourquoi d'abord                                                             |
| ---------------------- | ------------------------------------------------------------------------------ |
| `auth`                 | rien ne s'ouvre sans session                                                  |
| `structure-academique` | presque tous les autres modules affichent ses entités en listes déroulantes    |

Six sous-domaines, quatre onglets chacun : c'est le module qui met le socle à l'épreuve. La fiche
[structure-academique](./modules/structure-academique.md) est la plus détaillée du lot — commencer
par elle.

### Étape 2 — la scolarité

`inscriptions` → `etudiants` → `scolarite` → `matieres`, dans cet ordre : l'annuaire des étudiants
projette les inscriptions, et le dossier scolaire est servi par les routes des étudiants.

### Étape 3 — les évaluations

`examens` → `notes` → `stats`, puis l'`espace-notes`. La chaîne complète est
**session → épreuve → notes → bulletin → délibération → publication**, et il faut l'avoir en tête
avant d'écrire le premier écran : une note appartient à un couple (étudiant, évaluation), jamais à
un triplet (classe, semestre, type) — l'ancien front croyait le contraire, et sa route de saisie
reposait sur un modèle que le serveur ne connaît pas.

### Étape 4 — l'argent et les gens

`finances`, puis `pedagogies`. Les deux plus gros modules, indépendants l'un de l'autre.

### Étape 5 — le reste

`concours`, `coordination`, `documents`, `bibliotheque`, `dashboard`, `parametres`, `assistant`,
`plateforme`. Tous indépendants ; à prendre dans l'ordre qui arrange.

`dashboard` et `stats` en dernier de leur groupe : ils **agrègent** ce que les autres produisent,
et n'ont d'intérêt qu'une fois ceux-ci branchés.

## 6. Comment lire une fiche de module

Chaque fiche de [modules/](./modules/) suit le même plan :

| Section                         | Ce qu'on y trouve                                                            |
| ------------------------------- | ------------------------------------------------------------------------------ |
| **Rôle**                        | ce que le module fait, et ce qu'il ne fait pas                                |
| **Écrans et routes**            | chemin, nom, titre, redirections conservées                                   |
| **Onglets**                     | le contenu de chaque écran, onglet par onglet                                 |
| **Endpoints**                   | méthode, chemin, ce qu'il rend, et ses pièges                                 |
| **Vocabulaire**                 | les énumérations, avec la contrainte `CHECK` dont elles sont le miroir        |
| **État et règles**              | ce que le store retient, ce qu'il dérive, ce qu'il refuse                     |
| **Pièges à reproduire**         | ce qui a déjà mordu — la section à lire en premier si vous êtes pressé        |
| **Checklist de reconstruction** | de quoi cocher, écran par écran                                               |

## 7. Ce qu'il ne faut pas reconstruire

Quatre écrans de `plateforme` (`/administration`, `/documentation`, `/notification`,
`/supports-cours`) **n'ont aucun backend**. Ils affichent un état explicite « pas encore
raccordé ». Leur besoin est réel, mais il n'y a rien à porter : les reconstruire revient à écrire
la même page d'attente. Voir la fiche [plateforme](./modules/plateforme.md).

Ne pas reconstruire non plus :

- l'écran des **absences** — aucune route d'assiduité n'existe côté serveur ;
- le domaine **`/statistiques`** — supprimé du backend, son code est mort (9 requêtes sur 11
  échouent contre le schéma actuel). L'écran a été réécrit sur `/evaluations/resultats` ;
- l'onglet **« Présences »** de l'attribution des cours — son panneau existe, aucun lien n'y mène ;
- le **taux d'assiduité** et la **moyenne générale** de `/semestres/analytics/dashboard` : une
  constante en dur et un `RANDOM()`.

## 8. Ce qu'il faudra décider

Trois points restent ouverts, et une reconstruction est le bon moment pour les trancher :

1. **Harmoniser les deux vocabulaires de statut d'année** (`OUVERTE`/`PLANIFIEE`/`CLOTUREE` contre
   `active`/`en_preparation`/`terminee`/`archivee`). Le front absorbe l'écart ; le backend
   gagnerait à ne plus le produire.
2. **Exposer `types_concours`.** Les sept types sont figés côté front, à l'image de la table, faute
   d'endpoint. Un `GET /concours/types` les rendrait dynamiques.
3. **Corriger les trois vues à fan-out** en base. Le front recompose leurs agrégats depuis des vues
   saines ; le jour où elles sont corrigées, quatre endpoints redeviennent utilisables directement.
