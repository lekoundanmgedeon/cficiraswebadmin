# État de la refactorisation — point de reprise

Document de passation. Il dit **où en est le chantier**, **ce qui reste**, et **comment reprendre**.
À tenir à jour à chaque module migré.

- Branche : `refactor-main` (dernier module migré : `stats`, §1.19 — **il ne reste que les résidus**)
- État de santé : `npm run lint` **0 erreur sur le code migré** · `npm test` **207 tests, 28 fichiers** ·
  `npm run build` **OK**
  Les **2 erreurs** que remonte le lint sont dans du legacy non migré, et déjà répertoriées en §2.3 :
  `views/admin/DataTable.vue:40` (le fichier ne parse pas) et `views/notifications/notification.vue`
  (`<template>` sans élément racine).
- ⚠️ **`matieres`, `examens` et `concours` ont nécessité des corrections dans `cfibackend`.**
  Voir §1.6, §1.9, §1.10 — le dépôt backend porte un commit par module.
- **Endpoints vérifiés contre le backend local** (`localhost:3500`) : toutes les routes appelées par
  les modules migrés répondent, et les flux d'écriture sont exercés pour de vrai (base restaurée
  ensuite). Voir §2.5 — c'est ce contrôle qui manquait et qui avait laissé passer un module entier
  bâti sur des routes inexistantes.

---

## 1. Ce qui est fait

### 1.1 Le noyau `src/core/` — terminé

| Fichier                    | Rôle                                                                                                                                                                                                                               |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api/httpClient.js`        | Client Axios par domaine. Injecte le jeton, **déballe la réponse**, **normalise les erreurs**, expose `onUnauthorized()`. Toutes les méthodes acceptent une config Axios.                                                          |
| `api/apiError.js`          | `ApiError` : forme unique d'erreur (`message`, `status`, `fieldErrors`, `isUnauthorized`, `isNetworkError`, `isValidationError`). Seul endroit qui connaît les 4 formats d'erreur du backend.                                      |
| `api/createResource.js`    | Fabrique REST : `list`, `getById`, `create`, `update`, `patch`, `remove`.                                                                                                                                                          |
| `api/clients.js`           | Un client par domaine : `authClient`, `academiqueClient`, `gestionClient`, `pedagogieClient`, `financeClient`, `evaluationClient`.                                                                                                 |
| `store/createCrudStore.js` | **Pièce maîtresse.** Fabrique de store Pinia : state (`items`, `item`, `meta`, `loading`, `error`), getters (`isEmpty`, `count`, `getById`), actions (`fetchAll`, `fetchById`, `create`, `update`, `remove`, `invalidate`, `run`). |
| `router/index.js`          | Assemble les routes des modules + celles restées en `src/routes/`. Branche la redirection sur 401.                                                                                                                                 |
| `router/guards.js`         | Guard `beforeEach`. **Tout est protégé par défaut** ; une route publique doit porter `meta: { public: true }`.                                                                                                                     |
| `auth/authStore.js`        | Session : login, logout, profil, rôles.                                                                                                                                                                                            |
| `auth/tokenStorage.js`     | Source unique de vérité pour le jeton.                                                                                                                                                                                             |

**Contrat central à connaître** : `run()` renvoie **`undefined` en cas d'échec**. L'UI s'y fie :

```js
const result = await store.create(form.value);
if (result !== undefined) close(); // la modale ne se ferme que si ça a vraiment marché
```

### 1.2 Les partagés `src/shared/` — terminé

**Composants** — `AppTabs` (⚠️ le plus important, voir §1.4), `ItemActions`, `ConfirmModal`,
`EmptyState`, `LoadingSpinner`, `PageHeader`, `PageCard`, `ExportMenu`.

**Composables** — `useTableExport` : remplace le triplet export répété dans 11 fichiers. Les
colonnes sont **dérivées des lignes**, elles ne peuvent plus se désynchroniser. `useImportFile` :
dépôt, lecture SheetJS, validation ligne à ligne, aperçu et gabarit, paramétrés par un schéma —
dont un `validate` facultatif pour les règles propres au module. `usePagination` : découpage,
recadrage quand la collection rétrécit, et retour en première page au changement de filtre.

> #### La pagination, écran par écran
>
> Le découpage était recopié à la main là où il existait — dix lignes par page en dur, sans
> sélecteur de taille, sans décompte, et souvent sans garde-fou : appliquer un filtre depuis la
> page 4 laissait l'utilisateur devant un tableau vide. Ailleurs, les listes étaient rendues d'un
> bloc. Toutes passent désormais par `usePagination` + `components/shared/Pagination.vue` :
>
> | Écran                                                        | Lignes rendues d'un bloc avant |
> | ------------------------------------------------------------ | ------------------------------ |
> | Semestres → Organisation                                     | **810**                        |
> | Examens → Calendrier · Épreuves d'une session                 | **675 à 1 800**                |
> | Classes → Liste, Organisation, Par filière, Par niveau        | 135                            |
> | Cycles, Filières, Niveaux, Semestres (listes et organisation) | 5 à 90                         |
> | Scolarité → Notes officielles, Délibérations, Répartition     | jusqu'à l'effectif d'une classe |
> | Dossier scolaire → Pièces, Situation financière              | quelques lignes                |
> | Imports (étudiants, tuteurs, planning) → lignes rejetées      | autant que le fichier en compte |
> | Finances → Registre des encaissements, Factures, Rapports     | 200 chargées sur 7 497 / 1 803 (§1.16) |
> | Finances → Contrôle par classe, Archives, Suivi des traites   | 135 à 6 223                    |
> | Concours → Candidatures, Saisie des notes, Délibération, Rapports | 132 candidats              |
> | Examens → Rapports (palmarès d'une classe)                    | effectif d'une classe          |
> | Bibliothèque → Catalogue, Mémoires                            | 30 ouvrages · 208 mémoires     |
> | Coordination → Attributions, Suivi, Finalistes, Dossiers, Planning | 208 à 291                 |
> | Diplômes & documents → Demandes en cours, Historique          | 455 demandes                   |
> | Emploi du temps → Par jour, Par cycle & filière               | 1 351 créneaux · 135 classes   |
>
> Restent volontairement sans pagination : le **parcours académique** (trois périodes au plus, dont
> les matières sont un détail interne à chaque carte), le **profil** d'un dossier (un ou deux
> tuteurs), le **catalogue des types de documents** (13 types en trois groupes), la **progression**
> des travaux (des agrégats, pas une liste) et le sélecteur de soutenance des **procès-verbaux**
> (une liste déroulante ne se pagine pas).
>
> Deux découpages méritent l'attention, parce qu'un découpage naïf y aurait détruit du travail ou
> menti :
>
> - **Saisie des notes de concours** et **suivi des travaux** portent des saisies en cours. La
>   pagination ne touche que l'affichage : les valeurs vivent dans un tableau (ou un brouillon)
>   indexé par identifiant, l'enregistrement porte sur **toutes** les lignes modifiées, et le
>   compteur signale celles qui ne sont plus sous les yeux.
> - **Planning des soutenances** : les séances sont groupées par journée, mais une session tient
>   couramment sur **une seule** (208 le même jour en démonstration). Paginer les journées n'aurait
>   rien découpé : ce sont les séances qui le sont, et le regroupement porte sur la page — sans quoi
>   une journée aurait été coupée sans jamais montrer sa suite. L'en-tête dit alors combien de
>   séances sont visibles sur le total de la journée. Couvert par `PlanningTab.test.js`.
>
> **Ce qui reste** : une cinquantaine de tableaux, dans les modules non encore repris de ce point de
> vue — `pedagogies` (le plus gros contingent, une vingtaine), `dashboard`, `stats`, `coordination`,
> `documents`, `bibliotheque`, `espace-notes`, plus quelques isolés (`ExamenList`, `SallesView`,
> `TabEpreuves`, `ResultatsTab`, `ListeAnneesTab`). Les recenser :
>
> ```bash
> for f in $(grep -rl "<table" src/modules --include=*.vue); do
>   grep -q "Pagination" "$f" || echo "$f"
> done
> ```

**Utils** — `cache.js` (TTL + purge), `date.js`, `text.js` (`escapeHtml`, `escapeRegExp`,
`highlight`), `modal.js`, `exportExcel.js`, `exportPDF.js`, `toast.js`.

**Store** — `notificationStore.js` : unifie les 5 fichiers de `stores/messages/`.

### 1.3 Le module `structure-academique` — terminé (6 sous-domaines)

```
src/modules/structure-academique/
├── routes.js       ← les 5 écrans
├── annee/     api.js · store.js · constants.js · composables/ · components/ · views/
├── cycle/     idem
├── filiere/   idem
├── niveau/    idem  (pas de vue propre : onglet des écrans filières / classes / semestres)
├── classe/    idem
└── semestre/  idem
```

Stores : **1 145 lignes → 400**. Écrans : **1 requête au chargement au lieu de 4–5**.

**Ajout depuis la migration — l'onglet « Statistiques » des filières.** Il n'affichait que deux
compteurs (`nb_etudiants`, `nb_classes`) pour **une** filière choisie dans une liste déroulante :
ni vue d'ensemble, ni graphique, et la capacité — pourtant servie par `v_organisation_filieres` —
n'apparaissait nulle part. Il croise désormais les deux lectures disponibles dans le getter
`filieresEnrichies` (`GET /filieres` pour l'identité et les classes, `GET /filieres/stats/organisations`
pour la capacité et l'effectif ; **aucune route backend n'a été touchée**) et en tire :

- quatre indicateurs de tête (filières actives, inscrits, remplissage global, places disponibles) ;
- trois graphiques Chart.js — effectifs des filières actives, répartition par cycle, taux de
  remplissage — détruits au démontage, tracés par un **seul** déclencheur (les deux lectures
  arrivant en parallèle, un tracé par lecture en aurait construit six pour en afficher trois) ;
- des diagnostics dérivés (`analysesFilieres`) : saturation, filières sans classe, concentration
  des effectifs, capacité sous-utilisée. Chaque constat naît d'un test sur les données et disparaît
  avec la situation qu'il décrit — rien n'y est écrit d'avance.

Les seuils (`SEUILS`, `filiere/constants.js`) servent à la fois aux couleurs et aux diagnostics :
une barre verte ne peut pas accompagner une alerte rouge. Couvert par `filiere/store.test.js`
(8 tests) et `StatistiquesTab.test.js` (6 tests) — les deux vues servant leurs compteurs en
chaînes, les tests verrouillent l'addition, qui sinon concatène en silence.

**Ajout depuis la migration — les onglets « Par filière » et « Par niveau » des classes.** Ils
servaient les annuaires des deux autres écrans : on y administrait des filières et des niveaux,
jamais des classes. Un composant unique (`ClassesFiltreesTab.vue`, monté deux fois avec une prop
`dimension`) filtre désormais les classes sur la dimension choisie, avec effectifs, capacités,
taux de remplissage par classe et cumuls de la sélection.

> Le filtre est appliqué **en mémoire**, et c'est délibéré. `GET /classes/filiere/:id` et
> `GET /classes/niveau/:id` existent, mais lisent `v_classes_par_filiere` / `v_classes_par_niveau`,
> qui ne sont que `classe.*` plus une étiquette : **aucun `nb_etudiants`**. Les employer afficherait
> un effectif de 0 partout — un chiffre faux plutôt qu'un chiffre absent. `GET /classes`
> (`v_classes_effectifs`) porte `filiere_id`, `niveau_id` *et* l'effectif de l'année active. Second
> motif : `fetchByFiliere()` / `fetchByNiveau()` **remplacent `items`**, la collection que lit aussi
> l'onglet « Liste des classes » — filtrer ici l'aurait amputée là-bas.

**Ajout depuis la migration — l'onglet « Unités d'enseignement » des semestres, en remplacement de
« Niveaux ».** Un semestre n'a pas de niveau : la table `semestre` ne porte qu'un code, une année et
deux dates. L'onglet cède la place à ce qui est réellement enseigné pendant le semestre
(`ModuleClasse` : module × classe × semestre), classe par classe, avec cumul des crédits et du
volume horaire, détachement d'une UE et rattachement via `AssignationModal` — dépendance dirigée
`semestre → matieres`, déclarée, comme `stats → examens` (§1.11). Trois pièges du domaine y sont
absorbés :

- **« semestre actif » a deux sens** : `GET /semestres/courants/actifs` ne renvoie pas les semestres
  dont `est_actif` est vrai, mais tous ceux de l'**année académique active** — le nom de la route
  ment. L'écran affiche le périmètre réel et signale à part le semestre en cours ;
- **la liste des classes ne vient pas des configurations** : `v_semestre_configurations` est bâtie
  `FROM ModuleClasse`, donc une classe n'y apparaît qu'*après* sa première UE. S'en servir comme
  sélecteur interdirait précisément de rattacher cette première UE. Les classes viennent de
  `GET /classes` ; les configurations disent seulement lesquelles sont déjà pourvues ;
- **`v_module_classe_semestres` parle un autre vocabulaire** que `GET /modules` (`libelle`,
  `credits`, `heures` contre `designation`, `credit`, `volume_horaire`) : les deux graphies sont lues.

Couverts par `ClassesFiltreesTab.test.js` (5 tests) et `UesSemestreTab.test.js` (5 tests). Là encore,
**aucune route backend n'a été touchée**.

**Ajout depuis la migration — les onglets « Statistiques » des cycles, des classes et des semestres,
et la pagination de tous les tableaux de l'écran.**

> #### ⚠️ Trois vues SQL servent des agrégats faux
>
> Découvert en lisant les définitions en base (`\sv`), puis vérifié chiffre par chiffre :
> `v_organisation_cycles`, `v_organisation_filieres` et `v_dashboard_global_classe` somment
> `classe.capacite_max` **après** une jointure sur `inscriptions`. Chaque classe y compte donc autant
> de fois qu'elle a d'inscrits, et la capacité est multipliée d'autant.
>
> | Vue                         | Capacité annoncée | Capacité réelle | Conséquence                      |
> | --------------------------- | ----------------- | --------------- | -------------------------------- |
> | `v_dashboard_global_classe` | 36 325 places     | 5 400           | taux d'occupation 2,5 % au lieu de 15 % |
> | `v_organisation_filieres`   | 2 370 (une filière) | 360           | 2,45 % de remplissage pour **toutes** les filières |
> | `v_organisation_cycles`     | 11 130 (un cycle) | 1 800           | idem, et un `statut` qui en découle |
>
> **Le correctif est côté base** — il n'a pas été appliqué ici. En attendant, les écrans des cycles et
> des classes recomposent leurs agrégats depuis `v_organisation_classes`
> (`GET /classes/stats/organisations`), groupée **par classe** : sa capacité est une constante du
> groupe, jamais sommée en travers d'une jointure, et elle porte cycle, filière, niveau et statut. Un
> avertissement est posé sur les deux endpoints désormais inutilisés (`cycle/api.js`,
> `classe/api.js`). **L'onglet « Organisation » des filières lit toujours la vue fautive** : sa
> colonne « Taux de remplissage » reste fausse tant que la base n'est pas corrigée, et le dit.

| Onglet                      | Avant                                                                                                                                   | Après                                                                                                          |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Cycles → Statistiques       | tableau plat de `/cycles/stats/distribution`, colonne « Actif/Inactif » redondante, et un `cycle_nom` **absent de toute vue** → libellé de secours partout | 4 indicateurs, 3 graphiques, diagnostics dérivés, détail paginé et exportable                                  |
| Cycles → Organisation       | capacité et taux issus de la vue fautive ; « Filières disponibles » affichait le **nombre** `3` dans un badge, la colonne étant traitée comme une liste | agrégats sains, filières réellement nommées, recherche + pagination                                            |
| Classes → Statistiques      | 4 compteurs de `/classes/analytics/dashboard-global`, dont **3 faux**, plus une barre de progression                                     | indicateurs recomposés, agrégation au choix par cycle / filière / niveau, paliers de remplissage, diagnostics   |
| Classes → Organisation      | **135 lignes d'un bloc** ; filtre de statut proposant `VIDE` (que la vue ne produit jamais) et omettant `COMPLÈTE`                       | pagination, options de filtre déduites des données, export                                                     |
| Semestres → Statistiques    | sélecteur d'année **calculé sur la date du jour**, limité à deux exercices ; 3 valeurs fabriquées affichées ; matrice de 90 lignes d'un bloc | années issues de `GET /annees`, valeurs fabriquées retirées, matrice paginée, recherche et filtre par semestre |
| Semestres → Organisation    | **810 cartes d'un bloc**, aucun filtre par année                                                                                        | pagination et filtre par année académique                                                                      |

> #### ⚠️ `/semestres/analytics/dashboard` contient des chiffres inventés
>
> | Champ                        | Ce qu'il vaut réellement                                                        |
> | ---------------------------- | -------------------------------------------------------------------------------- |
> | `kpis.taux_assiduite_global` | la constante `92.4`, écrite en dur dans `get_kpis_analytics`                     |
> | `matrix[].moyenne_generale`  | `AVG(12.5 + RANDOM() * 3)` — **une autre valeur à chaque appel**                  |
> | `typology`                   | une seule ligne, sans `GROUP BY` : toujours « 100 % »                            |
> | `llm_summary`                | **n'est pas dans la réponse** — l'encadré affichait toujours son message de repli |
>
> Aucune table de présence n'existant en base, l'assiduité **ne peut pas** être calculée. Les quatre
> sont retirés de l'écran ; ce qui les remplace (conformité des maquettes, volume moyen par UE,
> répartition par semestre et par filière) est déduit de la matrice, qui, elle, est réelle.

Trois pièges transverses sont désormais tenus par des tests : `pg` sert ses `COUNT` et `NUMERIC` en
**chaînes** (`'40' + '35'` vaut `'4035'`), `v_organisation_classes` **arrondit** son `taux` à l'entier
(recalculé ici, sinon toute moyenne dérive), et `semestre_id` **se répète** d'une filière à l'autre
dans la matrice (donc inutilisable comme clé de liste).

Mutualisé au passage : `shared/utils/remplissage.js` (conversion, seuils, palette, couleurs, formats —
les repères nés dans `filiere/constants.js`, qui les réexporte) et
`shared/composables/usePagination.js`, qui remplace le triplet `slice`/`pageCount`/garde-fou recopié
dans chaque onglet, avec un retour en première page au changement de filtre. Les **11 tableaux** de
l'écran passent sur `components/shared/Pagination.vue`, y compris les deux qui paginaient à la main
sans sélecteur de taille ni décompte.

+41 tests (`usePagination`, `useCycleStatistiques`, `useClasseStatistiques`, `useSemestreAnalytique`,
et le montage des trois onglets refondus). **Aucune route backend n'a été touchée** ; les endpoints
appelés ont été exercés contre `localhost:3500`, les trois années comprises.

### 1.4 Le module `etudiants` — terminé

```
src/modules/etudiants/
├── routes.js · api.js · store.js · constants.js
├── composables/  useEtudiantForm.js · useEtudiantFilters.js
├── components/   EtudiantTabs · EtudiantFormModal · EtudiantInfosTab · EtudiantParcoursTab
│   └── tabs/     Liste · ParClasse · Repartition · Statistiques · Import · Export
└── views/        EtudiantsView.vue · EtudiantDetailView.vue
```

**Ce module n'avait jamais affiché un seul vrai étudiant.** Quatre de ses six onglets, ainsi que
la vue racine, servaient des tableaux codés en dur ; le store n'exposait ni `items` ni `fetchAll`,
donc aucun écran ne _pouvait_ charger de liste. 3 634 lignes → 2 631, et tout est branché sur l'API.

| Onglet       | Avant                                                                                                                                                         | Après                                                                                                                         |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Liste        | 20 étudiants en dur, `@edit` → `console.log`                                                                                                                  | annuaire projeté depuis `GET /inscriptions` (voir l'encadré)                                                                  |
| Par classe   | appelait `fetchEtudiantsByClasseFiliereAnnee` et lisait `filteredEtudiants` — **ni l'un ni l'autre n'existait** dans le store → `TypeError` au premier filtre | `fetchAll({ params })`                                                                                                        |
| Organisation | groupes pédagogiques inventés, `setTimeout`, aucun backend                                                                                                    | **remplacé** par « Répartition » : effectifs et taux de remplissage réels (`nb_etudiants` / `capacite_max` de `GET /classes`) |
| Statistiques | 4 étudiants en dur, `Chart` jamais détruit                                                                                                                    | dérivées de l'annuaire réel ; instances détruites au démontage                                                                |
| Import       | fichier **vide**, et son onglet n'avait aucun lien de nav → inatteignable                                                                                     | `POST /imports/etudiants`                                                                                                     |
| Export       | 3 étudiants en dur ; `data-io/ExportData.vue` appelait `XLSX` **sans l'importer** → plantait au clic                                                          | Excel / PDF / CSV via `useTableExport`                                                                                        |

> ### ⚠️ La ressource `/etudiants` reste incomplète
>
> **Cet encadré a changé en cours de chantier.** Au moment de la migration, `GET /etudiants`
> n'existait pas (404) : l'annuaire était projeté depuis `GET /inscriptions`, faute de mieux. La
> route a **depuis été ajoutée côté backend** (commit `2a39cdd`), et le module a été recâblé —
> voir **§1.8**.
>
> Ce qui manque **toujours**, vérifié par curl :
>
> | Route                   | État                                                                        |
> | ----------------------- | --------------------------------------------------------------------------- |
> | `GET /etudiants`        | ✅ existe (identité complète : sexe, téléphone, filière, statut de dossier) |
> | `GET /etudiants/:id`    | ❌ **404** — le détail passe par `/:id/complet`                             |
> | `PUT /etudiants/:id`    | ❌ **404** — on ne peut pas modifier un étudiant                            |
> | `DELETE /etudiants/:id` | ❌ **404** — ni le supprimer                                                |
>
> Les boutons « Modifier » et « Supprimer » ont donc été retirés : mieux vaut pas de bouton qu'un
> bouton qui ment. `GET /etudiants` ne porte par ailleurs **ni classe ni année académique** — un
> étudiant appartient à une _filière_, sa _classe_ vient de son _inscription_.

La fiche détail déclarait **4 onglets pour 2 panneaux** (« Tuteur » et « Dossier complet »
pointaient sur un `#sales2` inexistant), trois `<li>` partageaient le même `id`, et
`etudiant.value = response` ne déballait pas l'enveloppe `{ success, data }` — la fiche lisait donc
`enveloppe.nom`, toujours `undefined`. Son onglet « Fiche académique » affichait enfin des champs
d'agent (grade, fonction, unité de service) étrangers au modèle étudiant : il cède la place au
**parcours académique**, dont l'endpoint (`GET /etudiants/:id/parcours`) existait depuis toujours
sans qu'aucune vue ne l'appelle.

Le bouton « Générer un rapport » de l'en-tête a été retiré : sa modale attendait 1,8 s
(`setTimeout`) puis notifiait « Rapport généré et téléchargé avec succès » **sans appeler la moindre
API ni produire de fichier**. L'onglet Export fait désormais réellement ce qu'elle prétendait faire.

`useEtudiantFilters` unifie le triplet année/filière/classe recopié dans 4 fichiers. Les trois
d'entre eux qui appelaient `classeStore.fetchClassesByFiliere()` à chaque changement de filière
**écrasaient `items` du store des classes**, un état partagé par toute l'application ; les classes
sont maintenant chargées une fois (depuis le cache) puis filtrées en mémoire. Attention :
`listerInscriptions` ne lit que `annee_academique_id`, `classe_id` et `statut` dans la query
string — **la filière n'est pas un filtre serveur** et s'applique côté client.

### 1.5 Le module `inscriptions` — terminé

```
src/modules/inscriptions/
├── routes.js · api.js · store.js · constants.js · constants.test.js
├── composables/  useImportFile.js
├── components/   InscriptionTabs · ImportModal · PaiementModal · ReinscrireModal
│                 InscriptionDetailsModal · ClasseEtudiantsModal
│   └── tabs/     Liste · Classes · Reinscriptions · Paiements · Statistiques
└── views/        InscriptionsView.vue
```

`GET /inscriptions` est la **source de vérité des étudiants** de toute l'application : c'est de là
que `modules/etudiants` tire son annuaire. 4 344 lignes → 3 040.

| Onglet           | Avant                                                                                                                                                                                                                     | Après                                                                                                                                                         |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Inscriptions     | « Détails » posait un état **sans monter la moindre modale** ; « Supprimer » appelait `store.removeInscription` — action absente du store _et_ sans endpoint                                                              | détail réel ; sortie de dossier par **changement de statut** (`PATCH /:id/statut`)                                                                            |
| Gestion classes  | « Importer des étudiants » → `openImport()`, **fonction jamais définie** ; « Imprimer » et « + Nouvelle classe » sans `@click`                                                                                            | capacité, taux de remplissage, étudiants d'une classe                                                                                                         |
| Réinscriptions   | lisait `candidatsPourReinscription` et appelait `fetchCandidatsReinscription()` — **ni l'un ni l'autre n'existait** ; un garde `typeof === 'function'` masquait l'appel manquant, la liste restait vide **en permanence** | candidats = étudiants sans inscription sur l'année cible, dérivés de `GET /inscriptions` ; réinscription **unitaire** réelle (`POST /inscriptions`) et en lot |
| Frais paiements  | `validerInscription` et `imprimerRecu` définies mais **appelées par aucun bouton**                                                                                                                                        | validation / rejet via la modale de dossier                                                                                                                   |
| Rapports & Stats | **100 % maquette** : « 1 284 inscriptions », « 12.5M FCFA », barres figées `[40, 60, 45, …]`, « Générer PDF » → `console.log`                                                                                             | KPI, graphiques et export **dérivés des données réelles**                                                                                                     |

Les deux modales d'import (500 + 429 lignes) ne différaient que par leurs colonnes obligatoires :
elles fusionnent en un `ImportModal` piloté par `IMPORT_SCHEMAS`. Celle des réinscriptions était de
toute façon inopérante — elle appelait `bulkImportReinscriptions()`, **action absente du store**.

**Quatre composants orphelins** supprimés (`Etudiants.vue`, `candidats.vue`, `concours.vue`,
`details/ItemActions.vue`) : données simulées, importés par aucun fichier.

#### Le piège des deux vocabulaires de statut

`GET /inscriptions` et `GET /inscriptions/finances` ne parlent pas la même langue — et l'écart ne
se limite pas à la casse. Relevé **en croisant les deux endpoints sur les mêmes identifiants** :

| `/inscriptions` | `/inscriptions/finances`             |
| --------------- | ------------------------------------ |
| `EN_ATTENTE`    | `"en attente"`                       |
| `VALIDEE`       | `"validée"`                          |
| `ACTIVE`        | `"active"`                           |
| `REJETEE`       | **`"annulée"`** ← et non « rejetée » |

L'ancien code absorbait l'écart par des `includes('VALI')` disséminés dans quatre composants.
Tout passe désormais par `normalizeStatut()`, **couvert par un test** (`constants.test.js`) : sans
l'alias `ANNULEE → REJETEE`, un dossier rejeté s'affiche « Inconnu » et son filtre ne le remonte
jamais. Les statuts acceptés **en écriture** sont `EN_ATTENTE`, `VALIDEE`, `REJETEE`, `ACTIVE`,
`ABANDON`, `DIPLOME`, `EXCLU` (`inscription.controller.js` → `statutsValides`).

### 1.6 Le module `matieres` — terminé (et son backend réparé)

```
src/modules/matieres/
├── routes.js · api.js · store.js · constants.js
├── composables/  useModuleForm.js
├── components/   ModuleTabs · ModuleFormModal · AssignationModal
│   └── tabs/     ListeModules · Configuration
└── views/        ModulesView.vue
```

908 lignes → 1 351 (le module fait beaucoup plus qu'avant : il fonctionne).

**L'écran n'existait pas, en pratique.** `views/matieres/` n'était référencé par **aucune route ni
aucun lien de menu** : strictement inaccessible. Et s'il l'avait été, il aurait **planté au
montage** — `ModuleList.vue` lisait `moduleStore.modules` et appelait `fetchModules()`, **ni l'un
ni l'autre n'existant** dans le store : `filteredModules` valait `undefined`, puis `.slice()` levait
un `TypeError`. Il est désormais routé (`/modules`) et présent dans la barre latérale.

Autres défauts : `AModuleList.vue` était une copie quasi identique de `ModuleList.vue` (148 lignes
contre 155) ; les 4 boutons d'export étaient des `console.log` + `// TODO` ; le bouton « + Ajouter »
ouvrait une modale `#exampleModal` **jamais montée** ; `DetailItem.vue` importait `getModuleById`,
**fonction absente** de `moduleApi.js` ; la vue déclarait **deux blocs `<style scoped>`**, dont un
redéfinissant `body` (sans effet en _scoped_).

> #### ⚠️ Le CRUD backend des modules était entièrement cassé
>
> Découvert en lisant `cfibackend/src/routes/academique/module.routes.js`, puis confirmé par curl :
>
> | Route              | État trouvé                                                                                                                                                                              |
> | ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
> | `GET /modules`     | **404** — la route n'existait pas. Six modules en base, aucun moyen de les lire.                                                                                                         |
> | `POST /modules`    | **cassé** — SQL 42702 (`RETURNING id` ambigu dans `creer_module`). De plus, son `INSERT … SELECT … FROM enseignants` **n'insérait rien** quand le responsable était absent — en silence. |
> | `PUT /modules/:id` | **cassé** — écrivait `SET credits` et `SET responsable_code`, **colonnes inexistantes** (la table a `credit` et `responsable_id`). Et une MàJ partielle levait un `TypeError`.           |
> | `llm_summary`      | lisait `data.credits` → « crédité de **0** crédits » pour tous les modules.                                                                                                              |
>
> Réparé dans `cfibackend` (commit dédié) : ajout de `GET /modules`, `createModule` réécrit en
> `INSERT` clair — abandonnant la fonction Postgres cassée, et rendant le responsable **réellement**
> facultatif —, `updateModule` sur liste blanche de colonnes. **+3 tests**. Les 11 échecs de la suite
> backend préexistaient et sont inchangés.

#### Deux pièges d'API à connaître

**1. `POST /modules/assigner` répond `200 / success: true` même quand il échoue.** Le vrai verdict
est dans le corps, et il compte **trois** valeurs :

| `data.statut`   | Sens                                                   |
| --------------- | ------------------------------------------------------ |
| `SUCCES`        | l'affectation est créée                                |
| `AVERTISSEMENT` | elle existait déjà — **rien n'est inséré**             |
| `ERREUR`        | module, classe, semestre **ou enseignant** introuvable |

L'ancien store notifiait « Module assigné avec succès » dans les trois cas.
`readAssignationResult()` (`constants.js`) lit le corps.

**2. L'enseignant est obligatoire pour rattacher un module** — rien ne le laisse deviner : le
paramètre est accepté à `null` et la requête répond 200. Mais la fonction Postgres refuse
l'affectation sans matricule, et son message d'erreur, construit par concaténation SQL avec ce
paramètre nul, **remonte vide** (`message: null`). Le formulaire l'exige donc côté client.

Il est saisi au **matricule** plutôt que choisi dans une liste, car aucun endpoint ne permet de
lister les enseignants : voir §2.5, point 6.

### 1.7 Le module `scolarite` — terminé

```
src/modules/scolarite/
├── routes.js · api.js · store.js · constants.js
├── components/   AjoutPieceModal
│   └── tabs/     Profil · Parcours · SituationFinanciere · Pieces
└── views/        DossiersView.vue · DossierDetailView.vue
```

2 279 lignes (12 fichiers `parcours/` + `absence/`) → 1 594, et **tout est branché sur l'API** —
ce qui n'était le cas d'aucune ligne auparavant.

**Les douze fichiers étaient simulés, sans exception.** `DossierView` affichait trois étudiants
codés en dur avec des filtres alimentés par des tableaux littéraux ; `DossierAcademique` fabriquait
son étudiant après un `setTimeout(800)` — « _Faux délai_ », disait le commentaire ; les cinq
onglets servaient des `ref([...])`. `Parcours.vue` était orphelin.

| Onglet                     | Avant                             | Après                                                                             |
| -------------------------- | --------------------------------- | --------------------------------------------------------------------------------- |
| Profil                     | `ref({...})` en dur               | `GET /etudiants/:id/complet` — identité **et tuteurs**                            |
| Parcours académique        | `historique` en dur               | `GET /etudiants/:id/parcours` — l'endpoint existait, **aucune vue ne l'appelait** |
| Situation financière       | `paiements` + `echeancier` en dur | projeté depuis `GET /inscriptions/finances`                                       |
| Pièces justificatives      | `documents` en dur                | `pieces[]` + dépôt + validation / rejet                                           |
| ~~Assiduité & Discipline~~ | `absences` + `sanctions` en dur   | **retiré** — aucun backend (voir ci-dessous)                                      |

#### L'écran Absences a été supprimé

`AbscenceView.vue` (353 lignes) prétendait enregistrer une feuille d'émargement. En réalité :

```js
console.log('Données envoyées :', payload);
setTimeout(() => {
  alert("Fiche d'émargement enregistrée avec succès !");
}, 1000);
```

Un `console.log`, une seconde d'attente, et un message de succès — **sans rien envoyer**. Et pour
cause : **aucune route d'absence n'existe dans le backend**, dans aucun domaine. L'écran et son
onglet ont été retirés plutôt que d'entretenir l'illusion d'un suivi d'assiduité. Le besoin est
consigné en §2.5.

#### Les énumérations viennent des contraintes SQL

Aucun script de migration n'est versionné dans le dépôt backend : les valeurs autorisées ne vivent
que dans les contraintes `CHECK` de la base. Elles ont été relevées là, et non devinées :

| Champ                       | Valeurs                                                                      |
| --------------------------- | ---------------------------------------------------------------------------- |
| `dossiers.statut_dossier`   | `INCOMPLET`, `COMPLET`, `VERIFIE`, `REJETE`                                  |
| `pieces_dossier.statut`     | `EN_ATTENTE`, `VALIDE`, `REJETE`                                             |
| `pieces_dossier.type_piece` | `DIPLOME`, `ATTESTATION_REUSSITE`, `ACTE_NAISSANCE`, `RELEVE_NOTES`, `AUTRE` |
| `pieces_dossier.chemin`     | doit vérifier `^/uploads/.*\.(pdf\|jpg\|jpeg\|png)$`                         |

Cette dernière contrainte est portée par la **base**, pas par le contrôleur : un chemin mal formé
remonte donc en erreur SQL brute (« _new row violates check constraint_ »), illisible pour
l'utilisateur. Le formulaire valide en amont. Deux autres pièges : le dépôt d'une pièce **n'est pas
un envoi de fichier** (l'endpoint attend un _chemin_ vers un fichier déjà présent sur le serveur),
et le **rejet exige un motif** — 400 sans lui.

### 1.8 Le module `etudiants`, recâblé sur `GET /etudiants`

`GET /etudiants` **existe désormais** (commit backend `2a39cdd`), et renvoie l'identité complète :
`sexe`, `telephone`, `date_naissance`, `ville`, `filiere_nom`, `dossier_id`, `statut_dossier`.
Le contournement mis en place faute de mieux — projeter l'annuaire depuis `GET /inscriptions` — a
donc été retiré, et ce qu'il avait fallu abandonner est rétabli : **colonne Genre, filtre par sexe,
répartition Hommes/Femmes**.

Ce qui reste vrai :

- **ni `PUT` ni `DELETE /etudiants/:id`** (404) : toujours pas de modification ni de suppression.
  Le store échoue explicitement plutôt que d'émettre une requête vouée au 404 ;
- **pas de `GET /etudiants/:id`** non plus : le détail passe par `/:id/complet` ;
- `GET /etudiants` ne porte **ni classe ni année académique**. Un étudiant appartient à une
  _filière_ ; sa _classe_ est un fait d'**inscription**. L'onglet « Par classe » interroge donc les
  inscriptions — ce n'est pas un contournement, c'est le bon modèle.

La **fiche étudiant a été supprimée** : elle affichait la même chose que le dossier scolaire, en
moins riche. `/etudiants/:id` **redirige** vers `/dossiers-scolaires/:id`, ce qui ne casse aucun
lien.

### 1.9 Le module `examens` — terminé (et son backend réparé)

```
src/modules/examens/
├── routes.js · constants.js
├── components/   ExamenHeader.vue
├── session/      api.js · store.js · composables/ · components/ · views/PlanificationView
├── epreuve/      api.js · store.js · composables/ · components/ · views/PlanExamenView
├── salle/        api.js · store.js · composables/ · components/ · views/SallesView
├── bulletin/     api.js · store.js · views/RapportsView
└── calendrier/   components/ · views/CalendrierView
```

4 201 lignes → 2 965. **Le design a été préservé** : les templates, la mise en page et les
composants visuels sont ceux de l'original. Ce qui change, c'est ce qu'il y a dessous.

| Écran                   | Avant                                                                                                                                 | Après                                                          |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| Planification           | **réel** (seul du module)                                                                                                             | + édition d'une session, + changement d'état                   |
| Épreuves (`PlanExamen`) | **593 lignes, tout simulé** : session, filières, classes, modules codés en dur ; les épreuves composées n'étaient envoyées nulle part | `GET/POST/PUT/DELETE /evaluation`                              |
| Calendrier              | 7 fichiers simulés ; l'onglet « Rattrapage » rendait **rien** (`CalendrierRappel.vue` était vide)                                     | épreuves réelles, triées sur `date_prevue`                     |
| Salles                  | « 5 salles de 20 places » **inventées** ; la table `salles` existait sans qu'aucune route ne l'expose                                 | vraies salles, chacune avec **sa** capacité                    |
| Rapports                | affichait des **formateurs** codés en dur dans un « rapport d'examens », après un `setTimeout(3000)`                                  | palmarès d'une classe (`GET /resultats/classes/:id/bulletins`) |

> #### ⚠️ Le CRUD des épreuves n'avait jamais fonctionné
>
> `evaluation.controller.js` appelait **cinq méthodes absentes de son modèle** :
>
> | Le contrôleur appelait         | Le modèle expose               | Conséquence                                                                            |
> | ------------------------------ | ------------------------------ | -------------------------------------------------------------------------------------- |
> | `createEvaluation`             | `create`                       | **`POST` échouait toujours**                                                           |
> | `getEvaluationById`            | `findById`                     | **`GET /:id` échouait toujours**                                                       |
> | `updateEvaluation`             | `update`                       | **`PUT` échouait toujours**                                                            |
> | `deleteEvaluation`             | `delete`                       | **`DELETE` échouait toujours**                                                         |
> | `findAll(anneeId, semestreId)` | `findAll(sessionId, moduleId)` | les filtres **mentaient** : un `?anneeId=…` était lu comme un identifiant de _session_ |
>
> Quatre routes sur cinq levaient un `TypeError`, masqué en 500 générique. Seul `GET /evaluation`
> répondait — en filtrant sur autre chose que ce qu'il annonçait.
>
> #### Deux autres bugs backend
>
> - **La route de changement d'état des sessions était doublée.** Déclarée
>   `router.patch('/sessions-evaluations/:id/etat')` dans un routeur _déjà_ monté sur
>   `/sessions-evaluations`, elle vivait en réalité à
>   `/evaluations/sessions-evaluations/sessions-evaluations/:id/etat`. Le frontend appelait la
>   version simple et recevait un **404** : le changement d'état n'a jamais pu aboutir.
> - **La table `salles` n'était exposée par aucune route.** Seul `pedagogie/schedule.controller.js`
>   la lisait, et `/pedagogie` est désactivé. D'où l'écran qui inventait ses salles. CRUD ajouté
>   (`/api/academique/salles`), **+8 tests**.
>
> Les 11 échecs de la suite backend préexistaient et sont inchangés (73 passent, +8).

#### Les énumérations viennent des contraintes SQL

| Champ                     | Valeurs                              |
| ------------------------- | ------------------------------------ |
| `evaluations.type_eval`   | `CC`, `TP`, `EXAMEN`, `PROJET`       |
| `evaluations.ponderation` | `> 0` et `<= 100`                    |
| `sessions.etat`           | `INACTIVE`, `ACTIVE`, `ARCHIVE`      |
| `salles.type`             | `Amphi`, `Cours`, `TD`, `TP`, `Labo` |

L'ancien `PlanExamen.vue` proposait `CC`, **`NORMAL`** et **`RATTRAPAGE`** comme types d'épreuve :
les deux derniers sont des types de _session_, et les enregistrer aurait violé la contrainte. Le
formulaire de session offrait de son côté un état **« Brouillon »**, qui n'a jamais existé.

#### Autres défauts corrigés

- Les deux `HeaderView.vue` (calendrier et salles) étaient **deux copies du même fichier**, et
  toutes deux appelaient `fetchCalendarEvents()` — **jamais définie, jamais importée**. Cliquer
  « Actualiser » levait un `ReferenceError` sur les deux écrans.
- `ExamenList` : `@edit` visait `#editExamModal`, **une modale inexistante**, et se contentait d'un
  `fetchSessionById()` sans rien afficher. `exam.etat.toLowerCase()` était appelé sans garde : un
  état nul faisait planter le rendu de la ligne.
- `AddSession` fermait sa modale **même en cas d'échec** (l'ancien store avalait ses erreurs, donc
  l'`await` réussissait toujours).
- `Examens.vue` empilait la planification et le calendrier dans une page dotée d'un « + Ajouter »
  visant `#exampleModal` — **inexistante**. La route redirige désormais vers la planification.

#### Ajout depuis la migration — publication du calendrier et planification par lot

| Ajout                            | Détail                                                                                                                                                                     |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Pagination du calendrier         | le planning rendait **jusqu'à 1 800 lignes d'un bloc** (675 épreuves par session dans le jeu de démonstration) ; idem pour les épreuves d'une session (`PlanExamenView`)     |
| « Publier le calendrier »        | export Excel / PDF de la **sélection entière**, jamais de la page affichée, avec périmètre, session, type et date d'édition en tête — une pièce affichable, pas un dump      |
| Groupe de boutons                | « Planifier une épreuve » (unitaire) et « Importer un planning » (lot), côte à côte au-dessus du planning                                                                    |
| Planification unitaire           | `EpreuveFormModal` accepte désormais une session **vide** : elle se choisit dans la modale, la liste étant restreinte au type de l'onglet. Une seule modale pour les deux écrans |
| Import Excel / CSV d'un planning | `PlanningImportModal`, bâtie sur `useImportFile` : glisser-déposer, gabarit téléchargeable, validation ligne à ligne, aperçu, compte rendu paginé                            |

> #### ⚠️ Il n'existe pas de route d'import pour les évaluations
>
> Les étudiants et les tuteurs ont leur `POST /academique/imports/…` ; les évaluations, non. Les
> lignes du classeur sont donc créées **une par une** sur `POST /evaluations/evaluation`, la seule
> route qui existe. Trois conséquences, assumées et écrites dans `importPlanning` :
>
> - **l'import n'est pas atomique** — un fichier à moitié fautif laisse les lignes valides créées ;
>   le compte rendu dit lesquelles ont échoué et invite à ne réimporter que celles-là ;
> - une requête par ligne, séquentielle (un planning se compte en dizaines de lignes) ;
> - `create()` de la fabrique n'est **pas** utilisé : il notifie et recharge la liste à chaque appel.
>   Cent lignes auraient produit cent messages et cent rechargements.
>
> Une route d'import par lot côté backend reste souhaitable : elle rendrait l'opération atomique.

Le fichier désigne le module et la session par leur **code** — personne ne saisit un UUID dans un
tableur ; la résolution en identifiants se fait à l'envoi, et une correspondance introuvable devient
un rejet motivé (« code_module « ZZZ » introuvable ») plutôt qu'un 400 opaque.

> #### ⚠️ `new Date(chaîne)` ne peut pas valider une date de classeur
>
> Relevé sur Node 24, en écrivant les tests : `new Date('15 janvier')` rend **2001-01-15**, tandis
> que `new Date('15/01/2026')` rend **Invalid Date**. Un libellé français serait donc enregistré
> comme une date de 2001, en silence, et la notation la plus naturelle pour qui remplit le fichier
> serait refusée. `dateISO` lit les deux formats acceptés **par motif**, et vérifie que le triplet
> désigne un jour réel — un 31/02 est rejeté au lieu de glisser au 3 mars.

`useImportFile` accepte maintenant un `schema.validate` facultatif : les règles du domaine (type
d'épreuve dans l'énumération, pondération bornée, date lisible) vivent chez le module, la mécanique
reste écrite une fois.

> #### ⚠️ Sept exports Excel ne produisaient aucun fichier
>
> Découvert par le test de montage du calendrier : `book_append_sheet` lève « Sheet names cannot
> exceed 31 chars », et `useTableExport` passait le **titre** — une phrase lisible — en nom
> d'onglet. Tout export dont le titre dépassait 31 caractères échouait donc en silence pour
> l'utilisateur, qui voyait un bouton ne rien produire : « Répartition des étudiants par classe »,
> « Statistiques de performance par filière », « Historique des demandes de documents », « Grand
> livre — synthèse par classe », « Contrôle des paiements par classe », « Attribution des thèmes de
> mémoire », « Suivi financier des inscriptions ». `nomOngletValide` abrège l'onglet et retire les
> caractères qu'Excel refuse (`: \ / ? * [ ]`) — le titre complet reste en tête du PDF et dans le
> nom du fichier. Corrigé pour **tous** les appelants d'un coup, couvert par
> `shared/utils/exportExcel.test.js`.

### 1.10 Le module `concours` — terminé

```
src/modules/concours/
├── routes.js · constants.js
├── concours/   api.js · store.js · composables/ · components/ · views/
├── epreuve/    api.js · store.js · components/TabEpreuves
└── candidat/   api.js · store.js · components/{TabCandidats, TabNotes}
```

5 198 lignes → 3 146. **Le design est préservé.** C'est le module **le plus sain** rencontré
jusqu'ici : la plupart de ses écrans étaient réellement branchés. Mais ce qui était cassé l'était
profondément.

> #### ⚠️ Deux routes inatteignables depuis toujours
>
> L'ancien `gestionApi.js` appelait :
>
> ```js
> updateEpreuve → gestionService.put(`/gestions/concours/epreuves/${id}`)     // ← « /gestions/ » en trop
> deleteEpreuve → gestionService.delete(`/gestions/concours/epreuves/${id}`)  // ← idem
> ```
>
> Le client est **déjà** monté sur `/gestion` : l'URL réelle devenait
> `/api/gestion/gestions/concours/epreuves/:id` — **404**. **Modifier ou supprimer une épreuve de
> concours n'a jamais fonctionné.** Les trois autres routes d'épreuve avaient, elles, le bon chemin.

#### Les boutons morts

| Bouton                    | Ce qu'il faisait vraiment                                                                                                                                                                 |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| « Modifier » un concours  | `console.log('Modifier :', item)` — et son `editModalTarget` visait `#editModuleModal`, **inexistante**                                                                                   |
| Changer le statut         | appelait `concoursStore.updateConcoursStatus(...)` — l'action s'appelle **`changeStatut`** → `TypeError` au clic                                                                          |
| « Supprimer » un candidat | retirait la ligne du **tableau local** et annonçait « Candidat masqué de la liste locale ». Elle revenait au rechargement — **il n'existe aucun `DELETE /candidats/:id`**. Bouton retiré. |
| Import de candidats       | `POST /candidats/import` → **404** : la route était **commentée** côté backend, alors que son contrôleur était implémenté. Rétablie.                                                      |

#### Les écrans simulés

- **`TabDeliberation`** cumulait trois défauts : `Number(route.params.id)` sur un **UUID** (donc
  `NaN`) ; trois candidats codés en dur ; et un test `statut === 'PROCLAMÉ'`, **un statut qui
  n'existe pas** (`PLANIFIE`, `OUVERT`, `CLOTURE`, `ANNULE`) — la condition était toujours fausse.
  Or `GET /concours/:id/classement` renvoie les vraies moyennes et les vrais rangs : la simulation
  au seuil se calcule dessus, sans endpoint supplémentaire.
- **`RapportConcours`** affichait des **formateurs** codés en dur après un `setTimeout(3000)` —
  **le même copier-coller que `RapportExamens`**. Ni l'un ni l'autre n'avait de rapport avec des
  résultats.
- **`ConcoursTab`** déclarait **trois onglets pour quatre panneaux**, et le quatrième rendait
  `<StatistiquesContent />` — **un composant jamais importé**.
- L'onglet **Historique** a été retiré : `logs = ref([])`, table `historique_concours` **vide**, et
  **aucune route ne l'expose**.

#### Trois bugs backend corrigés

- **`GET /concours/:id/moyennes-rangs` répondait 404 « Impossible de calculer »… alors que le calcul
  réussissait.** La fonction Postgres `calculer_moyennes_et_rangs` est déclarée `RETURNS void` : le
  modèle en tirait `undefined`, que le contrôleur prenait pour un échec. Un `void` n'est pas une
  erreur. Elle renvoie désormais le classement à jour.
- **`POST /candidats/import` était commenté**, son contrôleur ne l'était pas. Route rétablie.
- **`POST /candidats/import/notes` était déclarée deux fois** — la seconde sans son `multer`, donc
  morte.

#### Les énumérations viennent des contraintes SQL

| Champ                              | Valeurs                                                                                   |
| ---------------------------------- | ----------------------------------------------------------------------------------------- |
| `concours.statut`                  | `PLANIFIE`, `OUVERT`, `CLOTURE`, `ANNULE`                                                 |
| `concours.type_concours`           | FK vers `types_concours` — **7 types**, le formulaire n'en proposait que **4**            |
| `epreuves_concours.type_epreuve`   | `ECRIT`, `ORAL`, `PRATIQUE` — le formulaire envoyait `écrit` en **minuscules accentuées** |
| `candidats.sexe` / `email` / `tel` | `M`/`F`, plus deux expressions régulières                                                 |

Éditer le « Concours Ingénieur 2025 » — de type `CONCOURS_INGE` — lui aurait fait **perdre son
type**, celui-ci n'étant pas dans la liste proposée.

#### Ajout depuis la migration — l'écran de configuration d'un concours

> #### ⚠️ La grille de saisie n'a jamais affiché une seule note
>
> `TabNotes` construisait ses lignes à partir de la seule liste des candidats, avec `note: ''`
> **écrit en dur**. On voyait donc les candidats — jamais leurs notes, y compris juste après les
> avoir saisies et rechargé l'écran. Aucune erreur, aucun indice : un opérateur ne pouvait pas
> distinguer « pas encore notée » de « note perdue », et risquait de resaisir par-dessus.
>
> La lecture existait pourtant : `GET /candidats/concours/:id/epreuve?epreuve_code=`, servie par
> `v_candidats_epreuves`, qui joint `notes_epreuves_concours` en `LEFT JOIN` — 132 candidats, tous
> notés, sur le jeu de démonstration. Le store l'exposait même sous `fetchByEpreuve` : **aucun écran
> ne l'appelait**.
>
> La grille est désormais préremplie. `fetchByEpreuve` écrasait `items` — la collection que lit aussi
> l'onglet « Candidatures » — d'où `fetchNotesEpreuve`, qui range les notes sous le code de
> l'épreuve, à part (même piège que `classeStore.fetchByFiliere`). Une note venue du serveur se
> distingue visuellement d'une case vide, et remplacer une note existante le dit avant
> l'enregistrement. Après sauvegarde, la grille est **relue depuis le serveur** plutôt que présumée
> conforme.

| Onglet              | Ajout                                                                                                                                                         |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2. Candidatures     | **recherche intelligente** (plusieurs termes dans n'importe quel ordre, insensible aux accents et à la casse, sur n° de table, identité, courriel, téléphone, lieu, ville, statut), filtre par statut de dossier, **export Excel / PDF** de la sélection, colonne « Dossier » et bouton **Détails** |
| 3. Saisie des notes | notes existantes affichées (voir l'encadré) ; grille paginée par 25 — **le découpage ne porte que sur l'affichage** : une note saisie en page 1 survit au passage en page 2, « Enregistrer » envoie les lignes modifiées de **toutes** les pages, et le compteur signale celles qui ne sont plus sous les yeux |
| 4. Délibération     | classement paginé — 132 candidats rendus d'un bloc ; les compteurs et la simulation restent calculés sur **tout** le classement, la proclamation engageant tous les candidats |

Le **dossier complet** (`CandidatDossierModal`) rassemble ce que trois lectures savent du candidat :
`GET /candidats/:id` (identité, contact, dossier de candidature), une note par épreuve, et la
moyenne et le rang de `GET /concours/:id/classement`. Les notes sont demandées épreuve par épreuve —
quatre requêtes ici — puis gardées par le store : le dossier suivant ne coûte plus rien. Il **ne
montre pas les pièces justificatives** : `POST /candidats/:id/pieces` les dépose, mais aucune route
ne les liste — mieux vaut un bloc absent qu'un bloc vide laissant croire qu'aucune pièce n'a été
versée.

> #### ⚠️ Un quatrième bug backend corrigé — `GET /candidats/:id` répondait 400
>
> Le modèle interrogeait `FROM candidat`, **au singulier** ; la table s'appelle `candidats`. La
> route rendait donc l'erreur SQL brute « relation "candidat" does not exist » : **le détail d'un
> candidat n'a jamais pu être consulté**. Corrigé dans `cfibackend`, avec la jointure du dossier de
> candidature (statut, motif de rejet, date de dépôt) que faisait déjà `findByConcours` — c'est ce
> que l'appelant vient chercher. Suite backend : **224 tests, 23 suites, tous au vert**.

#### Ajout depuis la migration — l'écran des rapports de concours

L'écran s'ouvre désormais sur **deux onglets** — « Classement » et « Statistiques des résultats » —,
le sélecteur de concours restant au-dessus : c'est le même périmètre pour les deux, et le dupliquer
dans chacun aurait permis d'en consulter deux différents sans s'en apercevoir. Le classement est
chargé une fois, à ce niveau.

Les statistiques ne sont que des **dérivées de lectures existantes** : moyenne générale et
écart-type (de population — on décrit la promotion, on n'estime pas une population plus large),
distribution des moyennes par palier, décision du jury, performance épreuve par épreuve (moyenne,
bornes, taux de réussite), répartition par sexe. Export Excel / PDF du tableau par épreuve, les
indicateurs d'ensemble figurant en tête du document — c'est ce qui distingue un rapport d'un export
de lignes.

> #### ⚠️ Les décisions du jury n'étaient lisibles nulle part
>
> `proclamerAdmissions` écrit `admis`, `decision_jury` et `date_proclamation` dans
> `admissions_concours` — 77 admis, 44 en liste d'attente, 11 ajournés sur le jeu de démonstration.
> Mais `GET /concours/:id/classement` ne renvoyait pas ces colonnes, et le seul autre accès était
> `GET /concours/:id/admis/export`, **un fichier binaire** : impossible d'en tirer un rapport, ni
> même d'afficher la décision d'un candidat. L'écran de délibération ne pouvait donc montrer qu'une
> *simulation* à un seuil, jamais la délibération réelle.
>
> Un `LEFT JOIN` a été ajouté au classement côté backend (avec `sexe`, utile aux répartitions). Le
> `LEFT` compte : un concours non proclamé rend ces colonnes nulles et le classement reste
> consultable. L'écran distingue alors « non proclamé » de « tout le monde en attente » — un taux
> d'admission de 0 % serait faux tant qu'aucun jury n'a statué.
>
> `decision_jury` accepte `EN_ATTENTE`, `ADMIS`, `LISTE_ATTENTE` et **`A_A_JOURNER`** — cette
> dernière graphie est celle de la contrainte `CHECK`, pas une coquille.

> #### ⚠️ `Number(null)` vaut 0 — et une absence de note n'est pas un zéro
>
> Relevé par un test en écrivant les statistiques par épreuve : la jointure des notes est un
> `LEFT JOIN`, donc un candidat non noté arrive avec `note: null`. Converti naïvement, il comptait
> comme ayant obtenu **0** — la moyenne de l'épreuve s'effondrait, le nombre de « notés » était faux,
> et rien ne le signalait. Le helper `nombre()` distingue désormais l'absence de valeur (`null`,
> `undefined`, chaîne vide) d'un zéro réel.

Couvert par `TabNotes.test.js` (9 tests), `TabCandidats.test.js` (6 tests),
`useStatistiquesResultats.test.js` (13 tests) et `RapportStatistiquesTab.test.js` (7 tests).

### 1.11 Le module `notes` et la délibération — terminé

```
src/modules/notes/
├── routes.js · constants.js
├── note/          api.js · store.js · views/NotesView
└── deliberation/  views/DeliberationView
```

3 018 lignes → 754. **Le design est préservé.** C'est le module qui **n'avait jamais rien
envoyé au serveur** : rien, nulle part.

> #### ⚠️ Les quatre routes de notes répondaient 404 — depuis toujours
>
> `api/evaluations/notesApi.js` appelait :
>
> ```js
> getNotesByEvaluation → evaluationService.get(`/evaluations/${id}/notes`)   // ← il manque « /notes »
> ```
>
> Le client est monté sur `/api/evaluations` ; les routes de notes sont montées **sous
> `/notes`** (`router.use('/notes', noteRoutes)`). Le vrai chemin est donc
> `/api/evaluations/**notes**/evaluations/:id/notes`. **Les quatre appels — lecture par
> évaluation, lecture par étudiant, modification, publication — étaient inatteignables.**
> Corrigé côté **frontend** (`note/api.js`) : le segment doublé est laid, mais c'est ce que le
> serveur expose, et il fonctionne. Aucune modification backend.

#### L'écran de saisie n'enregistrait rien, et son modèle de données était faux

`Notes.vue` servait **quatre étudiants codés en dur** (« Ndiaye Fatou », « Camara Ibrahima »…) et
trois matières inventées. Son bouton « Valider le PV » :

```js
const saveAllNotes = () => {
  alert(`Validation du PV pour la classe […]`);
};
```

Un `alert()`. Et l'URL — `/notes/:classeId/:semestre/:type/edit` — supposait qu'une note appartienne
au triplet (classe, semestre, type d'évaluation). **Ce n'est pas le modèle du serveur** : une note
appartient au couple **(étudiant, évaluation)** — une _épreuve_ précise d'une _session_. La route a
été supprimée ; l'écran suit désormais la cascade **session → épreuve → grille**, qui est la réalité.
Il n'existe par ailleurs **pas de `POST /notes`** : les notes préexistent, l'écran les corrige.

#### Les quatre écrans de délibération étaient simulés, sans exception

`DeliberationsContent`, `ProclamationContent`, `RapportContents` et `AssistantIAContent` servaient
tous des `ref([...])` codés en dur — jusqu'à `mockClasses = ref(['Master 1 Info', …])`.
`RapportsTab.vue` et `semestre2/{devoir,rappel,session}-s2.vue` étaient **vides**
(`<template></template>`) : leurs onglets ne rendaient rien. L'onglet « Assistant IA » — une
conversation aux messages codés en dur — a été retiré : aucun backend ne l'alimentait alors.
_(Il est revenu depuis, branché sur `POST /api/assistant/question` — voir §1.22.)_

Or les quatre routes de résultats existaient depuis toujours, ainsi que leur store
(`resultStore.js`) : **aucune vue ne les appelait**.

> #### ⚠️ Un bulletin appartient au triplet (classe, semestre, année) — correction dans `examens`
>
> `GET /resultats/classes/:id/bulletins` **exige** `semestreId` **et** `anneeId` en query, et la
> publication les exige **dans le corps**. Le module `examens` (§1.9) ne passait que la classe :
> `RapportsView` prenait donc un **`400` à chaque requête**. Le store lisait de surcroît
> `bulletin.moyenne` et `bulletin.publie` — colonnes qui **n'existent pas** (`moyenne_generale`,
> `statut_publication`, `rang_etudiant`). Corrigé : `bulletin/api.js`, `bulletin/store.js`
> (contexte `{classeId, semestreId, anneeId}`), et un sélecteur partagé `BulletinContexte.vue`
> qu'utilisent les deux écrans. Vérifié de bout en bout contre `localhost:3500` (lecture,
> décision du jury, publication), base restaurée.

**La délibération réutilise le store des bulletins d'`examens`** plutôt que de le dupliquer :
la dépendance `notes → examens` est dirigée, et déclarée. C'est aussi pourquoi les constantes du
bulletin (décision, mention, publication) vivent dans `examens/bulletin/constants.js` : les mettre
dans `notes` aurait refermé le cycle.

#### Les énumérations viennent des contraintes SQL

| Champ                                      | Valeurs                                                    |
| ------------------------------------------ | ---------------------------------------------------------- |
| `notes.statut`                             | `SAISIE`, `VALIDEE`, `PUBLIEE`                             |
| `notes.valeur`                             | `CHECK (valeur >= 0 AND valeur <= 20)` — 400 sinon         |
| `bulletins_semestriels.decision`           | `EN_ATTENTE`, `VALIDE`, `AJOURNE`, `RATTRAPAGE`            |
| `bulletins_semestriels.mention`            | `PASSABLE`, `ASSEZ_BIEN`, `BIEN`, `TRES_BIEN`, `EXCELLENT` |
| `bulletins_semestriels.statut_publication` | `BROUILLON`, `PUBLIE`, `VERROUILLE`                        |

### 1.12 Le bug `AppTabs` — les onglets n'affichaient plus rien

Signalé en cours de chantier, et il touchait **tous les modules migrés** : cliquer sur un onglet
ne rendait pas son contenu, et la console crachait

```
TypeError: parentComponent.ctx.deactivate is not a function
    at unmount → patch → sharedContext.activate
```

Deux défauts cumulés dans `shared/components/AppTabs.vue`, tous deux corrigés :

**1. Les définitions de composants transitaient par un proxy réactif.** Dès qu'une vue construit sa
liste d'onglets dans un `computed` — ce que fait toute vue de détail — Vue enveloppe les composants
qu'elle contient et proteste :

> _[Vue warn] Vue received a Component that was made a reactive object […] should be avoided by
> marking the component with `markRaw`._

Ce n'est pas qu'un avertissement de performance : le composant proxifié casse le cache de
`KeepAlive`. `AppTabs` applique désormais `toRaw` + `markRaw` **lui-même**, si bien qu'aucun
appelant n'a à y penser.

**2. Le `v-if` était posé sur le `<component>` _à l'intérieur_ du `KeepAlive`.** Condition fausse →
`KeepAlive` reçoit un vnode _Comment_ en enfant → son `activate` appelle
`parentComponent.ctx.deactivate()` sur un parent qui n'est pas lui. D'où le `TypeError`. La
condition porte maintenant sur le `KeepAlive` lui-même.

**7 tests** figent le contrat (`AppTabs.test.js`) : rendu initial, bascule au clic, transmission des
props, `defaultTab`, onglet à plusieurs nœuds racines, liste d'onglets en `computed`, et **absence
de tout avertissement Vue**. Le troisième et le sixième échouaient avant le correctif.

**Leçon** : lint, tests et build étaient au vert pendant que **tous les onglets de l'application
étaient cassés**. Aucun des trois ne monte un composant. Un test de montage sur un composant
partagé aussi central aurait dû exister dès le départ.

### 1.13 L'optimisation d'API principale

Les conteneurs d'onglets Bootstrap (`data-bs-toggle="tab"`) **montent tous les panneaux d'un
coup** et se contentent d'en masquer certains en CSS. Chaque onglet exécutait donc son
`onMounted` — et ses requêtes — au chargement de la page, même sans être ouvert. Une page à
5 onglets déclenchait **5 séries d'appels pour n'en afficher qu'une**.

`AppTabs` ne monte que l'onglet actif, et `KeepAlive` évite de recharger ceux déjà visités.
**C'est le gain le plus important à propager sur les 23 conteneurs restants.**

### 1.14 Bugs corrigés (tous étaient en production)

**Authentification — la connexion ne pouvait pas aboutir**

1. Le backend enveloppe sa charge utile dans `data` (`{ success, data: { token, user } }`) ; `authStore` lisait `response.token`, un cran trop haut → le login **échouait même sur un 200 valide**.
2. Le formulaire envoyait `email`, alors que `POST /api/auth/login` recherche l'utilisateur **uniquement par `username`** (vérifié contre le backend) → « Identifiants incorrects » systématique.
3. Le rôle arrive en majuscules (`"ADMIN"`), les getters comparaient à `'admin'` → `isAdmin` **toujours faux**, y compris pour un administrateur.
4. `logoutUser` appelait `$reset()` **avant** `clearToken()` ; `$reset()` réexécute `state()`, qui relit le jeton → le jeton **ressuscitait**.
5. `signupUser` appelait `notifyError()` sans l'avoir déclaré → `ReferenceError`.
6. `fetchCurrentUser` appelait `useRouter()` dans une action Pinia (hors `setup()`) → `undefined`, la redirection plantait **précisément à l'expiration du jeton**.

**Sécurité** 7. **Aucun `router.beforeEach`** malgré les `meta.requiresAuth` : toute URL interne s'ouvrait sans session. 8. **XSS** dans l'onglet Organisation des semestres : donnée backend réinjectée dans un `v-html` sans échappement. La regex de recherche était aussi construite depuis la saisie sans échapper → chercher `(` cassait le filtre. 9. Le cache local n'était pas purgé à la déconnexion : données lisibles par l'utilisateur suivant.

**Le bug le plus répandu — 4 occurrences : les boutons ne faisaient rien**

| Écran     | Défaut                                              |
| --------- | --------------------------------------------------- |
| Cycles    | `@edit="editCycle"` → fonction **jamais définie**   |
| Filières  | `editFiliere` → `console.log`                       |
| Classes   | `editClasse` **et** `confirmDelete` → `console.log` |
| Semestres | `editSemestre` → `console.log`                      |

→ On ne pouvait **modifier ni cycle, ni filière, ni classe, ni semestre**, ni supprimer une classe.

**Autres** 10. Édition d'une année : la modale lisait `anneeToEdit` du header, la liste écrivait dans sa propre variable → **le formulaire ne se pré-remplissait jamais**. 11. Les modales annonçaient « créé avec succès » puis se fermaient après un `setTimeout`, **sans vérifier le résultat** de l'appel. 12. `serviceApi.post(url, data)` ignorait silencieusement le 3ᵉ argument de config → les en-têtes `multipart/form-data` des 4 endpoints d'import n'étaient jamais transmis. 13. `handleApiError()` défini mais **jamais appelé** → `errorStore` toujours vide. 14. Filtrer les niveaux par cycle appelait `niveauStore.getNiveauByCycle()`, **action inexistante** → `TypeError`. 15. Formulaire cycle : `est_actif` vs `statut` incohérents → la case « actif » se désynchronisait dès la première édition. 16. `messageStore.addMessage()` / `.error()` appelés sur `useNotifier()`, qui n'expose ni l'un ni l'autre → `TypeError`. 17. `v-if` + `v-for` sur le même élément → le `v-else` associé était **structurellement inatteignable**.

**Étudiants** (voir §1.4 pour le détail) 18. Le store n'exposait **ni `items` ni `fetchAll`** : aucun écran ne _pouvait_ charger de liste. D'où les tableaux codés en dur dans 4 onglets sur 6, plus la vue racine. 19. `fetchEtudiantsByClasseFiliereAnnee` et `filteredEtudiants` étaient consommés par l'onglet « Classes » mais **n'existaient pas** dans le store → `TypeError` au premier filtre. 20. `XLSX.utils.json_to_sheet` appelé **sans importer `XLSX`** → l'export Excel plantait au clic. 21. La fiche détail déclarait 4 onglets pour 2 panneaux ; deux d'entre eux pointaient sur un `#sales2` **inexistant** et trois `<li>` partageaient le même `id`. 22. La fiche détail affectait `etudiant.value = response` sans déballer `{ success, data }` → tous ses champs étaient `undefined`. 23. Ses `v-if` portaient sur les **mauvais champs** : le lieu de naissance était conditionné à `lieunaissance` (inexistant), le sexe à `genre`, l'adresse au _téléphone_. 24. `ajouterAuGroupe(e, g.id)` était appelé avec deux arguments mais n'en déclarait qu'un → « Assigner » affectait **le premier étudiant de la liste**, pas celui sur lequel on cliquait. 25. « Générer un rapport » : un `setTimeout(1800)` puis « Rapport généré et téléchargé avec succès » — **aucun appel API, aucun fichier**. 26. Le panneau d'onglet « Import » n'avait **aucun lien de navigation** : monté à chaque chargement, et inatteignable. Son composant était de toute façon vide, et le `DropData.vue` de secours n'avait aucun gestionnaire sur son bouton « Upload ». 27. La photo de la fiche détail était servie depuis `http://localhost:3500` **codé en dur**.

### 1.15 Code mort et duplication supprimés

- `routes/main.js` (copie **octet pour octet** de `routes/index.js`), `style1.css` (**520 Ko** jamais référencé), 5 fichiers `sample*.vue`, `result.js` → **25 493 lignes**.
- Le **même tableau de niveaux existait en 3 exemplaires** (filières, classes, semestres) et celui des filières en 2 → **776 lignes**.
- Les helpers `setCache`/`getCache` étaient copiés **à l'identique dans 9 stores**.
- `ItemActions` existait en **8 exemplaires divergents** (84 à 620 lignes), certains émettant l'objet, d'autres l'`id`.

### 1.16 Le module `finances` — terminé

```
src/modules/finances/
├── routes.js · api.js · constants.js
├── stores/  plans · echeanciers · factures · paiements · rapports
├── utils/   recu.js (impression reçu / facture / fiche) · qr.js (codes QR de contrôle)
├── facturations/  views/FacturationsView · components/ (+ tabs/)
├── paiements/     views/PaiementsView · components/ (+ tabs/)
└── rapports/      views/RapportsFinancesView · components/ (+ tabs/)
```

La logique a d'abord été migrée (stores, `api.js`), puis, dans un second temps, **les vues ont été
déplacées de `src/views/finances/` vers le module** et structurées comme `examens` (un sous-dossier
par écran : `views/` + `components/` + `components/tabs/`). Le déplacement s'est fait par `git mv`
sans toucher aux templates ni à la logique des `<script setup>` — **seuls les chemins d'import
relatifs** ont changé (`./Tab/` → `./tabs/`, `./components/` → `../components/`). Les routes ont
migré de `src/routes/finances.routes.js` vers `src/modules/finances/routes.js` (chemins et noms
inchangés : la barre latérale n'a rien vu). Contrairement à ce qu'indiquait ce document, **`/finance`
est monté** côté backend et répond : l'ancien `financeApi.js` visait `/finances`, `/factures`,
`/frais_inscription` — trois endpoints inexistants — pendant que les écrans affichaient des tableaux
codés en dur.

> #### Codes QR de contrôle (reçus + suivi de paiement)
>
> Le QR **n'encode pas une URL** de vérification : il porte directement les faits du document
> (numéro, matricule, montant, date, statut), lisibles hors ligne par n'importe quel scanner de
> téléphone. Un contrôleur compare ce que le QR affiche à ce qui est imprimé ; un document falsifié
> après coup trahit l'écart. Aucun ajout backend. Format compact `CLE:valeur|CLE:valeur`, assemblé
> par `utils/qr.js` (`chargeRecu`, `chargeSituation`, `toQrDataUrl`). Dépendance ajoutée : `qrcode`.
>
> - **Sur le reçu** (`utils/recu.js` → `imprimerRecu`) : un QR est apposé sur le reçu A5 imprimé.
>   La fonction est devenue **asynchrone** — la fenêtre d'impression est ouverte **avant** l'`await`
>   de génération du QR, sans quoi le bloqueur de pop-ups l'intercepterait (elle ne serait plus
>   rattachée au clic). Ses deux appelants (`PaiementList`, `PaiementForm`) l'`await` désormais.
> - **Sur la fiche de suivi** (`imprimerSituation`, même contrainte async) : un QR résume la
>   situation de paiement de l'étudiant.

#### Deux écrans de contrôle ajoutés (onglets de l'écran Paiements)

Répondent au besoin « voir si un étudiant a payé le mois / le semestre / l'année ». Les données
existaient déjà côté serveur ; aucune vue ne les affichait.

| Onglet                                         | Source                                                     | Ce qu'il montre                                                                                                                                      |
| ---------------------------------------------- | ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Suivi étudiant** (`SuiviEtudiant.vue`)       | `GET /etudiants?search=` + `GET /echeanciers/etudiant/:id` | Recherche serveur d'un étudiant, puis son échéancier période par période (statut calculé par `v_finance_echeances`) + synthèse + **QR de contrôle**. |
| **Contrôle par classe** (`ControleClasse.vue`) | `GET /echeanciers/suivi?classe_id=`                        | Tous les étudiants d'une classe regroupés par échéance → statut d'ensemble, cartes de synthèse, export.                                              |

> ⚠️ **`/echeanciers/suivi` limite à 500 lignes par défaut** (ordonnées par retard). Le regroupement
> par étudiant se faisant côté client, `ControleClasse` passe `limite: 5000` pour ne pas tronquer une
> classe entière. La fiche étudiant utilise `/echeanciers/etudiant/:id`, **sans limite**.

> Le statut d'ensemble suit la **hiérarchie des échéances** (§1.5, constants) : le retard prime. Dès
> qu'une période est en retard, l'étudiant est « en retard », même s'il a réglé les autres.

#### Ajout depuis la migration — pagination, et deux troncatures silencieuses corrigées

Les six tableaux réels du module sont paginés : registre des encaissements, contrôle par classe,
archives par exercice, registre des factures, rapport des paiements, balance par filière.

> #### ⚠️ Le serveur plafonne à 200 lignes, et les écrans ne le disaient pas
>
> `paiement.model.js` et `facture.model.js` appliquent le même défaut :
> `values.push(Number(limite) > 0 ? Number(limite) : 200)`. Les deux registres affichaient donc les
> **200 lignes les plus récentes** — sur 7 497 encaissements et 1 803 factures — sans rien indiquer,
> et leurs cumuls (« Total collecté ») portaient sur cet échantillon : un chiffre faux présenté comme
> un total. Les filtres, appliqués côté client, ne filtraient eux aussi que ces 200 lignes.
>
> | Écran                | Correctif                                                                                                                                     |
> | -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
> | Registre des paiements | sélecteur de **profondeur** (200 / 1 000 / 5 000 / tout), périmètre chargé affiché, cumul explicitement rattaché à ce périmètre. Le registre complet pèse **8 Mo** : le charger d'office serait payer cher une exhaustivité pas toujours utile |
> | Registre des factures  | chargé en entier (`limite`), 1 803 lignes pour 1,2 Mo                                                                                        |
> | Rapport des paiements  | les deux graphiques passent sur `GET /finance/rapports/repartition-modes` et `/rapports/encaissements-mensuels` — des agrégats **serveur**, exacts sur tout le registre pour quelques centaines d'octets. Le store les servait déjà : **aucun écran ne les appelait**. Le tableau reste un extrait des 200 derniers, et l'annonce |
>
> Le vrai correctif reste **le filtrage serveur** : `GET /finance/paiements` accepte `cycle`,
> `filiere_id`, `classe_id`, `mois`, `mode`, `statut` et `recherche` (voir `api.js`), qu'aucun écran
> ne transmet aujourd'hui.

**L'onglet « Plans d'échelonnement » était intégralement simulé.** Ses trois « plans types » et ses
quatre traites étaient des `ref([...])` — « Moussa Diallo », « ETU-2026-001 » — et son filtre par
filière proposait deux valeurs écrites dans le balisage. Ses trois boutons ne faisaient qu'un
`alert()` : `encaisserTraite` modifiait l'objet local puis annonçait « Le grand livre comptable a été
mis à jour » sans qu'aucune requête ne parte. Or **les deux lectures existaient** :
`GET /finance/plans` (7 plans réels) et `GET /finance/echeanciers/suivi` (6 223 échéances) — la même
source que la balance âgée de l'onglet « Factures ». L'onglet est rebranché, filtrable par statut,
filière et plan, paginé et exportable ; les boutons « Encaisser » et « Relancer » ont été retirés
(l'encaissement a son écran, et **aucune route de relance n'existe**). Couvert par
`RapportEcheance.test.js` (6 tests).

> #### ⚠️ Trois écrans restent simulés, faute de backend
>
> Aucun n'a été paginé : mettre une barre de pagination sous quatre lignes inventées ne ferait
> qu'habiller l'illusion.
>
> - **Facturation → Archives** : un journal de caisse (salaires, électricité, fournitures) dont
>   `saveTransaction()` fait un `unshift` local suivi d'un `alert('Transaction enregistrée !')`.
>   **Aucune table ni route de dépenses n'existe** dans le domaine `/finance`, qui couvre plans,
>   échéanciers, factures, paiements, tarifs et rapports.
> - **Facturation → États d'honoraires** (`FacturationForm.vue`, malgré son nom) : les vacations des
>   formateurs (« PRF-001 », taux horaires) sont un `ref([...])`. Aucune table `honoraires` ni
>   `vacations` en base, aucune route. Les heures existent (`moduleclasse.heures`,
>   `vue_attributions_cours`) ; **les taux, non** — c'est ce qui manque pour rendre l'écran réel.
> - ~~**Rapports → Assistant IA** : conversation aux réponses écrites d'avance, servies après un
>   `setTimeout`.~~ **Corrigé** : l'onglet est branché sur l'assistant réel, cadré sur les finances
>   (§1.22).

### 1.17 Le module `pedagogies` — terminé (le plus gros, 4 écrans, backend créé)

```
src/modules/pedagogies/
├── routes.js
├── formateurs/    api.js · store.js · views/EnseignantsView · components/ (+ tabs/)
├── crenaux/       api.js · store.js · views/CrenauHoraireView · components/ (+ tabs/)
├── attributions/  api.js · store.js · views/AttributionCoursView · components/ (+ tabs/)
└── programme/     api.js · store.js · views/ProgrammeCreditView · components/ (+ tabs/)
```

Migré **écran par écran, chacun vérifié en live** contre `localhost:3500`. Les quatre écrans
(~8 040 lignes) étaient **quasi entièrement en données codées en dur** (« Jean Dupont », `setTimeout`,
exports `console.log`). Le domaine backend `/pedagogies` **est monté** (le doc le croyait commenté),
mais la plupart de ses routes **répondaient 500** faute d'objets en base. `pedagogieClient` visait
`/pedagogie` (singulier) — préfixe inexistant, 404 sur tout.

> #### ⚠️ Backend créé — 4 migrations SQL (dépôt `cfibackend`, un commit par étape)
>
> | Migration | Objet créé                                                                          | Débloque                                                      |
> | --------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------------- |
> | `006`     | table `diplomes`, vue `vue_infos_enseignants` + CRUD enseignant (`PUT`/`DELETE`)    | répertoire formateurs (500 → 200)                             |
> | `007`     | table `schedule` + colonne `date`, vue `vue_horaire_details`                        | emplois du temps (500) ; `jour` dérivé de `date` à l'écriture |
> | `008`     | colonne `moduleclasse.heures`, vue `vue_attributions_cours` + endpoints attribution | assignation cours → enseignant                                |
> | `009`     | table `maquette_pedagogique` + endpoints CRUD                                       | maquette (programme, coef, ECTS, note éliminatoire)           |

Par écran :

- **formateurs** — répertoire branché sur `GET /pedagogies/enseignant/enseignants` (`vue_infos_enseignants`). Suppression réelle, exports réels.
- **crenaux** — CRUD des créneaux + grille sur `/pedagogies/schedule`. L'UI saisit une **date**, le backend en **dérive le jour** ; import de masse → avertissement honnête (pas d'endpoint).
- **attributions** — onglet « Assignation » branché (`/pedagogies/attribution`). `PresencesContent` (`<template>` vide) → état honnête.
- **programme** — maquette (`ProgrammeCours`) sur `/pedagogies/programme/maquette` ; répartition UE (`CreditsAcademiques`) dérivée de `GET /modules`.

> #### Onglets restés mockés (pas de backend, à consolider)
>
> Relocalisés tels quels pour ne pas casser l'UI : `crenaux/{TravauxPratiques, TravauxDiriges}` (stats/archives) ; `attributions/{CoursMatieres` (recoupe le module `matieres`)`, ChargesHoraires, RessourcesPedagogiques, RapportsAcademiques, ArchivesPedagogiques}` ; `programme/{ResumeProgramme, CreditsECTS}` (**nécessitent des résultats** — bulletins vides, voir §2.5.13).

Nettoyage : suppression des orphelins `src/api/pedagogies/pedagogieApi.js` et `src/stores/pedagogieStore/*` (3 stores), et de `src/routes/pedagogie.routes.js` (le module porte ses routes).

#### Ajout depuis la migration — la publication de l'emploi du temps

L'écran `/schedule` gagne la pagination de ses deux onglets et **deux sorties distinctes**, parce
qu'elles ne servent pas à la même chose :

| Bouton                        | Ce qu'il produit                                                                 | À quoi ça sert                    |
| ----------------------------- | -------------------------------------------------------------------------------- | --------------------------------- |
| « Exporter en Excel »         | une ligne par créneau, dix colonnes                                              | retravailler la donnée, filtrer   |
| « Publier l'emploi du temps » | un document A4 paysage, **une page par classe**, en grille jour × tranche horaire | afficher, distribuer, imprimer    |

Les confondre donnait soit un tableau illisible sur une porte de salle, soit un document impossible
à filtrer dans un tableur. La publication est composée en HTML puis confiée à la fenêtre
d'impression du navigateur — même procédé que les reçus de caisse (`finances/utils/recu.js`) : rien
n'est ajouté au balisage des écrans, et le navigateur gère seul la pagination et l'enregistrement en
PDF.

**Ce que « dynamique » veut dire ici** — rien n'est figé dans le gabarit : les tranches horaires sont
celles que les créneaux portent réellement (une classe qui commence à 7 h 30 a sa ligne 7 h 30), les
colonnes sont les seuls jours occupés (une classe à trois jours de cours n'affiche pas cinq colonnes
vides), et une page de garde annonce le périmètre publié — un emploi du temps affiché sans dire ce
qu'il couvre invite à le prendre pour celui de tout le monde.

> #### Les conflits d'agenda sont montrés, pas masqués
>
> Deux cours d'une même classe sur la même tranche sont conservés **tous les deux** dans la case, qui
> passe en rouge. Ce n'est pas un cas d'école : sur le jeu de démonstration, LP-COM-L1-B porte
> **trois** cours le lundi à 15 h 45, dans trois salles différentes. Un gabarit qui n'aurait gardé
> qu'une valeur par case aurait publié un emploi du temps faux, sans que personne ne s'en aperçoive.

La pagination de l'onglet « Par cycle & filière » aplatit l'arborescence, pagine les **classes**
(cinq cycles pour 135 classes : paginer les cycles n'aurait rien découpé), puis reconstruit cycles et
filières **de la page affichée**. Couvert par `publication.test.js` (10 tests) ;
`apercu.manuel.test.js` régénère le document à partir d'un extrait réel pour juger la mise en page à
l'œil (ignoré sans la variable d'environnement `APERCU_CRENEAUX`).

### 1.18 Le module `dashboard` — terminé (zéro travail backend)

```
src/modules/dashboard/
├── routes.js · api.js · store.js · store.test.js
├── components/   DashboardHeader · DashboardTabs
│   └── tabs/     VueEnsemble · Scolarites · Pedagogies · Cycles · Rapports
└── views/        DashboardView.vue
```

1 852 lignes → 1 430. **Le design est préservé** : cartes à liseré coloré, teintes
`bg-soft-*`, `text-xs`, `tracking-wider`, `rounded-4` — la charte ERP est celle de l'original.

**C'est l'écran d'accueil de l'application, et il n'émettait aucune requête.** Ses quatre KPI
étaient écrits **en dur dans le template** (« 37 050 000 FCFA », « 482 Inscrits »), ses graphiques
portaient des séries fixes, et son tableau du bas servait les **données de démonstration du thème
Bootstrap** — « Jeremy Ortega », « $790 », « Catalinaborough », en dollars, dans une application
scolaire libellée en FCFA, sous un commentaire `// Ajouter les autres données ici`.

| Onglet         | Avant                                                                                                                                  | Après                                                                                                               |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Vue d'ensemble | 4 KPI en dur + 3 « Flash Diagnostics IA » **inventés**, dont un nommant une filière précise avec son taux d'impayés                    | effectifs, capacité, taux de remplissage (`/classes/analytics/dashboard-global`) et répartition par cycle           |
| Scolarités     | 4 KPI en dur ; « Relancer » → `alert("Notification de mise en demeure envoyée… via SMS")` — **rien n'était envoyé, aucun backend SMS** | KPI réels (`/rapports/kpi`), encaissements par filière, retards réels (`/echeanciers/suivi`) → lien vers le dossier |
| Pédagogies     | suivi des vacations en dur (« Dr. Amadou Diallo »…)                                                                                    | corps enseignant, attributions et charge horaire réelles (`vue_infos_enseignants`, `vue_attributions_cours`)        |
| Cycles         | tout en dur, dont une « Note Secrétariat » créditant **un module de suivi des présences qui n'existe pas** (§1.7)                      | effectifs par cycle + remplissage des filières, avec une lecture **dérivée des données affichées**                  |
| Rapports       | catalogue de 4 rapports inventés, dates de génération fictives, Excel/PDF → `alert("Génération à la volée réussie")`                   | catalogue de **5 extractions réelles**, chacune adossée à son endpoint, fichier produit dans le navigateur          |

#### Le bug de la vue racine

`Dashboard.vue` portait `v-if="loading"` sur un `loading` **jamais déclaré** dans son
`<script setup>`. La condition valait donc toujours `undefined` : le `SkeletonLoader` ne s'est
jamais affiché. Le chargement est désormais porté par chaque onglet, au plus près de ses données.

Trois boutons-icônes de l'en-tête n'avaient **aucun `@click`**, et « Générer un rapport » ouvrait
une modale qui attendait 1,5 s avant d'annoncer « Le fichier a été généré avec succès par le noyau
de l'ERP » — **sans appeler la moindre API ni produire de fichier**. C'est mot pour mot ce qui avait
été retiré du module `etudiants` (§1.4). Le bouton renvoie maintenant vers l'onglet Rapports, qui
fait réellement ce que la modale prétendait faire.

#### Ce qui n'a pas de backend garde sa place, mais ne ment plus

Décision prise en cours de chantier : **conserver la mise en page, remplacer le contenu inventé par
un état honnête** (`EmptyState`) plutôt que de retirer les blocs. Le panneau « Flash Diagnostics IA »
annonce donc qu'aucun moteur d'analyse n'est raccordé, au lieu d'afficher trois diagnostics
fabriqués. Même traitement que `PresencesContent` et l'import de masse des créneaux (§1.17).

#### Aucun ajout serveur — tout existait déjà

Les cinq endpoints consommés étaient exposés depuis toujours et **aucun écran ne les appelait** :
`/classes/analytics/dashboard-global`, `/cycles/stats/distribution`, `/filieres/stats/organisations`,
`/pedagogies/enseignant/enseignants`, `/pedagogies/attribution/attributions`. Les agrégats
financiers ne sont pas redéclarés : le module réutilise **`finances/stores/rapports.js`**, qui les
porte déjà — dépendance `dashboard → finances` dirigée et déclarée, même montage que `notes →
examens` (§1.11).

> #### ⚠️ Les compteurs arrivent en chaînes
>
> `pg` sert ses `COUNT` et ses `SUM` en chaînes : `dashboard-global` renvoie `"10"`, `"1610"`,
> `"26"`. La division fonctionne par coercition, mais **l'addition concatène** et Chart.js reçoit des
> étiquettes au lieu de valeurs — l'axe reste vide **sans qu'aucune erreur ne soit levée**. Le store
> convertit à l'entrée, et **8 tests** (`store.test.js`) figent le contrat sur les charges utiles
> réelles relevées contre `localhost:3500`, y compris la garde contre la division par zéro.

#### Vérification

**Les dix endpoints ont été exercés avec un vrai jeton** (`superadmin`), et rendent tous
`success: true`. Deux remarques utiles pour la suite :

- `/echeanciers/suivi` rend **0 ligne** : la vue `v_finance_echeances` est vide en base, et le KPI
  confirme (`nb_en_retard: 0`). Le tableau d'alertes affiche donc son `EmptyState`. Le mappage de
  ses champs suit les colonnes déclarées de la vue et l'usage qu'en fait déjà `ControleClasse.vue` —
  mais **aucune ligne n'a réellement transité** par ce chemin.
- Les endpoints financiers exigent un jeton (401 sans). Les agrégats académiques, eux, sont
  **ouverts** : aucun `verifierToken` sur `/classes/analytics/*`, `/cycles/stats/*` ni
  `/filieres/stats/*`. À signaler côté backend — ces routes exposent les effectifs de
  l'établissement sans authentification.

**7 tests de montage** (`components/tabs/tabs.test.js`, jsdom) complètent les tests de store : ils
montent réellement les onglets et vérifient que les chiffres affichés sont ceux du serveur — et que
les valeurs inventées de l'ancien écran (« 37 050 000 », « Sciences Juridiques », « Dr. Amadou
Diallo ») n'apparaissent plus. C'est la leçon du §1.12 : lint, tests et build peuvent être au vert
pendant qu'un écran ne rend rien, faute de test qui le monte.

Le conteneur d'onglets Bootstrap a été remplacé par `AppTabs` : la page d'accueil montait ses **cinq
panneaux d'un coup**, soit cinq `onMounted` et cinq instances Chart.js pour n'en afficher qu'un.

### 1.19 Le module `stats` — réécrit, et le calcul des bulletins créé côté backend

```
src/modules/stats/
├── routes.js · api.js · store.js · constants.js · store.test.js
├── components/   StatsHeader · StatsTabs
│   └── tabs/     Synthese · Classes · Palmares  (+ tabs.test.js)
└── views/        StatistiquesView.vue
```

**Ce n'est pas une migration mais une réécriture** : l'écran d'origine ne pouvait pas être repris,
et le domaine backend sur lequel il aurait dû s'appuyer n'existe plus (voir l'encadré du §2.1).

#### L'écran d'origine était une maquette cassée

- `Statistiques.vue` servait deux formateurs codés en dur — « John Doe », « Anna Smith » — après un
  `setTimeout(3000)`. **Le même copier-coller que `RapportExamens` (§1.9) et `RapportConcours`
  (§1.10)**, pour la troisième fois, dans un écran de statistiques.
- Ses **5 composants d'onglet étaient byte-identiques** : la même table, à en-têtes d'examens.
- **Aucun ne recevait sa prop `rows`** → `v-for` sur `undefined` → les onglets affichaient une table
  vide, en-têtes seuls.
- **5 liens d'onglet pour 4 panneaux**, deux visant le même `#purchases`. `StatsKPI.vue` était
  orphelin. Aucun appel API, nulle part.

#### Le périmètre a été resserré

L'écran déclarait « Vue d'ensemble », « Académiques », « Finances », « Indicateurs », « Rapports ».
Les trois premiers et le dernier **refont le tableau de bord** (§1.18) — mêmes endpoints, mêmes
chiffres. Seul « Académiques » lui est propre. L'écran ne garde donc que les **résultats** :
synthèse (réussite, distribution, décisions, mentions), comparaison des classes, palmarès nominatif.

Le partage est net et tenu : **`dashboard` montre les effectifs et l'argent, `stats` montre les
résultats.** Aucun des deux n'appelle les endpoints de l'autre.

Le sélecteur année → semestre → classe n'est pas redupliqué : c'est `BulletinContexte` du module
`examens`, qui porte déjà la règle « un semestre appartient à une année ». Dépendance
`stats → examens` dirigée et déclarée, comme `notes → examens` (§1.11).

> #### ⚠️ Le calcul des bulletins n'existait pas — migration backend `010`
>
> **C'est le blocage du §2.5.13, levé.** `bulletins_semestriels` existait, ses quatre routes de
> lecture aussi, mais **rien ne remplissait la table** : elle était vide depuis toujours, et l'écran
> de délibération vide avec elle. Il manquait le calcul.
>
> `calculer_bulletins_semestriels(classe, semestre, annee)` enchaîne
> `inscriptions → moduleclasse → sessions_evaluation → evaluations → notes`, puis la moyenne
> pondérée par module, les coefficients, les crédits, le rang et la décision. S'y ajoute
> `vue_statistiques_resultats`, qui enrichit chaque bulletin de son contexte et pré-calcule sa
> tranche de moyenne.
>
> **Deux choix explicites**, documentés dans la migration :
>
> - **La pondération ne porte que sur les épreuves réellement notées.** Un étudiant à qui il manque
>   une note n'écope pas d'un zéro implicite : compter l'absence comme un échec est une décision de
>   jury, pas un fait de calcul.
> - **Le coefficient vient de la maquette quand elle existe, du module sinon.** > `maquette_pedagogique` (migration 009) porte coefficient, ECTS et note éliminatoire — mais elle
>   est **vide en base**. Le repli est `module.coefficient` puis `module.credit`, tous deux
>   renseignés.
>
> **Trois gardes, vérifiées en base** : la fonction est idempotente (rejouée, elle met à jour et ne
> duplique pas) ; elle **ne touche jamais** un bulletin `VERROUILLE` ; et elle ne réécrit décision et
> mention que tant que le bulletin est un **brouillon** — la décision du jury survit à un recalcul.
>
> La décision produite est une **proposition** (`VALIDE` ≥ 10, `RATTRAPAGE` ≥ 7, `AJOURNE` sinon),
> que le jury corrige via `PUT /resultats/bulletins/:id/decision`. Sous la moyenne, **aucune mention
> n'est décernée** : la colonne est nullable, on ne donne pas un « passable » à un ajourné.
>
> Deux routes ajoutées : `POST /evaluations/resultats/classes/:id/bulletins/generer` et
> `GET /evaluations/resultats/statistiques` (filtres classe, semestre, année, filière — tous
> facultatifs). **+9 tests backend** ; les 11 échecs de la suite préexistaient et sont inchangés.

> #### Un `llm_summary` qui mentait
>
> Le formateur de type « bulletin » appliqué à `{ generatedCount }` et `{ publishedCount }` — des
> compteurs, pas des bulletins — annonçait « Moyenne générale: 0.00/20. Décision: EN_ATTENTE » sur
> des objets qui ne portent aucun de ces champs. Le paramètre `type` est facultatif : sans lui,
> aucun résumé n'est fabriqué. Corrigé sur les quatre réponses concernées, dont deux préexistantes.

#### Deux pièges de données, couverts par les tests

- **`AVG` d'un ensemble vide vaut `null`, pas 0.** Un filtre sans résultat affichait « NaN/20 » si
  on le formatait comme un nombre. L'écran rend « — ».
- **Le `GROUP BY` n'émet que les tranches peuplées.** Un histogramme bâti dessus aurait des colonnes
  manquantes plutôt que des colonnes à zéro, et **sa forme changerait d'un filtre à l'autre**. Le
  store complète les sept tranches.

**22 tests** : 14 sur le store, 8 de montage — ces derniers vérifiant que les chiffres affichés sont
ceux du serveur, et que « John Doe » a bien disparu.

### 1.20 L'espace de gestion des notes — nouvel espace, et le flux de validation créé côté backend

```
src/modules/espace-notes/
├── routes.js · constants.js · store.js
├── layouts/     EspaceNotesLayout.vue      ← sidebar, hors layout applicatif
├── components/  BandeauEtapes.vue
└── views/       ConnexionView · TableauBordView · GrilleNotesView · MoyennesView
```

La saisie des notes quitte l'écran habituel pour un **espace dédié**, ouvert dans une fenêtre
minimale (`window.open`, sans barre d'outils ni menus) depuis le bouton de `/notes`. Il porte la
chaîne complète — saisie, vérification, validation, publication — avec ses rôles, et
`/notes` devient un écran de **consultation seule** qui n'affiche que les notes `VALIDEE` ou
`PUBLIEE`.

**Session indépendante.** `core/auth/tokenStorage.js` range désormais le jeton sous une clé par
espace (`token` / `token:espace-notes`), la portée étant fixée au démarrage d'après l'URL de la
fenêtre. Deux fenêtres sur le même navigateur, deux sessions : entrer dans l'espace exige de
s'identifier, et s'en déconnecter ne ferme pas l'application. Le 401 y renvoie vers la connexion de
l'espace, pas vers celle de l'application.

> #### ⚠️ Trois manques bloquants côté backend — corrigés (commit dédié dans `cfibackend`)
>
> | Constat                                                                                                                                              | Correction                                                                                              |
> | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
> | **Aucune note ne pouvait être créée.** Pas de `POST` ; `PUT /notes/:id` suppose la ligne existante. Une classe jamais notée était donc impossible à noter. | `POST …/evaluations/:id/notes/saisie`, branché sur `importer_notes_batch` — fonction **déjà en base**, sans aucun appelant. |
> | **`VALIDEE` n'existait que dans la contrainte `CHECK`.** `publier` faisait passer `SAISIE` → `PUBLIEE` : la validation de la scolarité était court-circuitée. | `PATCH …/notes/statut` avec table de transitions (`SAISIE→VALIDEE`, `VALIDEE→PUBLIEE`, `VALIDEE→SAISIE`). La publication part maintenant de `VALIDEE`. |
> | **Aucune garde de rôle** sur les routes de notes, alors que `verifierRole` existait et que le domaine est authentifié de bout en bout.                      | `verifierRole` posé par route ; règle fine par transition dans le contrôleur (403 sinon).                |
>
> Corrigé aussi : `PUT /notes/:id` **ramène la note en `SAISIE`**. Sans cela, corriger la valeur
> d'une note validée lui laissait une validation qui ne portait pas sur elle.

**Qui fait quoi** — les rôles existaient déjà en base, aucun n'a été inventé :

| Étape        | Rôle                     | Effet serveur           |
| ------------ | ------------------------ | ----------------------- |
| Saisie       | ENSEIGNANT, GESTIONNAIRE | crée/corrige → `SAISIE` |
| Vérification | GESTIONNAIRE             | **aucun** — voir ci-dessous |
| Validation   | SCOLARITE                | `SAISIE → VALIDEE`      |
| Publication  | DIRECTEUR                | `VALIDEE → PUBLIEE`     |

> **La vérification n'est pas un statut.** La colonne n'accepte que trois valeurs ; ajouter un
> quatrième état aurait demandé une migration du schéma, hors du périmètre autorisé. Elle est donc
> un **contrôle de conformité recalculé à chaque affichage** — complétude de l'effectif, bornes
> [0, 20], notes rattachées à un matricule absent de la classe — et la validation reste désactivée
> tant qu'il n'est pas vert. On ne prétend nulle part qu'une grille « a été vérifiée » : on montre
> si elle *est* conforme.

Deux jointures que le serveur ne sait pas faire sont assurées par le store de l'espace :
**évaluations d'une classe** (une évaluation appartient à un module et à une session ; le lien à la
classe passe par `ModuleClasse`) et **effectif à noter** (la grille ne renvoie que les étudiants
déjà notés — au premier remplissage elle est vide, l'effectif vient de `GET /classes/:id/etudiants`).

**30 tests** : capacités par rôle (miroir de la table de transitions du serveur), contexte,
store des notes (saisie en lot, transitions, statut global), grille (effectif complet, envoi par
matricule, boutons par rôle, grille publiée non modifiable) et écran habituel (seules les notes
officielles, aucun champ de saisie).

### 1.21 Bibliothèque, coordination académique et documents administratifs — trois modules créés

Sept entrées de menu existaient dans `main` — `/bibliotheque`, `/themes-memoires`, `/soutenances`,
`/statut`, `/demande-diplome`, `/edition-diplome`, `/historique-diplome`. **Aucune ne pointait vers
quoi que ce soit** : ni route, ni vue, ni table. Il n'y avait donc rien à restaurer.

```
src/modules/bibliotheque/   catalogue · mémoires & thèses
src/modules/coordination/   travaux/ · soutenances/ · statut/
src/modules/documents/      demandes en cours · historique · documents délivrables
```

Trois migrations, appliquées sur `cfi_data_v2` et reflétées dans `schema.sql` (76 tables, 42 vues) :

| Migration                        | Contenu                                                                                  |
| -------------------------------- | ---------------------------------------------------------------------------------------- |
| `014_bibliotheque.sql`           | `ouvrages` + `v_ouvrages_catalogue` (disponibilité dérivée, jamais stockée)               |
| `015_coordination_academique.sql`| `travaux_recherche`, `proces_verbaux_soutenance`, colonnes ajoutées à `soutenances`, 3 vues |
| `016_documents_administratifs.sql`| `types_documents` (13 types LMD), `demandes_documents`, `v_demandes_documents`            |

> #### Ce que la base savait déjà faire, sans que personne l'appelle
>
> - **`fn_numero_document(type, préfixe, année)`** — numérotation officielle par type et par année,
>   présente depuis toujours, **zéro appelant**. Elle produit désormais les numéros de PV
>   (`PV-2026-0001`, en `DEFAULT` de colonne) et de demandes (`ATT-2026-0001`, dans la transaction
>   d'enregistrement). Un bug l'empêchait de servir : `compteurs_documents.type_document` est un
>   `varchar(20)` alors que les codes de type vont jusqu'à 40 caractères — `22001 value too long`
>   sur la moitié du catalogue. Relevé **en exerçant la route**, pas en la relisant.
> - **`soutenances` et `soutenance_jurys`** existaient (dates, salle, rôles du jury) sans aucune
>   route ni écran. Elles sont complétées, pas remplacées : `travail_id`, `statut`, `type_soutenance`
>   et une contrainte `heure_fin > heure_debut` — une soutenance finissant avant de commencer était
>   acceptée.

**Deux règles métier déduites, jamais codées en dur.** Un **finaliste** est un étudiant dont le
niveau porte le dernier rang de son cycle (`niveau.ordre = cycle.duree_annees`) : la règle vaut pour
une licence de trois ans comme pour un cycle d'ingénieur de cinq, et un nouveau cycle est pris en
compte sans toucher au code. Une **échéance** de mémoire vaut `date_attribution + duree_semaines × 7`,
posée par déclencheur quand elle n'est pas saisie. `v_finalistes` renvoie déjà **10 étudiants réels**.

**Ce qui est dérivé ne se stocke pas** : disponibilité d'un ouvrage, retard d'un travail ou d'une
demande, délai réellement constaté. Une colonne fige au jour de l'écriture ce qui change avec le
calendrier.

Côté backend, trois domaines authentifiés de bout en bout (`/api/bibliotheque`, `/api/coordination`,
`/api/documents`), avec gardes de rôle : la **validation d'un procès-verbal** (DIRECTEUR, C_CYCLE)
est plus étroite que sa rédaction (PEDAGOGIE, SCOLARITE, C_CYCLE), car elle rend le document
opposable, fait passer la soutenance à « tenue » et le mémoire à « soutenu ». Le circuit d'une
demande de document est contraint côté serveur (`SOUMISE → EN_TRAITEMENT → PRETE → DELIVREE`) : une
transition impossible répond **409** en disant pourquoi, et un rejet sans motif est refusé — par la
base autant que par le contrôleur.

> **Les dix routes ont été exercées contre `cfi_data_v2`**, écritures comprises : création d'ouvrage,
> attribution de thème (échéance calculée à +20 semaines), soutenance avec jury en transaction, PV
> numéroté puis validé (soutenance passée à « tenue »), circuit complet d'une demande et transitions
> refusées. Les données de test ont été supprimées ensuite. Un second bug y a été pris :
> `42P08 inconsistent types deduced for parameter $2` sur le changement de statut, faute de
> paramètres typés.

**18 tests** sur les trois stores : cumuls du fonds, séparation catalogue / mémoires, finalistes sans
sujet, moyenne d'avancement calculée sur les seuls travaux engagés, séparation des demandes ouvertes
et closes, et miroir des transitions autorisées.

---

### 1.22 L'assistant IA — mise en forme des réponses, et quatre onglets de domaine

L'assistant existait (`src/modules/assistant/`, `POST /api/assistant/question`) mais n'était
accessible que depuis son écran de plateforme, et **ses réponses ne rendaient rien de leur mise en
forme** : le fil les affichait en `white-space: pre-wrap`, par crainte — justifiée — d'une injection
HTML. Un tableau de quinze filières s'y lisait comme une bouillie de barres verticales.

**Trois interventions, dans cet ordre. Aucune ne suffisait seule** — vérifié en interrogeant
`llama-3.3-70b` après chacune :

| Où                                     | Quoi                                                                                                             |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `assistant/prompt.js` (backend)        | section « Mettre en forme » : markdown GFM, **tableau obligatoire dès trois lignes**, placée **après** le catalogue |
| `assistant/tools/index.js` (backend)   | le même rappel au pied de chaque résultat d'outil de trois lignes ou plus                                          |
| `assistant/utils/markdown.js` (front)  | rendu markdown sûr : HTML brut échappé, liens bornés à `http`/`https`/`mailto`, images refusées                   |

> La consigne de forme placée avant le catalogue **ne tient pas** : celui-ci pèse quelques milliers
> de jetons, et au moment de rédiger, le modèle a sous les yeux le résultat SQL, pas la règle. Trois
> reformulations en amont n'y ont rien changé ; le rappel posé au pied du résultat, si.
> Une règle de `REGLES_REPONSE` la contredisait par ailleurs (« réponds à l'oral d'un collègue »).

**Quatre onglets « Assistant IA »**, un seul composant (`AssistantPanneau.vue`, disposition reprise
de l'onglet financier) :

| Écran                                        | `cadrage`               | Répond sur                                     |
| -------------------------------------------- | ----------------------- | ---------------------------------------------- |
| Structure académique → **Semestres**         | `structure-academique`  | années, cycles, filières, niveaux, classes, UE |
| Scolarité → **Délibération**                 | `scolarite`             | dossiers, inscriptions, notes, jury            |
| Examens → **Rapports**                       | `examens`               | bulletins, moyennes, rangs, mentions           |
| Finances → **Rapports** (mock remplacé)      | `finances`              | encaissements, impayés, échéances              |

Le `cadrage` transite jusqu'au prompt (`CADRAGES`) et **n'accorde aucun droit** : le cloisonnement
reste le catalogue filtré par rôle. Un cadrage inconnu répond `400` plutôt que d'être ignoré. Le
store est instancié **par cadrage** : un store unique aurait fait partager un seul fil serveur aux
quatre onglets, chacun héritant du contexte des autres.

L'onglet financier servait jusqu'ici quatre réponses codées en dur, choisies par mot-clé après un
`setTimeout(1200)` : « trésorerie » rendait toujours les mêmes 8 450 000 FCFA, base vide comprise.
`DeliberationView` et `RapportsView` (examens) sont passées en onglets pour l'accueillir ; leurs
actions d'export et de publication ont suivi le contenu auquel elles s'appliquent.

**La place laissée à la réponse.** Les tableaux sortaient comprimés, en-têtes repliés sur deux
lignes. Quatre causes, toutes corrigées :

- les amorces occupaient une **colonne** à gauche (un quart de la largeur) ; elles forment
  désormais une **rangée** au-dessus du fil. Un seuil (« deux colonnes au-delà de 1400 px ») aurait
  laissé le défaut intact sur une partie des écrans sans qu'on sache lesquels ;
- la bulle de **réponse** était bridée à 78 % de largeur — celle de la **question** l'est toujours,
  c'est ce qui distingue les deux interlocuteurs ;
- Bootstrap pose `width: 100%` sur `.table` : la largeur du cadre décidait de tout et les colonnes
  se comprimaient. En `width: max-content; min-width: 100%`, c'est le contenu qui fixe la largeur et
  le cadre défile s'il ne suit pas ;
- marges resserrées (`p-3`, fil à `0.25rem`) et fil porté de 42 à 58 vh.

**Le SQL des réponses est réservé au rôle ADMIN.** Il n'apprend rien de contrôlable à un chef de
scolarité et expose le schéma de la base à chaque réponse. La vérifiabilité n'est pas perdue : le
serveur journalise les appels d'outils dans `assistant_echanges`, que `GET /assistant/historique`
rend. ⚠️ Le rôle vient du profil **en mémoire**, que la connexion renseigne mais qu'un rechargement
de page perd : les écrans qui montent l'assistant appellent donc `fetchCurrentUser()`. À défaut, le
bloc se serait masqué à un administrateur revenu par F5 — le défaut se fait dans le sens sûr.

_(Ce masquage n'était alors que **visuel** : le serveur joignait le SQL à toutes les réponses. Il
filtre désormais lui-même — voir §1.24.)_

> #### Trois défauts du catalogue serveur, révélés en exerçant les onglets
>
> - **`principales` n'ordonnait rien.** La liste ne servait que de drapeau : la coupe à huit colonnes
>   suivait l'ordre de la base, où l'état civil précède tout. `vue_statistiques_resultats` promettait
>   « taux de réussite et classements » en masquant `filiere`, `moyenne_generale` et `rang_etudiant`
>   derrière `etudiant_id, matricule, nom, prenom, sexe` — le modèle groupait par **classe** une
>   question posée par **filière**, sans que rien ne le signale. L'ordre déclaré est désormais
>   respecté (`catalog/index.js`), et les deux vues réordonnées. Coût : +237 caractères de prompt.
> - **Le fan-out des capacités n'était pas documenté** pour l'assistant : `v_organisation_filieres`
>   et `v_organisation_cycles` annoncent 33 790 places pour 5 400 réelles (vérifié en base). Leurs
>   colonnes de capacité et de taux portent maintenant une glose « NE PAS UTILISER », et la
>   description oriente vers `v_organisation_classes`. Vérifié : l'assistant s'y conforme.
> - Une glose de colonne reste affichée même quand la colonne sort des huit premières — c'est ce qui
>   maintient `rang_etudiant` connu du modèle sans dépenser une place.

**Vérifié contre `localhost:3500`** avec les quatre cadrages : tableaux markdown corrects, chiffres
recoupés en base, sources saines choisies, cadrage inconnu refusé en `400`. **17 tests front**
(rendu markdown et réponses hostiles, fil, panneau, isolation des fils par écran, SQL réservé à
ADMIN dans les deux sens) et **8 tests backend** (catalogue, rappel de tableau, transit du cadrage).

⚠️ **Le rendu à l'écran n'a pas pu être vérifié en navigateur** : Chromium ne démarre pas dans cet
environnement (`libnspr4.so` absente, `npx playwright install-deps chromium` demande les droits
d'administration). Les largeurs et hauteurs ci-dessus sont raisonnées, pas constatées ; les tests de
montage (jsdom) verrouillent le balisage produit, pas sa mise en page.

---

### 1.23 La barre latérale — repli automatique, et fin du bouton « menu »

Le repli dépendait d'un bouton de la barre du haut. Elle en portait **deux**, et aucun ne
fonctionnait correctement :

- celui du bandeau de marque (`data-toggle="minimize"`, hérité du gabarit HTML) **n'avait aucun
  gestionnaire** — le script jQuery qui l'aurait animé (`public/js/template.js`) bascule la classe
  sur `body`, là où l'application la pose sur `.container-scroller` ;
- celui de droite basculait un état local que **rien ne rétablissait au redimensionnement** :
  replié sur un portable puis rouvert sur un grand écran, on gardait une barre en icônes.

Il n'en reste qu'un : un chevron, **à hauteur du logo**, à la place exacte du bouton mort du
gabarit. C'est là qu'il revient — le bandeau de marque et la barre latérale forment une seule
colonne, qui se rétrécit d'un bloc de 257 px à 70 px. `shared/composables/useSidebarRepli.js` fixe
le **défaut** d'après la largeur de la fenêtre, le chevron le contredit :

| Largeur (pixels CSS) | Mode    | Barre latérale par défaut | Contenu           |
| -------------------- | ------- | ------------------------- | ----------------- |
| ≥ 1280 px            | `large` | déployée (257 px)         | marges normales   |
| 1100 – 1279 px       | `moyen` | icônes (70 px)            | marges normales   |
| < 1100 px            | `petit` | icônes (70 px)            | marges resserrées |

> #### `window.innerWidth` compte des pixels CSS, pas des pixels d'écran
>
> Le seuil valait d'abord 1440 px, choisi sur la place restant au contenu. Il repliait la barre sur
> un **1920×1080** : Windows y recommande une mise à l'échelle de 150 %, qui ne présente que
> **1280 pixels CSS**. Signalé à l'usage — « pourtant ma résolution est de 1920×1080 ». Deux
> conséquences, tirées ensemble : le seuil descend à 1280, et surtout **la largeur ne décide plus
> seule**. Le choix de l'utilisateur prime et se conserve (`localStorage`, clé
> `cfi.sidebar.repli`) : c'est un réglage d'espace de travail, pas un état de navigation.

> #### Trois défauts que ce basculement a mis au jour
>
> - **Le mode icônes rendait sept rubriques sur dix inatteignables.** Leur entrée de premier niveau
>   n'est pas une route, seulement l'en-tête d'un groupe, et le gabarit masque les sous-menus
>   repliés. Ses règles `.hover-open` prévoyaient une ouverture en surimpression, mais la classe
>   était posée par `public/js/hoverable-collapse.js`, conditionnée à `body.sidebar-icon-only` :
>   **elle ne s'est jamais déclenchée**. C'est `sidebar.vue` qui la pose maintenant — au survol
>   **et au clic** : s'en remettre au seul survol suppose une souris, et un clic sans effet visible
>   est ce qui donne l'impression que le menu ne répond plus. La surimpression elle-même est
>   décrite dans `sidebar.vue` plutôt que laissée aux règles du gabarit, qui reposent sur trop
>   d'hypothèses (`@media`, `overflow`, `position`) pour qu'un affichage vital en dépende. Les
>   entrées sans sous-menu reçoivent une infobulle.
> - **`.sidebar-icon-only .main-panel` était écrit dans un `<style scoped>`** de `sidebar.vue` :
>   Vue n'ajoute son attribut qu'au dernier sélecteur, et `.main-panel` appartient à `DefaultLayout`
>   — la règle ne visait rien. La barre se réduisait à 70 px, le panneau restait calculé sur 257, et
>   187 px de blanc s'ouvraient entre les deux. Ce bloc dupliquait par ailleurs, en moins complet,
>   ce que la feuille du gabarit décrit déjà : il est supprimé.
> - **L'ouverture « hors-canevas » pour téléphone** (`.sidebar-offcanvas.active`) n'avait plus de
>   déclencheur une fois le bouton retiré : la barre aurait disparu sous 992 px sans moyen de la
>   ramener. Elle est neutralisée.

**Le format téléphone et la tablette de format courant ne sont pas desservis**, et c'est désormais
visible plutôt que subi : sous 1024 px la page prend une largeur minimale et défile
horizontalement, au lieu de se disloquer.

**20 tests** : les trois seuils, le suivi du redimensionnement **dans les deux sens** (le défaut de
l'ancien bouton), le retrait de l'écouteur quand plus aucun composant n'observe, le choix explicite
qui prime sur la largeur et se conserve, le retour au mode automatique, l'ouverture des groupes au
survol **et** au clic uniquement quand la barre est repliée, les infobulles, et le chevron unique du
bandeau de marque — sens du mouvement, `aria-expanded`, aller-retour. ⚠️ Même réserve
qu'au §1.22 : **rien n'a pu être vérifié en navigateur**, faute de pouvoir en démarrer un ici — ce
qui a précisément laissé passer le défaut des pixels CSS.

---

### 1.24 L'espace de chat — les conversations enfin rouvrables, et l'audit du module

**Le défaut constaté à l'usage : on perdait ses conversations.** Le fil de l'assistant vivait le
temps de l'écran. Le §1.22 le présentait comme un choix — rouvrir une conversation d'hier
afficherait des chiffres périmés —, et l'argument tient ; mais il condamnait l'utilisateur à ne
jamais retrouver ce qu'il avait demandé, alors que le serveur, lui, journalisait tout depuis la
migration 012.

La cause technique était ailleurs : **aucune route n'exposait le détail d'un fil.**
`GET /conversations` ne rendait que des en-têtes, et `EchangeModel.findConversation()` est réservée
à la reconstruction du prompt (5 échanges, aboutis seulement). L'écran `/assistant-ai` listait donc
des conversations qu'un clic ne pouvait pas ouvrir.

#### Le partage des rôles

| Où                                                | Sert à                                                                    |
| ------------------------------------------------- | ------------------------------------------------------------------------- |
| `/assistant-ai` et les 4 onglets métier (§1.22)   | la **question rapide** sur la vue affichée ; fil de session, sans mémoire  |
| `/espace-chat` — onglet distinct, hors du layout  | la conversation suivie, la relecture de tout l'historique, l'export, l'audit |

Un lien « Poursuivre dans l'espace » passe de l'un à l'autre **sans reposer la question** : le fil
existe côté serveur, l'espace le rouvre par son identifiant.

#### La prudence d'origine, conservée autrement

Le fil est rechargé, mais chaque message rejoué porte `archive: true` et son horodatage serveur.
`AssistantFil` affiche alors « Chiffres arrêtés au … ». On restitue une trace, pas une réponse
encore valable — ce qui répond à l'objection du §1.22 sans renoncer à l'historique.

#### Backend — migration 018 et cinq routes

- **`assistant_echanges.cadrage`** : le cadrage était reçu, transmis au prompt… et jeté. Il est
  désormais journalisé, ce qui permet d'étiqueter et de filtrer l'historique par domaine.
  ⚠️ **Les 47 échanges antérieurs restent NULL** (« Général ») : rien ne permet de les rattacher
  après coup, et le deviner fabriquerait une statistique fausse.
- **`assistant_conversations`** : la migration 013 avait écarté cette table « jusqu'au jour où une
  conversation portera des attributs propres ». L'archivage et le renommage sont ces attributs. Elle
  est **creuse** — aucune ligne tant que l'utilisateur n'agit pas —, la liste reste construite sur
  les échanges avec une jointure externe.
- `GET /conversations/:id` (fil complet, échecs compris), `PATCH /conversations/:id`
  (`titre`, `archivee`), `GET /audit` et `GET /audit/statistiques`, ces deux dernières en
  `verifierRole(['ADMIN'])` — **seule exception** à la règle du domaine (« pas de `verifierRole`
  ici, le cloisonnement se fait au catalogue ») : l'audit lit le journal de *tous* les utilisateurs,
  le catalogue n'y protège rien.
- `EchangeModel.statistiques()` existait depuis la migration 012 et **n'était appelée par personne** ;
  elle est exposée et complétée (par fournisseur — c'est ce qui rend les replis visibles —, et par
  jour via `generate_series`, sans quoi un jour creux disparaît de la série).
- **Défaut corrigé au passage** : `POST /question` joignait le SQL exécuté à **toutes** les
  réponses. `AssistantRequetes.vue` le masquait hors ADMIN, mais le masquage était purement visuel —
  la carte du schéma partait dans chaque réponse, lisible dans l'inspecteur réseau. Le filtrage est
  maintenant fait côté serveur (`requetesPour`), sur cette route comme sur la nouvelle. Aucun
  changement à l'écran.
- **Pas de `DELETE`, et ce n'est pas un oubli** : `assistant_echanges` est le journal d'audit du
  module et son seul jeu d'évaluation du prompt. `archivee` masque, la trace reste.

#### Frontend — un espace, un seul fichier du noyau touché

`src/modules/assistant/espace/` (coquille, liste, barre de fil, chat, audit, store) et
`constants.js` / `utils/export.js` au niveau du module. Le noyau ne reçoit que l'étalement des
routes hors `DefaultLayout` dans `core/router/index.js`.

**Différence de fond avec l'espace de notes (§1.20)** : celui-ci a sa propre session (jeton sous une
autre clé, écran de connexion dédié, routes `meta.public` + garde locale). L'espace de chat
**partage la session de l'application** — c'est ce qui lui permet d'afficher les conversations de
l'utilisateur sans le faire se reconnecter. Il ne déclare donc **rien de public** : la garde
générale le protège comme n'importe quel écran interne, et `tokenStorage.js` comme `main.js`
l'ignorent. Un `meta.public` posé par mégarde y ouvrirait l'historique à qui tape l'URL ; un test le
verrouille.

Second écart : `height: 100vh; overflow: hidden`, quand l'espace de notes est en `min-height` et
laisse défiler la page. Une grille de notes défile ; un composeur de chat doit rester au bas de
l'écran.

**Retiré de `/assistant-ai`** : la liste des conversations passées. Elle **listait sans pouvoir
rouvrir** — un inventaire de ce qu'on ne peut pas consulter. La carte « Sources accessibles » reste.
`fetchConversations` et l'état `conversations` du store embarqué sont supprimés avec elle, ainsi que
l'aller-retour qu'il ajoutait à chaque réponse.

**Export** : `useTableExport` ne convient pas (trois sorties tabulaires ; un fil y deviendrait une
colonne de plusieurs milliers de caractères) et `ExportMenu.vue` est figé sur deux formats. D'où
`utils/export.js` : le Markdown conserve la conversation telle qu'elle s'est tenue, tableaux
compris ; le CSV en rend le **relevé**, une ligne par échange.

**Ajouts partagés** : `formatDateTime` et `formatRelatif` (`shared/utils/date.js` ne formatait que
des dates, jamais d'heure — `toLocaleDateString` ignore `hour` sans rien signaler) et `tronquer`
(`shared/utils/text.js`), pour les cas où le CSS ne peut rien : un `title`, un nom de fichier.

**Vérifié contre `localhost:3500`** avec deux jetons : fil de 8 échanges rouvert dans l'ordre, 404
pour un non-propriétaire, 400 sur un UUID malformé, 403 sur `/audit` pour `scolarite`, archivage
puis restauration sans perte du titre, filtres `q` et `cadrage`, statistiques réelles (47 échanges,
2 fournisseurs — le repli `groq` → `mistral` y est visible), et une question cadrée posée de bout en
bout dont le `cadrage` se retrouve en base puis dans l'étiquette de la liste. `requetes` vaut bien
`[]` pour `scolarite`. Migration rejouée pour éprouver son idempotence.

**36 tests front ajoutés ou étendus** : routes de l'espace (aucun `meta.public`, montage hors
layout, `c/:id` qui ne mange pas `audit`), store (dépliage d'un échange en deux bulles, marquage
`archive`, erreur affichée plutôt qu'une bulle vide, liste rafraîchie une seule fois par fil, titre
relu dans la liste après un renommage annulé), export (dates, tableaux préservés, RFC 4180, BOM) et
les deux utilitaires partagés.

⚠️ **Même réserve qu'aux §1.22 et §1.23 : rien n'a pu être vérifié en navigateur** — Chromium ne
démarre pas ici. La mise en page plein écran (barre latérale repliable, fil qui défile sous un
composeur ancré) est raisonnée, pas constatée.

---

### 1.25 Refonte de l'écran `/assistant-ai` — barre d'appel et aperçus dérivés du catalogue

Le §1.24 a vidé cet écran de sa liste de conversations sans redessiner ce qui restait : trois quarts
de page pour une conversation vide, un quart pour un compteur (« 20 vues, selon votre rôle » et cinq
pastilles de domaine). Or il ne sert plus qu'à deux choses depuis le partage des rôles — **la
question rapide et l'aperçu**.

#### Deux états, pas deux écrans

| État                       | Ce qui s'affiche                                                                 |
| -------------------------- | -------------------------------------------------------------------------------- |
| À l'arrivée                | barre d'appel centrée (bridée à 46 rem) + tuiles d'aperçu groupées par domaine    |
| Dès la première réponse    | le fil seul, pleine largeur ; barre d'appel et tuiles s'effacent                  |

Un champ vide n'apprend à personne ce qu'un assistant sait faire ; à l'inverse, garder les tuiles
sous une réponse pousserait un tableau de quinze lignes sous le pli. Retour au premier état par
« Nouvelle question ».

`AssistantChamp` gagne une variante `accueil` (champ agrandi, bouton d'envoi rond) — **une taille,
pas un comportement** : dupliquer le composant aurait fait diverger deux fois la même règle de
clavier.

#### Les aperçus viennent du catalogue, pas d'une liste en dur

`GET /catalogue` (bon marché, aucun modèle sollicité) est désormais appelé au montage — l'action
`fetchCatalogue` du store existait et **n'était appelée par personne**. Les tuiles n'affichent que
les domaines qu'il déclare accessibles au rôle.

Écart réel mesuré sur le jeu de démonstration : ADMIN 20 vues sur cinq domaines, SCOLARITE 14,
**PEDAGOGIE 13 et aucune source financière**. Sans ce filtre, un responsable pédagogique se verrait
proposer « quelles classes ont le plus d'impayés ? », que le garde SQL refuserait — un bouton qui
ment.

⚠️ **Deux vocabulaires se croisent, et les confondre donne des tuiles qui ne s'affichent jamais** :
un **cadrage** nomme un écran (`structure-academique`, `scolarite`, `examens`, `finances`), un
**domaine de catalogue** nomme un groupe de sources (`academique`, `evaluations`, `finances`,
`pedagogie`, `concours`). Seul `finances` porte le même nom des deux côtés. `apercus.js` est indexé
par domaine de catalogue ; `constants.js` par cadrage.

**Les questions restent écrites à la main**, jamais engendrées depuis un nom de vue : une question
fabriquée tomberait dans les pièges du dépôt. Deux tests les verrouillent — le remplissage n'est
demandé que par classe, et le comptage des enseignants dit « distincts » (`vue_infos_enseignants`
rend une ligne **par diplôme ET par contrat**, un COUNT nu y compte les diplômes).

#### La carte des sources, conservée mais rendue utile

Elle devient un panneau dépliable en pied d'écran qui **nomme** les vues, groupées par domaine, avec
leur description. Le compteur seul ne disait ni ce qu'on peut demander ni surtout ce qu'on ne peut
pas, ce qui rendait un refus inexplicable. Repliée par défaut : vingt vues avec leurs gloses
occupent un écran entier. Les **colonnes ne sont pas affichées** — elles n'apprennent rien à qui
pose ses questions en français, et étaler le schéma à chaque visite irait contre le masquage du SQL
hors ADMIN. Repli sur `/sante` tant que le catalogue n'est pas arrivé, ou s'il échoue.

**18 tests ajoutés** : filtrage par domaine dans les deux sens, ordre d'affichage (le serveur trie
alphabétiquement — « concours » passerait avant « académique »), domaine inconnu ignoré plutôt
qu'inventé, question posée **sans cadrage** (l'écran de plateforme n'est l'écran d'aucun domaine),
bascule entre les deux états, sources repliées puis dépliées, tuiles désactivées quand l'assistant
est hors service. Même réserve : **non vérifié en navigateur**.

#### Le module passe à Bootstrap Icons

Tout `mdi-*` du module — et des quatre onglets métier, qui **fournissent** les icônes de leurs
amorces au panneau — est converti en `bi-*`. L'application charge les deux jeux (`mdi` pour la barre
latérale et les écrans hérités, `bi` depuis `main.js`, déjà utilisé par l'espace de notes) : rien
n'empêche donc de les mélanger, et le mélange ne se voit qu'à l'œil — graisse et taille optique
diffèrent d'une glyphe à l'autre.

Les 54 correspondances ont été choisies par intention, pas par ressemblance de nom, et **chaque
cible a été vérifiée présente** dans `node_modules/bootstrap-icons/font/bootstrap-icons.css`
(2 078 icônes) avant remplacement — un nom inventé rendrait un `<i>` vide, sans erreur ni
avertissement.

⚠️ **Une icône `bi` exige deux classes** : la base `bi` **et** le nom `bi-xxx`. `class="bi-search"`
seul ne rend rien du tout, pas même un carré. `mdi` tolérait davantage l'oubli.

`icones.test.js` verrouille la convention en balayant les fichiers du module : aucun `mdi`, aucune
classe `bi-xxx` sans sa base, et tout nom déclaré en constante conforme à `/^bi-[a-z0-9-]+$/`.
Éprouvé en réintroduisant volontairement un `mdi-school` : les deux assertions concernées échouent
et nomment le fichier.

**Reste en `mdi`, délibérément** : l'entrée « Espace de chat » de `src/components/partials/sidebar.vue`.
La barre latérale est en `mdi` d'un bout à l'autre ; une seule entrée en `bi` y jurerait avec ses
voisines. Elle basculera avec la barre, pas avant.

---

## 2. Ce qui reste

### 2.1 Modules à migrer (par ordre conseillé)

**Migrés** : `structure-academique`, `etudiants`, `inscriptions`, `matieres`, `scolarite`, `examens`,
`concours`, `notes` + `deliberation`, `finances`, `pedagogies`, `dashboard`, `stats`.

**Tous les modules fonctionnels sont migrés.** Il ne reste que les résidus.

| #   | Module  | Fichiers | Lignes | Pourquoi cet ordre                                                                               |
| --- | ------- | -------- | ------ | ------------------------------------------------------------------------------------------------ |
| 1   | Résidus | ~12      | ~1 500 | `admin`, `schedule`, `prompt`, `docf`, `support`, `settings`, `notifications`, `errors`, `auth`. |

_(`parcours` ne figure plus ici : ses vues sont parties avec le module `scolarite`, §1.7. `absence`
et `structure` non plus : le premier a été retiré faute de backend (§1.7), le second était vide.)_

> #### ⚠️ `/statistiques` n'est pas « commenté » — il a été **supprimé**, et son code est mort
>
> Vérifié le 27/07/2026 contre `cfibackend` et la base `cfi_data_v2`. `index.routes.js` ne porte
> plus **aucune ligne** `/statistiques`, pas même en commentaire. Les deux fichiers ont été retirés
> en deux temps, tous deux dans l'historique de `HEAD` :
>
> | Fichier                                | Sort                                                                  |
> | -------------------------------------- | --------------------------------------------------------------------- |
> | `src/services/statistique.services.js` | supprimé à `8dc85ab` (« import inscriptions integrations »)           |
> | `src/routes/statistiques.routes.js`    | **vidé** à `8686c6b` (« concours routes »), puis supprimé à `3f7e4dc` |
>
> Le service a disparu **avant** ses routes : entre les deux commits, `statistiques.routes.js`
> faisait un `require()` sur un fichier absent. Rétablir le `router.use` à ce moment-là aurait fait
> **planter le serveur au démarrage** — d'où la mise en commentaire, puis le vidage, puis la
> suppression. Le code d'origine (116 lignes, 11 endpoints) reste lisible à `5b25a4c`.
>
> **Mais il n'y a rien à restaurer : 9 des 11 requêtes échouent contre la base réelle.** Elles ont
> été exercées une à une :
>
> | Endpoint                  | Verdict                                   |
> | ------------------------- | ----------------------------------------- |
> | `/par-filiere`            | ✅ OK                                     |
> | `/repartition-sexe`       | ✅ OK                                     |
> | `/globales`               | ❌ `relation "paiements" does not exist`  |
> | `/par-classe`             | ❌ `relation "cursus" does not exist`     |
> | `/par-annee`              | ❌ idem                                   |
> | `/classe-sexe`            | ❌ idem                                   |
> | `/filiere-cycle-annee`    | ❌ idem                                   |
> | `/taux-reussite`          | ❌ `relation "resultats" does not exist`  |
> | `/inscriptions`           | ❌ `column i.annee_id does not exist`     |
> | `/participation-concours` | ❌ `column c.nb_places does not exist`    |
> | `/filiere-cycle`          | ❌ `column cy.designation does not exist` |
>
> Le service a été écrit contre un **schéma antérieur**. Correspondances actuelles : `cursus` →
> `inscriptions`, `resultats` → `bulletins_semestriels`, `paiements` → `paiements_all`,
> `inscriptions.annee_id` → `annee_academique_id`, `cycle.designation` → `cycle.code`. Et
> `concours.nb_places` **n'existe pas du tout** : le taux de participation n'a plus de dénominateur.
>
> **Décision prise : ne pas restaurer, réécrire.** C'est ce qui a été fait (§1.19) — l'écran repose
> désormais sur `/evaluations/resultats`, dont la partie manquante (le calcul des bulletins) a été
> ajoutée par la migration `010`. Le domaine `/statistiques` reste supprimé, et n'a pas à revenir.

> #### ~~L'écran `stats` est une maquette, et elle est cassée~~ — réécrit, §1.19
>
> _Conservé pour mémoire : voici ce qui a été trouvé, et pourquoi rien n'a été repris._
>
> Rien à préserver côté frontend non plus :
>
> - `Statistiques.vue` sert, après un `setTimeout(3000)`, deux formateurs codés en dur — « John Doe »,
>   « Anna Smith ». **C'est le même copier-coller que `RapportExamens` (§1.9) et `RapportConcours`
>   (§1.10)**, pour la troisième fois, dans un écran de statistiques. Ses quatre `ref([])` ne sont
>   passées à aucun enfant.
> - Les **5 composants d'onglet sont byte-identiques** : la même table, à en-têtes d'examens
>   (`N° / Designation / Niveau / Examen / Valider`).
> - Aucun ne reçoit sa prop `rows` → `v-for` sur `undefined` → **les onglets affichent une table
>   vide**, en-têtes seuls.
> - **5 liens d'onglet pour 4 panneaux**, et deux liens visent le même `#purchases` : le 5ᵉ onglet
>   rouvre le 4ᵉ. `StatsKPI.vue` n'est importé nulle part.
> - **Aucun appel API, nulle part.**

### 2.2 Dette technique transverse

_(Chiffres recomptés le 27/07/2026 — les précédents dataient d'avant `finances` et `pedagogies`.)_

- **9 conteneurs d'onglets Bootstrap** encore en montage eager → à passer sur `AppTabs`. C'est le
  principal gisement d'optimisation d'API restant (§1.13).

  - **7 sont dans des modules déjà migrés** — `pedagogies/{formateurs,programme,crenaux,attributions}`
    et `finances/{facturations,rapports,paiements}`. Leurs vues ont été déplacées sans toucher au
    balisage (§1.16, §1.17) : la bascule sur `AppTabs` reste à faire.
  - 2 dans `src/views/` — `settings/Settings.vue` et `stats/components/StatsTabs.vue` (ce dernier
    est cassé, voir §2.1).

  > ⚠️ **`grep -rl 'data-bs-toggle="tab"' src --include=*.vue` rend 11, pas 9.** Deux faux positifs :
  > `shared/components/AppTabs.vue` et `dashboard/components/DashboardTabs.vue` ne font que
  > **mentionner** la chaîne dans leur documentation — ce sont précisément les composants qui la
  > remplacent. Ne pas compter un fichier sans l'ouvrir.

- **6 stores legacy** dans `src/stores/` : `academiqueStore/` (1) et `messages/` (5, → §2.4).
- **6 fichiers d'API legacy** dans `src/api/` : `config/` (3, → §2.4), `academique/academiqueApi.js`,
  `uploads/importService.js`, `userApi.js`.
- **12 fichiers** portent encore le bloc `<style scoped>` copié-collé (`.drag-drop-area`) — la
  plupart avec un `body {}` **dans un style scoped, donc sans aucun effet**.

### 2.3 Bugs connus, non corrigés (hors périmètre migré)

Détail complet dans **`docs/DETTE-TECHNIQUE.md`**. Les bloquants :

_(Recompté le 27/07/2026. Il n'en reste que **deux** — ce sont exactement les 2 erreurs du lint.)_

| Fichier                                  | Bug                                                  |
| ---------------------------------------- | ---------------------------------------------------- |
| `views/admin/DataTable.vue:40`           | **Erreur de syntaxe** — le fichier ne parse pas.     |
| `views/notifications/notification.vue:1` | `<template>` sans élément racine → **ne rend rien**. |

_(Les entrées `views/etudiants/.../ExportData.vue` et les deux `views/examens/.../HeaderView.vue`
ont disparu avec la migration de leurs modules — `src/views/examens/` n'existe plus. Et des
9 composants sans élément racine, il n'en subsiste qu'un.)_

### 2.4 Ponts de compatibilité à retirer en fin de migration

Chacun disparaît avec son dernier appelant.

| Élément                                                                                                                                                    | Remplacé par                               |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| `src/api/config/serviceApi.js`, `axiosClient.js`, `apiClients.js`                                                                                          | `core/api/httpClient` + `core/api/clients` |
| `src/stores/messages/*` (5 fichiers)                                                                                                                       | `shared/stores/notificationStore`          |
| `src/utils/{exportExcel,exportPDF,toast}.js`                                                                                                               | ré-exports vers `shared/utils/*`           |
| Alias `@deprecated` dans les 6 stores de `structure-academique` (`items`↔`cycles`/`filieres`/`niveaux`/`classes`/`semestres`, `fetchAll()`↔`fetchXxx()`) | noms canoniques                            |

_(Les vues `etudiants/`, `inscriptions/`, `examens/` et `notes/` ont été migrées et n'utilisent plus
que les noms canoniques. Les alias `@deprecated` n'ont donc plus, à ce stade, d'appelant connu :
à supprimer au prochain passage.)_

### 2.5 Questions ouvertes pour le backend

**1. Deux vocabulaires de statut** pour les années académiques :

- `/annees`, `/annees/{id}` → `OUVERTE` | `PLANIFIEE` | `CLOTUREE`
- `/annees/history` → `active` | `en_preparation` | `terminee` | `archivee`

Le frontend absorbe l'écart dans `structure-academique/annee/constants.js`, mais l'harmonisation
gagnerait à se faire côté backend.

**2. Le modèle `etudiant` mélange deux entités.** `GET /etudiants/{id}` renvoie, à côté des champs
d'identité, des champs manifestement empruntés à une fiche d'agent — `grade`, `fonction`,
`unite_service`, `departement`, `specialisation`, `diplome` — ainsi que des doublons : `sexe` **et**
`genre`, `lieu_naissance` **et** `lieunaissance`. La fiche migrée n'affiche que les champs
étudiants sans ambiguïté ; les autres restent à trancher côté backend.

**3. Il manque une ressource REST `/etudiants`.** Le backend n'expose ni liste, ni détail, ni
`PUT`, ni `DELETE` (voir l'encadré du §1.4). L'application s'en accommode — l'annuaire est projeté
depuis `GET /inscriptions` — mais au prix de trois renoncements : on ne peut **ni modifier ni
supprimer** un étudiant, et l'état civil saisi à la création (sexe, naissance, adresse, téléphone)
**n'est jamais relu**, aucun endpoint ne le renvoyant. Quatre routes à ajouter côté backend
lèveraient les trois d'un coup : `GET /etudiants`, `GET /etudiants/:id`, `PUT`, `DELETE`.

**4. Deux vocabulaires de statut** pour les inscriptions, et l'un **traduit** l'autre :
`GET /inscriptions` renvoie `REJETEE` là où `GET /inscriptions/finances` renvoie `"annulée"`.
Le frontend absorbe l'écart dans `inscriptions/constants.js` (alias `ANNULEE → REJETEE`, testé),
mais c'est un piège : sans l'alias, un dossier rejeté s'affiche « Inconnu ».

**5. ~~Trois domaines backend sont désactivés.~~ — périmé, corrigé le 27/07/2026.**

Cette entrée annonçait `/pedagogie`, `/finance` et `/statistiques` commentés dans
`cfibackend/src/routes/index.routes.js`. Relevé réel :

| Domaine         | État vérifié                                                                                       |
| --------------- | -------------------------------------------------------------------------------------------------- |
| `/finance`      | ✅ **monté** — `router.use('/finance', financeRoutes)`. Migré, §1.16.                              |
| `/pedagogies`   | ✅ **monté** — au **pluriel** ; `pedagogieClient` visait `/pedagogie`, d'où les 404. Migré, §1.17. |
| `/statistiques` | ❌ **supprimé**, pas commenté — routes _et_ service. Voir l'encadré du §2.1.                       |

La conséquence annoncée — « aucun endpoint n'expose les enseignants » — **n'est plus vraie** :
`GET /pedagogies/enseignant/enseignants` les expose depuis la migration `006` (§1.17). La saisie de
l'enseignant au matricule dans `matieres` (§1.6) peut donc devenir une vraie liste déroulante ;
c'est un reste à faire, pas un blocage.

**6. La fonction Postgres `assigner_module_a_classe` a deux défauts** (elle n'est dans aucun script
de migration versionné, seulement en base) : l'enseignant y est **obligatoire** alors que rien ne
l'annonce, et son message d'erreur est construit par concaténation SQL avec le paramètre — qui,
étant `NULL`, rend **tout le message `NULL`**. L'échec remonte donc sans explication. Le frontend
compense, mais la fonction gagnerait à être corrigée.

**7. Il n'existe aucun backend d'absences.** Rien, dans aucun domaine, ne parle d'absence,
d'assiduité ou de feuille d'émargement. L'écran `/absences` et l'onglet « Assiduité & Discipline »
du dossier scolaire ont donc été **retirés** (§1.7) : ils affichaient « Fiche enregistrée avec
succès » sans rien envoyer. À rétablir le jour où le serveur expose la ressource — le besoin est
réel (feuille d'appel par classe / date / créneau, historique par étudiant).

**8. Aucun endpoint n'expose `types_concours` ni `historique_concours`.** Le premier est une table
de référence (7 types) dont dépend `concours.type_concours` par clé étrangère : faute de route, la
liste est **figée dans le frontend** (`concours/constants.js`) et se désynchronisera dès qu'un type
sera ajouté. Le second est vide et n'est écrit par rien — l'onglet Historique a été retiré (§1.10).

**9. Quatre routes de concours exigent le rôle `ADMIN`** (`PUT /concours/:id`,
`PATCH /:id/statut`, `DELETE /:id`, `DELETE /concours/epreuves/:id`), alors que toutes les autres
ont leur `verifierRole` commenté. L'incohérence est peut-être volontaire, mais elle mérite d'être
confirmée : un utilisateur `SCOLARITE` peut créer un concours mais pas le modifier.

**10. Deux endpoints pour l'import de réinscriptions** — `POST /inscriptions/import-reinscription`
(champ `fichier`) et `POST /academique/imports/reinscriptions` (champ `file`). Le frontend retient
le premier. Les conventions de nom de champ divergent aussi entre les imports (`fichier` pour les
inscriptions, `file` pour les étudiants) : à harmoniser.

**11. Les routes de notes sont montées sous un segment doublé.**
`router.use('/notes', noteRoutes)` alors que `note.routes.js` déclare lui-même
`/evaluations/:id/notes` et `/notes/:id` : le chemin réel est
`/api/evaluations/**notes**/evaluations/:id/notes`, et modifier une note passe par
`/api/evaluations/notes/**notes**/:id`. C'est fonctionnel — le frontend s'y conforme (§1.11) — mais
c'est précisément ce qui a fait échouer l'ancien `notesApi.js` (404 sur les quatre routes).
À simplifier si l'occasion se présente ; ce serait une rupture de contrat.

**12. `PUT /notes/:id` ne remet pas le statut à `SAISIE`.** Une note **publiée** peut être corrigée
en silence : elle reste `PUBLIEE`, avec une valeur différente de celle que l'étudiant a vue. Vérifié
en base. Soit la modification d'une note publiée doit être refusée, soit elle doit repasser la note
en `SAISIE` (et forcer une nouvelle publication). À trancher — c'est une décision métier.

**13. ~~Aucun endpoint ne génère les bulletins.~~ — levé le 27/07/2026 (migration `010`).**

`bulletins_semestriels` n'était remplie par rien : les quatre routes de résultats ne faisaient que
lire, décider et publier. `calculer_bulletins_semestriels(classe, semestre, annee)` fournit le
calcul manquant, exposé par `POST /evaluations/resultats/classes/:id/bulletins/generer`. Voir §1.19.

Ce qui reste ouvert sur ce sujet : **`maquette_pedagogique` est vide**, si bien que coefficients,
ECTS et notes éliminatoires retombent sur `module.coefficient` / `module.credit`. Renseigner la
maquette est un geste de paramétrage, pas de développement — mais tant qu'elle est vide, la note
éliminatoire n'est jamais appliquée.

**14. Les agrégats académiques ne sont protégés par aucune authentification.** Relevé en migrant le
dashboard (§1.18) : `GET /academique/classes/analytics/dashboard-global`,
`/academique/cycles/stats/distribution` et `/academique/filieres/stats/organisations` répondent
**200 sans jeton**, là où tous les endpoints `/finance/*` renvoient 401. Leurs routes ne portent
aucun `verifierToken`. Ils exposent les effectifs, les capacités et le taux de remplissage de
l'établissement à qui connaît l'URL. L'incohérence est peut-être un oubli plutôt qu'un choix : à
confirmer, et à aligner sur le reste.

**15. Aucune échéance n'existe en base.** La vue `v_finance_echeances` est **vide** (0 ligne), donc
`/echeanciers/suivi` ne rend jamais rien, quel que soit le filtre. Les écrans qui en dépendent —
« Suivi étudiant » et « Contrôle par classe » (§1.16), et le tableau d'alertes du dashboard (§1.18) —
sont fonctionnels mais **invérifiables sur données réelles** tant qu'un échéancier n'est pas généré.

### 2.6 Vérifier avant de coder — la leçon des modules `etudiants` et `matieres`

Le module `etudiants` a d'abord été livré **entièrement cassé** : bâti sur `GET /etudiants`, `PUT`
et `DELETE`, qui **n'existent pas** (404). Lint, tests et build étaient pourtant au vert — aucun
d'eux ne parle au backend.

`matieres` a confirmé la leçon : `GET /modules` manquait, `POST` et `PUT` étaient cassés, et
`POST /assigner` **répond 200 en cas d'échec**. Rien de tout cela n'est visible depuis le frontend.
Un code HTTP 200 ne veut pas dire que l'opération a réussi : **lire le corps**.

Le backend est dans `~/cfiprojects/cfibackend`. **Lire ses routes est plus fiable que n'importe
quelle documentation** (celle de `09-api-et-integration-backend.md` a été reconstituée _depuis le
frontend_ : elle décrit ce que le front appelle, pas ce que le serveur offre).

```bash
# Ce que le serveur expose réellement
cat ~/cfiprojects/cfibackend/src/routes/academique/<entité>.routes.js

# Et le vérifier en marche (404 = la route n'existe pas ; 400 = elle existe)
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:3500/api/academique/<chemin>
```

---

## 3. Comment reprendre

0. **Ouvrir les routes du backend** (`~/cfiprojects/cfibackend/src/routes/`) et lister ce qui
   existe vraiment pour l'entité visée. Ne pas se fier à `09-api-et-integration-backend.md`, qui a
   été reconstitué depuis le frontend. Voir §2.6 — cette étape a coûté un module entier.
1. Lire **`docs/ARCHITECTURE.md`** (structure et règle de dépendance), puis
   **`docs/GUIDE-MODULE.md`** (recette pas à pas).
2. Ouvrir `src/modules/structure-academique/cycle/` comme **modèle de référence** : c'est le
   sous-domaine le plus représentatif (CRUD + onglets + modale + export). Pour un module qui filtre
   ses listes, `src/modules/etudiants/` montre le couple `fetchAll({ params })` + composable de
   filtres partagé ; pour les imports de fichiers, `src/modules/inscriptions/` montre
   `useImportFile` + `ImportModal` piloté par un schéma.
3. **Tous les modules fonctionnels sont migrés.** Ce qui reste (§2.1) tient aux résidus, à la dette
   transverse (§2.2) et aux ponts de compatibilité (§2.4) — pas à un module.
4. Vérifier : `npm run lint && npm test && npm run build`, **puis exercer les endpoints réellement
   appelés** contre `localhost:3500` (§2.6).

### Recette, en bref

```
1. mkdir src/modules/<module>/{components/tabs,composables,views}
2. api.js       → createResource() pour le CRUD, + les endpoints spécifiques à la main
3. store.js     → createCrudStore({ id, resource, label, cacheKey, state, actions })
4. git mv les composants (préserve le balisage), puis réécrire les <script setup>
5. Remplacer les onglets Bootstrap par AppTabs        ← le gain API
6. Remplacer les ItemActions locaux par le partagé
7. Remplacer les blocs d'export par useTableExport + ExportMenu
8. Un composable use<X>Form pour la modale            ← corrige les boutons morts
9. routes.js → brancher dans core/router/index.js, retirer de src/routes/
10. Supprimer les anciens fichiers, recâbler les imports (grep -rn "ancien/chemin" src/)
11. npm run lint && npm test && npm run build
```

### Pièges rencontrés, à surveiller

- **Ne jamais croire un écran qui affiche des données.** Dans `etudiants`, quatre onglets sur six
  paraissaient fonctionner : ils servaient des tableaux codés en dur, parfois derrière un
  `setTimeout` imitant une latence réseau. Avant de migrer un écran, chercher
  `grep -n "setTimeout\|ref(\[" ` dans ses composants et vérifier que le store expose bien une
  action de lecture. Le premier réflexe est de croire que « ça marche déjà » ; c'est faux plus
  souvent qu'on ne le pense.
- Un `@edit` câblé sur une fonction inexistante ou un `console.log` — **c'est arrivé 4 fois**. Vérifier systématiquement que chaque handler fait vraiment quelque chose.
- Une action de store appelée par une vue mais **jamais définie** — `fetchEtudiantsByClasseFiliereAnnee`, `getNiveauByCycle`, `removeInscription`, `fetchCandidatsReinscription`, `bulkImportReinscriptions`. **C'est le bug le plus fréquent du dépôt.** Il passe souvent inaperçu derrière un garde `if (typeof store.x === 'function')`, qui transforme l'absence en silence. Lire la vue _et_ le store, jamais l'un sans l'autre.
- Un endpoint que le frontend appelle mais que **le serveur n'expose pas** : `GET /etudiants` et ses variantes. Rien dans la chaîne lint/test/build ne le détecte. Voir §2.6.
- Deux endpoints d'un même domaine qui **ne parlent pas le même dialecte** : `REJETEE` d'un côté, `"annulée"` de l'autre. Croiser les réponses sur les mêmes identifiants avant de croire à une simple différence de casse.
- Un `<script setup>` ne peut pas contenir la chaîne `</` suivie de `script>`, même dans un commentaire : le parseur SFC ferme le bloc là.
- Une action qui écrit dans `items` d'un store partagé (`classeStore.fetchByFiliere`) rend ce store dépendant de qui l'a appelé en dernier. Préférer charger une fois puis filtrer en mémoire.
- Les `ItemActions` locaux n'émettent pas tous la même chose (objet vs `id`). Le partagé émet toujours `{ key, item }`.
- Un store legacy peut appeler une action **qui n'existe pas** (`getNiveauByCycle`). Vérifier chaque appel.
- `window` n'est pas accessible depuis un template Vue 3 : passer par une fonction.
- Ne jamais laisser une réponse backend non déballée : la charge utile est **toujours** dans `data`.
