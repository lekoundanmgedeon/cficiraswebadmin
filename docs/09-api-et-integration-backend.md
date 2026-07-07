# 09 - API et intégration backend

## Services API détectés

### `src/api/config/axiosClient.js`
- Crée un client Axios commun.
- Préfixe `baseURL` avec `VITE_API_URL` et `/api`.
- Injecte le token JWT depuis `localStorage` dans `Authorization`.
- Gère le `Content-Type` pour `FormData`.

### `src/api/config/serviceApi.js`
- Wrappe Axios avec les méthodes : `get`, `post`, `put`, `patch`, `delete`.
- Propagation des erreurs au composant.

### `src/api/config/apiClients.js`
- `authApi` -> `/api/auth`
- `academiqueApi` -> `/api/academique`
- `gestionApi` -> `/api/gestion`
- `pedagogieApi` -> `/api/pedagogie`
- `financeApi` -> `/api/finance`
- `evaluationApi` -> `/api/evaluations`
- `gestionFormApi` / `academiqueFormApi` : clients sans header JSON pour les imports.

## Endpoints principaux

### Authentification
| Endpoint | Méthode | Usage |
| --- | --- | --- |
| `/api/auth/login` | POST | Connexion |
| `/api/auth/logout` | POST | Déconnexion |
| `/api/auth/user` | GET | Récupérer le profil courant |
| `/api/auth/signup` | POST | Inscription |

### Académique
| Endpoint | Méthode | Usage |
| --- | --- | --- |
| `/api/academique/annees` | GET | Liste des années |
| `/api/academique/annees/{id}` | GET | Détail année |
| `/api/academique/annees/{id}/stats` | GET | Statistiques d’année |
| `/api/academique/annees/{id}/activate` | PATCH | Activer une année |
| `/api/academique/annees` | POST | Créer une année |
| `/api/academique/annees/{id}` | PUT | Modifier une année |
| `/api/academique/annees/{id}` | DELETE | Supprimer une année |
| `/api/academique/classes` | GET | Liste des classes |
| `/api/academique/classes/{id}` | GET | Détail classe |
| `/api/academique/classes/stats/organisations` | GET | Organisation classe |
| `/api/academique/classes/analytics/dashboard-global` | GET | KPI global |
| `/api/academique/classes/niveau/{id}` | GET | Classes par niveau |
| `/api/academique/classes/filiere/{id}` | GET | Classes par filière |
| `/api/academique/classes/{id}/etudiants` | GET | Étudiants d’une classe |
| `/api/academique/classes/{id}/modules` | GET | Modules d’une classe |
| `/api/academique/classes/{id}/assigner-module` | POST | Assigner module |
| `/api/academique/classes/{id}/taux-remplissage` | GET | Taux de remplissage |
| `/api/academique/classes` | POST | Créer une classe |
| `/api/academique/classes/{id}` | PUT | Modifier une classe |
| `/api/academique/classes/{id}` | DELETE | Supprimer une classe |
| `/api/academique/cycles` | GET | Liste des cycles |
| `/api/academique/cycles/{id}` | GET | Détail cycle |
| `/api/academique/cycles/{id}/filieres` | GET | Filières d’un cycle |
| `/api/academique/cycles/stats/distribution` | GET | Stats distribution |
| `/api/academique/cycles/stats/organisations/` | GET | Organisation des cycles |
| `/api/academique/cycles` | POST | Créer un cycle |
| `/api/academique/cycles/{id}` | PUT | Modifier un cycle |
| `/api/academique/cycles/{id}` | DELETE | Supprimer un cycle |
| `/api/academique/filieres` | GET | Liste des filières |
| `/api/academique/filieres/{id}` | GET | Détail filière |
| `/api/academique/filieres/stats/organisations` | GET | Organisation des filières |
| `/api/academique/filieres/cycle/{id}` | GET | Filières par cycle |
| `/api/academique/filieres/{id}/stats` | GET | Stats filière |
| `/api/academique/filieres` | POST | Créer une filière |
| `/api/academique/filieres/{id}` | PUT | Modifier une filière |
| `/api/academique/filieres/{id}` | DELETE | Supprimer une filière |
| `/api/academique/niveaux` | GET | Liste des niveaux |
| `/api/academique/niveaux/{id}` | GET | Détail niveau |
| `/api/academique/niveaux/filiere/{id}` | GET | Niveaux par filière |
| `/api/academique/niveaux/{id}/effectifs` | GET | Effectifs niveau |
| `/api/academique/niveaux` | POST | Créer un niveau |
| `/api/academique/niveaux/{id}` | PUT | Modifier un niveau |
| `/api/academique/niveaux/{id}` | DELETE | Supprimer un niveau |
| `/api/academique/semestres` | GET | Liste des semestres |
| `/api/academique/semestres/{id}` | GET | Détail semestre |
| `/api/academique/semestres/courants/actifs` | GET | Semestres actifs |
| `/api/academique/semestres/annee/{id}` | GET | Semestres par année |
| `/api/academique/semestres/stats/organisations` | GET | Organisation des semestres |
| `/api/academique/semestres/analytics/dashboard?period={period}` | GET | Analytics semestre |
| `/api/academique/semestres` | POST | Créer un semestre |
| `/api/academique/semestres/{id}` | PUT | Modifier un semestre |
| `/api/academique/semestres/{id}` | DELETE | Supprimer un semestre |
| `/api/academique/semestres/{id}/statut` | PATCH | Changer statut semestre |
| `/api/academique/inscriptions` | GET | Liste des inscriptions |
| `/api/academique/inscriptions/finances` | GET | Suivi financier |
| `/api/academique/inscriptions/{id}` | GET | Détail inscription |
| `/api/academique/inscriptions/import` | POST | Import d’inscriptions |
| `/api/academique/inscriptions` | POST | Créer inscription |
| `/api/academique/inscriptions/{id}` | PUT | Modifier inscription |
| `/api/academique/inscriptions/{id}/statut` | PATCH | Changer statut inscription |
| `/api/academique/imports/etudiants` | POST | Import nouveaux étudiants |
| `/api/academique/imports/reinscriptions` | POST | Import réinscriptions |
| `/api/academique/imports/tuteurs` | POST | Import tuteurs |
| `/api/academique/etudiants/{id}` | GET | Détail étudiant |
| `/api/academique/etudiants` | GET | Recherche étudiants par classe/filière/année |
| `/api/academique/etudiants` | POST | Créer étudiant |
| `/api/academique/etudiants/{id}/parcours` | GET | Parcours académique |

### Évaluations
| Endpoint | Méthode | Usage |
| --- | --- | --- |
| `/api/evaluations/evaluation` | GET | Liste des évaluations |
| `/api/evaluations/evaluation` | POST | Créer évaluation |
| `/api/evaluations/evaluation/{id}` | GET | Détail évaluation |
| `/api/evaluations/evaluation/{id}` | PUT | Modifier évaluation |
| `/api/evaluations/evaluation/{id}` | DELETE | Supprimer évaluation |
| `/api/evaluations/sessions-evaluations/` | GET | Liste des sessions |
| `/api/evaluations/sessions-evaluations/` | POST | Créer session |
| `/api/evaluations/sessions-evaluations/{id}` | GET | Détail session |
| `/api/evaluations/sessions-evaluations/{id}` | PUT | Modifier session |
| `/api/evaluations/sessions-evaluations/{id}` | DELETE | Supprimer session |
| `/api/evaluations/sessions-evaluations/{id}/etat` | PATCH | Changer état session |
| `/api/evaluations/evaluations/{evaluationId}/notes` | GET | Notes par évaluation |
| `/api/evaluations/evaluations/{evaluationId}/notes/publier` | PATCH | Publier notes |
| `/api/evaluations/etudiants/{etudiantId}/notes` | GET | Notes étudiant |
| `/api/evaluations/notes/{id}` | PUT | Modifier note |
| `/api/evaluations/resultats/classes/{classeId}/bulletins` | GET | Bulletins de classe |
| `/api/evaluations/resultats/etudiants/{etudiantId}/bulletins/{semestreId}` | GET | Bulletin étudiant |
| `/api/evaluations/resultats/bulletins/{id}/decision` | PUT | Décision jury |
| `/api/evaluations/resultats/classes/{classeId}/bulletins/publier` | PATCH | Publier bulletins |

### Finances
| Endpoint | Méthode | Usage |
| --- | --- | --- |
| `/api/finance/finances` | GET | Liste des finances |
| `/api/finance/finances/{id}` | GET | Détail finance |
| `/api/finance/finances` | POST | Créer finance |
| `/api/finance/finances/{id}` | PUT | Modifier finance |
| `/api/finance/finances/{id}` | DELETE | Supprimer finance |
| `/api/finance/factures` | GET | Liste des factures |
| `/api/finance/factures/{id}` | GET | Détail facture |
| `/api/finance/factures` | POST | Créer facture |
| `/api/finance/factures/{id}` | PUT | Modifier facture |
| `/api/finance/factures/{id}` | DELETE | Supprimer facture |
| `/api/finance/paiements` | GET | Liste des paiements |
| `/api/finance/paiements/{id}` | GET | Détail paiement |
| `/api/finance/paiements` | POST | Créer paiement |
| `/api/finance/paiements/{id}` | PUT | Modifier paiement |
| `/api/finance/paiements/{id}` | DELETE | Supprimer paiement |
| `/api/finance/frais_inscription` | GET | Liste des frais d’inscription |
| `/api/finance/frais_inscription/{id}` | GET | Détail frais |
| `/api/finance/frais_inscription` | POST | Créer frais |
| `/api/finance/frais_inscription/{id}` | PUT | Modifier frais |
| `/api/finance/frais_inscription/{id}` | DELETE | Supprimer frais |

### Gestion des concours
| Endpoint | Méthode | Usage |
| --- | --- | --- |
| `/api/gestion/concours` | GET | Liste des concours |
| `/api/gestion/concours/{id}` | GET | Détail concours |
| `/api/gestion/concours` | POST | Créer concours |
| `/api/gestion/concours/{id}` | PUT | Modifier concours |
| `/api/gestion/concours/{id}/statut` | PATCH | Changer statut |
| `/api/gestion/concours/{id}` | DELETE | Supprimer concours |
| `/api/gestion/concours/{concoursId}/epreuves` | GET | Epreuves d’un concours |
| `/api/gestion/concours/epreuves/{id}` | GET | Détail épreuve |
| `/api/gestion/concours/epreuves` | POST | Créer épreuve |
| `/api/gestion/concours/epreuves/{id}` | PUT | Modifier épreuve |
| `/api/gestion/concours/epreuves/{id}` | DELETE | Supprimer épreuve |
| `/api/gestion/concours/{id}/moyennes-rangs` | GET | Calculer moyennes/rangs |
| `/api/gestion/concours/{id}/proclamer` | PATCH | Proclamer admissions |
| `/api/gestion/concours/{id}/admis/export` | GET | Exporter liste admis |
| `/api/gestion/candidats` | POST | Créer candidat |
| `/api/gestion/candidats/{id}/pieces` | POST | Ajouter pièce candidat |
| `/api/gestion/candidats/import` | POST | Import candidats |
| `/api/gestion/candidats/import/notes` | POST | Import notes candidats |
| `/api/gestion/candidats/{numTable}/notes` | POST | Ajouter note épreuve |
| `/api/gestion/candidats/concours/{concoursId}` | GET | Candidats par concours |
| `/api/gestion/candidats/{id}` | GET | Détail candidat |

### Pédagogie
| Endpoint | Méthode | Usage |
| --- | --- | --- |
| `/api/pedagogie/enseignant/enseignants` | GET | Liste enseignants |
| `/api/pedagogie/enseignant/enseignants/{id}` | GET | Détail enseignant |
| `/api/pedagogie/enseignant/enseignants` | POST | Créer enseignant |
| `/api/pedagogie/enseignant/enseignants/{id}` | PUT | Modifier enseignant |
| `/api/pedagogie/enseignant/enseignants/{id}` | DELETE | Supprimer enseignant |
| `/api/pedagogie/contrats` | GET | Liste contrats |
| `/api/pedagogie/contrats/{id}` | GET | Détail contrat |
| `/api/pedagogie/contrats` | POST | Créer contrat |
| `/api/pedagogie/contrats/{id}` | PUT | Modifier contrat |
| `/api/pedagogie/contrats/{id}` | DELETE | Supprimer contrat |
| `/api/pedagogie/diplomes` | GET | Liste diplômes |
| `/api/pedagogie/diplomes/{id}` | GET | Détail diplôme |
| `/api/pedagogie/diplomes` | POST | Créer diplôme |
| `/api/pedagogie/diplomes/{id}` | PUT | Modifier diplôme |
| `/api/pedagogie/diplomes/{id}` | DELETE | Supprimer diplôme |
| `/api/pedagogie/modules/{moduleId}/enseignants` | GET | Enseignants par module |
| `/api/pedagogie/modules/{moduleId}/enseignants` | POST | Assigner enseignant module |
| `/api/pedagogie/modules/{moduleId}/enseignants/{enseignantId}` | DELETE | Retirer enseignant module |
| `/api/pedagogie/classes/{classeId}/enseignants` | GET | Enseignants par classe |
| `/api/pedagogie/classes/{classeId}/enseignants` | POST | Assigner enseignant classe |
| `/api/pedagogie/classes/{classeId}/enseignants/{enseignantId}` | DELETE | Retirer enseignant classe |
| `/api/pedagogie/enseignants/{enseignantId}/creneaux` | GET | Créneaux par enseignant |
| `/api/pedagogie/enseignants/{enseignantId}/creneaux` | POST | Assigner créneau enseignant |
| `/api/pedagogie/enseignants/{enseignantId}/creneaux/{creneauId}` | DELETE | Retirer créneau enseignant |

### Import / upload
| Endpoint | Méthode | Usage |
| --- | --- | --- |
| `/api/gestion/candidat/importv2` | POST | Import candidats version v2 |
| `/api/gestion/etudiants/import` | POST | Import d’étudiants |
| `/api/gestion/paiements/upload-justificatif` | POST | Import justificatif paiement |
| `/api/gestion/resultats/import` | POST | Import notes concours |

## Observations

- Le frontend contient des services API robustes qui couvrent un large éventail de parcours métier.
- Certains endpoints sont présents dans le code sans association directe visible à une page.
- Plusieurs pages de scolarité sont encore partiellement simulées : `/etudiants` utilise des données codées en dur et `/absences` ne lance pas d’appel backend visible.
- L’API `src/api/userApi.js` existe mais n’est pas utilisée dans la base de code analysée.
