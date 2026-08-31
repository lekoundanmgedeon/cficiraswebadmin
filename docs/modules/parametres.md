# Module `parametres`

> Réglages de la plateforme, comptes, notifications aux étudiants, journaux d'audit — et « Mon
> compte », le seul onglet ouvert à tous.

| | |
| --- | --- |
| **Écrans** | 1, à cinq onglets |
| **Domaine backend** | `/parametres`, `/utilisateurs`, `/notifications`, `/journaux`, `/auth` |
| **Dépendances** | `structure-academique` (année académique, dans l'onglet Réglages) |
| **Dépendants** | `shared/utils/parametres` (par inversion — voir §6) |

## 1. Écran et route

| Chemin | Nom | Titre |
| ------ | --- | ----- |
| `/settings` | `Parametres` | Paramètres |

Chemin et nom sont **inchangés** : ils étaient portés par `modules/plateforme`, le module des
écrans sans backend. Celui-ci en a un désormais (migration `019`).

### Pas de garde de route

Le cloisonnement par rôle se fait **dans l'écran** — seul un ADMIN voit les onglets Comptes,
Réglages, Notifications et Journaux — et surtout **au serveur**, qui refuse ces routes en 403 quel
que soit l'appelant.

Une garde de route ici **fermerait « Mon compte » à tout le monde**, alors qu'il est destiné à tous.

## 2. Onglets

| Onglet | Qui | Contenu |
| ------ | --- | ------- |
| Mon compte | tous | profil, mot de passe |
| Comptes | ADMIN | création, modification, activation, réinitialisation |
| Réglages | ADMIN | les paramètres, groupés par catégorie |
| Notifications | ADMIN | diffusion et purge des messages **aux étudiants** |
| Journaux | ADMIN | audit financier, journal des imports |

## 3. Endpoints

**Trois familles, qui n'ont ni le même préfixe ni les mêmes droits.**

### Réglages — lecture ouverte, écriture ADMIN
| Appel | Rôle |
| ----- | ---- |
| `GET /parametres` | groupés par catégorie |
| `PUT /parametres` | `{ valeurs }` — **une catégorie entière** |

La lecture est ouverte parce que **le nom de l'établissement et la devise s'affichent partout**.

Le **groupement vient du serveur** : c'est lui qui connaît les catégories, et l'écran se contente
de les rendre dans l'ordre reçu. Chaque entrée porte son `libelle`, son `type_valeur` et sa
`description` — **le formulaire s'en déduit, il n'est pas écrit en dur**.

L'enregistrement se fait **en lot et non clé par clé** : le serveur l'applique dans une
transaction, si bien qu'un type refusé au milieu ne laisse pas la moitié des réglages enregistrés.
Une clé absente du catalogue est refusée en 404 — **on ne crée pas de réglage depuis le client**.

### Comptes — tout réservé ADMIN
| Appel | Rôle |
| ----- | ---- |
| `GET /utilisateurs` | `q`, `role`, `actif`, `limite` (défaut 50), `offset` |
| `GET /utilisateurs/roles` | les rôles acceptés, avec le nombre de comptes de chacun |
| `POST /utilisateurs` | |
| `PUT /utilisateurs/:id` | `nom`, `prenom`, `email`, `role` |
| `PATCH /utilisateurs/:id/actif` | active ou désactive |
| `POST /utilisateurs/:id/mot-de-passe` | réinitialisation par l'administrateur |

⚠️ **Il n'existe pas de suppression.** Onze tables désignent un compte pour dire qui a fait quoi, et
l'effacer laisserait ces actes **sans auteur**. Un compte désactivé perd la main immédiatement — à
la connexion comme sur ses jetons en cours.

La réinitialisation **n'exige pas l'ancien mot de passe, et ne peut pas l'exiger** :
l'administrateur ne le connaît pas. À distinguer du changement par l'utilisateur lui-même.

### Son propre compte — sans condition de rôle
| Appel | Rôle |
| ----- | ---- |
| `PUT /auth/profil` | `nom`, `prenom`, `email` |
| `PUT /auth/mot-de-passe` | `{ ancien, nouveau }` |

**L'identifiant n'y transite pas** : ces routes agissent toujours sur la session, elles ne peuvent
donc pas viser quelqu'un d'autre.

⚠️ Ni `username` ni `role` ne sont modifiables : le premier identifie le compte dans onze tables
métier, le second est une décision d'administration.

L'ancien mot de passe est **exigé même si la session est valide**.

### Notifications — **des messages aux étudiants**
| Appel | Rôle |
| ----- | ---- |
| `GET /notifications` | `q`, `type`, `lu`, `classe`, `limite` (défaut 100), `offset` |
| `GET /notifications/statistiques` | répartition par type et par état de lecture |
| `GET /notifications/destinataires` | **compte les destinataires sans rien écrire** |
| `POST /notifications` | diffuse |
| `DELETE /notifications/:id` | |
| `POST /notifications/purge` | `{ jours? }` |

⚠️ **`notifications.etudiant_id` est `NOT NULL`** : ce sont des messages **aux étudiants**, pas des
notifications d'interface pour les agents. L'écran les **administre** ; il ne les reçoit pas. Une
ligne par destinataire — c'est ce qu'impose la colonne.

**Compter avant de diffuser n'est pas un confort** : « à tous » vaut **893 lignes** sur le jeu de
démonstration, et l'annoncer avant d'écrire est la seule façon d'éviter un envoi massif fait par
erreur.

La purge ne touche **que les notifications lues** et plus anciennes que la rétention réglée. Les
non lues ne partent jamais, quel que soit leur âge : les supprimer priverait l'étudiant d'un
message qu'il n'a pas vu.

### Journaux — lecture seule
| Appel | Rôle |
| ----- | ---- |
| `GET /journaux/audit-financier` | `limite` défaut 50 |
| `GET /journaux/audit-financier/resume` | |
| `GET /journaux/imports` | `limite` défaut 50 |

**Un journal modifiable depuis l'interface qu'il surveille ne prouve plus rien.**

## 4. Vocabulaire

### Les huit rôles — miroir de `users_role_check`

⚠️ `espace-notes` définit déjà un tableau `ROLES`, mais **cinq rôles seulement**, ceux du circuit
de validation des notes. La gestion des comptes en couvre **huit**. Reprendre la liste partielle
laisserait trois rôles sans libellé — et, pire, **absents du menu de création d'un compte**.

Voir la table complète dans [auth-et-session](./auth-et-session.md) §6.

### Catégories de réglages

Les clés viennent du serveur (colonne `categorie` de `parametres_plateforme`) ; le front ne fait
que les **habiller**, et **une catégorie ajoutée en base s'affiche avec son propre nom plutôt que de
disparaître**.

| Clé | Libellé | Ce qu'elle règle |
| --- | ------- | ---------------- |
| `etablissement` | Établissement | repris en en-tête de tous les documents et exports PDF |
| `finances` | Finances | devise appliquée à tous les montants affichés |
| `scolarite` | Scolarité | seuils et volumes de la maquette |
| `notifications` | Notifications | conservation des messages aux étudiants |

### Mot de passe
Longueur minimale **8** — miroir du contrôle serveur.

## 5. État et règles

Un seul store pour cinq onglets : ils ne partagent que leur écran, mais **tous passent par le même
contrat `run()`**.

| Membre | Rôle |
| ------ | ---- |
| `categories`, `utilisateurs`, `totalUtilisateurs`, `roles` | l'état |
| `recherche`, `filtreRole`, `filtreActif` | les filtres de la liste des comptes |
| `chargementParametres`, `chargementUtilisateurs`, `enregistrement` | trois drapeaux distincts |
| `valeurs`, `parametresDe(categorie)` | dérivés |

## 6. L'inversion de dépendance

`shared/utils/exportPDF.js` et le formatage des montants ont besoin des réglages, et vivent dans
`shared/` — qui **ne peut pas importer un module** (règle `modules → shared → core`).

D'où l'inversion : `shared/utils/parametres.js` **détient** les valeurs, et ce store les y
**dépose** (`appliquerParametres()`) après chaque lecture **et après chaque écriture**.

⚠️ **Sans le second appel**, changer le symbole de la devise n'aurait d'effet qu'au rechargement de
la page — ce qui se lit comme un **enregistrement raté**.

Les valeurs de repli sont alignées sur le semis de la migration `019` : un montant s'affiche au
premier rendu, parfois avant que `GET /parametres` soit revenu. **L'affichage est donc juste dès la
première frame**, et se corrige tout seul si l'établissement a changé ses réglages.

## 7. Pièges à reproduire

1. **Pas de garde de route** : le cloisonnement est dans l'écran et au serveur.
2. **Pas de suppression de compte** — désactivation.
3. **Compter les destinataires avant toute diffusion.**
4. **La purge épargne les non lues.**
5. **Enregistrer une catégorie entière**, en une transaction.
6. **Le formulaire de réglages se déduit du serveur** (`type_valeur`, `libelle`, `description`).
7. **Redéposer les réglages après écriture**, pas seulement après lecture.
8. **Huit rôles**, pas cinq.
9. **Les journaux sont en lecture seule.**

## 8. Checklist de reconstruction

- [ ] Cinq onglets, dont un seul ouvert à tous
- [ ] Réglages : rendu dérivé du catalogue serveur, enregistrement par catégorie
- [ ] Dépôt des réglages dans le socle partagé, après lecture **et** écriture
- [ ] Comptes : recherche, filtres, création, modification, activation, réinitialisation
- [ ] Mon compte : profil (sans `username` ni `role`) et mot de passe (ancien exigé)
- [ ] Notifications : comptage préalable des destinataires, diffusion, purge des lues
- [ ] Journaux en lecture seule, paginés
