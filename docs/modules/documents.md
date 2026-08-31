# Module `documents`

> Le guichet des documents administratifs : attestations, certificats, relevés, diplômes.
> Une demande se dépose, puis **avance dans un circuit**.

| | |
| --- | --- |
| **Écrans** | 1, à trois onglets |
| **Domaine backend** | `/api/documents` |
| **Dépendances** | `etudiants` (le demandeur) · `structure-academique` (année, classe) |

Trois menus existaient dans la version d'origine — `/demande-diplome`, `/edition-diplome`,
`/historique-diplome` — et **aucun ne pointait vers quoi que ce soit**. Ils deviennent **un écran
unique à trois onglets** : le circuit d'une demande est le même, seule sa position change.

## 1. Écran et routes

| Chemin | Nom | Comportement |
| ------ | --- | ------------ |
| `/documents` | `Documents` | l'écran |
| `/demande-diplome` | — | redirige vers `Documents` |
| `/edition-diplome` | — | redirige |
| `/historique-diplome` | — | redirige |

Les anciennes URL sont conservées en redirection : un signet ou un lien envoyé par courriel
continue de fonctionner.

## 2. Onglets

| Onglet | Contenu |
| ------ | ------- |
| Demandes en cours | celles qui ne sont pas closes — **455 demandes**, paginées |
| Historique | les demandes délivrées ou rejetées |
| Documents délivrables | le catalogue des types — 13 types en trois groupes, **non paginé** |

## 3. Endpoints

| Appel | Rôle |
| ----- | ---- |
| `GET /documents/types` | catalogue ; `?tous=true` inclut les types désactivés |
| `GET /documents/demandes` | filtres `statut`, `etudiantId`, `type`, `traitees`, `q` |
| `GET /documents/demandes/:id` | détail |
| `POST /documents/demandes` | dépose une demande |
| `PATCH /documents/demandes/:id/statut` | fait avancer |
| `DELETE /documents/demandes/:id` | |
| `GET /documents/statistiques` | en attente, en retard, délivrées, rejetées |

### Le catalogue est une table, pas une liste codée

`types_documents` vit **en base**. Ajouter un certificat **ne demande pas de livrer une version du
frontend**. Chaque type porte son préfixe de numérotation, son délai de traitement et ce qu'il
exige (année, classe).

### Le numéro officiel vient du serveur

`ATT-2026-0001` est attribué **dans la transaction d'enregistrement**, par `fn_numero_document` —
la fonction de numérotation présente en base depuis le début et qu'aucun appelant n'utilisait.
L'échéance découle du **délai du type demandé**.

Corps de la demande :
```
etudiant_id, type_document, annee_academique_id?, classe_id?,
motif?, nb_exemplaires?, urgence?
```

## 4. Vocabulaire

### Statuts
`CHECK (statut IN ('SOUMISE','EN_TRAITEMENT','PRETE','DELIVREE','REJETEE'))`.

| Code | Libellé |
| ---- | ------- |
| `SOUMISE` | Soumise |
| `EN_TRAITEMENT` | En traitement |
| `PRETE` | Prête |
| `DELIVREE` | Délivrée |
| `REJETEE` | Rejetée |

### Transitions — miroir de la table du modèle backend

| Depuis | Vers |
| ------ | ---- |
| `SOUMISE` | `EN_TRAITEMENT` · `PRETE` · `REJETEE` |
| `EN_TRAITEMENT` | `PRETE` · `REJETEE` |
| `PRETE` | `DELIVREE` |
| `DELIVREE` | — |
| `REJETEE` | — |

Libellés des gestes : **Prendre en charge** · **Marquer prête** · **Délivrer** · **Rejeter**.

> Ce miroir ne sert qu'à **ne pas proposer un bouton qui répondrait 409**. La règle qui fait foi
> est celle du serveur, qui la réapplique à chaque appel. Une transition impossible répond **409 et
> dit pourquoi** ; un rejet sans motif est refusé.

**Une demande est close** quand elle est `DELIVREE` ou `REJETEE` : elle sort du circuit.

### Exemplaires
`CHECK (nb_exemplaires > 0 AND nb_exemplaires <= 10)`.

## 5. État et règles

Store **non bâti** sur `createCrudStore` : une demande ne se modifie pas comme une ressource REST
ordinaire. On la dépose, puis on la fait **avancer**. **Il n'existe ni `PUT` ni édition libre** — et
c'est volontaire : *une demande délivrée ne se réécrit pas.*

| Membre | Rôle |
| ------ | ---- |
| `items`, `types`, `statistiques` | l'état |
| `enCours`, `traitees` | selon que la demande est close |
| `enRetard` | `demande.en_retard`, calculé par le serveur |
| `urgentes` | |
| `typeParCode(code)` | résout un type du catalogue |
| `fetchAll`, `fetchTypes`, `fetchStatistiques`, `create`, `changerStatut`, `remove` | actions |

## 6. Pièges à reproduire

1. **Le catalogue vient de la base**, pas d'une liste codée en dur.
2. **Le numéro officiel est serveur** : ne pas en fabriquer un côté client.
3. **Les transitions sont contraintes** : un 409 explique pourquoi, un rejet exige un motif.
4. **Pas d'édition d'une demande.**
5. **`en_retard` est calculé par le serveur** à partir de l'échéance dérivée du délai du type.
6. **Le catalogue n'est pas paginé** (13 types en trois groupes) ; les deux autres onglets le sont.

## 7. Checklist de reconstruction

- [ ] Un écran, trois onglets, plus les trois redirections d'anciennes URL
- [ ] Dépôt d'une demande : étudiant, type, année et classe si le type l'exige, exemplaires (1–10)
- [ ] Boutons d'avancement dérivés du statut courant, jamais tous affichés
- [ ] Motif obligatoire au rejet
- [ ] Affichage du numéro officiel et de l'échéance servis par le serveur
- [ ] Compteurs : en attente, en retard, délivrées, rejetées
- [ ] Pagination sur les demandes en cours et l'historique
