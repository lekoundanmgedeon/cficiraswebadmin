# ERP — Spécification fonctionnelle de reconstruction

> Document produit par analyse directe du code source du dépôt `cficiraswebadmin` (Vue 3 / Vite / Pinia / Vue Router / Axios), à l'exclusion de toute supposition non vérifiable. Chaque affirmation de statut ("Implémenté", "Données simulées", "Route absente", "Composant orphelin", etc.) est appuyée par une lecture directe des fichiers cités. Les zones d'incertitude sont regroupées dans des sous-sections "Points à confirmer" plutôt que présentées comme des faits.

## 1. Résumé exécutif

**cficiraswebadmin** est le back-office (interface d'administration) d'un ERP de gestion académique conçu pour une structure fonctionnant en régime LMD (Licence/Master/Doctorat). Il couvre la structure académique (années, cycles, filières, classes, semestres), la scolarité (étudiants, dossiers scolaires, absences), les inscriptions, les évaluations (notes, délibérations), les examens, les concours d'admission, les affaires pédagogiques (enseignants, attribution des cours, créneaux, programmes), les finances (paiements, facturation, rapports), les statistiques, un assistant IA (bêta) et des services administratifs. C'est un frontend Vue 3 (Options composées en `<script setup>`), sans backend inclus dans ce dépôt — toutes les données transitent (ou sont censées transiter) via une API REST consommée par Axios.

**Constat central de cette analyse** : le projet est structurellement complet et cohérent (architecture par domaine, séparation vue/store/service API, pattern Header+Tabs+TabContent+Modal répété systématiquement), mais son **intégration backend réelle est partielle**. Une majorité de stores Pinia et de services API existent et sont correctement écrits, mais **ne sont pas consommés par les vues qui les concernent** : la plupart des écrans travaillent sur des tableaux JavaScript codés en dur (`ref([...])`), et de nombreux boutons d'action déclenchent un simple `alert()`/`console.log()` plutôt qu'un appel réseau. Ce constat, vérifié module par module, est la donnée la plus importante pour toute reconstruction fidèle : reconstruire "à l'identique" signifie reproduire cette architecture prévue pour le réel, tout en branchant effectivement les stores/API déjà écrits (ou leurs équivalents dans la nouvelle techno) aux vues.

Par ailleurs, environ la moitié des entrées du menu de navigation ne correspondent à **aucune route déclarée ni aucun composant** (modules "fantômes" : Bibliothèque, Ressources matérielles, Coordination académique, Diplômes, Courrier & Notes, Congés & remplacements, lien "résultats-concours") ou à un **composant existant mais non routé** (Emploi du temps/Schedule, Paramètres/Settings, Notifications, Support). Ces éléments sont documentés séparément (§13) pour ne pas être confondus avec les modules réellement fonctionnels.

Ce document a pour objectif de permettre à une autre équipe, ou à un autre agent IA, de reconstruire fidèlement cette plateforme dans une autre technologie frontend (React, Next.js, Angular, Nuxt, SvelteKit, etc.), en conservant les workflows métier, la structure de navigation, les écrans et le comportement observé — mock ou réel — et en profitant de l'occasion pour combler les branchements backend manquants et moderniser l'UI/UX sans altérer la logique métier.

## 2. Vue globale de la plateforme

| Caractéristique | Valeur |
|---|---|
| Nom du projet | cficiraswebadmin |
| Domaine | ERP de gestion académique, régime LMD |
| Type d'application | Back-office / interface d'administration (SPA) |
| Framework | Vue 3.5 (Composition API, `<script setup>`) |
| Build tool | Vite 6 |
| Routing | Vue Router 4, mode historique (`createWebHistory`), un layout unique protégé (`DefaultLayout`) |
| State management | Pinia 3, 26 stores répartis en 8 domaines |
| HTTP | Axios, client centralisé (`src/api/config/axiosClient.js`) |
| UI Kit | ant-design-vue (Table, Tabs), thème d'admin Bootstrap-like avec icônes `mdi` |
| Tableaux | `@bhplugin/vue3-datatable` |
| Graphiques | chart.js, echarts/vue-echarts |
| Export | file-saver, html2canvas, html2pdf.js, jspdf(+autotable), pdfmake, papaparse, xlsx |
| Tests automatisés | Aucun détecté (pas de Vitest/Jest) |
| Nombre de vues (`.vue`) | 278 |
| Nombre de stores Pinia | 26 |
| Nombre de services API | 15 |
| Nombre d'entrées de menu de 1er niveau | 19 (dont 10 groupes rétractables) |
| Authentification | Formulaires Login/Register présents ; **aucun router guard `beforeEach` actif** malgré `meta.requiresAuth` déclaré (à confirmer/corriger en reconstruction) |
| RBAC / permissions | Champs de rôle présents dans `authStore.js` mais **non exploités par l'UI** (aucun `v-if` de permission détecté) |

## 3. Architecture fonctionnelle générale

La plateforme est organisée en grands domaines métier, reflétés à la fois par la structure de dossiers (`src/views/<domaine>`) et par les groupes du menu latéral :

1. **Structure Académique** — années académiques, cycles (L/M/D), filières, classes/niveaux, semestres.
2. **Scolarité** — étudiants, dossiers scolaires, absences & présences.
3. **Inscriptions** — inscription et réinscription des étudiants/candidats.
4. **Notes, Évaluations & Délibérations** — saisie de notes, calcul de résultats, délibération et proclamation.
5. **Examens** — planification des sessions, calendrier, salles, rapports.
6. **Concours** — éditions de concours, configuration (épreuves/candidats/notes/délibération), rapports/résultats.
7. **Affaires pédagogiques** — enseignants, attribution des cours, créneaux/horaires, programmes/crédits.
8. **Finances** — paiements & reçus, facturation, rapports financiers.
9. **Modules transverses** — authentification, dashboard, statistiques, documentation, assistant IA, administration/services.
10. **Modules annexes non/partiellement routés** — emploi du temps, notifications, paramètres, support.
11. **Modules fantômes (menu uniquement)** — bibliothèque, ressources matérielles, coordination académique, diplômes, courrier & notes, congés & remplacements.

Chaque domaine « réel » (1 à 8) suit un même schéma d'architecture frontend, répété avec une grande cohérence dans tout le projet :
- Une page racine (`Xxx.vue`) qui orchestre un en-tête (`XxxHeader.vue`) et un système d'onglets (`XxxTab.vue`).
- Des composants de contenu par onglet (`components/Tab/*Content.vue`).
- Des modals dédiés à la création/édition (`components/Modal/*.vue`).
- Des composants d'actions par ligne de tableau (`components/details/ItemActions.vue`).
- Un store Pinia par entité principale, consommant un service API dédié.

## 4. Cartographie complète des menus et routes


Légende Statut : **Implémenté** / **Partiellement implémenté** / **Présent dans le menu mais route absente** / **Route présente mais non visible dans le menu** / **Mock / Simulation** / **À confirmer**.

| Menu principal | Sous-menu | Route | Page/Composant | Module métier | Fonction | Statut | Remarques |
|---|---|---|---|---|---|---|---|
| Tableau de Bord | — | `/home` (+ `/dashboard`, `/` alias) | `views/dashboard/Dashboard.vue` | Dashboard | Vue d'ensemble académique | Implémenté | 3 chemins mènent au même composant |
| Structure Académique | Années académiques | `/annees-academiques` | `views/stracad/anneeac/AnneeAcademique.vue` | Structure Académique | Gestion des années académiques | Implémenté | — |
| Structure Académique | Cycles | `/cycles-academiques` | `views/stracad/cycles/Cycle.vue` | Structure Académique | Gestion des cycles (L/M/D) | Implémenté | — |
| Structure Académique | Filières | `/filieres-academiques` | `views/stracad/filieres/Filiere.vue` | Structure Académique | Gestion des filières/niveaux | Implémenté | — |
| Structure Académique | Classes | `/classes-niveaux` | `views/stracad/classes/Classes.vue` | Structure Académique | Gestion des classes | Implémenté | — |
| Structure Académique | Semestres | `/semestres` | `views/stracad/semestres/Semestre.vue` | Structure Académique | Gestion des semestres | Implémenté | — |
| Scolarité | Gestion des étudiants | `/etudiants` (+ `/etudiants/:id`) | `views/etudiants/Etudiants.vue` + `DetailEtudiant.vue` | Scolarité | Liste et fiche étudiant | Implémenté | — |
| Scolarité | Dossiers scolaires | `/dossiers-scolaires` (+ `/dossiers-scolaires/:id/global-informations`) | `views/parcours/DossierView.vue` + `DossierAcademique.vue` | Scolarité | Dossier académique complet | Implémenté | `views/parcours/Parcours.vue` orphelin à vérifier |
| Scolarité | Absences & Présences | `/absences` | `views/absence/AbscenceView.vue` | Scolarité | Suivi des absences | Implémenté | — |
| Scolarité | Évaluations & Notes | `/notes` (+ `/notes/:classeId/:semestre/:type/edit`) | `views/notes/NotesView.vue` + `EditNotes.vue` | Notes | Saisie/consultation des notes | Implémenté | — |
| Scolarité | Délibérations | `/deliberations` | `views/deliberation/deliberation.vue` | Délibérations | Délibération et proclamation | Implémenté | — |
| Examens | (racine, hors menu) | `/examens` | `views/examens/Examens.vue` | Examens | Page racine du module examens | Route présente mais non visible dans le menu | Accès probable par navigation interne uniquement |
| Examens | Planification | `/planification-examens` (+ `/planification-examens/:id/evaluations`) | `views/examens/planification/Planification.vue` | Examens | Planification des sessions | Implémenté | — |
| Examens | Calendrier | `/calendrier-examens` | `views/examens/calendrier/Calendrier.vue` | Examens | Calendrier des examens | Implémenté | — |
| Examens | Salles & horaires | `/salles-horaires` | `views/examens/salles/Salles.vue` | Examens | Affectation salles/horaires | Implémenté | — |
| Examens | Rapports | `/rapport-examens` | `views/examens/rapports/RapportExamens.vue` | Examens | Rapports d'examens | Implémenté | — |
| Concours | Editions | `/edition-concours` (+ `/edition-concours/:id/configurations`) | `views/concours/editions/Edition.vue` | Concours | Gestion des éditions de concours | Implémenté | — |
| Concours | (référence JS morte) | `/resultats-concours` | — | Concours | — | Présent dans le menu (logique JS) mais route absente | Dans `menuGroups.concours` du sidebar, sans `<router-link>` ni route déclarée |
| Concours | Rapports | `/rapport-concours` | `views/concours/resultats/RapportConcours.vue` | Concours | Rapports de concours | Implémenté | — |
| Inscriptions | — | `/inscriptions` | `views/inscriptions/Inscription.vue` | Inscriptions | Inscriptions et réinscriptions | Implémenté | — |
| Emploi du temps | — | `/schedule` | *(aucune)* | Emploi du temps | — | Présent dans le menu mais route absente | Composants existent (`views/schedule/*`) mais non routés — "Composant non trouvé dans le routeur" |
| Finances | Paiements & reçus | `/paiements-finances` | `views/finances/paiements/Paiements.vue` | Finances | Paiements et reçus | Implémenté | — |
| Finances | Facturations | `/factures-finances` | `views/finances/facturations/Facturation.vue` | Finances | Facturation | Implémenté | — |
| Finances | Rapports | `/rapports-financiers` | `views/finances/rapports/RapportFinances.vue` | Finances | Rapports financiers | Implémenté | — |
| Affaires pédagogiques | Enseignants | `/enseignants` | `views/pedagogies/formateurs/Enseignants.vue` | Pédagogie | Gestion des enseignants | Implémenté | — |
| Affaires pédagogiques | Attribution des cours | `/attribution-cours` | `views/pedagogies/attributions/AttributionCours.vue` | Pédagogie | Attribution des cours | Implémenté | — |
| Affaires pédagogiques | Creneaux/Horaires | `/crenaux-horaires` | `views/pedagogies/crenaux/CrenauHoraire.vue` | Pédagogie | Créneaux et emplois du temps enseignants | Implémenté | — |
| Affaires pédagogiques | Congés & remplacements | `/conges-replacement` | *(aucune)* | Pédagogie | — | Présent dans le menu mais route absente | Composant non trouvé non plus |
| Affaires pédagogiques | Programmes / Crédits | `/programmes-credits` | `views/pedagogies/programme/ProgrammeCredit.vue` | Pédagogie | Programmes et crédits ECTS | Implémenté | — |
| Bibliothèque | — | `/bibliotheque` | *(aucune)* | Ressources | — | Présent dans le menu mais route absente | Aucun composant trouvé non plus |
| Ressources matérielles | Salles & équipements | `/salles` | *(aucune)* | Ressources | — | Présent dans le menu mais route absente | Distinct de `/salles-horaires` (Examens) qui, lui, existe |
| Ressources matérielles | Réservation | `/reservation` | *(aucune)* | Ressources | — | Présent dans le menu mais route absente | — |
| Ressources matérielles | Disponibilités | `/disponibilites` | *(aucune)* | Ressources | — | Présent dans le menu mais route absente | — |
| Services | — | `/administration` | `views/admin/Administration.vue` | Administration | Services administratifs | Implémenté | Libellé menu "Services", nom de route "Administration" |
| Coordination académique | Thèmes & mémoires | `/themes-memoires` | *(aucune)* | Coordination académique | — | Présent dans le menu mais route absente | — |
| Coordination académique | Soutenances | `/soutenances` | *(aucune)* | Coordination académique | — | Présent dans le menu mais route absente | — |
| Coordination académique | Statut étudiant | `/statut` | *(aucune)* | Coordination académique | — | Présent dans le menu mais route absente | — |
| Diplômes | Demande de diplôme | `/demande-diplome` | *(aucune)* | Diplômes | — | Présent dans le menu mais route absente | Store `pedagogieStore/diplomeStore.js` existe sans UI/route associée |
| Diplômes | Édition & certification | `/edition-diplome` | *(aucune)* | Diplômes | — | Présent dans le menu mais route absente | — |
| Diplômes | Historique | `/historique-diplome` | *(aucune)* | Diplômes | — | Présent dans le menu mais route absente | — |
| Courrier & Notes | Courriers | `/courriers` | *(aucune)* | Courrier & Notes | — | Présent dans le menu mais route absente | — |
| Courrier & Notes | Notes administratives | `/notes-admin` | *(aucune)* | Courrier & Notes | — | Présent dans le menu mais route absente | — |
| Courrier & Notes | Archivage | `/archivage` | *(aucune)* | Courrier & Notes | — | Présent dans le menu mais route absente | — |
| Notifications | — | `/notification` | *(aucune)* | Notifications | — | Présent dans le menu mais route absente | Composant existe (`views/notifications/notification.vue`) mais non routé |
| Statistiques | — | `/statistiques` | `views/stats/Statistiques.vue` | Statistiques | Statistiques globales | Implémenté | — |
| Assistant AI | — | `/assistant-ai` | `views/prompt/AssistantAi.vue` | Assistant IA | Assistant conversationnel (badge Beta) | Implémenté (à confirmer réel vs mock) | — |
| Paramètres | — | `/settings` | *(aucune)* | Paramètres | — | Présent dans le menu mais route absente | Composant existe (`views/settings/Settings.vue`) mais non routé |
| *(hors menu)* | — | `/documentation` | `views/docf/Document.vue` | Documentation | Documentation interne | Route présente mais non visible dans le menu | — |
| *(hors menu)* | — | *(aucune)* | `views/support/Support.vue` | Support | — | Composant orphelin (ni menu ni route) | À confirmer usage réel |
| *(hors menu, public)* | — | `/auth/login` | `views/auth/Login.vue` | Authentification | Connexion | Implémenté | Route publique (`meta.public: true`) |
| *(hors menu, public)* | — | `/auth/register` | `views/auth/Register.vue` | Authentification | Inscription | Implémenté | Route publique |
| *(hors menu, public)* | — | `/auth/new-password` | `views/auth/Login.vue` | Authentification | Nouveau mot de passe | À confirmer | Réutilise le composant `Login.vue` — probablement un bug/TODO, pas un vrai écran dédié |
| *(hors menu, public)* | — | `/:pathMatch(.*)*` | `views/errors/NotFound.vue` | Système | Page 404 | Implémenté | Catch-all |

**Fichier mort** : `src/routes/main.js` (doublon non importé de `index.js`) — à ne pas reproduire.

## 5. Modules métier détaillés

Chaque module ci-dessous a été documenté par lecture intégrale du code source correspondant (vues, composants, stores Pinia, services API). Les statuts "Implémenté", "Données simulées", "Route absente" etc. reflètent l'état réel constaté, pas une supposition.

### Module : Structure Académique

#### 1. Objectif métier

Le module « Structure Académique » constitue le socle de paramétrage de l'ERP académique (LMD). Il permet à l'établissement de définir, avant toute opération pédagogique (inscriptions, emplois du temps, évaluations, résultats), la hiérarchie organisationnelle complète de la scolarité :

- **Années académiques** (ex: 2025-2026) : cadre temporel racine de tout le système ;
- **Cycles** (Licence, Master, Doctorat) : macro-niveaux de formation, chacun associé à un diplôme et une durée ;
- **Filières** : parcours de formation rattachés à un cycle ;
- **Niveaux** (L1, L2, M1…) : subdivisions annuelles d'un cycle, associées à des frais de scolarité ;
- **Classes** : regroupements d'étudiants au sein d'une filière/niveau, avec capacité d'accueil ;
- **Semestres** : subdivisions temporelles d'une année académique, support des maquettes d'Unités d'Enseignement (UE).

Sans cette structure, aucune inscription, aucun cours, aucune évaluation ne peut être rattachée à un contexte académique cohérent. C'est un module de configuration fondation ("master data") consommé par tous les autres modules (Scolarité, Pédagogie, Évaluations, Finances).

#### 2. Acteurs concernés

Rôle probable à confirmer — aucun contrôle RBAC visible dans le code des composants Vue du module (`AnneeAcademique.vue`, `Cycle.vue`, `Filiere.vue`, `Classes.vue`, `Semestre.vue` et leurs enfants). Aucune directive `v-if` liée à un rôle utilisateur, aucun `usePermission`/`useAuthStore().role` n'apparaît dans ces fichiers. L'accès est protégé uniquement au niveau route par `meta: { requiresAuth: true }` (authentification requise, sans distinction de rôle constatée dans le code lu). Fonctionnellement, il s'agit vraisemblablement d'un module réservé à un profil « Administrateur académique / Scolarité », mais ce n'est pas vérifiable dans le code frontend fourni.

#### 3. Menus et sous-menus associés

Dans `src/components/partials/sidebar.vue`, un groupe collapsible intitulé **« Structure Académique »** (icône `mdi-sitemap`, ancre `#structure-academique`) contient 5 sous-menus, tous actifs (avec `RouterLink` fonctionnel) :

| Libellé menu | Route cible |
|---|---|
| Années académiques | `/annees-academiques` |
| Cycles | `/cycles-academiques` |
| Filières | `/filieres-academiques` |
| Classes | `/classes-niveaux` |
| Semestres | `/semestres` |

Le tableau `menuGroups.structure` (utilisé pour la surbrillance du groupe parent, ligne ~695-699 du fichier) référence exactement ces 5 chemins.

#### 4. Pages et routes associées

| Page | Route | Composant | Description | Statut |
|---|---|---|---|---|
| Années académiques | `/annees-academiques` | `src/views/stracad/anneeac/AnneeAcademique.vue` | Gestion des années académiques (liste, calendrier, statistiques, historique) | Implémenté (backend réel connecté) |
| Cycles académiques | `/cycles-academiques` | `src/views/stracad/cycles/Cycle.vue` | Gestion des cycles (Licence/Master/Doctorat), filières associées, organisation, statistiques | Implémenté (backend réel), un onglet contient un chatbot IA simulé |
| Filières académiques | `/filieres-academiques` | `src/views/stracad/filieres/Filiere.vue` | Gestion des filières et de leurs niveaux | Implémenté (backend réel connecté) |
| Classes et niveaux | `/classes-niveaux` | `src/views/stracad/classes/Classes.vue` | Gestion des classes, vues croisées par filière/niveau, organisation, statistiques | Implémenté (backend réel connecté) |
| Semestres | `/semestres` | `src/views/stracad/semestres/Semestre.vue` | Gestion des semestres, configuration des UE, organisation, statistiques, assistant IA | Partiellement implémenté — onglet « UEs » (composant `NiveauxContent.vue`) fonctionne intégralement sur données simulées |

Toutes ces routes sont montées sous le groupe racine `/` avec `component: DefaultLayout` et `meta: { requiresAuth: true }` (voir `src/routes/index.js` + `src/routes/structure.routes.js`). Aucun `meta.roles` n'est déclaré.

#### 5. Description fonctionnelle complète

Le module s'organise en 5 écrans "maîtres", chacun suivant un même patron d'architecture Vue 3 (Options/Composition API mixte) :

1. Un composant racine (`AnneeAcademique.vue`, `Cycle.vue`, `Filiere.vue`, `Classes.vue`, `Semestre.vue`) qui assemble un `Header` + un `Tab`.
2. Un composant `Header` (ex: `AnneeHeader.vue`) affichant le titre de page, le fil d'ariane statique (« structures / … »), les boutons Export/Impression/Ajouter, et montant la modal de création/édition (`Modal/add*.vue`).
3. Un composant `Tab` (ex: `AnneeTab.vue`) définissant la navigation par onglets Bootstrap (`nav-tabs` / `tab-pane`), chaque onglet chargeant un composant `Tab/*.vue` indépendant.
4. Des composants `details/*ItemActions.vue` : menus déroulants d'actions par ligne de tableau (Détails / Éditer / Modifier / Activer-Désactiver / Supprimer), avec confirmations via `teleport` vers `<body>`.

Chaque module CRUD (Année, Cycle, Filière, Niveau, Classe, Semestre) est piloté par un store Pinia dédié (`anneStore`, `cycleStore`, `filiereStore`, `niveauStore`, `classeStore`, `semestreStore`) qui encapsule les appels HTTP vers un unique fichier API `academiqueApi.js`, lui-même construit sur un client Axios générique (`axiosClient.js` + `serviceApi.js`).

Un store racine `academiqueStore.js` (Pinia) fournit une action `initAll()` qui charge en parallèle toutes les entités du module (années, cycles, classes, filières, niveaux, semestres, inscriptions) — utile pour un pré-chargement global (non observé comme appelé depuis les composants lus).

**Particularité notable** : les onglets « Assistant AI » / « AI-cycle-sample » (Cycle et Semestre) et l'onglet « UEs » du module Semestre (`NiveauxContent.vue`) sont des simulations frontend pures (données hardcodées en mémoire, chat avec réponses `setTimeout` + `if/else` sur mots-clés) sans aucun appel API réel.

#### 6. Interfaces du module

##### Écran : Années Académiques (`/annees-academiques`)

- **Route** : `/annees-academiques`
- **Composant** : `src/views/stracad/anneeac/AnneeAcademique.vue` (assemble `AnneeHeader.vue` + `AnneeTab.vue`)
- **Objectif** : créer, consulter, modifier, activer/désactiver et archiver les années académiques.
- **Données affichées** : liste des années (code, dates début/fin, statut, active/inactive), calendrier annuel (vide, données non branchées), statistiques de l'année active (effectif, taux de réussite, modules actifs, classes ouvertes, performance par filière), historique chronologique (timeline avec filtres).
- **Données modifiables** : code, date_debut, date_fin, statut (`PLANIFIEE`/`OUVERTE`/`CLOTUREE`), est_active (checkbox « une seule année active à la fois »).
- **Filtres disponibles** : (onglet Historique) recherche texte par code, filtre par statut (active/en_preparation/terminee/archivee), filtre par période (en cours/passées).
- **Champs de recherche** : champ texte « Rechercher par code ou année » (onglet Historique uniquement).
- **Onglets disponibles** : Liste des années, Calendrier académique, Statistiques, Historique.
- **Tableaux affichés** : table "Liste des années" (`ListeAnneesContent.vue`), table "Calendrier annuel" (vide, non connectée), table "Rapport de Performance par Filière" (dans Statistiques).
- **Colonnes importantes** (Liste des années) : #, Code, Début, Fin, Statut, Active, Actions.
- **Boutons disponibles** : Exporter (icône, log console seulement), Imprimer (`window.print()`), « + Ajouter un nouveau », menu d'actions par ligne (Détails/Éditer/Modifier/Activer-Désactiver/Supprimer), export Excel/PDF du rapport de performance par filière, « Rapport complet » (export de l'année active).
- **Actions disponibles** : créer une année, modifier une année, activer/désactiver une année (`toggle-status`), supprimer une année, consulter le détail (modal), exporter le rapport de performance en Excel/PDF.
- **Modals ou formulaires** : `Modal/addAnnee.vue` (id `#anneeModal`, create/edit), modal Détails, modal Activation/Désactivation, modal Suppression (dans `ItemActions.vue`).
- **États visuels** : badges de statut (Ouverte=vert, Planifiée=jaune, Clôturée=rouge), badge Actif/Inactif, spinner de chargement (bouton Enregistrer, listes), barre de progression (timeline historique), état vide (« Aucune donnée » avec image `empty-box.svg`).
- **Messages de succès** : « Année académique créée avec succès ! », « Année académique modifiée avec succès ! », « Année académique activée avec succès. », « Année académique supprimée avec succès. », « Exportation réussie. » — via `messageStore.notifySuccess` (toasts globaux).
- **Messages d'erreur** : « Le code est obligatoire. », « Veuillez remplir toutes les dates obligatoires. », « La date de fin doit être supérieure à la date de début. », « Le statut est obligatoire. » (validation locale) ; « Erreur lors de la récupération des données. », « Erreur lors de l'activation. », etc. (erreurs API via `messageStore.notifyError` / `extractErrorMessage`).
- **API utilisées** : `getAnneesAcademiques`, `getAnneesHistory`, `getCurrentAnnee`, `getAnneeById`, `getAnneeStats`, `exportAnneeData`, `activateAnnee`, `createAnneeAcademique`, `updateAnneeAcademique`, `deleteAnneeAcademique` (toutes dans `academiqueApi.js`, préfixe `/api/academique/annees`).
- **Store utilisé** : `useAnneeStore` (`src/stores/academiqueStore/anneStore.js`).
- **Composants enfants** : `AnneeHeader.vue`, `AnneeTab.vue`, `Modal/addAnnee.vue`, `Tab/ListeAnneesContent.vue`, `Tab/CalendrierContent.vue`, `Tab/StatistiquesContent.vue`, `Tab/HistoriqueContent.vue`, `details/ItemActions.vue`.
- **Remarques de reconstruction** : la modal utilise Bootstrap JS natif (`bootstrap.Modal`) piloté impérativement via `document.getElementById` — à remplacer par une gestion d'état réactive dans une autre techno. L'onglet Calendrier est un tableau vide non câblé à une API (aucun store/action associé) — à considérer comme un espace réservé (« Aucune donnée » hardcodé). Le fichier `Modal/addAnneeSample.vue` (voir §11 Points à confirmer) est un composant Options API isolé non importé nulle part — probablement un brouillon/exemple destiné à la gestion d'année académique depuis le module Concours, non branché.

##### Écran : Cycles (`/cycles-academiques`)

- **Route** : `/cycles-academiques`
- **Composant** : `src/views/stracad/cycles/Cycle.vue` (assemble `CycleHeader.vue` + `CycleTab.vue`)
- **Objectif** : gérer les cycles d'études (Licence, Master, Doctorat…), leurs filières rattachées et leur organisation.
- **Données affichées** : liste des cycles (code, désignation, diplôme, durée, crédits ECTS), architecture Cycles→Filières→Niveaux (accordéon), organisation (effectifs/capacité/taux de remplissage par cycle), statistiques de distribution des étudiants par cycle.
- **Données modifiables** : code (max 10 car.), désignation (max 100 car.), description, durée_annees, credits_total, diplôme, est_actif.
- **Filtres disponibles** : aucun filtre sur la liste principale des cycles ; recherche texte sur l'onglet Statistiques (« Rechercher un cycle ou diplôme »).
- **Champs de recherche** : input recherche (onglet Statistiques uniquement, filtre côté client sur `cycle_code`/`diplome`/`cycle_nom`).
- **Onglets disponibles** : Cycles, Filières, Organisation, Statistiques (+ un composant `AI-cycle-sample.vue` "Tableau de Bord & Copilote des Cycles" non branché à un onglet visible dans `CycleTab.vue` — voir Points à confirmer).
- **Tableaux affichés** : liste des cycles, tableau d'organisation (effectifs/capacité/statut par cycle), tableau de statistiques de distribution (code/diplôme/effectif/statut).
- **Colonnes importantes** (liste Cycles) : #, REF, Désignation, Diplôme, Cursus (durée), Volume (Crédits), Actions.
- **Boutons disponibles** : Exporter (menu Excel/PDF), Imprimer, « + Ajouter un nouveau », menu d'actions par ligne (Détails/Modifier/Supprimer).
- **Actions disponibles** : créer un cycle, modifier, supprimer, consulter le détail, exporter Excel/PDF.
- **Modals ou formulaires** : `Modal/addCycle.vue` (id `#cycleModal`, create/edit).
- **États visuels** : spinner de chargement, barres de progression (taux de remplissage), badges de statut (OUVERTE/PARTIEL/VIDE), état vide.
- **Messages de succès** : « Cycle créé avec succès ! », « Cycle modifié avec succès ! », « Cycle supprimé avec succès. ».
- **Messages d'erreur** : « Le code est obligatoire. », « La désignation est obligatoire. », « Le code ne doit pas dépasser 10 caractères. », etc. (validation locale) ; erreurs API génériques via `extractErrorMessage`.
- **API utilisées** : `getCycles`, `getCycleById`, `getCycleFilieres`, `getCycleArchitecture`, `getCycleDistributionStats`, `getCycleOrganisation`, `createCycle`, `updateCycle`, `deleteCycle`.
- **Store utilisé** : `useCycleStore` (`src/stores/academiqueStore/cycleStore.js`).
- **Composants enfants** : `CycleHeader.vue`, `CycleTab.vue`, `Modal/addCycle.vue`, `Tab/CyclesContent.vue`, `Tab/FilieresContent.vue`, `Tab/OrganisationContent.vue`, `Tab/StatistiquesCyclesContent.vue`, `details/ItemActions.vue`, (orphelin apparent) `Tab/AI-cycle-sample.vue`.
- **Remarques de reconstruction** : `AI-cycle-sample.vue` contient un chat IA 100% simulé (données hardcodées « 1 240 étudiants », réponses `setTimeout`/mots-clés) — ne pas reproduire comme un vrai module IA sans confirmation qu'il est réellement branché à un LLM côté backend. Ce fichier n'est importé nulle part dans `CycleTab.vue` actuel (seulement 4 onglets : Cycles/Filières/Organisation/Statistiques) — statut à confirmer, probablement du code laissé de côté après un remaniement.

##### Écran : Filières (`/filieres-academiques`)

- **Route** : `/filieres-academiques`
- **Composant** : `src/views/stracad/filieres/Filiere.vue` (assemble `FiliereHeader.vue` + `FiliereTab.vue`)
- **Objectif** : gérer les filières académiques et leurs niveaux d'études.
- **Données affichées** : liste des filières (code, désignation, cycle, nombre de classes), niveaux par filière (code, ordre, cycle, frais de scolarité, nb classes), organisation des filières (responsable, effectif, capacité, taux de remplissage, statut), statistiques par filière sélectionnée (étudiants inscrits, classes associées).
- **Données modifiables** : Filière — code, désignation, cycle_id, credit_total ; Niveau — cycle_id, code, ordre, frais_scolarite.
- **Filtres disponibles** : filtre « par cycle » (dropdown) sur l'onglet Niveaux ; sélecteur de filière (dropdown) sur l'onglet Statistiques.
- **Champs de recherche** : aucun champ de recherche texte identifié dans ce module.
- **Onglets disponibles** : Filières, Niveaux, Organisation, Statistiques.
- **Tableaux affichés** : liste des filières, liste des niveaux (paginée), tableau organisation des filières.
- **Colonnes importantes** (Filières) : #, code, designation, cycles, nbre classes, Actions. (Niveaux) : #, Code, Niveau, Cycle, Frais scolarité, Classes, Actions.
- **Boutons disponibles** : Exporter (Excel/PDF), Imprimer, « + Ajouter un nouveau » (filière), « + Créer un niveau », « Filtrer par cycle », menus d'actions par ligne.
- **Actions disponibles** : créer/modifier/supprimer une filière, créer/modifier/supprimer un niveau, pagination des niveaux, filtrage des niveaux par cycle, sélection d'une filière pour ses statistiques.
- **Modals ou formulaires** : `Modal/addFiliere.vue` (id `#filiereModal`), `Modal/addNiveau.vue` (id `#niveauModal`).
- **États visuels** : spinner de chargement, badges (nb_classes coloré vert/gris), état vide.
- **Messages de succès** : « Filière créée avec succès ! », « Filière modifiée avec succès ! », « Niveau créé avec succès. », « Niveau modifié avec succès. ».
- **Messages d'erreur** : validations locales (« Le code est obligatoire. », « Veuillez sélectionner un cycle. », « L'ordre doit être supérieur à 0. », etc.) et erreurs API via `notifyError`.
- **API utilisées** : `getFilieres`, `getFiliereById`, `getFiliereOrganisation`, `getFilieresByCycle`, `getFiliereStats`, `createFiliere`, `updateFiliere`, `deleteFiliere` ; `getNiveaux`, `getNiveauById`, `getNiveauxByFiliere`, `getNiveauEffectifs`, `createNiveau`, `updateNiveau`, `deleteNiveau` ; `getCycles` (pour peupler les selects).
- **Store utilisé** : `useFiliereStore`, `useNiveauStore`, `useCycleStore` (chargement croisé pour les listes déroulantes).
- **Composants enfants** : `FiliereHeader.vue`, `FiliereTab.vue`, `Modal/addFiliere.vue`, `Modal/addNiveau.vue`, `Tab/FilieresContent.vue`, `Tab/NiveauxContent.vue`, `Tab/OrganisationContent.vue`, `Tab/StatistiquesFilieresContent.vue`, `details/FilieresItemActions.vue`, `details/ItemActions.vue` (générique, non référencé directement dans les Tab lus), `details/NiveauxItemActions.vue`.
- **Remarques de reconstruction** : la fonction `editFiliere` de `FilieresContent.vue` ne fait qu'un `console.log` — l'édition réelle passe uniquement par le clic « Modifier » du dropdown `ItemActions` qui ouvre la modal Bootstrap via `data-bs-toggle`, sans réellement précharger le formulaire avec l'item cliqué dans ce composant (le binding `@edit="editFiliere"` ne préremplit rien) — franc écart fonctionnel à corriger/documenter lors de la reconstruction (voir §15 Règles/points à confirmer). Le composant `details/ItemActions.vue` du dossier `filieres` semble être un composant générique (Cycle) presque identique à celui de `cycles/components/details/ItemActions.vue`, potentiellement dupliqué/non utilisé directement dans ce module (aucune référence directe trouvée dans les Tab de Filière lus).

##### Écran : Classes et Niveaux (`/classes-niveaux`)

- **Route** : `/classes-niveaux`
- **Composant** : `src/views/stracad/classes/Classes.vue` (assemble `ClasseHeader.vue` + `ClasseTab.vue`)
- **Objectif** : gérer les classes (groupes d'étudiants), leur rattachement filière/niveau, leur capacité, et visualiser l'organisation par filière/niveau.
- **Données affichées** : liste des classes (code, filière, niveau, effectif/capacité), classes filtrées par filière, classes filtrées par niveau, arbre d'organisation (classe/niveau/filière/cycle, remplissage, statut), KPI globaux (total classes, capacité globale, étudiants inscrits, places disponibles, taux d'occupation).
- **Données modifiables** : code (max 10 car.), filiere_id, niveau_id (filtré dynamiquement selon la filière/cycle sélectionné), capacite_max.
- **Filtres disponibles** : sélecteur de filière (onglet « Filières »), sélecteur de niveau (onglet « Niveaux »), recherche texte + filtre cycle + filtre statut (onglet Organisation).
- **Champs de recherche** : « Rechercher par classe, filière ou cycle » (onglet Organisation uniquement).
- **Onglets disponibles** : Classes, Niveaux, Filières, Organisation, Statistiques.
- **Tableaux affichés** : liste des classes (paginée), classes par filière, classes par niveau, arbre d'organisation, tableau matriciel (implicite dans les cartes KPI).
- **Colonnes importantes** (Classes) : #, Code, Filière, Niveau, Émarge/Capacité max, Actions.
- **Boutons disponibles** : Exporter (Excel/PDF), Imprimer, « + Ajouter un nouveau », menus d'actions par ligne, pagination.
- **Actions disponibles** : créer/modifier/supprimer une classe, filtrer par filière/niveau/cycle/statut, pagination, export Excel/PDF.
- **Modals ou formulaires** : `Modal/addClasse.vue` (id `#classeModal`).
- **États visuels** : spinner de chargement, badges de remplissage (couleur selon taux), barres de progression, placeholders skeleton (onglet Statistiques), état vide.
- **Messages de succès** : « Classe créée avec succès ! », « Classe modifiée avec succès ! », « Classe supprimée avec succès. ».
- **Messages d'erreur** : validations locales (code/filière/niveau obligatoires, capacité > 0) + erreurs API.
- **API utilisées** : `getClasses`, `getClasseById`, `getClassesOrganisationTree`, `getGlobalInfrastructureKPIs`, `getClassesByNiveau`, `getClassesByFiliere`, `getClasseStudents`, `getClasseModules`, `assignModuleToClasse`, `getClasseOccupancyRate`, `createClasse`, `updateClasse`, `deleteClasse`.
- **Store utilisé** : `useClasseStore` (+ `useFiliereStore`, `useNiveauStore` pour peupler les listes déroulantes du formulaire).
- **Composants enfants** : `ClasseHeader.vue`, `ClasseTab.vue`, `Modal/addClasse.vue`, `Tab/ClassesContent.vue`, `Tab/FilieresContent.vue`, `Tab/NiveauxContent.vue`, `Tab/OrganisationClassesContent.vue`, `Tab/StatistiquesClassesContent.vue`, `details/ClassesFiliereItemActions.vue`, `details/ClassesItemActions.vue`, `details/ClassesNiveauItemActions.vue`.
- **Remarques de reconstruction** : dans `ClassesContent.vue`, les fonctions `editClasse`/`confirmDelete` ne font que `console.log` — même écart fonctionnel constaté que pour les Filières : l'action « Modifier » depuis le dropdown ouvre la modal Bootstrap sans préremplissage effectif via ce handler. `Tab/FilieresContent.vue` et `Tab/NiveauxContent.vue` de ce module sont des vues « classes filtrées par X », distinctes des Tab homonymes des modules Filière/Cycle — à ne pas confondre lors de la reconstruction (mêmes noms de fichiers, contenus différents).

##### Écran : Semestres (`/semestres`)

- **Route** : `/semestres`
- **Composant** : `src/views/stracad/semestres/Semestre.vue` (assemble `SemestreHeader.vue` + `SemestreTab.vue`)
- **Objectif** : gérer les semestres d'une année académique, configurer leurs Unités d'Enseignement (UE), visualiser l'organisation et les statistiques associées.
- **Données affichées** : liste des semestres (code, année académique, dates, statut actif/inactif), UE configurées par semestre (onglet « UEs », **données simulées**), organisation des semestres groupée par niveau (crédits, UE), statistiques/analytics (volume horaire, taux d'assiduité, corps enseignant, total UE, matrice par semestre, typologie des enseignements).
- **Données modifiables** : annee_id, code (max 10 car.), date_debut, date_fin, est_actif (« un seul semestre actif par année »).
- **Filtres disponibles** : recherche texte + filtre filière + filtre statut (onglet Organisation, sur données simulées côté store `semestreStore.organisation`).
- **Champs de recherche** : « Rechercher une UE, un code… » (onglet Organisation).
- **Onglets disponibles** : Semestres, Organisation, UEs (libellé menu ; composant `NiveauxContent.vue`), Statistiques, Assistant AI.
- **Tableaux affichés** : liste des semestres, table des UE par semestre sélectionné (master-detail), matrice « Charge d'Enseignement par Semestre » (analytics).
- **Colonnes importantes** (Semestres) : #, Code, Année Académique, Date début, Date fin, Statut, Actions.
- **Boutons disponibles** : Exporter (Excel/PDF), Imprimer, « + Ajouter nouveau », « Configurer un Semestre » (onglet Organisation, `console.log` seulement), « Rattaché une UE au [code] » (onglet UEs, non fonctionnel/mock), menus d'actions par ligne (incluant Activer/Désactiver).
- **Actions disponibles** : créer/modifier/supprimer un semestre, activer/désactiver (`toggle-status` → `changeStatus`), sélection d'un semestre pour voir ses UE (mock), filtrage de l'organisation, changement de période d'analytics (dropdown année).
- **Modals ou formulaires** : `Modal/addSemestre.vue` (id `#semestreModal`).
- **États visuels** : spinner, badges de statut (« Semestre Activé »/« Semestre Inactivé »), progress bars (typologie enseignement), état vide, indicateur de saisie du chatbot IA (« Analyse de l'arborescence… »).
- **Messages de succès** : « Semestre créé avec succès. », « Semestre modifié avec succès. », « Statut du semestre modifié avec succès. », « Semestre supprimé avec succès. ».
- **Messages d'erreur** : « Veuillez sélectionner une année académique. », « Le code du semestre est obligatoire. », « Les dates de début et de fin sont obligatoires. », « La date de fin doit être strictement supérieure à la date de début. », « Attention : Aucune année académique n'est active actuellement. Impossible de créer un semestre. » (bloque la création si aucune année active) + erreurs API génériques.
- **API utilisées** : `getSemestres`, `getSemestreById`, `getActiveSemestres`, `getSemestresByAnnee`, `getSemestresOrganisation`, `getSemestreAnalytics(period)`, `createSemestre`, `updateSemestre`, `deleteSemestre`, `changeSemestreStatus` ; `getAnneesAcademiques` (pour peupler le select Année académique du formulaire).
- **Store utilisé** : `useSemestreStore`, `useAnneeStore` (formulaire de création).
- **Composants enfants** : `SemestreHeader.vue`, `SemestreTab.vue`, `Modal/addSemestre.vue`, `Tab/SemestresContent.vue`, `Tab/NiveauxContent.vue` (onglet « UEs »), `Tab/OrganisationSemestresContent.vue`, `Tab/StatistiquesSemestresContent.vue`, `Tab/AssistantAIContent.vue`, `details/ItemActions.vue`.
- **Remarques de reconstruction** : `Tab/NiveauxContent.vue` (onglet UEs) est **entièrement simulé** — `initDataMock()` peuple `semestres` et `tuesRepository` avec des tableaux JS statiques, aucun appel API. `Tab/AssistantAIContent.vue` est un chatbot 100% simulé, identique dans son principe à celui de Cycle. Un fichier `Tab/todo.txt` présent dans le dossier contient un brouillon de code (`<script setup>` avec `axios` direct interrogeant `/api/academique/semestres/analytics/dashboard?period=...`) qui n'est **pas un composant Vue actif** (pas de `.vue`, pas de balise `<template>`) — à traiter comme une note de développement, non comme un écran livré. Le formulaire de création désactive le select Année académique en mode édition (`:disabled="!isEdit"` — inversé : en fait disabled quand `!isEdit` est faux, donc le select est actif à la création et désactivé en édition, ce qui est cohérent avec le commentaire « rattaché automatiquement »຺.

#### 7. Boutons et actions

| Bouton/Action | Emplacement | Déclencheur | Fonction JS appelée | API appelée | Condition d'affichage | Résultat attendu | Remarque reconstruction |
|---|---|---|---|---|---|---|---|
| + Ajouter un nouveau (Année) | `AnneeHeader.vue` | clic | `openAddModal()` | — | toujours visible | ouvre modal `#anneeModal` en mode création | utilise `bootstrap.Modal` global (variable non importée, dépend du script Bootstrap chargé globalement) |
| Enregistrer (modal Année) | `Modal/addAnnee.vue` | clic ou submit form | `submitAnnee()` | `createAnneeAcademique` / `updateAnneeAcademique` | toujours visible dans la modal | crée/modifie l'année, ferme la modal après 1200ms | validation locale avant appel API |
| Activer/Désactiver (Année) | `details/ItemActions.vue` (anneeac) | clic « Activer/Désactiver » puis confirmation modal | `toggleAnneeStatus()` → `anneeStore.activateAnnee(id)` | `PATCH /annees/{id}/activate` | toujours visible dans le menu dropdown | bascule le statut actif de l'année (une seule active à la fois côté métier) | pas de désactivation directe côté API observée (endpoint unique `activate`) |
| Supprimer (Année) | `details/ItemActions.vue` | clic « Supprimer » puis confirmation | `confirmDelete()` → `anneeStore.removeAnneeAcademique(id)` | `DELETE /annees/{id}` | toujours visible | supprime l'année et rafraîchit la liste | — |
| Exporter (rapport filières) | `Tab/StatistiquesContent.vue` (annee) | clic « Rapport complet » | `exportRapport()` → `anneeStore.exportAnnee(id)` | `GET /annees/{id}/export` | nécessite une année active chargée | déclenche export backend | pas de gestion visible du blob téléchargé côté frontend (`return response.data`) |
| Export Excel / PDF (filières stats) | `Tab/StatistiquesContent.vue` (annee) | clic menu Exporter | `exportFilieresExcel()` / `exportFilieresPDF()` | — (local) | données stats chargées | génère fichier via `exportExcel`/`exportPDF` (utils locaux) | export 100% côté client, ne consomme pas d'endpoint dédié |
| + Ajouter un nouveau (Cycle) | `CycleHeader.vue` | clic (data-bs-toggle) | ouverture modal Bootstrap | — | toujours visible | ouvre `#cycleModal` | pas de gestion de `cycleToEdit` déclenchée depuis le header (prop jamais passée ici) |
| Enregistrer (modal Cycle) | `Modal/addCycle.vue` | clic | `submitCycle()` | `createCycle` / `updateCycle` | toujours | crée/modifie le cycle | code uppercased côté frontend avant envoi |
| Supprimer (Cycle) | `details/ItemActions.vue` (cycles) | clic + confirmation | `confirmDelete()` → émit `delete` → `cycleStore.removeCycle(id)` | `DELETE /cycles/{id}` | toujours | supprime le cycle | — |
| Export Excel/PDF (Cycles) | `Tab/CyclesContent.vue` | clic menu | `exportCyclesExcel()` / `exportCyclesPDF()` | — (local) | liste chargée | génère fichier | — |
| + Ajouter un nouveau (Filière) | `FiliereHeader.vue` | clic | ouverture modal | — | toujours | ouvre `#filiereModal` | — |
| Enregistrer (modal Filière) | `Modal/addFiliere.vue` | clic | `submitFiliere()` | `createFiliere` / `updateFiliere` | toujours | crée/modifie la filière | charge dynamiquement les cycles au montage |
| Supprimer (Filière) | `details/FilieresItemActions.vue` | clic + confirmation | `confirmDelete()` → `filiereStore.removeFiliere(id)` | `DELETE /filieres/{id}` | toujours | supprime la filière | — |
| + Créer un niveau | `Tab/NiveauxContent.vue` (filieres) | clic (data-bs-toggle) | ouverture modal `#niveauModal` | — | toujours | ouvre le formulaire niveau | — |
| Enregistrer (modal Niveau) | `Modal/addNiveau.vue` | clic | `submitNiveau()` | `createNiveau` / `updateNiveau` | toujours | crée/modifie le niveau | charge les cycles au montage |
| Filtrer par cycle (Niveaux) | `Tab/NiveauxContent.vue` (filieres) | clic option dropdown | `filterByCycle(cycleId)` | `getNiveauxByFiliere` (non, en fait `getNiveauByCycle` — méthode absente du store lu, potentiel écart) | toujours | filtre la liste des niveaux | **voir Points à confirmer : `niveauStore.getNiveauByCycle` n'existe pas dans `niveauStore.js` lu — incohérence potentielle** |
| + Ajouter un nouveau (Classe) | `ClasseHeader.vue` | clic | ouverture modal `#classeModal` | — | toujours | ouvre le formulaire classe | — |
| Enregistrer (modal Classe) | `Modal/addClasse.vue` | clic | `submitClasse()` | `createClasse` / `updateClasse` | toujours | crée/modifie la classe | niveaux filtrés dynamiquement par cycle de la filière sélectionnée |
| Supprimer (Classe) | `details/ClassesItemActions.vue` | clic + confirmation | `confirmDelete()` | `DELETE /classes/{id}` (via store, non branché dans `ClassesContent.vue` qui ne fait que `console.log`) | toujours | doit supprimer la classe | **écart : `ClassesContent.vue confirmDelete` ne fait qu'un `console.log`, n'appelle pas `classeStore.removeClasse`** |
| + Ajouter nouveau (Semestre) | `SemestreHeader.vue` | clic | ouverture modal `#semestreModal` | — | toujours | ouvre le formulaire semestre | bloqué si aucune année active |
| Enregistrer (modal Semestre) | `Modal/addSemestre.vue` | clic | `submitSemestre()` | `createSemestre` / `updateSemestre` | toujours | crée/modifie le semestre | — |
| Activer/Désactiver (Semestre) | `details/ItemActions.vue` (semestres) | clic + confirmation | `toggleSemestreStatus()` → `semestreStore.changeStatus(id, {est_actif})` | `PATCH /semestres/{id}/statut` | toujours | bascule l'état actif | — |

#### 8. Formulaires

##### Formulaire « Ajouter/Modifier une année académique » (`Modal/addAnnee.vue`)

| Champ | Type | Obligatoire | Valeur par défaut | Validation | Source des options | Remarque |
|---|---|---|---|---|---|---|
| code | text | Oui | '' | non vide | — | placeholder « Ex: 2025-2026 » |
| date_debut | date | Oui | '' | non vide, < date_fin | — | |
| date_fin | date | Oui | '' | non vide, > date_debut | — | |
| statut | select | Oui | `PLANIFIEE` | non vide | options statiques : PLANIFIEE, OUVERTE, CLOTUREE | |
| est_active | checkbox | Non | false | — | — | « Une seule année peut être active à la fois » (règle métier affichée, non vérifiée côté frontend) |

- **Objectif** : créer ou modifier une année académique.
- **Workflow de soumission** : validation locale (`validateForm`) → si édition, `anneeStore.editAnneeAcademique(id, form)` sinon `anneeStore.addAnneeAcademique(form)` → message succès affiché 1200ms → fermeture modal + reset formulaire → rafraîchissement de la liste (`fetchAnneesAcademiques`).
- **Payload envoyé** : `{ code, date_debut, date_fin, statut, est_active }` (+ `id` en édition).
- **Erreurs possibles** : champs vides, date_fin ≤ date_debut, erreur réseau/API (message générique catché et affiché dans `errorMessage`).
- **Comportement après succès** : toast succès (store `messageStore`) + fermeture modal après délai + rechargement de la liste. **Comportement après échec** : message d'erreur affiché en local dans la modal (`alert-danger`), modal reste ouverte.

##### Formulaire « Ajouter/Modifier un cycle » (`Modal/addCycle.vue`)

| Champ | Type | Obligatoire | Valeur par défaut | Validation | Source des options | Remarque |
|---|---|---|---|---|---|---|
| code | text (max 10) | Oui | '' | non vide, ≤10 car. | — | uppercased à l'envoi |
| designation | text (max 100) | Oui | '' | non vide, ≤100 car. | — | |
| description | textarea | Non | '' | — | — | |
| duree_annees | number | Non | '' | min 1, max 10 | — | |
| credits_total | number | Non | '' | min 0 | — | |
| diplome | text | Non | '' | — | — | |
| est_actif | checkbox | Non | true | — | — | |

- **Payload envoyé** : `{ code (upper), designation, description, diplome, duree_annees, credits_total, statut }` (noter : le champ formulaire `est_actif` est mappé vers `statut` dans le payload final — incohérence de nommage frontend interne, voir §15).
- **Workflow** : identique au patron Année (validate → create/update → message → fermeture).
- **Comportement après succès/échec** : identique au patron Année.

##### Formulaire « Ajouter/Modifier une filière » (`Modal/addFiliere.vue`)

| Champ | Type | Obligatoire | Valeur par défaut | Validation | Source des options | Remarque |
|---|---|---|---|---|---|---|
| code | text (max 10) | Oui | '' | non vide, ≤10 | — | uppercased à l'envoi |
| designation | text (max 100) | Oui | '' | non vide, ≤100 | — | |
| cycle_id | select | Oui | '' | non vide | `cycleStore.fetchCycles()` (dynamique, chargé au montage) | |
| credit_total | number | Non | '' | ≥0 si renseigné | — | |

- **Payload envoyé** : `{ code (upper), designation, cycle_id, credit_total }`.
- **Workflow/comportement** : identique au patron général.

##### Formulaire « Ajouter/Modifier un niveau » (`Modal/addNiveau.vue`)

| Champ | Type | Obligatoire | Valeur par défaut | Validation | Source des options | Remarque |
|---|---|---|---|---|---|---|
| cycle_id | select | Oui | '' | non vide | `cycleStore.fetchCycles()` | |
| code | text (max 10) | Oui | '' | non vide | — | Ex: L1, L2, M1 |
| ordre | number | Oui | '' | ≥1 | — | utilisé pour le tri |
| frais_scolarite | number | Non | null | ≥0 | — | montant devise locale |

- **Payload envoyé** : `{ code (upper), cycle_id, ordre (int), frais_scolarite (float ou null) }`.
- **Aperçu dynamique** affiché avant soumission (`{code} ({cycle.code})`).

##### Formulaire « Ajouter/Modifier une classe » (`Modal/addClasse.vue`)

| Champ | Type | Obligatoire | Valeur par défaut | Validation | Source des options | Remarque |
|---|---|---|---|---|---|---|
| code | text (max 10) | Oui | '' | non vide, ≤10 | — | Ex: L1-INFO |
| filiere_id | select | Oui | '' | non vide | `filiereStore.fetchFilieres()` | déclenche `onFiliereChange` (reset niveau_id) |
| niveau_id | select | Oui | '' | non vide, disabled si pas de filière | `niveauStore.fetchNiveaux()` filtré côté client par `cycle_id` de la filière sélectionnée | |
| capacite_max | number | Non | null | ≥1 si renseigné | — | |

- **Payload envoyé** : `{ code (upper), niveau_id, filiere_id, capacite_max (int ou null) }`.

##### Formulaire « Ajouter/Modifier un semestre » (`Modal/addSemestre.vue`)

| Champ | Type | Obligatoire | Valeur par défaut | Validation | Source des options | Remarque |
|---|---|---|---|---|---|---|
| annee_id | select | Oui | '' | non vide | en création : filtré sur l'année active uniquement (`anneeStore.fetchAnneesAcademiques()` puis recherche `est_active`) ; en édition : toutes les années | bloque la création si aucune année active (message d'erreur explicite) |
| code | text (max 10) | Oui | '' | non vide | — | Ex: S1, S2 |
| date_debut | date | Oui | '' | non vide, < date_fin | — | |
| date_fin | date | Oui | '' | non vide, > date_debut (strict) | — | |
| est_actif | checkbox | Non | false | — | — | « Un seul semestre actif par année académique » (règle affichée, non vérifiée frontend) |

- **Payload envoyé** : `{ code (upper), annee_id, date_debut, date_fin, est_actif }`.
- **Workflow spécifique** : le select Année est désactivé (`:disabled="!isEdit"` → actif en création, désactivé en édition) et pré-rempli automatiquement si une seule année active est trouvée.

#### 9. Tableaux et tables de navigation

| Tableau | Données affichées | Colonnes | Actions par ligne | Filtres | Pagination | Tri | Source des données |
|---|---|---|---|---|---|---|---|
| Liste des années (`ListeAnneesContent.vue`) | Années académiques | #, Code, Début, Fin, Statut, Active, Actions | Détails/Éditer/Modifier/Activer-Désactiver/Supprimer | aucun | non paginé | ordre API natif | API (`fetchAnneesAcademiques`) |
| Historique années (`HistoriqueContent.vue`) | Timeline des années | (cartes, pas de colonnes classiques) | Détails/Modifier/Plus (boutons non branchés à une action réelle observée) | recherche texte, statut, période | non paginé | ordre API natif | API (`fetchAnneesHistory`), filtrage 100% client (computed) |
| Calendrier annuel (`CalendrierContent.vue`) | vide | #, code, annees, periode, statut | aucune | aucun | — | — | **simulé/non connecté** (aucun store, table toujours vide) |
| Liste des cycles (`CyclesContent.vue`) | Cycles | #, REF, Désignation, Diplôme, Cursus, Volume(Crédits), Actions | Détails/Modifier/Supprimer | aucun | non paginé | ordre API natif | API (`fetchCycles`) |
| Organisation cycles (`cycles/Tab/OrganisationContent.vue`) | Cycle→filières, effectifs/capacité | Cycle, Filières disponibles, Effectifs/Capacité, Taux remplissage, Statut | aucune | aucun | non paginé | ordre API natif | API (`fetchCycleOrganisation`) |
| Statistiques cycles (`StatistiquesCyclesContent.vue`) | Distribution étudiants/cycle | Code/Cycle, Diplôme visé, Effectif Étudiants, Statut | aucune | recherche texte (client) | non paginé | ordre API natif | API (`fetchCycleDistributionStats`), filtré localement |
| Liste des filières (`filieres/Tab/FilieresContent.vue`) | Filières | #, code, designation, cycles, nbre classes, Actions | Détails/Modifier/Supprimer | aucun | non paginé | ordre API natif | API (`fetchFilieres`) |
| Niveaux de la filière (`filieres/Tab/NiveauxContent.vue`) | Niveaux | #, Code, Niveau, Cycle, Frais scolarité, Classes, Actions | Détails/Modifier/Supprimer | dropdown « Filtrer par cycle » | oui (composant `Pagination`, 10/page) | ordre API natif | API (`fetchNiveaux`/`getNiveauByCycle`) |
| Organisation filières (`filieres/Tab/OrganisationContent.vue`) | Filière/responsable/effectif/capacité | Filière, Responsable, Effectifs, Capacité, Taux remplissage, Statut | aucune | aucun | non paginé | ordre API natif | API (`fetchFiliereOrganisation`) |
| Liste des classes (`classes/Tab/ClassesContent.vue`) | Classes | #, Code, Filière, Niveau, Émarge/Capacité max, Actions | Détails/Modifier/Supprimer (non branché réellement, voir §7) | aucun | oui (composant `Pagination`, 10/page) | ordre API natif | API (`fetchClasses`) |
| Classes par filière (`classes/Tab/FilieresContent.vue`) | Classes filtrées par filière sélectionnée | #, Code Classe, Niveau, Capacité Max, Dernière MàJ, Actions | Détails/Modifier/Supprimer | dropdown sélection filière (obligatoire pour afficher) | non paginé | ordre API natif | API (`fetchClassesByFiliere`) |
| Classes par niveau (`classes/Tab/NiveauxContent.vue`) | Classes filtrées par niveau sélectionné | #, Code Classe, Filière, Capacité Max, Date création, Actions | Détails/Modifier/Supprimer | dropdown sélection niveau (obligatoire) | non paginé | ordre API natif | API (`fetchClassesByNiveau`) |
| Arbre organisation classes (`OrganisationClassesContent.vue`) | Classe/Niveau/Filière/Cycle/effectif/capacité/statut | Classe&Niveau, Filière, Structure/Cycle, Effectif/Capacité, Remplissage, Statut | aucune | recherche texte, cycle, statut | non paginé | ordre API natif | API (`fetchOrganisationTree`), filtré localement |
| Liste des semestres (`SemestresContent.vue`) | Semestres | #, Code, Année Académique, Date début, Date fin, Statut, Actions | Détails/Éditer/Modifier/Activer-Désactiver/Supprimer | aucun | non paginé | ordre API natif | API (`fetchSemestres`) |
| UEs par semestre (`semestres/Tab/NiveauxContent.vue`) | UE rattachées au semestre sélectionné | Code UE, Intitulé, Crédits, Vol. Horaire, Actions | Modifier/Détacher (mock, ne modifie que l'état local) | sélection semestre (liste gauche) | non paginé | ordre du tableau statique | **Données simulées — API backend non encore connectée** (`initDataMock`) |
| Organisation semestres (`OrganisationSemestresContent.vue`) | Semestres groupés par niveau, avec UE et crédits | (cartes, pas de colonnes classiques) | aucune | recherche texte, filière, statut | non paginé | groupement par niveau | API (`fetchOrganisation`), filtré/groupé localement |
| Matrice statistiques semestres (`StatistiquesSemestresContent.vue`) | Charge d'enseignement par semestre | Semestre, Filière cible, Nb UE, Volume total, Moy. Validation, Alerte Équipe | aucune | sélecteur de période (année académique) | non paginé | ordre API natif | API (`fetchAnalytics(period)`) |

#### 10. Onglets

| Onglet | Rôle | Données affichées | Actions disponibles | Composant associé | Remarques |
|---|---|---|---|---|---|
| Liste des années | Vue principale CRUD | Table des années | CRUD + activation | `ListeAnneesContent.vue` | connecté API |
| Calendrier académique | Vue calendrier des examens/périodes | Table vide | aucune | `CalendrierContent.vue` | non connecté, contenu figé |
| Statistiques (Année) | KPIs de l'année active + perf. par filière | Cartes KPI, tableau filières | Export Excel/PDF, export rapport | `StatistiquesContent.vue` | connecté API (`fetchCurrentAnnee`, `fetchAnneeStats`) |
| Historique | Vue chronologique des années | Timeline avec cartes | Détails/Modifier (icônes, actions non toutes câblées) | `HistoriqueContent.vue` | connecté API, filtrage local |
| Cycles | Vue principale CRUD | Table des cycles | CRUD | `CyclesContent.vue` | connecté API |
| Filières (dans Cycle) | Filières par cycle | (dépend de `cycleStore.filieres`) | — | `cycles/Tab/FilieresContent.vue` | lecture non détaillée en profondeur ici (nom identique à celui du module Filière, contenu distinct) |
| Organisation (Cycle) | Vue d'ensemble effectifs/capacité par cycle | Tableau organisation | aucune | `cycles/Tab/OrganisationContent.vue` | connecté API |
| Statistiques (Cycle) | Distribution des étudiants par cycle | Tableau + recherche | recherche | `StatistiquesCyclesContent.vue` | connecté API |
| Filières | Vue principale CRUD | Table des filières | CRUD | `filieres/Tab/FilieresContent.vue` | connecté API |
| Niveaux (Filière) | Gestion des niveaux | Table niveaux paginée | CRUD, filtre cycle | `filieres/Tab/NiveauxContent.vue` | connecté API |
| Organisation (Filière) | Vue effectifs/capacité par filière | Tableau organisation | aucune | `filieres/Tab/OrganisationContent.vue` | connecté API |
| Statistiques (Filière) | Stats par filière sélectionnée | Cartes KPI | sélection filière | `StatistiquesFilieresContent.vue` | connecté API |
| Classes | Vue principale CRUD | Table classes paginée | CRUD (partiellement câblé) | `classes/Tab/ClassesContent.vue` | connecté API |
| Niveaux (Classes) | Classes filtrées par niveau | Table filtrée | sélection niveau | `classes/Tab/NiveauxContent.vue` | connecté API |
| Filières (Classes) | Classes filtrées par filière | Table filtrée | sélection filière | `classes/Tab/FilieresContent.vue` | connecté API |
| Organisation (Classes) | Arbre organisation classes | Table avec filtres | recherche, filtres | `OrganisationClassesContent.vue` | connecté API |
| Statistiques (Classes) | KPI infrastructure globale | Cartes KPI + barre occupation | aucune | `StatistiquesClassesContent.vue` | connecté API |
| Semestres | Vue principale CRUD | Table semestres | CRUD + activation | `SemestresContent.vue` | connecté API |
| Organisation (Semestre) | Semestres groupés par niveau | Cartes groupées | recherche, filtres | `OrganisationSemestresContent.vue` | connecté API |
| UEs | Configuration des UE par semestre | Master-detail semestre/UE | Ajouter/Modifier/Détacher UE (mock) | `semestres/Tab/NiveauxContent.vue` | **Données simulées — API backend non encore connectée** |
| Statistiques (Semestre) | Analytics globaux | Cartes KPI + matrice + typologie | sélecteur de période | `StatistiquesSemestresContent.vue` | connecté API |
| Assistant AI (Semestre) | Chatbot académique | Fil de discussion | poser une question (raccourcis) | `AssistantAIContent.vue` | **Données simulées — chat 100% frontend, sans appel LLM réel** |

#### 11. Workflow métier complet

##### WF-STRUCTURE-01 — Création d'une nouvelle année académique
- **Objectif** : ouvrir une nouvelle année académique dans le système.
- **Acteur principal** : Administrateur académique (rôle non confirmé dans le code).
- **Préconditions** : être authentifié (route protégée `requiresAuth: true`).
- **Point de départ** : écran `/annees-academiques`, clic sur « + Ajouter un nouveau ».
- **Étapes détaillées** :
  1. L'utilisateur clique sur « + Ajouter un nouveau » → `AnneeHeader.openAddModal()` ouvre `#anneeModal` (mode création, `anneeToEdit = null`).
  2. Il saisit code, dates début/fin, statut, et coche éventuellement « année active ».
  3. Il clique sur « Enregistrer » → `submitAnnee()`.
  4. Validation locale (`validateForm`) : champs obligatoires + cohérence des dates.
  5. Si valide, appel `anneeStore.addAnneeAcademique(form)`.
- **Traitement frontend** : le store passe `loading = true`, appelle l'API, affiche un toast succès (`messageStore.notifySuccess`), invalide le cache localStorage (`anneesAcademiques`), puis relance `fetchAnneesAcademiques()` pour rafraîchir la liste.
- **Appels API** : `POST /api/academique/annees` (via `createAnneeAcademique`), puis `GET /api/academique/annees`.
- **Résultat final** : nouvelle année visible dans la liste, modal fermée après 1200ms, formulaire réinitialisé.
- **Cas alternatifs** : édition d'une année existante (`isEdit = true`, appel `updateAnneeAcademique`).
- **Exceptions** : validation échoue → message d'erreur local affiché, pas d'appel API ; erreur réseau/API → `error.message` affiché + toast d'erreur global.
- **Postconditions** : l'année est persistée côté backend (présumé) et redevient visible après rechargement.
- **Points à confirmer** : aucune vérification frontend empêchant la création de plusieurs années avec `est_active = true` simultanément — la règle « une seule année active » semble reposer entièrement sur le backend (endpoint dédié `activateAnnee` suggère une logique serveur de désactivation automatique des autres, mais non observable côté frontend).

##### WF-STRUCTURE-02 — Construction de la hiérarchie Cycle → Filière → Niveau → Classe
- **Objectif** : établir la structure pédagogique complète avant les inscriptions.
- **Acteur principal** : Administrateur académique.
- **Préconditions** : année académique existante (recommandé, non techniquement bloquant pour Cycle/Filière/Niveau/Classe qui ne dépendent pas d'`annee_id`).
- **Point de départ** : `/cycles-academiques`.
- **Étapes détaillées** :
  1. Créer un cycle (`Modal/addCycle.vue`) : code, désignation, durée, crédits, diplôme.
  2. Aller sur `/filieres-academiques`, créer une filière rattachée à ce cycle (`cycle_id` obligatoire).
  3. Toujours sur Filières, onglet Niveaux, créer les niveaux (L1, L2…) rattachés au même cycle, avec ordre et frais de scolarité.
  4. Aller sur `/classes-niveaux`, créer une classe en sélectionnant la filière puis un niveau filtré automatiquement par le `cycle_id` de la filière choisie.
- **Traitement frontend** : chaque étape déclenche un cycle create→refresh classique (voir WF-01). Le formulaire Classe filtre dynamiquement les niveaux disponibles via un `computed` (`filteredNiveaux`) basé sur la correspondance `cycle_id`.
- **Appels API** : `POST /cycles`, `POST /filieres`, `POST /niveaux`, `POST /classes` (+ `GET /cycles`, `GET /filieres`, `GET /niveaux` pour peupler les selects).
- **Résultat final** : arborescence Cycle→Filière→Niveau→Classe consultable dans les onglets « Organisation »/« Architecture » de chaque module.
- **Cas alternatifs** : création d'un niveau sans passer par une filière préexistante (le formulaire Niveau ne dépend que du Cycle, pas de la Filière) — un niveau peut donc exister avant toute filière.
- **Exceptions** : tentative de créer une classe sans filière/niveau sélectionné → bloqué par validation locale.
- **Postconditions** : la structure est utilisable par les modules Scolarité/Pédagogie pour les inscriptions et emplois du temps (non vérifié dans ce lot de fichiers).
- **Points à confirmer** : aucune contrainte d'unicité de code visible côté frontend (ex: deux cycles avec le même code) — dépend probablement du backend.

##### WF-STRUCTURE-03 — Configuration d'un semestre et de ses UE (partiellement simulé)
- **Objectif** : définir les semestres d'une année active et leur maquette d'UE.
- **Acteur principal** : Administrateur académique / responsable pédagogique.
- **Préconditions** : une année académique doit être marquée `est_active = true` pour permettre la création d'un semestre (vérifié frontend : `errorMessage` bloquant si `anneeActive` introuvable).
- **Point de départ** : `/semestres`, clic « + Ajouter nouveau ».
- **Étapes détaillées** :
  1. Le formulaire charge automatiquement l'année active via `anneeStore.fetchAnneesAcademiques()` et filtre sur `est_active`.
  2. L'utilisateur saisit code (S1/S2…), dates, coche « actif » si nécessaire.
  3. Soumission → `semestreStore.addSemestre(payload)`.
  4. (Fonctionnalité non connectée au backend) L'utilisateur va ensuite dans l'onglet « UEs », sélectionne le semestre créé dans le panneau de gauche, et tente d'y rattacher des UE via « Rattaché une UE au [code] ».
- **Traitement frontend** : étapes 1-3 sont réelles (API), l'étape 4 est **entièrement simulée** (le composant charge des données statiques `initDataMock()` sans jamais lire le vrai `semestre.id` créé — les IDs 1, 2, 3 sont hardcodés).
- **Appels API** : `POST /semestres` (réel) ; aucun appel pour la gestion des UE dans ce composant (bien qu'un `moduleApi.js` avec des endpoints `/modules/*` existe côté API, non branché à ce composant).
- **Résultat final** : le semestre est créé côté backend ; la configuration des UE reste un prototype visuel non fonctionnel.
- **Cas alternatifs** : édition d'un semestre existant, changement de statut actif/inactif via `changeSemestreStatus`.
- **Exceptions** : aucune année active → création bloquée avec message explicite.
- **Postconditions** : semestre persistant, UE non persistées.
- **Points à confirmer** : `moduleApi.js` (`getSemestresConfiguration`, `getUesByConfiguration`, `detachUeFromConfig`, `assignModuleToClasse`, CRUD `/modules`) semble être l'API destinée à remplacer le mock de `semestres/Tab/NiveauxContent.vue`, mais aucun store ni composant lu ne l'utilise actuellement — à confirmer avec l'équipe backend/produit si cette intégration est prévue à court terme.

#### 12. Cas d'utilisation

##### UC-STRUCTURE-01 — Créer une année académique
- **Acteur principal** : Administrateur académique.
- **Objectif** : enregistrer une nouvelle année académique dans le système.
- **Préconditions** : utilisateur authentifié.
- **Déclencheur** : clic sur « + Ajouter un nouveau » sur `/annees-academiques`.
- **Scénario nominal** : ouverture modal → saisie code/dates/statut → clic Enregistrer → validation OK → API `POST /annees` → succès → liste rafraîchie → modal fermée.
- **Scénarios alternatifs** : édition d'une année existante via le menu d'action « Modifier » (préremplissage du formulaire via prop `anneeToEdit` et `watch`).
- **Exceptions** : dates incohérentes (fin ≤ début) → blocage local ; erreur serveur → message d'erreur affiché, formulaire non réinitialisé.
- **Postconditions** : nouvelle entité `AnneeAcademique` disponible pour les modules dépendants (Semestre, Scolarité…).
- **Interfaces concernées** : `AnneeHeader.vue`, `Modal/addAnnee.vue`, `ListeAnneesContent.vue`.
- **API concernées** : `createAnneeAcademique`, `getAnneesAcademiques`.
- **Données manipulées** : `AnneeAcademique { code, date_debut, date_fin, statut, est_active }`.
- **Règles métier** : une seule année active à la fois (affichée, non vérifiée frontend) ; format de code recommandé `YYYY-YYYY` (non forcé techniquement, juste une aide texte).
- **Remarque reconstruction** : reproduire le blocage de soumission tant que la validation locale échoue, et afficher le message d'erreur retourné par le backend sinon un message générique.

##### UC-STRUCTURE-02 — Activer une année académique
- **Acteur principal** : Administrateur académique.
- **Objectif** : marquer une année comme active (année de travail courante du système).
- **Préconditions** : au moins une année académique existe.
- **Déclencheur** : clic « Activer/Désactiver » dans le menu d'action d'une ligne de la liste des années.
- **Scénario nominal** : confirmation dans une modal → `anneeStore.activateAnnee(id)` → `PATCH /annees/{id}/activate` → toast succès → liste rafraîchie.
- **Scénarios alternatifs** : aucun distingué frontend entre activer/désactiver — le même endpoint `activate` est appelé quel que soit l'état courant (`isActive` sert uniquement à l'affichage du libellé du bouton).
- **Exceptions** : erreur API → toast d'erreur « Erreur lors de l'activation. ».
- **Postconditions** : l'année devient (présumé) la seule active ; les autres années sont désactivées côté backend (logique non visible côté frontend).
- **Interfaces concernées** : `details/ItemActions.vue` (anneeac).
- **API concernées** : `activateAnnee`.
- **Données manipulées** : `AnneeAcademique.est_active`.
- **Règles métier** : RM-STRUCTURE-02 (voir §15).
- **Remarque reconstruction** : à confirmer si un endpoint de désactivation distinct existe côté backend — le frontend n'appelle qu'un seul verbe PATCH `/activate` sans body, quel que soit l'état visé.

##### UC-STRUCTURE-03 — Créer une classe rattachée à une filière et un niveau
- **Acteur principal** : Administrateur académique.
- **Objectif** : ouvrir une nouvelle classe (groupe d'étudiants) pour une filière/niveau donnés.
- **Préconditions** : au moins une filière et un niveau existent, avec le niveau rattaché au même cycle que la filière.
- **Déclencheur** : clic « + Ajouter un nouveau » sur `/classes-niveaux`.
- **Scénario nominal** : sélection filière → niveaux filtrés automatiquement par cycle → sélection niveau → saisie code + capacité → soumission → `POST /classes` → succès → liste rafraîchie.
- **Scénarios alternatifs** : changement de filière après sélection d'un niveau → reset automatique de `niveau_id` (`onFiliereChange`).
- **Exceptions** : code manquant, filière ou niveau non sélectionné, capacité < 1 → blocage local.
- **Postconditions** : classe utilisable pour les inscriptions d'étudiants (module Scolarité, hors périmètre ici).
- **Interfaces concernées** : `Modal/addClasse.vue`, `ClassesContent.vue`.
- **API concernées** : `createClasse`, `getFilieres`, `getNiveaux`.
- **Données manipulées** : `Classe { code, filiere_id, niveau_id, capacite_max }`.
- **Règles métier** : le niveau doit appartenir au même cycle que la filière sélectionnée (filtrage `filteredNiveaux` basé sur `cycle_id` commun).
- **Remarque reconstruction** : reproduire le filtrage dynamique niveau↔filière (via `cycle_id` partagé), pas un simple filtre statique.

##### UC-STRUCTURE-04 — Consulter les statistiques d'une filière
- **Acteur principal** : Administrateur académique / consultant.
- **Objectif** : visualiser les indicateurs clés (effectifs, classes) d'une filière donnée.
- **Préconditions** : au moins une filière existe.
- **Déclencheur** : navigation vers l'onglet « Statistiques » de `/filieres-academiques`.
- **Scénario nominal** : chargement de la liste des filières → sélection automatique de la première → chargement des stats (`fetchFiliereStats(id)`) → affichage des cartes KPI.
- **Scénarios alternatifs** : changement manuel de filière dans le select → rechargement des stats (`watch(selectedFiliereId)`).
- **Exceptions** : aucune filière disponible → état vide affiché (« Veuillez sélectionner une filière… », bien que ce message concerne plutôt l'absence de sélection que l'absence de données).
- **Postconditions** : aucune (lecture seule).
- **Interfaces concernées** : `StatistiquesFilieresContent.vue`.
- **API concernées** : `getFilieres`, `getFiliereStats`.
- **Données manipulées** : `nb_etudiants`, `nb_classes` (agrégats read-only).
- **Règles métier** : aucune règle de gestion, uniquement de la restitution.
- **Remarque reconstruction** : le comportement de sélection automatique de la première filière au chargement est à reproduire pour préserver l'UX.

#### 13. Données manipulées

| Entité | Champs visibles | Utilisation | Module lié | Source |
|---|---|---|---|---|
| AnnéeAcadémique | id, code, date_debut, date_fin, statut (PLANIFIEE/OUVERTE/CLOTUREE), est_active, nb_etudiants, nb_classes (historique) | racine temporelle du système, rattache Semestres et Inscriptions | Semestres, Scolarité (inscriptions) | API réelle (`/annees`) |
| Cycle | id, code, designation, description, duree_annees, credits_total, diplome, est_actif/statut | macro-niveau de formation | Filières, Architecture | API réelle (`/cycles`) |
| Filière | id, code, designation, cycle_id, cycle_nom, credit_total, nb_classes | parcours de formation rattaché à un cycle | Niveaux, Classes | API réelle (`/filieres`) |
| Niveau | id, code, cycle_id, cycle_code, ordre, frais_scolarite, nb_classes | subdivision annuelle d'un cycle | Filières, Classes | API réelle (`/niveaux`) |
| Classe | id, code, filiere_id, filiere_nom, niveau_id, niveau_code, capacite_max, nb_etudiants, created_at, updated_at | groupe d'étudiants pour affectation pédagogique | Filières, Niveaux, Scolarité | API réelle (`/classes`) |
| Semestre | id, code, annee_id, annee_academique_code, annee_est_active, date_debut, date_fin, est_actif | subdivision temporelle de l'année, support des UE | Année Académique, Modules/UE | API réelle (`/semestres`) |
| UE (Unité d'Enseignement) | id, code, libelle, credits, heures, type, semestreId | maquette pédagogique d'un semestre | Semestre, Modules | **Simulée** dans `semestres/Tab/NiveauxContent.vue` ; API distincte existante mais non branchée (`moduleApi.js` → `/modules/*`) |
| Statistiques (par entité) | nb_etudiants, taux_reussite, nb_modules, nb_classes, moyenne_generale, taux_remplissage, effectifs/capacité | tableaux de bord et rapports | tous les écrans "Statistiques"/"Organisation" | API réelle (endpoints `/stats`, `/analytics`, `/organisations`) |

#### 14. API et intégration backend

Toutes les requêtes du module passent par `academiqueApi.js`, construit sur `buildService(academiqueApi)` (client Axios avec `baseURL = ${VITE_API_URL}/api/academique`, injection automatique du token Bearer depuis `localStorage`).

| Action frontend | Service API | Endpoint | Méthode HTTP | Payload envoyé | Réponse attendue | Page concernée |
|---|---|---|---|---|---|---|
| Lister années | `getAnneesAcademiques` | `/annees` | GET | — | `{ data: [...], meta }` | Années — Liste |
| Historique années | `getAnneesHistory` | `/annees/history` | GET | — | `{ data: [...] }` | Années — Historique |
| Année courante | `getCurrentAnnee` | `/annees/current` | GET | — | `{ data: {...} }` | Années — Statistiques |
| Année par ID | `getAnneeById` | `/annees/{id}` | GET | — | `{ data: {...} }` | (non observé dans un composant lu) |
| Stats année | `getAnneeStats` | `/annees/{id}/stats` | GET | — | `{ data: {...} }` | Années — Statistiques |
| Export année | `exportAnneeData` | `/annees/{id}/export` | GET | — | fichier/blob (présumé) | Années — Statistiques |
| Activer année | `activateAnnee` | `/annees/{id}/activate` | PATCH | — | — | Années — Liste (action) |
| Créer année | `createAnneeAcademique` | `/annees` | POST | `{ code, date_debut, date_fin, statut, est_active }` | entité créée | Modal Année |
| Modifier année | `updateAnneeAcademique` | `/annees/{id}` | PUT | idem | entité modifiée | Modal Année |
| Supprimer année | `deleteAnneeAcademique` | `/annees/{id}` | DELETE | — | — | Années — Liste (action) |
| Lister cycles | `getCycles` | `/cycles` | GET | — | `{ data: [...] }` | Cycles — Liste |
| Cycle par ID | `getCycleById` | `/cycles/{id}` | GET | — | `{ data: {...} }` | (non observé) |
| Filières d'un cycle | `getCycleFilieres` | `/cycles/{id}/filieres` | GET | — | `{ data: [...] }` | (non observé directement) |
| Architecture cycles | `getCycleArchitecture` | `/cycles/tree/filieres` | GET | — | `{ data: [...] }` | Cycles — Filières (architecture) |
| Distribution cycles | `getCycleDistributionStats` | `/cycles/stats/distribution` | GET | — | `{ data: [...] }` | Cycles — Statistiques |
| Organisation cycles | `getCycleOrganisation` | `/cycles/stats/organisations/` | GET | — | `{ data: [...] }` | Cycles — Organisation |
| Créer cycle | `createCycle` | `/cycles` | POST | `{ code, designation, description, diplome, duree_annees, credits_total, statut }` | entité créée | Modal Cycle |
| Modifier cycle | `updateCycle` | `/cycles/{id}` | PUT | idem | entité modifiée | Modal Cycle |
| Supprimer cycle | `deleteCycle` | `/cycles/{id}` | DELETE | — | — | Cycles — Liste (action) |
| Lister filières | `getFilieres` | `/filieres` | GET | — | `{ data: [...] }` | Filières — Liste |
| Filière par ID | `getFiliereById` | `/filieres/{id}` | GET | — | `{ data: {...} }` | (non observé) |
| Organisation filières | `getFiliereOrganisation` | `/filieres/stats/organisations` | GET | — | `{ data: [...] }` | Filières — Organisation |
| Filières par cycle | `getFilieresByCycle` | `/filieres/cycle/{cycleId}` | GET | — | `{ data: [...] }` | (non observé directement dans les composants lus) |
| Stats filière | `getFiliereStats` | `/filieres/{id}/stats` | GET | — | `{ data: {...} }` | Filières — Statistiques |
| Créer filière | `createFiliere` | `/filieres` | POST | `{ code, designation, cycle_id, credit_total }` | entité créée | Modal Filière |
| Modifier filière | `updateFiliere` | `/filieres/{id}` | PUT | idem | entité modifiée | Modal Filière |
| Supprimer filière | `deleteFiliere` | `/filieres/{id}` | DELETE | — | — | Filières — Liste (action) |
| Lister niveaux | `getNiveaux` | `/niveaux` | GET | — | `{ data: [...] }` | Filières/Classes — Niveaux |
| Niveau par ID | `getNiveauById` | `/niveaux/{id}` | GET | — | `{ data: {...} }` | (non observé) |
| Niveaux par filière | `getNiveauxByFiliere` | `/niveaux/filiere/{filiereId}` | GET | — | `{ data: [...] }` | (non observé directement — le composant appelle `getNiveauByCycle`, absent de l'API listée, voir §15) |
| Effectifs niveau | `getNiveauEffectifs` | `/niveaux/{id}/effectifs` | GET | — | `{ data: {...} }` | (non observé dans un composant lu) |
| Créer niveau | `createNiveau` | `/niveaux` | POST | `{ code, cycle_id, ordre, frais_scolarite }` | entité créée | Modal Niveau |
| Modifier niveau | `updateNiveau` | `/niveaux/{id}` | PUT | idem | entité modifiée | Modal Niveau |
| Supprimer niveau | `deleteNiveau` | `/niveaux/{id}` | DELETE | — | — | Niveaux — Liste (action) |
| Lister classes | `getClasses` | `/classes` | GET | — | `{ data: [...] }` | Classes — Liste |
| Classe par ID | `getClasseById` | `/classes/{id}` | GET | — | `{ data: {...} }` | (non observé) |
| Arbre organisation classes | `getClassesOrganisationTree` | `/classes/stats/organisations` | GET | — | `{ data: [...] }` | Classes — Organisation |
| KPI infrastructure globale | `getGlobalInfrastructureKPIs` | `/classes/analytics/dashboard-global` | GET | — | `{ data: {...} }` | Classes — Statistiques |
| Classes par niveau | `getClassesByNiveau` | `/classes/niveau/{niveauId}` | GET | — | `{ data: [...] }` | Classes — Niveaux (filtré) |
| Classes par filière | `getClassesByFiliere` | `/classes/filiere/{filiereId}` | GET | — | `{ data: [...] }` | Classes — Filières (filtré) |
| Étudiants d'une classe | `getClasseStudents` | `/classes/{id}/etudiants` | GET | — | `{ data: [...] }` | (non observé dans ce lot) |
| Modules d'une classe | `getClasseModules` | `/classes/{id}/modules` | GET | — | `{ data: [...] }` | (non observé dans ce lot) |
| Assigner module à classe | `assignModuleToClasse` (academiqueApi) | `/classes/{id}/assigner-module` | POST | `data` | — | (non observé) — doublon de nom avec `moduleApi.assignModuleToClasse` (endpoint différent, `/modules/assigner`) |
| Taux remplissage classe | `getClasseOccupancyRate` | `/classes/{id}/taux-remplissage` | GET | — | `{ data: {...} }` | (non observé dans ce lot) |
| Créer classe | `createClasse` | `/classes` | POST | `{ code, niveau_id, filiere_id, capacite_max }` | entité créée | Modal Classe |
| Modifier classe | `updateClasse` | `/classes/{id}` | PUT | idem | entité modifiée | Modal Classe |
| Supprimer classe | `deleteClasse` | `/classes/{id}` | DELETE | — | — | Classes — Liste (action, non branchée dans `ClassesContent.vue`) |
| Lister semestres | `getSemestres` | `/semestres` | GET | — | `{ data: [...] }` | Semestres — Liste |
| Semestre par ID | `getSemestreById` | `/semestres/{id}` | GET | — | `{ data: {...} }` | Semestres (rechargement après changement statut) |
| Semestres actifs | `getActiveSemestres` | `/semestres/courants/actifs` | GET | — | `{ data: [...] }` | (non observé dans les composants lus) |
| Semestres par année | `getSemestresByAnnee` | `/semestres/annee/{anneeId}` | GET | — | `{ data: [...] }` | (non observé dans les composants lus) |
| Organisation semestres | `getSemestresOrganisation` | `/semestres/stats/organisations` | GET | — | `{ data: [...] }` | Semestres — Organisation |
| Analytics semestres | `getSemestreAnalytics` | `/semestres/analytics/dashboard?period={period}` | GET | — | `{ data: {...} }` | Semestres — Statistiques |
| Créer semestre | `createSemestre` | `/semestres` | POST | `{ code, annee_id, date_debut, date_fin, est_actif }` | entité créée | Modal Semestre |
| Modifier semestre | `updateSemestre` | `/semestres/{id}` | PUT | idem | entité modifiée | Modal Semestre |
| Supprimer semestre | `deleteSemestre` | `/semestres/{id}` | DELETE | — | — | Semestres — Liste (action) |
| Changer statut semestre | `changeSemestreStatus` | `/semestres/{id}/statut` | PATCH | `{ est_actif }` | — | Semestres — Liste (Activer/Désactiver) |
| Config UE par semestre (non branché) | `getSemestresConfiguration` (moduleApi.js) | `/modules/configuration/semestres` | GET | — | — | Endpoint non visible utilisé dans un composant — comportement attendu côté reconstruction : remplacer `initDataMock()` de `semestres/Tab/NiveauxContent.vue` par cet appel |
| UE par configuration (non branché) | `getUesByConfiguration` | `/modules/configuration/details` | GET | — | — | idem |
| Détacher UE (non branché) | `detachUeFromConfig` | `/modules/configuration/detacher/{attributionId}` | DELETE | — | — | idem — remplacerait `retirerUE()` local |
| CRUD Modules (non branché) | `createModule`/`updateModule`/`deleteModule` | `/modules`, `/modules/{id}` | POST/PUT/DELETE | — | — | Endpoint non visible utilisé dans un écran de ce module lu |

#### 15. Règles métier détectées

- **RM-STRUCTURE-01** — Une année académique ne peut être créée sans code, dates de début/fin et statut ; la date de fin doit être strictement postérieure à la date de début (validation frontend stricte, probablement dupliquée côté backend).
- **RM-STRUCTURE-02** — Une seule année académique peut être active à la fois (« Une seule année peut être active à la fois », texte affiché dans `Modal/addAnnee.vue`) — à confirmer : la désactivation automatique des autres années lors de l'activation d'une nouvelle n'est pas visible côté frontend (un seul endpoint `PATCH /annees/{id}/activate` est appelé, sans logique de désactivation explicite du frontend).
- **RM-STRUCTURE-03** — Un semestre ne peut être créé que si une année académique est active (bloqué frontend avec message explicite dans `Modal/addSemestre.vue`).
- **RM-STRUCTURE-04** — Un seul semestre peut être actif par année académique (texte affiché, non vérifié frontend — à confirmer côté backend).
- **RM-STRUCTURE-05** — Le code d'un Cycle, d'une Filière, d'un Niveau ou d'une Classe est limité à 10 caractères et automatiquement mis en majuscules (`.toUpperCase()`) avant envoi à l'API.
- **RM-STRUCTURE-06** — La désignation d'un Cycle ou d'une Filière est limitée à 100 caractères.
- **RM-STRUCTURE-07** — Un Niveau doit être rattaché à un Cycle (`cycle_id` obligatoire) et son `ordre` doit être ≥ 1 (utilisé pour le tri des niveaux au sein d'un cycle).
- **RM-STRUCTURE-08** — Une Filière doit être rattachée à un Cycle (`cycle_id` obligatoire).
- **RM-STRUCTURE-09** — Une Classe doit être rattachée à une Filière ET à un Niveau ; le formulaire de création filtre les niveaux proposés pour qu'ils appartiennent au même `cycle_id` que la filière sélectionnée (règle de cohérence structurelle imposée côté frontend, à confirmer côté backend).
- **RM-STRUCTURE-10 (à confirmer)** — La capacité maximale d'une classe (`capacite_max`) doit être ≥ 1 si renseignée ; elle est optionnelle (pas de valeur par défaut visible).
- **RM-STRUCTURE-11 (à confirmer)** — Les caches locaux (`localStorage`, TTL 5 minutes) sont utilisés pour `anneesAcademiques`, `cycles`, `filieres`, `niveaux`, `classes`, `semestres` — toute mutation (create/update/delete) invalide explicitement la clé de cache concernée avant de recharger depuis l'API ; c'est une optimisation de performance frontend, pas une règle métier au sens strict, mais elle impacte le comportement observable (données potentiellement périmées jusqu'à 5 min après une modification faite dans un autre onglet/session).

#### Points à confirmer

1. **`Modal/addAnneeSample.vue`** (`src/views/stracad/anneeac/components/Modal/addAnneeSample.vue`) : composant Options API isolé, avec sa propre logique de simulation de création d'année académique imbriquée dans un formulaire de « concours ». Grep effectué : aucune référence à ce fichier ailleurs dans `src` (ni import, ni route). À traiter comme un **brouillon non branché**, à ne pas reconstruire tel quel — probablement un prototype pour un futur lien Concours↔Année académique.
2. **`cycles/components/Tab/AI-cycle-sample.vue`** : composant « Tableau de Bord & Copilote des Cycles » avec chat IA simulé, non importé dans `CycleTab.vue` actuel (qui ne référence que Cycles/Filières/Organisation/Statistiques). Fichier physiquement présent mais orphelin d'un point de vue routage d'onglets — à vérifier avec l'équipe si un 5e onglet a été retiré ou si son ajout est prévu.
3. **`niveauStore.getNiveauByCycle`** : appelé depuis `filieres/Tab/NiveauxContent.vue` (`filterByCycle`) mais cette action n'existe pas dans `src/stores/academiqueStore/niveauStore.js` (le store expose `fetchNiveauxByFiliere`, pas `getNiveauByCycle`). Incohérence probable de nommage/refactor incomplet — à corriger lors de la reconstruction (le filtre par cycle plantera en l'état actuel du code).
4. **Écarts « action non branchée »** : dans `filieres/Tab/FilieresContent.vue` (`editFiliere`) et `classes/Tab/ClassesContent.vue` (`editClasse`, `confirmDelete`), les handlers émis par les composants `*ItemActions.vue` ne font qu'un `console.log` au lieu d'appeler réellement le store (`removeClasse`, préremplissage du formulaire d'édition). L'ouverture de la modal d'édition se fait uniquement via l'attribut `data-bs-toggle`/`data-bs-target` du bouton « Modifier » du dropdown, indépendamment de ces handlers — donc l'édition fonctionne visuellement (modal s'ouvre) mais peut ne pas être préremplie avec les données de la ligne cliquée selon l'implémentation exacte de `openForEdit`/watch (à tester en environnement réel pour confirmer si le préremplissage fonctionne malgré tout via un autre mécanisme non identifié dans le code lu).
5. **Orphelins confirmés (grep exhaustif sur `src`, aucun import trouvé, aucune route ne les référence)** :
   - `src/views/structure/Annees.vue`
   - `src/views/structure/Cursus.vue`
   - `src/views/matieres/Modules.vue`
   - `src/views/matieres/ModuleHeader.vue`
   - `src/views/matieres/data-io/ModuleImporter.vue`
   - `src/views/matieres/tab/AModuleList.vue`
   - `src/views/matieres/tab/ModuleRow.vue`
   - `src/views/matieres/tab/ModuleList.vue`
   - `src/views/matieres/details/DetailsPanel.vue`
   - `src/views/matieres/details/DetailItem.vue`
   - `src/views/matieres/details/ItemDetails.vue`

   Ces fichiers ne sont référencés dans aucune route (`src/routes/*.js`) ni importés comme sous-composant dans aucun autre fichier `.vue`/`.js` du projet (recherche `grep -rn` sur les noms de fichiers exacts, résultat vide en dehors des fichiers eux-mêmes). Ils doivent être considérés comme du **code mort** vis-à-vis de la reconstruction : **ne pas les inclure dans le périmètre fonctionnel du module Structure Académique**, sauf si le donneur d'ordre confirme une intention de les réactiver (le contenu de `Modules.vue`/`ModuleHeader.vue` suggère une V1 abandonnée de la gestion des modules/UE, probablement remplacée depuis par le concept « UE » du module Semestre, actuellement lui-même en mock).
6. **Doublon de nom `assignModuleToClasse`** : cette fonction existe à la fois dans `academiqueApi.js` (`POST /classes/{id}/assigner-module`) et dans `moduleApi.js` (`POST /modules/assigner`) avec des signatures différentes (`(id, data)` vs `(data)`). Risque de confusion à la reconstruction — bien vérifier quel endpoint correspond à quel écran (aucun des deux n'a été observé appelé depuis un composant du présent lot de fichiers).
7. **`Tab/todo.txt`** (`src/views/stracad/semestres/components/Tab/todo.txt`) : fichier texte contenant un brouillon de `<script setup>` Vue non enregistré en `.vue`, illustrant une intégration Axios directe (hors store Pinia) pour l'endpoint `/api/academique/semestres/analytics/dashboard`. Non fonctionnel en l'état (pas de composant chargé nulle part) — à considérer comme une note de développement.
8. **Rôles et permissions** : aucun élément du code frontend lu ne permet de déterminer quels rôles utilisateurs ont accès à ce module au-delà de l'authentification générique. À faire confirmer par le backend/l'équipe produit avant reconstruction si un système de permissions plus fin doit être répliqué.

---

### Module : Scolarité (Étudiants, Dossiers scolaires, Absences)

> Périmètre couvert : `src/views/etudiants/**`, `src/views/parcours/**`, `src/views/absence/**`, `src/stores/etudiants/etudiantStore.js`, `src/api/academique/etudiantApi.js`, ainsi que les composants partagés `src/components/shared/{ItemDetails,Pagination,itemAction}.vue`.
> Toutes les informations ci-dessous proviennent d'une lecture intégrale des fichiers listés. Aucune donnée n'est inventée. Les portions non câblées, mockées ou orphelines sont signalées explicitement.

---

#### 1. Objectif métier

Le module « Scolarité » regroupe les écrans permettant à l'établissement de :
- Gérer le référentiel des étudiants (création, consultation, organisation en groupes/classes, statistiques, export/impression de listes).
- Consulter le « dossier académique » (ou « dossier scolaire ») d'un étudiant : identité, parcours pédagogique (notes/historique de classes), assiduité/discipline, situation financière et documents archivés.
- Gérer les absences et présences au jour le jour via une fiche d'émargement par classe/cours/créneau.

C'est le cœur du suivi administratif et pédagogique de l'étudiant tout au long de son cursus (LMD), en lien avec les modules Inscriptions, Pédagogie (filières/classes/années) et Finances (frais de scolarité, visible en lecture dans l'onglet « Situation Financière »).

#### 2. Acteurs concernés

Aucun mécanisme de RBAC (rôles/permissions) n'est visible dans les fichiers du module (pas de `v-if` sur des rôles, pas d'appel à un store de permissions). Toutes les routes ne portent que `meta: { requiresAuth: true }` au niveau du layout parent.
- **Rôle probable à confirmer** : Personnel du Service de la Scolarité / Affaires pédagogiques (gestion des étudiants, dossiers, absences).
- **Rôle probable à confirmer** : Enseignant ou surveillant (saisie de la feuille d'émargement dans `/absences`).
- **Rôle probable à confirmer** : Administrateur (génération de rapports, export).

#### 3. Menus et sous-menus associés

Extrait de `src/components/partials/sidebar.vue` (groupe « Scolarité », icône `mdi-account-group`) :

| Libellé menu | Route cible | Remarque |
|---|---|---|
| Gestion des étudiants | `/etudiants` | |
| Dossiers scolaires | `/dossiers-scolaires` | |
| Absences & Présences | `/absences` | |
| Évaluations & Notes | `/notes` | Hors périmètre de ce document (module Examens/Notes) |
| Statut étudiant | (ligne 524, contexte non documenté ici) | Hors périmètre |

Le tableau `menuGroups.scolarite` (ligne 702 de `sidebar.vue`) inclut aussi `/deliberations`, non traité ici.

Aucun menu ne pointe vers `src/views/parcours/Parcours.vue` — voir section 4.

#### 4. Pages et routes associées

Source unique des routes : `src/routes/etudiants.routes.js`, montées sous `/` avec `DefaultLayout` et `meta: { requiresAuth: true }` (voir `src/routes/index.js`).

| Page | Route | Composant | Description | Statut |
|---|---|---|---|---|
| Liste des étudiants | `/etudiants` | `src/views/etudiants/Etudiants.vue` | Écran à onglets (liste, classes, organisation, statistiques, export) | Actif (dans sidebar) |
| Détail étudiant | `/etudiants/:id` | `src/views/etudiants/components/details/DetailEtudiant.vue` | Fiche étudiant (identité + fiche académique), `props: true` | Actif (accessible depuis liste) |
| Registre des dossiers scolaires | `/dossiers-scolaires` | `src/views/parcours/DossierView.vue` | Recherche/filtre d'étudiants, liste avec lien vers dossier détaillé | Actif (dans sidebar) |
| Dossier académique détaillé | `/dossiers-scolaires/:id/global-informations` | `src/views/parcours/DossierAcademique.vue` | Onglets Profil/Parcours/Assiduité/Finance/Documents | Actif (accessible depuis le registre) |
| Gestion des absences / présences | `/absences` | `src/views/absence/AbscenceView.vue` | Fiche d'émargement par classe/cours/créneau | Actif (dans sidebar) |
| — | **Route absente** | `src/views/parcours/Parcours.vue` | Écran « Progression académique » quasi identique à `DossierAcademique.vue` (même sous-composant `ParcourTab.vue`), mais aucune route ne le référence et aucun fichier ne l'importe (`grep` négatif dans tout `src`) | **Orphelin / mort** |

Remarque : la route `/inscriptions` est déclarée dans le même fichier `etudiants.routes.js` mais pointe vers `src/views/inscriptions/Inscription.vue`, qui appartient à un autre module fonctionnel (Inscriptions) — non traité ici.

#### 5. Description fonctionnelle complète

**Étudiants (`/etudiants`)** : page d'accueil du module, avec un en-tête (`EtudiantHeader.vue`) affichant titre, fil d'Ariane, boutons Export/Imprimer et un bouton « Générer un rapport » ouvrant une modal Bootstrap. Le corps de page (`EtudiantTab.vue`) présente 5 onglets Bootstrap (Liste, Classes, Organisation, Statistiques, Exportations) chacun avec son propre composant enfant chargeant (ou simulant) ses propres données — **aucun état n'est partagé entre les onglets**, chaque composant gère ses filtres/sa pagination indépendamment. La page `Etudiants.vue` elle-même simule un chargement (`setTimeout` 2s) et affiche 2 étudiants mockés dans une variable `etudiants` qui n'est en réalité jamais transmise aux onglets (dead state).

**Détail étudiant (`/etudiants/:id`)** : appelle `getEtudiantById(id)` au montage et affiche une fiche à onglets Bootstrap : « Information personnel » (identité, photo, naissance, contact) actif par défaut, « Fiche académique » (email pro, département, unité de service, fonction, diplôme, grade — champs orientés profil « personnel/agent » plutôt qu'étudiant, incohérence de modèle probable), « Tuteur » et « Dossier complet » (onglets déclarés dans le HTML mais sans `id` unique — bug de duplication d'`id="sales2"` empêchant leur activation correcte en JS/Bootstrap).

**Dossiers scolaires (`/dossiers-scolaires`)** : écran de recherche/filtrage (année, filière, niveau, classe — toutes options codées en dur) sur une liste mockée de 3 étudiants ; chaque ligne propose un lien « Détails » vers `/dossiers-scolaires/:id/global-informations`.

**Dossier académique (`/dossiers-scolaires/:id/global-informations`)** : en-tête avec fil d'Ariane, nom de l'étudiant (chargé via une simulation `setTimeout` 800 ms, pas d'appel API), boutons Retour et Imprimer le dossier (`window.print()`). Le corps affiche 5 onglets Bootstrap gérés par `ParcourTab.vue` : Profil & Informations, Parcours & Notes, Assiduité & Discipline, Situation Financière, Documents & Archives — chacun avec ses propres données 100 % mockées (voir section 13).

**Absences (`/absences`)** : écran de prise de présence. L'utilisateur choisit une date, une classe, un cours et un créneau horaire (listes codées en dur) ; une fois classe + cours sélectionnés, une « fiche d'émargement numérique » liste des étudiants mockés avec un choix radio Présent/Retard/Absent et un champ commentaire (actif seulement si Retard/Absent). Bouton « Tout cocher Présent » et bouton de validation qui simule un envoi réseau (`setTimeout` 1s) suivi d'une `alert()`.

**Parcours.vue (orphelin)** : page « Progression académique » quasi-doublon de `DossierAcademique.vue`, avec une modal de détail étudiant supplémentaire ; charge une liste de « formateurs » (nom de variable trompeur, probablement un copier-coller d'un autre module) mockée après 3 s. Non routée, à considérer comme du code mort ou un brouillon.

#### 6. Interfaces du module

##### Écran : Etudiants (liste)
- **Route** : `/etudiants`
- **Composant** : `src/views/etudiants/Etudiants.vue` (+ `components/EtudiantHeader.vue`, `components/EtudiantTab.vue`)
- **Objectif** : point d'entrée du référentiel étudiants, avec sous-écrans (onglets) pour lister, filtrer par classe, organiser en groupes, visualiser des statistiques et exporter.
- **Données affichées** : dépend de l'onglet actif (voir section 10). Dans `Etudiants.vue` lui-même : 2 étudiants mockés (`matricule, nom, prenom, email, telephone, classe, filiere`) chargés après un faux délai de 2 s — **jamais affichés à l'écran** (la variable `etudiants` n'est passée à aucun enfant).
- **Données modifiables** : aucune dans `Etudiants.vue` / `EtudiantTab.vue` eux-mêmes (délégué aux onglets).
- **Filtres disponibles** : aucun au niveau racine (délégués aux onglets).
- **Champs de recherche** : aucun au niveau racine.
- **Onglets disponibles** : Liste des étudiants, Classes (id `inscriptions`), Organisation, Statistiques, Exportations (+ un onglet « Import » présent dans le DOM mais **sans lien de déclenchement** — voir section 10).
- **Tableaux affichés** : délégués aux onglets.
- **Boutons disponibles** : Export (icône téléchargement, `console.log` seulement — aucun export réel), Imprimer (`window.print()`), « Générer un rapport » (ouvre modal `GenererRapportModal`).
- **Actions disponibles** : navigation par onglets, ouverture de la modal de génération de rapport.
- **Modals ou formulaires** : `GenerationRapport.vue` (voir section 8).
- **États visuels** : `SkeletonLoader` (type table, 5 lignes) pendant `loading` (2 s simulées) puis affichage des onglets.
- **Messages de succès / erreur** : aucun au niveau de cet écran racine (gérés dans les onglets/modal).
- **API utilisées** : aucune directement (le chargement est simulé par `setTimeout`).
- **Store utilisé** : aucun (le store `useEtudiantStore` est mentionné en commentaire mais non importé).
- **Composants enfants** : `EtudiantHeader.vue`, `EtudiantTab.vue`, `SkeletonLoader.vue`.
- **Remarques de reconstruction** : reconstruire avec un vrai store partagé entre les onglets (filtres/pagination communs), retirer la donnée `etudiants` morte de `Etudiants.vue`, ou la faire réellement consommer par `EtudiantsListContent`. Corriger le tab « Import » manquant dans la nav.

##### Écran : DetailEtudiant
- **Route** : `/etudiants/:id` (props: true)
- **Composant** : `src/views/etudiants/components/details/DetailEtudiant.vue`
- **Objectif** : afficher la fiche complète d'un étudiant (identité + informations professionnelles/académiques) en lecture seule.
- **Données affichées** : `nom, prenom, date_naissance, lieu_naissance, sexe, adresse, telephone, photourl, email, departement, unite_service, fonction, diplome, specialisation, grade` (issues de `getEtudiantById`).
- **Données modifiables** : aucune — tous les champs sont `readonly` (formulaire de consultation, pas d'édition ni de bouton Enregistrer).
- **Filtres disponibles** : aucun.
- **Champs de recherche** : aucun.
- **Onglets disponibles** : « Information personnel » (actif par défaut), « Fiche academique », « Tuteur », « Dossier complet » — ces deux derniers partagent le même `id="sales-tab"`/`href="#sales2"`, dupliqué (bug HTML : les onglets « Tuteur » et « Dossier complet » ne sont pas distincts fonctionnellement, ils pointent tous deux vers l'ancre `#sales2` inexistante — aucun panneau `id="sales2"` n'est défini dans le template).
- **Tableaux affichés** : aucun (formulaire de champs, pas de tableau).
- **Colonnes importantes** : n/a.
- **Boutons disponibles** : Imprimer (icône, lien `href="#"`, pas d'action câblée), Télécharger (icône, lien `href="#"`, pas d'action câblée), « ⬅ Retour » (`router-link` vers `/etudiants`).
- **Actions disponibles** : retour à la liste ; aucune action d'édition/suppression.
- **Modals ou formulaires** : aucun.
- **États visuels** : `SkeletonLoader` (type table, 3 lignes) pendant `loading`.
- **Messages de succès / erreur** : erreur loguée en `console.error` uniquement (`Erreur lors du chargement des détails :`), aucun toast utilisateur.
- **API utilisées** : `getEtudiantById(id)` (`GET /etudiants/:id`).
- **Store utilisé** : aucun (appel API direct, pas de store).
- **Composants enfants** : `SkeletonLoader.vue`.
- **Remarques de reconstruction** : corriger la duplication d'`id` sur les onglets Tuteur/Dossier complet ; rendre les boutons Imprimer/Télécharger fonctionnels ou les retirer ; ajouter des messages d'erreur visibles (toast) ; les champs « Email Professionnel/Départements/Unité de service/Fonction/Diplôme/Grade » suggèrent un template réutilisé d'un module RH/personnel — à valider avec le métier si ces champs sont pertinents pour un étudiant.

##### Écran : DossierView (registre des dossiers scolaires)
- **Route** : `/dossiers-scolaires`
- **Composant** : `src/views/parcours/DossierView.vue` (+ `components/HeaderView.vue`)
- **Objectif** : rechercher/filtrer les étudiants et accéder à leur dossier académique détaillé.
- **Données affichées** : liste **mockée** de 3 étudiants (`matricule, nom, prenom, email, annee, filiere, niveau, classe`).
- **Données modifiables** : aucune.
- **Filtres disponibles** : Année, Filière, Niveau, Classe — toutes les options de listes déroulantes sont des tableaux **codés en dur** (`annees`, `filieres`, `niveaux`, `classes`), non issus d'un store/API.
- **Champs de recherche** : aucun champ texte libre (uniquement des selects).
- **Onglets disponibles** : aucun sur cet écran.
- **Tableaux affichés** : « Registre des étudiants » — colonnes Matricule, Nom & Prénoms (+ email), Filière, Niveau & Classe, Actions.
- **Colonnes importantes** : Matricule (lien visuel primaire), Actions → bouton « Détails ».
- **Boutons disponibles** : `RouterLink` « Détails » par ligne vers `/dossiers-scolaires/:id/global-informations`.
- **Actions disponibles** : filtrage client-side (computed), navigation vers le dossier détaillé.
- **Modals ou formulaires** : aucun.
- **États visuels** : ligne vide « Aucun étudiant ne correspond aux critères sélectionnés » si liste filtrée vide. Pas de skeleton/loading (données synchrones mockées).
- **Messages de succès / erreur** : aucun.
- **API utilisées** : aucune (toutes les données sont statiques dans le composant).
- **Store utilisé** : aucun.
- **Composants enfants** : `HeaderView.vue` (en-tête générique avec boutons Export/Imprimer non fonctionnels + bouton « Générer un rapport » pointant vers une modal `#addEtudiantModal` qui **n'existe pas** dans ce composant — cible de modal absente).
- **Remarques de reconstruction** : brancher sur un vrai store étudiants/filières/classes/années ; le bouton « Générer un rapport » de `HeaderView.vue` cible `data-bs-target="#addEtudiantModal"`, un id de modal non défini nulle part dans ce fichier — à corriger ou retirer.

##### Écran : DossierAcademique (dossier détaillé d'un étudiant)
- **Route** : `/dossiers-scolaires/:id/global-informations`
- **Composant** : `src/views/parcours/DossierAcademique.vue` (+ `components/tabs/ParcourTab.vue` et ses 5 sous-onglets)
- **Objectif** : vue à 360° du dossier scolaire d'un étudiant (identité, parcours/notes, assiduité/discipline, finances, documents).
- **Données affichées** : nom/matricule/classe/filière de l'étudiant (mock, `setTimeout` 800 ms, pas d'appel API réel) en en-tête ; le détail par onglet est décrit en section 10 et 13.
- **Données modifiables** : « Observation Générale » (textarea comportement, bouton Enregistrer non câblé à une API) dans l'onglet Assiduité ; upload de documents dans l'onglet Documents (zone drag&drop, non câblée) ; aucune sauvegarde persistée nulle part dans ce module.
- **Filtres disponibles** : aucun filtre global sur cet écran (les filtres sont dans `DossierView.vue` en amont) ; l'onglet Documents a un filtre par catégorie (liste de boutons).
- **Champs de recherche** : un champ recherche dans l'onglet Documents (non câblé au filtrage réel, juste visuel).
- **Onglets disponibles** : Profil & Informations, Parcours & Notes, Assiduité & Discipline, Situation Financière, Documents & Archives.
- **Tableaux affichés** : Tuteurs/contacts d'urgence (onglet Profil), matières/notes par année (onglet Parcours), registre des absences/retards (onglet Assiduité), historique des versements (onglet Finance), documents archivés (onglet Documents).
- **Colonnes importantes** : voir section 9.
- **Boutons disponibles** : Retour (`router.back()`), Imprimer le dossier (`window.print()`), + boutons spécifiques par onglet (voir section 7).
- **Actions disponibles** : navigation par onglet, impression, ajout de documents (visuel uniquement), sélection d'une année dans la frise du Parcours pour changer le détail affiché.
- **Modals ou formulaires** : aucune modal Bootstrap ; formulaire d'observation (textarea) non persistant.
- **États visuels** : `SkeletonLoader` (type table, 3 lignes) pendant `loading` (800 ms simulés) ; spinner sur le bouton Imprimer pendant l'« export ».
- **Messages de succès / erreur** : aucun toast ; erreurs seulement `console.error`.
- **API utilisées** : **aucune** — tout est simulé/mocké (`setTimeout`).
- **Store utilisé** : aucun.
- **Composants enfants** : `ParcourTab.vue`, `ProfilEtudiant.vue`, `ParcoursAcademique.vue`, `AssiduiteDiscipline.vue`, `SituationFinanciere.vue`, `DocumentsArchives.vue`, `SkeletonLoader.vue` (import commenté, `@/components/SkeletonLoader.vue` non explicitement importé dans ce fichier — **à vérifier, risque de composant non résolu**).
- **Remarques de reconstruction** : c'est l'écran le plus riche fonctionnellement mais **entièrement simulé** ; il faut créer les endpoints backend (profil, historique de notes par année, absences/sanctions, paiements/échéancier, documents) et un store dédié `dossierAcademiqueStore` consommant `getParcoursAcademique(id)` (déjà disponible côté API/store `etudiantStore.fetchParcours`) plus des endpoints Finance/Documents/Assiduité à créer.

##### Écran : AbscenceView (Absences & Présences)
- **Route** : `/absences`
- **Composant** : `src/views/absence/AbscenceView.vue`
- **Objectif** : permettre la saisie quotidienne de la feuille d'émargement (présence/retard/absence) par classe, cours et créneau.
- **Données affichées** : liste **mockée** de 4 étudiants (`matricule, nom, prenom, statut, commentaire`) affichée uniquement après sélection Classe + Cours.
- **Données modifiables** : le statut de présence par étudiant (radio Présent/Retard/Absent) et le commentaire/justificatif (actif seulement si Retard ou Absent).
- **Filtres disponibles** : Date du jour (input date, valeur par défaut = aujourd'hui), Classe/Niveau (liste codée en dur), Cours/Enseignement (liste codée en dur, select désactivé tant qu'aucune classe n'est choisie), Créneau horaire (4 créneaux fixes M1/M2/A1/A2).
- **Champs de recherche** : aucun.
- **Onglets disponibles** : aucun (écran mono-vue).
- **Tableaux affichés** : « Fiche d'Émargement numérique » — colonnes Matricule, Nom & Prénoms, Statut de présence (3 boutons radio groupés), Justificatif/Note.
- **Colonnes importantes** : Statut de présence (obligatoire, radio group par étudiant).
- **Boutons disponibles** : « Rapport Mensuel » (en-tête, non câblé), « Tout cocher Présent » (met tous les statuts à `present`), « Enregistrer l'émargement » (bouton principal, avec spinner pendant `saving`).
- **Actions disponibles** : sélection classe/cours/créneau, saisie de présence, sauvegarde de la feuille d'appel.
- **Modals ou formulaires** : le tableau d'émargement lui-même fait office de formulaire.
- **États visuels** : message centré « Veuillez sélectionner une classe et un cours... » tant que `selectedClasse`/`selectedCours` ne sont pas renseignés ; spinner sur le bouton de validation pendant `saving`.
- **Messages de succès / erreur** : `alert("Fiche d'émergement enregistrée avec succès !")` (faute de frappe « émergement » au lieu de « émargement » présente dans le code) — pas de toast, pas de gestion d'erreur (aucun `catch`).
- **API utilisées** : **aucune** — la fonction `validerFeuilleAppel` construit un payload puis simule l'envoi via `setTimeout` (1 s) et un simple `console.log`.
- **Store utilisé** : aucun.
- **Composants enfants** : aucun composant externe (tout est inline dans `AbscenceView.vue`).
- **Remarques de reconstruction** : créer un vrai endpoint de sauvegarde des feuilles d'émargement (`POST /absences` par ex.), un store `absenceStore` avec chargement dynamique des classes/cours/étudiants réels (actuellement 100 % statique), remplacer les `alert()` par le système de notification (`useNotifier`) déjà utilisé ailleurs dans le module, gérer les erreurs réseau.

#### 7. Boutons et actions

| Bouton / Action | Écran | Élément déclencheur | Effet réel constaté dans le code | Câblé à une API ? |
|---|---|---|---|---|
| Export (icône download) | Etudiants (header) | `EtudiantHeader.vue` | `console.log('Export des étudiants')` | Non |
| Imprimer | Etudiants (header) | `EtudiantHeader.vue` | `window.print()` | Non (natif navigateur) |
| Générer un rapport | Etudiants (header) | `EtudiantHeader.vue` → modal `#genererRapportModal` | Ouvre `GenerationRapport.vue`, simule un délai (1.8s) puis notifie succès | Simulé (`await new Promise(setTimeout)`), pas d'appel réseau réel |
| Exporter Excel / PDF | EtudiantsClassesContent | Boutons `.btn-outline-dark` | `exportExcel(...)` / `exportPDF(...)` via utilitaires `@/utils/exportExcel`, `@/utils/exportPDF` | Oui, génération locale (pas d'appel serveur), données issues du store `etudiantStore.filteredEtudiants` (voir remarque bug section 15) |
| Exporter (dropdown PDF/CSV/Excel/Imprimer) | EtudiantsListContent | Dropdown Bootstrap | 4 handlers locaux (`exportStudentsPDF`, `exportCSV`, `exportStudentsExcel`, `printTable`) opérant sur les 20 étudiants mockés en dur | Non (données 100% locales) |
| Détails / Modifier / Supprimer | EtudiantsListContent | `ItemActions.vue` (dropdown par ligne) | Détails → navigation `RouterLink` vers `/etudiants/:id` ; Modifier → émet `edit` (console.log) + ouvre modal `#editEtudiantModal` (**modal cible non définie dans le fichier**) ; Supprimer → `confirm()` puis suppression locale (`etudiants.value = etudiants.value.filter(...)`) | Non (suppression uniquement en mémoire, aucun appel API) |
| Nouveau Groupe | OrganisationEtudiantsContent | Bouton header | `creerGroupe()` référencé dans le template mais **fonction non définie dans le `<script setup>`** (bug : `ReferenceError` probable si cliqué) | Non |
| Assigner (dropdown par étudiant) | OrganisationEtudiantsContent | Dropdown | `ajouterAuGroupe(e, g.id)` — affecte le **premier étudiant filtré** (`filteredEtudiants.value[0]`) au groupe cliqué, indépendamment de la ligne cliquée (bug logique) | Non |
| Retirer du groupe (icône ×) | OrganisationEtudiantsContent | Bouton icône | `retirerDuGroupe(etudiantId, groupeId)` — retire l'affectation en mémoire | Non |
| Dissoudre le groupe | OrganisationEtudiantsContent | Item dropdown | Lien `href="#"` sans handler | Non |
| Export Excel / PDF / CSV | ExportEtudiantsContent | 3 cartes cliquables | Génère un fichier local via `xlsx`/`jsPDF` sur 3 étudiants mockés | Non |
| Export Excel (filtres) | data-io/ExportData.vue | Bouton « Export » | Appelle `getEtudiantsByClasseFiliereAnnee` puis exporte en Excel — **`XLSX` non importé dans ce fichier** (bug : `ReferenceError: XLSX is not defined` si exécuté) | Oui pour le fetch (API réelle), mais export cassé |
| Générer un rapport (Registre) | DossierView (HeaderView) | Bouton | Cible `data-bs-target="#addEtudiantModal"`, **modal inexistante** dans ce fichier | Non |
| Retour | DossierAcademique | Bouton | `router.back()` | Non |
| Imprimer le dossier | DossierAcademique | Bouton | `window.print()` (avec spinner `isExporting`) | Non |
| Signaler une absence | AssiduiteDiscipline | Bouton header tableau | Aucun handler (`@click` absent, simple bouton visuel) | Non |
| Ajouter (justification) | AssiduiteDiscipline | Bouton par ligne (si non justifiée) | Aucun handler câblé | Non |
| Enregistrer l'observation | AssiduiteDiscipline | Bouton | Aucun handler câblé | Non |
| Bulletin / Relevé | ParcoursAcademique | Boutons | Aucun handler câblé | Non |
| Parcourir (upload document) | DocumentsArchives | Bouton | `<input type="file" ref="fileInput">` présent mais bouton sans `@click` pour déclencher l'input (pas de `triggerFileInput`) | Non |
| Prévisualiser / Télécharger / Supprimer (document) | DocumentsArchives | Boutons par ligne | Aucun handler câblé | Non |
| Nouveau Reçu | SituationFinanciere | Bouton | Aucun handler câblé | Non |
| Rapport Mensuel | AbscenceView | Bouton header | Aucun handler câblé | Non |
| Tout cocher « Présent » | AbscenceView | Bouton | `markAllAsPresent()` — met tous les `etudiant.statut` à `present` | Non (local) |
| Enregistrer l'émargement | AbscenceView | Bouton submit | `validerFeuilleAppel()` — construit un payload et simule l'envoi (`setTimeout`) puis `alert()` | Non (simulé) |
| Voir Dossier (ListEtudiants – tabs/parcours) | ListEtudiants.vue | Bouton par ligne + clic ligne | `voirDossier(id)` → `console.log` uniquement, navigation commentée (`// router.push(...)`) | Non |
| Modifier / Fermer (modal détails générique) | `details/ItemDetails.vue` (fichier `etudiants/components/details/ItemDetails.vue`, **non utilisé dans le module Scolarité**) | Boutons modal | Émet `edit` / ferme la modal locale | Non applicable (fichier orphelin dans ce module) |

#### 8. Formulaires

| Formulaire | Écran / Composant | Champs | Validation | Payload / Comportement soumission | Erreurs gérées | Succès |
|---|---|---|---|---|---|---|
| Générer un Rapport Étudiant | `Modal/GenerationRapport.vue` | Nature du document (select requis : LISTE_EMARGEMENT, LISTE_ALPHABETIQUE, STATISTIQUES, TROMBINOSCOPE), Année académique (requis, alimenté par `useAnneeStore`), Filière (optionnel, `useFiliereStore`), Classe (optionnel, dépend de la filière, `useClasseStore`), Inclure les photos (checkbox), Masquer suspendus/abandonnés (checkbox), Format (radio PDF/EXCEL) | `type_rapport` et `annee_id` obligatoires (message inline si manquants) | `{ type_rapport, annee_id, filiere_id, classe_id, inclure_photos, exclure_suspendus, format }` — **simulé** via `await new Promise(setTimeout, 1800ms)`, aucun appel réseau réel | `errorMessage` affiché en alert Bootstrap dans la modal + `notifyError` (store messages) | `notifySuccess('Rapport généré et téléchargé avec succès.')`, fermeture de la modal Bootstrap, réinitialisation du formulaire (conserve l'année sélectionnée) |
| Import de liste d'étudiants (modal) | `ImportList.vue` (racine `views/etudiants/`, **non référencé/importé nulle part** — orphelin) | Fichier `.xlsx`/`.csv` (drag&drop ou input) | Vérifie le `type` MIME du fichier (xlsx/csv/xls), sinon `alert('Fichier non supporté...')` | Parse en local avec `XLSX.read` → prévisualisation des 10 premières lignes ; à la validation, `emit('import-complete', previewData.value)` puis `alert('Importation confirmée !')` — **aucun appel API**, les données ne sont jamais envoyées à un backend | `alert()` si type de fichier invalide | `alert('Importation confirmée !')` puis réinitialisation locale |
| Import (Tab « Import ») | `Tab/ImportEtudiantsContent.vue` | — | — | **Fichier vide** : `<template></template><script setup></script>` — aucun champ, aucune logique | N/A | N/A |
| Import (Drag&Drop) | `data-io/DropData.vue` | Zone drag&drop multi-fichiers `.csv/.xlsx`, liste des fichiers chargés avec suppression individuelle | Filtrage par type MIME/extension à l'ajout (`processFiles`) | Bouton « Upload » présent mais **sans `@click`/handler** — aucun envoi réel, les fichiers restent en mémoire côté client uniquement | Aucune | Aucune (pas de retour utilisateur) |
| Export (dropdown filtré) | `data-io/ExportData.vue` | Filière (select, `useFiliereStore`), Classe (select, `useClasseStore`, dépend filière), Année académique (select, `useAnneeStore`), Type d'export (select excel/csv/pdf) | Aucune validation explicite (pas de required) | `exportToExcel()` appelle `XLSX.utils.json_to_sheet` sur `etudiants` — **`XLSX` n'est pas importé** dans ce fichier → erreur JS à l'exécution ; `fetchFilteredEtudiants` appelle réellement `getEtudiantsByClasseFiliereAnnee(classe, filiere, annee)` en `watch` sur les 3 filtres | `alert("Une erreur est survenue lors de l'export")` (catch générique) ; `alert('Aucune donnée à exporter.')` si liste vide | Aucun message de succès explicite (le fichier est juste téléchargé si le code ne plante pas avant) |
| Fiche d'émargement | `AbscenceView.vue` | Date, Classe, Cours, Créneau (filtres) + par étudiant : statut (radio present/retard/absent), commentaire (texte, activé seulement si retard/absent) | Aucune validation formelle (le formulaire peut être soumis même sans commentaire pour un absent) | `{ date, classe, cours, creneau, registre: [{ student_id, statut, commentaire }] }` — **simulé**, `console.log` + `setTimeout` 1s | Aucun `catch`/gestion d'erreur | `alert("Fiche d'émergement enregistrée avec succès !")` |
| Fiche d'information étudiant (`details/sample.vue`, **orphelin, non utilisé**) | `etudiants/components/details/sample.vue` | Matricule, Nom, Prénom, Date/Lieu de naissance, Téléphone, Ville, Photo (upload), Année académique, Cycle, Filière, Niveau, Classe | Aucune (champs non liés à un `v-model`, purement visuel) | `handleSubmit()` → `console.log('Formulaire soumis')` uniquement | Aucune | Aucune |
| Profil Étudiant (dossier) | `parcours/components/tabs/ProfilEtudiant.vue` | Lecture seule (pas de formulaire éditable) sauf bouton « Modifier la photo » sans handler | N/A | N/A | N/A | N/A |

#### 9. Tableaux et tables de navigation

| Tableau | Écran | Colonnes | Source des données | API ou Simulé |
|---|---|---|---|---|
| Répertoire des Étudiants | EtudiantsListContent (onglet Liste) | #, Étudiant (avatar+nom), Matricule, Genre, Parcours Académique (classe/filière), Année, Actions | `etudiants` — tableau **codé en dur** de 20 étudiants | Simulé (aucune donnée sexe/annee_academique renseignée → colonnes Genre/Année vides pour tous) |
| Étudiants par classes | EtudiantsClassesContent (onglet Classes) | #, Matricule, Nom, Prénom, Sexe, Année académique, Filière, Classe | `etudiantStore.filteredEtudiants` (store `useEtudiantStore`) | **API en théorie** via `fetchEtudiantsByClasseFiliereAnnee`, mais cette action **n'existe pas** dans `etudiantStore.js` réel (voir section 15) — tableau non fonctionnel en l'état |
| Vivier d'étudiants disponibles | OrganisationEtudiantsContent | Avatar, Nom/Prénom, Matricule, Classe, bouton Assigner | `etudiants` local, chargé après `setTimeout` 2s avec 3 étudiants en dur | Simulé |
| Organisation par groupes | OrganisationEtudiantsContent | Carte par groupe listant les étudiants affectés | `groupes` (3 groupes codés en dur) + `affectations` (état local en mémoire) | Simulé |
| Registre des étudiants | DossierView | Matricule, Nom & Prénoms, Filière, Niveau & Classe, Actions | `etudiants` local, 3 lignes codées en dur | Simulé |
| Répertoire des Étudiants (ListEtudiants, tabs/parcours) | `parcours/components/tabs/ListEtudiants.vue` (non monté dans les routes actuelles — fait partie de `ParcourTab` non, en fait ce fichier n'est importé par aucun parent constaté) | Étudiant, Classe, Moyenne, Paiement (barre progression), Statut, Action | 3 étudiants codés en dur | Simulé |
| Historique des Années (frise) | ParcoursAcademique (dossier) | Période, Classe, Résultat, Moyenne | `historique`, 3 entrées codées en dur | Simulé |
| Résultats détaillés (matières) | ParcoursAcademique (dossier) | Matière, Crédits, Note CC, Note Exam, Moyenne, Statut | `anneeSelectionnee.matieres` (sous-ensemble de `historique`) | Simulé |
| Registre des Absences & Retards | AssiduiteDiscipline (dossier) | Date & Heure, Type, Matière, Statut (justifié icône), Justification | `absences`, 4 lignes codées en dur | Simulé |
| Mesures Disciplinaires (timeline) | AssiduiteDiscipline (dossier) | Type, Date, Motif, Décision | `sanctions`, 2 lignes codées en dur | Simulé |
| Historique des Versements | SituationFinanciere (dossier) | N° Reçu, Date, Désignation, Montant, Mode | `paiements`, 3 lignes codées en dur | Simulé |
| Échéancier de Paiement | SituationFinanciere (dossier) | Mois, Date limite, Statut, Montant | `echeancier`, 4 lignes codées en dur | Simulé |
| Documents archivés | DocumentsArchives (dossier) | Nom du fichier, Type, Date d'ajout, Taille, Actions | `documents`, 5 lignes codées en dur | Simulé |
| Fiche d'Émargement numérique | AbscenceView | Matricule, Nom & Prénoms, Statut de présence (radio), Justificatif/Note | `etudiantsList`, 4 lignes codées en dur | Simulé |
| Prévisualisation import | `ImportList.vue` (orphelin) | Colonnes dynamiques selon fichier importé (10 premières lignes) | Fichier utilisateur (`XLSX.read`) | Local (parsing client, pas d'envoi API) |

#### 10. Onglets

| Onglet | Écran parent | Composant | Contenu |
|---|---|---|---|
| Liste des étudiants | `/etudiants` (`EtudiantTab.vue`) | `Tab/EtudiantsListContent.vue` | Répertoire complet, recherche, filtres filière/sexe, export |
| Classes (libellé « Classes », id HTML `inscriptions`) | `/etudiants` | `Tab/EtudiantsClassesContent.vue` | Filtrage cascadé Année→Filière→Classe, tableau, stats Hommes/Femmes |
| Organisation | `/etudiants` | `Tab/OrganisationEtudiantsContent.vue` | Affectation d'étudiants à des groupes pédagogiques |
| Statistiques | `/etudiants` | `Tab/StatistiquesEtudiantsContent.vue` | 3 cartes KPI (Effectif, Filières, Classes) + 2 graphiques Chart.js (répartition filière / année) |
| Exportations | `/etudiants` | `Tab/ExportEtudiantsContent.vue` | Filtres (année/filière/niveau/classe codés en dur) + 3 cartes d'export (Excel/PDF/CSV) |
| **Import** (déclaré dans le DOM mais **aucun onglet de navigation ne le déclenche** — `<li>` manquant dans la liste `nav-tabs`) | `/etudiants` | `Tab/ImportEtudiantsContent.vue` | Fichier vide, aucun contenu |
| Information personnel | `/etudiants/:id` | inline dans `DetailEtudiant.vue` | Identité, photo, contact |
| Fiche academique | `/etudiants/:id` | inline dans `DetailEtudiant.vue` | Champs orientés « personnel » (email pro, département, fonction, diplôme, grade) |
| Tuteur | `/etudiants/:id` | inline (bug : même ancre `#sales2` que l'onglet suivant, panneau cible inexistant) | Non implémenté (pas de panneau) |
| Dossier complet | `/etudiants/:id` | inline (même bug) | Non implémenté (pas de panneau) |
| Profil & Informations | `/dossiers-scolaires/:id/global-informations` (`ParcourTab.vue`) | `ProfilEtudiant.vue` | État civil, coordonnées, inscription actuelle, tuteurs |
| Parcours & Notes | idem | `ParcoursAcademique.vue` | Frise historique + détail des notes par année |
| Assiduité & Discipline | idem | `AssiduiteDiscipline.vue` | Registre absences/retards + sanctions disciplinaires |
| Situation Financière | idem | `SituationFinanciere.vue` | Soldes, historique versements, échéancier |
| Documents & Archives | idem | `DocumentsArchives.vue` | Upload + liste documents par catégorie |

#### 11. Workflow métier complet

**WF-SCOLARITE-01 — Consultation de la liste des étudiants et navigation vers un dossier**
1. L'utilisateur ouvre `/etudiants` depuis le menu « Scolarité » → « Gestion des étudiants ».
2. La page affiche un skeleton loader 2 s (simulation), puis l'onglet « Liste des étudiants » actif par défaut avec 20 étudiants mockés.
3. L'utilisateur peut filtrer par nom/matricule (recherche texte), filière ou genre, ou changer d'onglet (Classes, Organisation, Statistiques, Exportations).
4. Clic sur « Détails » (menu déroulant Actions d'une ligne) → navigation `RouterLink` vers `/etudiants/:id`.
5. `DetailEtudiant.vue` appelle `getEtudiantById(id)` et affiche la fiche en lecture seule.
6. Retour possible via le bouton « ⬅ Retour ».

**WF-SCOLARITE-02 — Génération d'un rapport étudiant (simulé)**
1. Depuis `/etudiants`, clic sur « Générer un rapport » → ouverture de la modal `GenerationRapport.vue`.
2. Chargement des listes Année/Filière/Classe via les stores `anneeStore`, `filiereStore`, `classeStore` (appels API réels).
3. L'utilisateur choisit un type de rapport (obligatoire), une année (obligatoire, pré-sélectionnée sur l'année active), filière/classe (optionnels, cascade filière→classe), options d'affichage (photos, exclure suspendus), format (PDF/Excel).
4. Soumission → validation front (type + année requis) → **simulation** d'un traitement serveur de 1.8 s → notification de succès → fermeture modal → réinitialisation du formulaire. **Aucun fichier n'est réellement généré ni téléchargé.**

**WF-SCOLARITE-03 — Consultation d'un dossier scolaire complet**
1. L'utilisateur ouvre `/dossiers-scolaires` (« Dossiers scolaires » dans le menu).
2. Filtre (année/filière/niveau/classe, options codées en dur) sur une liste mockée de 3 étudiants.
3. Clic sur « Détails » → navigation vers `/dossiers-scolaires/:id/global-informations`.
4. `DossierAcademique.vue` simule le chargement de l'étudiant (800 ms) puis affiche 5 onglets (Profil, Parcours, Assiduité, Finance, Documents), chacun avec ses données mockées propres.
5. L'utilisateur peut naviguer entre les onglets, consulter l'historique par année (frise cliquable dans « Parcours & Notes »), et cliquer sur « Imprimer le dossier » (`window.print()`).

**WF-SCOLARITE-04 — Prise de présence journalière (émargement)**
1. L'utilisateur ouvre `/absences` (« Absences & Présences »).
2. Il sélectionne une date (par défaut aujourd'hui), une classe, un cours (activé seulement après choix de la classe) et un créneau horaire.
3. Dès que Classe + Cours sont renseignés, la fiche d'émargement s'affiche avec 4 étudiants mockés, tous « Présent » par défaut sauf un.
4. L'utilisateur ajuste le statut de chacun (Présent/Retard/Absent, boutons radio) et, si Retard/Absent, peut saisir un commentaire/justificatif.
5. Bouton « Tout cocher Présent » disponible pour réinitialiser rapidement.
6. Clic sur « Enregistrer l'émargement » → payload construit → **simulation réseau** (`setTimeout` 1s) → `alert()` de confirmation. Aucune donnée n'est persistée côté backend dans l'état actuel du code.

**WF-SCOLARITE-05 — Import d'une liste d'étudiants (fonctionnalité non opérationnelle)**
1. Le composant `ImportList.vue` existe (drag&drop / sélection fichier `.xlsx`/`.csv`, parsing via `XLSX.read`, prévisualisation des 10 premières lignes) mais **n'est référencé par aucune vue ni route active** dans le module (recherche exhaustive négative).
2. Le composant `data-io/DropData.vue` (zone d'upload multi-fichiers avec liste de fichiers chargés) existe également mais n'est monté nulle part et son bouton « Upload » n'a pas de handler.
3. Le tab prévu pour l'import dans `EtudiantTab.vue` (`Tab/ImportEtudiantsContent.vue`) est un fichier vide et n'a pas de déclencheur de navigation dans la barre d'onglets.
4. **Conclusion** : l'import d'étudiants n'est pas fonctionnel dans l'état actuel du code ; c'est un flux à reconstruire entièrement (UI présente en partie, logique backend absente).

#### 12. Cas d'utilisation

- **UC-SCOLARITE-01** : En tant qu'agent de scolarité, je consulte la liste des étudiants inscrits, je peux la filtrer par filière/genre/matricule et exporter une sélection (PDF/Excel/CSV — export local, non lié à un moteur serveur).
- **UC-SCOLARITE-02** : En tant qu'agent de scolarité, je consulte la fiche détaillée d'un étudiant (identité + informations académiques/professionnelles) à partir de son identifiant.
- **UC-SCOLARITE-03** : En tant qu'agent de scolarité, je filtre les étudiants par classe (année+filière+classe en cascade) pour produire une liste de classe imprimable/exportable — **actuellement non fonctionnel** car le store cible (`fetchEtudiantsByClasseFiliereAnnee`, `filteredEtudiants`) n'existe pas dans `etudiantStore.js`.
- **UC-SCOLARITE-04** : En tant qu'agent de scolarité, j'organise les étudiants en groupes pédagogiques/projets (affectation manuelle par glisser visuel simplifié via menu déroulant) — fonctionnel uniquement en mémoire (aucune persistance).
- **UC-SCOLARITE-05** : En tant que responsable pédagogique, je consulte des statistiques (effectif global, filières actives, groupes/classes, répartition par filière/année) sur un jeu de données mocké.
- **UC-SCOLARITE-06** : En tant qu'agent de scolarité, je génère un rapport (fiche d'émargement, liste alphabétique, statistiques, trombinoscope) filtré par année/filière/classe, au format PDF ou Excel — **simulé**, aucun fichier réellement produit.
- **UC-SCOLARITE-07** : En tant qu'agent de scolarité, je recherche un étudiant dans le registre des dossiers scolaires et j'accède à son dossier académique complet (profil, parcours/notes, assiduité, finances, documents).
- **UC-SCOLARITE-08** : En tant qu'enseignant/surveillant, je saisis la feuille de présence d'une session de cours (classe + cours + créneau) et j'enregistre les statuts Présent/Retard/Absent avec justificatif — **simulé**, non persisté en base.
- **UC-SCOLARITE-09** : En tant qu'agent de scolarité, j'importe une liste d'étudiants depuis un fichier Excel/CSV — **fonctionnalité UI ébauchée mais non intégrée** (composants orphelins, aucune route/tab ne les expose).

#### 13. Données manipulées

| Entité | Champs visibles dans le code | Origine |
|---|---|---|
| **Étudiant** (liste/détail) | `id, matricule, nom, prenom, sexe, email, telephone, classe, filiere, niveau, annee_academique, date_naissance, lieu_naissance, adresse, photourl` | Mock (plupart des écrans) ou API réelle (`DetailEtudiant.vue` via `getEtudiantById`) |
| **Étudiant — champs « professionnels »** (onglet Fiche académique de DetailEtudiant) | `departement, unite_service, fonction, diplome, specialisation, grade` | API (`getEtudiantById`) — modèle probablement partagé avec un module RH/personnel |
| **Tuteur** | `nom_complet, lien, telephone, email` (ProfilEtudiant.vue) ; côté API : payload `addTuteurToEtudiant(etudiantId, data)` (structure de `data` non détaillée dans le code) | Mock (affichage) / API définie mais non appelée depuis une UI du module |
| **Groupe pédagogique** | `id, nom` | Mock (`OrganisationEtudiantsContent.vue`) |
| **Historique académique (Parcours)** | `periode, classe, resultat, moyenne, matieres[{nom, code, credits, cc, exam, moyenne}]` | Mock (`ParcoursAcademique.vue`) |
| **Absence / Retard (dossier)** | `date, creneau, type (Absence/Retard), matiere, justifie (bool), motif` | Mock (`AssiduiteDiscipline.vue`) |
| **Sanction disciplinaire** | `date, type, motif, decision` | Mock (`AssiduiteDiscipline.vue`) |
| **Paiement / Versement** | `numero, date, libelle, montant, methode` | Mock (`SituationFinanciere.vue`) |
| **Échéance de paiement** | `mois, dateLimite, montant, statut (Payé/Partiel/En attente)` | Mock (`SituationFinanciere.vue`) |
| **Document archivé** | `nom, categorie, format, date, taille` | Mock (`DocumentsArchives.vue`) |
| **Présence (émargement)** | `student_id, statut (present/retard/absent), commentaire` + en-tête `date, classe, cours, creneau` | Mock (`AbscenceView.vue`) |
| **Rapport (génération)** | `type_rapport, annee_id, filiere_id, classe_id, inclure_photos, exclure_suspendus, format` | Formulaire réel (`GenerationRapport.vue`), traitement simulé |

#### 14. API et intégration backend

Fichier source : `src/api/academique/etudiantApi.js` (client `academiqueApi`, via `buildService`).

| Fonction API | Méthode / Endpoint | Utilisée par | Statut |
|---|---|---|---|
| `createEtudiant(data)` | `POST /etudiants` | `etudiantStore.addEtudiant(data)` | Définie côté store, **aucun formulaire de création d'étudiant trouvé dans les vues lues** (aucun composant n'appelle `addEtudiant`) |
| `addTuteurToEtudiant(etudiantId, data)` | `POST /etudiants/:id/tuteurs` | `etudiantStore.addTuteur(...)` | Définie côté store, **aucune UI ne l'appelle** dans les fichiers lus |
| `uploadPhotoEtudiant(etudiantId, file)` | `POST /etudiants/:id/photo` (multipart/form-data) | `etudiantStore.uploadPhoto(...)` | Définie côté store, **aucune UI ne l'appelle** (le bouton « Modifier la photo » de `ProfilEtudiant.vue` n'a pas de handler) |
| `getEtudiantById(id)` | `GET /etudiants/:id` | `DetailEtudiant.vue` (onMounted) | **Réellement utilisée** |
| `getEtudiantsByClasseFiliereAnnee(classeId, filiereId, anneeId)` | `GET /etudiants?classeId&filiereId&anneeId` | `data-io/ExportData.vue` (orphelin) ; référencée en intention par `EtudiantsClassesContent.vue` via `etudiantStore.fetchEtudiantsByClasseFiliereAnnee` — **action absente du store réel** | Partiellement utilisée (un seul appelant réel, orphelin) |
| `getParcoursAcademique(id)` | `GET /etudiants/:id/parcours` | `etudiantStore.fetchParcours(id)` | Définie côté store et action existante, **mais aucune vue du module n'appelle `fetchParcours`** dans les fichiers lus (DossierAcademique.vue simule ses données au lieu d'appeler le store) |

Toutes les autres données affichées dans le module (dossiers scolaires, absences, statistiques, organisation, exports) sont **mockées en dur dans les composants** (`ref([...])` ou `setTimeout`) — **aucun appel réseau réel** ne les alimente. Le module dispose donc d'une API backend partiellement définie (`etudiantApi.js`) mais très largement sous-exploitée par les vues actuelles.

#### 15. Règles métier détectées

- **RM-SCOLARITE-01** — Un rapport (`GenerationRapport.vue`) ne peut être généré sans un type de rapport et une année académique renseignés (validation front bloquante avec message d'erreur).
- **RM-SCOLARITE-02** — Le champ « Commentaire / Justificatif » de la fiche d'émargement (`AbscenceView.vue`) n'est activable que si le statut de l'étudiant est « Retard » ou « Absent » (`:disabled="etudiant.statut !== 'absent' && etudiant.statut !== 'retard'"`).
- **RM-SCOLARITE-03** — Le sélecteur de classe dépend systématiquement d'une filière sélectionnée au préalable (cascade Filière → Classe), observé dans `EtudiantsClassesContent.vue`, `GenerationRapport.vue`, `data-io/ExportData.vue` : le select Classe est `disabled` tant que la Filière n'est pas choisie et se réinitialise (`selectedClasse = ''`) à chaque changement de filière.
- **RM-SCOLARITE-04** — Le sélecteur de cours dans `AbscenceView.vue` est désactivé tant qu'aucune classe n'est sélectionnée.
- **RM-SCOLARITE-05** — La fiche d'émargement (tableau de présence) ne s'affiche que si à la fois une classe **et** un cours ont été sélectionnés (`v-if="selectedClasse && selectedCours"`).
- **RM-SCOLARITE-06** — Dans `GenerationRapport.vue`, l'année académique active (`est_active`) est présélectionnée automatiquement à l'ouverture du formulaire.
- **RM-SCOLARITE-07** (bug/incohérence, à confirmer) — Le store `useEtudiantStore` réel (`src/stores/etudiants/etudiantStore.js`) n'expose ni un état `filteredEtudiants` ni une action `fetchEtudiantsByClasseFiliereAnnee`, alors que `EtudiantsClassesContent.vue` et `Tab/sample.vue` les utilisent explicitement (`etudiantStore.filteredEtudiants`, `etudiantStore.fetchEtudiantsByClasseFiliereAnnee(...)`). En l'état, l'onglet « Classes » de `/etudiants` est non fonctionnel (erreur silencieuse : `filteredEtudiants` sera `undefined`, provoquant un tableau vide).
- **RM-SCOLARITE-08** (bug) — `data-io/ExportData.vue` utilise `XLSX.utils.json_to_sheet` sans importer `XLSX` (`import * as XLSX from 'xlsx'` absent) — l'export plantera à l'exécution.
- **RM-SCOLARITE-09** (bug) — `OrganisationEtudiantsContent.vue` référence `creerGroupe()` dans le template (`@click="creerGroupe"`) sans définir cette fonction dans le `<script setup>`.
- **RM-SCOLARITE-10** (bug logique) — Dans `OrganisationEtudiantsContent.vue`, `ajouterAuGroupe(groupeId)` ignore l'étudiant réellement cliqué et affecte systématiquement `filteredEtudiants.value[0]` (le premier de la liste filtrée) au groupe choisi.

---

### Points à confirmer

1. **Aucun RBAC détecté** : impossible de déterminer quels rôles ont accès à quels boutons/actions (création, suppression, import, génération de rapport). À valider avec le métier/l'équipe backend.
2. **`src/views/parcours/Parcours.vue` est orphelin** (aucune route, aucun import ailleurs dans `src`) — à confirmer s'il doit être supprimé, remplacé par `DossierAcademique.vue` (quasi-doublon fonctionnel), ou raccroché à une future route.
3. **Store `etudiantStore.js` incomplet** par rapport à son usage réel dans les vues (`filteredEtudiants`, `fetchEtudiantsByClasseFiliereAnnee` manquants) — à confirmer si une version plus complète existe ailleurs (non trouvée par recherche exhaustive) ou si c'est un développement inachevé.
4. **Onglet « Import »** défini dans le DOM de `EtudiantTab.vue` (`Tab/ImportEtudiantsContent.vue`, actuellement vide) mais sans item de navigation (`<li>`) pour l'atteindre — à confirmer si l'intention est de le réactiver, et avec quel composant (`ImportList.vue` et `data-io/DropData.vue` sont deux candidats orphelins possibles).
5. **Fichiers `sample.vue`** (`Tab/sample.vue`, `details/sample.vue`) semblent être des brouillons/anciennes versions non branchées — à confirmer suppression ou conservation en l'état pour référence de reconstruction.
6. **Composants partagés `src/components/shared/{ItemDetails,itemAction}.vue`** ne sont utilisés par **aucun** fichier du module Scolarité (`grep` négatif) alors que le module possède ses propres copies locales (`etudiants/components/details/{ItemDetails,ItemActions}.vue`) réutilisées ailleurs dans l'ERP (modules Matières, Structures académiques, Concours, Pédagogie) — pattern de duplication de composants à clarifier pour la reconstruction (composant partagé unique vs copies par module).
7. **Champs « professionnels »** dans `DetailEtudiant.vue` (département, unité de service, fonction, grade, diplôme) semblent incohérents avec un profil « étudiant » — à valider si le backend `/etudiants/:id` renvoie réellement ces champs pour un étudiant ou s'il s'agit d'un template copié d'un module Personnel/RH.
8. **Duplication d'`id` HTML** sur les onglets « Tuteur » et « Dossier complet » de `DetailEtudiant.vue` (tous deux `id="sales-tab"` / `href="#sales2"`) empêche leur fonctionnement Bootstrap correct — à corriger en reconstruction.
9. Aucune donnée du dossier académique (Parcours, Assiduité, Finance, Documents) n'est reliée à une API, alors que le store possède déjà une action `fetchParcours(id)` consommant `GET /etudiants/:id/parcours` — à confirmer si cette API doit être branchée sur `ProfilEtudiant.vue`/`ParcoursAcademique.vue` lors de la reconstruction, ou si de nouveaux endpoints (finances, assiduité, documents) doivent être spécifiés.

---

### Module : Inscriptions

#### 1. Objectif métier

Le module Inscriptions centralise, sur une page unique à onglets (`/inscriptions`), la gestion du cycle de vie administratif et financier de l'inscription d'un étudiant :
- Saisie/consultation des inscriptions individuelles à une classe pour une année académique.
- Suivi et validation des paiements liés aux frais d'inscription/scolarité (« Frais paiements »).
- Réinscription en masse des étudiants d'une année académique vers l'année suivante (« Reinscriptions »).
- Gestion des classes et suivi des effectifs/capacité (« Gestions classes »).
- Reporting/statistiques d'inscriptions (« Rapports & Stats »).

Le code source (commentaires `// Cas d'utilisation N` dans `TabInscription.vue`) confirme que ces 5 onglets correspondent à 5 cas d'utilisation distincts voulus par l'équipe produit.

#### 2. Acteurs concernés

Aucun contrôle RBAC (rôle, permission, garde de route) n'a été trouvé dans `Inscription.vue`, `TabInscription.vue` ni dans `etudiants.routes.js` pour ce module. La route `/inscriptions` est déclarée sans `meta` de permission et le lien de sidebar est affiché sans condition de rôle visible dans le code lu.

**Rôle probable à confirmer** : Personnel administratif / scolarité (secrétariat académique), Agent comptable/finances (validation des paiements), Responsable de filière (gestion classes). Aucun de ces rôles n'est vérifié techniquement dans le code du module.

#### 3. Menus et sous-menus associés

Extrait de `src/components/partials/sidebar.vue` (lignes ~255-265) :

```html
<!-- Inscriptions -->
<li class="nav-item">
  <router-link class="nav-link" to="/inscriptions" :class="{ 'menu-active': isMenuActive('/inscriptions') }">
    <i class="mdi mdi-view-headline menu-icon"></i>
    <span class="menu-title">Inscriptions</span>
  </router-link>
</li>
```

- **Inscriptions** est un item de menu **autonome** (sans sous-menu déroulant), positionné entre la section « Concours » et la section « Emploi du temps ».
- Remarque : il existe par ailleurs un module « Concours » séparé et distinct dans le sidebar, avec son propre sous-menu (`/edition-concours`, `/rapport-concours`). Le module Inscriptions contient un onglet interne nommé `concours.vue` (non branché, voir section 10) qui n'a aucun lien technique avec ce module Concours du sidebar.

#### 4. Pages et routes associées

| Route | Nom (name) | Composant | Fichier source |
|---|---|---|---|
| `/inscriptions` | `Inscriptions` | `Inscription.vue` | `src/views/inscriptions/Inscription.vue` |

Déclarée dans `src/routes/etudiants.routes.js` (lignes 29-33) — sans `meta`, sans `props`, chargement en lazy import (`() => import(...)`). Aucune route enfant / imbriquée pour ce module (les 5 « écrans » internes sont des onglets Bootstrap dans une seule page, pas des routes Vue Router distinctes).

#### 5. Description fonctionnelle complète

`Inscription.vue` est une coquille minimale : elle affiche `HeaderView` (titre de page + fil d'ariane + bouton « + Ajouter un nouveau » qui ouvre la modal d'import `InscriptionsModal.vue`) puis, dans une carte, le composant `TabInscription.vue` qui gère la navigation par onglets Bootstrap (`nav-tabs` / `tab-content`, pas de Vue Router).

`TabInscription.vue` définit 5 onglets, chacun mappé à un composant :
1. **Inscriptions** → `InscriptionForm.vue` — liste/recherche/suppression des inscriptions (malgré son nom, ce n'est pas un formulaire de saisie mais un tableau avec filtres).
2. **Gestions classes** → `ClasseNiveau.vue` — liste des classes avec KPI et modal listant les étudiants d'une classe.
3. **Reinscriptions** → `Recherche.vue` — liste des candidats éligibles à la réinscription, avec bouton d'ouverture de la modal `ReinscriptionModal.vue`.
4. **Frais paiements** → `PaiementList.vue` — suivi financier des inscriptions (montants versés/restants), modal de détail paiement, modal de validation en lot.
5. **Rapports & Stats** → `StatsRapports.vue` — tableau de bord de KPI (données **entièrement statiques/hardcodées**, aucun store).

Trois fichiers supplémentaires existent dans `components/tabs/` (`Etudiants.vue`, `candidats.vue`, `concours.vue`) mais **ne sont importés nulle part** (ni dans `TabInscription.vue`, ni ailleurs dans le code source) — ce sont des composants orphelins, inaccessibles depuis l'interface utilisateur actuelle (voir section 10).

Le module s'appuie sur deux stores Pinia : `useInscriptionStore` (inscriptions, finances, imports) et `useClasseStore` (classes, effectifs, étudiants d'une classe), tous deux branchés sur l'API réelle `academiqueApi.js` (préfixe `/inscriptions`, `/classes`). Un cache localStorage (TTL 5 min) est utilisé pour `inscriptions`, `inscriptions_finances` et `classes`.

Plusieurs incohérences techniques ont été identifiées entre composants et store (voir section 15, remarques de reconstruction) : des méthodes/état appelés par certains composants (`store.removeInscription`, `store.fetchCandidatsReinscription`, `store.candidatsPourReinscription`, `store.bulkImportReinscriptions`) **n'existent pas** dans `inscriptionStore.js`.

#### 6. Interfaces du module

##### Écran : Inscription (page principale `/inscriptions`)

- **Route** : `/inscriptions`
- **Composant** : `src/views/inscriptions/Inscription.vue`
- **Objectif** : point d'entrée unique du module ; affiche l'en-tête et délègue tout le contenu métier aux onglets de `TabInscription.vue`.
- **Données affichées** : aucune donnée propre ; un `SkeletonLoader` (type `table`, 3 lignes) est affiché tant que `loading` (variable locale non branchée à un store — reste toujours `false` par défaut faute d'implémentation visible, donc le skeleton n'a pas d'effet observé dans le code lu).
- **Données modifiables** : aucune directement sur cet écran.
- **Filtres / Recherche** : aucun au niveau racine (présents dans chaque onglet, voir section 10).
- **Onglets** : Inscriptions, Gestions classes, Reinscriptions, Frais paiements, Rapports & Stats (détaillés ci-dessous comme sous-écrans virtuels).
- **Boutons** : « + Ajouter un nouveau » (ouvre `InscriptionsModal.vue`) ; menu « ⋮ » avec « Exporter Excel », « Imprimer », « Paramètres » (tous non implémentés, voir 7).
- **Modals/formulaires** : `InscriptionsModal.vue` (import Excel/CSV d'inscriptions).
- **États visuels** : chargement (skeleton), sinon carte avec onglets.
- **Messages succès/erreur** : gérés au niveau de chaque sous-écran via `messageStore` (toasts globaux) ou `alert()` natif selon le composant.
- **API utilisées** : aucune directement (déléguées aux onglets).
- **Store utilisé** : aucun directement.
- **Composants enfants** : `HeaderView.vue`, `TabInscription.vue`, `SkeletonLoader` (composant partagé, non lu en détail).
- **Remarques reconstruction** : la variable `loading` dans `Inscription.vue` n'est déclarée nulle part dans le `<script setup>` lu (seuls les imports de composants apparaissent) — soit elle est fournie implicitement (non trouvé), soit c'est un résidu de code mort ; à vérifier lors de la reconstruction.

###### Sous-écran : Onglet « Inscriptions » (`InscriptionForm.vue`)

- **Objectif** : lister, rechercher, filtrer et supprimer les inscriptions existantes.
- **Données affichées** : matricule, nom/prénom, date d'inscription, classe/filière, statut (badge coloré), depuis `store.inscriptions`.
- **Filtres** : recherche texte (nom/prénom/matricule), filière (liste chargée depuis `localStorage.getItem('filieres')`, pas d'appel API dédié), statut (`EN_ATTENTE`/`ACTIVE`/`ANNULEE`).
- **Tableau** : colonnes `#`, Matricule, Étudiant (+ date d'inscription), Classe & Filière, Statut, Actions.
- **Boutons/Actions par ligne** : « Détails » (ouvre `selectedInscription`/`showModal`, mais **aucune modal de détail n'est montée dans ce fichier** — état déclaré mais non exploité dans le template lu), « Supprimer » (`confirm()` puis `store.removeInscription(id)` — **méthode absente du store**, échoue silencieusement via le garde `typeof === 'function'`).
- **Boutons globaux (template)** : `<InscriptionClasse />` et `<AjouterTuteur />` — **composants référencés mais non importés dans le `<script setup>`** (seuls `AppPagination` et `useInscriptionStore` sont importés) ; Vue lèvera un avertissement « Failed to resolve component » et ces boutons ne rendront rien de fonctionnel.
- **Pagination** : `AppPagination` (10 éléments/page par défaut).
- **API utilisées** : `GET /inscriptions` (via `store.fetchInscriptions`).
- **Store** : `useInscriptionStore` (`inscriptions`, `fetchInscriptions`, `removeInscription` [absent]).
- **États visuels** : ligne vide « Aucune inscription ne correspond à vos critères » avec bouton de reset.

###### Sous-écran : Onglet « Gestions classes » (`ClasseNiveau.vue`)

- **Objectif** : piloter les classes (effectif/capacité) et consulter la liste des étudiants par classe.
- **Données affichées** : KPI (nb classes actives, capacité totale, nb classes surchargées — calculés côté client à partir de `classeStore.classes`), tableau des classes (code, filière, année, niveau, taux de remplissage avec barre de progression).
- **Filtres** : recherche texte (code/filière), filtre filière (liste déduite dynamiquement des classes chargées).
- **Tableau** : colonnes `#`, Identifiant Classe, Filière & Spécialité, Niveau, Taux de Remplissage, Actions.
- **Boutons par ligne** : « Voir la liste des étudiants » (ouvre `ClasseEtudiantModal.vue` + `classeStore.fetchClasseStudents(id)`), « Importer des étudiants » (`openImport(classe)` — fonction non définie dans le `<script setup>` lu ; probable bug/omission).
- **Boutons globaux** : « Imprimer listes », « + Nouvelle Classe » — non câblés (aucun handler dans le script).
- **API utilisées** : `GET /classes` (`classeStore.fetchClasses`), `GET /classes/:id/etudiants` (`classeStore.fetchClasseStudents`).
- **Store** : `useClasseStore`.
- **Modal** : `ClasseEtudiantModal.vue` (liste paginée des étudiants d'une classe, triée par nom/prénom).

###### Sous-écran : Onglet « Reinscriptions » (`Recherche.vue`)

- **Objectif** : lister les candidats éligibles à la réinscription et lancer une réinscription (unitaire ou en lot).
- **Données affichées** : matricule, nom/prénom, téléphone, classe/année/filière précédente, statut de paiement — depuis `inscriptionStore.candidatsPourReinscription` **(propriété inexistante dans le store → toujours tableau vide en pratique)**.
- **Filtres** : année académique source (valeurs de repli codées en dur `['2023-2024','2024-2025','2025-2026']` si `inscriptionStore.academicYears` absent — absent du store réel), filière (valeurs de repli `['GI','GTR','IDA']`), recherche texte.
- **Tableau** : colonnes Matricule, Étudiant, Parcours Précédent, Paiement, Action.
- **Boutons** : « Réinscrire » par ligne (ouvre modal `ReinscriptionModal.vue` en pré-remplissant `classe_code`/`filiere_code` — pas d'appel API individuel visible, juste `console.log`), « Importer des listes » (ouvre la modal), « Exporter » (non câblé).
- **API utilisées** : aucune fonctionnelle en l'état — `inscriptionStore.fetchCandidatsReinscription()` est appelée au montage mais **n'existe pas dans le store**, donc protégée par un garde `typeof === 'function'` : la liste reste vide en permanence.
- **Store** : `useInscriptionStore` (`loading`, et propriétés/actions non implémentées listées ci-dessus).

###### Sous-écran : Onglet « Frais paiements » (`PaiementList.vue`)

- **Objectif** : suivi financier des dossiers d'inscription (montants dus/versés/restants) et validation comptable.
- **Données affichées** : totaux « Total Collecté » / « En attente » (`store.financeTotals`), tableau détaillé par étudiant (nom, matricule, classe, filière, frais scolarité, montant versé, reste, statut) depuis `store.finances`.
- **Filtres** : filière, statut (`en attente`/`validée`/`annulée`), recherche texte.
- **Tableau** : colonnes Étudiant/Matricule, Classe, Frais Inscription, Montant Versé, Reste, Statut, Actions.
- **Boutons** : « Gérer Paiement » par ligne (ouvre `PaiementDetails.vue` avec l'inscription sélectionnée), « Validation par lots » (ouvre `ValidationModal.vue`), « Exporter » (non câblé).
- **API utilisées** : `GET /inscriptions/finances` (`store.fetchInscriptionsFinances`), `PATCH /inscriptions/:id/statut` (`store.changeStatus`, utilisé dans `PaiementDetails.vue` et la fonction locale inutilisée `validerInscription`).
- **Store** : `useInscriptionStore` (`finances`, `financeTotals`, `loading`, `fetchInscriptionsFinances`, `changeStatus`).
- **Remarque** : la fonction locale `validerInscription` et `imprimerRecu` sont définies mais **non reliées à un bouton visible** dans le template lu (code mort probable).

###### Sous-écran : Onglet « Rapports & Stats » (`StatsRapports.vue`)

- **Objectif affiché** : tableau de bord analytique des inscriptions/finances.
- **Données affichées** : **100 % simulées/codées en dur** dans le `<script setup>` : `currentYear = 'Année Académique 2024-2025'`, KPI statiques (« 1,284 » inscriptions, « 12.5M FCFA », « 45 » dossiers en attente, « 94.2% » taux de rétention), graphique en barres avec valeurs fixes `[40, 60, 45, 90, 65, 85, 100]`, `topFilieres` en tableau JS constant. **Aucun appel API ni store.**
- **Boutons** : « Générer PDF » (`downloadReport` → simple `console.log`, aucune génération réelle).
- **API/Store** : aucun.

#### 7. Boutons et actions (tableau complet)

| Bouton / Action | Emplacement | Handler | Effet réel |
|---|---|---|---|
| + Ajouter un nouveau | `HeaderView.vue` | ouvre modal `#importInscriptionsModal` | Ouvre `InscriptionsModal.vue` (import Excel) |
| Exporter Excel (menu ⋮) | `HeaderView.vue` | `exportToExcel` | Référencé dans le template mais **non défini** dans le `<script setup>` lu — probable erreur au clic |
| Imprimer (menu ⋮) | `HeaderView.vue` | `printTable` | Idem : **non défini** dans le script |
| Paramètres (menu ⋮) | `HeaderView.vue` | aucun (lien `href="#"` sans handler) | Non fonctionnel |
| Détails (ligne inscription) | `InscriptionForm.vue` | `openModal(inscription)` | Positionne `selectedInscription`/`showModal` mais aucune modal montée dans ce fichier pour les exploiter |
| Supprimer (ligne inscription) | `InscriptionForm.vue` | `supprimerInscription(id)` | `confirm()` puis `store.removeInscription(id)` — méthode absente du store, no-op silencieux |
| Voir étudiants (ligne classe) | `ClasseNiveau.vue` | `voirEtudiants(classe)` | Ouvre `ClasseEtudiantModal.vue`, appelle `classeStore.fetchClasseStudents(id)` (fonctionnel) |
| Importer étudiants (ligne classe) | `ClasseNiveau.vue` | `openImport(classe)` | **Fonction non définie** dans le script — bug |
| Réinscrire (ligne candidat) | `Recherche.vue` | `openReinscriptionModal(etudiant)` | Pré-remplit des données puis `console.log` uniquement ; l'ouverture réelle de la modal dépend de `data-bs-target` Bootstrap sur un bouton distinct dans `ReinscriptionModal.vue` (import en lot, pas de flux unitaire réel) |
| Importer des listes | `Recherche.vue` | `data-bs-toggle="modal" data-bs-target="#importReinscriptionsModal"` | Ouvre `ReinscriptionModal.vue` |
| Gérer Paiement (ligne finance) | `PaiementList.vue` | `openPaiementModal(ins)` | Ouvre `PaiementDetails.vue` |
| Validation par lots | `PaiementList.vue` | `showBulkModal = true` | Ouvre `ValidationModal.vue` |
| Exporter (Reinscriptions / Frais / Classes) | plusieurs onglets | boutons sans `@click` | Non câblés, décoratifs |
| Valider (ItemActions dropdown) | `ItemActions.vue` (non branché à un tableau, voir remarques) | `submitPaiement` → `emit('validate', payload)` | Émet un événement `validate` vers un parent ; **`ItemActions.vue` n'est importé/utilisé nulle part dans le module** (composant orphelin) |
| Détails (ItemActions dropdown) | `ItemActions.vue` | modal locale `#modalDetails` (affiche `<pre>{{ item }}</pre>`) | Idem, composant orphelin |
| Annuler (ItemActions dropdown) | `ItemActions.vue` | `submitAnnulation` → `emit('delete', {...item, motif})` | Idem, composant orphelin |
| Générer PDF | `StatsRapports.vue` | `downloadReport` | `console.log` uniquement, aucune génération réelle |
| Valider l'inscription / Rejeter | `PaiementDetails.vue` | `traiterDossier('VALIDEE'|'REJETEE')` | `store.changeStatus(id, {statut, commentaire})` puis `fetchInscriptionsFinances()` — **fonctionnel** |
| Lancer la validation (import lot) | `ValidationModal.vue` | `traiterImportation` | `store.importReinscriptions(formData)` puis `fetchInscriptionsFinances()` — **fonctionnel**, malgré le libellé « validation », techniquement un import de réinscriptions |
| Importer (import inscriptions) | `InscriptionsModal.vue` | `confirmImport` | `store.bulkImportInscriptions(formData)` — **fonctionnel** |
| Lancer la réinscription (import lot) | `ReinscriptionModal.vue` | `confirmReinscription` | `inscriptionStore.bulkImportReinscriptions(formData)` — **méthode absente du store**, échouera en TypeError capté par le `catch`, sans retour utilisateur clair (pas d'`alert`, juste absence de rapport) |
| Modèle Excel (téléchargement gabarit) | `InscriptionsModal.vue` / `ReinscriptionModal.vue` | `downloadTemplate` | Génère un fichier `.xlsx` localement via la librairie `xlsx` — fonctionnel, 100 % client |

#### 8. Formulaires

##### InscriptionForm.vue (onglet « Inscriptions »)
Ce n'est **pas un formulaire de saisie** malgré son nom — c'est un tableau de consultation/filtrage/suppression (voir section 6). Aucun champ de saisie de création d'inscription n'existe dans ce composant ni ailleurs dans le module lu. La création d'inscription (`store.addInscription`) existe dans le store mais **n'est appelée par aucun composant** du module Inscriptions (code mort côté store).

##### ReinscriptionModal.vue (import réinscriptions par lot)
- **Champs** :
  - Nouvelle Année Académique (texte libre, `codeAnnee`, valeur par défaut `2026-2027`, obligatoire).
  - Classe de destination (lecture seule, affichée seulement si `props.classe` fourni par le parent).
  - Zone de dépôt de fichier (`.xlsx`, `.xls`, `.csv`) par drag & drop ou clic.
- **Validation cliente (par ligne du fichier, via SheetJS `xlsx`)** : `matricule`, `code_filiere`, `code_classe` obligatoires — sinon `_errors` peuplé et ligne surlignée en rouge dans l'aperçu (5 premières lignes affichées).
- **Workflow de soumission** : bouton « Lancer la réinscription » désactivé tant qu'il n'y a pas de fichier valide (`!selectedFile || hasErrors || !codeAnnee`) ; `confirmReinscription()` construit un `FormData` (`fichier`, `code_annee`) et appelle `inscriptionStore.bulkImportReinscriptions(formData)` — **cette méthode n'existe pas dans `inscriptionStore.js`**, l'appel échouera systématiquement avec `TypeError`.
- **Comportement succès** : afficherait un écran de bilan (`importReport.summary` : totalTraite/totalSucces/totalEchecs + détail des rejets) — inatteignable en l'état actuel du store.
- **Comportement échec** : le `catch` ne peuple `importReport` que si `error.response.data.data` existe (erreur HTTP structurée) ; une `TypeError` locale (méthode manquante) ne remplit pas `importReport`, laissant l'utilisateur sans retour visible autre que la fin du spinner.
- **Bouton annexe** : « Modèle Excel » télécharge un gabarit `.xlsx` avec en-têtes `matricule, code_filiere, code_classe` (généré côté client, fonctionnel).

##### ValidationModal.vue (« Validation Inscriptions par Lots »)
- **Champ unique** : zone de dépôt de fichier Excel/CSV (max 5 Mo annoncé côté UI, non vérifié en code).
- **Validation** : extension uniquement (`.xlsx`, `.xls`, `.csv`) au moment du drop ; aucune validation de contenu côté client (contrairement aux deux autres modals d'import).
- **Workflow de soumission** : `traiterImportation()` construit un `FormData` (`fichier`) et appelle `store.importReinscriptions(formData)` (méthode réellement présente dans le store) puis `store.fetchInscriptionsFinances()`, puis ferme la modal.
- **Succès/échec** : succès → notification globale via `messageStore` (« Import des réinscriptions réussi. ») déclenchée dans le store ; échec → `alert("L'importation a échoué. Vérifiez la structure de votre fichier.")` local, en plus de la notification d'erreur du store.
- **Remarque** : malgré son nom « ValidationModal » / « Validation par lots », l'action technique déclenchée est un **import de fichier de réinscription** (`POST /imports/reinscriptions`), pas une validation de statut d'inscriptions déjà existantes.

##### InscriptionsModal.vue (« Importer des inscriptions par lot »)
- **Champs** : Année Académique Cible (texte libre, `codeAnnee`, défaut `2025-2026`, obligatoire), Classe détectée (lecture seule, si `props.classe` fourni), zone de dépôt fichier.
- **Validation cliente par ligne** : `nom`, `prenom`, `email` (+ format regex simple), `code_filiere`, `code_classe` obligatoires ; `sexe` doit être `M` ou `F` si renseigné.
- **Workflow de soumission** : bouton « Importer » désactivé tant que fichier absent/erreurs/`codeAnnee` vide ; `confirmImport()` construit `FormData` (`fichier`, `code_annee`) et appelle `inscriptionStore.bulkImportInscriptions(formData)` (**méthode présente et fonctionnelle**, appelle `POST /inscriptions/import` via `academiqueFormService`).
- **Succès** : affiche un écran de bilan avec `importReport.summary` (totalTraite/totalSucces/totalEchecs) et détail des rejets serveur (ligne, étudiant, raison) ; notification globale succès/succès-partiel selon `totalEchecs > 0`.
- **Échec** : si `error.response.data.data` existe, un rapport d'échec local est construit avec toutes les lignes en échec ; notification d'erreur globale via `messageStore`.
- **Bouton annexe** : « Modèle Excel » — gabarit `.xlsx` avec en-têtes `nom, prenom, sexe, date_naissance, lieu_naissance, telephone, email, ville, code_filiere, code_classe`.

##### ClasseEtudiantModal.vue
Ce n'est pas un formulaire de saisie mais une **modal de consultation** (liste paginée, triée, des étudiants d'une classe donnée), alimentée par les props `classe`, `students`, `loading` fournies par le parent (`ClasseNiveau.vue` via `classeStore.students`). Aucun champ modifiable.

#### 9. Tableaux et tables de navigation

| Tableau | Composant | Source des données | API réelle ou simulée |
|---|---|---|---|
| Liste des inscriptions | `InscriptionForm.vue` | `store.inscriptions` | **API réelle** : `GET /inscriptions` |
| Liste des candidats à la réinscription | `Recherche.vue` | `inscriptionStore.candidatsPourReinscription` | **Non fonctionnel** — propriété absente du store, toujours vide |
| Liste des classes | `ClasseNiveau.vue` | `classeStore.classes` | **API réelle** : `GET /classes` |
| Liste des étudiants d'une classe (modal) | `ClasseEtudiantModal.vue` | `classeStore.students` | **API réelle** : `GET /classes/:id/etudiants` |
| Suivi financier des inscriptions | `PaiementList.vue` | `store.finances` | **API réelle** : `GET /inscriptions/finances` |
| Aperçu fichier import (5 lignes) | `InscriptionsModal.vue`, `ReinscriptionModal.vue` | Parsing local `xlsx` | **100 % client**, aucun appel API pour l'aperçu |
| Détails rejets import | `InscriptionsModal.vue`, `ReinscriptionModal.vue` | `importReport.details.echecs` (réponse API) | **API réelle** (réponse du endpoint d'import) |
| Table `candidats` (onglet orphelin) | `candidats.vue` | tableau JS local (`ref([])` peuplé en dur au `onMounted`) | **Entièrement simulé**, composant non branché à l'UI |
| Table `candidats` (onglet orphelin `Etudiants.vue`) | `Etudiants.vue` | `ref([])` peuplé en dur | **Entièrement simulé**, composant non branché à l'UI ; utilise en plus des composants Ant Design (`a-input`, `a-select`) absents des autres onglets |
| Table `concours` (onglet orphelin) | `concours.vue` | `ref([])` peuplé en dur | **Entièrement simulé**, composant non branché à l'UI |

#### 10. Onglets

| Onglet (libellé UI) | Composant | Branché dans `TabInscription.vue` ? | Store utilisé | Nature des données |
|---|---|---|---|---|
| Inscriptions | `InscriptionForm.vue` | Oui | `useInscriptionStore` | Réelles (API) |
| Gestions classes | `ClasseNiveau.vue` | Oui | `useClasseStore` | Réelles (API) |
| Reinscriptions | `Recherche.vue` | Oui | `useInscriptionStore` | Réelles en théorie, mais liste toujours vide (méthode/état manquants dans le store) |
| Frais paiements | `PaiementList.vue` | Oui | `useInscriptionStore` | Réelles (API) |
| Rapports & Stats | `StatsRapports.vue` | Oui | Aucun | **100 % simulées/hardcodées** |
| (non affiché) | `candidats.vue` | **Non** — fichier orphelin, jamais importé | Aucun | Simulées, hors ligne |
| (non affiché) | `Etudiants.vue` | **Non** — fichier orphelin, jamais importé | Aucun | Simulées, hors ligne |
| (non affiché) | `concours.vue` | **Non** — fichier orphelin, jamais importé | Aucun (importe `InscriptionsModal.vue` sous l'alias `AddConcour`, sans rapport fonctionnel avec des concours) | Simulées, hors ligne |

#### 11. Workflow métier complet

##### WF-INSCRIPTIONS-01 — Inscription d'un étudiant par import de lot, jusqu'à la validation du paiement

1. L'utilisateur clique sur « + Ajouter un nouveau » (`HeaderView.vue`) → ouverture de `InscriptionsModal.vue`.
2. Saisie de l'année académique cible, dépôt d'un fichier Excel/CSV (nom, prénom, sexe, date/lieu de naissance, téléphone, email, ville, code filière, code classe).
3. Validation cliente ligne par ligne (champs obligatoires + format email + sexe M/F) ; les lignes invalides sont surlignées, le bouton « Importer » reste désactivé s'il y a des erreurs.
4. Clic sur « Importer » → `POST /inscriptions/import` (multipart) via `academiqueFormService`.
5. En cas de succès (total ou partiel), affichage du bilan (traité/créées/rejetées) et invalidation du cache local (`inscriptions`, `inscriptions_finances`) puis rechargement de `store.inscriptions`.
6. L'utilisateur passe à l'onglet « Frais paiements » (`PaiementList.vue`), qui recharge `store.fetchInscriptionsFinances()` → `GET /inscriptions/finances`.
7. Pour un dossier « en attente », clic sur « Gérer Paiement » → ouverture de `PaiementDetails.vue`, affichage frais/versé/reste.
8. Saisie d'un commentaire de décision (optionnel) puis clic sur « Valider l'inscription » ou « Rejeter » → `PATCH /inscriptions/:id/statut` (`store.changeStatus`) avec `{statut: 'VALIDEE'|'REJETEE', commentaire}`.
9. Rafraîchissement de `fetchInscriptionsFinances()` pour mettre à jour les totaux et le statut affiché.

##### WF-INSCRIPTIONS-02 — Réinscription en lot d'étudiants vers une nouvelle année académique

1. L'utilisateur ouvre l'onglet « Reinscriptions » (`Recherche.vue`).
2. La liste des candidats éligibles est censée se charger via `inscriptionStore.fetchCandidatsReinscription()` — **en pratique cette méthode n'existe pas dans le store**, la liste reste vide et l'écran affiche l'état « Aucun candidat éligible trouvé ».
3. Deux voies de réinscription sont exposées dans l'UI :
   a. Bouton « Réinscrire » par ligne (`openReinscriptionModal`) — ne fait qu'un `console.log`, sans action réelle observable.
   b. Bouton « Importer des listes » → ouvre `ReinscriptionModal.vue` (import de fichier `.xlsx/.xls/.csv` avec colonnes `matricule`, `code_filiere`, `code_classe`).
4. Après dépôt et validation cliente du fichier, clic sur « Lancer la réinscription » → tentative d'appel `inscriptionStore.bulkImportReinscriptions(formData)` — **méthode absente du store**, l'appel échoue en `TypeError`, capté par le bloc `catch` sans message d'erreur explicite affiché à l'utilisateur (le rapport `importReport` n'est peuplé que sur erreur HTTP structurée `error.response.data.data`).
5. **Chemin fonctionnel alternatif existant dans le code** : la modal « Validation par lots » de l'onglet « Frais paiements » (`ValidationModal.vue`) appelle `store.importReinscriptions(formData)` (méthode réellement présente, `POST /imports/reinscriptions`) — c'est le seul point d'entrée du module qui déclenche effectivement un import de réinscriptions côté serveur.

#### 12. Cas d'utilisation

- **UC-INSCRIPTIONS-01** — Importer un lot d'inscriptions par fichier Excel/CSV et suivre le bilan d'import (acteur : personnel scolarité). Composants : `InscriptionsModal.vue` → `store.bulkImportInscriptions`.
- **UC-INSCRIPTIONS-02** — Consulter, rechercher et filtrer la liste des inscriptions existantes par matricule/nom/filière/statut. Composants : `InscriptionForm.vue`.
- **UC-INSCRIPTIONS-03** — Supprimer une inscription (fonctionnalité présente dans l'UI mais non opérationnelle, méthode `removeInscription` absente du store). Composants : `InscriptionForm.vue`.
- **UC-INSCRIPTIONS-04** — Consulter le suivi financier des inscriptions (frais dus, versé, reste) et filtrer par filière/statut. Composants : `PaiementList.vue`.
- **UC-INSCRIPTIONS-05** — Valider ou rejeter un dossier d'inscription en attente avec commentaire. Composants : `PaiementDetails.vue` → `store.changeStatus`.
- **UC-INSCRIPTIONS-06** — Importer un lot de réinscriptions via la modal de validation par lots. Composants : `ValidationModal.vue` → `store.importReinscriptions`.
- **UC-INSCRIPTIONS-07** — Consulter la liste des classes avec effectif/capacité/taux de remplissage et filtrer par filière. Composants : `ClasseNiveau.vue`.
- **UC-INSCRIPTIONS-08** — Consulter la liste des étudiants inscrits dans une classe donnée (modal). Composants : `ClasseEtudiantModal.vue` → `classeStore.fetchClasseStudents`.
- **UC-INSCRIPTIONS-09** (non opérationnel) — Consulter et réinscrire individuellement un candidat éligible depuis l'onglet Reinscriptions. Composants : `Recherche.vue`, `ReinscriptionModal.vue` — bloqué par les méthodes manquantes du store.
- **UC-INSCRIPTIONS-10** (façade uniquement) — Consulter des statistiques et générer un rapport PDF des inscriptions. Composants : `StatsRapports.vue` — données et génération PDF entièrement simulées.

#### 13. Données manipulées

| Entité | Champs observés dans le code | Source |
|---|---|---|
| **Candidat / Étudiant (contexte réinscription)** | `id`, `matricule`, `nom`, `prenom`, `telephone`, `classe_code`/`classe`, `annee_code`/`annee`, `filiere_code`/`filiere`, `statut_paiement`/`statut` | `Recherche.vue` (via `candidatsPourReinscription`, non alimenté en pratique) |
| **Inscription** | `id`, `etudiant_nom`/`nom`, `etudiant_prenom`/`prenom`, `etudiant_matricule`/`matricule`, `etudiant_sexe`/`sexe`, `classe_id`, `classe_code`/`classe`, `filiere_nom`/`filiere_code`, `annee_code`/`annee`, `annee_academique_id`, `created_at`/`date_inscription`, `inscription_statut`/`statut` (`EN_ATTENTE`, `ACTIVE`/`VALIDEE`/`VALIDÉE`, `ANNULEE`/`ANNULÉE`/`REJETEE`) | `InscriptionForm.vue`, `InscriptionDetails.vue`, store `inscriptionStore` |
| **Classe** | `id`/`classe_id`, `code`/`classe_code`, `filiere_nom`/`filiere_code`, `annee_code`/`annee`, `niveau_code`/`niveau`, `classe_capacite`/`capacite_max`/`capacite`, `effectif_actuel`/`nb_etudiants`/`effectif` | `ClasseNiveau.vue`, store `classeStore` |
| **Niveau** | `niveau_code`/`niveau` (affiché en badge sur la classe ; pas d'entité Niveau distincte manipulée dans ce module) | `ClasseNiveau.vue` |
| **Paiement / Finances d'inscription** | `id`, `nom`, `prenom`, `matricule`, `classe_code`, `filiere_code`, `frais_scolarite`, `montant_verse`, `reste`, `statut` (`en attente`/`validée`/`annulée`) + payload de saisie manuelle : `montant`, `mode_paiement` (`espece`, `mobile money`, `virement`, `chèque`), `reference_transaction`, `etudiant_id`, `classe_id`, `annee_academique_id` | `PaiementList.vue`, `PaiementDetails.vue`, `ItemActions.vue` (composant orphelin) |
| **Import (rapport)** | `summary.totalTraite`, `summary.totalSucces`, `summary.totalEchecs`, `details.echecs[].ligne`, `details.echecs[].etudiant`/`matricule`, `details.echecs[].erreur` | `InscriptionsModal.vue`, `ReinscriptionModal.vue` |
| **Concours (onglet orphelin, hors module réel)** | `id`, `designation`, `type_concours`, `date_debut`, `date_fin`, `statut` | `concours.vue` (données 100 % simulées, non liées au module Concours du sidebar) |

#### 14. API et intégration backend

Toutes les fonctions ci-dessous sont définies dans `src/api/academique/academiqueApi.js` (client `academiqueService`/`academiqueFormService` construits via `buildService(academiqueApi|academiqueFormApi)`).

| Fonction API | Méthode HTTP | Endpoint | Utilisée par (store action) | Utilisée par (composant) |
|---|---|---|---|---|
| `getInscriptions` | GET | `/inscriptions` | `inscriptionStore.fetchInscriptions` | `InscriptionForm.vue` |
| `getInscriptionsFinances` | GET | `/inscriptions/finances` | `inscriptionStore.fetchInscriptionsFinances` | `PaiementList.vue`, `PaiementDetails.vue` |
| `getInscriptionById` | GET | `/inscriptions/:id` | `inscriptionStore.fetchInscriptionById` | appelé après `changeStatus` |
| `createInscription` | POST | `/inscriptions` | `inscriptionStore.addInscription` | **aucun composant du module ne l'appelle** (code mort côté store) |
| `updateInscription` | PUT | `/inscriptions/:id` | `inscriptionStore.editInscription` | **aucun composant du module ne l'appelle** (code mort côté store) |
| `changeInscriptionStatus` | PATCH | `/inscriptions/:id/statut` | `inscriptionStore.changeStatus` | `PaiementDetails.vue` |
| `importInscriptions` | POST (multipart) | `/inscriptions/import` | `inscriptionStore.bulkImportInscriptions` | `InscriptionsModal.vue` |
| `importReinscriptions` | POST (multipart) | `/imports/reinscriptions` | `inscriptionStore.importReinscriptions` | `ValidationModal.vue` |
| `importTuteurs` | POST (multipart) | `/imports/tuteurs` | `inscriptionStore.importTuteurs` | **aucun composant du module ne l'appelle** (code mort côté store) |
| `getClasses` | GET | `/classes` | `classeStore.fetchClasses` | `ClasseNiveau.vue` |
| `getClasseStudents` | GET | `/classes/:id/etudiants` | `classeStore.fetchClasseStudents` | `ClasseNiveau.vue` → `ClasseEtudiantModal.vue` |

**Méthodes appelées par les composants mais absentes du store `inscriptionStore.js`** (non répertoriées ci-dessus car aucun endpoint n'est réellement invoqué) :
- `store.removeInscription(id)` — appelée par `InscriptionForm.vue`.
- `inscriptionStore.fetchCandidatsReinscription()` / `inscriptionStore.candidatsPourReinscription` — appelées par `Recherche.vue`.
- `inscriptionStore.bulkImportReinscriptions(formData)` — appelée par `ReinscriptionModal.vue`.
- `inscriptionStore.academicYears` / `inscriptionStore.filieres` — lues par `Recherche.vue` (retombent sur des valeurs de repli codées en dur).

Aucune de ces quatre références ne correspond à une fonction exportée par `academiqueApi.js` ni à une action/état déclaré dans `inscriptionStore.js` (vérifié par lecture intégrale du store, 230 lignes).

**Cache client** : `inscriptionStore` et `classeStore` utilisent `localStorage` (clés `inscriptions`, `inscriptions_finances`, `classes`) avec un TTL de 5 minutes (`getCache`/`setCache`), invalidé explicitement après chaque mutation (create/update/changeStatus/import).

#### 15. Règles métier détectées

- **RM-INSCRIPTIONS-01** — Le statut d'une inscription est normalisé côté front en trois catégories logiques : « en attente » (`EN_ATTENTE`), « validée » (`ACTIVE`/`VALIDEE`/`VALIDÉE`), « annulée »/« rejetée » (`ANNULEE`/`ANNULÉE`/`REJETEE`) — la normalisation est faite par correspondance de sous-chaîne insensible à la casse (`InscriptionForm.vue`, `InscriptionDetails.vue`, `PaiementList.vue`), suggérant que l'API peut renvoyer des variantes orthographiques différentes selon l'endpoint.
- **RM-INSCRIPTIONS-02** — Seul un dossier au statut « en attente » (comparaison stricte `statut.toLowerCase() === 'en attente'`) peut être validé ou rejeté depuis `PaiementDetails.vue` ; un dossier déjà traité affiche uniquement son statut, sans action possible.
- **RM-INSCRIPTIONS-03** — Le changement de statut d'une inscription invalide systématiquement le cache financier local (`inscriptions_finances`) car il impacte les totaux affichés (`inscriptionStore.changeStatus`).
- **RM-INSCRIPTIONS-04** — Toute création/modification/import d'inscription invalide le cache `inscriptions` (et `inscriptions_finances` selon les cas) pour forcer un rechargement depuis l'API.
- **RM-INSCRIPTIONS-05** — Une classe est considérée « surchargée » si son effectif actuel dépasse sa capacité déclarée (`getEffectif(c) > getCapacite(c)`), calcul purement côté client dans `ClasseNiveau.vue`.
- **RM-INSCRIPTIONS-06** — Le mode de paiement d'une inscription est restreint à un ensemble fermé de valeurs : `espece`, `mobile money`, `virement`, `chèque` (`ItemActions.vue`, composant orphelin mais reflétant probablement le contrat métier attendu).
- **RM-INSCRIPTIONS-07** — Un fichier d'import d'inscriptions est rejeté ligne par ligne côté client si `nom`, `prenom`, `email` (avec format regex `^[^\s@]+@[^\s@]+\.[^\s@]+$`), `code_filiere` ou `code_classe` sont manquants, ou si `sexe` n'est pas `M`/`F` (`InscriptionsModal.vue`).
- **RM-INSCRIPTIONS-08** — Un fichier d'import de réinscriptions est rejeté ligne par ligne si `matricule`, `code_filiere` ou `code_classe` sont manquants — contrat de données volontairement réduit par rapport à l'import d'inscriptions neuves (`ReinscriptionModal.vue`).
- **RM-INSCRIPTIONS-09** — Le motif est obligatoire pour toute annulation d'inscription via `ItemActions.vue` (composant orphelin, mais règle probablement destinée à s'appliquer partout où l'annulation existera réellement).
- **RM-INSCRIPTIONS-10** — Les données d'entrée de fichiers Excel/CSV sont interprétées et validées **entièrement côté client** (librairie `xlsx`/SheetJS) avant tout envoi au serveur ; le serveur applique une validation additionnelle dont les rejets sont renvoyés sous forme de liste structurée (`error.response.data.data`) réaffichée à l'écran.

### Points à confirmer

1. **Store `inscriptionStore.js` incomplet par rapport aux composants qui le consomment** : `removeInscription`, `fetchCandidatsReinscription`, `candidatsPourReinscription`, `bulkImportReinscriptions`, `academicYears`, `filieres` sont référencés dans les composants mais absents du fichier store lu intégralement (230 lignes). À confirmer : s'agit-il d'un développement inachevé, d'une régression, ou d'un fichier store à jour non encore livré ?
2. **Composants orphelins non branchés à l'UI** : `Etudiants.vue`, `candidats.vue`, `concours.vue` (dans `components/tabs/`) et `ItemActions.vue` (dans `components/details/`) contiennent tous des données 100 % simulées et ne sont importés par aucun autre fichier du dépôt (vérifié par `grep`). À confirmer : doivent-ils être supprimés, ou branchés lors de la reconstruction (et si oui, à quel endroit) ?
3. **Onglet « Reinscriptions » utilise le composant `Recherche.vue`** — le nom du fichier ne correspond pas à son usage réel (gestion des réinscriptions, pas une recherche générique) ; possible confusion de nommage à clarifier avec l'équipe produit avant reconstruction.
4. **`InscriptionForm.vue` référence `<InscriptionClasse />` et `<AjouterTuteur />`** dans son template sans les importer — composants manquants dont l'intention fonctionnelle (probablement : inscrire une classe entière, ajouter un tuteur) n'a pas pu être vérifiée dans le code actuel.
5. **`HeaderView.vue`** référence `exportToExcel` et `printTable` sans les définir dans son `<script setup>` — fonctionnalités d'export/impression globales du module non implémentées, à spécifier.
6. **`Inscription.vue`** utilise une variable `loading` non déclarée dans son `<script setup>` — comportement du `SkeletonLoader` initial à clarifier.
7. **Absence totale de RBAC observable** sur la route `/inscriptions` et ses actions (création, suppression, validation de statut, import) — à confirmer avec l'équipe si la restriction d'accès est gérée en amont (garde de route globale, middleware backend) plutôt que dans ce module spécifique.
8. **`StatsRapports.vue`** est entièrement un mockup visuel (aucune donnée ni API réelle) — à confirmer si un vrai backend de reporting est prévu pour la reconstruction.

---

### Module : Notes, Évaluations & Délibérations

> Documentation produite par lecture intégrale du code source réel (Vue 3 / Pinia / Axios). Aucune fonctionnalité n'est inventée. Toute donnée simulée (`mock*`, tableaux en dur, `console.log`, `alert()`) est signalée explicitement.

---

#### 1. Objectif métier

Le module couvre le cycle complet de gestion des évaluations académiques d'un établissement LMD :
- la saisie des notes des étudiants par classe, semestre et type d'évaluation (Contrôle Continu, Session Ordinaire/Examen Partiel, Session de Rattrapage) ;
- la consultation de l'état global de complétude des saisies ;
- la délibération de jury (calcul de moyenne pondérée, attribution ECTS, décision Admis/Rattrapage/Ajourné) ;
- la proclamation des résultats et la génération de bulletins/relevés de notes officiels ;
- la production de rapports et procès-verbaux (PV) réglementaires ;
- un assistant conversationnel (« Copilote IA ») donnant des indicateurs sur ces processus.

Le sous-module Matières/Modules (`src/views/matieres/`) porte sur la gestion des unités d'enseignement (UE), matières et coefficients — logiquement rattaché car il fournit la pondération utilisée dans les calculs de notes/délibération. **Important : ce sous-module n'est relié à aucune route** (voir §3/§4) ; il s'agit de code présent dans le dépôt mais non accessible depuis l'application.

#### 2. Acteurs concernés

Aucun mécanisme de RBAC (garde de rôle, `meta.roles`, contrôle conditionnel d'affichage selon un rôle utilisateur) n'a été trouvé dans les fichiers lus pour ce module. Tous les boutons et actions sont visibles sans distinction de rôle dans le code.

- **Personnel de scolarité / Administration académique** — Rôle probable à confirmer (accède aux menus « Scolarité » ⟶ Notes / Délibérations, saisit et publie les notes).
- **Jury de délibération / Direction pédagogique** — Rôle probable à confirmer (utilise l'onglet Délibérations, valide les décisions, clôture les semestres).
- **Enseignant** — Rôle probable à confirmer (mentionné uniquement comme métadonnée textuelle, ex. « Enseignant : Dr. Diop » dans une réponse simulée de l'assistant IA ; aucun écran dédié « saisie enseignant » identifié dans ce module).
- **Étudiant** — non acteur direct de ce module (consultation de bulletin évoquée comme destination finale mais aucun écran « espace étudiant » n'est présent dans les fichiers lus).

#### 3. Menus et sous-menus associés

Extrait de `src/components/partials/sidebar.vue` (groupe **Scolarité**, lignes ~84-150 et ~702) :

| Libellé menu | Lien | Remarque |
|---|---|---|
| Scolarité | `#scolarite` (groupe accordéon) | Contient aussi Étudiants, Dossiers scolaires, Absences |
| Évaluations & Notes | `/notes` | Correspond à `NotesView.vue` |
| Délibérations | `/deliberations` | Correspond à `deliberation.vue` |

Aucune entrée de sidebar « Matières » ou « Modules » n'a été trouvée par recherche du mot-clé dans `sidebar.vue` — le module Matières/Modules n'a **ni route ni entrée de menu**.

#### 4. Pages et routes associées

Source : `src/routes/others.routes.js`.

| Route | Nom | Composant | props | Menu associé |
|---|---|---|---|---|
| `/notes` | `Notes` | `src/views/notes/NotesView.vue` | — | Scolarité ▸ Évaluations & Notes |
| `/notes/:classeId/:semestre/:type/edit` | `NotesEdition` | `src/views/notes/components/EditNotes.vue` | `true` (classeId, semestre, type) | Accessible uniquement via navigation programmatique (boutons « Voir »/« Modifier » des listes de classes) |
| `/deliberations` | `Deiberations` *(sic, faute de frappe dans le code)* | `src/views/deliberation/deliberation.vue` | — | Scolarité ▸ Délibérations |

**Non routé** (recherché dans les 10 fichiers de `src/routes/*.js`, aucune occurrence de `matieres` ou `modules`) :
- `src/views/matieres/Modules.vue` et tous ses sous-composants (`ModuleHeader.vue`, `data-io/ModuleImporter.vue`, `details/*`, `tab/*`) sont présents dans le dépôt mais **orphelins** : aucune route ne les monte, `Modules.vue` n'est importé par aucun autre fichier (`grep` sur `Modules.vue`/`matieres/Modules` : 0 résultat). Ils font aussi référence à des routes inexistantes (`/modules`, `/modules/:id`, `/modules/:id/edit`, `/modules/:id/assign`).

#### 5. Description fonctionnelle complète

**Notes (`/notes`)** : `NotesView.vue` affiche un en-tête (`NotesHeader.vue`) puis un système d'onglets (`NotesTabs.vue`) à 3 niveaux :
1. **Vue d'ensemble** (`VueOverview.vue`) — tableau récapitulatif de l'état de saisie par classe (colonnes Classe, Filière, Saisie CC, Saisie Examens, Délibération) alimenté par `classeStore.classes`, mais les 3 dernières colonnes affichent des **badges statiques codés en dur** (« Terminée », « En cours », « En attente ») sans lien avec une vraie donnée d'avancement.
2. **Semestre 1** (`Semestre1Tab.vue`, libellé « Semestres impaires ») — sous-onglets Devoirs / Sessions ordinaires / Sessions de rappels, chacun listant les classes (via `classeStore`) avec un état de saisie **calculé arbitrairement** par `classe.effectif_actuel % 2 === 0` (parité de l'effectif, aucun rapport métier réel avec un état de saisie).
3. **Semestre 2** (`Semestre2Tab.vue`, libellé « Semestres paires ») — même structure de 3 sous-onglets, mais **les 3 composants enfants (`devoir-s2.vue`, `rappel-s2.vue`, `session-s2.vue`) sont des fichiers vides** (`<template></template><script setup></script>`), donc les sous-onglets du Semestre 2 n'affichent rien.

Chaque ligne de classe propose un menu « Gérer » avec « Voir les notes » et « Modifier les saisies », qui redirigent tous deux vers la route `NotesEdition` (`/notes/:classeId/:semestre/:type/edit`) avec le type figé selon l'onglet (`CC`, `SESSION_ORDINAIRE`, `RATTRAPAGE`).

**Édition de notes (`/notes/:classeId/:semestre/:type/edit`)** : la route monte `EditNotes.vue`, un simple wrapper (bouton Retour + carte) qui rend en réalité le composant `Notes.vue` (importé sous l'alias `EditNotes`). C'est `Notes.vue` qui contient le vrai formulaire de saisie : sélection de matière (liste **codée en dur** `mockMatieres`), affichage des stats de session (moyenne, max, alertes sous seuil) calculées côté client, et un tableau nominatif d'étudiants **entièrement simulé** (`mockStudentsList`, 4 étudiants fixes générés en JS, aucun appel API).

**Délibérations (`/deliberations`)** : `deliberation.vue` affiche `DeliberationHeader.vue` (titre, actions Délibération/Proclamer/Publier/Annuler — toutes des `console.log` sans appel API) puis `DeliberationTab.vue` à 4 onglets : Délibérations, Bulletins (composant `ProclamationContent.vue`), Rapports, Assistant IA. Toutes les données de ces 4 écrans sont **simulées** (`mockClasses`, `rawNotes`, `mockLogs`, réponses d'assistant précâblées).

**Matières/Modules (non routé)** : `Modules.vue` liste des modules/UE via `ModuleList.vue` (composant Ant Design `a-table`) branché sur `useModuleStore` — mais ce store (`src/stores/academiqueStore/moduleStore.js`) **ne définit ni état `modules` ni action `fetchModules`/`fetchModuleById`** (il n'expose que `semestresConfig`, `uesConfig` et des actions liées aux UE/configuration semestrielle). Les composants `ModuleList.vue`/`AModuleList.vue`/`DetailsPanel.vue` appellent donc des propriétés/méthodes inexistantes sur le store — code cassé/incohérent, jamais exécuté en production car non routé.

#### 6. Interfaces du module

##### Écran : NotesView

- **Route** : `/notes`
- **Composant** : `src/views/notes/NotesView.vue`
- **Objectif** : point d'entrée de la gestion des notes ; vue d'ensemble + navigation par semestre/type d'évaluation vers la saisie détaillée.
- **Données affichées** : liste des classes (`useClasseStore().classes`, chargée via `classeStore.fetchClasses()`), avec code classe, filière, effectif.
- **Données modifiables** : aucune directement sur cet écran (lecture seule + navigation).
- **Filtres** : recherche texte locale par code classe / nom filière (`searchQuery`, dans `VueOverview.vue`, `Semestre1Tab.vue`/`Semestre2Tab.vue` via prop `searchQuery` — mais aucun champ de saisie de recherche visible dans le template lu ; la logique de filtrage existe côté script sans input relié dans les fichiers examinés).
- **Recherche** : `computed` `filteredClasses` filtrant sur `classe_code`/`code` et `filiere_nom`.
- **Onglets** : Vue d'ensemble / Semestre 1 / Semestre 2 (voir §10).
- **Tableaux** : tableau classes (Vue d'ensemble) ; tableau classes par sous-onglet Devoirs/Sessions/Rappels (Semestre 1 uniquement, Semestre 2 vide).
- **Colonnes** (tableaux semestre) : Code Classe, Filière Affectée, Semestre, Type Évaluation, État de Saisie (badge « Validé & Clos »/« En cours » basé sur `effectif_actuel % 2`), Actions.
- **Boutons** : Export (icône, `console.log` seulement), Impression (`window.print()`), + Ajouter une note (ouvre modal Bootstrap `#addNoteModal` — **modal introuvable dans les fichiers lus, probablement non implémentée**), dropdown Importer notes (modal `#importModal` — **idem, non trouvée**), Télécharger modèle, Suppression en masse.
- **Actions par ligne** (menu « Gérer ») : Voir les notes → navigation `NotesEdition` ; Modifier les saisies → navigation `NotesEdition` ; Valider définitivement → `console.log` uniquement.
- **Modals/formulaires** : `#addNoteModal` et `#importModal` référencés par `data-bs-target` dans `NotesHeader.vue` mais **aucun composant modal correspondant n'a été localisé** dans l'arborescence lue — attributs Bootstrap sans cible DOM, donc non fonctionnels en l'état.
- **États visuels** : badges colorés (succès/avertissement/danger) purement cosmétiques et statiques sur la Vue d'ensemble.
- **Messages succès/erreur** : aucun (pas de toast/alert sur cet écran, uniquement des `console.log`).
- **API utilisées** : aucune propre à Notes ; `classeStore.fetchClasses()` (API classes, hors périmètre de ce module).
- **Store utilisé** : `useClasseStore` (`src/stores/academiqueStore/classeStore`). **Aucun des stores dédiés (`useEvaluationStore`, `useNoteStore`, `useResultatStore`, `useSessionStore`) n'est importé par cet écran ni par aucun composant enfant.**
- **Composants enfants** : `NotesHeader.vue`, `NotesTabs.vue` → `VueOverview.vue`, `Semestre1Tab.vue` (→ `devoir-s1.vue`, `session-s1.vue`, `rappel-s1.vue`), `Semestre2Tab.vue` (→ `devoir-s2.vue`, `session-s2.vue`, `rappel-s2.vue`, tous vides).
- **Remarques reconstruction** : brancher réellement `useNoteStore`/`useSessionStore` pour l'état de saisie (actuellement dérivé arbitrairement de la parité de l'effectif) ; implémenter les modals Ajouter/Importer manquantes ; peupler les composants Semestre 2 (actuellement vides).

##### Écran : EditNotes (saisie de notes)

- **Route** : `/notes/:classeId/:semestre/:type/edit` (nom de route `NotesEdition`)
- **Composant** : `src/views/notes/components/EditNotes.vue` (wrapper) → rend `src/views/notes/components/Notes.vue` (formulaire réel, importé sous l'alias `EditNotes`)
- **Objectif** : saisir/éditer les notes des étudiants d'une classe pour une matière et un type d'évaluation donnés, puis « publier » le PV.
- **Données affichées** :
  - Classe (code lisible résolu depuis `classeStore.classes` via l'UUID `classeId` de l'URL, sinon affiche l'UUID brut) ;
  - Liste de matières avec coefficient et seuil éliminatoire — **codée en dur** (`mockMatieres`, 3 matières fixes) ;
  - Nature de l'évaluation (CC / SESSION_ORDINAIRE / RATTRAPAGE), verrouillée en lecture seule (`disabled`), déduite du paramètre `:type` de l'URL ;
  - Statistiques de session : Moyenne, Note la plus haute, Nombre d'étudiants sous le seuil éliminatoire (recalculées côté client via `computed statsSession`) ;
  - Liste nominative d'étudiants — **entièrement simulée** (`mockStudentsList`, 4 lignes fixes générées par `loadStudents()`, sans appel réseau).
- **Données modifiables** : Note numérique par étudiant (`input type="number"`, min 0, max 20, step 0.25) ; Observation/Appréciation texte libre par étudiant.
- **Filtres** : aucun.
- **Recherche** : aucune.
- **Onglets** : aucun (écran unique).
- **Tableaux** : tableau « Liste Nominative des Apprenants ».
- **Colonnes** : Matricule, Nom & Prénom, Note Numérique (/20), Observations/Appréciations.
- **Boutons** : « Publier le Procès-Verbal » (désactivé si aucune matière sélectionnée ou aucun étudiant), « Retour à la liste » (`router.back()`).
- **Actions** : la note saisie hors seuil (`note < seuil` de la matière) est mise en évidence visuellement (fond/texte rouge) — c'est la seule alerte « éliminatoire » implémentée.
- **Modals/formulaires** : aucun modal ; formulaire de saisie inline dans le tableau.
- **États visuels** : cellule note en rouge (`bg-danger`) si sous le seuil éliminatoire de la matière sélectionnée ; ligne « Chargement du registre en cours... » si liste vide.
- **Messages succès/erreur** : le bouton « Publier le Procès-Verbal » déclenche uniquement un `alert()` JavaScript natif récapitulant classe, matière, type et moyenne calculée — **aucun appel API, aucune persistance réelle**.
- **API utilisées** : **aucune**. `saveAllNotes()` ne fait qu'un `alert()`.
- **Store utilisé** : `useClasseStore` uniquement (pour résoudre le code de classe affiché). Aucun store de notes/évaluations utilisé.
- **Composants enfants** : aucun (formulaire monolithique dans `Notes.vue`).
- **Remarques reconstruction** : c'est l'écran le plus critique à reconstruire fidèlement avec de vraies API : remplacer `mockMatieres` par un appel au référentiel de matières de la classe/semestre (potentiellement `moduleApi`/`useModuleStore`, non branché aujourd'hui), remplacer `mockStudentsList` par la liste réelle des inscrits, et remplacer `saveAllNotes()` (actuellement un simple `alert`) par un appel `notesApi`/`useNoteStore` (ex. `updateNote`, `publierNotesEvaluation`) — ces fonctions existent déjà côté store/API mais ne sont pas consommées ici.

##### Écran : deliberation.vue (Délibérations & Proclamation)

- **Route** : `/deliberations`
- **Composant** : `src/views/deliberation/deliberation.vue`
- **Objectif** : piloter la délibération de jury, la proclamation des résultats, l'édition des bulletins et rapports, et interagir avec un assistant IA de synthèse.
- **Données affichées** : dépend de l'onglet actif (voir détail des 4 sous-écrans ci-dessous, tous alimentés par des données simulées).
- **Données modifiables** : sélection de classe/promotion et de semestre (menus déroulants, listes **codées en dur** `mockClasses` = `['Master 1 Info', 'Master 2 Info', 'Licence 3 Management']`, dupliquée à l'identique dans `DeliberationsContent.vue` et `ProclamationContent.vue`).
- **Filtres** : sélecteur Promotion, sélecteur Semestre (Délibérations) ; sélecteur Promotion + Type de document (Bulletins) ; Année académique / Semestre / Type de session (Rapports).
- **Recherche** : aucune barre de recherche libre identifiée.
- **Onglets** : Délibérations / Bulletins / Rapports / Assistant IA (voir §10).
- **Tableaux** : PV de délibération (Délibérations) ; liste étudiants + aperçu bulletin (Bulletins) ; historique des publications (Rapports).
- **Colonnes** : voir §9.
- **Boutons** : Export résultats, Impression PV, **Délibération** (bouton principal), dropdown → **Proclamer résultats**, **Publier rapport**, **Annuler proclamation** — tous implémentés en `console.log()` uniquement dans `DeliberationHeader.vue` (aucun appel API, aucune interaction avec le contenu des onglets en dessous : ces boutons d'en-tête ne déclenchent aucune action sur `DeliberationsContent.vue`/`ProclamationContent.vue`).
- **Modals/formulaires** : aucun modal ; formulaires inline (sélecteurs) dans chaque onglet.
- **États visuels** : badges de décision (Admis = vert, Rattrapage = orange, Ajourné/Blâmé = rouge) calculés en front ; cellules de notes en rouge si sous seuil éliminatoire.
- **Messages succès/erreur** : `alert()` JS natif pour « Clôturer & Verrouiller le Semestre » (`DeliberationsContent.vue`) et pour « Télécharger les packages PDF ZIP » (`ProclamationContent.vue`) ; `alert()` pour génération de rapport (`RapportContents.vue`). Aucun toast applicatif, aucun retour serveur réel.
- **API utilisées** : **aucune** dans les 4 composants d'onglet. `resultatApi.js` (`getBulletinsByClasse`, `getBulletinEtudiant`, `updateDecisionJury`, `publierBulletinsClasse`) existe mais n'est appelé nulle part dans ces vues.
- **Store utilisé** : aucun store Pinia utilisé dans `deliberation.vue` ni ses enfants (ni `useResultatStore`, ni `useNoteStore`). Tout est `ref()` local avec données mockées.
- **Composants enfants** : `DeliberationHeader.vue`, `DeliberationTab.vue` → `DeliberationsContent.vue`, `ProclamationContent.vue`, `RapportContents.vue`, `AssistantIAContent.vue`.
- **Remarques reconstruction** : l'ensemble du module Délibération fonctionne aujourd'hui en pur prototype front (données et calculs en dur, aucune persistance). Une reconstruction fidèle doit : (1) relier `DeliberationsContent.vue` à `resultatApi`/`useResultatStore` pour charger les vraies notes agrégées par classe, (2) faire du calcul de moyenne pondérée et de décision (Admis/Rattrapage/Ajourné) un calcul serveur ou au minimum documenté comme règle métier officielle (voir §15), (3) connecter les boutons de `DeliberationHeader.vue` (Délibérer/Proclamer/Publier/Annuler) aux actions du store `useResultatStore` (`changeDecisionJury`, `publishBulletinsClasse`) qui existent déjà mais sont inutilisées, (4) noter que le composant `RapportsTab.vue` est un fichier vide et n'est importé nulle part (orphelin, remplacé en pratique par `RapportContents.vue`).

#### 7. Boutons et actions (tableau complet)

| Bouton / Action | Écran | Comportement réel dans le code | API appelée |
|---|---|---|---|
| Export (icône téléchargement) | NotesHeader | `console.log('Export des étudiants')` | Aucune |
| Impression (icône imprimante) | NotesHeader | `window.print()` | Aucune |
| + Ajouter une note | NotesHeader | Ouvre modal `#addNoteModal` (introuvable dans le code) | Aucune |
| Importer notes (Excel/CSV) | NotesHeader (dropdown) | Ouvre modal `#importModal` (introuvable dans le code) | Aucune |
| Télécharger modèle | NotesHeader (dropdown) | `console.log('Téléchargement du modèle CSV/Excel')` | Aucune |
| Suppression en masse | NotesHeader (dropdown) | `console.log('Suppression en masse...')` | Aucune |
| Voir les notes / Modifier les saisies | Semestre1Tab, Semestre2Tab (listes) | `router.push({ name: 'NotesEdition', params: {classeId, semestre, type} })` | Aucune (navigation) |
| Valider définitivement | Semestre1Tab | `console.log('Verrouillage définitif des CC...')` | Aucune |
| Voir les rattrapages / Saisir / Clôturer les rattrapages | rappel-s1 | `console.log(...)` (fonction `abrirSaisieRapide` avec faute de frappe corrigée en interne vers `ouvrirSaisieRapide`) | Aucune |
| **Publier le Procès-Verbal** | EditNotes/Notes.vue | `alert()` récapitulatif — **aucune sauvegarde**, désactivé si pas de matière/étudiants | Aucune (simulation locale) |
| Export résultats | DeliberationHeader | `console.log('Export des résultats')` | Aucune |
| Impression PV | DeliberationHeader | `window.print()` | Aucune |
| **Délibération** | DeliberationHeader | `console.log('Délibération des notes en cours...')` — **simulation locale, aucun calcul serveur déclenché** | Aucune |
| **Proclamer résultats** | DeliberationHeader (dropdown) | `console.log('Proclamation des résultats...')` — **simulation locale uniquement** | Aucune |
| Publier rapport | DeliberationHeader (dropdown) | `console.log('Publication du rapport...')` | Aucune |
| Annuler proclamation | DeliberationHeader (dropdown) | `console.log('Proclamation annulée')` | Aucune |
| Sélecteur Promotion (Délibérations) | DeliberationsContent | `processDeliberation()` — **calcule** la moyenne pondérée et la décision côté client à partir de `rawNotes` codé en dur | Aucune |
| **Clôturer & Verrouiller le Semestre** | DeliberationsContent | `alert()` récapitulatif — aucune persistance | Aucune |
| Rafraîchir (icône) | DeliberationsContent | Relance `processDeliberation()` sur les mêmes données mockées | Aucune |
| Sélecteur Promotion (Bulletins) | ProclamationContent | `loadPromotion()` charge une liste d'étudiants **codée en dur** | Aucune |
| Imprimer (bulletin unitaire) | ProclamationContent | `window.print()` | Aucune |
| Télécharger les packages (PDF ZIP) | ProclamationContent | `alert()` récapitulatif | Aucune |
| Actualiser | RapportContents | `console.log('Mise à jour des caches des rapports effectuée.')` | Aucune |
| Génération rapport (PDF/ZIP/Excel/Visualiser, 6 boutons) | RapportContents | `genererRapport(type)` → `console.log` + `alert()` | Aucune |
| Récupérer (historique) | RapportContents | `console.log('Téléchargement du document archivé ID...')` | Aucune |
| Raccourcis de prompts | AssistantIAContent | Préremplit et envoie une question à l'assistant | Aucune (réponses générées par correspondance de mots-clés en local, `setTimeout` 1200ms simulant une latence IA) |
| Envoi message (chat) | AssistantIAContent | `sendMessage()` — réponse **simulée** via `if/else` sur mots-clés, aucun appel à un service IA externe | Aucune |

#### 8. Formulaires

**Formulaire de saisie de notes — `Notes.vue` (rendu sous `/notes/:classeId/:semestre/:type/edit`)**

| Champ | Type | Source des options | Validation | Comportement |
|---|---|---|---|---|
| Classe / Promotion | `<select>` désactivé | `classeCodeAffiche` (résolu depuis `classeStore.classes` via `classeId` de l'URL) | Non modifiable (`disabled`) | Affiche l'UUID si la classe n'est pas encore trouvée dans le store |
| Matière (Pondération) | `<select v-model="session.matiere">` | `mockMatieres` (3 matières codées en dur avec coef et seuil) | Désactivé tant que `session.classe` n'est pas défini | Sélectionner une matière active la section stats et le tableau |
| Nature de l'Évaluation | `<select>` désactivé | Valeur fixe déduite de `props.typeEvaluation` (CC / SESSION_ORDINAIRE / RATTRAPAGE) | Non modifiable | Affichage seul |
| Note (par étudiant) | `<input type="number" step="0.25" min="0" max="20">` | — | Bornes HTML `min=0 max=20`, pas de validation JS explicite au-delà (aucune vérification bloquante si une valeur hors bornes est saisie manuellement/via clavier) | Style visuel rouge si `note < seuil` de la matière sélectionnée |
| Appréciation (par étudiant) | `<input type="text">` | — | Aucune validation (champ libre) | — |

**Payload de soumission** : `saveAllNotes()` ne construit et n'envoie **aucun payload réseau**. Il exécute :
```js
alert(`Validation du PV pour la classe [${session.value.classe}] - ${session.value.matiere.nom}.\nType : ${evaluationLabel.value}\nMoyenne calculée : ${statsSession.value.moyenne}/20.`);
```
**Comportement succès/échec** : il n'existe qu'un seul chemin (succès simulé via `alert`) ; aucune gestion d'erreur, timeout, ou retour serveur n'est implémentée puisqu'aucun appel HTTP n'est fait.

Aucun autre formulaire de saisie (matière, évaluation, session) n'a été trouvé dans les écrans routés du module Notes/Délibération. Les sélecteurs de classe/type de document dans `DeliberationsContent.vue`/`ProclamationContent.vue`/`RapportContents.vue` sont de simples filtres, sans soumission ni payload.

#### 9. Tableaux et tables de navigation

| Tableau | Écran | Source de données | Colonnes | API ou simulé |
|---|---|---|---|---|
| État global des évaluations | VueOverview.vue | `classeStore.classes` (réel) + statuts codés en dur | Classe, Filière, Saisie CC, Saisie Examens, Délibération | **Mixte** : classes réelles (API), statuts **simulés** (badges figés) |
| Liste des classes — Devoirs/Sessions/Rattrapages (S1) | devoir-s1/session-s1/rappel-s1 | `classeStore.classes` (réel) | Code Classe, Filière, Semestre, Type Évaluation, État de Saisie, Actions | **Mixte** : classes réelles, état de saisie **simulé** (`effectif_actuel % 2`) |
| Liste nominative des apprenants | Notes.vue (EditNotes) | `mockStudentsList` | Matricule, Nom & Prénom, Note (/20), Observations | **Entièrement simulé** |
| Procès-Verbal de Délibération | DeliberationsContent.vue | `rawNotes` → calculs locaux | Étudiant, Matière 1/2/3, Moy. Générale, Crédits ECTS, Décision du Jury | **Entièrement simulé** (calcul client) |
| Liste étudiants + Aperçu bulletin | ProclamationContent.vue | tableau en dur dans `loadPromotion()` | Nom, Matricule, Moyenne/Statut (liste) ; bulletin détaillé (aperçu) | **Entièrement simulé** |
| Historique des publications | RapportContents.vue | `mockLogs` | Document, Généré par, Date d'édition, Statut Coffre-Fort, Action | **Entièrement simulé** |
| Liste des Modules (non routé) | ModuleList.vue / AModuleList.vue | `useModuleStore` (méthodes/état **inexistants** dans le store réel) | Code, Désignation, Crédit, Coefficient, Volume Horaire, Actions | **Code cassé** — ni API réelle fonctionnelle ni simulation, appel à des propriétés de store non définies |

#### 10. Onglets

| Onglet parent | Sous-onglets | Composant | Contenu réel |
|---|---|---|---|
| NotesTabs | Vue d'ensemble | `VueOverview.vue` | Tableau récapitulatif classes (données réelles + statuts simulés) |
| NotesTabs | Semestre 1 | `Semestre1Tab.vue` | 3 sous-onglets fonctionnels : Devoirs, Sessions ordinaires, Sessions de rappels |
| ↳ Semestre1Tab | Devoirs | `devoir-s1.vue` | Liste classes, contexte CC |
| ↳ Semestre1Tab | Sessions ordinaires | `session-s1.vue` | Liste classes, contexte SESSION_ORDINAIRE |
| ↳ Semestre1Tab | Sessions de rappels | `rappel-s1.vue` | Liste classes, contexte RATTRAPAGE |
| NotesTabs | Semestre 2 | `Semestre2Tab.vue` | 3 sous-onglets présents dans le DOM mais **vides** |
| ↳ Semestre2Tab | Devoirs | `devoir-s2.vue` | **Fichier vide** (`<template></template>`) |
| ↳ Semestre2Tab | Sessions ordinaires | `session-s2.vue` | **Fichier vide** |
| ↳ Semestre2Tab | Sessions de rappels | `rappel-s2.vue` | **Fichier vide** |
| DeliberationTab | Délibérations | `DeliberationsContent.vue` | PV de délibération avec calcul de moyenne/décision simulé |
| DeliberationTab | Bulletins (id HTML `proclamation`) | `ProclamationContent.vue` | Génération/aperçu de bulletins simulés |
| DeliberationTab | Rapports | `RapportContents.vue` | Génération de rapports/PV simulés + historique |
| DeliberationTab | Assistant IA | `AssistantIAContent.vue` | Chat simulé par correspondance de mots-clés |

#### 11. Workflow métier complet

**`WF-NOTES-01` — Saisie et édition de notes**

1. L'utilisateur accède à `/notes` (`NotesView.vue`), onglet Semestre 1 (seul semestre réellement peuplé) ou Vue d'ensemble.
2. Il choisit un sous-onglet (Devoirs = CC, Sessions ordinaires = SESSION_ORDINAIRE, Sessions de rappels = RATTRAPAGE), affichant la liste des classes issues de `classeStore.classes`.
3. Il clique « Voir les notes » ou « Modifier les saisies » sur une classe → navigation vers `/notes/:classeId/:semestre/:type/edit` (route `NotesEdition`) avec les 3 paramètres transmis dans l'URL.
4. `EditNotes.vue` (wrapper) monte `Notes.vue`, qui résout le nom lisible de la classe depuis `classeStore`, initialise la session (`classe`, `matiere`, `typeDevoir`) et **charge une liste fictive d'étudiants** (`loadStudents()`).
5. L'utilisateur sélectionne une matière dans `mockMatieres` (déclenche l'affichage des statistiques de session et active le tableau).
6. Il saisit une note (0-20, pas 0.25) et une appréciation pour chaque étudiant ; toute note sous le seuil éliminatoire de la matière s'affiche en rouge (calcul client `isNoteEliminatoire`).
7. Les statistiques (moyenne, max, nombre d'alertes) se recalculent en temps réel (`computed statsSession`).
8. Il clique « Publier le Procès-Verbal » (actif seulement si une matière est sélectionnée et qu'il y a des étudiants) → **`alert()` de confirmation locale, aucune requête API, aucune donnée persistée**.
9. Il revient à la liste via « Retour à la liste » (`router.back()`).

*Étape absente du code actuel mais nécessaire pour une reconstruction fidèle* : appel à `notesApi.updateNote` / `noteStore.editNote` ou `notesApi.publierNotesEvaluation` / `noteStore.publishNotesEvaluation` (ces fonctions existent déjà dans `src/api/evaluations/notesApi.js` et `src/stores/evaluationStore/noteStore.js` mais ne sont invoquées nulle part dans l'UI de saisie).

**`WF-DELIBERATION-01` — Délibération et proclamation**

1. L'utilisateur accède à `/deliberations` (`deliberation.vue`), onglet par défaut « Délibérations » (`DeliberationsContent.vue`).
2. Il sélectionne une promotion dans `mockClasses` (liste fixe de 3 classes) → déclenche `processDeliberation()`.
3. `processDeliberation()` charge un jeu de notes brutes **codé en dur** (`rawNotes`, 4 étudiants fixes) et calcule pour chacun : moyenne pondérée (`(n1*2 + n2*2 + n3*3) / 7`), présence de note(s) éliminatoire(s) (seuils fixes 7/8/10 selon la matière), puis une décision (Admis / Rattrapage / Ajourné (Blâmé)) et des ECTS (14, 0 ou 6) selon les règles décrites en §15.
4. Les statistiques globales du jury (taux de réussite, moyenne de promotion, nombre de convoqués aux rattrapages, major de promotion) sont dérivées de ce calcul.
5. L'utilisateur peut cliquer « Clôturer & Verrouiller le Semestre » → `alert()` de confirmation, **aucune persistance**.
6. En parallèle, les boutons de l'en-tête (`DeliberationHeader.vue`) « Délibération », « Proclamer résultats », « Publier rapport », « Annuler proclamation » ne sont **pas connectés** au contenu de l'onglet actif : ce sont des `console.log()` indépendants, sans effet observable sur les données affichées.
7. L'utilisateur bascule vers l'onglet « Bulletins » (`ProclamationContent.vue`), sélectionne une promotion (même liste `mockClasses` dupliquée) et un type de document → `loadPromotion()` charge une **autre** liste d'étudiants codée en dur (déconnectée du calcul de l'étape 3) et affiche un aperçu de bulletin imprimable.
8. Il peut « Imprimer » (unitaire, `window.print()`) ou « Télécharger les packages (PDF ZIP) » (`alert()` de confirmation, aucun fichier généré).
9. L'onglet « Rapports » (`RapportContents.vue`) permet de filtrer par année/semestre/type de session et de déclencher la « génération » de 6 types de documents (PV global, PV par matière, registre des admis, stats de réussite, bilan des échecs, tableau d'honneur) — chaque bouton exécute uniquement un `alert()` de confirmation.
10. L'onglet « Assistant IA » permet de poser des questions en langage naturel ; les réponses sont des textes **prérédigés**, sélectionnés par correspondance de mots-clés (`includes()`) sur la question, sans lien réel avec les données du jury.

*Étapes absentes du code actuel mais nécessaires pour une reconstruction fidèle* : appels à `resultatApi.getBulletinsByClasse`, `resultatApi.updateDecisionJury`, `resultatApi.publierBulletinsClasse` (ou `useResultatStore` équivalent — déjà codés, jamais utilisés dans ces vues).

#### 12. Cas d'utilisation

**`UC-NOTES-01` — Saisir les notes d'une classe pour une évaluation**
- Acteur : Personnel de scolarité (rôle probable à confirmer)
- Précondition : la classe existe dans `classeStore` ; l'utilisateur a navigué depuis un des sous-onglets Semestre 1 (Semestre 2 non fonctionnel)
- Scénario nominal : navigue vers la liste de classes → clique Voir/Modifier → sélectionne une matière → saisit notes/appréciations → clique Publier le PV → confirmation locale (`alert`)
- Scénario alternatif : bouton Publier désactivé si aucune matière sélectionnée ou aucun étudiant chargé
- Postcondition réelle dans le code : **aucune** (rien n'est persisté) — postcondition attendue en reconstruction : notes enregistrées côté serveur, PV horodaté

**`UC-NOTES-02` — Consulter l'état de complétude des saisies**
- Acteur : Personnel de scolarité / Direction pédagogique
- Scénario : ouvre `/notes`, onglet Vue d'ensemble → consulte le tableau par classe
- Limite actuelle : les colonnes Saisie CC / Saisie Examens / Délibération affichent des badges **statiques**, identiques pour toutes les classes, sans lien avec l'avancement réel des saisies

**`UC-DELIBERATION-01` — Délibérer une promotion**
- Acteur : Jury de délibération (rôle probable à confirmer)
- Précondition : sélectionner une promotion dans la liste figée `mockClasses`
- Scénario nominal : sélection promotion → calcul automatique (moyenne pondérée, ECTS, décision) → consultation du PV → clôture du semestre (`alert` de confirmation)
- Postcondition réelle : **aucune persistance** ; à la fermeture/rechargement de la page, tout est réinitialisé

**`UC-DELIBERATION-02` — Proclamer les résultats et générer les bulletins**
- Acteur : Jury de délibération / Personnel de scolarité
- Scénario : onglet Bulletins → sélection promotion → sélection étudiant → aperçu bulletin → impression ou export ZIP simulé
- Limite : le jeu d'étudiants de cet onglet est **indépendant** de celui calculé dans l'onglet Délibérations (deux `mock` distincts), il n'y a donc pas de continuité de données entre délibération et proclamation dans le code actuel

**`UC-DELIBERATION-03` — Générer un rapport/PV officiel**
- Acteur : Personnel de scolarité / Direction pédagogique
- Scénario : onglet Rapports → filtre année/semestre/session → clique sur un des 6 boutons de génération → confirmation `alert()`
- Limite : aucun fichier n'est réellement produit ni téléchargé

**`UC-DELIBERATION-04` — Interroger l'assistant IA sur l'état des notes/délibérations**
- Acteur : tout utilisateur ayant accès à `/deliberations`
- Scénario : saisit une question ou clique un raccourci → réponse générée localement par correspondance de mots-clés (statistiques, retards, taux de réussite, rachats, proclamations) après un délai simulé de 1200 ms
- Limite : pas d'appel à un service IA externe ni aux données réelles de l'application ; les chiffres cités dans les réponses sont **fixes et rédigés en dur** dans le composant

#### 13. Données manipulées

| Entité | Champs observés dans le code | Origine | Statut |
|---|---|---|---|
| **Note** | `matricule`, `nom`, `note` (0-20, pas 0.25), `appreciation` | `mockStudentsList` (Notes.vue) | Simulé |
| **Évaluation** | `matiere` (`nom`, `coef`, `seuil`), `typeEvaluation` (CC/SESSION_ORDINAIRE/RATTRAPAGE), `semestre` | `mockMatieres`, params URL | Simulé (matières) / réel (params URL) |
| **Session (d'évaluation)** | `id`, gestion d'état via `changeSessionEtat` | `sessionStore.js`/`evaluationApi.js` (CRUD complet) | **API/Store définis mais non utilisés dans ce module** (utilisé ailleurs, dans `src/views/examens/planification/`) |
| **Résultat / Bulletin** | `matricule`, `nom`, `n1`, `n2`, `n3`, `moyenne`, `ects`, `decision`/`statut` | `rawNotes` (DeliberationsContent), tableau distinct dans `loadPromotion()` (ProclamationContent) | Simulé, deux jeux de données non synchronisés |
| **Module/Matière (UE)** | `code`, `designation`, `credit`, `coefficient`, `volume_horaire`, `responsable_id`, `filieres_classes` | `moduleApi.js` (via `moduleStore`, orphelin car module Matières non routé) ; `mockMatieres` simplifié (`nom`, `coef`, `seuil`) côté Notes | Mixte — API définie côté backend contract mais store cassé (méthodes manquantes) et vue non routée |
| **Délibération / Décision de jury** | `decision` (Admis / Rattrapage / Ajourné (Blâmé)), `ects` (14 / 0 / 6) | Calcul client `processDeliberation()` | Simulé (règle de calcul documentée en §15) |
| **Classe** | `classe_id`/`id`, `classe_code`/`code`, `filiere_nom`, `effectif_actuel` | `useClasseStore` (réel, API classes hors périmètre notes) | Réel (seule entité réellement chargée via API dans ce module) |

#### 14. API et intégration backend

**API réellement câblées dans les stores dédiés (mais non consommées par les écrans du module Notes/Délibération) :**

| Fonction | Fichier | Verbe / URL | Store associé | Consommé par une vue de ce module ? |
|---|---|---|---|---|
| `createEvaluation` | `evaluationApi.js` | `POST /evaluations/evaluation` | `useEvaluationStore` | Non |
| `getEvaluations` | `evaluationApi.js` | `GET /evaluations/evaluation` | `useEvaluationStore` | Non |
| `getEvaluationById` | `evaluationApi.js` | `GET /evaluations/evaluation/{id}` | `useEvaluationStore` | Non |
| `updateEvaluation` | `evaluationApi.js` | `PUT /evaluations/evaluation/{id}` | `useEvaluationStore` | Non |
| `deleteEvaluation` | `evaluationApi.js` | `DELETE /evaluations/evaluation/{id}` | `useEvaluationStore` | Non |
| `createSession` | `evaluationApi.js` | `POST /evaluations/sessions-evaluations/` | `useSessionStore` | Non (utilisé uniquement dans le module Examens/Planification) |
| `getSessions` | `evaluationApi.js` | `GET /evaluations/sessions-evaluations/` | `useSessionStore` | Non |
| `getSessionById` | `evaluationApi.js` | `GET /evaluations/sessions-evaluations/{id}` | `useSessionStore` | Non |
| `updateSession` | `evaluationApi.js` | `PUT /evaluations/sessions-evaluations/{id}` | `useSessionStore` | Non |
| `deleteSession` | `evaluationApi.js` | `DELETE /evaluations/sessions-evaluations/{id}` | `useSessionStore` | Non |
| `changeSessionEtat` | `evaluationApi.js` | `PATCH /evaluations/sessions-evaluations/{id}/etat` | `useSessionStore` | Non |
| `getNotesByEvaluation` | `notesApi.js` | `GET /evaluations/evaluations/{evaluationId}/notes` | `useNoteStore` | Non |
| `publierNotesEvaluation` | `notesApi.js` | `PATCH /evaluations/evaluations/{evaluationId}/notes/publier` | `useNoteStore` | Non |
| `getNotesByEtudiant` | `notesApi.js` | `GET /evaluations/etudiants/{etudiantId}/notes?semestreId=` | `useNoteStore` | Non |
| `updateNote` | `notesApi.js` | `PUT /evaluations/notes/{id}` | `useNoteStore` | Non |
| `getBulletinsByClasse` | `resultatApi.js` | `GET /evaluations/resultats/classes/{classeId}/bulletins` | `useResultatStore` | Non |
| `getBulletinEtudiant` | `resultatApi.js` | `GET /evaluations/resultats/etudiants/{etudiantId}/bulletins/{semestreId}` | `useResultatStore` | Non |
| `updateDecisionJury` | `resultatApi.js` | `PUT /evaluations/resultats/bulletins/{id}/decision` | `useResultatStore` | Non |
| `publierBulletinsClasse` | `resultatApi.js` | `PATCH /evaluations/resultats/classes/{classeId}/bulletins/publier` | `useResultatStore` | Non |
| `getSemestresConfiguration` | `moduleApi.js` | `GET /academique/modules/configuration/semestres` | `useModuleStore` | Non (module Matières non routé) |
| `getUesByConfiguration` | `moduleApi.js` | `GET /academique/modules/configuration/details` | `useModuleStore` | Non |
| `detachUeFromConfig` | `moduleApi.js` | `DELETE /academique/modules/configuration/detacher/{attributionId}` | `useModuleStore` | Non |
| `assignModuleToClasse` | `moduleApi.js` | `POST /academique/modules/assigner` | `useModuleStore` | Non |
| `createModule` | `moduleApi.js` | `POST /academique/modules` | `useModuleStore` | Non |
| `updateModule` | `moduleApi.js` | `PUT /academique/modules/{id}` | `useModuleStore` | Non |
| `deleteModule` | `moduleApi.js` | `DELETE /academique/modules/{id}` | `useModuleStore` | Non |

Base URL des clients Axios (`src/api/config/apiClients.js`) : `evaluationApi` → préfixe `/evaluations` ; `academiqueApi` → préfixe `/academique`.

**Constat majeur** : le module Notes/Évaluations/Délibérations dispose d'une couche API + store Pinia CRUD **complète et cohérente** (`evaluationApi.js`, `notesApi.js`, `resultatApi.js` + leurs stores), mais **aucun composant Vue routé** (`/notes`, `/notes/.../edit`, `/deliberations`) ne les importe ni ne les appelle. Le seul store réellement utilisé par ce module est `useClasseStore` (pour lister/résoudre les classes). Le store `useModuleStore` référencé par le sous-module Matières (non routé) est en outre **incomplet** vis-à-vis de ce que ses propres composants attendent (`fetchModules`, `modules`, `fetchModuleById`, `module` sont utilisés dans le code mais absents de la définition du store) — incohérence à corriger lors de la reconstruction, indépendamment du fait que le module ne soit pas routé.

#### 15. Règles métier détectées

- **RM-NOTES-01 — Bornage de la note** : chaque note saisie est bornée par les attributs HTML `min="0"` `max="20"` `step="0.25"` (composant `Notes.vue`) ; aucune validation JavaScript bloquante additionnelle n'a été identifiée.
- **RM-NOTES-02 — Seuil éliminatoire par matière** : chaque matière simulée porte un `seuil` (7, 7 ou 10 selon la matière dans les jeux de données observés) ; une note strictement inférieure à ce seuil est signalée visuellement comme éliminatoire (`isNoteEliminatoire`), mais **n'empêche pas** la saisie ni la « publication » du PV.
- **RM-NOTES-03 — Statut de saisie par classe (Vue d'ensemble et onglets Semestre 1)** : le badge d'état de saisie (« Validé & Clos » vs « En cours ») est déterminé par `classe.effectif_actuel % 2 === 0` — **règle factice sans signification métier**, à ne pas reproduire telle quelle dans la reconstruction ; elle doit être remplacée par un véritable indicateur de complétude (ex. nombre de notes saisies / effectif attendu).
- **RM-DELIBERATION-01 — Calcul de la moyenne pondérée** : `moyenne = (n1 × coef1 + n2 × coef2 + n3 × coef3) / (coef1 + coef2 + coef3)`, avec dans l'exemple observé coef1=2 (Matière « Frameworks Modernes »), coef2=2 (« Conception orientée objet »), coef3=3 (« Deep Learning »), soit un diviseur total de 7. Cette pondération est **codée en dur** dans `DeliberationsContent.vue` pour un jeu de 3 matières fixes ; elle n'est pas généralisée à un nombre variable de matières/UE.
- **RM-DELIBERATION-02 — Seuils éliminatoires par matière (délibération)** : notes éliminatoires si `n1 < 7` OU `n2 < 8` OU `n3 < 10` (valeurs codées en dur, différentes des seuils utilisés côté saisie de notes — incohérence entre `Notes.vue` et `DeliberationsContent.vue` à clarifier lors de la reconstruction).
- **RM-DELIBERATION-03 — Décision du jury** :
  - si `moyenne < 10` → décision **« Rattrapage »**, ECTS attribués = 0 ;
  - sinon si au moins une note éliminatoire → décision **« Ajourné (Blâmé) »**, ECTS attribués = 6 (validation partielle des UE saines) ;
  - sinon → décision **« Admis »**, ECTS attribués = 14 (total du semestre d'exemple).
- **RM-DELIBERATION-04 — Statut « Proclamé »/« Non proclamé »** : **aucun champ ni indicateur de statut de proclamation n'a été trouvé dans le code** (pas de flag `proclame`/`publie` sur les entités manipulées). Les actions « Proclamer résultats » et « Annuler proclamation » de `DeliberationHeader.vue` ne modifient aucun état observable ; elles se contentent d'un `console.log`. Il n'existe donc pas, dans l'état actuel du code, de véritable machine à états Non-Proclamé → Proclamé → Annulé.
- **RM-NOTES-04 — Publication (store `useNoteStore`)** : la fonction `publishNotesEvaluation` (store) confirme métier la notion de « publication » de notes (distincte de la simple saisie) côté API prévue (`PATCH /evaluations/{id}/notes/publier`), mais cette règle **n'est pas exposée dans l'UI actuelle** du module Notes (aucun bouton n'appelle cette action).
- **RM-MATIERES-01 — Coefficient/Crédit des modules** : le modèle `Module` prévoit `code`, `designation`, `credit`, `coefficient`, `volume_horaire`, `responsable_id`, `filieres_classes` (vu dans `DetailItem.vue`/`DetailsPanel.vue`), cohérent avec l'usage de `coefficient` dans le calcul de moyenne pondérée en délibération — mais ce module n'étant pas routé, cette structure n'est pas exploitée dynamiquement par le calcul actuel (qui utilise des coefficients codés en dur, non liés à un référentiel Module réel).

---

#### Points à confirmer

- Rôles/permissions réels (RBAC) associés à chaque action (aucun mécanisme de garde par rôle trouvé dans les fichiers lus — à vérifier au niveau du routeur global ou d'un éventuel store d'authentification hors périmètre de cette lecture).
- Existence réelle des modals `#addNoteModal` et `#importModal` référencées par `NotesHeader.vue` (non localisées dans l'arborescence explorée — peut-être supprimées ou jamais implémentées).
- Intention derrière la duplication de listes de classes/étudiants mockées entre `DeliberationsContent.vue` et `ProclamationContent.vue` (deux sources différentes, non synchronisées) : bug de développement ou choix temporaire en attendant le branchement API ?
- Statut du sous-module Matières/Modules (`src/views/matieres/`) : code non routé et store (`useModuleStore`) incohérent avec les composants qui l'utilisent (`fetchModules`, `modules`, `fetchModuleById`, `module` absents de la définition du store) — à clarifier s'il s'agit d'un chantier abandonné, d'un module à finaliser, ou de code à supprimer.
- Devenir des fichiers vides `devoir-s2.vue`, `rappel-s2.vue`, `session-s2.vue`, `RapportsTab.vue` : à compléter (miroir du Semestre 1) ou à supprimer s'ils sont dupliqués par `RapportContents.vue`.
- Faute de frappe dans le nom de route `Deiberations` (`src/routes/others.routes.js`) : à corriger en `Deliberations` lors de la reconstruction (actuellement sans impact fonctionnel car le nom de route n'est pas réutilisé dans une navigation programmatique observée).

---

### Module : Examens

Documentation exhaustive basée sur la lecture intégrale du code source réel (`src/views/examens/**`, `src/routes/examens.routes.js`, `src/stores/evaluationStore/sessionStore.js`, `src/api/evaluations/evaluationApi.js`, et stores connexes `anneStore.js` / `semestreStore.js` importés par les composants du module). Toute donnée non vérifiable dans le code est explicitement signalée.

---

#### 1. Objectif métier

Le module « Examens » a pour objectif de couvrir le cycle de gestion des évaluations académiques d'un établissement LMD :
- Créer et gérer des **sessions d'examen** (session normale / session de rattrapage) rattachées à une année académique et un semestre.
- **Planifier** les épreuves (CC, Examen Normal, Rattrapage) par matière/module au sein d'une session, avec dates, heures, durée, pondération et salle.
- Visualiser un **calendrier** consolidé des épreuves planifiées (session normale et rattrapage).
- Répartir automatiquement les étudiants dans des **salles d'examen** à partir de listes Excel/CSV importées (algorithme de répartition côté client).
- Produire des **rapports** de résultats et de déroulement d'examens (fonctionnalité affichée mais non implémentée — voir §6 et §9).

Le module est accessible via 4 entrées de menu (Planification, Calendrier, Salles & horaires, Rapports) regroupées sous un groupe de menu « Examens » dans la barre latérale, plus une route racine `/examens` non reliée au menu (voir §4).

#### 2. Acteurs concernés

Aucun mécanisme RBAC (rôles/permissions) n'est visible dans le code du module ni dans le routeur (`src/routes/main.js` n'applique qu'un `meta: { requiresAuth: true }` global, sans restriction par rôle). Les acteurs ci-dessous sont donc déduits des libellés fonctionnels et des messages d'interface, à titre de **rôle probable à confirmer** :

- **Responsable des examens / Scolarité** (rôle probable à confirmer) — crée les sessions, planifie les évaluations, consulte les rapports. Le champ libre « Responsable / Entité Organisatrice » du formulaire `AddSession` (ex. « Scolarité Centrale », « Direction des Études ») suggère ce rôle sans l'imposer via un contrôle d'accès technique.
- **Responsable logistique / Gestion des salles** (rôle probable à confirmer) — utilise l'écran Salles & horaires pour importer les listes d'étudiants et lancer la répartition automatique.
- **Enseignant / Surveillant** (rôle probable à confirmer) — mentionné uniquement dans des composants orphelins (`ExamPlanningModal.vue`, `DetailPlan.vue`) sous forme de champ « surveillant(s) », jamais exposé dans un écran réellement monté (voir §6, §9).
- **Étudiant** — n'apparaît dans aucun composant de ce module (uniquement comme donnée importée en masse via fichier Excel pour la répartition des salles).

Aucun contrôle technique ne restreint ces écrans à un rôle particulier ; tout utilisateur authentifié (`requiresAuth: true`) peut y accéder.

#### 3. Menus et sous-menus associés

Extrait de `src/components/partials/sidebar.vue` (groupe « Examens ») :

| Libellé menu | Route cible | Icône / structure |
|---|---|---|
| Examens (groupe parent, dépliable) | — | `mdi mdi-book-open` |
| ↳ Planification | `/planification-examens` | lien enfant |
| ↳ Calendrier | `/calendrier-examens` | lien enfant |
| ↳ Salles & horaires | `/salles-horaires` | lien enfant |
| ↳ Rapports | `/rapport-examens` | lien enfant |

Le tableau `examens: ['/planification-examens', '/calendrier-examens', '/salles-horaires', '/rapport-examens']` (fin du fichier `sidebar.vue`) sert à déterminer l'état « actif » du groupe de menu (`isMenuActive`). La route `/examens` **n'apparaît pas** dans ce tableau ni ailleurs dans le sidebar.

#### 4. Pages et routes associées

Source : `src/routes/examens.routes.js`, monté sous `DefaultLayout` avec `meta: { requiresAuth: true }` (`src/routes/main.js`).

| Route | Nom de route | Composant | Visible dans le sidebar | Remarque |
|---|---|---|---|---|
| `/examens` | `Examens` | `src/views/examens/Examens.vue` | **Non** | Route présente mais non visible dans le menu. Aucun lien interne (`router-link`, `router.push`) vers `/examens` n'a été trouvé dans tout le dépôt frontend — la route n'est donc atteignable que par saisie directe de l'URL. |
| `/planification-examens` | `PlanificationExamens` | `src/views/examens/planification/Planification.vue` | Oui | Écran liste des sessions d'examen |
| `/planification-examens/:id/evaluations` | `EvaluationsExamens` | `src/views/examens/planification/components/tabs/PlanExamen.vue` | Non (atteint par navigation depuis la liste) | Le paramètre `:id` est lu via `route.params.id` (`useRoute()`), **pas** via `props: true` (non déclaré dans `examens.routes.js`) |
| `/calendrier-examens` | `CalendrierExamens` | `src/views/examens/calendrier/Calendrier.vue` | Oui | |
| `/salles-horaires` | `SallesExamens` | `src/views/examens/salles/Salles.vue` | Oui | |
| `/rapport-examens` | `RapportExamens` | `src/views/examens/rapports/RapportExamens.vue` | Oui | |

**Point notable** : `Examens.vue` (route `/examens`) importe et affiche directement `<Planification />` puis `<Calendrier />` à la suite l'un de l'autre (voir §6) — c'est donc une page composite qui duplique le contenu des routes `/planification-examens` et `/calendrier-examens` sur une seule page, sans lien de menu pour y accéder.

#### 5. Description fonctionnelle complète

Le module se compose de 5 sous-ensembles fonctionnels indépendants, reliés uniquement par la notion de « session d'examen » (`useSessionStore`) :

1. **Planification** (`/planification-examens`) : liste des sessions d'examen (normales/rattrapage), filtrables par semestre (Tout / Impairs / Pairs) et par type, avec actions Ajouter / Modifier / Supprimer / Détails / « Planifier Examens ». Les données proviennent réellement de l'API (`useSessionStore` → `evaluationApi.js`).
2. **PlanExamen (détail d'une session)** (`/planification-examens/:id/evaluations`) : écran de configuration fine des évaluations (CC / Normal / Rattrapage) par module/matière d'une classe, avec sélection en cascade Filière → Classe → Matière. **Entièrement simulé** (aucun appel API, données `fetchSessionDetails`/`fetchAcademicData` codées en dur, sauvegarde qui ne fait qu'un `console.log`).
3. **Calendrier** (`/calendrier-examens`) : vue tabulaire des épreuves planifiées (onglets « Session normale » / « Session rattrapage »), avec filtres Filière/Classe/Type/Recherche. **Entièrement simulé** (`calendarEvents` codé en dur dans `CalendrierEvaluation.vue`) ; l'onglet « Session rattrapage » est un composant vide (`CalendrierRappel.vue`, template vide).
4. **Salles & horaires** (`/salles-horaires`) : import de fichiers Excel/CSV d'étudiants (librairie `xlsx`), configuration du nombre de salles et de la capacité par salle, algorithme de répartition (mélange complet / par classe / mélange intra-classe) exécuté **entièrement côté client**, puis export du résultat en Excel. Aucun appel API.
5. **Rapports** (`/rapport-examens`) : page à deux onglets (« Résultats », « Rapports ») dont le contenu est **un tableau HTML statique affichant toujours « Aucune donnée »**, sans logique ni appel API dans les composants enfants.

Un dossier `semestres/` contient 3 composants (`TabSemestre1.vue`, `TabSemestre2.vue`, `TabTout.vue`) qui affichent des listes de modules codées en dur ; **ils ne sont importés par aucun autre fichier du dépôt** (vérifié par recherche globale) — code mort/orphelin, non accessible depuis l'UI.

De même, plusieurs composants du dossier `calendrier/components/modal/` et `calendrier/components/detail/` (`AddCalendrier.vue`, `AddPlanning.vue`, `addPlannification.vue`, `ExamPlanningModal.vue`, `DetailExamen.vue`, `DetailPlan.vue`) ainsi que `src/views/examens/Header.vue` **ne sont référencés par aucun autre composant du module ni du dépôt** — ce sont des écrans/formulaires développés mais jamais branchés à l'UI active. Ils sont documentés ci-dessous à titre d'inventaire (fonctionnalités prévues/abandonnées) mais signalés comme non accessibles.

#### 6. Interfaces du module

##### Écran : Examens (`/examens`, `Examens.vue`)
- **But** : page composite non listée dans le menu.
- **En-tête** : titre statique « Gestion des Examens », fil d'Ariane statique (« Portail / Examens »), bouton « Imprimer » (aucun handler câblé — pas d'attribut `@click`), bouton « + Ajouter » (`data-bs-target="#exampleModal"`, mais **aucun élément avec `id="exampleModal"` n'existe dans ce fichier ni dans ses enfants** — le modal Bootstrap ciblé n'existe pas, bouton non fonctionnel), menu déroulant « Importer fichier » (lien `href="#drag-drop-area"`, ancre inexistante dans ce composant).
- **Corps** : affiche successivement le composant `Planification` complet, puis le composant `Calendrier` complet (deux blocs de page l'un sous l'autre).
- **Champs** : aucun (page de composition uniquement).
- **Données** : aucune donnée propre ; délègue aux composants enfants.
- **Remarque** : `src/views/examens/Header.vue` est un doublon statique du même en-tête, mais n'est importé nulle part (orphelin).

##### Écran : Planification (`/planification-examens`, `Planification.vue`)
- **En-tête** (`components/HeaderView.vue`) : titre « Planification des Évaluations », fil d'Ariane, menu « ⋮ » (Exporter Excel — `console.log` uniquement, non implémenté ; Imprimer la liste — `window.print()` réel ; Configuration — lien mort `href="#"`), bouton « + Ajouter un nouveau » ouvrant la modal Bootstrap `#createSessionModal` (composant `AddSession.vue`, monté ici).
- **Onglets** : « Tout » / « Semestres 1 » (impairs) / « Semestres 2 » (pairs) — bascule une variable locale `activeSemesterGroup` (0/1/2), pas des routes distinctes.
- **Corps** (`ExamenList.vue`) : boutons de filtre secondaire « Normal » / « Rattrapage » (`selectedType`), tableau des sessions filtrées (voir §9).
- **Champs affichés par ligne** : Code (badge = `semestre_code`), Désignation, État (badge coloré actif/brouillon), Date début, Date fin, Responsable (« Non assigné » si vide), Actions (menu `DetailsItem.vue`).
- **Données** : réelles, via `useSessionStore().sessions` alimenté par `GET /evaluations/sessions-evaluations/`.
- **États vides / chargement** : spinner Bootstrap pendant `loading` ; ligne « Aucun examen ne correspond à ces critères » avec image `/img/empty-box.svg` si liste filtrée vide.

##### Écran : PlanExamen — détail planification (`/planification-examens/:id/evaluations`, `PlanExamen.vue`)
- **En-tête** : fil d'Ariane (Sessions / Planification), titre = désignation de la session courante (« Chargement de la session... » si non encore chargée), période affichée (date_debut → date_fin), bouton Retour (`router.back()`), bouton « Enregistrer tout » (`saveAllPlanifications`).
- **Filtres** : Filière → Classe (cascade), Statut d'archive (« Clôturé » / « Annulé » — filtre déclaré mais **non appliqué** dans aucun computed du fichier : le `filters.status` n'est référencé dans aucune logique de filtrage effective).
- **Panneau gauche** : liste des « Matières à configurer » de la classe sélectionnée, avec badge de statut par module (« Vide » / « Modifié » / « Planifié » calculé localement selon `activeEvaluations`).
- **Panneau droit** : formulaire de configuration du module sélectionné, 3 blocs « type d'évaluation » (CC / Examen Normal / Rattrapage) activables individuellement via interrupteur, chacun avec : Date de l'épreuve (bornée par `min`/`max` = dates de la session), Heure de début, Durée (minutes), Pondération (%), Salle (texte libre).
- **Validation locale** : la date doit être comprise dans la période de la session (`validateEvalDates`), sinon `is-invalid` + message « Hors période session » et bouton « Valider ce module » désactivé (`hasLocalErrors`).
- **Données** : `currentSession`, `filieres`, `allClasses`, `allModules` sont **tous codés en dur** dans `fetchSessionDetails()` / `fetchAcademicData()` — aucun appel API, y compris pour charger la session réelle correspondant à `:id` (l'ID de route n'est utilisé que comme `session_id` dans le payload de sauvegarde simulée).
- **Sauvegarde** : `saveModuleConfig` marque localement les évaluations comme « configurées » (pas de backend) ; `saveAllPlanifications` construit un payload `{ session_id, planifications }` et se contente d'un `console.log` + notification de succès factice — **aucun appel réseau réel**.

##### Écran : Calendrier (`/calendrier-examens`, `Calendrier.vue`)
- **En-tête** (`components/HeaderView.vue`) : titre « Calendrier des Évaluations », bouton Retour, bouton « Actualiser » (`refreshCalendar` appelle `fetchCalendarEvents()` — **fonction non importée/non définie dans ce composant**, ce qui provoquerait une `ReferenceError` au clic ; bug constaté dans le code).
- **Onglets** (`CalendrierTab.vue`) : « Session normal » (composant `CalendrierEvaluation.vue`) et « Session rattrapage » (composant `CalendrierRappel.vue`, **template vide**, aucun contenu).
- **Filtres (onglet Session normal)** : Filière, Classe (dépendante de la filière), Type d'épreuve (Normal/Rattrapage), Recherche texte libre (salle, code/nom matière).
- **Tableau** : Date & Heure, Classe, Matière (nom + code), Type (badge), Durée (minutes), Salle/Lieu (« Non spécifiée » si absent), Actions (Modifier — `console.log` seulement ; Supprimer — `confirm()` + retrait local du tableau + notification succès).
- **Données** : `filieres`, `allClasses`, `calendarEvents` **codés en dur** dans `fetchAcademicStructures()` / `fetchCalendarEvents()` (3 événements d'exemple). Aucun appel API.
- **État vide** : icône + message « Aucune épreuve planifiée » si la liste filtrée est vide.

##### Écran : Salles (`/salles-horaires`, `Salles.vue`)
- **En-tête** (`components/HeaderView.vue`) : titre « Gestions Salles et Horaires », boutons Retour / Actualiser (même bug `fetchCalendarEvents()` non défini que sur Calendrier).
- **Bloc « 1. Critères de Configuration »** : champ numérique « Salles Disponibles » (`roomCount`, défaut 5), champ numérique « Capacité Maximale / Salle » (`capacityPerRoom`, défaut 20), sélecteur « Mode de Répartition » (Mélanger toutes les classes / Regrouper par classe / Mélanger à l'intérieur de chaque classe).
- **Bloc « 2. Fichiers Étudiants »** : zone drag-and-drop + sélecteur de fichiers (`.xlsx`, `.csv`, multiple), liste des fichiers importés avec suppression individuelle.
- **Bloc « 3. Statut & Analyse Capacité »** : compteurs « Étudiants Importés » / « Places Disponibles », message d'alerte dynamique (attente / capacité insuffisante / capacité conforme), bouton « Lancer la Répartition Automatique » (désactivé tant que `canDistribute` est faux).
- **Résultats** : accordéon par salle affichant le tableau des étudiants affectés (N°, Nom & Prénoms, Classe Assignée), bouton « Exporter la feuille Excel (.xlsx) ».
- **Données** : parsing réel du fichier via la librairie `xlsx` (`XLSX.read`, `sheet_to_json`), colonnes reconnues : `Nom`/`nom`/`LASTNAME`, `Prénom`/`prenom`/`FIRSTNAME`, `Classe`/`classe`/`CLASS` (défaut « Inconnue »). Algorithme de répartition **entièrement exécuté côté client**, aucun appel API — aucune persistance serveur du résultat (seul un export `.xlsx` local via `XLSX.writeFile`).

##### Écran : RapportExamens (`/rapport-examens`, `RapportExamens.vue`)
- **En-tête** (`components/RapportHeader.vue`) : titre « Rapports des Examens », boutons icônes (téléchargement, historique/horloge, ajout — **aucun n'a de handler `@click`**), bouton « Générer un rapport » (**aucun handler `@click`**).
- **Chargement** : `SkeletonLoader` (type table) affiché 3 secondes (`setTimeout`) avant affichage du contenu — simulation de chargement, sans appel API réel ; seule donnée peuplée (`formateurs`) n'est utilisée par aucun composant enfant affiché.
- **Onglets** (`RapportTab.vue`) : « Résultats » (`ResultatContent.vue`) et « Rapports » (`RapportContent.vue`). Deux onglets HTML supplémentaires (`id="sales"`, `id="purchases"`) référencent des composants `<StatsAcademique />` et `<StatsRapport />` **non importés dans le `<script setup>`** (composants inexistants/non résolus) et sans `nav-link` correspondant pour les activer — code mort/cassé si jamais rendu.
- **Contenu des deux onglets actifs** : tableaux HTML **statiques**, sans script, affichant systématiquement une ligne « Aucune donnée » avec image `/img/empty-box.svg`. Aucune donnée, aucun binding, aucun appel API.

#### 7. Boutons et actions

| Bouton / action | Écran | Handler | Comportement réel |
|---|---|---|---|
| Imprimer | Examens.vue | aucun | Non câblé, aucun effet |
| + Ajouter | Examens.vue | `data-bs-target="#exampleModal"` | Cible un modal inexistant, non fonctionnel |
| Importer fichier | Examens.vue | lien `#drag-drop-area` | Ancre inexistante, non fonctionnel |
| + Ajouter un nouveau | Planification (HeaderView) | ouvre modal `#createSessionModal` | Fonctionnel — ouvre `AddSession.vue` |
| Exporter Excel | Planification (HeaderView) | `exportToExcel()` | `console.log` uniquement — non implémenté |
| Imprimer la liste | Planification (HeaderView) | `printTable()` | `window.print()` réel |
| Configuration | Planification (HeaderView) | aucun | Lien mort `href="#"` |
| Onglets Tout/Sem.1/Sem.2 | Planification | `activeSemesterGroup = n` | Filtre local réel (parité du numéro de semestre extrait du `semestre_code`) |
| Boutons Normal/Rattrapage | ExamenList | `setType(value)` | Filtre local réel sur `type_session` |
| Menu ⋮ → Planifier Examens | DetailsItem (planification) | `goToPlanning()` | `router.push('/planification-examens/:id/evaluations')` |
| Menu ⋮ → Détails | DetailsItem | `isDetailsVisible = true` | Ouvre modal de détails (teleport), affiche les champs de la session |
| Menu ⋮ → Modifier | DetailsItem | `$emit('edit', item)` | Émission d'événement vers `ExamenList.handleEdit` → `sessionStore.fetchSessionById(item.id)` (charge la session dans le store, **mais aucun formulaire d'édition n'est câblé/ouvert** en conséquence dans le code lu — le `data-bs-target="#exampleModal-edit"` cible un modal non défini dans les fichiers du module) |
| Menu ⋮ → Supprimer | DetailsItem | `$emit('delete', item)` | `ExamenList.handleDelete` → `confirm()` puis `sessionStore.removeSession(item.id)` (appel API réel `DELETE /evaluations/sessions-evaluations/:id`) |
| Enregistrer la Session (submit) | AddSession | `handleSubmit()` | Valide dates puis `sessionStore.addSession(form)` → `POST /evaluations/sessions-evaluations/` réel |
| Retour | PlanExamen, Calendrier (HeaderView), Salles (HeaderView) | `router.back()` | Fonctionnel |
| Enregistrer tout | PlanExamen | `saveAllPlanifications()` | Simulation (`console.log` + notification), aucun appel réseau |
| Valider ce module | PlanExamen | `saveModuleConfig()` | Marque localement `isConfigured = true`, aucun appel réseau |
| Actualiser | Calendrier / Salles (HeaderView) | `refreshCalendar()` | **Bug** : appelle `fetchCalendarEvents()` non défini dans ces fichiers → erreur JS au clic |
| Modifier (épreuve) | CalendrierEvaluation | `editEvent(event)` | `console.log` uniquement — non implémenté |
| Supprimer/Annuler (épreuve) | CalendrierEvaluation | `deleteEvent(event)` | `confirm()` + retrait local du tableau réactif (pas d'appel API) |
| Lancer la Répartition Automatique | Salles | `distributeStudents()` | Algorithme côté client réel (voir §11) |
| Exporter la feuille Excel | Salles | `exportResults()` | Génère et télécharge un `.xlsx` réel via la librairie `xlsx` |
| Générer un rapport / icônes (téléchargement, historique, ajout) | RapportExamens (RapportHeader) | aucun | Non câblés, aucun effet |

#### 8. Formulaires

##### `AddSession.vue` (modal `#createSessionModal`, Planification) — **fonctionnel, connecté à l'API**
| Champ | Type | Source options | Obligatoire | Remarques |
|---|---|---|---|---|
| Année Académique | select | `anneeStore.anneesAcademiques` (API), marque « (Courante) » si correspond à `anneeStore.anneeAcademique` | oui | Pré-rempli avec l'année courante au montage |
| Semestre | select | `semestreStore.semestres`, chargés dynamiquement via `fetchSemestresByAnnee(annee_id)` à chaque changement d'année | oui | Désactivé tant qu'aucune année n'est choisie ; message si aucun semestre configuré |
| Code Unique | text | libre | oui | Placeholder `S1_NORM_2026` |
| Désignation | text | libre | oui | Placeholder `Session Normale Semestre 1` |
| Type de Session | select | `NORMALE` / `RATTRAPAGE` | oui | |
| État Initial | select | `ACTIVE` / `Brouillon` | oui | |
| Date de Début | date | — | oui | Déclenche `validateDates()` au `change` |
| Date de Fin | date | — | oui | Idem ; erreur si < date début (`is-invalid` + message) |
| Responsable / Entité Organisatrice | text | libre | oui | Placeholder « Scolarité Centrale, Direction des Études » |

- **Validation** : blocage soumission si `dateError` (date fin < date début) ou si `semestresLoading` ; affichage d'un message d'erreur via `notifyError`.
- **Payload envoyé** (`sessionStore.addSession`) : objet `form` complet → `POST /evaluations/sessions-evaluations/`.
- **Succès** : notification succès, réinitialisation du formulaire (en conservant l'année sélectionnée), fermeture programmatique de la modal Bootstrap, rafraîchissement de la liste (`fetchSessions()` invalide le cache `localStorage`).
- **Échec** : `console.error` uniquement ; pas de notification d'erreur explicite dans le `catch` de `handleSubmit` (la notification d'erreur est gérée en amont, dans `sessionStore.addSession`, via `messageStore.notifyError`).

##### `AddCalendrier.vue` (orphelin, non monté nulle part) — **incomplet / non fonctionnel**
- Ne contient **aucun `<template>`** — uniquement un `<script setup>` définissant une logique de gestion d'« épreuves » par module (mock `moduleData` = Algorithmique / Base de données / Programmation Web), ajout d'épreuve, sauvegarde (`alert()` simulée), export PDF via `html2pdf.js`, ordre par drag & drop via `vuedraggable`. Comme il n'y a pas de template et que le composant n'est importé par aucun autre fichier, cette logique n'est **jamais rendue à l'écran**.

##### `AddPlanning.vue` (orphelin, non monté) — champs
| Champ | Type | Remarques |
|---|---|---|
| Description | text | placeholder `PLANNIFICATION-INFO-S1` |
| Nom de l'examen | select | options = `getSessions()` (API réelle `GET /evaluations/sessions-evaluations/`) |
| Type (lecture seule) | text readonly | auto-rempli depuis l'examen sélectionné |
| Date de début | date | |
| Date de fin | date | |
| Statut | select | Prévu / Terminé / Annulé |
| Filière | select | options `filieres` — **jamais peuplées** dans le fichier (tableau vide, pas de fetch) |
| Année académique | select | options `annees` — **jamais peuplées** (tableau vide, pas de fetch) |

- **Bug potentiel** : `examens.value = response;` (au lieu de `response.data`) — incohérent avec `sessionStore` qui utilise `response.data` ; suggère que ce composant n'a jamais été testé contre l'API réelle.
- **Soumission** : `submitPlanning()` émet l'événement `examen-ajoute` avec une copie de `examen.value`, puis ferme la modal via l'API Bootstrap globale (`bootstrap.Modal.getInstance`). Aucun appel de création réseau.

##### `addPlannification.vue` (orphelin, non monté) — variante simplifiée d'`AddPlanning.vue`
- Champs : Nom de l'examen (select, mêmes données `getSessions()`), Type / Semestre / Date prévue / État (tous en lecture seule, auto-remplis). Pas de champs Filière/Année/Statut modifiables. Même bug `response` vs `response.data`. Soumission identique (émission d'événement, fermeture modal, aucun appel réseau de création).

##### `ExamPlanningModal.vue` (orphelin, non monté) — le formulaire le plus complet du module, jamais branché
| Champ | Type | Source | Obligatoire |
|---|---|---|---|
| Session d'examen | select | `activeSessions` (mock local, 3 sessions) | oui |
| Matière | select | `matieres` (mock local) filtrée par semestre de la session | oui |
| Date | date | bornée par `minDate` = date début session | oui |
| Heure début | time | | oui |
| Heure fin | time | bornée par `min` = heure début | oui |
| Salle | select | `salles` (mock local), options désactivées si occupées (`isSalleDisponible`, **toujours retourne `true`** — logique non implémentée) ; affiche capacité et « Occupée » | oui |
| Surveillants | multiselect (`vue-multiselect`) | `enseignantsDisponibles` filtrés par matière | oui, min. 2 (validé dans `handleSubmit`) |
| Examen principal (checkbox) | boolean | — | non |
| Classes concernées | checkboxes multiples | `classesDisponibles`, visible seulement si « non principal » | oui si non principal (min. 1) |
- **Validation** : min. 2 surveillants sinon `alert()` ; min. 1 classe si non principal sinon `alert()`.
- **Soumission** : `emit('save', {...formData})` — aucun appel réseau dans le composant (délégué au parent, mais aucun parent ne l'importe).
- **Toutes les données (sessions, matières, salles, enseignants, classes) sont codées en dur** dans le composant, avec commentaire explicite « Données simulées (à remplacer par des appels API) ».

#### 9. Tableaux et tables de navigation

| Tableau | Écran | Colonnes | Source des données | Actions par ligne |
|---|---|---|---|---|
| Liste des sessions | Planification / ExamenList.vue | Code (semestre), Désignation, État, Date début, Date fin, Responsable, Actions | **API réelle** (`useSessionStore.sessions`) | Détails, Planifier Examens, Modifier, Supprimer |
| Configuration des matières | PlanExamen.vue (panneau gauche) | liste (pas un tableau HTML) : code/nom module, crédits, coefficient, badge de statut | **Simulé** (`allModules` codé en dur) | Sélection (clic) |
| Planning des épreuves | CalendrierEvaluation.vue | Date & Heure, Classe, Matière, Type, Durée, Salle/Lieu, Actions | **Simulé** (`calendarEvents` codé en dur) | Modifier (non fonctionnel), Supprimer (local uniquement) |
| Session rattrapage (calendrier) | CalendrierRappel.vue | — | Composant vide, aucun tableau | — |
| Répartition des salles | Salles.vue (accordéon) | N°, Nom & Prénoms, Classe Assignée (par salle) | **Réel côté client** (fichier Excel/CSV parsé), aucune persistance serveur | — |
| Résultats (rapports) | ResultatContent.vue | #, Désignation, (colonnes vides) | **Statique codé en dur** — toujours « Aucune donnée » | — |
| Rapports (rapports) | RapportContent.vue | #, Designation, Date, Modules, Participants, Notes | **Statique codé en dur** — toujours « Aucune donnée » | — |

#### 10. Onglets

| Onglets | Écran | Mécanisme | Composants liés | État |
|---|---|---|---|---|
| Tout / Semestres 1 / Semestres 2 | Planification.vue | variable locale `activeSemesterGroup` (0/1/2), pas des `<Tab>` Bootstrap | `ExamenList.vue` (prop `semestre-group`) | Fonctionnel (filtre réel sur parité du semestre) |
| Session normal / Session rattrapage | CalendrierTab.vue | onglets Bootstrap (`nav-tabs` + `tab-pane`) | `CalendrierEvaluation.vue` / `CalendrierRappel.vue` | « Session normal » fonctionnel (données simulées) ; « Session rattrapage » vide (aucun contenu) |
| Résultats / Rapports | RapportTab.vue | onglets Bootstrap | `ResultatContent.vue` / `RapportContent.vue` | Les deux affichent un contenu statique « Aucune donnée » |
| (onglets fantômes) sales / purchases | RapportTab.vue | `tab-pane` déclarés en HTML mais sans `nav-link` déclencheur associé | `<StatsAcademique />` / `<StatsRapport />` référencés en template mais **non importés** | Inaccessibles / composants non résolus (code mort) |

#### 11. Workflow métier complet

##### WF-EXAMENS-01 — Planification d'une session d'examen de bout en bout

1. L'utilisateur ouvre `/planification-examens` (lien sidebar « Planification »). Au montage, `sessionStore.fetchSessions()` charge la liste des sessions (`GET /evaluations/sessions-evaluations/`, avec cache `localStorage` de 5 minutes).
2. Il clique « + Ajouter un nouveau » → ouverture de la modal `AddSession.vue`.
3. Sélection de l'année académique (préremplie avec l'année courante via `anneeStore.fetchCurrentAnnee()`) → déclenche le chargement des semestres de cette année (`semestreStore.fetchSemestresByAnnee`).
4. Saisie du Code, de la Désignation, du Type (NORMALE/RATTRAPAGE), de l'État initial (ACTIVE/Brouillon), des dates de début/fin (validation chronologique côté client), du Responsable.
5. Soumission → `sessionStore.addSession(form)` → `POST /evaluations/sessions-evaluations/`. En cas de succès : notification, réinitialisation du formulaire, fermeture de la modal, rafraîchissement de la liste (invalidation du cache local puis nouveau `fetchSessions()`).
6. La nouvelle session apparaît dans le tableau `ExamenList.vue`, filtrable par onglet Tout/Sem.1/Sem.2 et par bouton Normal/Rattrapage.
7. L'utilisateur ouvre le menu d'actions de la ligne → « Planifier Examens » → navigation vers `/planification-examens/:id/evaluations` (`PlanExamen.vue`).
8. Sur cet écran, l'utilisateur sélectionne une Filière puis une Classe (données **simulées**, non liées à la session réelle chargée), sélectionne une matière dans la liste, active un ou plusieurs types d'évaluation (CC/Normal/Rattrapage), renseigne date/heure/durée/pondération/salle par type, avec validation que la date reste dans la période de la session.
9. Clic « Valider ce module » → marquage local de la configuration comme complète (badge « Planifié »), aucune écriture serveur.
10. Clic « Enregistrer tout » → construction d'un payload `{ session_id, planifications }`, mais **simplement journalisé en console** — aucune requête HTTP n'est envoyée dans le code actuel ; le workflow s'arrête donc fonctionnellement à une simulation de sauvegarde.

*Remarque* : les étapes 1–6 sont pleinement opérationnelles contre le backend réel ; les étapes 7–10 (planification détaillée par matière) sont une maquette fonctionnelle côté UI mais sans intégration API.

##### WF-EXAMENS-02 — Affectation des salles d'examen

1. L'utilisateur ouvre `/salles-horaires` (lien sidebar « Salles & horaires »).
2. Il configure le nombre de salles disponibles (`roomCount`, défaut 5) et la capacité maximale par salle (`capacityPerRoom`, défaut 20).
3. Il choisit un mode de répartition : Mélange complet, Regroupement par classe, ou Mélange intra-classe.
4. Il importe un ou plusieurs fichiers Excel/CSV (glisser-déposer ou sélection) contenant les colonnes Nom, Prénom, Classe (plusieurs alias de noms de colonnes reconnus, insensibles à la casse).
5. Chaque fichier est parsé côté client (`xlsx`), les lignes sont normalisées et ajoutées à `studentsList`. Le composant affiche en temps réel le nombre d'« Étudiants Importés » et les « Places Disponibles » (`roomCount × capacityPerRoom`), avec alerte si la capacité globale est dépassée (`hasCapacityOverflow`).
6. Le bouton « Lancer la Répartition Automatique » est actif seulement si des étudiants sont chargés, `roomCount`/`capacityPerRoom` > 0, et qu'il n'y a pas de dépassement de capacité (`canDistribute`).
7. `distributeStudents()` exécute l'algorithme choisi (mélange aléatoire Fisher-Yates, tri alphabétique par classe, ou mélange intra-classe puis concaténation triée) puis remplit séquentiellement les salles jusqu'à leur capacité, en s'arrêtant si toutes les salles configurées sont pleines (les étudiants excédentaires ne sont pas affectés — aucun message d'erreur explicite si cela se produit malgré la vérification `canDistribute`).
8. Le résultat est affiché en accordéon (une section dépliable par salle, avec tableau des étudiants affectés).
9. L'utilisateur peut « Exporter la feuille Excel » : génération d'un classeur `.xlsx` (colonnes Numéro de Table, Salle Affectée, Nom, Prénom, Classe) téléchargé localement via `XLSX.writeFile`.

*Remarque* : ce workflow est **entièrement côté client**, sans aucun appel réseau — ni pour charger des salles réelles (le nombre/capacité de salles est saisi manuellement, pas issu d'un référentiel de salles), ni pour persister le résultat de la répartition côté serveur.

#### 12. Cas d'utilisation

- **UC-EXAMENS-01 — Créer une session d'examen**
  Acteur : Responsable des examens (rôle probable à confirmer). Préconditions : accès à `/planification-examens`, années académiques et semestres disponibles via API. Déroulement : ouverture modal `AddSession`, saisie des champs obligatoires, validation chronologique, soumission. Postcondition : nouvelle session persistée en base (`POST /evaluations/sessions-evaluations/`) et visible dans la liste.

- **UC-EXAMENS-02 — Consulter et filtrer les sessions d'examen**
  Acteur : Responsable des examens. Préconditions : sessions existantes. Déroulement : navigation par onglets Tout/Sem.1/Sem.2 et boutons Normal/Rattrapage sur `/planification-examens`. Postcondition : tableau filtré affiché (filtrage 100% côté client sur les données déjà chargées).

- **UC-EXAMENS-03 — Modifier / Supprimer une session d'examen**
  Acteur : Responsable des examens. Déroulement : menu d'actions de la ligne → « Modifier » déclenche `fetchSessionById` (charge la session dans le store) mais **aucun formulaire d'édition n'est visiblement câblé** dans le code lu (modal cible `#exampleModal-edit` non définie dans les fichiers analysés — point à confirmer) ; « Supprimer » demande confirmation puis appelle `DELETE /evaluations/sessions-evaluations/:id`.

- **UC-EXAMENS-04 — Planifier les évaluations d'une session (par matière)**
  Acteur : Responsable des examens. Précondition : session créée. Déroulement : accès à `/planification-examens/:id/evaluations`, sélection Filière/Classe/Matière, configuration des types d'évaluation. Postcondition : **simulation uniquement** — configuration visible localement mais non persistée côté serveur (voir §5, §11).

- **UC-EXAMENS-05 — Visualiser le calendrier des épreuves**
  Acteur : Responsable des examens / toute personne authentifiée. Déroulement : accès à `/calendrier-examens`, filtrage par filière/classe/type/recherche texte. Postcondition : liste affichée à partir de **données simulées** (aucune session réelle liée).

- **UC-EXAMENS-06 — Répartir les étudiants dans les salles d'examen**
  Acteur : Responsable logistique (rôle probable à confirmer). Déroulement : voir WF-EXAMENS-02. Postcondition : export Excel local du plan de salle ; pas de persistance serveur.

- **UC-EXAMENS-07 — Consulter les rapports d'examens**
  Acteur : Responsable des examens. Déroulement : accès à `/rapport-examens`, bascule entre onglets Résultats/Rapports. Postcondition : **aucune donnée n'est jamais affichée** — fonctionnalité non implémentée côté frontend (contenu statique « Aucune donnée »), aucun appel API existant pour ce périmètre.

#### 13. Données manipulées

| Entité | Champs observés dans le code | Origine |
|---|---|---|
| **Session d'examen** | `id`, `code`, `designation`, `type_session` (NORMALE/RATTRAPAGE), `etat` (ACTIVE/Brouillon/active/inactive/draft/completed selon les composants), `semestre_id`, `semestre_code`, `annee_id`, `code_annee_academique`/`annee_code`, `date_debut`, `date_fin`, `responsable`, `commentaire` (vu dans `DetailExamen.vue` orphelin), `llm_summary` (vu dans `DetailsItem.vue`, affiché conditionnellement — origine non déterminée, probablement backend IA), `designation_filiere`, `designation_session`, `code_session` | **API réelle** (`sessions-evaluations`) pour la liste et la création ; champs additionnels (`llm_summary`, `commentaire`) affichés s'ils sont présents dans la réponse API mais non produits par aucun formulaire du frontend |
| **Planning / Évaluation (module)** | `module_id`/`matiereId`, `type` (CC/NORMAL/RATTRAPAGE), `date`/`date_epreuve`, `heure_debut`, `heure_fin`, `duree`, `ponderation`, `salle`, `isConfigured` | **Entièrement simulé** dans `PlanExamen.vue` (jamais envoyé au backend) |
| **Salle (logistique salles)** | `id`, `nom`, `capacite`, `batiment` | Simulé (`ExamPlanningModal.vue`, orphelin) — sur l'écran actif `Salles.vue`, seules des quantités abstraites (`roomCount`, `capacityPerRoom`) sont utilisées, sans référentiel de salles réelles |
| **Créneau / épreuve calendrier** | `id`, `classeId`, `classeCode`, `filiereId`, `moduleCode`, `moduleNom`, `type` (NORMAL/RATTRAPAGE), `date`, `heure_debut`, `duree`, `salle` | Simulé (`CalendrierEvaluation.vue`) |
| **Étudiant (répartition salles)** | `lastName`, `firstName`, `class` | Réel, mais **importé localement depuis Excel/CSV** (aucune donnée serveur, aucun lien avec un référentiel étudiant existant du reste de l'application) |
| **Résultat / Rapport** | Aucun champ réel — colonnes de tableau prévues (`#`, Désignation, Date, Modules, Participants, Notes) mais jamais peuplées | Non implémenté |

#### 14. API et intégration backend

Base API du module (via `src/api/config/apiClients.js`) : `evaluationApi = createApiClient('/evaluations')`.

| Fonction (`src/api/evaluations/evaluationApi.js`) | Méthode / URL | Utilisée par | Statut |
|---|---|---|---|
| `getSessions()` | `GET /evaluations/sessions-evaluations/` | `sessionStore.fetchSessions` (Planification), et composants orphelins `AddPlanning.vue`/`addPlannification.vue` | Réel, en usage actif via le store |
| `getSessionById(id)` | `GET /evaluations/sessions-evaluations/:id` | `sessionStore.fetchSessionById` (déclenché par « Modifier » sur une session) | Réel, mais aucun formulaire d'édition consommateur identifié |
| `createSession(data)` | `POST /evaluations/sessions-evaluations/` | `sessionStore.addSession` (formulaire `AddSession.vue`) | Réel, en usage actif |
| `updateSession(id, data)` | `PUT /evaluations/sessions-evaluations/:id` | `sessionStore.editSession` | Réel, mais **aucun appelant** trouvé dans les composants du module (action de store non invoquée dans l'UI lue) |
| `deleteSession(id)` | `DELETE /evaluations/sessions-evaluations/:id` | `sessionStore.removeSession` (action « Supprimer » dans `ExamenList.vue`) | Réel, en usage actif |
| `changeSessionEtat(id, data)` | `PATCH /evaluations/sessions-evaluations/:id/etat` | `sessionStore.changeEtat` | Réel, mais **aucun appelant** trouvé dans le module Examens (machine à état de session non exposée dans l'UI lue) |
| `createEvaluation` / `getEvaluations` / `getEvaluationById` / `updateEvaluation` / `deleteEvaluation` | `POST/GET/GET/PUT/DELETE /evaluations/evaluation[...]` | **Aucun composant du module Examens ne les importe** | Endpoints définis dans l'API mais non consommés par ce module (probablement destinés à un autre module de notation) |

Stores tiers consommés par le module (hors `sessionStore`) :
- `useAnneeStore` (`src/stores/academiqueStore/anneStore.js`) → `academiqueApi` (`/academique`) : `fetchAnneesAcademiques`, `fetchCurrentAnnee` (utilisés par `AddSession.vue`).
- `useSemestreStore` (`src/stores/academiqueStore/semestreStore.js`) → `academiqueApi` : `fetchSemestresByAnnee` (utilisé par `AddSession.vue`).
- `useNotifier` / `useMessageStore` (`src/stores/messages/`) : notifications succès/erreur, utilisées largement dans le module.

Aucun autre appel réseau n'existe dans les écrans PlanExamen (détail planification), Calendrier, Salles ou Rapports : toutes leurs données sont soit codées en dur, soit issues d'un import de fichier local.

#### 15. Règles métier détectées

- **RM-EXAMENS-01 — Cohérence chronologique de la session** : la date de fin d'une session d'examen ne peut pas être antérieure à la date de début (`AddSession.vue`, `validateDates()`), sinon la soumission est bloquée avec message d'erreur.
- **RM-EXAMENS-02 — Chargement en cascade Année → Semestre** : la liste des semestres proposés dans `AddSession.vue` dépend systématiquement de l'année académique sélectionnée (`semestreStore.fetchSemestresByAnnee`), avec réinitialisation du semestre à chaque changement d'année.
- **RM-EXAMENS-03 — Bornage des dates d'évaluation par la période de session** : dans `PlanExamen.vue`, la date de chaque épreuve (CC/Normal/Rattrapage) doit être comprise entre `date_debut` et `date_fin` de la session parente (attributs `min`/`max` sur l'input + validation `validateEvalDates`), sinon la sauvegarde du module est bloquée (`hasLocalErrors`).
- **RM-EXAMENS-04 — Validation minimale des surveillants et classes** (composant orphelin `ExamPlanningModal.vue`, non branché à l'UI) : un examen planifié doit avoir au moins 2 surveillants, et s'il n'est pas « principal », au moins une classe concernée doit être sélectionnée.
- **RM-EXAMENS-05 — Capacité de salle vs effectif importé** (`Salles.vue`) : la répartition automatique n'est autorisée (`canDistribute`) que si le nombre total d'étudiants importés ne dépasse pas la capacité globale calculée (`roomCount × capacityPerRoom`) ; une alerte visuelle « Capacité insuffisante » est affichée en cas de dépassement.
- **RM-EXAMENS-06 — Remplissage séquentiel des salles jusqu'à capacité** (`Salles.vue`, `distributeStudents`) : chaque salle est remplie jusqu'à `capacityPerRoom` avant de passer à la suivante ; si le nombre de salles configuré est atteint, la distribution s'arrête même si des étudiants restent non affectés (pas de garde-fou supplémentaire au-delà de la vérification de capacité globale en amont).
- **RM-EXAMENS-07 — Filtrage semestre pair/impair** (`ExamenList.vue`) : le classement d'une session dans l'onglet « Semestres 1 » ou « Semestres 2 » est déterminé par la parité du premier nombre trouvé dans `semestre_code` (regex `\d+`), pas par un champ dédié « type de semestre ».
- **Règle non confirmée / partiellement implémentée — disponibilité de salle** : `ExamPlanningModal.vue` (orphelin) prévoit une fonction `isSalleDisponible(salleId)` censée vérifier les chevauchements de créneaux, mais son implémentation **retourne toujours `true`** avec le commentaire explicite « implémentation simplifiée — à compléter avec la logique réelle » ; aucune détection de chevauchement de créneaux n'est donc réellement opérationnelle nulle part dans le module.

---

#### Points à confirmer

1. **Accessibilité réelle de `/examens`** : aucune navigation interne (lien, redirection, carte de dashboard) pointant vers cette route n'a été trouvée dans le dépôt frontend fourni ; il est possible qu'un lien existe ailleurs (dashboard principal hors périmètre de lecture) — à vérifier auprès de l'équipe produit.
2. **Rôles/permissions réels** : aucun contrôle RBAC n'est visible côté frontend pour ce module ; il est possible que des restrictions existent côté backend (à confirmer avec l'équipe API) — les « acteurs » listés en §2 sont des déductions fonctionnelles, non des rôles techniques vérifiés.
3. **Devenir des composants orphelins** (`Header.vue`, `AddCalendrier.vue`, `AddPlanning.vue`, `addPlannification.vue`, `ExamPlanningModal.vue`, `DetailExamen.vue`, `DetailPlan.vue`, `TabSemestre1.vue`, `TabSemestre2.vue`, `TabTout.vue`) : à clarifier s'ils doivent être réintégrés dans une prochaine itération (ils portent des fonctionnalités plus riches — surveillants, disponibilité de salle, export PDF — que les écrans actuellement montés) ou supprimés comme code mort.
4. **Modal d'édition de session** (`#exampleModal-edit` ciblé par l'action « Modifier » dans `DetailsItem.vue`) : aucun élément portant cet `id` n'a été trouvé dans les fichiers du module analysés — soit il est défini ailleurs dans l'application (layout global), soit l'action est actuellement non fonctionnelle.
5. **Backend réel des endpoints `/evaluations/evaluation...`** (CRUD « évaluation » générique) : non consommés par ce module ; leur rôle exact (peut-être lié à la saisie de notes, hors périmètre « Examens ») reste à confirmer.
6. **Champ `llm_summary`** affiché conditionnellement dans `DetailsItem.vue` : présence suggérant une génération de résumé par IA côté backend, mais aucun élément du frontend ne le produit ni ne le documente — à confirmer.

---

### Module : Concours

Documentation produite exclusivement à partir de la lecture du code source réel (composants Vue, routes, stores Pinia, module API) situé sous `src/views/concours/`, `src/routes/concours.routes.js`, `src/stores/gestionStores/concourStore.js`, `src/stores/gestionStores/candidatStore.js`, `src/api/gestions/gestionApi.js`, et `src/components/partials/sidebar.vue`. Aucune fonctionnalité n'est supposée : tout ce qui est présenté comme "simulé", "mock" ou "orphelin" l'est parce que le code le montre explicitement (données codées en dur, actions appelant des méthodes de store inexistantes, composants jamais importés, etc.).

---

#### 1. Objectif métier

Le module Concours gère le cycle de vie des concours d'admission académiques (LMD) : ouverture d'une édition de concours, définition des épreuves (matières, coefficients, horaires), inscription/import des candidats, saisie des notes par épreuve, calcul des moyennes/rangs, délibération et proclamation officielle des admissions, puis mise à disposition de rapports/statistiques et archives.

En pratique, le code implémente réellement (API + store branchés) : le CRUD des concours, le CRUD des épreuves, l'import de candidats et de notes, la saisie manuelle de notes, le déclenchement du calcul de moyennes/rangs et de la proclamation, et le téléchargement de la liste des admis (PDF/Excel). En revanche, plusieurs écrans annexes (délibération détaillée par seuil, rapports/statistiques, archives, journal d'audit) sont des maquettes frontend non connectées au backend — voir sections 5, 6 et 14 pour le détail précis de ce qui est réel vs simulé.

#### 2. Acteurs concernés

Aucun mécanisme de RBAC (garde de route, `v-if` sur rôle, permission check) n'est présent dans les fichiers du module Concours lus. Aucun rôle n'est vérifié avant d'afficher un bouton ou d'appeler une action. Les acteurs suivants sont donc des **rôles probables à confirmer**, déduits uniquement du vocabulaire métier des écrans (headers, libellés de boutons) :

- Rôle probable à confirmer — "Gestionnaire des concours / Scolarité" : création d'un concours (`AddConcour.vue`), configuration des épreuves, import des candidats, changement de statut.
- Rôle probable à confirmer — "Jury / Responsable de notation" : saisie des notes (`TabNotes.vue`), import de notes.
- Rôle probable à confirmer — "Responsable de délibération / Direction" : déclenchement du calcul des rangs, proclamation, publication du PV (`TabDeliberation.vue`, onglet "Resultats").
- Rôle probable à confirmer — "Consultant / Direction" : consultation des rapports (`RapportConcours.vue`), des archives et des statistiques.

Le fichier `docs/11-regles-metier.md` (base existante) mentionne des rôles applicatifs génériques (`admin`, `scolarite`, `pedagogie`, `c_cycle`, `finances`, `directeur`, `enseignant`, `gestionnaire`) issus du profil utilisateur global de l'application, mais aucun de ces rôles n'est référencé nommément dans le code du module Concours lui-même.

#### 3. Menus et sous-menus associés

Extrait de `src/components/partials/sidebar.vue` :

- Groupe de menu "Concours" (icône `mdi-trophy`, bloc collapsible `#concours`, lignes ~216-253) :
  - Sous-menu "Editions" → `router-link to="/edition-concours"` (ligne 235)
  - Sous-menu "Rapports" → `router-link to="/rapport-concours"` (ligne 245)

- Tableau de contrôle `menuGroups.concours` (utilisé par `isParentActive` pour déterminer si le menu parent doit apparaître actif), ligne 711 :
  ```js
  concours: ['/edition-concours', '/resultats-concours', '/rapport-concours'],
  ```

**Incohérence confirmée** : `/resultats-concours` figure dans le tableau JS `menuGroups.concours` (donc pris en compte par la logique de détection d'onglet actif `isParentActive`) mais :
  - aucun `<router-link>` du template de la sidebar ne pointe vers `/resultats-concours` (seuls "Editions" et "Rapports" sont rendus) ;
  - aucune route `/resultats-concours` n'est déclarée dans `src/routes/concours.routes.js`.
  - **Route absente — référencée uniquement dans la logique JS du menu (`menuGroups.concours`) mais sans lien de navigation ni route déclarée.** Le seul effet résiduel de cette entrée est que, si l'utilisateur navigue vers une URL `/resultats-concours` (par exemple en la tapant manuellement), la sidebar considérerait le menu "Concours" comme actif (via `isParentActive`) — mais le routeur Vue Router ne trouverait aucune route correspondante (404 / comportement de fallback selon la configuration globale du routeur, non vérifiée ici).

#### 4. Pages et routes associées

Source : `src/routes/concours.routes.js`.

| Route | Nom (name) | Composant | Props | Description |
|---|---|---|---|---|
| `/edition-concours` | `EditionConcours` | `src/views/concours/editions/Edition.vue` | — | Page d'accueil du module : en-tête + 3 onglets (Concours / Resultats / Historique). |
| `/edition-concours/:id/configurations` | `concours-configuration` | `src/views/concours/editions/components/Tab/configSub/configDetails.vue` | `props: true` (donc `id` injecté en prop, en plus d'être lu via `route.params.id` dans les sous-composants) | Écran de configuration d'un concours précis : 4 sous-onglets (Épreuves / Candidatures / Saisie des Notes / Délibération & Publication). |
| `/rapport-concours` | `RapportConcours` | `src/views/concours/resultats/RapportConcours.vue` | — | Page de rapports : 2 onglets (Statistiques / Archives), **entièrement basée sur des données mockées** (voir section 5). |
| `/resultats-concours` | *(absente)* | *(absente)* | — | **Incohérence** : référencée uniquement dans `menuGroups.concours` (sidebar.vue ligne 711), sans `<router-link>` ni déclaration de route. |

Route non déclarée mais **référencée dans le code** : `ItemActions.vue` (dropdown "Éditer") pointe vers `` `/edition-concours/edit/${currentItem.id}` `` (ligne 23), route absente de `concours.routes.js`. Ce lien n'est cependant jamais rendu dans le contexte réel d'utilisation (`editionsContent.vue` passe `:showAdd="false"` à `ItemActions`, ce qui masque ce lien via le `v-if="showAdd && currentItem.id"` du template — voir section 7).

#### 5. Description fonctionnelle complète

**5.1 Édition / liste des concours (`/edition-concours`)**

`Edition.vue` assemble `ConcourHeader.vue` (titre, fil d'Ariane, boutons Export/Imprimer, bouton "+ Ajouter un nouveau" qui ouvre la modale Bootstrap `#exampleModal` = `AddConcour.vue`) puis `ConcoursTab.vue`, qui affiche 3 onglets Bootstrap (`nav-tabs`) :
- **"Concours"** (actif par défaut) → `editionsContent.vue` : table réelle des concours, connectée à `concoursStore` (`fetchConcours()` au montage), recherche client (designation / code_annee / statut / libelle_type / type_concours), pagination via `Pagination.vue`, actions "Configurer" (RouterLink) et menu `ItemActions`.
- **"Resultats"** → `resultasContent.vue` : table des concours avec actions de délibération ("Rangs", "Proclamer", "PDF"), connectée à `concoursStore`.
- **"Historique"** → `HistoriqueContent.vue` : journal d'audit — **écran non fonctionnel** : `logs` est un tableau vide en dur, la fonction `loadLogs()` contient un commentaire `// Ici tu peux appeler ton API pour récupérer les logs ... Pour l'instant, on laisse vide par défaut` et ne fait aucun appel réseau. Filtres (recherche, sévérité, module) opèrent sur ce tableau toujours vide.

Le template de `ConcoursTab.vue` contient également un `tab-pane` orphelin `id="statistiques"` référençant `<StatistiquesContent />`, **composant non importé dans le `<script setup>`** et sans `nav-link` déclencheur associé : ce panneau est à la fois invisible (aucun onglet ne le sélectionne) et provoquerait un avertissement Vue "composant non résolu" s'il était rendu.

**5.2 Configuration d'un concours (`/edition-concours/:id/configurations`)**

`configDetails.vue` affiche l'en-tête du concours sélectionné (recherché dans `concoursStore.concoursList` via l'`id` de route — pas d'appel dédié `fetchConcoursById`, juste un `find()` sur la liste déjà chargée ; si la liste est vide au chargement direct de l'URL, un `fetchConcours()` est déclenché en `onMounted`), un bouton "Retour" (`router.back()`) et un bouton **"Proclamations"** qui, malgré son libellé, appelle `concoursStore.downloadAdmisList(concoursId.value, 'pdf')` — c'est-à-dire le **téléchargement de la liste des admis**, pas l'action de proclamation proprement dite (`proclaimAdmissions`). Le corps de la page délègue à `configTab.vue`, qui affiche 4 sous-onglets :
1. **"1. Épreuves"** → `TabEpreuves.vue`
2. **"2. Candidatures"** → `TabCandidats.vue`
3. **"3. Saisie des Notes"** → `TabNotes.vue`
4. **"4. Délibération & Publication"** → `TabDeliberation.vue`

**5.3 Rapports (`/rapport-concours`)**

`RapportConcours.vue` affiche `RapportHeader.vue` (titre statique, bouton "Générer un rapport" sans handler) puis `RapportTab.vue`, 2 onglets :
- **"Statistiques"** → `ResultatContent.vue` : **entièrement mocké**, aucun appel à `concourStore`/`candidatStore`/API. `globalStats` et `comparisonStats` sont des objets/tableaux codés en dur dans `loadStatistiquesData()`. Le sélecteur d'année (`selectedYear`) déclenche un rechargement qui régénère systématiquement les **mêmes valeurs** quelle que soit l'année choisie.
- **"Archives"** → `RapportContent.vue` : **entièrement mocké**, tableau `archives` codé en dur (4 lignes), commentaire explicite `// Remplacer par l'appel à ton service d'archives Node.js`. Actions "Consulter", "Télécharger PV", "Désarchiver" ne font que des `console.log`/toasts locaux, sans persistance.

Comme pour `ConcoursTab.vue`, le template de `RapportTab.vue` contient 2 `tab-pane` orphelins (`id="sales"`, `id="purchases"`) référençant `<StatsAcademique />` et `<StatsRapport />`, composants **non importés** et sans `nav-link` déclencheur — code mort/incohérent.

**5.4 `Edition.vue` déclare aussi `loading` (via `SkeletonLoader`) au niveau de `Edition.vue` lui-même, connecté à `formateurs`/`loading` gérés par un `setTimeout` fictif de 3 secondes dans `RapportConcours.vue` — sans lien avec des données de concours réelles.**

**5.5 Anomalies techniques identifiées dans le code (bugs, pas des suppositions)**

- `editionsContent.vue::handleChangeStatus` appelle `concoursStore.updateConcoursStatus(id, { statut })` — **cette méthode n'existe pas dans `concourStore.js`** (le store expose `changeStatut(id, data)`). Résultat : le changement de statut déclenché depuis le menu "Modifier le statut" (`ItemActions.vue`) lève une `TypeError` en exécution et échoue silencieusement (pas de `try/catch` autour de l'appel dans le composant).
- `TabEpreuves.vue::removeEpreuve` appelle `concourStore.removeEpreuve(item.id, concoursId)` en passant la **référence réactive `concoursId` (computed) au lieu de `concoursId.value`** — le store transmet cette valeur à `fetchEpreuvesByConcours`, qui construit l'URL `/concours/${concoursId}/epreuves` : le rechargement post-suppression est donc appelé avec un identifiant malformé.
- `editionsContent.vue` / `ListConcour.vue`(orphelin) passent `editModalTarget="#editModuleModal"` à `ItemActions`, mais **aucune modale portant l'id `editModuleModal` n'existe dans l'arborescence du module Concours** (cet id n'est utilisé ailleurs que dans un module différent, `stracad/filieres`). Le bouton "Modifier" du menu déroulant `ItemActions` est donc sans effet visible dans ce module.
- `src/views/concours/editions/components/table/ListConcour.vue` est un **fichier orphelin** : il ne contient qu'un `<script setup>` avec des données mock (4 concours codés en dur) et aucune balise `<template>`. Il n'est importé par aucun autre fichier du projet (vérifié par recherche globale) — code mort, non rendu par l'application.
- `src/views/concours/editions/components/Tab/ConcoursConfig.vue` est également un **fichier orphelin** : jamais importé par aucun composant. Son contenu est quasiment identique à `resultasContent.vue` (même table "Résultats et Proclamations des Concours", mêmes actions Rangs/Proclamer/PDF branchées sur `concoursStore`), ce qui suggère une duplication laissée de côté lors d'un refactoring.

#### 6. Interfaces du module

##### Écran : Edition (liste des concours) — `/edition-concours`

- **Fichier(s)** : `Edition.vue`, `ConcourHeader.vue`, `ConcoursTab.vue`, `editionsContent.vue`.
- **Champs affichés (table)** : `#` (rang de ligne), Désignation (`designation` + `code_annee`), Type (`libelle_type` ou `type_concours`), Période (`date_debut` → `date_fin`, formatées `DD/MM/YYYY` via `dayjs`), Statut (badge coloré : PLANIFIE / OUVERT / CLOTURE / ANNULE, classe CSS dédiée par statut), Actions.
- **Filtres** : champ de recherche texte unique (`searchQuery`), filtrage client sur `designation`, `code_annee`, `statut`, `libelle_type`, `type_concours` (aucun filtre serveur, pas de paramètre envoyé à l'API).
- **Pagination** : composant partagé `Pagination.vue`, `itemsPerPage` par défaut 10, calcul client (`filteredConcours.slice(...)`).
- **États** : `loading` (spinner Bootstrap plein écran pendant `fetchConcours()`), état vide ("Aucun concours trouvé").
- **Source des données** : réelle — `concoursStore.fetchConcours()` → `GET /concours`.
- **Actions disponibles** : "+ Ajouter un nouveau" (modale `AddConcour`), "Configurer" (navigation), menu `ItemActions` (Détails / Éditer [masqué] / Modifier [bugué, cible modale inexistante] / Modifier le statut [bugué, méthode store inexistante] / Supprimer).

##### Écran : configDetails (configuration d'un concours) — `/edition-concours/:id/configurations`

- **Fichier(s)** : `configDetails.vue`, `configTab.vue` + 4 sous-onglets.
- **En-tête** : fil d'Ariane "Editions / Configuration", désignation du concours (`currentSession.designation`, résolu via `concoursStore.concoursList.find(id)`), badge code année, période formatée, bouton "Retour", bouton "Proclamations" (télécharge en réalité le PDF des admis, cf. 5.2).
- **Sous-onglet 1 — Épreuves** (`TabEpreuves.vue`) :
  - Table éditable en ligne (édition inline) : Code, Intitulé, Coefficient, Heure début, Heure fin, Type (écrit/oral/pratique), Actions (Modifier/Supprimer, ou Sauvegarder/Annuler en mode édition).
  - Pied de tableau : somme des coefficients (`totalCoefficients`, calcul client).
  - Boutons "Excel" (export, `console.log` uniquement — pas d'export réel) et "+ Ajouter une épreuve" (ajoute une ligne locale vide en mode édition).
  - Source : réelle — `concourStore.fetchEpreuvesByConcours(concoursId)` → `GET /concours/:id/epreuves`.
- **Sous-onglet 2 — Candidatures** (`TabCandidats.vue`) :
  - Zone de dépôt de fichier (CSV/XLSX, 5 Mo max), bouton "Télécharger le modèle (.xlsx)" (génération locale d'un gabarit XML Excel avec en-têtes : `nom, prenom, sexe, date_naissance, lieu_naissance, telephone, email, ville, code_filiere, chemin_photo`).
  - 2 cartes KPI : "Candidats Validés" (compteur `listCandidats.length`), "Dernier Import" (date locale, non persistée).
  - Table paginée (10/20 par page) : N° Table, Nom & Prénoms (+ Sexe), Email, Téléphone, Actions (icône suppression).
  - Source : réelle pour le chargement — `candidatStore.fetchCandidatsByConcours(concoursId)` → `GET /candidats/concours/:concoursId`. Import réel — `candidatStore.importCandidatsFile(formData)` → `POST /candidats/import`.
  - **Suppression d'un candidat = simulée** : `deleteCandidat` fait un `.splice()` local sur le tableau réactif du store (donc mutation en mémoire uniquement) ; aucun appel API de suppression de candidat n'existe dans `gestionApi.js`.
- **Sous-onglet 3 — Saisie des Notes** (`TabNotes.vue`) :
  - Sélecteur d'épreuve (`epreuvesList` du store concours), zone d'import Excel rapide (colonnes attendues `num_table` et `note`), grille de saisie (N° Table, Nom & Prénoms, Note/20, Statut : Enregistré / En attente / Max 20 / Absent).
  - Compteurs "Candidats" / "Saisies X/Y".
  - Source réelle : `candidatStore.fetchCandidatsByEpreuve(concoursId, code)` → `GET /candidats/concours/:concoursId/epreuve?epreuve_code=...` ; sauvegarde ligne par ligne via `candidatStore.addNote(numTable, payload)` → `POST /candidats/:numTable/notes` (boucle séquentielle sur les lignes modifiées) ; import de masse via `candidatStore.importNotesFile(concoursId, file)` → `POST /candidats/import/notes`.
- **Sous-onglet 4 — Délibération & Publication** (`TabDeliberation.vue`) :
  - 3 cartes KPI : "Moyenne Générale", "Taux d'Admissibilité Actuel", "Seuil d'Admission" (champ éditable `seuilAdmission`, défaut `10.0`).
  - Table de classement simulé (Rang, N° Table, Nom, Moyenne, Décision Admis/Ajourné selon comparaison au seuil).
  - Bouton "Publier les Résultats" / "Dé-publier".
  - **Intégralement simulé** : `stats` et `simulationList` sont des objets codés en dur dans `loadDeliberationData()` (3 candidats fictifs : TRAORE Moussa, SOW Fatoumata, COULIBALY Amadou). `seuilAdmission` n'est jamais transmis au backend. `publierResultatsOfficiels()` se contente de `isPublished.value = true` + toast de succès local ; l'appel réel est **commenté dans le code** (`// await concoursStore.proclamerResultats(concoursId, { seuil: seuilAdmission.value })`) et référence de surcroît une méthode (`proclamerResultats`) **qui n'existe pas** dans le store (la vraie action s'appelle `proclaimAdmissions` et ne prend pas de paramètre `seuil`). Aucun appel réseau n'est donc jamais déclenché par cet écran.

##### Écran : RapportConcours — `/rapport-concours`

- **Fichier(s)** : `RapportConcours.vue`, `RapportHeader.vue`, `RapportTab.vue`, `ResultatContent.vue`, `RapportContent.vue`.
- **En-tête** : titre "Rapports des Concours", boutons Export/Historique/Ajouter (sans handler câblé) et "Générer un rapport" (sans handler).
- **Onglet "Statistiques"** (`ResultatContent.vue`) : sélecteur d'année (2024-2026), 4 cartes KPI (Total Postulants, Taux de Présence, Moyenne Globale, Avancement), graphique de parité H/F (barres de progression), Top 3 des concours les plus demandés, tableau comparatif pluriannuel. **100 % mocké**, aucune connexion store/API.
- **Onglet "Archives"** (`RapportContent.vue`) : recherche + filtres (année, statut d'archivage), table (Session, Code, Intitulé, Candidats inscrits, Statut Final, Actions : Consulter/PDF/Désarchiver). **100 % mocké**, tableau `archives` codé en dur.
- **États** : `loading` global piloté par un `setTimeout` fictif de 3 s dans `RapportConcours.vue` (variable `formateurs`, sans rapport avec les concours).

#### 7. Boutons et actions

| Bouton | Emplacement (composant) | Handler | Store / API réellement appelée | Remarque |
|---|---|---|---|---|
| "+ Ajouter un nouveau" | `ConcourHeader.vue` | `openAddModal()` | Ouvre la modale Bootstrap `#exampleModal` (`AddConcour.vue`) | Réel (JS Bootstrap natif) |
| "Ajouter concours" (submit `AddConcour`) | `AddConcour.vue` | `submitConcour()` | `concoursStore.addConcours()` → `POST /concours` | Réel ; réinitialise et ferme la modale **même en cas d'échec** (l'erreur est absorbée par le store, non re-levée) |
| "Export" (icône téléchargement) | `ConcourHeader.vue` | `exportData()` | `console.log` uniquement | Simulé / non implémenté |
| "Imprimer" | `ConcourHeader.vue` | `printData()` | `window.print()` | Réel (impression navigateur) |
| "Configurer" | `editionsContent.vue` | RouterLink | Navigation vers `/edition-concours/:id/configurations` | Réel |
| "Détails" (menu ItemActions) | `ItemActions.vue` | `openDetails()` | Affiche une modale locale avec les champs du concours | Réel (affichage local, pas d'appel API) |
| "Éditer" (menu ItemActions) | `ItemActions.vue` | RouterLink `/edition-concours/edit/:id` | — | **Route inexistante** ; de plus masqué dans les usages réels (`showAdd=false`) |
| "Modifier" (menu ItemActions) | `ItemActions.vue` | `data-bs-toggle="modal" data-bs-target="#editModuleModal"` | — | **Modale cible inexistante** dans ce module : sans effet |
| "Modifier le statut" (menu ItemActions + modale) | `ItemActions.vue` → `editionsContent.vue::handleChangeStatus` | `concoursStore.updateConcoursStatus(...)` | **Méthode inexistante dans le store** (bug) | Cassé |
| "Supprimer" (menu ItemActions) | `editionsContent.vue::confirmDelete` | `concoursStore.removeConcours(id)` → `DELETE /concours/:id` | Réel (avec confirmation navigateur) |
| "+ Ajouter une épreuve" | `TabEpreuves.vue` | `addEpreuve()` | Ajout local (ligne vide en mode édition) | Local ; persistance différée au "Sauvegarder" |
| "Sauvegarder" (ligne épreuve) | `TabEpreuves.vue` | `saveEpreuve()` | `concourStore.addEpreuve()` ou `editEpreuve()` → `POST/PUT /concours/epreuves...` | Réel |
| "Supprimer" (ligne épreuve) | `TabEpreuves.vue` | `removeEpreuve()` | `concourStore.removeEpreuve(id, concoursId)` → `DELETE /gestions/concours/epreuves/:id` | Réel mais rechargement bugué (concoursId non déballé, cf. §5.5) |
| "Excel" (export épreuves) | `TabEpreuves.vue` | `exportExcel()` | `console.log` uniquement | Simulé |
| "Télécharger le modèle (.xlsx)" | `TabCandidats.vue` | `downloadTemplate()` | Génération locale d'un fichier Excel (Blob) | Réel (généré côté client) |
| "Valider l'importation" (candidats) | `TabCandidats.vue` | `uploadFile()` | `candidatStore.importCandidatsFile()` → `POST /candidats/import` | Réel |
| Icône suppression candidat | `TabCandidats.vue` | `deleteCandidat()` | `.splice()` local sur le state du store | **Simulé, non persisté** |
| "Choisir le fichier de notes" / import Excel | `TabNotes.vue` | `handleExcelNotesChange()` | `candidatStore.importNotesFile()` → `POST /candidats/import/notes` | Réel |
| "Enregistrer la grille" | `TabNotes.vue` | `saveAllNotes()` | Boucle : `candidatStore.addNote()` → `POST /candidats/:numTable/notes` | Réel (un appel par ligne modifiée) |
| Champ "Seuil d'admission" | `TabDeliberation.vue` | `recalculerSimulations()` | Recalcul local uniquement | Simulé |
| "Publier les Résultats" | `TabDeliberation.vue` | `publierResultatsOfficiels()` | **Aucun appel API** (ligne commentée dans le code) | **Entièrement simulé** |
| "Dé-publier (Restaurer)" | `TabDeliberation.vue` | `annulerPublication()` | Local uniquement | Simulé |
| "Rangs" (Calculer les rangs) | `resultasContent.vue` (+ orphelin `ConcoursConfig.vue`) | `handleCalculerRangs()` | `concoursStore.fetchMoyennesRangs(id)` → `GET /concours/:id/moyennes-rangs` | Réel côté API, **mais le résultat (`moyennesRangs`) n'est affiché par aucun composant** |
| "Proclamer" | `resultasContent.vue` (+ orphelin) | `handleProclamer()` | `concoursStore.proclaimAdmissions(id)` → `PATCH /concours/:id/proclamer` | Réel |
| "PDF" (liste des admis) | `resultasContent.vue` (+ orphelin) | `handleDownloadAdmis()` | `concoursStore.downloadAdmisList(id, 'pdf')` → `GET /concours/:id/admis/export?format=pdf` | Réel |
| "Proclamations" (bouton en-tête config) | `configDetails.vue` | `handleProclamations()` | `concoursStore.downloadAdmisList(id, 'pdf')` | Réel, mais **libellé trompeur** (télécharge, ne proclame pas) |
| "Générer un rapport" | `RapportHeader.vue` | — | Aucun handler défini | Non implémenté |
| "Consulter / PDF / Désarchiver" (archives) | `RapportContent.vue` | `viewDetails / downloadFinalPV / unarchiveConcours` | `console.log` / toast local uniquement | Simulé |
| "Exporter le rapport" | `ResultatContent.vue` | `exportStatistiques()` | `console.log` uniquement | Simulé |

#### 8. Formulaires

**8.1 `AddConcour.vue` (modale "Ouverture d'un nouveau concours")**

| Champ | v-model | Type | Obligatoire | Validation | Valeur par défaut |
|---|---|---|---|---|---|
| Année Académique | `form.annee_id` | select | oui (`required`) | — | pré-rempli automatiquement avec `anneeStore.anneeAcademique.id` (année courante, via `fetchCurrentAnnee()`), option unique affichée |
| Type concours | `form.type_concours` | select (ENTREE / TEST / PASSERELLE / SPECIAL) | oui | — | vide |
| Désignation | `form.designation` | text | oui | — | vide |
| Statut Initial | `form.statut` | select (PLANIFIE / OUVERT / CLOTURE / ANNULE) | oui | — | vide (pas de valeur pré-sélectionnée bien que "Planifié" soit listé en premier) |
| Date de Début | `form.date_debut` | date | oui | `validateDates()` : la date de fin ne peut être antérieure à la date de début (`dateError`) | vide |
| Date de Fin | `form.date_fin` | date | oui | idem | vide |
| Date limite dossier | `form.date_limite_inscription` | date | oui | aucune validation croisée avec date_debut/date_fin | vide |
| Description / critères | `form.description` | textarea | non | — | vide |

- **Payload envoyé** (`submitConcour`) : `{ ...form, annee_id: form.annee_id || null }` → `POST /concours`.
- **Succès** : `messageStore.notifySuccess('Concours créé avec succès.')`, rechargement de la liste (`fetchConcours()`), formulaire réinitialisé, modale fermée (`bootstrap.Modal.hide()`).
- **Échec** : `messageStore.notifyError(...)`. **Comportement notable** : comme le store capture l'erreur dans un `try/catch` interne sans la relancer, le composant considère toujours l'appel comme terminé avec succès du point de vue du flux JS : `resetForm()` et `closeModal()` s'exécutent **dans tous les cas**, même en cas d'échec de création (seule la notification d'erreur distingue les deux cas pour l'utilisateur).
- Le bouton submit est désactivé si `concoursStore.loading` est vrai ou si `dateError` est actif.

**8.2 Ligne d'édition d'épreuve (`TabEpreuves.vue`, formulaire inline)**

| Champ | v-model | Type | Obligatoire | Validation (`validateEpreuve`) |
|---|---|---|---|---|
| Code | `epreuve.code` | text (majuscule à la sauvegarde) | oui | code et intitulé non vides |
| Intitulé | `epreuve.designation` | text | oui | idem |
| Coefficient | `epreuve.coefficient` | number (`v-model.number`, min 1) | oui | doit être un nombre > 0 |
| Heure Début | `epreuve.heure_debut` | time | oui | horaires obligatoires |
| Heure Fin | `epreuve.heure_fin` | time | oui | heure fin doit être postérieure à l'heure début |
| Type | `epreuve.type_epreuve` | select (écrit / oral / pratique) | — | normalisation : "ÉCRIT"/"ÉCRITE" → `ECRIT` en majuscule ; oral/pratique conservés tels quels (incohérence de casse potentielle avec le code) |

- **Payload** (`saveEpreuve`) : `{ code, designation, coefficient, heure_debut, heure_fin, type_epreuve, concours_id }` → `POST /concours/epreuves` (création) ou `PUT /gestions/concours/epreuves/:id` (modification — noter le préfixe `/gestions/` différent de celui utilisé pour la création et la suppression, incohérence de chemin dans `gestionApi.js`).
- **Succès/échec** : géré via `messageStore` dans le store ; rechargement de `loadEpreuvesData()` après sauvegarde.

**8.3 Import de candidats (`TabCandidats.vue`)**

- Champ fichier unique (`accept=".csv, .xlsx, .xls"`), taille max **5 Mo** (validation client avant envoi, message d'erreur si dépassement).
- **Payload** : `FormData` avec `concours_id` et `file` → `candidatStore.importCandidatsFile()` → `POST /candidats/import`.
- Succès : toast + rechargement de la liste des candidats (retour à la page 1). Échec : toast d'erreur (géré côté store).

**8.4 Import de notes (`TabNotes.vue`)**

- Champ fichier (mêmes contraintes de type/taille), colonnes attendues documentées à l'écran : `num_table`, `note`.
- Garde-fou supplémentaire : vérifie que `concoursId` n'est ni vide, ni littéralement `"undefined"`/`"null"` avant envoi.
- **Payload** : `FormData` avec `concours_id` et `file` → `candidatStore.importNotesFile()` → `POST /candidats/import/notes`.

**8.5 Saisie manuelle des notes (`TabNotes.vue`, grille)**

- Champ Note par ligne, `type="number"`, `min=0`, `max=20`, `step=0.25`.
- Validation temps réel (`validateRowNote`) : hors intervalle [0,20] → badge d'erreur "Max 20", ligne bloquée pour la sauvegarde.
- **Payload envoyé par ligne modifiée** : `{ concours_id, code_epreuve, note, appreciation: null }` → `POST /candidats/:numTable/notes` (boucle séquentielle `for...of`, pas d'envoi en lot).
- Sauvegarde bloquée globalement si au moins une ligne est en erreur (`hasErrors`).
- Navigation clavier : `Enter` déplace le focus vers l'input de la ligne suivante (`focusNextInput`).

#### 9. Tableaux et tables de navigation

| Tableau | Composant | Source des données | Pagination | Recherche/filtre |
|---|---|---|---|---|
| Liste des concours | `editionsContent.vue` | Réelle — `concoursStore.concoursList` (`GET /concours`) | Oui, client (`Pagination.vue`, 10/page) | Oui, client (multi-champs) |
| Liste des concours (orpheline) | `ListConcour.vue` | **Mock** (4 lignes codées en dur), fichier sans `<template>`, jamais rendu | Oui (code présent mais inutilisable) | Non |
| Résultats/Délibération (liste des concours) | `resultasContent.vue` | Réelle — `concoursStore.concoursList` | Non (pas de composant `Pagination`) | Oui, client |
| Résultats/Délibération (orpheline, doublon) | `ConcoursConfig.vue` | Réelle — `concoursStore.concoursList`, mais **composant jamais importé** | Non | Non |
| Registre des épreuves | `TabEpreuves.vue` | Réelle — `concourStore.epreuvesList` (`GET /concours/:id/epreuves`) | Non | Non |
| Registre des candidatures | `TabCandidats.vue` | Réelle — `candidatStore.candidats` (`GET /candidats/concours/:id`) | Oui, client (10/20 par page) | Non (pas de champ recherche) |
| Grille de saisie des notes | `TabNotes.vue` | Réelle — `candidatStore.candidats` filtrés par épreuve (`GET /candidats/concours/:id/epreuve`) | Non | Non |
| Aperçu du classement (délibération) | `TabDeliberation.vue` | **Mock** — `simulationList` codé en dur (3 candidats fictifs) | Non | Non (tri/filtre par seuil, calculé côté client) |
| Journal d'audit / Historique | `HistoriqueContent.vue` | **Mock vide** — tableau `logs` toujours `[]` | Non | Oui (recherche + 2 selects), mais sans effet visible car aucune donnée |
| Statistiques comparatives | `ResultatContent.vue` | **Mock** — `comparisonStats` codé en dur | Non | Sélecteur d'année sans effet réel sur les valeurs |
| Archives des concours | `RapportContent.vue` | **Mock** — `archives` codé en dur (4 lignes) | Non | Oui, client (recherche, année, statut) |

#### 10. Onglets

| Niveau | Composant conteneur | Onglet | Sous-composant rendu | Actif par défaut | Accessible via UI |
|---|---|---|---|---|---|
| Edition (liste) | `ConcoursTab.vue` | Concours | `editionsContent.vue` | Oui | Oui |
| Edition (liste) | `ConcoursTab.vue` | Resultats | `resultasContent.vue` | Non | Oui |
| Edition (liste) | `ConcoursTab.vue` | Historique | `HistoriqueContent.vue` | Non | Oui |
| Edition (liste) | `ConcoursTab.vue` | *(statistiques, orphelin)* | `<StatistiquesContent />` (non importé) | Non | **Non** — aucun `nav-link` ne cible cet onglet ; composant non résolu |
| Configuration (`configDetails`) | `configTab.vue` | 1. Épreuves | `TabEpreuves.vue` | Oui | Oui |
| Configuration | `configTab.vue` | 2. Candidatures | `TabCandidats.vue` | Non | Oui |
| Configuration | `configTab.vue` | 3. Saisie des Notes | `TabNotes.vue` | Non | Oui |
| Configuration | `configTab.vue` | 4. Délibération & Publication | `TabDeliberation.vue` | Non | Oui (mais logique interne simulée) |
| Rapport | `RapportTab.vue` | Statistiques | `ResultatContent.vue` | Oui | Oui (données mockées) |
| Rapport | `RapportTab.vue` | Archives | `RapportContent.vue` | Non | Oui (données mockées) |
| Rapport | `RapportTab.vue` | *(sales, orphelin)* | `<StatsAcademique />` (non importé) | Non | **Non** |
| Rapport | `RapportTab.vue` | *(purchases, orphelin)* | `<StatsRapport />` (non importé) | Non | **Non** |

#### 11. Workflow métier complet — `WF-CONCOURS-01`

Titre : Cycle de vie d'un concours, de la création à la proclamation.

1. **Création du concours** — Un utilisateur clique sur "+ Ajouter un nouveau" (`ConcourHeader.vue`) → modale `AddConcour.vue` → saisie Désignation, Type, Année académique (auto), Statut initial, dates (début/fin/limite dossier), description → soumission → `concoursStore.addConcours()` → `POST /concours` → rafraîchissement de la liste (`fetchConcours()`).
2. **Configuration** — Depuis la liste (`editionsContent.vue`), clic sur "Configurer" → navigation `router-link` vers `/edition-concours/:id/configurations` → `configDetails.vue` résout le concours via `concoursStore.concoursList.find(id)`.
3. **Définition des épreuves** — Onglet "1. Épreuves" (`TabEpreuves.vue`) : chargement (`fetchEpreuvesByConcours`), ajout de lignes (code, intitulé, coefficient, horaires, type), sauvegarde (`addEpreuve`/`editEpreuve` → `POST`/`PUT`), suppression (`removeEpreuve` → `DELETE`, avec bug de rechargement identifié en §5.5).
4. **Inscription des candidats** — Onglet "2. Candidatures" (`TabCandidats.vue`) : téléchargement du modèle Excel, import du fichier rempli (`importCandidatsFile` → `POST /candidats/import`), consultation de la liste chargée (`fetchCandidatsByConcours`).
5. **Saisie des notes** — Onglet "3. Saisie des Notes" (`TabNotes.vue`) : sélection d'une épreuve, chargement des candidats de cette épreuve (`fetchCandidatsByEpreuve`), saisie manuelle case par case ou import de masse (`importNotesFile`), sauvegarde ligne par ligne (`addNote` → `POST /candidats/:numTable/notes`).
6. **Calcul des rangs** — Depuis l'onglet "Resultats" au niveau de la liste des concours (`resultasContent.vue`, **pas** dans l'onglet Délibération de la configuration), bouton "Rangs" → confirmation → `concoursStore.fetchMoyennesRangs(id)` → `GET /concours/:id/moyennes-rangs`. **Cet appel est réel côté backend**, mais son résultat n'est affiché dans aucune vue du frontend (état `moyennesRangs` du store jamais consommé par un composant).
7. **Délibération / simulation locale (optionnelle, non persistée)** — Onglet "4. Délibération & Publication" de la configuration (`TabDeliberation.vue`) : ajustement du seuil d'admission, visualisation d'un classement **simulé** (données fictives, non liées aux vraies notes saisies à l'étape 5), bouton "Publier les Résultats" qui **ne déclenche aucun appel réseau** (code commenté).
8. **Proclamation officielle** — Depuis l'onglet "Resultats" (`resultasContent.vue`) ou le bouton "Proclamations" de `configDetails.vue` (qui télécharge en réalité le PDF plutôt que de proclamer, cf. §5.2) : bouton "Proclamer" → confirmation → `concoursStore.proclaimAdmissions(id)` → `PATCH /concours/:id/proclamer` → rafraîchissement du concours (`fetchConcoursById`).
9. **Téléchargement de la liste des admis** — Bouton "PDF" (`resultasContent.vue`) ou "Proclamations" (`configDetails.vue`) → `concoursStore.downloadAdmisList(id, format)` → `GET /concours/:id/admis/export?format=pdf|excel` → génération d'un Blob téléchargé côté navigateur.
10. **Changement de statut manuel** (hors séquence linéaire, disponible à tout moment depuis la liste) — via `ItemActions.vue` → "Modifier le statut" → sélection PLANIFIE/OUVERT/CLOTURE/ANNULE → **actuellement cassé** (§5.5, méthode de store inexistante).
11. **Consultation ultérieure** — Rapports (`/rapport-concours`) et Archives : écrans **non connectés aux données réelles du concours** (données mockées, cf. §5.3/§5.5).

#### 12. Cas d'utilisation

- **`UC-CONCOURS-01` — Créer une nouvelle édition de concours.** Acteur (rôle probable à confirmer) : Gestionnaire des concours. Déclencheur : bouton "+ Ajouter un nouveau". Résultat : nouvel enregistrement concours créé côté backend (`POST /concours`), visible dans la liste.
- **`UC-CONCOURS-02` — Configurer les épreuves d'un concours.** Acteur : Gestionnaire des concours. Pré-requis : concours existant. Actions : ajout/modification/suppression de lignes d'épreuves (matière, coefficient, horaires, type).
- **`UC-CONCOURS-03` — Inscrire des candidats par import de fichier.** Acteur : Gestionnaire des concours. Actions : téléchargement du modèle, remplissage hors application, import du fichier (CSV/XLSX ≤ 5 Mo).
- **`UC-CONCOURS-04` — Saisir ou importer les notes d'une épreuve.** Acteur : Jury / Responsable de notation (rôle probable à confirmer). Actions : sélection d'une épreuve, saisie note par note (0-20, pas de 0,25) ou import Excel en masse.
- **`UC-CONCOURS-05` — Calculer les moyennes et rangs d'un concours.** Acteur : Responsable de délibération (rôle probable à confirmer). Action : bouton "Rangs" depuis l'onglet Résultats. **Limite constatée** : le résultat du calcul n'est affiché nulle part dans l'interface actuelle.
- **`UC-CONCOURS-06` — Proclamer les admissions.** Acteur : Direction / Responsable de délibération (rôle probable à confirmer). Action : bouton "Proclamer" (avec confirmation bloquante), change le statut du concours côté backend.
- **`UC-CONCOURS-07` — Télécharger la liste des admis.** Acteur : tout utilisateur ayant accès à l'écran. Action : bouton "PDF" ou "Proclamations", génère un fichier PDF ou Excel téléchargé localement.
- **`UC-CONCOURS-08` — Modifier le statut d'un concours.** Acteur : Gestionnaire des concours. **État actuel : non fonctionnel** (bug technique identifié en §5.5).
- **`UC-CONCOURS-09` — Simuler une délibération locale (seuil d'admission).** Acteur : Responsable de délibération. **Nature** : purement exploratoire/visuelle, sans lien avec les vraies notes ni sauvegarde côté serveur.
- **`UC-CONCOURS-10` — Consulter les rapports et statistiques des concours.** Acteur : Direction / Consultant. **État actuel** : écran de démonstration à données statiques, aucune donnée réelle.

#### 13. Données manipulées

| Entité | Champs identifiés dans le code | Où le champ apparaît |
|---|---|---|
| **Concours / Édition** | `id`, `designation`, `type_concours` (ENTREE/TEST/PASSERELLE/SPECIAL), `annee_id`, `code_annee` (affichage), `libelle_type` (affichage), `statut` (PLANIFIE/OUVERT/CLOTURE/ANNULE, + statut additionnel `PROCLAME` vu côté affichage résultats ; alias de normalisation `FERME/FERMEE/CLOTUREE→CLOTURE`, `PROCLAMEE→PROCLAME` dans `ItemActions.vue`), `date_debut`, `date_fin`, `date_limite_inscription`, `description`, `dossier_requis` (booléen, visible uniquement dans la modale "Détails" de `ItemActions.vue`, absent du formulaire de création) | `AddConcour.vue`, `editionsContent.vue`, `resultasContent.vue`, `ItemActions.vue`, `configDetails.vue` |
| **Épreuve** | `id`, `code`, `designation`, `coefficient`, `heure_debut`, `heure_fin`, `type_epreuve` (ECRIT/oral/pratique), `concours_id` | `TabEpreuves.vue` |
| **Candidat** | `id`/`candidat_id`, `num_table`, `nom`, `prenom`, `sexe`, `email`, `telephone`/`tel`, + champs du modèle d'import : `date_naissance`, `lieu_naissance`, `ville`, `code_filiere`, `chemin_photo` | `TabCandidats.vue`, `TabNotes.vue` |
| **Note** | `candidat_id`/`num_table`, `concours_id`, `code_epreuve`, `note` (0-20, pas 0,25), `appreciation` (toujours `null` côté UI) | `TabNotes.vue` |
| **Résultat / Rang** (`moyennesRangs`) | Structure de retour de `GET /concours/:id/moyennes-rangs` — **forme exacte non déterminable** : le store stocke `response.data` tel quel dans `moyennesRangs`, sans qu'aucun composant ne le lise ni ne l'affiche | `concourStore.js` uniquement (état orphelin) |
| **Log d'audit** (Historique) | `id`, `date`, `utilisateur`, `role`, `module`, `description`, `details`, `ip`, `severite` (CRITICAL/INFO) | `HistoriqueContent.vue` — **structure jamais alimentée** (tableau vide en dur) |
| **Archive** (mock) | `id`, `session`, `code`, `libelle`, `total_candidats`, `statut_final`, `date_archivage` | `RapportContent.vue` — **données mockées, structure indicative uniquement** |

#### 14. API et intégration backend

| Fonction API (`gestionApi.js`) | Méthode / Endpoint | Action du store appelante | Composant(s) déclencheur(s) | Statut |
|---|---|---|---|---|
| `getConcours()` | `GET /concours` | `concoursStore.fetchConcours()` | `editionsContent.vue`, `resultasContent.vue`, `configDetails.vue` (fallback), `RapportConcours` (non — voir note) | Réel |
| `getConcoursById(id)` | `GET /concours/:id` | `concoursStore.fetchConcoursById()` | Appelée après `proclaimAdmissions` et `changeStatut` (recharge le concours) | Réel |
| `createConcours(data)` | `POST /concours` | `concoursStore.addConcours()` | `AddConcour.vue` | Réel |
| `updateConcours(id, data)` | `PUT /concours/:id` | `concoursStore.editConcours()` | **Aucun composant du module Concours ne l'appelle actuellement** (action de store non utilisée dans les vues lues) | Réel côté store, non déclenché par l'UI |
| `changeConcoursStatut(id, data)` | `PATCH /concours/:id/statut` | `concoursStore.changeStatut()` | **Aucun composant ne l'appelle** — `editionsContent.vue` appelle par erreur `updateConcoursStatus` (inexistant), cf. §5.5 | Réel côté store, mais jamais exécuté à cause du bug d'appel |
| `deleteConcours(id)` | `DELETE /concours/:id` | `concoursStore.removeConcours()` | `editionsContent.vue::confirmDelete` | Réel |
| `getEpreuvesByConcours(id)` | `GET /concours/:id/epreuves` | `concourStore.fetchEpreuvesByConcours()` | `TabEpreuves.vue`, `TabNotes.vue` | Réel |
| `getEpreuveById(id)` | `GET /concours/epreuves/:id` | `concourStore.fetchEpreuveById()` | **Aucun composant ne l'appelle** | Réel côté store, inutilisé |
| `createEpreuve(data)` | `POST /concours/epreuves` | `concourStore.addEpreuve()` | `TabEpreuves.vue` | Réel |
| `updateEpreuve(id, data)` | `PUT /gestions/concours/epreuves/:id` | `concourStore.editEpreuve()` | `TabEpreuves.vue` | Réel (chemin différent de celui de création, incohérence de préfixe `/gestions/`) |
| `deleteEpreuve(id)` | `DELETE /gestions/concours/epreuves/:id` | `concourStore.removeEpreuve()` | `TabEpreuves.vue` | Réel |
| `calculerMoyennesEtRangs(id)` | `GET /concours/:id/moyennes-rangs` | `concourStore.fetchMoyennesRangs()` | `resultasContent.vue` (bouton "Rangs") | Réel, mais résultat non affiché (§9/§13) |
| `proclamerAdmissions(id)` | `PATCH /concours/:id/proclamer` | `concourStore.proclaimAdmissions()` | `resultasContent.vue` (bouton "Proclamer") | Réel |
| `downloadAdmis(id, format)` | `GET /concours/:id/admis/export?format=` | `concourStore.downloadAdmisList()` | `resultasContent.vue`, `configDetails.vue` | Réel |
| `createCandidat(data)` | `POST /candidats` | `candidatStore.addCandidat()` | **Aucun composant du module ne l'appelle** (pas de formulaire de création manuelle unitaire de candidat trouvé) | Réel côté store, inutilisé dans les vues lues |
| `addPieceCandidat(id, data)` | `POST /candidats/:id/pieces` | `candidatStore.addPiece()` | **Aucun composant ne l'appelle** | Réel côté store, inutilisé |
| `importCandidats(formData)` | `POST /candidats/import` | `candidatStore.importCandidatsFile()` | `TabCandidats.vue` | Réel |
| `importNotesCandidats(formData)` | `POST /candidats/import/notes` | `candidatStore.importNotesFile()` | `TabNotes.vue` | Réel |
| `addNoteEpreuve(numTable, data)` | `POST /candidats/:numTable/notes` | `candidatStore.addNote()` | `TabNotes.vue` | Réel |
| `getCandidatsByConcours(id)` | `GET /candidats/concours/:id` | `candidatStore.fetchCandidatsByConcours()` | `TabCandidats.vue` | Réel |
| `getCandidatById(id)` | `GET /candidats/:id` | `candidatStore.fetchCandidatById()` | **Aucun composant ne l'appelle** | Réel côté store, inutilisé |
| `getCandidatsByEpreuve(concoursId, code)` | `GET /candidats/concours/:id/epreuve` (code envoyé en objet params, à vérifier côté `buildService`) | `candidatStore.fetchCandidatsByEpreuve()` | `TabNotes.vue` | Réel |

**Aucun endpoint** n'existe pour : suppression unitaire d'un candidat, délibération/publication de PV (seuil d'admission), export Excel des épreuves, statistiques/rapports, ou archives — ces fonctionnalités visibles à l'écran sont donc, par construction, non branchées à un backend réel.

#### 15. Règles métier détectées

- `RM-CONCOURS-01` — **Statuts d'un concours** : valeurs autorisées à la création/modification manuelle : `PLANIFIE`, `OUVERT`, `CLOTURE`, `ANNULE` (`AddConcour.vue`, `ItemActions.vue`). Un 5ᵉ statut, `PROCLAME`, apparaît uniquement en lecture (résultat de l'action de proclamation), avec des alias de normalisation reconnus en affichage (`FERME`/`FERMEE`/`CLOTUREE` → `CLOTURE`, `PROCLAMEE` → `PROCLAME`) dans `ItemActions.vue` et `resultasContent.vue`.
- `RM-CONCOURS-02` — **Cohérence des dates** : dans `AddConcour.vue`, la date de fin ne peut pas être antérieure à la date de début (`validateDates`), contrôle bloquant la soumission (`dateError`). Aucune validation croisée n'existe pour `date_limite_inscription` par rapport à `date_debut`/`date_fin`.
- `RM-CONCOURS-03` — **Validation d'une épreuve** (`TabEpreuves.vue::validateEpreuve`) : code et intitulé obligatoires ; heures de début/fin obligatoires et l'heure de fin doit être postérieure à l'heure de début ; coefficient obligatoire et strictement supérieur à 0.
- `RM-CONCOURS-04` — **Plage de notes** : une note doit être comprise entre 0 et 20 inclus, avec un pas de 0,25 (`TabNotes.vue`) ; toute valeur hors intervalle bloque l'enregistrement de la grille complète (pas seulement de la ligne concernée).
- `RM-CONCOURS-05` — **Taille maximale des fichiers importés** : 5 Mo, contrôlée côté client avant tout envoi, aussi bien pour l'import de candidats que pour l'import de notes.
- `RM-CONCOURS-06` — **Seuil d'admission (délibération)** : dans `TabDeliberation.vue`, un candidat est considéré "Admis" si `moyenne >= seuilAdmission` (défaut `10.0`, ajustable entre 0 et 20 par pas de 0,1), sinon "Ajourné". **Cette règle n'est appliquée que sur des données simulées côté frontend et n'a aucun effet persistant** (cf. §5, §6, §11 étape 7).
- `RM-CONCOURS-07` — **Calcul des rangs / proclamation = opérations backend réelles** : les actions "Rangs" (`calculerMoyennesEtRangs`) et "Proclamer" (`proclamerAdmissions`) déclenchent bien un appel API réel côté `resultasContent.vue`, contrairement à la simulation locale de `TabDeliberation.vue`. La proclamation est protégée par une confirmation utilisateur explicite ("cette action va figer les notes...").
- `RM-CONCOURS-08` — **Restriction d'affichage du bouton "Proclamer"** (`resultasContent.vue::canProclaim`) : le bouton n'est visible que si le statut normalisé du concours n'est ni `PROCLAME` ni `ANNULE`.
- `RM-CONCOURS-09` — **Aucune règle de contrôle d'accès (RBAC)** n'est appliquée dans le code du module (aucune vérification de rôle avant l'affichage des boutons ou l'exécution des actions) — cf. section 2.

---

### Points à confirmer

- La forme exacte des données retournées par `GET /concours/:id/moyennes-rangs` (structure de `moyennesRangs`) ne peut être déterminée : aucune vue ne consomme ce champ du store.
- Le rôle exact autorisé à effectuer chaque action (création, saisie de notes, proclamation) n'est défini nulle part dans le code du module ; les rôles mentionnés en section 2 sont des suppositions à valider avec l'équipe métier/backend.
- Il n'est pas certain que le backend expose réellement les routes `PUT /concours/:id`, `PATCH /concours/:id/statut`, `GET /candidats/:id`, `POST /candidats`, `POST /candidats/:id/pieces`, `GET /concours/epreuves/:id` : ces fonctions existent côté `gestionApi.js`/store mais ne sont appelées par aucune vue du module Concours actuellement lue — leur disponibilité réelle côté serveur reste à vérifier.
- Le préfixe d'URL incohérent entre `createEpreuve`/`deleteEpreuve` (`/concours/epreuves`) et `updateEpreuve`/`deleteEpreuve` (`/gestions/concours/epreuves`) dans `gestionApi.js` mérite vérification auprès de l'équipe backend (possible faute de frappe ou véritable double montage de routeur).
- Le comportement exact de Vue Router lorsqu'un utilisateur accède directement à l'URL `/resultats-concours` (référencée dans `menuGroups.concours` mais sans route déclarée) n'a pas été vérifié en exécution — dépend de la configuration globale du routeur (page 404, redirection, etc.), non incluse dans les fichiers lus pour cette documentation.

---

### Module : Finances

#### 1. Objectif métier

Le module Finances est censé permettre la gestion des flux financiers de l'établissement (ERP académique LMD) : encaissement des paiements étudiants (scolarité, inscription, soutenance, etc.), émission et suivi des factures, et production de rapports/bilans financiers (paiements, factures, balance âgée, simulations budgétaires).

**Constat majeur (à respecter dans toute lecture de ce document) : à l'état actuel du code source, ce module est une maquette front-end complète (UI/UX, tableaux, formulaires, graphiques) mais entièrement déconnectée du backend.** Aucun composant Vue du module (`Paiements.vue`, `Facturation.vue`, `RapportFinances.vue` et tous leurs sous-composants) n'importe ni les stores Pinia dédiés (`financeStore.js`, `factureStore.js`) ni `financeApi.js`, ni les utilitaires d'export réels (`exportExcel.js`, `exportPDF.js`). Toutes les données affichées sont des tableaux JavaScript codés en dur (`ref([...])`), et toutes les actions de sauvegarde/export/génération de reçu se limitent à des `alert()` JavaScript simulant une confirmation, sans aucun appel réseau.

#### 2. Acteurs concernés

Aucun système de rôles (RBAC) n'est visible dans le code de ce module ni dans le routeur (`src/routes/index.js` applique uniquement `meta: { requiresAuth: true }` de façon globale, sans distinction de rôle). Aucun contrôle `v-if`/`can()`/permission n'est présent dans les fichiers lus.

- **Rôle probable à confirmer** : Agent comptable / Caissier (saisie des paiements, impression de reçus).
- **Rôle probable à confirmer** : Responsable financier / Comptable (facturation, rapports, bilans, archives).
- **Rôle probable à confirmer** : Administrateur système (accès global à toutes les fonctions Finances).

#### 3. Menus et sous-menus associés

Extrait de `src/components/partials/sidebar.vue` (groupe `finances`, icône `mdi-wallet`) :

| Libellé menu sidebar | Route cible |
|---|---|
| Finances (groupe parent) | — |
| Paiements & reçus | `/paiements-finances` |
| Facturations | `/factures-finances` |
| Rapports | `/rapports-financiers` |

Le tableau `menuGroups.finances` (ligne ~713 de `sidebar.vue`) liste ces 3 chemins pour déterminer l'état actif/déplié du groupe de menu.

#### 4. Pages et routes associées

| Route | Nom (name) | Composant | Fichier |
|---|---|---|---|
| `/paiements-finances` | `FinancePaiement` | `Paiements.vue` | `src/views/finances/paiements/Paiements.vue` |
| `/factures-finances` | `FinanceFacture` | `Facturation.vue` | `src/views/finances/facturations/Facturation.vue` |
| `/rapports-financiers` | `RapportsFinanciers` | `RapportFinances.vue` | `src/views/finances/rapports/RapportFinances.vue` |

Toutes ces routes sont déclarées dans `src/routes/finances.routes.js` et intégrées comme enfants du layout `DefaultLayout` (`meta: { requiresAuth: true }`) dans `src/routes/index.js`. Aucune méta additionnelle (rôle, permission) n'est définie par route.

#### 5. Description fonctionnelle complète

Le module se compose de 3 écrans, chacun structuré en Header + onglets Bootstrap (`nav-tabs` / `tab-pane`) :

- **Paiements** (`Paiements.vue`) : gestion de la saisie et de la consultation des paiements étudiants. 3 onglets : Liste des paiements (`PaiementList`), Nouveau paiement (`PaiementForm`), Archives (`PaiementArchives`).
- **Facturation** (`Facturation.vue`) : gestion des factures étudiantes, des états d'honoraires des formateurs et des transactions financières (entrées/sorties). 3 onglets : Factures (`FacturationList`), États honoraires (`FacturationForm` — malgré son nom, affiche en réalité un tableau des honoraires des formateurs, pas un formulaire de facture), Transactions (`FacturationArchives` — malgré son nom, affiche un registre de transactions financières type "flux de trésorerie", pas des archives figées).
- **Rapports Financiers** (`RapportFinances.vue`) : tableau de bord analytique. 5 onglets : Rapports Paiements (`RapportPaiements` — graphiques Chart.js), Rapports Factures (`RapportFactures` — balance âgée des créances), Bilans Financiers (`RapportBilans` — KPI consolidés), Simulations & Projections (`RapportSimulations` — simulateur budgétaire avec curseurs), Assistant IA (`AssistantIA` — chatbot simulé).

Chaque page racine (`Paiements.vue`, `Facturation.vue`, `RapportFinances.vue`) affiche un `SkeletonLoader` pendant 3 secondes (`setTimeout` factice dans `onMounted`) avant de révéler le contenu — cette temporisation ne correspond à aucun chargement de données réelles (la variable `formateurs` peuplée dans ce `onMounted` n'est même pas utilisée dans le template).

Il existe également 3 fichiers orphelins et vides dans `src/views/finances/facturations/components/Tab/` : `PaiementArchives.vue` (en réalité un doublon non vide reprenant la vue "Transactions"), `PaiementForm.vue` et `PaiementList.vue` (vides — `<template></template><script setup></script>`). Ces 3 fichiers ne sont importés nulle part dans `FacturationTab.vue` ni ailleurs dans le code (vérifié par recherche globale) — ce sont des résidus de refactoring, sans impact fonctionnel.

#### 6. Interfaces du module

##### Écran : Paiements (`/paiements-finances`)

- **Fichier racine** : `src/views/finances/paiements/Paiements.vue`
- **Header** (`PaiementHeader.vue`) : titre "Gestion des Paiements", sous-titre "Suivi des transactions et factures étudiantes", fil d'Ariane (Accueil / Finances / Paiements), 4 boutons d'action rapide (Exporter, Voir paiements récents, Ajouter, Générer un rapport) — **tous sans handler `@click`**, purement décoratifs (aucune logique JS attachée dans `<script setup>` qui est vide de tout code métier).
- **Onglets** (`PaiementTab.vue`, Bootstrap `nav-tabs`) : "Paiements" (actif par défaut), "Nouveau Paiement", "Archives".
  - **Sous-onglet Paiements** → `PaiementList.vue` : registre des paiements avec filtres (Cycle, Filière, Mois, Classe), tableau (Matricule, Nom & Prénom, Montant, Type de frais, Statut [Payé/Partiel avec badge coloré], Date, Mode, Actions), ligne de total cumulé filtré, bouton d'impression de reçu par ligne, groupe d'export CSV/Excel/PDF en en-tête.
  - **Sous-onglet Nouveau Paiement** → `PaiementForm.vue` : formulaire de saisie de paiement + widget "Importation de masse" (modal upload CSV/XLSX) + liste "Dernières opérations" (feedback visuel local).
  - **Sous-onglet Archives** → `PaiementArchives.vue` : sélecteur d'exercice académique archivé (années codées en dur : 2022-2023, 2023-2024, 2024-2025), cartes de synthèse (Total Encaissé, Taux de Recouvrement, Restes à Recouvrer), tableau de clôture annuelle par promotion/classe, bouton de téléchargement du "Grand Livre" PDF (simulé par `alert()`).

##### Écran : Facturation (`/factures-finances`)

- **Fichier racine** : `src/views/finances/facturations/Facturation.vue`
- **Header** (`FacturationHeader.vue`) : titre "Gestion des Facturations", sous-titre "Création et suivi des factures étudiantes", fil d'Ariane, 4 boutons d'action rapide (Exporter, Voir factures récentes, Créer nouvelle facture, Générer un rapport) — **tous décoratifs, sans handler**.
- **Onglets** (`FacturationTab.vue`) : "Factures" (actif par défaut), "Etats honoraires", "Transactions".
  - **Sous-onglet Factures** → `FacturationList.vue` : cartes KPI (Total Facturé, En attente/Impayés — valeurs codées en dur "12.450.000 F" / "3.200.000 F", non calculées depuis le tableau `factures`), zone de recherche + filtre statut (tous/payé/partiel/impayé), bouton "Rappels groupés", tableau des factures (N° Facture, Étudiant, Total Dû, Déjà Payé, Solde Restant, Statut avec badge coloré, Actions : télécharger PDF, envoyer email, voir détails), bouton "Génération Automatique" et "+ Nouvelle Facture" en en-tête.
  - **Sous-onglet Etats honoraires** → `FacturationForm.vue` (nom trompeur — ne contient pas de formulaire de facture mais un registre des vacations formateurs) : bascule Mensuel/Trimestriel/Annuel, KPI (Total Honoraires période, Nombre de Formateurs Actifs), tableau (Formateur, Matières/Modules, Volume Horaire, Taux Horaire, Total Brut, bouton "Fiche"), modal d'import CSV/Excel.
  - **Sous-onglet Transactions** → `FacturationArchives.vue` (nom trompeur — ne contient pas d'archives figées mais un registre de flux financiers courants) : boutons "Exporter Rapport Mensuel" et "+ Nouvelle Transaction" (modal), KPI (Total Entrées, Total Sorties, Solde Net), filtres (catégorie, mois), tableau des transactions (Date, Libellé/Motif, Catégorie, Type Entrée/Sortie, Montant, Actions modifier/supprimer).
- **Fichiers orphelins non utilisés** dans `src/views/finances/facturations/components/Tab/` : `PaiementArchives.vue` (contenu dupliqué non vide, reprend une vue "Gestion des Flux Financiers" quasi identique à `FacturationArchives.vue`, mais non référencé), `PaiementForm.vue` (vide), `PaiementList.vue` (vide). Ces 3 fichiers n'apparaissent dans aucun `import` du module Finances — code mort.

##### Écran : RapportFinances (`/rapports-financiers`)

- **Fichier racine** : `src/views/finances/rapports/RapportFinances.vue`
- **Header** (`RapportHeader.vue`) : titre "Rapports Financiers", sous-titre "Suivi des paiements, facturations et bilans", fil d'Ariane, 4 boutons d'action rapide (Exporter, Voir rapports récents, Créer nouveau rapport, Générer un rapport financier) — **tous décoratifs, sans handler**.
- **Onglets** (`RapportTab.vue`) : "Rapports Paiements" (actif par défaut), "Rapports Factures", "Bilans Financiers", "Simulations & Projections", "Assistant IA".
  - **Rapports Paiements** → `RapportPaiements.vue` : 2 graphiques Chart.js (`chart.js/auto`) — un donut "Modes de Règlement" et un histogramme "Volume des Encaissements Mensuels" — construits dynamiquement à partir d'un tableau `paiements` codé en dur (3 entrées) ; tableau détaillé des flux en dessous.
  - **Rapports Factures** → `RapportFactures.vue` : bouton "Exporter le Rapport d'Audit (.PDF)" (simulé par `alert()`), section "Balance Âgée des Créances" (4 tranches : Saines <30j, Retard Modéré 30-60j, Retard Critique 60-90j, Contentieux >90j — valeurs codées en dur), tableau "Top 5 des Plus Grands Restes à Recouvrer" avec badge de niveau de risque coloré selon `joursRetard`.
  - **Bilans Financiers** → `RapportBilans.vue` : 4 cartes KPI (Total Engagé, Recettes Encaissées, Charges/Honoraires, Trésorerie Nette — calculée via `computed`), tableau "Analyse de Recouvrement par Filière" (barre de progression du taux d'efficacité), panneau "Ratios & Indicateurs Prudentiels" (ratio charges/produits, taux de pertes sur créances, note d'analyse texte fixe).
  - **Simulations & Projections** → `RapportSimulations.vue` : simulateur budgétaire 100 % local — 3 curseurs (`input type="range"`) : Ajustement Scolarité (-20% à +30%), Recrutement Nouveaux Étudiants (-30% à +50%), Taux Horaire Formateurs (-10% à +25%). Un `computed` recalcule en temps réel CA projeté, charges projetées et résultat opérationnel à partir de constantes codées en dur (`baseFinances.caActuel = 48500000`, `chargesActuelles = 11450000`). **Simulation purement mathématique côté client, aucun appel API.**
  - **Assistant IA** → `AssistantIA.vue` : interface de chat façon copilote. **Il ne s'agit PAS d'un appel à un modèle de langage réel** : la fonction `sendMessage()` fait un `setTimeout(1200ms)` puis choisit une réponse parmi 4 blocs de texte pré-rédigés (`if/else` sur mots-clés dans la question : "prévision"/"trésorerie", "classe"/"taux", "sms"/"relance", "impact"/"vacation") ou un message par défaut ("Je n'ai pas pu compiler les données..."). Aucun SDK IA, aucune clé API, aucun `fetch`/`axios` n'est présent dans ce fichier.

#### 7. Boutons et actions

| Bouton / action | Écran / composant | Handler | Comportement réel |
|---|---|---|---|
| Exporter (icône download) | PaiementHeader, FacturationHeader, RapportHeader | Aucun (`@click` absent) | Décoratif, ne fait rien |
| Voir paiements/factures/rapports récents (icône horloge) | PaiementHeader, FacturationHeader, RapportHeader | Aucun | Décoratif |
| Ajouter / Créer / Nouveau (icône +) | PaiementHeader, FacturationHeader, RapportHeader | Aucun | Décoratif |
| Générer un rapport | PaiementHeader, FacturationHeader, RapportHeader | Aucun | Décoratif |
| CSV / Excel / PDF (export) | PaiementList.vue | `exportData(format)` | `alert()` texte simulant la préparation du fichier — n'appelle pas `exportExcel.js`/`exportPDF.js` |
| Imprimer reçu (icône imprimante) | PaiementList.vue | `generateReceipt(p)` | `alert()` simulant l'édition du reçu officiel A5 |
| Valider & Imprimer Reçu (submit) | PaiementForm.vue | `submitPaiement()` | Ajoute l'objet formulaire en tête de `recentPaiements` (état local, non persisté), affiche `alert()`, réinitialise le formulaire |
| Annuler | PaiementForm.vue | `resetForm()` | Réinitialise les champs du formulaire à leurs valeurs par défaut |
| Importer un fichier (modal) | PaiementForm.vue | `handleFileUpload(e)` | `console.log` du nom de fichier uniquement |
| Lancer l'importation | PaiementForm.vue (modal) | `processImport()` | `alert()` simulant le traitement |
| Télécharger le Grand Livre (PDF) | PaiementArchives.vue | `downloadGlobalReport()` | `alert()` simulant l'extraction |
| Sélecteur d'exercice archivé | PaiementArchives.vue | `loadArchiveData()` | Remplit `summary`/`archiveRecords` avec des valeurs codées en dur (identiques quel que soit l'exercice choisi) |
| Génération Automatique | FacturationList.vue | `triggerAutoGeneration()` | `alert()` simulant la génération mensuelle |
| + Nouvelle Facture | FacturationList.vue | `openNewFactureModal()` | **Fonction appelée dans le template mais non définie dans `<script setup>`** — provoquera une erreur runtime Vue si cliqué (référence non déclarée) |
| Rappels groupés | FacturationList.vue | `sendBulkReminders()` | `alert()` simulant l'envoi d'emails de rappel |
| Télécharger PDF (par facture) | FacturationList.vue | `downloadPDF(f)` | `alert()` |
| Envoyer par Email (par facture) | FacturationList.vue | `sendEmail(f)` | `alert()` |
| Détails (par facture) | FacturationList.vue | `viewDetails(f)` | **Fonction appelée dans le template mais non définie** — erreur runtime potentielle |
| Charger Liste (CSV/Excel) | FacturationForm.vue (honoraires) | `handleFileChange` / `processImport` | `console.log` puis `alert()` simulé |
| Fiche (par formateur) | FacturationForm.vue | `viewFiche(item)` | `alert()` simulant génération d'un relevé d'heures |
| Exporter Rapport Mensuel | FacturationArchives.vue (transactions) | `exportReport()` | `alert()` |
| + Nouvelle Transaction (modal) | FacturationArchives.vue | `saveTransaction()` | Ajoute la transaction en tête du tableau local `transactions` (état non persisté), `alert()` |
| Exporter le Rapport d'Audit (.PDF) | RapportFactures.vue | `exportGlobalAudit()` | `alert()` |
| Réinitialiser les paramètres | RapportSimulations.vue | `resetSimulateur()` | Remet les 3 curseurs à 0 |
| Requêtes fréquentes (4 boutons raccourcis) | AssistantIA.vue | `askShortcut(text)` | Pré-remplit le champ de saisie et déclenche `sendMessage()` |
| Envoyer (icône avion) | AssistantIA.vue | `sendMessage()` | Réponse simulée par mots-clés, voir section 6 |

#### 8. Formulaires

##### PaiementForm.vue (`src/views/finances/paiements/components/Tab/PaiementForm.vue`)

| Champ | Type | v-model | Requis | Options |
|---|---|---|---|---|
| Matricule ou Nom de l'Étudiant | text input | `form.etudiant` | Oui (`required` HTML) | placeholder "Ex: ETU-2024-001" |
| Nature du Paiement | select | `form.type` | Oui | Inscription, Scolarité, Soutenance, Autres |
| Montant (FCFA) | number input | `form.montant` (`.number`) | Oui | — |
| Date de paiement | date input | `form.date` | Oui | valeur par défaut = date du jour |
| Mode de paiement | select | `form.mode` | Oui | Espèces (défaut), Virement Bancaire, Wave/Orange Money, Chèque |
| Observations | textarea | `form.observations` | Non | placeholder "Note optionnelle..." |

**Validation** : uniquement HTML5 native (`required`), aucune validation JS custom, aucun schéma (Yup/Vuelidate) détecté.

**Payload / comportement soumission** : `submitPaiement()` construit `newPaiement = { id: Date.now(), ...form.value }`, l'insère en tête de `recentPaiements` (état local du composant, perdu au rechargement), affiche `alert('Paiement de X FCFA enregistré. Impression du reçu...')`, puis appelle `resetForm()`. **Aucun appel à `createPaiement()` de `financeApi.js` ni au store — le paiement n'est jamais envoyé au backend.**

**Import de masse (modal)** : input file `accept=".csv, .xlsx, .xls"`, `handleFileUpload` logue seulement le nom du fichier en console, `processImport()` affiche un `alert()`. Aucune lib de parsing (xlsx/papaparse) invoquée dans ce composant malgré la mention "format de colonne : Matricule, Montant, Type, Date".

##### FacturationForm.vue (`src/views/finances/facturations/components/Tab/FacturationForm.vue`)

Ce composant, malgré son nom, **n'est pas un formulaire de création de facture** : c'est un tableau de bord des états d'honoraires des formateurs (lecture seule), avec un modal d'import de fichier (input `accept=".xlsx, .csv"`) dont le traitement (`processImport()`) se limite à un `alert()`. Aucun champ de saisie de facture (numéro, étudiant, montant, échéance) n'existe dans ce module — la création d'une "Nouvelle Facture" (bouton dans `FacturationList.vue`) appelle `openNewFactureModal()`, qui **n'est pas implémentée** (fonction non définie dans le `<script setup>`).

**Conclusion** : il n'existe aucun véritable formulaire de création/édition de facture dans le code actuel du module.

#### 9. Tableaux et tables de navigation

| Tableau | Composant | Source des données | Pagination | Tri | Filtres |
|---|---|---|---|---|---|
| Liste des paiements | `PaiementList.vue` | Tableau local codé en dur (2 entrées) | Aucune | Aucun tri colonne (computed simple `filter`) | Cycle, Filière, Mois, Classe (client-side) |
| Archives par exercice/promotion | `PaiementArchives.vue` | Tableau local codé en dur (4 lignes, identique quel que soit l'exercice sélectionné) | Aucune | Aucun | Sélecteur d'exercice (2022-2023 à 2024-2025) |
| Liste des factures | `FacturationList.vue` | Tableau local codé en dur (3 entrées) | Aucune | Aucun | Recherche texte (étudiant/n° facture) + statut |
| États honoraires | `FacturationForm.vue` | Tableau local codé en dur (3 formateurs) | Aucune | Aucun | Bascule période Mensuel/Trimestriel/Annuel (n'affecte pas les données affichées, seul le libellé change) |
| Transactions (flux financiers) | `FacturationArchives.vue` | Tableau local codé en dur (4 entrées) | Aucune | Aucun | Catégorie, Mois |
| Détail des flux (rapport paiements) | `RapportPaiements.vue` | Tableau local codé en dur (3 entrées) | Aucune | Aucun | Aucun |
| Top 5 débiteurs | `RapportFactures.vue` | Tableau local codé en dur (5 entrées) | Aucune | Aucun (ordre fixe) | Aucun |
| Analyse par filière | `RapportBilans.vue` | Tableau local codé en dur (4 filières) | Aucune | Aucun | Aucun |

**Constat transversal** : aucune table du module n'utilise `financeApi.js`, `financeStore.js` ou `factureStore.js`. Toutes les données sont **100 % simulées côté client**, sans pagination serveur ni tri serveur (conforme aux petits volumes de données de démo codées en dur).

#### 10. Onglets

| Écran | Onglet (libellé UI) | ID HTML | Composant enfant |
|---|---|---|---|
| Paiements | Paiements | `paiement-tab` / `#paiement` | `PaiementList.vue` |
| Paiements | Nouveau Paiement | `nouveau-tab` / `#nouveau` | `PaiementForm.vue` |
| Paiements | Archives | `archives-tab` / `#archives` | `PaiementArchives.vue` |
| Facturation | Factures | `factures-tab` / `#factures` | `FacturationList.vue` |
| Facturation | Etats honoraires | `nouveau-tab` / `#nouveau` | `FacturationForm.vue` |
| Facturation | Transactions | `archives-tab` / `#archives` | `FacturationArchives.vue` |
| RapportFinances | Rapports Paiements | `paiements-tab` / `#paiements` | `RapportPaiements.vue` |
| RapportFinances | Rapports Factures | `factures-tab` / `#factures` | `RapportFactures.vue` |
| RapportFinances | Bilans Financiers | `bilans-tab` / `#bilans` | `RapportBilans.vue` |
| RapportFinances | Simulations & Projections | `simulations-tab` / `#simulations` | `RapportSimulations.vue` |
| RapportFinances | Assistant IA | `assistant-tab` / `#assistant` | `AssistantIA.vue` |

Navigation gérée par Bootstrap `data-bs-toggle="tab"` (pas de router Vue imbriqué, pas de query param d'onglet actif — un rechargement de page revient toujours au premier onglet).

#### 11. Workflow métier complet

**`WF-FINANCES-01` — Enregistrement d'un paiement (état actuel du code, simulé)**

1. L'utilisateur navigue vers `/paiements-finances` (menu sidebar "Finances → Paiements & reçus").
2. La page affiche un `SkeletonLoader` pendant 3 secondes (délai factice sans rapport avec un vrai chargement).
3. L'utilisateur clique sur l'onglet "Nouveau Paiement" → affichage de `PaiementForm.vue`.
4. L'utilisateur saisit : Matricule/Nom étudiant, Nature du paiement (Inscription/Scolarité/Soutenance/Autres), Montant, Date, Mode de paiement, Observations optionnelles.
5. Validation HTML5 native uniquement (`required` sur les champs obligatoires) — aucune vérification métier (ex. montant positif, matricule existant) n'est implémentée côté client, et aucun appel serveur n'a lieu pour la valider.
6. Au clic sur "Valider & Imprimer Reçu" : `submitPaiement()` crée un objet local avec un `id = Date.now()`, l'ajoute en tête de la liste "Dernières opérations" (affichée dans le panneau latéral, état volatile — perdu au rafraîchissement de page), affiche une `alert()` de confirmation, réinitialise le formulaire.
7. **Aucune requête HTTP n'est envoyée** (le endpoint `POST /paiements` existe pourtant dans `financeApi.js` via `createPaiement()`, mais n'est appelé par aucun composant du module).
8. Le paiement n'apparaît pas dans l'onglet "Paiements" (`PaiementList.vue`) car ce dernier lit un tableau local totalement indépendant (2 entrées codées en dur), sans lien avec `recentPaiements` du formulaire ni avec un store partagé.
9. L'impression de reçu n'est pas implémentée : aucune génération PDF, aucun appel à `exportPDF.js`.

**`WF-FINANCES-02` — Génération d'une facture (état actuel du code, non implémenté)**

1. L'utilisateur navigue vers `/factures-finances` (menu "Finances → Facturations").
2. Onglet "Factures" actif par défaut → `FacturationList.vue` affiche 3 factures codées en dur avec statuts Partiel/Payé/Impayé.
3. L'utilisateur clique sur "+ Nouvelle Facture" → appelle `openNewFactureModal()`, **fonction non définie dans le composant** : aucun modal ne s'ouvre, une erreur JavaScript sera levée dans la console du navigateur (référence non déclarée).
4. Alternative : bouton "Génération Automatique" → `triggerAutoGeneration()` affiche uniquement un `alert()` texte, sans effet sur les données ni appel API.
5. Aucun formulaire de saisie de facture (numéro, étudiant, montant dû, échéance) n'existe dans le code source actuel — le composant nommé `FacturationForm.vue` affiche en réalité un tableau des honoraires formateurs, sans rapport avec la création de facture.
6. Les actions "Télécharger PDF", "Envoyer par Email" sur une facture existante déclenchent des `alert()` simulant l'opération, sans génération de document réel ni envoi d'email.
7. **Conclusion** : le workflow de génération de facture n'est pas fonctionnellement implémenté à ce stade — seule la consultation d'une liste statique de factures est possible.

#### 12. Cas d'utilisation

- **`UC-FINANCES-01` — Consulter la liste des paiements filtrée** : l'utilisateur ouvre `/paiements-finances`, reste sur l'onglet "Paiements", applique des filtres (Cycle/Filière/Mois/Classe) sur les 2 paiements de démonstration codés en dur, consulte le total cumulé filtré. Fonctionnel côté UI, sans persistance ni source de données réelle.
- **`UC-FINANCES-02` — Saisir un nouveau paiement** : voir `WF-FINANCES-01`. Le paiement saisi n'est ni persisté en base ni reflété dans la liste des paiements.
- **`UC-FINANCES-03` — Consulter les archives financières d'un exercice académique clos** : l'utilisateur sélectionne une année dans `PaiementArchives.vue` ; les données de synthèse et le tableau par classe affichés sont **identiques pour tout exercice sélectionné** (mêmes 4 lignes et mêmes totaux codés en dur), ce qui indique une maquette non connectée à un historique réel.
- **`UC-FINANCES-04` — Rechercher/filtrer une facture par statut ou étudiant** : fonctionnel côté client sur les 3 factures statiques de `FacturationList.vue`.
- **`UC-FINANCES-05` — Consulter les états d'honoraires des formateurs** : l'utilisateur bascule Mensuel/Trimestriel/Annuel dans `FacturationForm.vue` ; le libellé change mais **les données (3 formateurs, mêmes heures/taux) restent identiques quel que soit le mode choisi**.
- **`UC-FINANCES-06` — Visualiser les rapports graphiques de paiements** : consultation de 2 graphiques Chart.js dans `RapportPaiements.vue`, générés dynamiquement à partir de 3 paiements factices — démontre l'intégration technique de Chart.js mais sur données non réelles.
- **`UC-FINANCES-07` — Simuler l'impact financier d'un ajustement tarifaire** : l'utilisateur manipule les 3 curseurs de `RapportSimulations.vue` ; le calcul de projection est **purement local (formule JS `computed`)**, sans lien avec les données réelles de scolarité/effectifs de l'établissement.
- **`UC-FINANCES-08` — Interroger l'assistant IA financier** : l'utilisateur pose une question en langage libre ou clique un raccourci ; la réponse provient d'un moteur de règles `if/else` sur mots-clés avec 4 réponses pré-rédigées + 1 réponse par défaut — **ce n'est pas un assistant IA connecté à un LLM**.

#### 13. Données manipulées

| Entité | Champs observés dans le code (UI) | Persistance réelle |
|---|---|---|
| **Paiement** | `id`, `matricule`, `nom`, `prenom`, `montant`, `type` (Inscription/Scolarité/Soutenance/Autres), `statut` (Payé/Partiel/En attente), `date`, `mode` (Espèces/Virement/Wave/Chèque), `cycle`, `filiere`, `classe`, `observations` | Aucune — tableaux locaux codés en dur par composant ; endpoints `POST/GET/PUT/DELETE /paiements` existent dans `financeApi.js` mais ne sont appelés par aucun composant du module Finances |
| **Facture** | `id`, `numero` (ex. FAC-2024-001), `etudiant`, `matricule`, `totalDu`, `dejaPaye`, `solde`, `statut` (Payé/Partiel/Impayé) | Aucune — tableau local codé en dur ; endpoints `GET/POST/PUT/DELETE /factures` existent dans `financeApi.js` mais non appelés |
| **Reçu** | Non modélisé comme entité distincte — mention "Impression du reçu" uniquement via `alert()`, aucun objet reçu structuré, aucune génération PDF réelle | Inexistant |
| **Échéance** | Balance âgée par tranches (Saines <30j, Modéré 30-60j, Critique 60-90j, Contentieux >90j) et `joursRetard` par débiteur dans `RapportFactures.vue` — valeurs agrégées codées en dur, pas d'entité "Échéance" individualisée avec date d'échéance par facture | Aucune |
| **Bilan** | `totalEngage`, `totalEncaisse`, `totalCharges`, `soldeNet` (calculé), ratios `ratioCharges`/`ratioCreances` (calculés), répartition par filière (`attendu`/`percu`/`taux`) dans `RapportBilans.vue` | Aucune — constantes codées en dur |
| **Transaction** (flux financier, hors nomenclature demandée mais présente dans le code) | `id`, `date`, `libelle`, `reference`, `categorie`, `type` (Entrée/Sortie), `montant` dans `FacturationArchives.vue` | Aucune |
| **Honoraire formateur** (hors nomenclature demandée mais présente dans le code) | `id`, `matricule`, `nom`, `prenom`, `modules`, `heures`, `taux` dans `FacturationForm.vue` | Aucune |

**Frais d'inscription** : `financeApi.js` expose également un jeu d'endpoints CRUD `/frais_inscription` (`getFraisInscription`, `createFraisInscription`, etc.) sans qu'aucun store ni composant du module Finances ne les consomme.

#### 14. API et intégration backend

`src/api/finances/financeApi.js` définit, via `serviceApi` (`src/api/config/serviceApi.js`), les endpoints REST suivants — **aucun n'est appelé par un composant Vue du module Finances** :

| Fonction API | Verbe/Route | Consommée par (store) | Store utilisé par un composant du module Finances ? |
|---|---|---|---|
| `getFinances()` | GET `/finances` | `financeStore.fetchFinances()` | Non |
| `getFinanceById(id)` | GET `/finances/:id` | `financeStore.fetchFinanceById()` | Non |
| `createFinance(data)` | POST `/finances` | `financeStore.addFinance()` | Non |
| `updateFinance(id, data)` | PUT `/finances/:id` | `financeStore.editFinance()` | Non |
| `deleteFinance(id)` | DELETE `/finances/:id` | `financeStore.removeFinance()` | Non |
| `getFactures()` | GET `/factures` | `factureStore.fetchFactures()` | Non |
| `getFactureById(id)` | GET `/factures/:id` | `factureStore.fetchFactureById()` | Non |
| `createFacture(data)` | POST `/factures` | `factureStore.addFacture()` | Non |
| `updateFacture(id, data)` | PUT `/factures/:id` | `factureStore.editFacture()` | Non |
| `deleteFacture(id)` | DELETE `/factures/:id` | `factureStore.removeFacture()` | Non |
| `getPaiements()` / `getPaiementById` / `createPaiement` / `updatePaiement` / `deletePaiement` | GET/POST/PUT/DELETE `/paiements` | **Aucun store dédié** — pas de `paiementStore.js` détecté dans `src/stores/financeStore/` | Non |
| `getFraisInscription()` / CRUD `/frais_inscription` | GET/POST/PUT/DELETE `/frais_inscription` | **Aucun store dédié** | Non |

**Stores Pinia** :
- `src/stores/financeStore/financeStore.js` (`useFinanceStore`) : CRUD complet sur `/finances`, gestion `loading`, intégration `useMessageStore()` pour les notifications succès/erreur. **Store fonctionnel et bien écrit, mais jamais importé** dans les fichiers du module Finances.
- `src/stores/financeStore/factureStore.js` (`useFactureStore`) : CRUD complet sur `/factures`, même pattern. **Jamais importé** non plus.

**Utilitaires d'export** :
- `src/utils/exportExcel.js` (`exportExcel({data, sheetName, fileName})`, basé sur la lib `xlsx`) : fonctionnel mais **non importé** dans le module Finances (les boutons CSV/Excel/PDF de `PaiementList.vue` utilisent `alert()` à la place).
- `src/utils/exportPDF.js` (`exportPDF({logoBase64, title, filters, columns, rows, fileName})`, basé sur `jspdf` + `jspdf-autotable`) : fonctionnel mais **non importé** dans le module Finances.

**Conclusion API** : il existe une couche backend prête à l'emploi (routes REST + stores Pinia typés) pour `/finances`, `/factures`, `/paiements`, `/frais_inscription`, mais le module d'interface utilisateur "Finances" documenté ici n'exploite aucune de ces routes — c'est un prototype visuel autonome avec données statiques.

#### 15. Règles métier détectées

- **`RM-FINANCES-01`** — Statuts de paiement observés dans l'UI : `Payé`, `Partiel`, `En attente` (badges colorés vert/orange). Aucune règle de calcul de statut n'est codée (le statut est une valeur figée du jeu de données, pas dérivée d'un calcul montant payé vs montant dû).
- **`RM-FINANCES-02`** — Statuts de facture observés : `Payé`, `Partiel`, `Impayé`. La fonction `getStatusBadge()` dans `FacturationList.vue` mappe ces 3 valeurs à des classes Bootstrap (`bg-success`, `bg-warning text-dark`, `bg-danger`) mais ne recalcule pas le statut à partir de `solde` — le champ `statut` est saisi/fourni indépendamment du calcul `totalDu - dejaPaye`.
- **`RM-FINANCES-03`** — Balance âgée des créances à 4 paliers, observée dans `RapportFactures.vue` : Saines (< 30 jours), Retard Modéré (30-60 jours), Retard Critique (60-90 jours), Contentieux (> 90 jours) — avec mention UI "Blocage académique" pour le palier Contentieux, suggérant une règle métier de blocage d'accès aux services académiques en cas d'impayé prolongé (**non implémentée techniquement** dans le code lu — c'est un texte informatif seulement).
- **`RM-FINANCES-04`** — Le ratio `ratioCharges` (Charges honoraires / Recettes encaissées) dans `RapportBilans.vue` déclenche visuellement une alerte (`bg-danger` au lieu de `bg-primary` sur la barre de progression) si > 40 %. C'est la seule règle de seuil réellement codée (`ratioCharges > 40 ? 'bg-danger' : 'bg-primary'`).
- **`RM-FINANCES-05`** — Simulation budgétaire (`RapportSimulations.vue`) : une hausse d'effectifs étudiants entraîne une augmentation corrélée du volume horaire de vacation, modélisée par un coefficient arbitraire de 25 % du taux de croissance des effectifs (`coefficientVolumeHeure = 1 + (effectifModifier/100) * 0.25`) — règle de simulation codée en dur, sans base statistique documentée dans le code.
- **`RM-FINANCES-06`** — Format standard de reçu mentionné dans l'UI : "Format A5 standardisé" (texte dans l'`alert()` de `generateReceipt()`), mais aucune génération de document réelle ne l'implémente.
- **`RM-FINANCES-07`** — Format de colonnes imposé pour l'import de masse de paiements (mentionné dans l'UI de `PaiementForm.vue`) : `Matricule, Montant, Type, Date`. Pour l'import des honoraires formateurs (`FacturationForm.vue`) : `matricule, nom, prenom, heures_faites, taux_horaire, mois`. Ces formats sont documentés textuellement dans l'UI mais **aucun parsing/validation de fichier n'est implémenté**.
- **`RM-FINANCES-08`** — Un exercice académique archivé est présenté comme "définitivement scellé et non modifiable" (`PaiementArchives.vue`) — règle métier de clôture d'exercice mentionnée dans l'UI, sans mécanisme technique de verrouillage observable dans le code (pas de champ `verrouille`/`cloture` piloté par API).

---

### Points à confirmer

1. **Aucune donnée réelle** : l'intégralité des trois écrans (Paiements, Facturation, Rapports) fonctionne exclusivement sur des tableaux JavaScript codés en dur dans chaque composant. Aucun appel à `financeApi.js`, `financeStore.js` ou `factureStore.js` n'a été trouvé dans le module — à confirmer si une connexion à ces stores est prévue dans une itération future ou si ces stores/API sont utilisés ailleurs dans l'application (aucune trace trouvée lors de la recherche globale du dépôt).
2. **Fonctions non définies** : `openNewFactureModal()` (bouton "+ Nouvelle Facture") et `viewDetails()` (action "Détails" par facture) sont référencées dans le template de `FacturationList.vue` mais absentes du `<script setup>` — cliquer sur ces boutons provoquera une erreur JavaScript en runtime (`ReferenceError` / `undefined is not a function`). À vérifier/corriger.
3. **Noms de composants trompeurs** : `FacturationForm.vue` n'est pas un formulaire de facture (c'est un tableau des honoraires formateurs) et `FacturationArchives.vue`/`PaiementArchives.vue` (dossier facturations, non utilisé) ne contiennent pas d'archives figées mais un registre de transactions courantes. Le vrai onglet "Archives" scellé/verrouillé n'existe que côté Paiements (`paiements/components/Tab/PaiementArchives.vue`). À clarifier avec l'équipe produit avant reconstruction : les libellés d'onglets ("Etats honoraires", "Transactions") ne correspondent pas aux noms de fichiers.
4. **Fichiers orphelins** : `src/views/finances/facturations/components/Tab/PaiementArchives.vue` (dupliqué, non vide, non importé), `PaiementForm.vue` et `PaiementList.vue` (vides, non importés) dans le dossier `facturations`. Confirmer s'ils doivent être supprimés ou s'ils correspondent à une fonctionnalité prévue mais non branchée.
5. **RBAC** : aucun contrôle de rôle/permission n'a été trouvé sur les routes ou composants Finances — seule l'authentification globale (`requiresAuth: true`) s'applique. Les acteurs listés en section 2 sont des suppositions à valider auprès du métier.
6. **Assistant IA** : à confirmer si une intégration à un vrai service LLM (Anthropic, OpenAI, etc.) est prévue pour remplacer le moteur de règles `if/else` actuel de `AssistantIA.vue`.
7. **`SkeletonLoader` de 3 secondes** dans les 3 pages racines : délai fixe sans rapport avec un chargement de données réel (les données `formateurs` chargées ne sont même pas utilisées dans le template) — probablement un reliquat de copier-coller entre modules (motif identique retrouvé à l'identique dans `Paiements.vue`, `Facturation.vue`, `RapportFinances.vue`).
8. **Relation avec le module Inscriptions** : il existe par ailleurs un composant `src/views/inscriptions/components/tabs/PaiementList.vue` et `src/views/inscriptions/components/modal/PaiementDetails.vue` qui semblent liés aux paiements mais appartiennent à un autre module (hors périmètre de cette documentation) — à examiner séparément pour vérifier s'ils dupliquent ou complètent la logique de paiement du module Finances.

---

### Modules transverses — Spécification de reconstruction fidèle

Document produit par lecture directe du code source (aucune donnée inventée). Toute affirmation de statut ("Implémenté", "Orphelin", "Mocké") est vérifiée par grep/lecture, avec le chemin de fichier exact cité.

---

### Module : Authentification & Layout global

#### 1. Objectif métier
Permettre la connexion des agents de la plateforme CFI-CIRAS (authentification par email/mot de passe), fournir la structure visuelle commune (en-tête, menu latéral, pied de page) à toutes les pages protégées, et gérer l'affichage des erreurs et notifications applicatives.

#### 2. Acteurs concernés
Tout utilisateur du back-office (aucune distinction de rôle appliquée dans l'UI malgré l'existence de getters de rôle côté store — voir §15).

#### 3. Menus et sous-menus associés
Aucun menu pour les pages `/auth/*` (formulaires plein écran, hors layout). Le layout global (`DefaultLayout.vue`) héberge le menu latéral (`sidebar.vue`) commun à toutes les routes enfants de `/`.

#### 4. Pages et routes associées

| Route | Nom | Composant | Meta | Statut |
|---|---|---|---|---|
| `/auth/login` | Login | `src/views/auth/Login.vue` | `{ public: true }` | Implémenté |
| `/auth/register` | Register | `src/views/auth/Register.vue` | `{ public: true }` | Implémenté (UI statique, non fonctionnel — voir §5) |
| `/auth/new-password` | NewPassword | `src/views/auth/Login.vue` (réutilisé) | `{ public: true }` | **Anomalie** : réutilise le composant Login, aucun formulaire de réinitialisation dédié n'existe |
| `/:pathMatch(.*)*` | NotFound | `src/views/errors/NotFound.vue` | `{ public: true }` | Implémenté (catch-all 404) |

Toutes les autres routes de l'application sont déclarées comme enfants de `/` avec `component: DefaultLayout` et `meta: { requiresAuth: true }` (`src/routes/index.js`).

**Code mort détecté** : `src/routes/main.js` est un fichier strictement identique à `src/routes/index.js` (même contenu, même router). Il n'est importé nulle part : `src/main.js` (point d'entrée de l'app) importe `./routes`, ce qui résout vers `src/routes/index.js` (résolution Node/Vite par défaut du `index.js` d'un dossier). `main.js` (dans `routes/`) est donc un doublon mort, à ne pas reproduire.

#### 5. Description fonctionnelle complète
- **Login.vue** : formulaire "email/username" + "mot de passe" avec icônes MDI, case "Souvenir de moi" (non câblée), lien "Mot de passe oublié ?" (`href="#"`, non fonctionnel), bouton "Connexion" déclenchant `handleLogin()`. Ce dernier appelle `authStore.loginUser(credentials)` puis, si `authStore.isAuthenticated` est vrai après l'appel, redirige vers `/dashboard` via `router.push`. Un lien statique renvoie vers `/auth/register`.
- **Register.vue** : formulaire HTML pur (username, email, sélecteur "Services" avec options Scolarité/Pédagogie/Coordination de cycle/Bibliothèques/Centre de maintenances/Finances et matériel, mot de passe, case CGU). **Aucun `<script>`** dans le fichier : le bouton de soumission est un simple lien `<a href="/home">SOUMETTRE</a>` — **aucun appel API, aucune validation, aucune logique métier**. Le formulaire est un habillage visuel non fonctionnel.
- **DefaultLayout.vue** : structure `Header + Sidebar + <router-view> + Footer`, gère l'état `sidebarCollapsed` (desktop, classe `sidebar-icon-only`) et `mobileSidebarOpen` (mobile, classe `sidebar-open`) via un simple `ref` local, sans persistance.
- **App.vue** : coquille racine, enveloppe `<router-view>` dans `<a-config-provider :locale="frFR">` (Ant Design Vue, locale française).
- **sidebar.vue** : menu de navigation en accordéons Bootstrap (`data-bs-toggle="collapse"`), section active déterminée par comparaison de préfixe d'URL (`isMenuActive`/`isParentActive`), pas de filtrage par rôle.
- **header.vue** : barre supérieure avec logo, champ de recherche non câblé, dropdown "Messages" vide, dropdown "Notifications" vide, dropdown profil avec nom **codé en dur** ("Gedeon LEKOUNDA") et avatar statique (`/img/faces/face29.png`) — bien que `user` et `isAuthenticated` soient importés depuis `authStore` via `storeToRefs`, **ils ne sont jamais utilisés dans le template** (import mort). Le lien "Deconnexion" appelle `handleLogout()` → `authStore.logoutUser()` puis redirige vers `/auth/login`.
- **footer.vue** : purement statique (copyright, liens `cfi-ciras.cg`).

#### 6. Interfaces du module (écrans)

##### Écran : Connexion (`/auth/login`)
Formulaire 2 colonnes (formulaire à gauche, bandeau visuel à droite), champs email/mot de passe, bouton "Connexion".

##### Écran : Inscription (`/auth/register`)
Formulaire statique non fonctionnel, mêmes gabarits visuels que Login.

##### Écran : 404 (route catch-all)
Page centrée avec code "404", image d'illustration externe (CDN flaticon), bouton de retour vers `/home`.

#### 7. Boutons et actions

| Bouton / action | Composant | Comportement réel |
|---|---|---|
| Connexion | Login.vue | `authStore.loginUser()` + redirection conditionnelle `/dashboard` |
| soummettre (lien) | Login.vue | Navigation statique vers `/auth/register` |
| Mot de passe oublié ? | Login.vue | `href="#"`, aucune action |
| SOUMETTRE | Register.vue | Lien statique `<a href="/home">`, aucun traitement |
| Toggle sidebar (hamburger) | header.vue → DefaultLayout.vue | Bascule `sidebarCollapsed` (desktop) ou `mobileSidebarOpen` (mobile) |
| Deconnexion | header.vue | `authStore.logoutUser()` puis `router.push('/auth/login')` |
| Retour à l'accueil | NotFound.vue | `router-link` vers `/home` |

#### 8. Formulaires

| Formulaire | Champs | Validation | Soumission |
|---|---|---|---|
| Login | email/username (text), password | Aucune validation front visible (pas de `required`, pas de règles) | `authStore.loginUser(credentials)` → `POST /auth/login` |
| Register | username, email, select "Services" (6 options), password, checkbox CGU | Aucune (pas de `v-model`, pas de script) | **Aucune** — lien statique, formulaire non exploitable |

#### 9. Tableaux et tables de navigation
Aucun tableau dans ce module (hors sidebar, qui est un menu de navigation, pas un tableau de données).

#### 10. Onglets
Aucun système d'onglets dans ce module.

#### 11. Workflow métier complet
**WF-AUTH-01 — Connexion utilisateur**
1. L'utilisateur saisit email + mot de passe sur `/auth/login`.
2. Clic "Connexion" → `authStore.loginUser(credentials)`.
3. `authApi.login()` exécute `POST /auth/login` via `authService` (basé sur `authApi` = `createApiClient('/auth')`).
4. Si `response.success && response.token` : le token est stocké dans `localStorage` (`token`), `user` est peuplé, `status = 'success'`.
5. Sinon, une erreur est levée, capturée, et `notifyError()` affiche un toast (`vue3-toastify`) avec le message extrait par `extractErrorMessage`.
6. Si `authStore.isAuthenticated` (getter `!!token`) est vrai, `router.push('/dashboard')`.
7. **Aucun garde de routage (`router.beforeEach`) n'existe dans le projet** (confirmé par `grep -rn "beforeEach" src/` → aucun résultat). Le `meta: { requiresAuth: true }` posé sur le nœud racine `/` (`src/routes/index.js` et son doublon mort `main.js`) **n'est vérifié par aucun code** : c'est une déclaration d'intention non appliquée. N'importe quelle route protégée reste accessible par URL directe sans authentification côté front ; seule la protection côté API (interception axios ajoutant le Bearer token, potentiel 401 backend) peut limiter l'accès aux données.

**WF-AUTH-02 — Déconnexion**
1. Clic "Deconnexion" dans le dropdown profil du header.
2. `authStore.logoutUser()` → `POST /auth/logout` (best-effort, erreur juste loguée en `console.warn`).
3. Purge locale : `token = null`, `user = null`, `localStorage.removeItem('token')`.
4. Redirection vers `/auth/login`.

#### 12. Cas d'utilisation
- **UC-AUTH-01** : Se connecter avec des identifiants valides → accès dashboard.
- **UC-AUTH-02** : Se connecter avec des identifiants invalides → toast d'erreur, pas de redirection.
- **UC-AUTH-03** : Se déconnecter → purge session, retour à l'écran de connexion.
- **UC-AUTH-04** : Accéder à une route protégée sans être authentifié → **aucune interception constatée**, la page se charge (les appels API échoueront probablement en 401 côté backend si celui-ci vérifie le token, mais rien ne le garantit côté front).

#### 13. Données manipulées
`user` (objet, structure non typée explicitement mais avec un champ `role` attendu — voir §15), `token` (JWT string, persistté en `localStorage`), `status` (`idle|loading|success|error`), `error` (message).

#### 14. API et intégration backend

| Fonction | Fichier | Verbe/URL | Client utilisé |
|---|---|---|---|
| `login(credentials)` | `src/api/auth/authApi.js` | `POST /auth/login` (via `authApi` = baseURL `VITE_API_URL/api/auth`) | `serviceApi.js` (`buildService`) |
| `logout()` | idem | `POST /auth/logout` | idem |
| `getCurrentUser()` | idem | `GET /auth/user` | idem |
| `signup(data)` | idem | `POST /auth/signup` | idem — **non appelé** par Register.vue (mort, aucun composant ne l'invoque) |
| `getUsers()` | `src/api/userApi.js` | `GET /users` via une instance axios **distincte** (`baseURL = VITE_API_URL + '/api/v1'`, préfixe différent de `apiClients.js` qui utilise `/api`) | axios direct (pas `serviceApi`) — **incohérence d'architecture API à corriger dans la reconstruction** |

Infrastructure technique commune :
- `src/api/config/axiosClient.js` : factory `createApiClient(prefix, useJson=true)` — instance axios avec `baseURL = VITE_API_URL/api{prefix}`, intercepteur de requête injectant `Authorization: Bearer <token>` depuis `localStorage`, et retrait des headers JSON si `FormData`.
- `src/api/config/apiClients.js` : instancie les clients `authApi`, `academiqueApi`, `gestionApi`, `pedagogieApi`, `financeApi`, `evaluationApi`, plus deux variantes "form" (`gestionFormApi`, `academiqueFormApi`, `useJson=false`).
- `src/api/config/serviceApi.js` : `buildService(client)` — enveloppe générique `get/post/put/patch/delete` qui délègue au `client` axios, renvoie `response.data`, et propage l'erreur (`throw`) sans traitement local (le traitement se fait en amont, dans les stores, via `useNotifier`/`extractErrorMessage`).
- Gestion d'erreurs à deux niveaux redondants observée : `errorStore.js` (`addError`, avec son propre toast `vue3-toastify` inline) et `messageStore.js`/`useNotifier.js`/`useErrorHandler.js` (mécanisme plus riche à 4 types success/info/warning/error). Les deux stores affichent des toasts indépendamment — `errorStore` ne semble utilisé qu'en cas d'exception au niveau d'`axiosClient` non interceptée explicitement (peu d'usages constatés dans les stores métier, qui préfèrent `useNotifier`). **Duplication de mécanisme à rationaliser** dans la reconstruction.

#### 15. Règles métier détectées
- **RM-AUTH-01** — Le login exige `response.success === true` ET la présence de `response.token` pour être considéré réussi ; sinon une erreur est levée même si le HTTP status est 200.
- **RM-AUTH-02** — Le token est toujours lu depuis `localStorage` à l'initialisation du store (`token: localStorage.getItem('token') || null`), pas de rafraîchissement automatique (refresh token) constaté.
- **RM-AUTH-03** — `fetchCurrentUser` implémente un cache de 5 minutes (`lastFetch`, `300000` ms) sauf si `force=true`.
- **RM-AUTH-04** — Sur une réponse 401 lors de `fetchCurrentUser`, le store déconnecte l'utilisateur et tente `router.push('/login')` **mais la route réelle est `/auth/login`, pas `/login`** — bug de redirection (route inexistante, tombera sur le 404 catch-all).
- **RM-AUTH-05 (rôles)** — Le store expose des getters de rôle : `userRole`, `isAdmin`, `isScolarite`, `isPedagogie`, `isCCycle`, `isFinances`, `isDirecteur`, `isEnseignant`, `isGestionnaire` (comparaison à `user?.role`). **Recherche exhaustive (`grep -rn "isAdmin|isScolarite|isPedagogie|isCCycle|isFinances|isDirecteur|isEnseignant|isGestionnaire|userRole" src/`) : aucun composant, route ou garde de navigation ne consomme ces getters.** Le système de rôles/permissions est donc **déclaré mais totalement inactif** — aucune UI n'est conditionnée par le rôle, aucune route n'est restreinte par rôle. Une recherche plus large de `can(` dans `src` ne retourne aucun résultat : il n'existe aucun système de type "policy"/"ability".
- **RM-AUTH-06** — Aucun `router.beforeEach` n'existe dans le projet (confirmé par grep global) : le `meta.requiresAuth` est un artefact non exploité.

---

### Module : Dashboard

#### 1. Objectif métier
Offrir une vue de synthèse ("Tableau de bord") multi-domaines (finances, scolarité, pédagogie, cycles, rapports) à l'ouverture de l'application.

#### 2. Acteurs concernés
Tout utilisateur connecté (aucune restriction par rôle constatée).

#### 3. Menus et sous-menus associés
Lien "Tableau de Bord" tout en haut du menu principal (`sidebar.vue`, `to="/home"`), icône `mdi-home`. Pas de sous-menu.

#### 4. Pages et routes associées

| Route | Nom | Composant | Remarque |
|---|---|---|---|
| `/dashboard` | Dashboard | `src/views/dashboard/Dashboard.vue` | Route "officielle" mais **non liée par le sidebar** |
| `/home` | Home | `src/views/dashboard/Dashboard.vue` | Route réellement utilisée par le menu et par les redirections (login, header logo, footer 404) |
| `` (racine) | Root | `src/views/dashboard/Dashboard.vue` | Alias supplémentaire du même composant |

Trois routes distinctes pointent vers le même composant (déclarées dans `src/routes/others.routes.js`) : `/dashboard`, `/home`, `` — duplication de routage à rationaliser (une seule route canonique avec redirection serait préférable).

#### 5. Description fonctionnelle complète
`Dashboard.vue` affiche : `Header.vue` (bandeau de bienvenue + bouton "Générer un rapport" ouvrant `ModalGeneration.vue`), puis `DashTab.vue` (5 onglets Bootstrap : Vue d'ensemble / Scolarités / Pédagogies / Cycles / Rapports, chacun rendant un composant dédié), puis `TabList.vue` (tableau "Journal des Flux de Caisse & Traites"). Un `SkeletonLoader` conditionnel (`loading`, jamais mis à `true`/`false` dans ce fichier — `loading` n'est même pas déclaré dans le `<script setup>` de `Dashboard.vue`, ce qui est un bug silencieux : la variable référencée dans le template n'existe pas dans le composant, Vue l'évaluera comme `undefined`/falsy en continu).

**Toutes les données affichées sont statiques/mockées** :
- `DashOverview.vue`, `DashScol.vue`, `DashPedgie.vue`, `DashCycles.vue` : cartes KPI avec chiffres codés en dur (ex. "37 050 000 FCFA", "482 Inscrits"), graphiques Chart.js alimentés par des tableaux `data: [...]` statiques (aucun appel API), tableaux d'alertes avec `ref([...])` en dur.
- `DashRapport.vue` : catalogue de rapports statique (`catalogueRapports`), bouton "Excel"/"PDF" déclenchant un simple `alert()` simulant la génération.
- `TabList.vue` (`RecentPurchases`) : reçoit une prop `purchases` (fournie par `Dashboard.vue` avec 2 entrées codées en dur), boutons "Imprimer le reçu" / "Historique d'audit" / "Exporter" déclenchant des `alert()`.
- `ModalGeneration.vue` : formulaire de génération de rapport (type, dates, options IA/anonymisation, format PDF/Excel), soumission simulée par `setTimeout` (1.5 s) puis `alert()` récapitulatif — **aucun appel réseau réel**.

#### 6. Interfaces du module (écrans)

##### Écran : Dashboard (`/home`, `/dashboard`, `/`)
En-tête de bienvenue + barre d'actions (téléchargement, historique, ajout, génération de rapport) → 5 onglets de contenu → tableau "Journal des Flux de Caisse" en pied de page.

#### 7. Boutons et actions

| Bouton | Composant | Action réelle |
|---|---|---|
| Générer un rapport | Header.vue | Ouvre la modale Bootstrap `#modalGenerationRapport` |
| Lancer l'extraction | ModalGeneration.vue | `setTimeout` 1.5s puis `alert()` récapitulatif (simulation) |
| Icônes téléchargement / horloge / plus | Header.vue | Aucun gestionnaire `@click`, purement décoratifs |
| Exporter cette session | TabList.vue | `alert()` simulé |
| Imprimer le reçu officiel | TabList.vue | `alert()` simulé |
| Historique d'audit | TabList.vue | `alert()` simulé |
| Ouvrir le Copilote IA complet | DashOverview.vue | Bouton sans `@click` (décoratif, aucune navigation vers `/assistant-ai`) |
| Relancer (alerte recouvrement) | DashScol.vue | `alert()` simulé |
| Excel / PDF (catalogue rapports) | DashRapport.vue | `alert()` simulé |

#### 8. Formulaires

| Formulaire | Champs | Soumission |
|---|---|---|
| Génération de rapport (modale) | Périmètre analytique (select), date début, date fin, case "Inclure diagnostics IA", case "Anonymiser", format radio PDF/Excel | Simulée (`setTimeout` + `alert`), aucun appel API |

#### 9. Tableaux et tables de navigation
- Tableau "Journal des Flux de Caisse & Traites" (`TabList.vue`) : colonnes Réf/Bénéficiaire, Type/Libellé, Statut, Mode, Montant Net, Date/Heure, Montant Brut, Actions ; pied de tableau avec total calculé côté client (`computed`).
- Tableau "Alertes Recouvrement Immédiates" (`DashScol.vue`) : Étudiant, Classe, Retard, Action.
- Tableau "Clôture des Vacations du Mois" (`DashPedgie.vue`) : Formateur, Cours/Module, Heures, État Prévu.
- Tableau "Registre des États Comptables et Pédagogiques" (`DashRapport.vue`) : nom du rapport, périodicité, date de calcul, actions.

#### 10. Onglets

| Onglet | id HTML | Composant rendu |
|---|---|---|
| Vue d'ensemble | `overview-tab` | `DashOverview.vue` |
| Scolarites | `devoirf-tab` | `DashScol.vue` |
| Pedagogies | `sales-tab` | `DashPedgie.vue` |
| Cycles | `purchases-tab` | `DashCycles.vue` |
| Rapports | `rapports-tab` | `DashRapport.vue` |

#### 11. Workflow métier complet
**WF-DASHBOARD-01 — Consultation du tableau de bord**
1. L'utilisateur arrive sur `/home` (redirection post-login) ou clique "Tableau de Bord" dans le sidebar.
2. `Dashboard.vue` se monte, affiche directement le contenu (le flag `loading` référencé dans le template n'est jamais défini dans le script → toujours affiché comme "non-loading" par défaut Vue).
3. L'utilisateur navigue entre les 5 onglets (bascule locale Bootstrap, pas de rechargement de données).
4. Optionnel : ouverture de la modale "Générer un rapport", saisie des critères, clic "Lancer l'extraction" → attente simulée puis confirmation par `alert()`.

#### 12. Cas d'utilisation
- **UC-DASHBOARD-01** : Consulter les indicateurs globaux (onglet Vue d'ensemble).
- **UC-DASHBOARD-02** : Explorer les indicateurs par domaine (Scolarité/Pédagogie/Cycles).
- **UC-DASHBOARD-03** : Générer un rapport d'audit (simulation uniquement — non persistant, aucun fichier réellement produit).

#### 13. Données manipulées
Uniquement des données statiques embarquées dans le code (KPI, séries de graphiques Chart.js, listes d'alertes, catalogue de rapports). Aucune structure de données persistante n'est définie/consommée depuis une API pour ce module.

#### 14. API et intégration backend

| Fonction | Endpoint | Statut |
|---|---|---|
| — | — | **Aucun appel API dans tout le module Dashboard** (`Dashboard.vue`, `Header.vue`, `DashTab.vue`, `TabList.vue`, `DashOverview.vue`, `DashScol.vue`, `DashPedgie.vue`, `DashCycles.vue`, `DashRapport.vue`, `ModalGeneration.vue` — aucun import de store ni d'API). 100% des données sont mockées en dur dans les composants. |

#### 15. Règles métier détectées
- **RM-DASHBOARD-01** — Trois routes (`/dashboard`, `/home`, ``) pointent vers le même composant sans redirection canonique : incohérence à corriger (choisir une route canonique, ex. `/dashboard`, et rediriger les autres).
- **RM-DASHBOARD-02** — La variable `loading` utilisée dans le template de `Dashboard.vue` (`v-if="loading"`) n'est déclarée nulle part dans le `<script setup>` — bug latent (toujours `undefined`, donc le `SkeletonLoader` ne s'affichera jamais).
- **RM-DASHBOARD-03** — Toutes les actions de génération/export sont des simulations (`alert()`, `setTimeout`) : aucune ne doit être considérée comme "Implémentée côté backend" dans la reconstruction ; il faut spécifier les vrais contrats API à créer.

---

### Module : Statistiques

#### 1. Objectif métier
Fournir une vue statistique consolidée : académique, financière, indicateurs, rapports.

#### 2. Acteurs concernés
Tout utilisateur connecté.

#### 3. Menus et sous-menus associés
Lien "Statistiques" dans le sidebar (`to="/statistiques"`, icône `mdi-chart-bar`), positionné après "Notifications", avant "Assistant AI". Pas de sous-menu.

#### 4. Pages et routes associées

| Route | Nom | Composant |
|---|---|---|
| `/statistiques` | Statistiques | `src/views/stats/Statistiques.vue` |

Route confirmée présente dans `src/routes/others.routes.js` et bien liée depuis le sidebar (cohérent, contrairement à d'autres modules de ce document).

#### 5. Description fonctionnelle complète
`Statistiques.vue` affiche `StatsHeader.vue` (bandeau titre "Statistiques et Rapports") puis `StatsTabs.vue` (4 onglets : Vue d'ensemble / Academiques / Finances / Indicateurs+Rapports). **Constat majeur** : `StatsOverview.vue`, `StatsFinances.vue`, `StatsAcademique.vue`, `StatsRapport.vue` et `StatsKPI.vue` sont **cinq fichiers strictement identiques** (même template exact : tableau à colonnes N°/Designation/Niveau/Examen/Valider/Actions, prop `rows` attendue). Aucun des composants parents (`StatsTabs.vue`) ne leur passe la prop `rows` — les tableaux sont donc **toujours vides** à l'exécution. `Statistiques.vue` déclare bien des refs `formateurs`, `examDevoirData`, `sessionOrdinaireData`, `sessionRappelData` avec un `onMounted` simulant un chargement de 3 secondes (`setTimeout`) qui peuple `formateurs` avec 2 lignes statiques, **mais ces variables ne sont jamais transmises aux composants enfants** — code mort.

Il existe également un bug de libellés dans `StatsTabs.vue` : l'onglet intitulé "Academiques" (`id="devoirf-tab"`, `href="#devoirf"`) affiche en réalité `<StatsFinances />`, tandis que l'onglet intitulé "Finances" (`id="sales-tab"`, `href="#sales"`) affiche `<StatsAcademique />` — les libellés et les contenus sont inversés. De plus, les onglets "Indicateurs" et "Rapports" partagent tous deux `id="purchases-tab"` et `href="#purchases"` (identifiants dupliqués), pointant tous deux vers le même panneau contenant `<StatsRapport />` — l'onglet "Indicateurs" est donc inaccessible en pratique (le second `id` prioritaire écrase le premier dans le DOM).

#### 6. Interfaces du module (écrans)

##### Écran : Statistiques (`/statistiques`)
Bandeau titre + 4 onglets Bootstrap, chacun affichant un tableau générique vide (structure identique, données jamais injectées).

#### 7. Boutons et actions
Aucun bouton d'action fonctionnel identifié dans ce module (pas de `@click` dans `StatsHeader.vue`, `StatsKPI.vue`, `StatsOverview.vue`, `StatsFinances.vue`, `StatsAcademique.vue`, `StatsRapport.vue`). Zone d'actions à droite du header (`d-flex justify-content-between`) présente mais vide.

#### 8. Formulaires
Aucun formulaire dans ce module.

#### 9. Tableaux et tables de navigation
5 composants-tableaux identiques (colonnes N°, Designation, Niveau, Examen, Valider, Actions), tous vides faute de prop `rows` fournie.

#### 10. Onglets

| Libellé affiché | id | Contenu réellement rendu | Anomalie |
|---|---|---|---|
| Vue d'ensemble | `overview-tab` | `StatsOverview.vue` | — |
| Academiques | `devoirf-tab` | `StatsFinances.vue` | **Libellé/contenu inversés** |
| Finances | `sales-tab` | `StatsAcademique.vue` | **Libellé/contenu inversés** |
| Indicateurs | `purchases-tab` (dupliqué) | `StatsRapport.vue` | **id dupliqué avec l'onglet suivant, rend l'onglet inaccessible** |
| Rapports | `purchases-tab` (dupliqué) | `StatsRapport.vue` | **id dupliqué** |

#### 11. Workflow métier complet
**WF-STATS-01 — Consultation des statistiques**
1. Utilisateur clique "Statistiques" dans le sidebar.
2. `Statistiques.vue` se monte, `loading=true` pendant 3s (skeleton loader affiché), puis bascule à `false`.
3. `StatsTabs.vue` s'affiche avec l'onglet "Vue d'ensemble" actif par défaut ; les 4 tableaux sont tous vides (aucune ligne).

#### 12. Cas d'utilisation
- **UC-STATS-01** : Consulter les statistiques (écran fonctionnellement vide en l'état actuel du code — squelette uniquement).

#### 13. Données manipulées
Structure de ligne attendue par les tableaux (non alimentée) : `{ designation, niveau, examen, status, statusClass }`. Aucune autre entité manipulée.

#### 14. API et intégration backend

| Fonction | Endpoint | Statut |
|---|---|---|
| — | — | **Aucun appel API** dans tout le module Statistiques. Le `setTimeout` de `Statistiques.vue` simule un chargement mais ne contacte aucun service. |

#### 15. Règles métier détectées
- **RM-STATS-01** — Les 5 composants de contenu (`StatsOverview`, `StatsFinances`, `StatsAcademique`, `StatsRapport`, `StatsKPI`) sont du code dupliqué/gabarit non finalisé : à remplacer dans la reconstruction par des composants réellement différenciés et connectés à des endpoints statistiques dédiés (académique, financier, KPI).
- **RM-STATS-02** — Les libellés d'onglets ne correspondent pas aux composants rendus : bug à corriger en priorité si l'écran devait être livré tel quel.
- **RM-STATS-03** — Duplication d'`id`/`href` Bootstrap entre les onglets "Indicateurs" et "Rapports" : un seul des deux est réellement activable.

---

### Module : Documentation

#### 1. Objectif métier
Gérer les demandes de documents académiques (attestations, relevés, etc.) émises par/pour les étudiants.

#### 2. Acteurs concernés
Agents de scolarité (implicite, d'après le libellé "Etudiants" du fil d'Ariane).

#### 3. Menus et sous-menus associés
**Aucun** — recherche exhaustive dans `src/components/partials/sidebar.vue` : le libellé "Documentation" ou une route `to="/documentation"` n'apparaît nulle part. **Route présente dans le routeur mais non visible dans le menu.**

#### 4. Pages et routes associées

| Route | Nom | Composant | Lien menu |
|---|---|---|---|
| `/documentation` | Documentation | `src/views/docf/Document.vue` | **Absent du sidebar** |

#### 5. Description fonctionnelle complète
En-tête "Documents académiques / Gestion des demandes de documents académiques", fil d'Ariane "Portail / Etudiants". Corps : carte "Liste des demandes" avec bouton "Exporter" (sans handler) et bouton "Nouvelle demandes" ouvrant une modale Bootstrap `#exampleModal` **dont le markup n'est pas défini dans ce fichier** (référence pendante — la modale n'existe pas, le bouton n'ouvrira rien). Tableau listant les demandes (colonnes Numéro, Client, Date, Date d'expiration, Total, Payé, Statut, Paiement, Créé par) avec une ref `factures` initialisée à `[]`, simulée par un `onMounted`/`setTimeout` de 1.5s qui la réaffecte... à `[]` également (le commentaire du code précise explicitement "Laisser vide pour tester l'affichage 'Aucune donnée'"). L'état vide est illustré par une icône SVG "Aucune donnée" (style Ant Design Empty).

#### 6. Interfaces du module (écrans)

##### Écran : Documents académiques (`/documentation`)
En-tête + carte listant les demandes de documents (toujours vide dans l'état actuel du code) + bouton "Nouvelle demandes" pointant vers une modale non implémentée.

#### 7. Boutons et actions

| Bouton | Action réelle |
|---|---|
| Exporter | Aucun handler (`@click` absent) |
| Nouvelle demandes | `data-bs-target="#exampleModal"` — modale **non définie** dans le fichier, bouton non fonctionnel en pratique |

#### 8. Formulaires
Aucun formulaire visible (la modale de création n'est pas implémentée).

#### 9. Tableaux et tables de navigation
Un tableau (Numéro, Client, Date, Date d'expiration, Total, Payé, Statut, Paiement, Créé par), systématiquement vide par construction du code actuel.

#### 10. Onglets
Aucun.

#### 11. Workflow métier complet
**WF-DOC-01 — Consultation des demandes de documents (état actuel)**
1. Navigation directe vers `/documentation` (URL manuelle, car absente du menu).
2. Affichage d'un tableau vide après un faux délai de chargement de 1.5s.
3. Aucune action de création/export fonctionnelle.

#### 12. Cas d'utilisation
- **UC-DOC-01** : Accéder à l'écran de documentation par URL directe (le module n'étant pas exposé dans la navigation, ce cas d'usage n'est pas praticable par un utilisateur standard sans connaître l'URL).

#### 13. Données manipulées
Entité "facture"/"demande de document" implicite : `{ id, numero, client, date, expiration, total, paye (bool), statut, paiement, creePar }` — structure déduite du template, jamais peuplée par une vraie source.

#### 14. API et intégration backend

| Fonction | Endpoint | Statut |
|---|---|---|
| — | — | **Aucun appel API.** `factures` reste un tableau vide codé en dur. |

#### 15. Règles métier détectées
- **RM-DOC-01** — Composant orphelin de navigation : route déclarée (`others.routes.js`) mais aucun point d'entrée dans le menu (`sidebar.vue`). À décider explicitement dans la reconstruction : soit l'exposer dans le menu, soit la retirer.
- **RM-DOC-02** — Bouton "Nouvelle demandes" référence une modale Bootstrap (`#exampleModal`) qui n'est déclarée dans aucun template du fichier — action non fonctionnelle en l'état.

---

### Module : Assistant IA

#### 1. Objectif métier
Fournir un "copilote" conversationnel pour interroger les données académiques/financières de la plateforme en langage naturel.

#### 2. Acteurs concernés
Tout utilisateur connecté (badge "Beta" affiché dans le menu).

#### 3. Menus et sous-menus associés
Lien "Assistant AI" dans le sidebar (`to="/assistant-ai"`, icône `mdi-robot`, texte en gras, badge `<span class="badge badge-info ... "> Beta </span>`).

#### 4. Pages et routes associées

| Route | Nom | Composant |
|---|---|---|
| `/assistant-ai` | AssistantAI | `src/views/prompt/AssistantAi.vue` |

Route confirmée et bien reliée au sidebar.

#### 5. Description fonctionnelle complète
Interface de chat en deux colonnes : panneau latéral gauche "Analyses Récentes" (historique statique de 2 entrées `history`, bouton "Nouvelle Analyse" qui vide `messages`), zone principale de conversation à droite avec un message d'accueil fixe du "Copilote IA" et 3 boutons de suggestions rapides (raccourcis pré-remplissant la zone de saisie et déclenchant l'envoi).

**Recherche explicite d'appel réseau vers un service IA** : le fichier `src/views/prompt/AssistantAi.vue` ne contient **aucun `fetch`, aucun `axios`, aucun import de store/API**. La fonction `sendMessage()` pousse le message utilisateur dans `messages`, active `isTyping`, puis après un `setTimeout` de 1500 ms, pousse une réponse **assistant strictement statique** (même texte Markdown à chaque envoi, quel que soit le contenu saisi) : *"D'après les données du module Trésorerie et Paiements : ... Décision recommandée : Relancer les 42 étudiants de Licence 1..."*. Le rendu Markdown est assuré par la librairie `marked` (`import { marked } from 'marked'`, `marked.setOptions({ breaks:true, gfm:true })`, fonction `renderMarkdown` = `marked.parse(text)`, injecté via `v-html`). **Il s'agit donc d'une simulation complète, sans connexion à un LLM ou service IA réel.**
Le bouton "Exporter l'audit" génère un fichier JSON téléchargeable côté client (Data URI) à partir de l'historique `messages` en mémoire — fonctionnalité réellement opérationnelle (100% front, sans backend).

#### 6. Interfaces du module (écrans)

##### Écran : Copilote Académique & Opérationnel (`/assistant-ai`)
Panneau "Analyses Récentes" (gauche) + fenêtre de chat (droite) avec zone de saisie `textarea`, envoi par Entrée ou bouton flèche, indicateur de frappe animé ("Analyse des bases de données en cours...").

#### 7. Boutons et actions

| Bouton | Comportement réel |
|---|---|
| Nouvelle Analyse | `clearChat()` — vide `messages` (local uniquement) |
| Bouton d'historique (chaque entrée) | `loadHistory(item)` — préremplit la saisie avec `query`/`title` puis appelle `sendMessage()` |
| Exporter l'audit | Génère et télécharge un `.json` de la conversation courante (Data URI, purement client) |
| Bénéfice net mensuel / Impayés L1 / Prévisions Honoraires | `askShortcut(text)` — préremplit la saisie puis `sendMessage()` |
| Bouton d'envoi (flèche) | `sendMessage()` |

#### 8. Formulaires

| Formulaire | Champs | Soumission |
|---|---|---|
| Zone de conversation | `textarea` (message libre) | `sendMessage()` — traitement 100% local, réponse simulée après délai fixe |

#### 9. Tableaux et tables de navigation
Aucun tableau. Liste d'historique de conversations (statique, 2 entrées).

#### 10. Onglets
Aucun système d'onglets.

#### 11. Workflow métier complet
**WF-IA-01 — Interroger le Copilote (simulation actuelle)**
1. L'utilisateur saisit une question ou clique un raccourci/historique.
2. Le message est ajouté à la liste `messages` avec `role: 'user'`.
3. `isTyping = true`, attente fixe de 1500 ms (aucune requête réseau).
4. Une réponse Markdown **fixe et générique** est ajoutée avec `role: 'assistant'` et un tag `stats.module = 'Finances & Scolarité'`.
5. Le contenu est rendu en HTML via `marked.parse()` et injecté par `v-html`.

#### 12. Cas d'utilisation
- **UC-IA-01** : Poser une question au copilote → recevoir systématiquement la même réponse simulée, indépendamment du contenu réel de la question.
- **UC-IA-02** : Exporter la conversation en JSON (fonctionnalité réellement opérationnelle, côté client).
- **UC-IA-03** : Réutiliser un élément de l'historique pour relancer une "analyse" (mêmes limites que UC-IA-01).

#### 13. Données manipulées
`messages` (liste `{role: 'user'|'assistant', content, stats?}`), `history` (liste statique `{id, title, query}`), aucune persistance (perdu au rechargement de page).

#### 14. API et intégration backend

| Fonction | Endpoint | Statut |
|---|---|---|
| — | — | **Aucun appel API/IA réel.** Tout est simulé en mémoire côté client avec `setTimeout`. Pas de dépendance à un endpoint IA (pas de `/api/ia`, `/chat`, `/completion`, etc. dans le code). |

#### 15. Règles métier détectées
- **RM-IA-01** — La réponse du copilote est **indépendante du contenu de la question posée** (toujours le même texte) : à remplacer par un véritable appel à un service IA/LLM dans la reconstruction, avec contrat d'API à spécifier (endpoint, payload, streaming ou non).
- **RM-IA-02** — Rendu Markdown via `marked` avec injection `v-html` : à sécuriser (sanitization) si le contenu venait réellement d'un LLM externe, pour éviter tout risque d'injection HTML/XSS dans la reconstruction.

---

### Module : Administration

#### 1. Objectif métier
Gérer la liste des formateurs/enseignants au niveau "Administration SSE" (services support).

#### 2. Acteurs concernés
Agents de gestion des services (RH/pédagogie administrative, déduit du libellé "Formateur" du fil d'Ariane).

#### 3. Menus et sous-menus associés
Lien "Services" dans le sidebar (`to="/administration"`, icône `mdi-briefcase`) — **le libellé de menu est "Services", pas "Administration"**, ce qui peut prêter à confusion avec le nom réel de la route/vue.

#### 4. Pages et routes associées

| Route | Nom | Composant |
|---|---|---|
| `/administration` | Administration | `src/views/admin/Administration.vue` |

#### 5. Description fonctionnelle complète
`Administration.vue` affiche un en-tête "Administration SSE / Gestion des formateurs et enseignant" (fil d'Ariane "Formateur / Analytics"), une carte vide (`<div class="card-body"></div>`, sans contenu), puis une carte "Liste des Formateurs" contenant le composant `ATable.vue`.

`ATable.vue` utilise le composant `a-table` d'Ant Design Vue avec pagination pilotée par `vue-request` (`usePagination`). La fonction `queryData(params)` exécute `axios.get('', { params })` — **URL vide** (chaîne vide), ce qui constitue un appel réseau cassé/placeholder pointant vers l'origine du site elle-même plutôt qu'un endpoint métier réel. Les colonnes affichées (Name, Gender, Email) et les filtres (Male/Female) suggèrent une **donnée d'exemple générique issue d'un tutoriel Ant Design Vue** (structure `login.uuid` comme clé de ligne, typique de l'API publique "randomuser.me" utilisée dans la documentation officielle du composant), sans rapport avec le domaine "formateurs".

Un second composant, `DataTable.vue`, existe dans le même dossier (`src/views/admin/DataTable.vue`) mais **n'est importé par aucun fichier du projet** (`grep -rn "DataTable" src` ne retourne aucune référence en dehors de sa propre déclaration) : composant orphelin au sein même du module Administration. Il encapsule `@bhplugin/vue3-datatable` avec des colonnes et lignes d'exemple (`Leanne Graham`, données au format JSONPlaceholder), également non connecté à une API réelle.

#### 6. Interfaces du module (écrans)

##### Écran : Administration SSE (`/administration`)
En-tête + carte vide + carte "Liste des Formateurs" contenant un tableau paginé Ant Design Vue (données d'exemple génériques, non liées au domaine).

#### 7. Boutons et actions
Aucun bouton d'action explicite dans `Administration.vue`. `ATable.vue` propose tri/filtre/pagination natifs d'Ant Design Vue (`@change="handleTableChange"`), fonctionnels uniquement sur les données d'exemple retournées par l'appel `axios.get('')` (qui échouera en pratique faute d'URL valide).

#### 8. Formulaires
Aucun formulaire.

#### 9. Tableaux et tables de navigation
- `ATable.vue` : colonnes Name (triable), Gender (filtrable Male/Female), Email — pagination totale fixée à `200` (valeur codée en dur, sans rapport avec une vraie volumétrie).
- `DataTable.vue` (orphelin) : colonnes ID, Name, Username, Email, Phone, Date, Active, Age, Address (avec rendu personnalisé), Company — export CSV activé (`export-options`), recherche/tri/filtre activés, mais **jamais monté dans l'application**.

#### 10. Onglets
Aucun.

#### 11. Workflow métier complet
**WF-ADMIN-01 — Consultation de la liste des formateurs (état actuel)**
1. Navigation vers `/administration` via le lien "Services" du sidebar.
2. `ATable.vue` se monte, `usePagination` déclenche `queryData()` → `axios.get('', {params})`.
3. En l'absence de configuration `baseURL` sur cette instance axios (import direct `axios`, pas via `axiosClient.js`/`apiClients.js`), la requête part vers l'URL courante du front — comportement non fonctionnel pour une vraie liste de formateurs.

#### 12. Cas d'utilisation
- **UC-ADMIN-01** : Consulter la liste des formateurs — non opérationnel en l'état (données d'exemple génériques, appel réseau cassé).

#### 13. Données manipulées
Structure attendue pour un formateur n'est pas définie dans ce module (les colonnes réelles de `ATable.vue` sont `name{first,last}`, `gender`, `email` — un schéma générique "utilisateur", pas un schéma "formateur" métier).

#### 14. API et intégration backend

| Fonction | Endpoint | Statut |
|---|---|---|
| `queryData` (ATable.vue) | `axios.get('', { params })` | **Cassé/placeholder** — n'utilise pas l'infrastructure `axiosClient`/`serviceApi` du projet, URL vide |

Existe par ailleurs une API pédagogie légitime pour les formateurs/enseignants (`src/api/pedagogies/pedagogieApi.js`, `src/stores/pedagogieStore/enseignantStore.js`) qui **n'est pas utilisée par ce module Administration** — la vraie source de données "enseignants" employée ailleurs dans l'application (module Pédagogie/Formateurs) n'est pas branchée ici, signe d'un module non finalisé ou redondant avec `src/views/pedagogies/formateurs/`.

#### 15. Règles métier détectées
- **RM-ADMIN-01** — Le composant `DataTable.vue` est un orphelin total (non importé) : à supprimer ou à intégrer consciemment dans la reconstruction, pas à dupliquer tel quel.
- **RM-ADMIN-02** — `ATable.vue` utilise un appel `axios.get('')` non fonctionnel et des données d'exemple génériques sans rapport avec le domaine "formateurs" : à reconstruire avec un vrai contrat API (probablement `pedagogieApi`/`enseignantStore` existants ailleurs dans le projet).
- **RM-ADMIN-03** — Le libellé de menu ("Services") diffère du nom de la route/vue ("Administration") : à harmoniser dans la reconstruction.

---

### Module : Notifications

#### 1. Objectif métier
(Intention déduite du seul lien de menu) Centraliser les notifications système/métier pour l'utilisateur.

#### 2. Acteurs concernés
Tout utilisateur connecté (intention).

#### 3. Menus et sous-menus associés
Lien "Notifications" présent dans le sidebar (`to="/notification"`, singulier, icône `mdi-bell`).

#### 4. Pages et routes associées

| Route | Nom | Composant | Statut |
|---|---|---|---|
| `/notification` (lien sidebar) | — | — | **Route absente** : recherche exhaustive de `/notification` dans `src/routes/*.js` (auth, structure, etudiants, examens, concours, finances, pedagogie, others) → **aucune occurrence**. |

Le composant `src/views/notifications/notification.vue` existe dans l'arborescence mais **n'est référencé par aucune route** (`grep -rn "notifications/notification" src/routes` → vide) — composant totalement orphelin.

#### 5. Description fonctionnelle complète
Le fichier `src/views/notifications/notification.vue` est **littéralement vide de contenu** :
```
<template></template>
```
Aucun `<script>`, aucun style, aucune logique. Cliquer sur le lien de menu "Notifications" dans l'application déployée provoquerait une navigation vers `/notification`, route qui ne matche aucune définition explicite et tombera donc sur la route catch-all `/:pathMatch(.*)*` → `NotFound.vue` (404).

#### 6. Interfaces du module (écrans)
Aucun écran fonctionnel — le composant ne rend rien.

#### 7. Boutons et actions
Aucun (fichier vide). Le header (`header.vue`) possède par ailleurs un dropdown cloche "Notifications" (`#notificationDropdown`) totalement statique, sans lien avec ce module, contenant uniquement un en-tête "Notifications" sans liste.

#### 8. Formulaires
Aucun.

#### 9. Tableaux et tables de navigation
Aucun.

#### 10. Onglets
Aucun.

#### 11. Workflow métier complet
**WF-NOTIF-01 — État actuel (non fonctionnel)**
1. Clic sur "Notifications" dans le sidebar → tentative de navigation vers `/notification`.
2. Aucune route ne correspond exactement → le routeur Vue Router matche le catch-all `/:pathMatch(.*)*` → affichage de la page 404 (`NotFound.vue`).

#### 12. Cas d'utilisation
- **UC-NOTIF-01** : Consulter les notifications — **non réalisable**, aboutit systématiquement à une page 404.

#### 13. Données manipulées
Aucune (composant vide, aucun modèle de données défini).

#### 14. API et intégration backend

| Fonction | Endpoint | Statut |
|---|---|---|
| — | — | Aucun appel API. Aucune brique de notification (store, API, websocket) n'existe ailleurs dans le projet pour ce domaine. |

#### 15. Règles métier détectées
- **RM-NOTIF-01** — Lien de menu pointant vers une route inexistante (`/notification`) : à corriger en priorité (soit créer la route + son enregistrement dans `others.routes.js`, soit retirer l'entrée du sidebar).
- **RM-NOTIF-02** — Le composant cible (`notification.vue`) est vide : à concevoir intégralement dans la reconstruction (liste de notifications, marquage lu/non lu, filtre par type, etc. — aucune spécification récupérable du code actuel).

---

### Module : Support

#### 1. Objectif métier
(Déduit du contenu du composant, bien qu'aucun point d'accès n'existe) Gestion des fichiers de support de cours pour les étudiants (upload/téléchargement/suppression de documents pédagogiques).

#### 2. Acteurs concernés
Formateurs/gestionnaires pédagogiques (intention, d'après "Gestion des fichiers des supports de cours etudiant").

#### 3. Menus et sous-menus associés
**Aucun** — recherche explicite : `grep -rn "Support" src/routes src/components` → aucune occurrence de lien de menu ou de route vers Support.vue. Ni `sidebar.vue`, ni aucun fichier de route ne mentionne "support" ou `/support`.

#### 4. Pages et routes associées

| Route | Composant | Statut |
|---|---|---|
| — | `src/views/support/Support.vue` | **Aucune route déclarée nulle part dans `src/routes/*.js`. Composant totalement orphelin — ni route, ni lien de menu.** |

#### 5. Description fonctionnelle complète
`Support.vue` affiche un en-tête "Gestions & support cours / Gestion des fichiers des supports de cours etudiant etc." (fil d'Ariane "Portail / Support"), un `SkeletonLoader` conditionnel, un composant `FileUploader` (zone de dépôt de fichier), et un composant `FileTable` listant 6 fichiers d'exemple codés en dur (`5_dark_support.jpg`, `Chart2_recovered.psd`, etc., avec dates/tailles/types statiques).

**Défaut bloquant supplémentaire** : le script importe :
```js
import FileTable from '@/components/files/FileTable.vue';
import FileUploader from '@/components/files/FileUploader.vue';
```
Or **le dossier `src/components/files/` n'existe pas dans le dépôt** (vérifié par recherche exhaustive `find . -iname "FileTable*"` et `find . -iname "FileUploader*"` sur tout le projet, hors `node_modules` : aucun résultat). **Ces imports sont cassés** : si ce composant était un jour monté (route ajoutée), l'application échouerait à la compilation/au build (module introuvable). Ce module est donc non seulement orphelin de routage, mais également non compilable en l'état s'il était intégré tel quel.

#### 6. Interfaces du module (écrans)

##### Écran : Support (aucune route — accessible uniquement en import direct/test)
En-tête + zone d'upload (`FileUploader`, composant manquant) + tableau de fichiers (`FileTable`, composant manquant), avec handlers `handleUpload` (ajoute à `files`), `handleDownload` (`alert()` simulé), `handleDelete` (filtre `files` localement).

#### 7. Boutons et actions

| Action | Handler | Comportement |
|---|---|---|
| Upload (émis par FileUploader, composant absent) | `handleUpload(file)` | `this.files.push(file)` — état local uniquement |
| Download (émis par FileTable, composant absent) | `handleDownload(file)` | `alert('Downloading ' + file.name)` |
| Delete (émis par FileTable, composant absent) | `handleDelete(fileId)` | Filtrage local du tableau `files`, aucune suppression serveur |

#### 8. Formulaires
Formulaire d'upload délégué au composant manquant `FileUploader.vue` — structure/champs impossibles à documenter (fichier inexistant).

#### 9. Tableaux et tables de navigation
Table de fichiers déléguée au composant manquant `FileTable.vue`, alimentée par une liste statique de 6 entrées `{id, name, date, time, size, type}`.

#### 10. Onglets
Aucun.

#### 11. Workflow métier complet
**WF-SUPPORT-01 — État actuel (inaccessible)**
Le module n'étant relié à aucune route, aucun parcours utilisateur réel n'existe. Si une route était ajoutée sans créer les composants manquants, le build de l'application échouerait.

#### 12. Cas d'utilisation
- **UC-SUPPORT-01** : Déposer un support de cours — **non réalisable** en l'état (composants manquants + absence de route).
- **UC-SUPPORT-02** : Télécharger/supprimer un support de cours — idem, non réalisable.

#### 13. Données manipulées
Entité "fichier" déduite du template : `{ id, name, date, time, size, type }`. Purement en mémoire, aucune persistance.

#### 14. API et intégration backend

| Fonction | Endpoint | Statut |
|---|---|---|
| — | — | **Aucun appel API.** Existe par ailleurs dans le projet un service générique `src/api/uploads/importService.js` (pour d'autres modules du domaine académique) qui n'est pas utilisé ici. |

#### 15. Règles métier détectées
- **RM-SUPPORT-01** — Composant orphelin critique : aucune route, aucun lien de menu, **et imports cassés** (`@/components/files/FileTable.vue`, `@/components/files/FileUploader.vue` inexistants). À reconstruire intégralement (routage + composants manquants + connexion API réelle, potentiellement via `importService.js`).

---

### Module : Settings / Paramètres

#### 1. Objectif métier
(Déduit du contenu) Gérer les paramètres du compte utilisateur : email, vérification téléphone/identité, thème d'interface, notifications.

#### 2. Acteurs concernés
Tout utilisateur connecté (intention).

#### 3. Menus et sous-menus associés
Lien "Paramètres" présent dans le sidebar (`to="/settings"`, icône `mdi-settings`), dernier élément du menu principal.

#### 4. Pages et routes associées

| Route | Composant | Statut |
|---|---|---|
| `/settings` (lien sidebar) | — | **Route absente** : aucune occurrence de `/settings` dans `src/routes/*.js` (recherche exhaustive confirmée). |

Le composant `src/views/settings/Settings.vue` existe mais n'est référencé par aucune route — **composant orphelin**.

#### 5. Description fonctionnelle complète
`Settings.vue` affiche un titre "Paramètres" et deux onglets Bootstrap ("Compte" actif par défaut, "Notification" — panneau non implémenté, seul l'onglet "Compte"/`#compte`... **incohérence supplémentaire** : le premier onglet a `href="#compte"` mais son panneau de contenu a `id="overview"` (pas `id="compte"`) — cible Bootstrap invalide, l'activation par ancre ne fonctionnerait pas correctement si l'on cliquait réellement l'onglet "Notification" en premier). Le panneau "Compte" affiche : email en dur (`gedeon.lekounda@gmail.com`), bouton "Change email" (sans handler), section "Phone verification" et "Identity verification" avec des textes **copiés tels quels du site Kaggle** ("allows you to do more on Kaggle", "using Persona, a trusted 3rd-party service", "join competitions that require identity verification") — contenu de type gabarit/tutoriel non adapté au domaine CFI-CIRAS, boutons "Phone verify" et "Verify my account" sans handler. Section "Theme" avec un `<select>` Light/Dark (`v-model="selectedTheme"`, jamais appliqué au DOM — pas de classe CSS conditionnée dessus).

#### 6. Interfaces du module (écrans)

##### Écran : Paramètres (aucune route active)
Titre + 2 onglets (Compte actif, Notification vide) + panneau "Compte" avec email statique, boutons de vérification non câblés, sélecteur de thème non appliqué.

#### 7. Boutons et actions

| Bouton | Comportement réel |
|---|---|
| Change email | Aucun handler |
| Phone verify | Aucun handler |
| Verify my account | Aucun handler |
| Sélecteur de thème | `v-model="selectedTheme"`, aucun effet visuel appliqué |

#### 8. Formulaires
Aucun formulaire soumissible (simples boutons décoratifs, sélecteur non branché).

#### 9. Tableaux et tables de navigation
Aucun tableau.

#### 10. Onglets

| Libellé | href | Panneau réellement affiché |
|---|---|---|
| Compte | `#compte` | `id="overview"` (incohérence d'ancre) |
| Notification | `#notification` | **Aucun panneau de contenu défini** pour cet onglet |

#### 11. Workflow métier complet
**WF-SETTINGS-01 — État actuel (inaccessible)**
Aucune route ne pointant vers `Settings.vue`, ce module n'est atteignable par aucun parcours utilisateur standard dans l'application actuelle.

#### 12. Cas d'utilisation
- **UC-SETTINGS-01** : Modifier son email de compte — non réalisable (bouton sans handler, et route inexistante de toute façon).
- **UC-SETTINGS-02** : Changer le thème de l'interface — non réalisable (sélecteur non branché à un mécanisme de thème réel).

#### 13. Données manipulées
`email` (string statique), `selectedTheme` ('light'|'dark', état local non persisté), `loading` (bool, simulateur `setTimeout` 2s).

#### 14. API et intégration backend

| Fonction | Endpoint | Statut |
|---|---|---|
| — | — | **Aucun appel API.** Toutes les données affichées sont statiques ou d'exemple (gabarit Kaggle). |

#### 15. Règles métier détectées
- **RM-SETTINGS-01** — Composant orphelin : route `/settings` à créer explicitement dans la reconstruction (`others.routes.js` ou équivalent) si le module doit être conservé.
- **RM-SETTINGS-02** — Contenu du panneau "Compte" directement copié d'un gabarit tiers (Kaggle) : à réécrire entièrement pour le domaine CFI-CIRAS (pas de "compétitions", pas de "Persona").
- **RM-SETTINGS-03** — Incohérence d'ancrage Bootstrap (`href="#compte"` vs `id="overview"`) et onglet "Notification" sans panneau associé : bugs à corriger si le composant devait être repris tel quel (recommandation : ne pas le reprendre tel quel, le reconstruire).

---

### Module : Emploi du temps (Schedule)

#### 1. Objectif métier
(Déduit du contenu) Afficher/gérer le planning journalier et hebdomadaire des cours par année académique, filière, classe et semestre. Différent du module "Créneaux/Horaires" de Pédagogie (`src/views/pedagogies/crenaux/`), qui est lui bien routé (`/crenaux-horaires`).

#### 2. Acteurs concernés
Agents pédagogiques / scolarité (intention).

#### 3. Menus et sous-menus associés
Lien "Emploi du temps" présent dans le sidebar, en position autonome entre "Inscriptions" et "Finances" (`to="/schedule"`, icône `mdi-calendar-clock`).

#### 4. Pages et routes associées

| Route | Composant | Statut |
|---|---|---|
| `/schedule` (lien sidebar) | — | **Route absente** : aucune occurrence de `/schedule` dans `src/routes/*.js` (recherche exhaustive confirmée). |

Quatre composants existent dans `src/views/schedule/` mais **aucun n'est importé nulle part dans le projet** (`grep -rn "ScheduleView|schedule/Schedule.vue|views/schedule" src` → aucun résultat, y compris dans les fichiers de routes) : module 100% orphelin, ni routé ni référencé par un autre composant.

#### 5. Description fonctionnelle complète
- **`Schedule.vue`** : en-tête "Emploi du temps / Unite d'enseignements, Matiere et cours", barre d'actions (bouton "Exporter" sans handler, bouton "+ Ajouter" ciblant une modale `#exampleModal` non définie dans le fichier, menu déroulant "Importer fichier" sans handler). Corps : `SkeletonLoader` conditionnel (`loading`, initialisé à `false` — jamais affiché en pratique), filtres statiques (Année académique, Filière, Classe, Semestre — `<select>` avec options codées en dur, aucun `v-model`, donc non fonctionnels), puis `ScheduleTab.vue` (onglets par jour) + `ScheduleContent.vue` (contenu par jour).
- **`ScheduleView.vue`** : **quasi-duplicata de `Schedule.vue`** (même structure, mêmes composants importés `ScheduleTab.vue`/`ScheduleContent.vue`, même logique `activeTab`/`changeTab`), à la différence près qu'il n'affiche pas les filtres (section filtres vide) et a un texte de sous-titre légèrement différent ("Emploi du temps génerale"). **Duplication de code à ne pas reproduire** dans la reconstruction — un seul composant "vue planning" est nécessaire.
- **`ScheduleTab.vue`** : liste de 6 jours (Lundi à Samedi) sous forme de pills de navigation (`nav-pills`), émet `changeTab` au clic.
- **`ScheduleContent.vue`** : pour chaque jour, un tableau (colonnes Horaire, Classe, Type, Matière, Formateur, Semestre, Salle) systématiquement vide, avec message "Aucune donnée pour {jour}" et icône `/img/empty-box.svg`.

#### 6. Interfaces du module (écrans)

##### Écran : Emploi du temps (aucune route active)
En-tête + barre d'actions (Exporter/Ajouter/Importer, non fonctionnels) + filtres statiques + onglets par jour de la semaine + tableau de séances (toujours vide).

#### 7. Boutons et actions

| Bouton | Comportement réel |
|---|---|
| Exporter | Aucun handler |
| + Ajouter | Cible modale `#exampleModal` non définie dans le fichier |
| Importer fichier (item dropdown) | `href="#drag-drop-area"`, aucun handler JS |
| Onglets jour (Lundi…Samedi) | `changeTab(day.id)` — bascule locale de l'onglet actif, sans rechargement de données (car aucune donnée n'existe) |

#### 8. Formulaires
Filtres non fonctionnels (Année académique, Filière, Classe, Semestre) — simples `<select>` sans `v-model` ni logique de filtrage.

#### 9. Tableaux et tables de navigation
Un tableau par jour (Horaire, Classe, Type, Matière, Formateur, Semestre, Salle, colonne Actions vide) — toujours vide (`ScheduleContent.vue` ne contient aucune donnée, seulement l'état "Aucune donnée pour {jour}").

#### 10. Onglets

| Onglet | id |
|---|---|
| Lundi | `lundi` (par défaut) |
| Mardi | `mardi` |
| Mercredi | `mercredi` |
| Jeudi | `jeudi` |
| Vendredi | `vendredi` |
| Samedi | `samedi` |

#### 11. Workflow métier complet
**WF-SCHEDULE-01 — État actuel (inaccessible)**
Aucune route ne pointe vers `Schedule.vue` ou `ScheduleView.vue` : le clic sur "Emploi du temps" dans le sidebar navigue vers `/schedule`, route inexistante, aboutissant à la page 404 (`NotFound.vue`) via le catch-all.

#### 12. Cas d'utilisation
- **UC-SCHEDULE-01** : Consulter le planning hebdomadaire par filière/classe/semestre — **non réalisable** (route absente, et même routée, aucune donnée n'est chargée).

#### 13. Données manipulées
Entité "séance" implicite (déduite des colonnes du tableau) : `{ horaire, classe, type, matiere, formateur, semestre, salle }` — jamais peuplée.

#### 14. API et intégration backend

| Fonction | Endpoint | Statut |
|---|---|---|
| — | — | **Aucun appel API** dans tout le module (`Schedule.vue`, `ScheduleView.vue`, `ScheduleTab.vue`, `ScheduleContent.vue`). |

#### 15. Règles métier détectées
- **RM-SCHEDULE-01** — Lien de menu pointant vers une route inexistante (`/schedule`) : à corriger (créer la route ou retirer l'entrée de menu).
- **RM-SCHEDULE-02** — `Schedule.vue` et `ScheduleView.vue` sont deux composants quasi identiques non consolidés : dans la reconstruction, un seul composant de planning doit être conçu (fusion des deux, en gardant les filtres présents dans `Schedule.vue`).
- **RM-SCHEDULE-03** — Aucune donnée de séance n'est modélisée/chargée : le contrat de données (source des séances : Pédagogie/Créneaux existant `src/views/pedagogies/crenaux/`, ou nouvelle entité dédiée) doit être défini explicitement, la relation avec le module Pédagogie/Créneaux (qui, lui, est routé sur `/crenaux-horaires`) doit être clarifiée pour éviter une redondance fonctionnelle.

---

### Points à confirmer

1. **Système de rôles/permissions** — Les getters `isAdmin/isScolarite/isPedagogie/isCCycle/isFinances/isDirecteur/isEnseignant/isGestionnaire` existent dans `authStore.js` mais ne sont utilisés par **aucun** composant, garde de route ou logique conditionnelle ailleurs dans `src/` (vérifié par grep global). À confirmer avec le métier : le contrôle d'accès par rôle doit-il réellement piloter l'UI (masquage de menu, désactivation de boutons) dans la version reconstruite, et selon quelle matrice rôle → fonctionnalités ?
2. **Absence totale de garde de navigation (`router.beforeEach`)** — Le `meta.requiresAuth` déclaré sur le nœud racine des routes protégées n'est vérifié par aucun code. À confirmer : la protection réelle repose-t-elle uniquement sur le backend (401 sur API), ou un garde front doit-il être ajouté dans la reconstruction ?
3. **Fichier mort `src/routes/main.js`** — Doublon exact de `src/routes/index.js`, non importé. À confirmer : suppression pure dans la reconstruction (recommandé), sauf si un usage futur était prévu.
4. **Composants orphelins de routage confirmés** (existent en code, aucune route ne les monte) :
   - `src/views/support/Support.vue` (aucune route, aucun lien menu, **imports cassés** vers `@/components/files/FileTable.vue` et `FileUploader.vue` inexistants)
   - `src/views/settings/Settings.vue` (aucune route ; lien menu `/settings` présent mais route absente)
   - `src/views/notifications/notification.vue` (aucune route ; lien menu `/notification` présent mais route absente ; **fichier vide**, `<template></template>` uniquement)
   - `src/views/schedule/Schedule.vue`, `ScheduleView.vue`, `ScheduleTab.vue`, `ScheduleContent.vue` (aucune route ; lien menu `/schedule` présent mais route absente ; `Schedule.vue` et `ScheduleView.vue` sont quasi-duplicatas)
   - `src/views/admin/DataTable.vue` (orphelin même au sein du module Administration qui, lui, est bien routé — ce fichier précis n'est importé par rien)
5. **Route sans lien menu confirmée** : `/documentation` (`src/views/docf/Document.vue`) existe dans `src/routes/others.routes.js` mais n'apparaît dans aucun lien du sidebar.
6. **Trois routes vers un même composant** (`/dashboard`, `/home`, ``) toutes résolues par `Dashboard.vue` sans redirection canonique — à rationaliser.
7. **Incohérence d'infrastructure API** : `src/api/userApi.js` utilise une instance axios indépendante (`baseURL = VITE_API_URL + '/api/v1'`) alors que tout le reste du projet passe par `axiosClient.js`/`apiClients.js` (`baseURL = VITE_API_URL + '/api' + prefix`, sans suffixe `/v1`). À clarifier : lequel des deux préfixes (`/api` ou `/api/v1`) correspond à la vraie API backend actuelle ?
8. **Modules Statistiques/Dashboard/Assistant IA/Administration : 100% de données mockées** (aucun appel réseau réel dans Dashboard et Statistiques ; Assistant IA simulé ; Administration utilise un appel `axios.get('')` cassé et des données d'exemple génériques). Les contrats d'API réels (endpoints, payloads) pour ces 4 modules sont à spécifier intégralement avec le métier — le code actuel ne fournit aucune indication fiable sur le schéma de données attendu par le backend.
9. **Bugs de gabarit UI identifiés à ne pas reproduire** : libellés/contenus d'onglets inversés et `id` HTML dupliqués dans `StatsTabs.vue` ; variable `loading` non déclarée référencée dans `Dashboard.vue` ; redirection vers une route inexistante `/login` (au lieu de `/auth/login`) dans `authStore.fetchCurrentUser` en cas de 401 ; ancrage Bootstrap incohérent dans `Settings.vue` (`href="#compte"` vs `id="overview"`).

---

### Module : Affaires pédagogiques

> Documentation produite exclusivement à partir de la lecture du code source réel du dépôt `cficiraswebadmin` (branche `main`, commit `2ea5ce4`). Aucune fonctionnalité non observée dans le code n'a été inventée. Toutes les données affichées dans les tableaux/formulaires sont, sauf mention contraire explicite, des données **statiques (mock/hardcodées en `ref()`)** internes au composant Vue — elles ne transitent par aucun store Pinia ni aucun appel HTTP.

---

#### 1. Objectif métier

Le module "Affaires pédagogiques" est censé couvrir, côté back-office ERP académique LMD, la gestion du corps enseignant et de l'organisation pédagogique d'un établissement :
- Répertorier les enseignants/formateurs et leurs informations (état civil, diplômes, spécialité, contrat).
- Attribuer les cours/matières aux formateurs pour une classe donnée et suivre le volume horaire correspondant.
- Planifier les créneaux horaires et générer/visualiser l'emploi du temps par classe ou par formateur.
- Structurer les programmes pédagogiques (modules/UE, matières, coefficients) et gérer les crédits académiques (ECTS).

**État réel du code** : à ce stade du développement, l'intégralité de l'UI de ce module est un **prototype front-end non connecté au backend** pour la quasi-totalité des écrans. Seuls 3 stores Pinia (`enseignantStore`, `contratStore`, `diplomeStore`) et un usage isolé (modal "Détails" de la liste enseignants) appellent réellement l'API `/api/pedagogie/*`. Tout le reste (attribution de cours, créneaux, emploi du temps, programmes, crédits, suivi pédagogique, charges horaires, rapports, archives) fonctionne sur des tableaux JavaScript locaux (`ref([...])`) réinitialisés à chaque rechargement de page.

#### 2. Acteurs concernés

Aucun mécanisme de restriction d'accès (route guard basé sur un rôle) n'est appliqué aux 4 routes de ce module dans `src/routes/pedagogie.routes.js` — seule la présence d'un `meta: { requiresAuth: true }` générique est appliquée au niveau racine du routeur (`src/routes/index.js` / `src/routes/main.js`). Il n'existe donc pas de RBAC explicite au niveau des routes pédagogie.

Le store `src/stores/authStore/authStore.js` définit cependant des rôles applicatifs globaux (getters `isAdmin`, `isScolarite`, `isPedagogie`, `isCCycle`, `isFinances`, `isDirecteur`, `isEnseignant`, `isGestionnaire`), ce qui suggère un futur RBAC. Sur cette base :

| Acteur | Statut |
|---|---|
| Rôle `pedagogie` (responsable des affaires pédagogiques) | Rôle probable à confirmer — nom de rôle existant dans `authStore` mais aucun contrôle d'accès observé sur les routes pédagogie |
| Rôle `admin` | Rôle probable à confirmer — accès total supposé, non vérifié dans ce module |
| Rôle `directeur` | Rôle probable à confirmer — consultation des rapports/synthèses, non vérifié |
| Rôle `enseignant` | Rôle probable à confirmer — pourrait consulter ses propres attributions/emploi du temps, aucune vue "espace enseignant" trouvée dans les fichiers lus |
| Rôle `c_cycle` (chef de cycle) | Rôle probable à confirmer |
| Étudiant/Apprenant | Non acteur direct de ce module ; apparaît uniquement comme donnée référencée (crédits ECTS, suivi pédagogique) |

#### 3. Menus et sous-menus associés

Extrait de `src/components/partials/sidebar.vue`, groupe `pedagogique` (section "Affaires pédagogiques", lignes ~328-397 et tableau `menuGroups.pedagogique` ligne ~715) :

| Libellé menu | Route (`to`) | Statut |
|---|---|---|
| Enseignants | `/enseignants` | Implémenté — route déclarée + composant `Enseignants.vue` |
| Attribution des cours | `/attribution-cours` | Implémenté — route déclarée + composant `AttributionCours.vue` |
| Créneaux & horaires | `/crenaux-horaires` | Implémenté — route déclarée + composant `CrenauHoraire.vue` |
| **Congés & remplacements** | `/conges-replacement` | **Présent dans le menu mais route absente / composant non trouvé.** Le lien apparaît dans `sidebar.vue` (ligne 381-384, texte "Congés & remplacements") et dans le tableau `pedagogique` utilisé pour l'état actif du menu (ligne 719), mais **aucune route `/conges-replacement` n'existe** dans `src/routes/pedagogie.routes.js` ni dans aucun autre fichier de routes du dépôt. Cliquer sur ce lien produit une navigation vers une URL sans composant associé (page blanche / 404 selon la configuration du router). |
| Programmes & crédits | `/programmes-credits` | Implémenté — route déclarée + composant `ProgrammeCredit.vue` |

#### 4. Pages et routes associées

Source : `src/routes/pedagogie.routes.js`.

| Route | Nom (name) | Composant | Chargement |
|---|---|---|---|
| `/enseignants` | `Formateur` | `src/views/pedagogies/formateurs/Enseignants.vue` | Lazy (`() => import(...)`) |
| `/attribution-cours` | `AttributionsCours` | `src/views/pedagogies/attributions/AttributionCours.vue` | Lazy |
| `/crenaux-horaires` | `CrenauxHoraire` | `src/views/pedagogies/crenaux/CrenauHoraire.vue` | Lazy |
| `/programmes-credits` | `ProgrammesCredits` | `src/views/pedagogies/programme/ProgrammeCredit.vue` | Lazy |
| `/conges-replacement` | — | — | **Absent : aucune entrée dans le fichier de routes, aucun fichier `.vue` correspondant retrouvé dans `src/views/pedagogies/`** |

Les 4 routes existantes ne portent aucune `meta` (pas de `requiresAuth` propre, pas de rôle). Elles héritent uniquement du comportement global du router.

#### 5. Description fonctionnelle complète

Les 4 pages principales (`Enseignants.vue`, `AttributionCours.vue`, `CrenauHoraire.vue`, `ProgrammeCredit.vue`) partagent **exactement la même structure de squelette** (fichiers quasi identiques ligne pour ligne, visiblement dupliqués par copier-coller lors du développement) :

1. Un composant `*Header.vue` (bandeau titre + fil d'Ariane + boutons d'action génériques).
2. Un `SkeletonLoader` affiché pendant `loading === true` (3 lignes, 1 colonne), simulé par un `setTimeout` de **3000 ms** dans le `onMounted()` de la page.
3. À l'issue du délai, un tableau local `formateurs` est peuplé avec 2 entrées hardcodées identiques dans les 4 fichiers (`F001 — John Doe`, `F002 — Anna Smith`) — **mais ce tableau `formateurs` n'est jamais transmis ni affiché** par le composant `*Tab.vue` qui le suit dans le template (aucune prop, aucun `provide/inject`). Il s'agit de code mort résiduel dans les 4 vues racines.
4. Un composant `*Tab.vue` qui affiche une barre d'onglets Bootstrap (`nav-tabs` / `tab-content`) et bascule entre plusieurs sous-composants "Tab/*.vue".

Chaque sous-onglet est un composant autonome avec son propre état réactif Vue (`ref`), son propre jeu de données simulées (`mockXxx`), sa propre logique de filtrage/recherche/pagination et ses propres actions (ajout, suppression, export). **Aucun état n'est partagé entre les onglets d'un même écran ni entre écrans différents** (ex. la liste des formateurs utilisée dans l'onglet "Assignations" de `Enseignants.vue` est une liste différente — avec des ID différents — de celle affichée dans l'onglet "Formateurs").

Seule exception notable : le composant `ItemActions.vue` (modal "Détails" de la fiche formateur, utilisé par `FormateursContent.vue`) exécute un véritable appel API `getEnseignants()` (`src/api/pedagogies/pedagogieApi.js`) au montage, pour tenter de retrouver la fiche détaillée d'un enseignant à partir du champ `responsable` de l'objet mock passé en `props.item`. Ce mapping (`nom prenom === responsable`) est fragile et n'a de sens que si les données réelles de l'API portent une correspondance stricte, ce qui n'est pas garanti avec les données mock utilisées par le tableau appelant.

#### 6. Interfaces du module

###### Écran : Enseignants (`/enseignants`)

- **Fichier racine** : `src/views/pedagogies/formateurs/Enseignants.vue`
- **Composants enfants** : `FormateurHeader.vue`, `PedagogieTab.vue` (barre d'onglets), et sous-onglets `Tab/FormateursContent.vue`, `Tab/AssignationsContent.vue`, `Tab/SuiviPedagogique.vue`, `Tab/ChargesHoraires.vue`, `Tab/RapportsAcademiques.vue`, `Tab/ArchivesPedagogiques.vue`, plus `Details/ItemActions.vue` (menu d'actions + modal détails).
- **Titre affiché** : "Enseignants | Formateurs" — sous-titre "Gestion des formateurs et enseignant".
- **Fil d'Ariane** : Accueil / Pedagogie / formateurs (texte statique codé en dur dans `FormateurHeader.vue`).
- **Chargement** : `SkeletonLoader` (type `table`, 3 lignes, 1 colonne) pendant 3 s simulées (`onMounted` + `setTimeout`), puis affichage de `PedagogieTab`.
- **Données** : la liste principale (onglet "Formateurs") est un mock de 6 formateurs (`mockFormateurs` dans `FormateursContent.vue`) avec pagination (5 par page) et filtres (recherche texte, département, type de contrat).
- **Actions disponibles** : recherche, filtre département/contrat, reset, export (PDF/CSV/Excel/Impression — tous simulés par `console.log`/`window.print`), édition (`alert()`), suppression (avec `confirm()` puis retrait local du tableau), consultation de la fiche détaillée (modal avec appel API réel `getEnseignants()`).

###### Écran : Attribution des cours (`/attribution-cours`)

- **Fichier racine** : `src/views/pedagogies/attributions/AttributionCours.vue`
- **Composants enfants** : `AttributionHeader.vue`, `AttributionTab.vue`, sous-onglets `Tab/CoursMatieres.vue`, `Tab/AssignationsContent.vue`, `Tab/PresencesContent.vue` (vide), `Tab/RessourcesPedagogiques.vue`, `Tab/ChargesHoraires.vue`, `Tab/RapportsAcademiques.vue`, `Tab/ArchivesPedagogiques.vue`.
- **Titre affiché** : "Gestion et attributions des modules" — sous-titre "Gestions des modules et ressources academiques des modules".
- **Fil d'Ariane** : identique à l'écran Enseignants (bug de copier-coller — affiche "formateurs" au lieu de "attributions").
- **Chargement** : identique (SkeletonLoader 3 s).
- **Données** : modules/UE et matières (`Tab/CoursMatieres.vue`), assignations classe→matière→formateur (`Tab/AssignationsContent.vue`), ressources pédagogiques uploadées (`Tab/RessourcesPedagogiques.vue`).
- **Point d'attention** : le composant `AttributionTab.vue` déclare **6 onglets cliquables** (Cours & Matières, Assignations, Ressources pédagogiques, Charges horaires, Rapports, Archives) mais **7 volets de contenu** — un volet `id="presences"` (`PresencesContent.vue`) existe dans le `tab-content` sans onglet correspondant dans le `nav-tabs`, le rendant **inaccessible via l'interface**. De plus, `PresencesContent.vue` est un fichier vide (`<template></template><script setup></script>`), donc même accessible il n'afficherait rien.

###### Écran : Créneaux & horaires (`/crenaux-horaires`)

- **Fichier racine** : `src/views/pedagogies/crenaux/CrenauHoraire.vue`
- **Composants enfants** : `CrenauHeader.vue`, `CrenauHoraireTab.vue`, sous-onglets `Tab/CreneauxHoraires.vue`, `Tab/EmploisDuTemps.vue`, `Tab/TravauxPratiques.vue`, `Tab/TravauxDiriges.vue`.
- **Titre affiché** : "Gestions des crenaux horaires".
- **Bouton distinctif du header** : "Génération de rapport" (pas de `@click`, non fonctionnel).
- **Données** : créneaux/séances (`mockSchedules` dans `CreneauxHoraires.vue`), grille hebdomadaire (`EmploisDuTemps.vue`, vue par classe ou par formateur, semaine ancrée sur mai 2026), rapports d'occupation (`TravauxPratiques.vue`), archives de séances (`TravauxDiriges.vue`).
- **Point d'attention (nommage trompeur)** : dans `CrenauHoraireTab.vue`, l'onglet libellé **"Rapports"** pointe vers le composant **`TravauxPratiques.vue`** (dont le contenu réel est "Rapports & Analyses des Plannings" — statistiques formateurs/salles) et l'onglet libellé **"Archives"** pointe vers **`TravauxDiriges.vue`** (contenu réel : "Archives des Emplois du Temps"). Les noms de fichiers ("Travaux Pratiques"/"Travaux Dirigés") ne correspondent pas au contenu réellement affiché ni au libellé de l'onglet — vestige probable d'un renommage fonctionnel sans renommage de fichier.

###### Écran : Programmes & crédits (`/programmes-credits`)

- **Fichier racine** : `src/views/pedagogies/programme/ProgrammeCredit.vue`
- **Composants enfants** : `ProgrammeHeader.vue`, `ProgrammeTab.vue`, sous-onglets `Tab/ProgrammeCours.vue`, `Tab/CreditsAcademiques.vue`, `Tab/CreditsECTS.vue`, `Tab/ResumeProgramme.vue`.
- **Titre affiché** : "Programmes et credits".
- **Données** : règles de maquette (matière/UE/coefficient/ECTS/note éliminatoire) dans `ProgrammeCours.vue`, configuration des cycles (Licence/Master/Doctorat, total ECTS, compensation) dans `CreditsAcademiques.vue`, portefeuille ECTS par étudiant dans `CreditsECTS.vue`, tableau de bord global (KPI, comparaison par promotion) dans `ResumeProgramme.vue`.

#### 7. Boutons et actions

| Bouton / Action | Écran / Composant | Handler | Comportement réel |
|---|---|---|---|
| "+ Ajouter un nouveau" (header) | Enseignants, AttributionCours, ProgrammeCredit (headers) | Aucun (`<button>` sans `@click`) | **Non fonctionnel** |
| "Génération de rapport" (header) | CrenauHoraire (header) | Aucun | **Non fonctionnel** |
| Icônes header (download / clock / plus) | Les 4 headers | Aucun | **Non fonctionnel** (icônes décoratives) |
| Exporter (PDF/CSV/Excel/Imprimer) | `FormateursContent.vue` | `exportPDF/exportCSV/exportExcel/printTable` | `console.log` simulé (sauf `printTable` → `window.print()` réel) |
| Reset filtres | Tous les onglets à filtres | `resetFilters()` | Réinitialise les `ref` de recherche locaux |
| Détails (menu ⋮) | `ItemActions.vue` | ouvre `isDetailsVisible = true` | Ouvre modal ; appelle **API réelle** `getEnseignants()` pour tenter un matching |
| Modifier (menu ⋮) | `ItemActions.vue` / `FormateursContent.vue` | `editFormateur()` | `alert()` simple, aucune modification persistée |
| Supprimer (menu ⋮ / icône poubelle) | Presque tous les tableaux | `confirmDelete` / `deleteXxx` | `confirm()` navigateur puis suppression **locale uniquement** (`Array.filter`) |
| Assigner (formulaire "Nouvelle Affectation") | `AssignationsContent.vue` (formateurs) | `handleAssign()` | Ajoute une ligne au tableau mock local (`unshift`), aucun appel API |
| Assigner un cours (formulaire "Nouvelle Attribution de Cours") | `AssignationsContent.vue` (attributions) | `handleAssign()` | Idem, local uniquement |
| Ajouter un module/matière | `CoursMatieres.vue` | `handleCreate()` | Ajout local dans `mockModules`/`mockMatieres` |
| Supprimer module / matière | `CoursMatieres.vue` | `deleteModule()` / `deleteMatiere()` | `confirm()` + suppression locale (suppression module = suppression cascade des matières enfants en mémoire) |
| Marquer résolu (suivi pédagogique) | `SuiviPedagogique.vue` | `resolveSuivi()` | Change le statut localement + horodatage |
| Mettre à jour observation | `SuiviPedagogique.vue` | `openEditSuivi()` | `prompt()` navigateur puis mise à jour locale |
| Générer (rapport pédagogique) | `RapportsAcademiques.vue` (Enseignants) | `refreshReport()` | `alert()` simulé |
| Exporter rapport | `RapportsAcademiques.vue` | `downloadReport()` | `alert()` simulé, aucun fichier généré |
| Ajouter un créneau / Enregistrer le créneau | `CreneauxHoraires.vue` | `saveSchedule()` | Ajout ou modification locale de `mockSchedules` (mode "ajout tardif" ou "édition") |
| Import de masse (fichier .xlsx/.csv) | `CreneauxHoraires.vue` | `processImport()` | Ne lit pas réellement le fichier ; `alert()` puis ajout d'**un** enregistrement factice fixe |
| Modifier / Supprimer créneau | `CreneauxHoraires.vue` | `editSlot()` / `deleteSlot()` | Local uniquement |
| Navigation semaine (◀ ▶) | `EmploisDuTemps.vue` | `changeSemaine()` | Décale `currentSemaineOffset`, recalcule les dates affichées (aucune donnée serveur chargée) |
| Clic sur une case de cours | `EmploisDuTemps.vue` | `openCourseDetails()` | `alert()` avec le détail du cours |
| Générer / Analyser (rapports attribution) | `RapportsAcademiques.vue` (attributions) | `generateReport()` | `alert()` simulé |
| Exporter PDF global / Fiche UE | `RapportsAcademiques.vue` (attributions) | `exportAll()` / `exportSingle()` | `alert()` simulé |
| Fixer (règle de maquette) | `ProgrammeCours.vue` | `saveProgramRule()` | Ajout/modification locale de `mockRules` |
| Modifier / Supprimer règle | `ProgrammeCours.vue` | `editRule()` / `deleteRule()` | Local uniquement |
| Enregistrer le protocole (cycle ECTS) | `CreditsAcademiques.vue` | `updateCycleRules()` | `alert()` simulé, `cycleConfig` reste en mémoire locale |
| Octroyer une équivalence | `CreditsECTS.vue` | `openEquivalenceModal()` | `alert()` simulé, aucune modal réelle n'est implémentée |
| Glisser-déposer / téléverser un fichier | `RessourcesPedagogiques.vue`, `CreneauxHoraires.vue` | `handleFileDrop/handleFileSelect` | Ajoute une entrée factice basée sur le nom/la taille réels du fichier choisi, mais **aucun upload serveur** n'est effectué |
| Consulter / Télécharger archive | `ArchivesPedagogiques.vue` (formateurs, attributions, créneaux) | `viewArchive()` / `downloadArchive()` / `downloadSyllabus()` | `alert()` simulé |

#### 8. Formulaires

| Formulaire | Écran | Champs | Validation | Payload / action au submit |
|---|---|---|---|---|
| Nouvelle Affectation (formateur↔matière↔classe) | `Enseignants` > Assignations | Formateur (select, requis), Cours/Matière (select, requis), Classe (select, requis), Volume horaire (number, min 1, requis) | HTML5 `required`/`min` uniquement | `handleAssign()` : `mockAssignments.unshift({id: Date.now(), formateurId, matiere, classe, heures})` — **local, non persisté** |
| Nouvelle Attribution de Cours | `AttributionCours` > Assignations | Classe cible (select, requis, avec `@change` filtrant), Matière (select, requis), Formateur référent (select, requis), Heures (number, min 1, requis) | HTML5 uniquement | `handleAssign()` : ajout local dans `mockAssignments`, reset partiel (classe conservée) |
| Nouveau Composant Pédagogique (Module/Matière) | `AttributionCours` > Cours & Matières | Type (select Module/Matière), Nom (text, requis), Module parent (select, requis si type=Matière, désactivé si type=Module), Coefficient (number, min 1, requis), ECTS (number, min 0) | HTML5 + désactivation conditionnelle du champ parent | `handleCreate()` : push dans `mockModules` ou `mockMatieres` selon le type |
| Ajout tardif / Modification de créneau | `CrenauHoraire` > Créneaux & Horaires | Classe (select, requis), Matière & Formateur (select combiné, requis), Salle (select, requis), Date (date, requis), Heure début (time, requis), Heure fin (time, requis) | HTML5 `required` uniquement, aucune vérification de chevauchement horaire | `saveSchedule()` : ajout (`unshift`) ou remplacement (`findIndex` + réassignation) dans `mockSchedules` selon `isEditing` |
| Import de masse de planning | `CrenauHoraire` > Créneaux & Horaires | Fichier (`.csv/.xlsx/.xls`, drag & drop ou sélection) | Bouton "Valider" désactivé tant qu'aucun fichier n'est chargé | `processImport()` : ne parse pas le fichier ; ajoute un enregistrement factice fixe et affiche une alerte prétendant "24 nouveaux créneaux" ajoutés |
| Paramétrage Matière/EC (programme) | `ProgrammeCredit` > Programme des cours | Classe/Spécialité (select, requis), Semestre (select), UE parente (select, requis), Intitulé matière (text, requis), Coefficient (number, step .5, min .5, requis), ECTS (number, min 1, requis), Note éliminatoire (number, step .25, 0–20, optionnel) | HTML5 uniquement | `saveProgramRule()` : ajout ou modification locale de `mockRules` selon `isEditing` |
| Réglementation des Cycles (ECTS) | `ProgrammeCredit` > Crédits académiques | Cycle (select Licence/Master/Doctorat, avec `@change` rechargeant une config prédéfinie), Total ECTS requis (number, requis), Compensation autorisée (checkbox/switch), Note de validation directe (number, step .5, 10–20) | HTML5 uniquement | `updateCycleRules()` : `alert()` de confirmation, `cycleConfig` reste en mémoire (pas de sauvegarde serveur) |
| Recherche/filtre (générique, présent sur presque tous les onglets) | Tous | Texte libre + selects de filtre (classe, statut, contrat, catégorie, période...) | Aucune | Filtrage réactif côté client via `computed()`, aucun appel serveur |

**Comportement succès/échec** : Aucun des formulaires listés ne présente de gestion d'erreur serveur (pas de `try/catch` autour d'un appel API, pas de message d'échec) car **aucun n'appelle réellement une API**. Le "succès" se traduit systématiquement par une mise à jour immédiate et optimiste d'un tableau réactif local, sans confirmation serveur ni persistance — toute donnée saisie est perdue au rechargement de la page.

#### 9. Tableaux et tables de navigation

| Tableau | Composant | Source de données | Pagination | Recherche/filtres |
|---|---|---|---|---|
| Répertoire des Formateurs | `Tab/FormateursContent.vue` | **Simulé** (`mockFormateurs`, 6 entrées) | Oui (`Pagination.vue`, 5/page) | Recherche texte + département + type de contrat |
| Assignations des Formateurs | `Tab/AssignationsContent.vue` (Enseignants) | **Simulé** (`mockAssignments`, 4 entrées) | Non | Recherche texte |
| Suivi Pédagogique & Alertes | `Tab/SuiviPedagogique.vue` | **Simulé** (`mockSuivis`, 4 entrées) | Non | Recherche + statut + classe, KPI calculés côté client |
| Suivi des Charges Horaires (formateurs) | `Tab/ChargesHoraires.vue` (Enseignants) | **Simulé** (`mockCharges`, 4 entrées) | Non | Recherche + type de contrat |
| Documents de Synthèse (rapports) | `Tab/RapportsAcademiques.vue` (Enseignants) | **Simulé** (`mockReports`, 4 entrées) ; KPI en dur (87.4%, 13.42/20, 4.1%) | Non | Filtres période/classe/type (n'affectent pas les KPI en dur) |
| Archives Historiques (formateurs) | `Tab/ArchivesPedagogiques.vue` (Enseignants) | **Simulé** (`mockArchives`, 5 entrées) | Non | Année + catégorie + recherche |
| Gestion des Modules & Matières | `Tab/CoursMatieres.vue` | **Simulé** (`mockModules` 3 + `mockMatieres` 5, arborescence) | Non | Recherche texte cascadée module/matière |
| Assignation des Enseignements (attribution) | `Tab/AssignationsContent.vue` (Attributions) | **Simulé** (`mockAssignments`, 3 entrées) | Non | Recherche texte |
| Ressources Pédagogiques | `Tab/RessourcesPedagogiques.vue` | **Simulé** (`mockResources`, 5 entrées + ajouts locaux via upload) | Non | Recherche + matière + type |
| Suivi des Charges Horaires (attribution) | `Tab/ChargesHoraires.vue` (Attributions) | **Simulé** (`mockCharges`, 5 entrées) | Non | Classe + statut d'avancement |
| Rapports & Statistiques des Modules | `Tab/RapportsAcademiques.vue` (Attributions) | **Simulé** (`mockModuleReports`, 3 entrées) | Non | Classe/module/indicateur (n'affectent pas les données) |
| Archives des Maquettes Pédagogiques | `Tab/ArchivesPedagogiques.vue` (Attributions) | **Simulé** (`mockModuleArchives`, 3 entrées) | Non | Année + recherche |
| Registre des Séances Programmées | `Tab/CreneauxHoraires.vue` | **Simulé** (`mockSchedules`, 2 entrées + import factice) | Non | Filtre par classe |
| Grille hebdomadaire (Emploi du temps) | `Tab/EmploisDuTemps.vue` | **Simulé** (`mockSchedules`, 5 entrées, semaine ancrée mai 2026) | Non (navigation semaine) | Vue par classe / par formateur |
| Synthèse Mensuelle Heures / Occupation Salles | `Tab/TravauxPratiques.vue` (libellé onglet "Rapports") | **Simulé** (`mockFormateurStats` 3, `mockSalleStats` 3) | Non | Mois + type de rapport (formateur/salle) |
| Registre des Séances Clôturées | `Tab/TravauxDiriges.vue` (libellé onglet "Archives") | **Simulé** (`mockScheduleArchives`, 4 entrées) | Non | Année + recherche globale |
| Règlement des Examens & Pondérations | `Tab/ProgrammeCours.vue` | **Simulé** (`mockRules`, 3 entrées) | Non | Classe |
| Distribution des ECTS par Maquette | `Tab/CreditsAcademiques.vue` | **Simulé** (`mockUeDistribution`, 4 entrées) | Non | Aucun |
| Grand Registre des Crédits Capitalisés | `Tab/CreditsECTS.vue` | **Simulé** (`studentsCreditsList`, chargé à la demande selon classe, 4 entrées fixes) | Non | Classe + recherche étudiant |
| Performances Comparées par Promotion | `Tab/ResumeProgramme.vue` | **Simulé** (`mockPromotionSummary`, 4 entrées) + 4 cartes KPI en dur (1 240 apprenants, 84,2%, 37 200 ECTS, 92,6%) | Non | Aucun |

Aucun de ces tableaux n'utilise `enseignantStore`, `contratStore` ou `diplomeStore`, ni les fonctions d'`pedagogieApi.js` autres que `getEnseignants()` appelée isolément dans `ItemActions.vue`.

#### 10. Onglets

| Écran | Onglets déclarés (ordre UI) | Composant cible | Remarque |
|---|---|---|---|
| Enseignants (`PedagogieTab.vue`) | Formateurs, Assignations, Suivi pédagogique, Charges horaires, Rapports, Archives | `FormateursContent`, `AssignationsContent`, `SuiviPedagogique`, `ChargesHoraires`, `RapportsAcademiques`, `ArchivesPedagogiques` | 6 onglets = 6 volets, cohérent |
| Attribution des cours (`AttributionTab.vue`) | Cours & Matières, Assignations, Ressources pédagogiques, Charges horaires, Rapports, Archives | `CoursMatieres`, `AssignationsContent`, `RessourcesPedagogiques`, `ChargesHoraires`, `RapportsAcademiques`, `ArchivesPedagogiques` | 6 onglets déclarés mais **7 volets de contenu** ; le volet `PresencesContent` (id `presences`) n'a pas d'onglet et est vide |
| Créneaux & horaires (`CrenauHoraireTab.vue`) | Créneaux & Horaires, Emploi du temps, Rapports, Archives | `CreneauxHoraires`, `EmploisDuTemps`, `TravauxPratiques` (label "Rapports"), `TravauxDiriges` (label "Archives") | 4 onglets = 4 volets, cohérent en nombre mais noms de fichiers trompeurs |
| Programmes & crédits (`ProgrammeTab.vue`) | Programme des cours, Crédits académiques, Crédits ECTS, Résumé global | `ProgrammeCours`, `CreditsAcademiques`, `CreditsECTS`, `ResumeProgramme` | 4 onglets = 4 volets, cohérent |

#### 11. Workflow métier complet

##### WF-PEDAGOGIE-01 — Attribution d'un cours à un enseignant (état actuel du code)

1. L'utilisateur ouvre `/attribution-cours`, onglet "Assignations" (`Tab/AssignationsContent.vue`).
2. Il sélectionne une **Classe Cible** dans une liste fermée (`mockClasses` : 3 valeurs codées en dur).
3. Il sélectionne une **Matière** dans `mockMatieres` (5 valeurs codées en dur, indépendantes de l'onglet "Cours & Matières" bien que censées représenter les mêmes données).
4. Il sélectionne un **Formateur Référent** dans `mockFormateurs` (3 entrées codées en dur, différentes des formateurs listés dans l'écran "Enseignants").
5. Il saisit un **Volume Horaire** (nombre, min 1).
6. Il clique sur "Assigner" → `handleAssign()` exécute `mockAssignments.unshift(...)` : l'attribution apparaît immédiatement en tête du tableau "Assignation des Enseignements", avec un badge "Actif".
7. Aucune vérification de doublon (même matière/classe déjà attribuée à un autre formateur), aucune vérification de disponibilité/charge horaire du formateur, aucun appel réseau.
8. Rafraîchissement de la page → l'attribution est perdue (retour au jeu de données initial `mockAssignments` à 3 entrées).

*Remarque* : l'API back-end expose des fonctions dédiées à ce type d'opération (`assignEnseignantToModule`, `assignEnseignantToClasse` dans `pedagogieApi.js`) mais **aucune n'est appelée** par ce workflow UI — elles sont mortes/orphelines dans le code actuel.

##### WF-PEDAGOGIE-02 — Création d'un créneau / emploi du temps (état actuel du code)

1. L'utilisateur ouvre `/crenaux-horaires`, onglet "Créneaux & Horaires" (`Tab/CreneauxHoraires.vue`).
2. Deux voies possibles :
   - **Import de masse** : glisser-déposer ou sélectionner un fichier `.csv/.xlsx/.xls` → bouton "Valider l'importation" s'active → au clic, `processImport()` affiche une alerte prétendant l'ajout de "24 nouveaux créneaux horaires" mais **n'ajoute réellement qu'un seul enregistrement factice fixe** (`Licence 3 Management`, `Salle 204`) au tableau `mockSchedules`, sans jamais lire le contenu du fichier fourni.
   - **Ajout manuel/tardif** : renseigner Classe, Matière & Formateur (select combiné), Salle, Date, Heure début, Heure fin → soumission du formulaire (`saveSchedule()`) → ajout (`unshift`) dans `mockSchedules`.
3. Le nouveau créneau apparaît dans le "Registre des Séances Programmées" (tableau filtrable par classe).
4. L'utilisateur peut ensuite consulter la grille visuelle dans l'onglet "Emploi du temps" (`Tab/EmploisDuTemps.vue`) — **mais cette grille utilise son propre jeu de données `mockSchedules` local, distinct de celui de l'onglet "Créneaux & Horaires"** : un créneau ajouté dans le premier onglet n'apparaît PAS automatiquement dans la grille du second onglet (états Vue non partagés entre composants frères).
5. Aucune règle de non-chevauchement (même salle/même formateur/même créneau horaire) n'est vérifiée lors de l'enregistrement.
6. Rafraîchissement de page → toutes les modifications sont perdues.

#### 12. Cas d'utilisation

- **UC-PEDAGOGIE-01 — Consulter la liste des enseignants** : l'utilisateur accède à `/enseignants`, visualise le tableau paginé des formateurs (données simulées), filtre par nom/spécialité/département/contrat.
- **UC-PEDAGOGIE-02 — Consulter la fiche détaillée d'un enseignant** : depuis le menu d'actions d'une ligne, ouverture d'une modal (`ItemActions.vue`) affichant état civil, contact, diplôme/spécialité ; tente une résolution via l'API réelle `getEnseignants()`.
- **UC-PEDAGOGIE-03 — Attribuer un cours à un formateur** : via le formulaire d'assignation de `/attribution-cours`, associer Classe + Matière + Formateur + Volume horaire (cf. WF-PEDAGOGIE-01).
- **UC-PEDAGOGIE-04 — Créer/ajuster un créneau horaire** : via le formulaire ou l'import de masse de `/crenaux-horaires` (cf. WF-PEDAGOGIE-02).
- **UC-PEDAGOGIE-05 — Consulter l'emploi du temps hebdomadaire** : vue grille par classe ou par formateur, navigation semaine par semaine.
- **UC-PEDAGOGIE-06 — Suivre la charge horaire d'un formateur** : consultation du taux d'occupation (heures assignées vs quota contractuel) avec code couleur d'alerte.
- **UC-PEDAGOGIE-07 — Paramétrer une matière dans une maquette pédagogique** : définir coefficient, ECTS, note éliminatoire pour une matière rattachée à une UE/classe/semestre.
- **UC-PEDAGOGIE-08 — Configurer les règles de crédits d'un cycle** : total ECTS requis, autorisation de compensation, note de validation directe, par cycle (Licence/Master/Doctorat).
- **UC-PEDAGOGIE-09 — Suivre le portefeuille ECTS d'un étudiant** : consultation des crédits acquis par semestre et par équivalence, avec statut de progression (Année Validée / Passage Conditionnel / Ajourné).
- **UC-PEDAGOGIE-10 — Suivi pédagogique et alertes décrochage** : identification d'étudiants en difficulté, mise à jour d'observations, clôture de dossier.
- **UC-PEDAGOGIE-11 — Consulter des archives pédagogiques historiques** : consultation en lecture seule de maquettes, séances et assignations d'années académiques clôturées (formateurs, attributions, créneaux).
- **UC-PEDAGOGIE-12 — Accéder à "Congés & remplacements"** : **Cas d'utilisation non réalisable** — le lien de menu existe mais ne mène à aucune route/fonctionnalité implémentée.

#### 13. Données manipulées

| Entité | Champs observés dans le code | Origine |
|---|---|---|
| **Enseignant** | `id`/`enseignant_id`, `nom`, `prenom`, `email`, `tel1`, `tel2`, `datenais`, `lieunais`, `sexe`, `matrimonial`, `diplome`, `specialite`, `etablissement`, `photourl`, `designation_type_enseignant`, `matricule`, `code_enseignant`, `contrat`, `departement`, `date_embauche`, `telephone`, `modules_evalues`, `nombre_notes_saisies` | Champs de la modal `ItemActions.vue` = probable shape API réelle (`getEnseignants`) ; champs du tableau `FormateursContent.vue` (`code_enseignant`, `departement`, etc.) = mock local, possiblement divergent du schéma réel |
| **Contrat** | Non détaillé dans l'UI (aucun composant de gestion CRUD contrat trouvé dans les fichiers lus) ; store `contratStore.js` gère `contrats`/`contrat`/`loading` génériques | Store connecté à l'API réelle (`getContrats`, `createContrat`, `updateContrat`, `deleteContrat`) mais **non utilisé par aucune vue lue** |
| **Diplôme** | Idem contrat — store `diplomeStore.js` avec `diplomes`/`diplome`/`loading` | Store connecté à l'API réelle mais **non utilisé par aucune vue lue** |
| **Attribution / Cours-Matière** | `id`, `formateurId`, `matiere`(nom ou id selon l'onglet), `classe`, `heures`, `moduleCode`(indirect via `parentId`) | Mock local (`AssignationsContent.vue` ×2 versions différentes) |
| **Module / UE** | `id`, `code`, `nom`, `coefficient`, `ects` | Mock local (`CoursMatieres.vue`, `ProgrammeCours.vue`) |
| **Créneau / Séance** | `id`, `date`, `heureDebut`, `heureFin`, `classe`, `matiere`, `formateur`, `salle` | Mock local (`CreneauxHoraires.vue`, `EmploisDuTemps.vue`, archives) |
| **Programme / Règle de maquette** | `id`, `classe`, `semestre`, `moduleCode`, `matiere`, `coefficient`, `ects`, `noteEliminatoire` | Mock local (`ProgrammeCours.vue`) |
| **Crédit / ECTS** | Au niveau cycle : `totalEcts`, `compensationPermise`, `noteValidationDirecte` ; au niveau étudiant : `matricule`, `nom`, `ectsS1`, `ectsS2`, `equivalences` | Mock local (`CreditsAcademiques.vue`, `CreditsECTS.vue`) |
| **Ressource pédagogique** | `id`, `nom`, `type`, `format`, `matiere`, `classe`, `taille`, `date_ajout` | Mock local + génération dynamique lors d'un upload réel côté navigateur (`RessourcesPedagogiques.vue`) — aucun envoi serveur |
| **Suivi pédagogique** | `id`, `etudiantNom`, `etudiantPrenom`, `matricule`, `classe`, `observation`, `statut`, `signalePar`, `dateModif` | Mock local (`SuiviPedagogique.vue`) |

#### 14. API et intégration backend

Fichier source : `src/api/pedagogies/pedagogieApi.js`. Client HTTP : `pedagogieApi` (`src/api/config/apiClients.js`), `baseURL = ${VITE_API_URL}/api/pedagogie`, en-tête `Authorization: Bearer <token>` injecté automatiquement (`axiosClient.js`).

| Fonction API | Méthode / Endpoint | Utilisée par | Statut d'utilisation réelle |
|---|---|---|---|
| `getEnseignants()` | GET `/enseignant/enseignants` | `enseignantStore.fetchEnseignants()` **et** `ItemActions.vue` (appel direct) | **Utilisée** — seul point d'intégration réel observé dans les vues lues |
| `getEnseignantById(id)` | GET `/enseignant/enseignants/:id` | `enseignantStore.fetchEnseignantById()` | Store présent mais store lui-même non importé par aucune vue lue |
| `createEnseignant(data)` | POST `/enseignant/enseignants` | `enseignantStore.addEnseignant()` | Idem — non appelé depuis l'UI observée |
| `updateEnseignant(id, data)` | PUT `/enseignant/enseignants/:id` | `enseignantStore.editEnseignant()` | Idem — non appelé |
| `deleteEnseignant(id)` | DELETE `/enseignant/enseignants/:id` | `enseignantStore.removeEnseignant()` | Idem — non appelé (les suppressions UI passent par `Array.filter` local) |
| `getContrats()` | GET `/contrats` | `contratStore.fetchContrats()` | Store présent, **non importé par aucune vue lue** |
| `getContratById(id)` | GET `/contrats/:id` | `contratStore.fetchContratById()` | Idem |
| `createContrat(data)` | POST `/contrats` | `contratStore.addContrat()` | Idem |
| `updateContrat(id, data)` | PUT `/contrats/:id` | `contratStore.editContrat()` | Idem |
| `deleteContrat(id)` | DELETE `/contrats/:id` | `contratStore.removeContrat()` | Idem |
| `getDiplomes()` | GET `/diplomes` | `diplomeStore.fetchDiplomes()` | Store présent, **non importé par aucune vue lue** |
| `getDiplomeById(id)` | GET `/diplomes/:id` | `diplomeStore.fetchDiplomeById()` | Idem |
| `createDiplome(data)` | POST `/diplomes` | `diplomeStore.addDiplome()` | Idem |
| `updateDiplome(id, data)` | PUT `/diplomes/:id` | `diplomeStore.editDiplome()` | Idem |
| `deleteDiplome(id)` | DELETE `/diplomes/:id` | `diplomeStore.removeDiplome()` | Idem |
| `getEnseignantsByModule(moduleId)` | GET `/modules/:moduleId/enseignants` | Aucune | **Orpheline** — définie mais jamais appelée dans le code lu |
| `assignEnseignantToModule(moduleId, enseignantId)` | POST `/modules/:moduleId/enseignants` | Aucune | **Orpheline** — serait l'endpoint naturel pour WF-PEDAGOGIE-01, non câblé |
| `removeEnseignantFromModule(moduleId, enseignantId)` | DELETE `/modules/:moduleId/enseignants/:enseignantId` | Aucune | **Orpheline** |
| `getEnseignantsByClasse(classeId)` | GET `/classes/:classeId/enseignants` | Aucune | **Orpheline** |
| `assignEnseignantToClasse(classeId, enseignantId)` | POST `/classes/:classeId/enseignants` | Aucune | **Orpheline** |
| `removeEnseignantFromClasse(classeId, enseignantId)` | DELETE `/classes/:classeId/enseignants/:enseignantId` | Aucune | **Orpheline** |
| `getCreneauxByEnseignant(enseignantId)` | GET `/enseignants/:enseignantId/creneaux` | Aucune | **Orpheline** — serait l'endpoint naturel pour WF-PEDAGOGIE-02, non câblé |
| `assignCreneauToEnseignant(enseignantId, creneauId)` | POST `/enseignants/:enseignantId/creneaux` | Aucune | **Orpheline** |
| `removeCreneauFromEnseignant(enseignantId, creneauId)` | DELETE `/enseignants/:enseignantId/creneaux/:creneauId` | Aucune | **Orpheline** |

**Synthèse** : le back-end (à en juger par les endpoints définis) prévoit un modèle d'attribution enseignant↔module et enseignant↔classe ainsi qu'un modèle créneau↔enseignant. Le front-end actuel des écrans Attribution/Créneaux **n'exploite aucun de ces endpoints** et fonctionne intégralement en mémoire locale (mock), ce qui constitue le principal écart entre l'intention métier (déduite des routes API) et l'implémentation UI observée.

#### 15. Règles métier détectées

- **RM-PEDAGOGIE-01 — Aucune vérification de conflit de créneau** : `CreneauxHoraires.vue` (`saveSchedule`) permet d'enregistrer un créneau pour une salle/formateur/classe déjà occupés à la même date/heure ; aucune règle de non-chevauchement n'est codée côté front, et aucun appel serveur ne pourrait la valider côté back dans ce flux.
- **RM-PEDAGOGIE-02 — Alerte de charge horaire par seuil visuel uniquement** : `ChargesHoraires.vue` (Enseignants) calcule un pourcentage `heuresAssignees / quotaMax` et applique des seuils de coloration (`> 100%` = "Heures Sup" en rouge, `≥ 85%` = "Optimal" en vert, `≥ 50%` = "Sous-charge" en orange, `< 50%` = "Inactif/Critique"). C'est une règle **d'affichage uniquement** — rien n'empêche la saisie d'une attribution dépassant le quota (pas de blocage lors de `handleAssign()`).
- **RM-PEDAGOGIE-03 — Note éliminatoire optionnelle par matière** : `ProgrammeCours.vue` permet de définir une note éliminatoire (0–20, pas de 0,25) par matière ; si non renseignée, aucune règle éliminatoire ne s'applique ("Aucune" affiché). Règle déclarative uniquement, aucun moteur de calcul de délibération ne l'exploite dans le code lu.
- **RM-PEDAGOGIE-04 — Attribution des crédits ECTS conditionnée à une note seuil ou à la compensation du jury** : `CreditsAcademiques.vue` définit `noteValidationDirecte` (ex. 10/20) en dessous de laquelle les ECTS "ne sont acquis que par compensation globale du jury" (texte informatif dans l'UI). Aucun calcul automatique de compensation n'est implémenté dans le code lu — règle documentaire seulement.
- **RM-PEDAGOGIE-05 — Seuils de statut de progression ECTS étudiant** : `CreditsECTS.vue` (`getStatusLabel`) : total ECTS (S1+S2+équivalences) `≥ 60` → "Année Validée" ; `≥ 48` → "Passage Conditionnel" ; en dessous → "Ajourné". Le dénominateur de référence (120 ECTS/cycle Master, cf. `calculateTotal`/barre de progression `/120`) est codé en dur, indépendant du `totalEcts` configurable par cycle dans `CreditsAcademiques.vue` (les deux composants ne partagent pas cette donnée — incohérence potentielle si `totalEcts` est modifié pour un cycle Licence à 180).
- **RM-PEDAGOGIE-06 — Suppression en cascade Module → Matières** : `CoursMatieres.vue` (`deleteModule`) : la suppression d'un module supprime automatiquement (en mémoire) toutes les matières dont `parentId` correspond, après confirmation explicite de l'utilisateur (`confirm()`).
- **RM-PEDAGOGIE-07 — Statut "Emargé (100%)" figé pour toutes les archives de séances** : `TravauxDiriges.vue` affiche systématiquement le badge "Émargé (100%)" pour chaque ligne d'archive, sans donnée réelle de présence sous-jacente — règle d'affichage non représentative d'un état métier variable.
- **RM-PEDAGOGIE-08 — Contrainte de sélection Module parent conditionnelle au type** : `CoursMatieres.vue` : le select "Module Parent" est désactivé et non requis si `form.type === 'Module'`, mais devient obligatoire (`required`) si `form.type === 'Matière'`.

---

#### Points à confirmer

1. **`/conges-replacement`** : confirmer si une route/vue est prévue dans une itération future, ou si l'entrée de menu doit être retirée du sidebar en attendant l'implémentation.
2. **RBAC réel du module** : aucun contrôle de rôle n'est appliqué aux routes `/enseignants`, `/attribution-cours`, `/crenaux-horaires`, `/programmes-credits` — à confirmer si c'est voulu (accès ouvert à tout utilisateur authentifié) ou un oubli de configuration `meta.roles`.
3. **Statut des stores `contratStore` et `diplomeStore`** : entièrement fonctionnels côté code (CRUD complet vers l'API réelle) mais **aucune vue ne les importe** dans les fichiers lus — à confirmer s'il existe des écrans de gestion des contrats/diplômes ailleurs dans le dépôt (hors périmètre des fichiers listés dans la consigne) ou si ce sont des stores préparés pour un développement futur non terminé.
4. **Écart API vs UI (attribution/créneaux)** : les endpoints `assignEnseignantToModule`, `assignEnseignantToClasse`, `assignCreneauToEnseignant` existent côté client API mais ne sont appelés nulle part — à confirmer si le back-end expose réellement ces routes et si le câblage front est planifié.
5. **Schéma réel de l'entité Enseignant** : deux jeux de champs incompatibles coexistent (mock du tableau `FormateursContent.vue` vs champs attendus par la modal `ItemActions.vue` alimentée par l'API réelle) — à confirmer quel schéma correspond au modèle back-end définitif.
6. **`PresencesContent.vue`** : fichier vide référencé dans `AttributionTab.vue` sans onglet cliquable associé — à confirmer si une fonctionnalité de suivi de présence est prévue pour ce module (le libellé "Présences" suggère un lien avec les émargements/archives observés ailleurs).
7. **Incohérence du seuil ECTS de cycle** (`120` codé en dur dans `CreditsECTS.vue` vs `totalEcts` configurable dans `CreditsAcademiques.vue`) — à confirmer si une synchronisation est prévue.

---

### Modules prévus mais non implémentés (fantômes)

Ces modules sont **présents dans le menu de navigation** (`src/components/partials/sidebar.vue`) mais **ne possèdent ni route déclarée** (dans `src/routes/*.routes.js`) **ni composant Vue correspondant** dans `src/views/`. Aucune recherche (`grep`) dans le dépôt ne retourne de fichier lié à ces libellés, en dehors de la mention dans le sidebar. Conformément à la règle absolue de ce document, **aucune fonctionnalité n'est inventée ici** : seul le libellé du menu et l'intitulé des sous-menus sont des faits vérifiables ; le reste (objectif métier détaillé, écrans, champs, workflows) est à concevoir entièrement lors de la reconstruction, en s'appuyant sur les besoins réels de l'établissement.

Pour chacun, seules les sections factuelles du template sont renseignées ; les sections qui nécessiteraient d'inventer un comportement (interfaces, boutons, formulaires, workflows, cas d'utilisation, règles métier) sont explicitement marquées "Non applicable — aucun code existant, à concevoir lors de la reconstruction".

---

#### Module : Bibliothèque
1. **Objectif métier (déduit du seul libellé, à confirmer)** : gestion d'une bibliothèque académique (probablement catalogue d'ouvrages, emprunts). Objectif réel **à confirmer** avec les parties prenantes.
2. **Acteurs concernés** : rôle probable à confirmer (aucun code).
3. **Menus et sous-menus associés** : entrée de menu unique "Bibliothèque" (pas de sous-menu), lien vers `/bibliotheque`.
4. **Pages et routes associées** :

| Page | Route | Composant | Description | Statut |
|---|---|---|---|---|
| Bibliothèque | `/bibliotheque` | *(aucun)* | — | Présent dans le menu mais route absente / composant non trouvé |

5–15. Non applicable — aucun code existant, à concevoir lors de la reconstruction.

---

#### Module : Ressources matérielles
1. **Objectif métier (déduit des libellés de sous-menu)** : gestion des salles/équipements physiques, réservation de ressources, suivi des disponibilités. **À confirmer.**
2. **Acteurs concernés** : rôle probable à confirmer.
3. **Menus et sous-menus associés** : "Salles & équipements", "Réservation", "Disponibilités".
4. **Pages et routes associées** :

| Page | Route | Composant | Description | Statut |
|---|---|---|---|---|
| Salles & équipements | `/salles` | *(aucun)* | — | Présent dans le menu mais route absente |
| Réservation | `/reservation` | *(aucun)* | — | Présent dans le menu mais route absente |
| Disponibilités | `/disponibilites` | *(aucun)* | — | Présent dans le menu mais route absente |

Remarque : à ne pas confondre avec `/salles-horaires` (module Examens), qui lui **est implémenté** et gère l'affectation des salles pour les examens spécifiquement.

5–15. Non applicable — aucun code existant, à concevoir lors de la reconstruction.

---

#### Module : Coordination académique
1. **Objectif métier (déduit des libellés)** : suivi des thèmes de mémoire, organisation des soutenances, suivi du statut administratif de l'étudiant (actif/suspendu/diplômé...). **À confirmer.**
2. **Acteurs concernés** : rôle probable à confirmer (responsable pédagogique probable, à confirmer).
3. **Menus et sous-menus associés** : "Thèmes & mémoires", "Soutenances", "Statut étudiant".
4. **Pages et routes associées** :

| Page | Route | Composant | Description | Statut |
|---|---|---|---|---|
| Thèmes & mémoires | `/themes-memoires` | *(aucun)* | — | Présent dans le menu mais route absente |
| Soutenances | `/soutenances` | *(aucun)* | — | Présent dans le menu mais route absente |
| Statut étudiant | `/statut` | *(aucun)* | — | Présent dans le menu mais route absente |

5–15. Non applicable — aucun code existant, à concevoir lors de la reconstruction.

---

#### Module : Diplômes
1. **Objectif métier (déduit des libellés)** : gestion de la demande, édition/certification et historique des diplômes délivrés. **À confirmer.**
2. **Acteurs concernés** : rôle probable à confirmer.
3. **Menus et sous-menus associés** : "Demande de diplôme", "Édition & certification", "Historique".
4. **Pages et routes associées** :

| Page | Route | Composant | Description | Statut |
|---|---|---|---|---|
| Demande de diplôme | `/demande-diplome` | *(aucun)* | — | Présent dans le menu mais route absente |
| Édition & certification | `/edition-diplome` | *(aucun)* | — | Présent dans le menu mais route absente |
| Historique | `/historique-diplome` | *(aucun)* | — | Présent dans le menu mais route absente |

**Élément notable** : un store Pinia `src/stores/pedagogieStore/diplomeStore.js` existe dans le code alors qu'aucune vue ni route "Diplômes" n'est câblée. Cela suggère un développement commencé côté état/logique puis interrompu avant la couche UI/routage. Son contenu réel (état, actions, appels API) doit être vérifié et, si pertinent, réutilisé comme point de départ lors de la reconstruction de ce module.

5–15. Non applicable pour l'UI — mais **le contenu de `diplomeStore.js` doit être audité séparément** avant reconstruction (voir section transverse du document final).

---

#### Module : Courrier & Notes (administratif)
1. **Objectif métier (déduit des libellés)** : gestion du courrier entrant/sortant, notes administratives internes, archivage documentaire. **À confirmer.**
2. **Acteurs concernés** : rôle probable à confirmer (agent administratif probable, à confirmer).
3. **Menus et sous-menus associés** : "Courriers", "Notes administratives", "Archivage".
4. **Pages et routes associées** :

| Page | Route | Composant | Description | Statut |
|---|---|---|---|---|
| Courriers | `/courriers` | *(aucun)* | — | Présent dans le menu mais route absente |
| Notes administratives | `/notes-admin` | *(aucun)* | — | Présent dans le menu mais route absente |
| Archivage | `/archivage` | *(aucun)* | — | Présent dans le menu mais route absente |

5–15. Non applicable — aucun code existant, à concevoir lors de la reconstruction.

---

#### Sous-fonctionnalités fantômes rattachées à un module existant

| Élément | Rattaché à | Route menu | Statut | Remarque |
|---|---|---|---|---|
| Congés & remplacements | Affaires pédagogiques | `/conges-replacement` | Présent dans le menu mais route absente | Aucun composant trouvé |
| Résultats concours (référence JS) | Concours | `/resultats-concours` | Présent dans le menu (logique JS `menuGroups.concours`) mais route absente | Aucun `<router-link>` dans le template, aucune route déclarée — incohérence interne au sidebar lui-même |

#### Composants orphelins (code écrit mais non branché au routeur — différent des modules 100% fantômes ci-dessus)

Ces modules ont du code fonctionnel (vues + éventuellement des sous-composants) mais ne sont accessibles par AUCUNE route déclarée, alors que leur libellé apparaît dans le sidebar. Documentation détaillée confiée à l'agent transverse (module Auth/Dashboard/etc.), résumé ici pour la cartographie :

| Composant | Fichier(s) | Menu associé | Statut |
|---|---|---|---|
| Emploi du temps | `views/schedule/Schedule.vue`, `ScheduleView.vue`, `ScheduleTab.vue`, `ScheduleContent.vue` | `/schedule` | Composant présent, route absente |
| Paramètres | `views/settings/Settings.vue` | `/settings` | Composant présent, route absente |
| Notifications | `views/notifications/notification.vue` | `/notification` | Composant présent, route absente |
| Support | `views/support/Support.vue` | *(aucun menu)* | Composant présent, ni menu ni route |

#### Recommandation générale de reconstruction pour cette section

Lors de la reconstruction, ces entrées de menu ne doivent **pas** être recréées avec un comportement inventé. Deux options légitimes :
1. **Retirer ces entrées du menu** tant que le besoin métier réel n'est pas spécifié par les parties prenantes (option la plus sûre pour rester fidèle à ce qui existe réellement).
2. **Les conserver comme placeholders explicites** ("Module à venir") avec un état vide (`EmptyState`) clair, pour préserver l'architecture de navigation prévue sans simuler une fonctionnalité inexistante.
Les composants orphelins déjà codés (Schedule, Settings, Notifications, Support) doivent être audités individuellement (voir section transverse) pour décider s'ils sont repris tels quels et re-routés, ou reconstruits.

---

## 6. Workflows métier

Tous les workflows identifiés (identifiants `WF-[MODULE]-NN`) sont détaillés étape par étape dans la section 5, au sein de la sous-section « Workflow métier complet » de chaque module. Liste consolidée :

| Module | Workflows identifiés |
|---|---|
| Structure Académique | WF-STRUCTURE-01 (Création d'une année académique), WF-STRUCTURE-02 (Construction Cycle → Filière → Niveau → Classe), WF-STRUCTURE-03 (Configuration d'un semestre et ses UE — partiellement simulé) |
| Scolarité | WF-SCOLARITE-01 (Consultation liste étudiants → dossier), WF-SCOLARITE-02 (Génération rapport étudiant — simulé), WF-SCOLARITE-03 (Consultation dossier scolaire complet), WF-SCOLARITE-04 (Prise de présence journalière), WF-SCOLARITE-05 (Import liste d'étudiants — non opérationnel) |
| Inscriptions | WF-INSCRIPTIONS-01 (Inscription par import de lot jusqu'à validation paiement), WF-INSCRIPTIONS-02 (Réinscription en lot) |
| Notes / Délibérations | WF-NOTES-01 (Saisie et édition de notes), WF-DELIBERATION-01 (Délibération et proclamation) |
| Examens | WF-EXAMENS-01 (Planification d'une session de bout en bout), WF-EXAMENS-02 (Affectation des salles) |
| Concours | WF-CONCOURS-01 (Création → configuration → épreuves → candidats → notes → rangs → délibération → proclamation) |
| Pédagogie | WF-PEDAGOGIE-01 (Attribution d'un cours à un enseignant), WF-PEDAGOGIE-02 (Création d'un créneau/emploi du temps) |
| Finances | WF-FINANCES-01 (Enregistrement d'un paiement), WF-FINANCES-02 (Génération d'une facture) |
| Auth | WF-AUTH-01 (Connexion), WF-AUTH-02 (Déconnexion) |
| Dashboard / Stats / Doc / IA / Admin | WF-DASHBOARD-01, WF-STATS-01, WF-DOC-01, WF-IA-01 (simulation), WF-ADMIN-01 |
| Modules orphelins | WF-NOTIF-01, WF-SUPPORT-01, WF-SETTINGS-01, WF-SCHEDULE-01 (tous documentés comme « état actuel : inaccessible/non fonctionnel ») |

**Total : 25 workflows documentés en détail dans la section 5.**

## 7. Cas d'utilisation

Tous les cas d'utilisation identifiés (identifiants `UC-[MODULE]-NN`) sont détaillés dans la section 5 avec acteur, préconditions, scénario nominal, scénarios alternatifs, exceptions et règles métier. Décompte par module :

| Module | Nombre de cas d'utilisation | Identifiants |
|---|---|---|
| Structure Académique | 4 | UC-STRUCTURE-01 à 04 |
| Scolarité | 9 | UC-SCOLARITE-01 à 09 |
| Inscriptions | 10 | UC-INSCRIPTIONS-01 à 10 |
| Notes / Délibérations | 6 | UC-NOTES-01/02, UC-DELIBERATION-01 à 04 |
| Examens | 7 | UC-EXAMENS-01 à 07 |
| Concours | 10 | UC-CONCOURS-01 à 10 |
| Pédagogie | 12 | UC-PEDAGOGIE-01 à 12 |
| Finances | 8 | UC-FINANCES-01 à 08 |
| Auth | 4 | UC-AUTH-01 à 04 |
| Dashboard / Stats / Doc / IA / Admin | 9 | UC-DASHBOARD-01 à 03, UC-STATS-01, UC-DOC-01, UC-IA-01 à 03, UC-ADMIN-01 |
| Modules orphelins | 5 | UC-NOTIF-01, UC-SUPPORT-01/02, UC-SETTINGS-01/02, UC-SCHEDULE-01 |

**Total : environ 84 cas d'utilisation documentés en détail dans la section 5.**

## 8. Interfaces, écrans, onglets et tableaux

Synthèse du nombre d'écrans principaux, formulaires et éléments tabulaires détaillés (fiche complète Route/Composant/Données/Filtres/Boutons/API/Store/Composants enfants) par module en section 5 :

| Module | Écrans principaux documentés | Formulaires documentés | Tableaux/onglets référencés |
|---|---|---|---|
| Structure Académique | 5 (Années, Cycles, Filières, Classes, Semestres) | 6 (un par entité, modals Ajouter/Modifier) | ~20 (4-5 onglets par écran) |
| Scolarité | 5 (Etudiants, DetailEtudiant, DossierView, DossierAcademique, AbscenceView) | 4-5 (dont Import/Export) | ~15 |
| Inscriptions | 1 écran à 8 onglets internes | 4 (Inscription, Réinscription, Validation, ClasseEtudiant) | 8 onglets |
| Notes / Délibérations | 3 (NotesView, EditNotes, deliberation) | 2 (saisie de notes, formulaires de délibération) | ~12 (semestre1/2 × devoir/rappel/session) |
| Examens | 6 (Examens, Planification, PlanExamen, Calendrier, Salles, RapportExamens) | 5 (AddSession, AddCalendrier, AddPlanning, ExamPlanningModal, addPlannification) | ~10 |
| Concours | 3 (Edition, configDetails, RapportConcours) | 2 (AddConcour + formulaires de config) | 8 onglets (config + historique + rapports) |
| Pédagogie | 4 (Enseignants, AttributionCours, CrenauHoraire, ProgrammeCredit) | 4 | ~24 (6 onglets × 4 écrans) |
| Finances | 3 (Paiements, Facturation, RapportFinances) | 4 (PaiementForm, FacturationForm ×2) | ~15 |
| Transverse (10 sous-modules) | 11 | ~10 (Login/Register principalement) | ~20 |

Le détail complet (route, composant, données affichées/modifiables, filtres, recherche, colonnes, boutons, modals, messages, API, store, composants enfants, remarques de reconstruction) de **chaque** écran est disponible dans la fiche « Interfaces du module » de la section 5 correspondante — il n'est pas dupliqué ici pour éviter la redondance.

## 9. Boutons, actions et comportements utilisateur

Chaque module de la section 5 contient un tableau exhaustif « Boutons et actions » (colonnes : Bouton/Action, Emplacement, Déclencheur, Fonction JS, API appelée, Condition d'affichage, Résultat attendu, Remarque reconstruction). Constat transversal le plus important, vérifié dans **tous** les modules sans exception :

> **Une majorité des boutons d'action critiques (Enregistrer, Valider, Calculer, Proclamer, Attribuer, Configurer, Exporter, Importer) déclenchent un `alert()`, un `console.log()`, ou une simple mutation d'un tableau local en mémoire — sans appel réseau réel — alors que le store et le service API correspondants existent et sont correctement écrits.** Quelques exceptions confirmées comme réellement branchées à une API : CRUD Structure Académique (années/cycles/filières/classes/semestres), planification de sessions d'examen (`sessionStore`), calcul des rangs et proclamation de concours (`resultasContent.vue`), et une partie du CRUD Étudiants/Enseignants.

Ce constat est la donnée la plus critique pour la reconstruction : **le contrat d'API (store + service) est déjà spécifié dans le code existant** même quand il n'est pas branché à l'UI — il doit servir de base au typage des endpoints pour la nouvelle plateforme (voir §12 et §14.9).

## 10. Formulaires et validations

Chaque module de la section 5 documente ses formulaires champ par champ (type, obligatoire, valeur par défaut, validation, source des options), ainsi que le payload envoyé et le comportement après succès/échec. Constats transversaux :
- La validation est majoritairement **HTML native** (`required`, `type="number"`, bornes min/max) ou une validation JavaScript simple inline dans le composant — aucune librairie de validation de formulaire (type VeeValidate, Zod, Yup) n'est utilisée dans le projet.
- Les options de select (filière, classe, cycle, enseignant...) proviennent, selon les écrans, soit d'un store réellement peuplé par API, soit d'un tableau statique codé en dur dans le composant — à vérifier précisément par formulaire dans la section 5.
- Les messages de succès/erreur passent, quand ils sont réels, par `vue3-toastify` via le store `messages/useNotifier.js` / `useErrorHandler.js` — bonne pratique à conserver en reconstruction, y compris pour remplacer les `alert()` restants.

## 11. Données métier et entités manipulées

Entités identifiées dans le code (champs visibles listés en détail dans chaque section 5 correspondante) :

| Entité | Module principal | Autres modules l'utilisant |
|---|---|---|
| Année académique | Structure Académique | Toutes (filtre transversal quasi omniprésent) |
| Cycle | Structure Académique | Pédagogie, Concours |
| Filière | Structure Académique | Scolarité, Pédagogie, Inscriptions |
| Niveau | Structure Académique | Scolarité, Inscriptions |
| Classe | Structure Académique | Scolarité, Notes, Examens, Inscriptions |
| Semestre | Structure Académique | Notes, Examens |
| Module / Matière (UE) | Structure Académique (semestres), Matières | Notes, Pédagogie (attribution) |
| Étudiant | Scolarité | Inscriptions, Notes, Absences, Finances, Examens |
| Dossier scolaire | Scolarité | — |
| Absence | Scolarité | — |
| Candidat | Inscriptions, Concours | — |
| Inscription | Inscriptions | Finances (paiement lié) |
| Évaluation / Session | Notes/Évaluations, Examens | — |
| Note | Notes/Évaluations | Délibération |
| Résultat | Notes/Évaluations, Concours | Délibération |
| Délibération | Notes/Évaluations | — |
| Session d'examen | Examens | — |
| Salle | Examens, Ressources matérielles (fantôme) | — |
| Créneau | Pédagogie, Examens | — |
| Concours / Édition | Concours | — |
| Épreuve | Concours | — |
| Enseignant | Pédagogie | Attribution cours, Créneaux |
| Contrat (enseignant) | Pédagogie | — |
| Attribution / Cours | Pédagogie | — |
| Programme / Crédit ECTS | Pédagogie | — |
| Paiement | Finances | Inscriptions, Dossier scolaire |
| Facture | Finances | — |
| Diplôme | (store existe, module fantôme) | Pédagogie (store) |

Le détail champ par champ de chaque entité, avec sa source (API réelle vs tableau simulé), figure dans la sous-section 13 « Données manipulées » de chaque module en section 5.

## 12. API, stores et intégration backend

### Inventaire des services API (`src/api/`)

| Domaine | Fichier | Modules consommateurs prévus |
|---|---|---|
| Académique | `academique/academiqueApi.js`, `moduleApi.js` | Structure Académique, Notes/Matières |
| Étudiants | `academique/etudiantApi.js` | Scolarité |
| Auth | `auth/authApi.js`, `userApi.js` | Authentification |
| Config transverse | `config/apiClients.js`, `axiosClient.js`, `serviceApi.js` | Tous (client HTTP central) |
| Évaluations | `evaluations/evaluationApi.js`, `notesApi.js`, `resultatApi.js` | Notes/Délibérations, Examens |
| Finances | `finances/financeApi.js` | Finances |
| Gestion | `gestions/gestionApi.js` | Concours |
| Pédagogie | `pedagogies/pedagogieApi.js` | Pédagogie |
| Upload | `uploads/importService.js` | Import Étudiants/Modules |

### Inventaire des stores Pinia (`src/stores/`, 26 fichiers, 8 domaines)

`academiqueStore` (academiqueStore, anneStore, classeStore, cycleStore, filiereStore, inscriptionStore, moduleStore, niveauStore, semestreStore) · `authStore` · `etudiants/etudiantStore` · `evaluationStore` (evalStore, noteStore, resultStore, sessionStore) · `financeStore` (factureStore, financeStore) · `gestionStores` (candidatStore, concourStore) · `messages` (errorStore, messageStore + composables useErrorHandler/useErrorMessage/useNotifier) · `pedagogieStore` (contratStore, diplomeStore, enseignantStore).

### Constat d'intégration réel (vérifié module par module en section 5)

| Statut | Modules concernés |
|---|---|
| **Réellement branché à une API** | Structure Académique (CRUD années/cycles/filières/classes/semestres), Planification des sessions d'examen, Calcul des rangs et proclamation de concours, une partie du CRUD Étudiants/Enseignants |
| **Store/API existants mais non consommés par la vue (orphelins)** | Notes/Évaluations/Délibérations (`useEvaluationStore`, `useNoteStore`, `useResultatStore` non appelés), Finances (`financeStore`, `factureStore`, `financeApi` non importés dans les vues), Pédagogie (`contratStore`, plusieurs endpoints `pedagogieApi` jamais appelés), Concours (`TabDeliberation` simulé), diplomeStore (aucune UI) |
| **Aucun store/API dédié, données 100% en dur** | Dashboard, Statistiques, Assistant IA (moteur de mots-clés, pas d'appel réseau), rapports (examens, concours, finances) |
| **Aucun router guard actif** | Le flag `meta.requiresAuth: true` est déclaré sur le nœud racine des routes protégées, mais **aucun `router.beforeEach` n'existe dans le projet** pour l'exploiter — à confirmer/implémenter en reconstruction |
| **RBAC déclaré mais inactif** | `authStore.js` expose des informations de rôle, mais aucun composant ne les utilise pour conditionner l'affichage (menu, boutons, routes) |

## 13. Modules simulés, incomplets ou à confirmer

### Modules 100% fantômes (menu sans route ni composant)
Bibliothèque, Ressources matérielles (Salles & équipements/Réservation/Disponibilités), Coordination académique (Thèmes & mémoires/Soutenances/Statut étudiant), Diplômes (Demande/Édition/Historique), Courrier & Notes (Courriers/Notes administratives/Archivage), Congés & remplacements (sous-entrée de Pédagogie), lien « résultats-concours » (référencé uniquement dans la logique JS du sidebar). Détail en section 5 (« Modules prévus mais non implémentés »).

### Composants orphelins (code écrit, non routé)
Emploi du temps (`views/schedule/*`), Paramètres (`views/settings/Settings.vue`), Notifications (`views/notifications/notification.vue` — fichier de template vide), Support (`views/support/Support.vue` — imports vers des composants inexistants `FileTable.vue`/`FileUploader.vue`).

### Route sans lien de menu
`/examens` (racine du module Examens), `/documentation`.

### Fichier mort
`src/routes/main.js` (duplicata non importé de `src/routes/index.js`).

### Écrans/onglets fonctionnant sur données 100% simulées (confirmé par lecture de code)
- Dashboard, Statistiques, Assistant IA (moteur if/else sur mots-clés, aucun appel réseau malgré l'usage de `marked` pour le rendu Markdown).
- Notes/Évaluations/Délibérations : `mockStudentsList`, `mockMatieres`, `rawNotes`, `mockClasses`, `mockLogs` ; boutons « Publier le PV », « Délibération », « Proclamer résultats », « Annuler proclamation » sans persistance. Fichiers vides : `devoir-s2.vue`, `rappel-s2.vue`, `session-s2.vue`, `RapportsTab.vue`.
- Finances : toutes les vues (Paiements, Facturation, Rapports) fonctionnent sur données codées en dur ; deux fonctions référencées mais non définies (`openNewFactureModal`, `viewDetails`).
- Pédagogie : les 4 écrans principaux sont des quasi-copier-coller avec `setTimeout(3000)` de chargement factice ; `PresencesContent.vue` est vide et son onglet n'a pas de lien cliquable.
- Concours : `RapportConcours` 100% mocké ; `TabDeliberation` simulé avec un appel de proclamation commenté référençant une méthode de store inexistante.
- Examens : Calendrier, détail de planification, Salles et Rapports fonctionnent sur données codées en dur ou `console.log`/`setTimeout` ; 8 fichiers orphelins jamais importés.
- Scolarité : dossiers scolaires, absences, statistiques et organisation reposent sur des `ref([...])` codés en dur ; export cassé (`XLSX` utilisé sans import) ; bug de store (`filteredEtudiants`, `fetchEtudiantsByClasseFiliereAnnee` inexistants).
- Inscriptions : `Etudiants.vue`, `candidats.vue`, `concours.vue` (onglets) et `ItemActions.vue` sont du code mort ; 4 méthodes/états appelés par les composants n'existent pas dans `inscriptionStore.js`, rendant la réinscription unitaire non fonctionnelle.
- Structure Académique : onglet « UEs » du module Semestre et les deux « Assistants IA » (Cycle/Semestre) sont 100% simulés ; 11 fichiers orphelins confirmés (`views/structure/*`, `views/matieres/**`).
- Administration : `ATable.vue` effectue un `axios.get('')` avec une URL vide (appel cassé) ; `DataTable.vue` orphelin.

### Points à confirmer (récapitulatif transversal)
- Comportement réel du guard d'authentification (aucun `beforeEach` trouvé — à vérifier s'il existe ailleurs ou s'il est réellement absent).
- Contenu exact et intention du store `diplomeStore.js` (aucune UI ne le consomme).
- Rôle exact du store "chapeau" `academiqueStore.js` par rapport aux stores spécialisés (anneStore, cycleStore, etc.).
- Intention réelle derrière `/auth/new-password` qui réutilise `Login.vue` (bug ou temporaire).
- Toute règle métier marquée « à confirmer » dans les sections 15 (Règles métier détectées) de chaque module.

Le détail exhaustif de chaque point ci-dessus (fichier, ligne de code, comportement observé) est disponible dans la sous-section « Points à confirmer » de chaque module en section 5.

## 14. Spécification de reconstruction frontend

Cette section explique comment reconstruire fidèlement la plateforme dans une autre technologie frontend (React, Next.js, Angular, Nuxt, SvelteKit...), en conservant les workflows métier, les modules et la navigation documentés en section 5, tout en corrigeant les intégrations backend manquantes identifiées en section 12-13.

### 14.1 Structure recommandée du nouveau frontend

```
src/
  app/                    # bootstrap, providers globaux (router, store, theme, query client)
  modules/                # un dossier par domaine métier (voir §2)
  components/             # UI kit générique et réutilisable (design system)
  layouts/                # AppLayout, AuthLayout
  routes/                 # définition des routes (ou fichiers de route co-localisés par module selon le framework cible)
  services/               # clients HTTP par domaine (équivalent de src/api actuel)
  stores/                 # ou hooks-or-composables/ selon le framework (state management par domaine)
  hooks-or-composables/   # logique réutilisable (ex. usePagination, useConfirmDialog, useExport)
  types/                  # interfaces TypeScript par entité métier
  utils/                  # exportExcel, exportPDF, formatters, validators
  assets/
  styles/                 # design tokens (couleurs, spacing, typographie)
```

Recommandation : conserver la même logique de séparation « API service ↔ store ↔ vue » que l'existant (elle est cohérente et déjà organisée par domaine), mais migrer vers TypeScript pour typer les entités (Étudiant, Inscription, Note, etc.) dès le départ — le projet actuel est 100% JavaScript non typé.

### 14.2 Découpage par modules

```
modules/
  auth/                     # Login, Register, guard de session
  dashboard/                # Vue d'ensemble, KPIs
  structure-academique/     # Années, cycles, filières, classes, semestres
  scolarite/                # Étudiants, dossiers scolaires, absences
  inscriptions/             # Inscriptions et réinscriptions
  notes-evaluations/        # Notes, évaluations, délibérations
  examens/                  # Planification, calendrier, salles, rapports
  concours/                 # Éditions, configuration, résultats
  pedagogie/                # Enseignants, attribution des cours, créneaux, programmes
  finances/                 # Paiements, facturations, rapports financiers
  statistiques/             # Statistiques transverses
  assistant-ai/             # Assistant conversationnel
  documentation/            # Documentation interne
  administration/           # Services administratifs
  parametres/                # Paramètres (actuellement orphelin — à reconstruire proprement)
```

Pour chaque module, la reconstruction doit produire :
- **Pages** : un composant "liste/racine" + un composant "détail" par entité principale (repérable dans l'existant via le pattern `XxxHeader.vue` + `XxxTab.vue` + `Tab/*Content.vue`).
- **Composants** : réutiliser le découpage Header / Tabs / Tab-Content / Modal / ItemActions déjà présent dans le code existant — c'est un pattern cohérent à travers tout le projet, à conserver tel quel dans la nouvelle techno.
- **Services API** : un service par domaine, miroir de `src/api/<domaine>/*.js`.
- **Stores** : un store par entité principale, miroir de `src/stores/<domaine>Store/*.js`.
- **Types** : une interface par entité listée en §13 de chaque module.
- **Workflows** : respecter scrupuleusement les workflows `WF-*` documentés par module (voir §6 de ce document global).

### 14.3 Système de navigation à reconstruire

- **Sidebar** : menu statique à deux niveaux (racine + sous-menu rétractable), reproduire fidèlement les 19 entrées de premier niveau recensées dans la cartographie (§4 du document global), y compris — de façon volontaire et documentée — les entrées actuellement fantômes (à retirer ou marquer "à venir", voir recommandation en §13 modules fantômes).
- **Icônes** : le projet actuel utilise des classes `mdi-*` (Material Design Icons). Recommandation : migrer vers une lib d'icônes SVG tree-shakable (ex. lucide, heroicons) en conservant la même sémantique par entrée de menu.
- **États actif/inactif** : reproduire la logique `isMenuActive` (correspondance exacte ou préfixe de route) et `isParentActive` (un enfant actif ⇒ parent visuellement actif et replié ouvert) — logique simple et efficace à garder.
- **Routes** : voir tableau détaillé en §7.
- **Breadcrumbs** : **absents du code actuel** (aucun composant Breadcrumb détecté) — à ajouter dans la reconstruction pour améliorer l'orientation (surtout utile sur les pages de détail à 2-3 niveaux comme dossier étudiant, configuration de concours).
- **Navigation vers détails** : cohérente dans tout le projet via des routes dynamiques `:id` (étudiant, dossier, notes, examens, concours) — modèle à reproduire.
- **Pages non accessibles depuis le menu mais accessibles par action** : toutes les routes `:id` (détail étudiant, dossier académique, édition de notes, planification d'examen, configuration de concours) ainsi que `/examens` (racine du module, hors menu) et `/documentation` (hors menu).

### 14.4 Routes à reconstruire

| Route actuelle | Nouvelle route recommandée | Module | Page | Paramètres | Protection | Remarque |
|---|---|---|---|---|---|---|
| `/auth/login` | `/auth/login` | auth | Login | — | Publique | — |
| `/auth/register` | `/auth/register` | auth | Register | — | Publique | — |
| `/auth/new-password` | `/auth/forgot-password` puis `/auth/reset-password` | auth | ResetPassword | token | Publique | Actuellement réutilise Login.vue — à corriger dans la reconstruction |
| `/home`, `/dashboard`, `/` | `/` (unique) | dashboard | Dashboard | — | Protégée | Fusionner les 3 alias en une seule route |
| `/annees-academiques` | `/structure-academique/annees` | structure-academique | AnneesList | — | Protégée | — |
| `/cycles-academiques` | `/structure-academique/cycles` | structure-academique | CyclesList | — | Protégée | — |
| `/filieres-academiques` | `/structure-academique/filieres` | structure-academique | FilieresList | — | Protégée | — |
| `/classes-niveaux` | `/structure-academique/classes` | structure-academique | ClassesList | — | Protégée | — |
| `/semestres` | `/structure-academique/semestres` | structure-academique | SemestresList | — | Protégée | — |
| `/etudiants` | `/scolarite/etudiants` | scolarite | EtudiantsList | — | Protégée | — |
| `/etudiants/:id` | `/scolarite/etudiants/:id` | scolarite | EtudiantDetail | id | Protégée | — |
| `/dossiers-scolaires` | `/scolarite/dossiers` | scolarite | DossiersList | — | Protégée | — |
| `/dossiers-scolaires/:id/global-informations` | `/scolarite/dossiers/:id` | scolarite | DossierDetail | id | Protégée | — |
| `/absences` | `/scolarite/absences` | scolarite | AbsencesList | — | Protégée | — |
| `/inscriptions` | `/inscriptions` | inscriptions | Inscriptions | — | Protégée | — |
| `/notes` | `/notes-evaluations/notes` | notes-evaluations | NotesList | — | Protégée | — |
| `/notes/:classeId/:semestre/:type/edit` | `/notes-evaluations/notes/:classeId/:semestre/:type/edit` | notes-evaluations | NotesEdit | classeId, semestre, type | Protégée | — |
| `/deliberations` | `/notes-evaluations/deliberations` | notes-evaluations | Deliberations | — | Protégée | — |
| `/examens` | `/examens` | examens | ExamensHome | — | Protégée | Ajouter au menu ou retirer la route |
| `/planification-examens` | `/examens/planification` | examens | Planification | — | Protégée | — |
| `/planification-examens/:id/evaluations` | `/examens/planification/:id` | examens | PlanificationDetail | id | Protégée | — |
| `/calendrier-examens` | `/examens/calendrier` | examens | Calendrier | — | Protégée | — |
| `/salles-horaires` | `/examens/salles` | examens | SallesExamens | — | Protégée | — |
| `/rapport-examens` | `/examens/rapports` | examens | RapportsExamens | — | Protégée | — |
| `/edition-concours` | `/concours/editions` | concours | EditionsList | — | Protégée | — |
| `/edition-concours/:id/configurations` | `/concours/editions/:id` | concours | EditionDetail | id | Protégée | — |
| `/rapport-concours` | `/concours/rapports` | concours | RapportsConcours | — | Protégée | — |
| `/enseignants` | `/pedagogie/enseignants` | pedagogie | EnseignantsList | — | Protégée | — |
| `/attribution-cours` | `/pedagogie/attributions` | pedagogie | Attributions | — | Protégée | — |
| `/crenaux-horaires` | `/pedagogie/creneaux` | pedagogie | Creneaux | — | Protégée | — |
| `/programmes-credits` | `/pedagogie/programmes` | pedagogie | Programmes | — | Protégée | — |
| `/paiements-finances` | `/finances/paiements` | finances | Paiements | — | Protégée | — |
| `/factures-finances` | `/finances/facturations` | finances | Facturations | — | Protégée | — |
| `/rapports-financiers` | `/finances/rapports` | finances | RapportsFinances | — | Protégée | — |
| `/statistiques` | `/statistiques` | statistiques | Statistiques | — | Protégée | — |
| `/documentation` | `/documentation` | documentation | Documentation | — | Protégée | Ajouter au menu (actuellement orpheline de menu) |
| `/assistant-ai` | `/assistant-ai` | assistant-ai | AssistantAI | — | Protégée | — |
| `/administration` | `/administration` | administration | Administration | — | Protégée | — |
| *(absent)* `/schedule` | `/emploi-du-temps` | pedagogie ou module dédié | Schedule | — | Protégée | À router réellement ou retirer du menu |
| *(absent)* `/settings` | `/parametres` | parametres | Settings | — | Protégée | À router réellement ou retirer du menu |
| *(absent)* `/notification` | `/notifications` | notifications | Notifications | — | Protégée | À router réellement ou retirer du menu |
| *(absent)* `/bibliotheque`, `/salles`, `/reservation`, `/disponibilites`, `/conges-replacement`, `/themes-memoires`, `/soutenances`, `/statut`, `/demande-diplome`, `/edition-diplome`, `/historique-diplome`, `/courriers`, `/notes-admin`, `/archivage` | — | (modules fantômes) | — | — | Protégée | À spécifier avant reconstruction, ou retirer du menu (voir §13) |
| `/:pathMatch(.*)*` | `*` (catch-all) | système | NotFound | — | Publique | — |

### 14.5 Stores / State management à reconstruire

| Store | Module | État principal (déduit du nom de fichier, contenu exact à confirmer par module) | Actions | API utilisées | Remarque |
|---|---|---|---|---|---|
| academiqueStore | structure-academique | État transverse structure académique | CRUD générique | academiqueApi | Store "chapeau", rôle exact à confirmer |
| anneStore | structure-academique | Années académiques | CRUD années, activation | academiqueApi | — |
| cycleStore | structure-academique | Cycles (L/M/D) | CRUD cycles | academiqueApi | — |
| filiereStore | structure-academique | Filières | CRUD filières | academiqueApi | — |
| classeStore | structure-academique | Classes | CRUD classes | academiqueApi | — |
| niveauStore | structure-academique | Niveaux | CRUD niveaux | academiqueApi | — |
| semestreStore | structure-academique | Semestres | CRUD semestres, activation | academiqueApi | — |
| inscriptionStore | inscriptions | Inscriptions/réinscriptions | Créer, valider, rechercher | academiqueApi ou dédié | À confirmer quel service API il consomme |
| moduleStore | notes-evaluations | Modules/matières | CRUD modules | moduleApi | — |
| authStore | auth | Session utilisateur, token | login, logout, refresh | authApi, userApi | Vérifier persistance (localStorage/cookie) |
| etudiantStore | scolarite | Liste et détail étudiants | CRUD, import/export | etudiantApi | — |
| evalStore | notes-evaluations | Évaluations | CRUD évaluations | evaluationApi | — |
| noteStore | notes-evaluations | Notes par classe/semestre/type | Saisie, édition | notesApi | — |
| resultStore | notes-evaluations | Résultats calculés | Calcul, consultation | resultatApi | — |
| sessionStore | examens / notes-evaluations | Sessions d'examen/évaluation | CRUD sessions | evaluationApi | Utilisé potentiellement par les deux modules — à confirmer |
| factureStore | finances | Factures | CRUD factures | financeApi | — |
| financeStore | finances | Paiements, bilans | CRUD paiements, rapports | financeApi | — |
| candidatStore | concours | Candidats aux concours | CRUD candidats | gestionApi | — |
| concourStore | concours | Éditions de concours | CRUD éditions, configuration | gestionApi | — |
| errorStore | transverse | Erreurs globales | set/clear erreur | — | Utilisé par useErrorHandler |
| messageStore | transverse | Messages/notifications applicatifs | push/consume message | — | Utilisé par useNotifier |
| contratStore | pedagogie | Contrats enseignants | CRUD contrats | pedagogieApi | — |
| diplomeStore | (fantôme) | Diplômes | CRUD diplômes | pedagogieApi (probable) | Aucune UI/route ne le consomme actuellement — à auditer avant réutilisation |
| enseignantStore | pedagogie | Enseignants | CRUD enseignants | pedagogieApi | — |

### 14.6 Services API à reconstruire

| Service | Module | Méthodes (à confirmer précisément par lecture du fichier) | Endpoints | Remarque |
|---|---|---|---|---|
| academiqueApi | structure-academique | CRUD années/cycles/filières/classes/semestres | À confirmer (probable `/api/academique/...`) | — |
| etudiantApi | scolarite | CRUD étudiants, import/export | À confirmer | — |
| moduleApi | notes-evaluations | CRUD modules/matières | À confirmer | — |
| authApi | auth | login, register, refresh, logout | À confirmer | — |
| userApi | auth/transverse | Profil utilisateur | À confirmer | — |
| apiClients.js / axiosClient.js / serviceApi.js | config transverse | Configuration de l'instance Axios (baseURL, intercepteurs, headers auth) | — | Fichier de configuration central à reproduire tel quel (intercepteur de token, gestion des erreurs 401/403) |
| evaluationApi | notes-evaluations / examens | CRUD évaluations/sessions | À confirmer | — |
| notesApi | notes-evaluations | Saisie/édition de notes | À confirmer | — |
| resultatApi | notes-evaluations | Calcul/consultation des résultats | À confirmer | — |
| financeApi | finances | CRUD paiements/factures/rapports | À confirmer | — |
| gestionApi | concours | CRUD éditions/candidats/résultats concours | À confirmer | — |
| pedagogieApi | pedagogie | CRUD enseignants/attributions/créneaux/programmes | À confirmer | — |
| importService.js | transverse (uploads) | Import de fichiers (Excel/CSV) | À confirmer | Utilisé probablement par Étudiants et Modules |

*(Le détail exact des méthodes/endpoints par service est complété dans les sections API de chaque module — ce tableau est la vue consolidée.)*

### 14.7 Priorités de reconstruction

**Priorité 1 — Cœur académique** : authentification, dashboard, structure académique (années/cycles/filières/classes/semestres), étudiants, inscriptions, dossiers scolaires. *(Tous confirmés implémentés dans l'existant.)*

**Priorité 2 — Processus pédagogiques** : enseignants, attribution des cours, créneaux/horaires, programmes/crédits, absences, notes, délibérations. *(Tous confirmés implémentés, sauf "Congés & remplacements" qui est fantôme.)*

**Priorité 3 — Examens et concours** : planification examens, calendrier, salles, rapports examens, concours (éditions, configuration, rapports). *(Tous confirmés implémentés ; le lien "résultats-concours" du menu est à corriger/retirer.)*

**Priorité 4 — Finances et reporting** : paiements, facturations, rapports financiers, statistiques. *(Tous confirmés implémentés.)*

**Priorité 5 — Modules complémentaires** : assistant IA (à auditer : réel vs simulé), documentation (à rattacher au menu), notifications (à router), emploi du temps/schedule (à router), paramètres (à router), administration/services, support (à router ou supprimer), et enfin les modules 100% fantômes (bibliothèque, ressources matérielles, coordination académique, diplômes, courrier & notes) qui nécessitent une spécification métier préalable avant toute reconstruction.

Cette priorisation reflète fidèlement l'état réel du code (ce qui est confirmé fonctionnel vs orphelin vs totalement absent), et non une supposition sur l'importance métier théorique de chaque domaine.

## 15. Recommandations UI/UX modernes

Cette section propose une modernisation de l'expérience utilisateur qui **n'altère pas la logique métier ni les workflows documentés** — elle porte uniquement sur la forme (composants, hiérarchie visuelle, feedback utilisateur, accessibilité).

### 15.1 Design UI/UX moderne recommandé

Le style actuel est un thème d'administration Bootstrap classique (sidebar + topbar, icônes `mdi`, tableaux denses). La reconstruction doit **moderniser la forme sans changer la logique métier ni les workflows** :
- Dashboard avec cartes KPI en en-tête, graphiques (conserver chart.js/echarts ou équivalent du nouveau framework), sections par domaine (académique, scolarité, finances, pédagogie) — reproduisant les onglets `DashCycles/DashOverview/DashPedgie/DashRapport/DashScol` déjà présents.
- Sidebar claire avec groupement identique, indicateur d'état actif net (bordure colorée déjà présente à conserver comme signature visuelle).
- Topbar avec profil utilisateur et notifications (le composant `header.vue` existant est à auditer pour son contenu réel avant reconstruction — voir section transverse).
- Cards statistiques (StatCard) pour les KPI répétés sur presque tous les modules (nombre d'étudiants, taux de présence, montants encaissés, etc.).
- Tables modernes avec tri, pagination, recherche et filtres avancés en remplacement direct de `@bhplugin/vue3-datatable` — conserver les mêmes colonnes/actions par ligne déjà en place.
- Formulaires en modals pour les actions rapides (ajout/édition ponctuelle) et en pages dédiées pour les processus longs (inscription, configuration de concours) — pattern déjà suivi dans l'existant (dossier `modal/` vs `tabs/`), à conserver.
- Onglets lisibles avec compteurs/badges quand pertinent (ex. nombre de candidats, nombre d'étudiants en attente).
- Badges de statut cohérents pour tous les statuts métier détectés (actif/inactif, validé/en attente, payé/impayé, proclamé/non proclamé — liste exacte à consolider depuis les sections "Règles métier" de chaque module).
- Toasts de succès/erreur : le projet utilise déjà `vue3-toastify` + un store `messages/` dédié (`useNotifier.js`, `useErrorHandler.js`) — bonne pratique à conserver dans la nouvelle techno (centraliser la gestion des erreurs API).
- Skeleton loaders : **absents du code actuel** (pas de composant loading détecté au-delà de spinners ponctuels probables) — à ajouter systématiquement sur les tableaux et fiches de détail.
- Empty states : **à ajouter** — nécessaires en particulier pour les modules fantômes/placeholders et les listes vides (aucun état vide dédié détecté dans l'existant).
- Confirmation avant suppression : à vérifier module par module (les `ItemActions.vue` très répandus dans le projet gèrent probablement Modifier/Supprimer/Détails — confirmer la présence d'un `ConfirmDialog` réel ou d'un simple `confirm()` navigateur, à documenter comme point à confirmer par chaque agent module).
- Responsive desktop/tablette : la sidebar actuelle gère déjà un mode mobile "offcanvas" (`sidebar-offcanvas`/`active`) et un mode desktop replié icônes-only (`sidebar-icon-only`) — comportement à reproduire.
- Accessibilité minimale : ajouter les attributs ARIA, contrastes suffisants sur les badges de statut, navigation clavier des menus et modals (non confirmée dans l'existant).
- Hiérarchie visuelle claire : header de page (titre + actions principales) + zone de filtres + contenu — pattern `XxxHeader.vue` déjà cohérent dans tout le projet, à formaliser en composant `PageHeader` générique.

### 15.2 Design system recommandé

| Élément | Recommandation |
|---|---|
| Typographie | Une police sans-serif professionnelle (ex. Inter/System UI), 2-3 tailles maximum par contexte (titre de page, titre de section, corps, légende) |
| Couleurs principales | Un bleu institutionnel proche de l'accent actuel (`#4d83ff` détecté dans `sidebar.vue`) comme couleur de marque, neutres gris pour le fond/texte |
| Couleurs d'état | Succès (vert), Attention (orange/ambre), Erreur (rouge), Info (bleu clair) — à mapper explicitement sur les statuts métier de chaque module (payé/impayé, validé/en attente, présent/absent/retard, proclamé/non proclamé) |
| Spacing | Échelle 4/8px cohérente (4, 8, 12, 16, 24, 32, 48) |
| Cards | Coins arrondis modérés, ombre légère, en-tête + corps + pied optionnel (actions) |
| Boutons | Primaire (action principale : Ajouter/Enregistrer/Valider), secondaire (Annuler/Retour), destructif (Supprimer), fantôme/texte (actions tertiaires : Détails, Exporter) |
| Inputs | Label au-dessus, aide contextuelle, état d'erreur inline, tailles cohérentes avec les selects |
| Selects | Recherche intégrée pour les longues listes (filière, classe, enseignant) — équivalent moderne de `vue-multiselect` déjà utilisé |
| Tables | En-tête sticky, tri par colonne, actions de ligne groupées dans un menu contextuel si > 3 actions, sélection multiple pour les actions groupées (export, suppression) |
| Badges | Forme pilule, couleur mappée au statut, texte court |
| Modals | Taille adaptée au contenu (petite pour confirmation, moyenne pour formulaire, grande pour tableau/liste), fermeture par Échap et clic extérieur |
| Tabs | Soulignement ou fond actif net, compteur optionnel |
| Breadcrumbs | Fil d'Ariane cliquable, à ajouter (absent actuellement) |
| Pagination | Numérotée + boutons précédent/suivant, indicateur du nombre total |
| Notifications | Toast en coin d'écran, auto-dismiss configurable, variantes succès/erreur/info cohérentes avec `useNotifier.js` existant |

Le style doit rester **professionnel, académique et institutionnel** — éviter tout effet décoratif superflu (dégradés forts, animations non fonctionnelles).

### 15.3 Composants UI réutilisables à créer

| Composant | Rôle | Props principales | Events | Modules utilisateurs |
|---|---|---|---|---|
| AppLayout | Structure globale (sidebar + topbar + contenu) | — | — | Tous |
| Sidebar | Menu de navigation principal | `mobileOpen` | `close-sidebar` | Tous |
| Topbar | Barre supérieure (profil, notifications) | `user` | `logout`, `toggle-sidebar` | Tous |
| Breadcrumb | Fil d'Ariane | `items` | — | Pages de détail multi-niveaux |
| DataTable | Tableau générique avec tri/pagination/sélection | `columns`, `rows`, `loading` | `sort`, `page-change`, `row-click`, `selection-change` | Tous les modules à liste |
| FilterBar | Barre de filtres avancés | `filters`, `modelValue` | `update:modelValue`, `reset` | Étudiants, Inscriptions, Finances, Notes, Concours |
| SearchInput | Champ de recherche avec debounce | `modelValue`, `placeholder` | `update:modelValue` | Tous les modules à liste |
| StatusBadge | Badge de statut coloré | `status`, `variant` | — | Inscriptions, Finances, Absences, Concours, Délibérations |
| ActionButton | Bouton d'action avec icône | `icon`, `variant`, `loading` | `click` | Tous |
| ConfirmDialog | Confirmation avant action destructive | `title`, `message`, `open` | `confirm`, `cancel` | Toutes les suppressions |
| FormModal | Modal contenant un formulaire | `open`, `title` | `submit`, `close` | Tous les modules avec Ajouter/Modifier en modal (stracad, concours, examens, finances) |
| Tabs | Système d'onglets générique | `tabs`, `modelValue` | `update:modelValue` | Presque tous les modules (pattern `XxxTab.vue` omniprésent) |
| StatCard | Carte statistique/KPI | `label`, `value`, `icon`, `trend` | — | Dashboard, Statistiques, tous les onglets "Statistiques" par module |
| PageHeader | En-tête de page avec titre + actions | `title`, `actions` | — | Tous (remplace le pattern `XxxHeader.vue`) |
| EmptyState | État vide illustré | `title`, `description`, `action` | — | Tous les modules fantômes et listes vides |
| LoadingSkeleton | Squelette de chargement | `type` (table/card/text) | — | Tous |
| Pagination | Pagination générique | `page`, `total`, `pageSize` | `update:page` | Tous les modules à liste (remplace `components/shared/Pagination.vue`) |
| ExportButton | Bouton d'export (Excel/PDF/CSV) | `formats`, `onExport` | `export` | Étudiants, Finances, Rapports (examens/concours/finances), Statistiques |
| ImportButton | Bouton d'import avec drag & drop | `accept`, `onImport` | `import`, `error` | Étudiants (ImportEtudiantsContent/DropData), Modules (ModuleImporter) |
| DetailHeader | En-tête de fiche détail | `title`, `subtitle`, `avatar`, `actions` | — | Détail étudiant, dossier académique, détail enseignant |
| StudentProfileCard | Carte de profil étudiant | `student` | — | Dossier scolaire, détail étudiant |
| AcademicRecordTabs | Onglets de parcours académique | `studentId` | — | Dossier scolaire (ParcoursAcademique, AssiduiteDiscipline, SituationFinanciere, DocumentsArchives) |
| PaymentSummaryCard | Résumé de situation financière | `studentId` ou `payments` | — | Finances, Dossier scolaire |
| ExamRoomDistributionTable | Répartition des candidats/étudiants par salle | `sessionId` | — | Examens (Salles), Concours (épreuves) |


## 16. Checklist de reconstruction

Checklist exploitable par un agent IA ou une équipe de développement pour piloter la reconstruction, dans l'ordre de priorité recommandé en §14.7 :

- [ ] Mettre en place l'authentification (Login/Register) et **implémenter réellement le guard de route** (`beforeEach`) — absent dans l'existant malgré `meta.requiresAuth`.
- [ ] Reconstruire le layout global (Sidebar + Topbar + zone de contenu) avec la cartographie de menu de la §4, en décidant explicitement du sort de chaque entrée fantôme (retirer ou placeholder "à venir" — voir §13).
- [ ] Reconstruire le Dashboard avec de vraies données API (actuellement 100% mocké).
- [ ] Reconstruire le module Structure Académique en réutilisant le contrat d'API déjà réel (`academiqueApi.js`) comme référence d'endpoints.
- [ ] Reconstruire Scolarité (Étudiants, Dossiers, Absences) en branchant réellement `etudiantStore`/`etudiantApi` à toutes les vues, en corrigeant les bugs de store relevés en §13.
- [ ] Reconstruire Inscriptions en complétant les méthodes de store manquantes identifiées en §13 (réinscription unitaire).
- [ ] Reconstruire Pédagogie (Enseignants, Attribution, Créneaux, Programmes) en branchant réellement les stores/API déjà écrits mais orphelins.
- [ ] Reconstruire Notes/Évaluations/Délibérations en remplaçant les données `mock*` par de vrais appels aux stores `evalStore`/`noteStore`/`resultStore` déjà écrits.
- [ ] Reconstruire Examens (Planification, Calendrier, Salles, Rapports) en généralisant le branchement API déjà réel sur la Planification aux autres écrans.
- [ ] Reconstruire Concours (Éditions, Configuration, Rapports) en corrigeant les appels de méthodes de store inexistantes relevés en §13 et en branchant `TabDeliberation`/`RapportConcours`.
- [ ] Reconstruire Finances (Paiements, Facturation, Rapports) en branchant réellement `financeStore`/`factureStore`/`financeApi`, actuellement 100% orphelins.
- [ ] Reconstruire Statistiques avec agrégation réelle des données des autres modules.
- [ ] Décider du sort des modules orphelins routables (Emploi du temps, Paramètres, Notifications) : réintégrer au routeur ou reconstruire proprement.
- [ ] Statuer sur Support (imports cassés) et sur les modules 100% fantômes (§13) avant toute reconstruction — ne rien inventer sans validation métier.
- [ ] Mettre en place le design system (§15.2) et les composants UI réutilisables (§15.3) avant d'attaquer les écrans, pour garantir la cohérence visuelle dès le départ.
- [ ] Ajouter les éléments UX absents de l'existant : breadcrumbs, empty states, skeleton loaders, confirmation de suppression systématique (§15.1).
- [ ] Auditer et migrer le contenu du store orphelin `diplomeStore.js` avant de statuer sur le module Diplômes.

### Checklist finale obligatoire

| Élément | Statut | Remarque |
|---|---|---|
| Menus analysés | Oui | 19 entrées de 1er niveau, cartographie complète en §4 |
| Sous-menus analysés | Oui | Tous les sous-menus des 10 groupes rétractables, §4 |
| Routes analysées | Oui | Toutes les routes de `src/routes/*.routes.js` croisées avec le sidebar |
| Pages analysées | Oui | 278 fichiers `.vue` couverts par les 9 analyses de module + synthèse transverse |
| Modules métier analysés | Oui | 8 modules métier réels + 10 sous-modules transverses + modules fantômes, §5 |
| Workflows documentés | Oui | 25 workflows `WF-*` détaillés étape par étape, §5-6 |
| Cas d'utilisation documentés | Oui | ~84 cas d'utilisation `UC-*` détaillés, §5-7 |
| Boutons documentés | Oui | Tableau exhaustif par écran dans chaque module, §5, synthèse §9 |
| Onglets documentés | Oui | Tableau par écran dans chaque module, §5, synthèse §8 |
| Tableaux documentés | Oui | Tableau par écran dans chaque module, §5, synthèse §8 |
| Formulaires documentés | Oui | Champ par champ dans chaque module, §5, synthèse §10 |
| API documentées | Oui | 15 services inventoriés et croisés avec leur usage réel, §12 |
| Stores documentés | Oui | 26 stores inventoriés et croisés avec leur usage réel, §12 |
| Données mockées identifiées | Oui | Détaillées module par module, synthèse §13 |
| Modules incomplets identifiés | Oui | Modules fantômes, composants orphelins, routes sans menu, code mort — §13 |
| Spécification de reconstruction produite | Oui | §14 (structure, modules, navigation, routes, stores, services, priorités) |
| Recommandations UI/UX produites | Oui | §15 (principes UX, design system, composants réutilisables) |
