# 08 - Cas d’utilisation

## UC-01 : Connexion de l’utilisateur

Acteur principal : Utilisateur authentifié
Objectif : Authentifier un utilisateur via email/username et mot de passe.
Préconditions : L’utilisateur possède un compte.
Déclencheur : Page `/auth/login` ouverte.
Scénario nominal :
1. Saisie des identifiants.
2. Appel à `authStore.loginUser()`.
3. Réponse `success` reçue.
4. Token stocké localement.
5. Redirection vers `/dashboard`.
Exceptions : identifiants invalides, erreur réseau.
Postconditions : session ouverte, token stocké.
API concernée : `POST /api/auth/login`

## UC-02 : Gestion des années académiques

Acteur principal : Administrateur académique
Objectif : Créer ou modifier une année académique.
Préconditions : Accès à `/annees-academiques`.
Déclencheur : Clic sur `+ Ajouter un nouveau` ou édition.
Scénario nominal :
1. Saisie des données de l’année.
2. Appel à `createAnneeAcademique` ou `updateAnneeAcademique`.
3. Rafraîchissement de la liste.
Exceptions : données invalides, erreur serveur.
Postconditions : année académiques sauvegardée.
API concernée : `POST /api/academique/annees`, `PUT /api/academique/annees/{id}`

## UC-03 : Consultation de la liste des étudiants

Acteur principal : Agent de scolarité
Objectif : Afficher puis filtrer les étudiants.
Préconditions : Accès à `/etudiants`.
Déclencheur : Ouverture de la page.
Scénario nominal :
1. Chargement des données.
2. Application des filtres annexe/filière/niveau/classe.
3. Affichage de la table.
Exceptions : aucune donnée, erreur de chargement.
Postconditions : liste filtrée visible.
API concernée : utilisation prévue de `getEtudiantsByClasseFiliereAnnee`, mais page actuelle simule les données.

## UC-04 : Consultation du dossier scolaire d’un étudiant

Acteur principal : Agent de scolarité
Objectif : Voir le parcours d’un étudiant.
Préconditions : Étudiant sélectionné.
Déclencheur : Clic sur `Détails` dans la liste.
Scénario nominal :
1. Navigation vers `/dossiers-scolaires/{id}/global-informations`.
2. Affichage du dossier académique.
Exceptions : étudiant non trouvé.
Postconditions : dossier visible.
API concernée : potentiellement `getParcoursAcademique(id)`.

## UC-05 : Chargement des sessions d’examen

Acteur principal : Responsable des examens
Objectif : Consulter les sessions d’examen planifiées.
Préconditions : Accès à `/planification-examens`.
Déclencheur : Ouverture de la page.
Scénario nominal :
1. Appel à `sessionStore.fetchSessions()`.
2. Affichage de la liste de sessions.
Exceptions : erreur API.
Postconditions : sessions affichées.
API concernée : `GET /api/evaluations/sessions-evaluations/`

## UC-06 : Répartition des salles d’examen

Acteur principal : Responsable logistique
Objectif : Calculer et exporter une répartition de salles.
Préconditions : Fichiers importés.
Déclencheur : Clic sur `Lancer la Répartition Automatique`.
Scénario nominal :
1. Import des fichiers Excel/CSV.
2. Traitement côté frontend.
3. Répartition selon les paramètres.
4. Export du résultat.
Exceptions : trop d’étudiants pour la capacité.
Postconditions : tableau de répartition généré.
API concernée : aucun endpoint backend utilisé dans la page actuelle.

## UC-07 : Gestion d’un concours

Acteur principal : Gestionnaire concours
Objectif : Créer ou éditer un concours et proposer des résultats.
Préconditions : Accès à `/edition-concours`.
Déclencheur : Création ou édition d’un concours.
Scénario nominal :
1. Appel à `fetchConcours()`.
2. Création / modification via `addConcours` / `editConcours`.
3. Chargement des candidatures et épreuves.
Exceptions : erreur de validation.
Postconditions : concours sauvegardé.
API concernée : `GET /api/gestion/concours`, `POST /api/gestion/concours`

## UC-08 : Suivi financier des inscriptions

Acteur principal : Responsable des inscriptions
Objectif : Consulter le suivi financier des inscriptions.
Préconditions : Accès à `/inscriptions`.
Déclencheur : Ouverture de la page.
Scénario nominal :
1. Appel à `fetchInscriptionsFinances()`.
2. Affichage des totaux associés.
Exceptions : erreur serveur.
Postconditions : données financières disponibles.
API concernée : `GET /api/academique/inscriptions/finances`
