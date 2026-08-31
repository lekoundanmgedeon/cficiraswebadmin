# Module `structure-academique`

> L'ossature de l'école : années académiques, cycles, filières, niveaux, classes, semestres.
> **Presque tous les autres modules en dépendent** — c'est la racine du graphe.

| | |
| --- | --- |
| **Écrans** | 5 |
| **Sous-domaines** | `annee` · `cycle` · `filiere` · `niveau` · `classe` · `semestre` |
| **Domaine backend** | `/api/academique` |
| **Dépendances** | `matieres` (l'onglet « UE du semestre » monte sa modale d'assignation) · `assistant` (onglet embarqué) — **ces deux arêtes forment un cycle**, voir [ARCHITECTURE.md](../ARCHITECTURE.md) §2 |
| **Modèle de référence** | c'est le module le plus abouti ; en cas de doute sur une convention, l'ouvrir |

## 1. Rôle

Six entités, fortement imbriquées : **un cycle porte des filières, qui portent des niveaux, qui
portent des classes**. Un semestre appartient à une année.

Elles sont regroupées en un seul module parce qu'elles évoluent ensemble : le formulaire d'une
classe a besoin des stores des filières **et** des niveaux, celui d'une filière du store des
cycles. Les séparer en modules distincts aurait imposé des imports croisés permanents.

Chaque entité reste un **sous-domaine autonome** — son `api.js`, son `store.js`, ses composants, sa
vue. Seules les routes sont assemblées au niveau du module.

Le **niveau** n'a pas d'écran propre : il est administré depuis les onglets des filières et des
classes. Il garde néanmoins sa ressource et son store.

## 2. Écrans et routes

| Chemin                    | Nom                  | Titre                 |
| ------------------------- | -------------------- | --------------------- |
| `/annees-academiques`     | `AnneesAcademiques`  | Années académiques    |
| `/cycles-academiques`     | `CyclesAcademiques`  | Cycles académiques    |
| `/filieres-academiques`   | `FilieresAcademiques`| Filières académiques  |
| `/classes-niveaux`        | `ClassesNiveaux`     | Classes et niveaux    |
| `/semestres`              | `Semestres`          | Semestres             |

## 3. Onglets

### Années académiques
| Onglet | Contenu |
| ------ | ------- |
| Liste des années | CRUD, activation d'une année |
| Calendrier académique | les périodes de l'année |
| Statistiques | effectifs et indicateurs de l'année |
| Historique | `GET /annees/history` — **vocabulaire de statut différent**, voir §5 |

### Cycles
| Onglet | Contenu |
| ------ | ------- |
| Liste des cycles | CRUD |
| Filières par cycle | arborescence `GET /cycles/tree/filieres` |
| Organisation | **recomposée** depuis `v_organisation_classes`, pas depuis `/cycles/stats/organisations` |
| Statistiques | répartition des effectifs par cycle |

### Filières
| Onglet | Contenu |
| ------ | ------- |
| Liste des filières | CRUD |
| Niveaux | administration des niveaux de la filière |
| Organisation | effectif, capacité, taux, responsable |
| Statistiques | l'onglet statistique **de référence** du projet : getters dérivés du store |

### Classes et niveaux
| Onglet | Contenu |
| ------ | ------- |
| Liste des classes | CRUD |
| Par filière | `GET /classes/filiere/:id` |
| Par niveau | `GET /classes/niveau/:id` |
| Organisation | `GET /classes/stats/organisations` — **source saine** |
| Statistiques | recompose les quatre KPI d'infrastructure, voir §7 |

### Semestres
| Onglet | Contenu |
| ------ | ------- |
| Liste des semestres | CRUD, changement de statut |
| UE du semestre | les unités d'enseignement rattachées |
| Organisation | **810 lignes** rendues d'un bloc avant pagination |
| Statistiques | ce que l'analytique du serveur permet **honnêtement** d'afficher, voir §7 |
| Assistant IA | cadrage `structure-academique` |

## 4. Endpoints

### Années — `/annees`
| Appel | Rôle |
| ----- | ---- |
| CRUD standard | `list`, `getById`, `create`, `update`, `patch`, `remove` |
| `GET /annees/history` | historique avec effectifs agrégés |
| `GET /annees/current` | année en cours |
| `GET /annees/:id/stats` | statistiques d'une année |
| `GET /annees/:id/export` | export des données de l'année |
| `PATCH /annees/:id/activate` | active une année. **Le backend désactive automatiquement la précédente** : une seule active à la fois |

### Cycles — `/cycles`
| Appel | Rôle |
| ----- | ---- |
| CRUD standard | |
| `GET /cycles/:id/filieres` | filières d'un cycle |
| `GET /cycles/tree/filieres` | arborescence cycles → filières |
| `GET /cycles/stats/distribution` | effectif par cycle |
| `GET /cycles/stats/organisations` | ⚠️ **déclaré mais appelé par aucun écran** — vue à fan-out, voir §7 |

### Filières — `/filieres`
| Appel | Rôle |
| ----- | ---- |
| CRUD standard | |
| `GET /filieres/stats/organisations` | organisation des filières |
| `GET /filieres/cycle/:cycleId` | filières d'un cycle |
| `GET /filieres/:id/stats` | statistiques d'une filière |

### Niveaux — `/niveaux`
| Appel | Rôle |
| ----- | ---- |
| CRUD standard | |
| `GET /niveaux/filiere/:filiereId` | niveaux d'une filière |
| `GET /niveaux/:id/effectifs` | effectifs d'un niveau |

### Classes — `/classes`
| Appel | Rôle |
| ----- | ---- |
| CRUD standard | `GET /classes` sert `v_classes_effectifs` — **source saine pour les capacités** |
| `GET /classes/stats/organisations` | `v_organisation_classes` — **source saine**, groupée par classe |
| `GET /classes/analytics/dashboard-global` | ⚠️ **déclaré mais appelé par aucun écran ici** — vue à fan-out, voir §7 |
| `GET /classes/niveau/:id` · `/filiere/:id` | classes par niveau, par filière |
| `GET /classes/:id/etudiants` | inscrits d'une classe (`v_etudiants_par_classe`) |
| `GET /classes/:id/modules` | modules enseignés (`v_modules_par_classe`) |
| `POST /classes/:id/assigner-module` | rattache un module |
| `GET /classes/:id/taux-remplissage` | taux d'une classe |

### Semestres — `/semestres`
| Appel | Rôle |
| ----- | ---- |
| CRUD standard | |
| `GET /semestres/courants/actifs` | ⚠️ **ment sur son nom** : rend les semestres de l'année *active*, pas ceux dont `est_actif` est vrai |
| `GET /semestres/annee/:anneeId` | semestres d'une année |
| `GET /semestres/stats/organisations` | organisation |
| `GET /semestres/analytics/dashboard?period=` | ⚠️ **contient des chiffres inventés**, voir §7 |
| `PATCH /semestres/:id/statut` | change le statut |

## 5. Vocabulaire

### Statuts d'année — **deux vocabulaires**

| Endpoint | Valeurs |
| -------- | ------- |
| `/annees`, `/annees/:id` | `PLANIFIEE` · `OUVERTE` · `CLOTUREE` |
| `/annees/history` | `active` · `en_preparation` · `terminee` · `archivee` |

L'écart est **dans l'API**. Il est isolé dans un seul fichier (`annee/constants.js`, deux tables de
correspondance : `mapStatut` et `mapStatutHistorique`) plutôt que laissé se propager en `switch`
dupliqués. Filtres dérivés : « en cours » = `active` + `en_preparation` ; « passées » = `terminee` +
`archivee`.

### Statuts d'organisation de filière
`OUVERTE` · `COMPLÈTE` · `VIDE` · `FERMÉE` — servis par `v_organisation_filieres`, avec accents.

### Limites de saisie
`cycle` : `code` ≤ 10, `designation` ≤ 100.

### Le schéma, tel qu'il est
- La table `cycle` **n'a pas de colonne `nom`** : seulement `code` et `diplome`.
- Un **niveau n'a pas de désignation** : son `code` (L1, M2) *est* son libellé.
- Un **semestre n'a pas de niveau**.

## 6. État et règles

Les six stores sont bâtis sur `createCrudStore`. État additionnel par sous-domaine :

| Sous-domaine | État additionnel | Actions propres |
| ------------ | ---------------- | --------------- |
| `annee` | `history`, `current`, `stats` | `fetchHistory`, `fetchCurrent`, `fetchStats`, `loadCurrentStats`, `activate`, `exportData` |
| `cycle` | `filieres`, `architecture`, `stats` | `fetchFilieres`, `fetchArchitecture`, `fetchDistributionStats` |
| `filiere` | `organisation`, `stats` | `fetchOrganisation`, `fetchByCycle`, `fetchAnalyse`, `fetchStats` |
| `niveau` | `effectifs` | `fetchByFiliere`, `fetchEffectifs` |
| `classe` | `organisationTree`, `etudiants`, `modules`, `occupancyRate` | `fetchOrganisationTree`, `fetchByNiveau`, `fetchByFiliere`, `fetchStudents`, `fetchModules`, `assignModule`, `fetchOccupancyRate` |
| `semestre` | `actifs`, `organisation`, `analytics` | `fetchActifs`, `fetchByAnnee`, `fetchOrganisation`, `fetchAnalytics`, `changeStatus` |

Getter notable : `annee.activeAnnee` — l'année dont `est_active` est vrai, dans `items`.

Le store des filières porte les **getters dérivés les plus riches** du projet
(`filieresEnrichies`, `filieresActives`, `filieresSansEffectif`, `repartitionParCycle`,
`indicateursFilieres`, `analysesFilieres`) : c'est le modèle à suivre pour un onglet statistique —
**l'agrégat se dérive du store, il ne se recalcule pas dans le composant**.

### Alias hérités
Les six stores exposent des getters `@deprecated` (`cycles`, `filieres`, `niveaux`, `classes`,
`semestres`, `anneesAcademiques`, `anneeAcademique`) et des actions (`fetchCycles()`,
`fetchAnneesAcademiques()`…) qui renvoient vers `items` et `fetchAll()`. **Ne pas les reconstruire** :
ils n'ont plus d'appelant connu.

## 7. Pièges à reproduire

### 7.1 Trois vues à fan-out, et ce qu'on fait à la place

`v_organisation_filieres`, `v_organisation_cycles` et `v_dashboard_global_classe` somment
`capacite_max` **après** une jointure sur `inscriptions` : la capacité de chaque classe est
multipliée par son nombre d'inscrits.

| Vue | Annoncé | Réel |
| --- | ------- | ---- |
| `v_dashboard_global_classe` | 36 325 places | 5 400 |
| `v_organisation_cycles` | 11 130 places | 1 800 |

Conséquence : « places disponibles », `taux_remplissage` et `statut` sont faux (≈ 2,45 % partout).

**Ce que fait le front** : les deux endpoints correspondants sont déclarés dans `api.js` — avec un
avertissement — mais **appelés par aucun écran**. Les onglets « Organisation » et « Statistiques »
des cycles et des classes **recomposent** les quatre chiffres depuis `v_organisation_classes`,
groupée par classe. Seul `total_etudiants_inscrits` résiste dans la vue globale : c'est un
`COUNT(DISTINCT)`.

À rebrancher le jour où les vues seront corrigées côté base.

### 7.2 Deux comptages d'effectif

`v_classes_effectifs` compte **toutes** les inscriptions de l'année active ;
`v_organisation_classes` ne compte que `ACTIVE` / `VALIDEE`. Écart mesuré : **893 contre 832**.
Ce n'est pas un bug : ce sont deux questions différentes. Dire laquelle on pose.

### 7.3 L'analytique des semestres est en partie inventée

Dans `GET /semestres/analytics/dashboard` :

| Champ | Ce que c'est vraiment |
| ----- | --------------------- |
| `taux_assiduite_global` | la constante **`92.4`**, en dur |
| `matrix.moyenne_generale` | un **`RANDOM()`** — valeur différente à chaque appel |
| `typology` | une seule ligne, à 100 % |
| `llm_summary` | n'existe pas |

L'onglet « Statistiques » n'affiche **rien de tout cela**. Il montre ce que l'endpoint permet
honnêtement de montrer, et le composable `useSemestreAnalytique` fait le tri.

### 7.4 `courants/actifs` ne rend pas les semestres actifs

Il rend ceux de l'**année académique active**. Le nom de la route induit en erreur ; l'appeler pour
savoir « quel semestre est en cours » donne une réponse fausse.

### 7.5 `pg` sert ses nombres en chaînes

`v_filiere_details` renvoie `nb_etudiants: '9'`, `v_organisation_classes` `taux: '45.00'`.
`nombre()` (`shared/utils/remplissage.js`) convertit à l'entrée. Sans lui, une addition concatène
et Chart.js reçoit un axe vide — sans lever d'erreur.

### 7.6 Un seul jeu de seuils

Les seuils de remplissage (sous-exploité / tendu / complet), la palette et les couleurs vivent dans
`shared/utils/remplissage.js`, pas dans le module. Trois copies auraient divergé au premier
ajustement — et une barre verte aurait pu accompagner une alerte rouge.

### 7.7 Le formulaire d'édition doit être pré-rempli par la même source que la liste

Le bug d'origine : la modale lisait `anneeToEdit` de l'en-tête, la liste écrivait dans sa propre
variable. **Cliquer « Modifier » ouvrait un formulaire de création.** D'où le composable
`use<Entité>Form`, qui détient le formulaire, le mode et l'ouverture de la modale.

## 8. Checklist de reconstruction

- [ ] Six ressources CRUD sur `/academique` : `annees`, `cycles`, `filieres`, `niveaux`, `classes`, `semestres`
- [ ] Activation d'une année : une seule active, le serveur désactive la précédente
- [ ] Les **deux** tables de correspondance de statut d'année, isolées en un point
- [ ] Onglets à montage paresseux : 4 à 5 par écran, une requête à l'ouverture
- [ ] Organisation et statistiques **recomposées depuis `v_organisation_classes`** — ne pas
      appeler `/cycles/stats/organisations` ni `/classes/analytics/dashboard-global`
- [ ] Conversion des nombres servis en chaînes, à l'entrée du store
- [ ] Seuils, palette et couleurs de taux **partagés**, pas recopiés par écran
- [ ] Onglet « Statistiques » des semestres : ne rien afficher de `taux_assiduite_global`,
      `matrix.moyenne_generale`, `typology`, `llm_summary`
- [ ] Pagination sur l'organisation des semestres (810 lignes) et les listes de classes
- [ ] Le niveau n'a pas d'écran : il s'administre depuis les onglets filières et classes
- [ ] Ne pas inventer un `cycle.nom`, une désignation de niveau, ni un niveau de semestre
