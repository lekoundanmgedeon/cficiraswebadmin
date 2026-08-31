# Module `scolarite`

> Le dossier scolaire d'un étudiant : identité, tuteurs, parcours académique, situation
> financière, pièces justificatives et leur vérification.

| | |
| --- | --- |
| **Écrans** | 2 (liste, détail) |
| **Domaine backend** | `/api/academique` — **par les routes des étudiants** |
| **Dépendances** | `etudiants` (store et libellés) · `inscriptions` · `finances` (onglet situation financière) · `structure-academique` — **deux cycles passent par ici**, voir [ARCHITECTURE.md](../ARCHITECTURE.md) §2 |

## 1. Écrans et routes

| Chemin | Nom | Titre |
| ------ | --- | ----- |
| `/dossiers-scolaires` | `DossiersScolaires` | Dossiers scolaires |
| `/dossiers-scolaires/:id` | `DossierScolaire` | Dossier scolaire |

L'ancienne route `/dossiers-scolaires/:id/global-informations` se simplifie en
`/dossiers-scolaires/:id`.

### La route `/absences` a disparu

L'écran qu'elle servait était **intégralement simulé** : son `validerFeuilleAppel` construisait un
payload, l'écrivait dans la console, attendait une seconde puis affichait « Fiche d'émargement
enregistrée avec succès ! » — **sans jamais rien envoyer**. Et pour cause : **aucune route
d'absence ou d'assiduité n'existe dans le backend**. Ne pas la reconstruire.

## 2. Onglets du détail

| Onglet | Contenu |
| ------ | ------- |
| Profil | identité, tuteurs (un ou deux — pas de pagination) |
| Parcours académique | une carte par année ; trois périodes au plus, dont les matières sont un détail interne |
| Situation financière | consomme le store des rapports de `finances` |
| Pièces justificatives | dépôt, validation, rejet motivé — paginé |

## 3. Endpoints

Le dossier **n'a pas de ressource à lui** : il est servi par les routes des étudiants, et son
identifiant (`dossier_id`) est porté par l'étudiant.

| Appel | Rôle |
| ----- | ---- |
| `GET /etudiants/:id/complet` | identité + tuteurs + pièces |
| `GET /etudiants/:id/parcours` | parcours académique |
| `POST /etudiants/:dossierId/pieces` | déposer une pièce |
| `PATCH /etudiants/dossiers/:dossierId/pieces/:pieceId` | valider ou rejeter |

⚠️ **Noter l'asymétrie des deux dernières** : le dépôt se fait sur `/etudiants/:dossierId/pieces`
(sans le segment `dossiers`), la vérification sur
`/etudiants/dossiers/:dossierId/pieces/:pieceId` (avec). Ce n'est pas une coquille : c'est ce que
déclare `etudiant.routes.js`.

## 4. Vocabulaire

Relevé sur les contraintes `CHECK` de la base — aucun script de migration ne les versionne :

```sql
-- table dossiers
CHECK (statut_dossier IN ('INCOMPLET','COMPLET','VERIFIE','REJETE'))
-- table pieces_dossier
CHECK (statut     IN ('EN_ATTENTE','VALIDE','REJETE'))
CHECK (type_piece IN ('DIPLOME','ATTESTATION_REUSSITE','ACTE_NAISSANCE','RELEVE_NOTES','AUTRE'))
CHECK (chemin ~ '^/uploads/.*\.(pdf|jpg|jpeg|png)$')
```

| Statut de dossier | Libellé |
| ----------------- | ------- |
| `INCOMPLET` | Incomplet |
| `COMPLET` | Complet |
| `VERIFIE` | Vérifié |
| `REJETE` | Rejeté |

| Statut de pièce | Libellé |
| --------------- | ------- |
| `EN_ATTENTE` | En attente |
| `VALIDE` | Validée |
| `REJETE` | Rejetée |

**Décisions sur une pièce** : `VALIDE` (sans motif) ou `REJETE` (**motif obligatoire**). Le serveur
n'accepte rien d'autre — 400 sinon — et refuse explicitement un rejet sans motif : « Le motif de
rejet est obligatoire pour corriger le dossier. »

## 5. Le dépôt d'une pièce n'est pas un envoi de fichier

`POST /etudiants/:dossierId/pieces` attend un **`chemin`** : une chaîne pointant vers un fichier
**déjà présent sur le serveur**. Il doit respecter `^/uploads/.*\.(pdf|jpg|jpeg|png)$`.

La contrainte est portée par la **base**, pas par le contrôleur : un chemin mal formé remonte en
**erreur SQL brute** (« violates check constraint »), illisible pour l'utilisateur. Le front valide
donc côté client pour ne jamais en arriver là.

## 6. État et règles

Store **non bâti** sur `createCrudStore` : le dossier n'est pas une ressource REST. Il n'a ni
liste, ni création, ni suppression — il **existe déjà** pour chaque étudiant (un `dossier` est créé
avec lui, la jointure est même *inner* dans `GET /etudiants`). On le consulte et on agit sur ses
pièces. Il réimplémente `run` avec le même contrat.

| Membre | Rôle |
| ------ | ---- |
| `dossier`, `parcours` | l'état |
| `pieces`, `tuteurs`, `dossierId`, `piecesEnAttente` | getters dérivés du dossier |
| `fetchDossier`, `fetchParcours`, `addPiece`, `verifyPiece` | actions |

## 7. Pièges à reproduire

1. **L'asymétrie des deux chemins de pièce** (§3).
2. **Le `chemin` doit être validé côté client** — sinon erreur SQL brute.
3. **Motif obligatoire au rejet**, imposé par le serveur.
4. **Pas de route d'absence** : ne pas reconstruire l'écran.
5. L'écran précédent (`views/parcours/`) était **intégralement simulé** : douze fichiers servant
   des tableaux codés en dur, et un étudiant fabriqué après un `setTimeout(800)` imitant une
   latence réseau. Rien à en reprendre.

## 8. Checklist de reconstruction

- [ ] Liste des dossiers, paginée, filtrable par statut
- [ ] Détail à quatre onglets, montage paresseux
- [ ] Onglet situation financière : réutiliser le store des rapports financiers, ne pas le dupliquer
- [ ] Dépôt de pièce : formulaire de **chemin**, validé contre le motif `^/uploads/…`
- [ ] Vérification : `VALIDE` / `REJETE` seulement, motif obligatoire au rejet
- [ ] Pièces et situation financière paginées ; profil et parcours non paginés
- [ ] Le store réimplémente le contrat `run` — pas de fabrique CRUD
