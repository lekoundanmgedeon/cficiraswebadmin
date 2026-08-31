# Module `inscriptions`

> Les dossiers d'inscription et de réinscription : dépôt, validation, capacité des classes, frais.
> **C'est aussi la seule source de listing complet des étudiants** — d'où la dépendance
> `etudiants → inscriptions`.

| | |
| --- | --- |
| **Écrans** | 1, à cinq onglets |
| **Domaine backend** | `/api/academique` |
| **Dépendances** | `structure-academique` (filtres, capacité des classes) |
| **Dépendants** | `etudiants` |

## 1. Écran et route

| Chemin | Nom | Titre |
| ------ | --- | ----- |
| `/inscriptions` | `Inscriptions` | Inscriptions |

## 2. Onglets

| Onglet | Contenu |
| ------ | ------- |
| Inscriptions | la liste, filtrable par année, classe et statut ; validation ou rejet d'un dossier |
| Capacité des classes | effectif contre capacité ; modale des étudiants d'une classe |
| Réinscriptions | import par lot des réinscriptions |
| Frais & paiements | `GET /inscriptions/finances` — **autre dialecte**, voir §5 |
| Rapports & stats | total, en attente, total collecté, taux de recouvrement |

Modales : détail d'une inscription · paiement · réinscription · import (inscriptions et
réinscriptions) · étudiants d'une classe.

## 3. Endpoints

| Appel | Rôle |
| ----- | ---- |
| `GET /inscriptions` | filtres `annee_academique_id`, `classe_id`, `statut` |
| `GET /inscriptions/:id` | détail |
| `POST /inscriptions` | création |
| `PUT /inscriptions/:id` | mise à jour |
| `GET /inscriptions/finances` | `{ totals: { total_collecte, total_attente }, inscriptions: [...] }` |
| `PATCH /inscriptions/:id/statut` | `{ statut, commentaire? }` |
| `POST /inscriptions/import` | import par lot — champ **`fichier`** + `code_annee` |
| `POST /inscriptions/import-reinscription` | réinscriptions — champ **`fichier`** + `code_annee` |

**`DELETE /inscriptions/:id` n'existe pas.** L'ancien formulaire appelait pourtant
`store.removeInscription(id)` depuis un bouton « Supprimer » — une action absente du store *et* du
serveur. La sortie d'un dossier passe par un changement de statut (`REJETEE`, `ABANDON`), ce qui
préserve la traçabilité.

> Deux endpoints font l'import de réinscriptions : `POST /inscriptions/import-reinscription`
> (champ `fichier`) et `POST /academique/imports/reinscriptions` (champ `file`). Le premier est
> retenu : il vit avec la ressource, accepte `code_annee`, et suit la même convention que l'import
> d'inscriptions.

## 4. Vocabulaire

### Statuts d'inscription
Liste que le backend accepte en écriture (`inscription.controller.js → statutsValides`) :

| Code | Libellé | Variante |
| ---- | ------- | -------- |
| `EN_ATTENTE` | En attente | warning |
| `VALIDEE` | Validée | success |
| `ACTIVE` | Active | success |
| `REJETEE` | Rejetée | danger |
| `ABANDON` | Abandon | danger |
| `DIPLOME` | Diplômé | info |
| `EXCLU` | Exclu | danger |

Décisions proposées depuis « en attente » : **Valider** (`VALIDEE`) ou **Rejeter** (`REJETEE`).

### Types d'inscription

`inscriptions.type_inscription` porte une contrainte `CHECK` qui n'accepte que **trois** codes :
`NOUVEAU` (défaut en base) · `REDOUBLANT` · `TRANSFERT`.

⚠️ Le champ qualifie la **nature du passage**, et **non** l'opposition première inscription /
réinscription. Envoyer `REINSCRIPTION` faisait échouer la création en `23514`, que le backend
remontait en 500 générique.

### Schémas d'import

| Import | Colonnes | Obligatoires |
| ------ | -------- | ------------ |
| Inscriptions | `nom`, `prenom`, `sexe`, `date_naissance`, `lieu_naissance`, `telephone`, `email`, `ville`, `code_filiere`, `code_classe` | `nom`, `prenom`, `email`, `code_filiere`, `code_classe` |
| Réinscriptions | `matricule`, `code_filiere`, `code_classe` | les trois |

Extensions acceptées : `.xlsx`, `.xls`, `.csv`.

## 5. Le piège central : deux endpoints, deux dialectes

`GET /inscriptions/finances` ne se contente pas de renommer les statuts en français minuscule — il
en **traduit un**. Vérifié en croisant les deux endpoints sur les mêmes identifiants :

| `GET /inscriptions` | `GET /inscriptions/finances` |
| ------------------- | ---------------------------- |
| `EN_ATTENTE` | `"en attente"` |
| `VALIDEE` | `"validée"` |
| `ACTIVE` | `"active"` |
| `REJETEE` | **`"annulée"`** — et non « rejetée » |

Et la clé change aussi : `inscription_id` d'un côté, `id` de l'autre.

Sans normalisation, un dossier rejeté s'affichait « Inconnu » dans l'onglet Frais et paiements, et
le filtre correspondant ne le remontait jamais.

**Ce que fait le front** : une fonction `normalizeStatut` unique — majuscules, espaces en
souligné, accents retirés, plus une table d'alias (`ANNULEE → REJETEE`). L'ancien code absorbait
l'écart par des `includes('VALI')` disséminés dans **quatre composants**, chacun avec ses propres
cas.

## 6. État et règles

Store bâti sur `createCrudStore`, état additionnel : `finances`, `financeTotals`
(`{ total_collecte, total_attente }`), `importReport`.

Getters notables :

| Getter | Ce qu'il rend |
| ------ | ------------- |
| `etudiants` | **la projection des inscriptions en annuaire d'étudiants** — c'est ce que consomme le module `etudiants` |
| `enAttente` | les dossiers à traiter |

Une inscription porte l'identité de l'étudiant (`etudiant_matricule`, `etudiant_nom`,
`etudiant_prenom`, `etudiant_email`) : c'est de fait la seule source de listing exploitable, la
classe d'un étudiant venant de son inscription.

## 7. Pièges à reproduire

1. **Les deux dialectes de statut** (§5) — normaliser en un point, pas dans les composants.
2. **Pas de suppression** : rejet ou abandon, jamais `DELETE`.
3. **`type_inscription` a trois valeurs**, et ne signifie pas « réinscription ».
4. **Le champ fichier s'appelle `fichier`** ici, `file` pour les imports d'étudiants. Il n'y a pas
   de règle : c'est ce que chaque route attend.
5. **`code_annee` est obligatoire** à l'import — chaque ligne crée une inscription, qui n'existe
   que rattachée à une année.
6. **Quatre membres consommés par les composants n'existaient pas** dans l'ancien store
   (`removeInscription`, `fetchCandidatsReinscription`, `candidatsPourReinscription`,
   `bulkImportReinscriptions`) : deux onglets entiers reposaient dessus et ne pouvaient rien
   afficher ni rien envoyer. Vérifier que chaque membre lu par un composant existe.

## 8. Checklist de reconstruction

- [ ] Liste filtrable (année, classe, statut) + pagination
- [ ] Validation / rejet par changement de statut, avec commentaire
- [ ] Normalisation des statuts en un seul point, table d'alias comprise
- [ ] Onglet capacité : effectif contre capacité, modale des étudiants d'une classe
- [ ] Onglet frais : totaux `total_collecte` / `total_attente`, montants convertis
- [ ] Deux imports (inscriptions, réinscriptions), champ `fichier`, `code_annee` transmis
- [ ] Aperçu et gabarit téléchargeable, validation ligne à ligne, lignes rejetées paginées
- [ ] Exposer la projection « annuaire d'étudiants » pour le module `etudiants`
- [ ] Aucun bouton « Supprimer »
