# 04 - Cartographie des menus

## Menus réels dans la sidebar

Le menu principal est défini dans `src/components/partials/sidebar.vue`.

### Menu principal et sous-menus détectés

| Menu principal | Sous-menu | Route | Composant associé | Objectif | Statut dans le routeur |
| --- | --- | --- | --- | --- | --- |
| Tableau de Bord | | `/home` | `@/views/dashboard/Dashboard.vue` | Page d’accueil | Oui |
| Structure Académique | Années académiques | `/annees-academiques` | `@/views/stracad/anneeac/AnneeAcademique.vue` | Gestion des années | Oui |
|  | Cycles | `/cycles-academiques` | `@/views/stracad/cycles/Cycle.vue` | Gestion des cycles | Oui |
|  | Filières | `/filieres-academiques` | `@/views/stracad/filieres/Filiere.vue` | Gestion des filières | Oui |
|  | Classes | `/classes-niveaux` | `@/views/stracad/classes/Classes.vue` | Gestion des classes et niveaux | Oui |
|  | Semestres | `/semestres` | `@/views/stracad/semestres/Semestre.vue` | Gestion des semestres | Oui |
| Scolarité | Gestion des étudiants | `/etudiants` | `@/views/etudiants/Etudiants.vue` | Liste des étudiants | Oui |
|  | Dossiers scolaires | `/dossiers-scolaires` | `@/views/parcours/DossierView.vue` | Dossiers académiques | Oui |
|  | Absences & Présences | `/absences` | `@/views/absence/AbscenceView.vue` | Absences | Oui |
|  | Évaluations & Notes | `/notes` | `@/views/notes/NotesView.vue` | Notes et évaluations | Oui |
|  | Délibérations | `/deliberations` | `@/views/deliberation/deliberation.vue` | Délibérations | Oui |
| Examens | Planification | `/planification-examens` | `@/views/examens/planification/Planification.vue` | Planification d’examens | Oui |
|  | Calendrier | `/calendrier-examens` | `@/views/examens/calendrier/Calendrier.vue` | Calendrier des examens | Oui |
|  | Salles & horaires | `/salles-horaires` | `@/views/examens/salles/Salles.vue` | Planification des salles | Oui |
|  | Rapports | `/rapport-examens` | `@/views/examens/rapports/RapportExamens.vue` | Rapports examen | Oui |
| Concours | Éditions | `/edition-concours` | `@/views/concours/editions/Edition.vue` | Edition des concours | Oui |
|  | Rapports | `/rapport-concours` | `@/views/concours/resultats/RapportConcours.vue` | Rapports concours | Oui |
| Inscriptions | | `/inscriptions` | `@/views/inscriptions/Inscription.vue` | Gestion des inscriptions | Oui |
| Affaires pédagogiques | Enseignants | `/enseignants` | `@/views/pedagogies/formateurs/Enseignants.vue` | Gestion des formateurs | Oui |
|  | Attribution des cours | `/attribution-cours` | `@/views/pedagogies/attributions/AttributionCours.vue` | Attribution cours | Oui |
|  | Creneaux / Horaires | `/crenaux-horaires` | `@/views/pedagogies/crenaux/CrenauHoraire.vue` | Gestion des créneaux | Oui |
|  | Programmes / Crédits | `/programmes-credits` | `@/views/pedagogies/programme/ProgrammeCredit.vue` | Programmes et crédits | Oui |
| Finances | Paiements & reçus | `/paiements-finances` | `@/views/finances/paiements/Paiements.vue` | Paiements | Oui |
|  | Facturations | `/factures-finances` | `@/views/finances/facturations/Facturation.vue` | Factures | Oui |
|  | Rapports | `/rapports-financiers` | `@/views/finances/rapports/RapportFinances.vue` | Rapports financiers | Oui |
| Services | | `/administration` | `@/views/admin/Administration.vue` | Services généraux | Oui |
| Coordination académique | | `/themes-memoires` | - | Thèmes/Mémoires | Non défini dans le routeur |
|  | Soutenances | `/soutenances` | - | Soutenances | Non défini dans le routeur |
|  | Statut étudiant | `/statut` | - | Statut étudiant | Non défini dans le routeur |
| Diplômes | | `/demande-diplome` | - | Demande diplôme | Non défini dans le routeur |
|  | Édition & certification | `/edition-diplome` | - | Edition diplôme | Non défini dans le routeur |
|  | Historique | `/historique-diplome` | - | Historique diplômes | Non défini dans le routeur |
| Courrier & Notes | Courriers | `/courriers` | - | Courriers | Non défini dans le routeur |
|  | Notes administratives | `/notes-admin` | - | Notes administratives | Non défini dans le routeur |
|  | Archivage | `/archivage` | - | Archivage | Non défini dans le routeur |
| Notifications | | `/notification` | - | Notifications | Non défini dans le routeur |
| Assistant AI | | `/assistant-ai` | `@/views/prompt/AssistantAi.vue` | Assistant AI | Oui |
| Statistiques | | `/statistiques` | `@/views/stats/Statistiques.vue` | Statistiques | Oui |
| Documentation | | `/documentation` | `@/views/docf/Document.vue` | Documentation interne | Oui |
| Paramètres | | `/settings` | - | Paramètres | Non défini dans le routeur |

## Routes distinctes non liées au menu principal

| Route | Composant | Commentaire |
| --- | --- | --- |
| `/etudiants/:id` | `@/views/etudiants/components/details/DetailEtudiant.vue` | Détail étudiant |
| `/dossiers-scolaires/:id/global-informations` | `@/views/parcours/DossierAcademique.vue` | Détail dossier scolaire |
| `/planification-examens/:id/evaluations` | `@/views/examens/planification/components/tabs/PlanExamen.vue` | Détail planification examen |
| `/notes/:classeId/:semestre/:type/edit` | `@/views/notes/components/EditNotes.vue` | Edition de notes |

## Observations

- Le menu sidebar est plus large que les routes réellement définies.
- Plusieurs entrées de menu ne correspondent à aucune route actuellement chargée par le routeur.
- Certaines pages sont accessibles uniquement via le routeur, sans lien direct dans le menu.
