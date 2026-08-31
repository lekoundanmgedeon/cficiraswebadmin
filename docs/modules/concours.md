# Module `concours`

> Les concours d'admission : éditions, épreuves, candidatures, saisie des notes, classement,
> délibération et proclamation.

| | |
| --- | --- |
| **Écrans** | 3 |
| **Sous-domaines** | `concours` · `epreuve` · `candidat` |
| **Domaine backend** | `/api/gestion` |
| **Dépendances** | `structure-academique` (année académique) |

## 1. Écrans et routes

| Chemin | Nom | Titre |
| ------ | --- | ----- |
| `/edition-concours` | `EditionConcours` | Gestion des concours |
| `/edition-concours/:id/configurations` | `concours-configuration` | Configuration d'un concours |
| `/rapport-concours` | `RapportConcours` | Rapports de concours |

## 2. Onglets

### Gestion des concours
| Onglet | Contenu |
| ------ | ------- |
| Concours | la liste, CRUD, changement de statut |
| Résultats | |

### Configuration d'un concours — **un parcours numéroté**
| Onglet | Contenu |
| ------ | ------- |
| 1. Épreuves | CRUD des épreuves du concours, coefficients |
| 2. Candidatures | liste, création, import par lot, dossiers |
| 3. Saisie des Notes | grille par épreuve — **132 candidats**, avec saisie en cours |
| 4. Délibération & Publication | seuil, proclamation, export des admis |

La numérotation n'est pas décorative : c'est l'ordre dans lequel un concours se monte.

### Rapports de concours
| Onglet | Contenu |
| ------ | ------- |
| Classement | moyenne générale et rang, avec la décision du jury |
| Statistiques des résultats | |

## 3. Endpoints

### Concours — `/concours`
| Appel | Rôle |
| ----- | ---- |
| CRUD standard | |
| `PATCH /concours/:id/statut` | `{ statut }` |
| `GET /concours/:id/moyennes-rangs` | **calcule** les moyennes et les rangs, puis rend le classement |
| `GET /concours/:id/classement` | lecture du classement |
| `PATCH /concours/:id/proclamer` | `{ seuil_admission?, decision_liste_attente?, commentaire? }` |
| `GET /concours/:id/admis/export?format=pdf\|excel` | téléchargement (`responseType: 'blob'`) |

> ⚠️ `moyennes-rangs` répondait **404 « Impossible de calculer »** alors que le calcul réussissait :
> la fonction Postgres `calculer_moyennes_et_rangs` est déclarée `RETURNS void` — elle écrit, sans
> rien renvoyer — et le contrôleur prenait ce `NULL` pour un échec. Corrigé côté backend.

### Épreuves — **sous `/concours`**, pas sous une ressource à elles
```
GET    /concours/:concoursId/epreuves
GET    /concours/epreuves/:id
POST   /concours/epreuves
PUT    /concours/epreuves/:id
DELETE /concours/epreuves/:id
```

> ⚠️ L'ancien code appelait `PUT`/`DELETE` sur `/gestions/concours/epreuves/:id` — **un `/gestions/`
> en trop**, alors que le client est *déjà* monté sur `/gestion`. L'URL réelle devenait
> `/api/gestion/gestions/concours/epreuves/:id` : **404**. Modifier et supprimer une épreuve de
> concours n'ont **jamais** fonctionné. Les trois autres routes avaient le bon chemin.

### Candidats — `/candidats`
| Appel | Rôle |
| ----- | ---- |
| `GET /candidats/concours/:concoursId` | les candidats d'un concours |
| `GET /candidats/concours/:concoursId/epreuve?epreuve_code=` | les candidats **avec leur note** |
| `GET /candidats/:id` | dossier |
| `POST /candidats` | création |
| `POST /candidats/:id/pieces` | pièce justificative |
| `POST /candidats/:numTable/notes` | note d'une épreuve — **par numéro de table**, pas par identifiant |
| `POST /candidats/import` | import par lot — champ `file` + `concours_id` |
| `POST /candidats/import/notes` | import de notes — champ `file` + `concours_id` |

**Il n'existe pas de `GET /candidats`** : un candidat n'a de sens que dans un concours.

> ⚠️ `POST /candidats/import` était **commentée** côté backend, alors que son contrôleur
> `importCandidats` était bien implémenté : l'import par lot répondait **404**. Rétablie.
>
> ⚠️ `POST /candidats/import/notes` était **déclarée deux fois**, la seconde sans son `multer` —
> donc morte. Une seule subsiste.

## 4. Vocabulaire

### Statuts d'un concours
`CHECK (statut IN ('PLANIFIE', 'OUVERT', 'CLOTURE', 'ANNULE'))`.

| Code | Libellé |
| ---- | ------- |
| `PLANIFIE` | Planifié |
| `OUVERT` | Ouvert |
| `CLOTURE` | Clôturé |
| `ANNULE` | Annulé |

⚠️ L'ancien écran testait `statut === 'PROCLAMÉ'` pour savoir si les résultats étaient publiés.
**Ce statut n'existe pas** : la condition était toujours fausse. La proclamation n'est **pas** un
statut de concours — elle écrit dans `admissions_concours`.

### Types de concours
`concours.type_concours` est une **clé étrangère** vers `types_concours(code)`. La table en
contient **sept** ; le formulaire n'en proposait que **quatre** :

| Code | Libellé | Proposé avant |
| ---- | ------- | ------------- |
| `ENTREE` | Concours d'entrée | ✅ |
| `TEST` | Test | ✅ |
| `PASSERELLE` | Concours passerelle | ✅ |
| `SPECIAL` | Concours spécial | ✅ |
| `CONCOURS_INGE` | Concours Ingénieur | ❌ |
| `CONCOURS_MASTER` | Concours Master | ❌ |
| `CONCOURS_LICENCE` | Concours Licence | ❌ |

Les trois derniers étaient **inaccessibles**, alors qu'un concours existant les utilise : éditer le
« Concours Ingénieur 2025 » lui aurait fait **perdre son type**.

⚠️ **Aucun endpoint n'expose `types_concours`.** La liste est figée côté front, à l'image de la
table. Un `GET /concours/types` la rendrait dynamique — c'est une des trois questions ouvertes.

### Types d'épreuve
`CHECK (type_epreuve IN ('ECRIT', 'ORAL', 'PRATIQUE'))`.

### Statuts de dossier de candidature
`CHECK (statut IN ('INCOMPLET', 'COMPLET', 'VERIFIE', 'REJETE'))`.

⚠️ Un candidat peut n'avoir **aucun** dossier — la jointure est un `LEFT JOIN` : `statut_dossier`
vaut alors `null`, ce qui n'est **pas « incomplet » mais « non déposé »**.

### Décisions du jury
`CHECK (decision_jury IN ('EN_ATTENTE', 'ADMIS', 'LISTE_ATTENTE', 'A_A_JOURNER'))`.

⚠️ L'orthographe de `A_A_JOURNER` est **celle de la base**, pas une coquille. Libellé affiché :
« Ajourné ».

Une décision **absente** n'est pas « en attente » : c'est **« non proclamé »** — le concours n'a
pas encore été délibéré.

> Ces décisions n'étaient **lisibles nulle part** : `proclamerAdmissions` les écrit, mais le
> classement ne les renvoyait pas et le seul autre accès était l'export binaire de la liste des
> admis. La jointure a été ajoutée côté backend.

### Validation d'un candidat — contraintes portées par la base

```sql
CHECK (email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$')
CHECK (tel   ~  '^\+?[0-9]{10,15}$')
CHECK (datenais > '1900-01-01')
CHECK (sexe IN ('M', 'F'))
```

Elles sont portées par la **base**, pas par le contrôleur : une saisie non conforme remonterait en
erreur SQL brute (« violates check constraint »), illisible. **Valider côté client.**

### Seuil d'admission
Défaut : **10**, aligné sur celui du backend.

## 5. État et règles

| Store | Fabrique | Ce qu'il porte |
| ----- | -------- | -------------- |
| `concours` | CRUD | `classement` ; `changeStatut`, `fetchClassement`, `recalculer`, `proclamer`, `downloadAdmisList` |
| `epreuve` | `run` propre | `items`, `concoursId`, `totalCoefficients`, `ordonnees` |
| `candidat` | `run` propre | `items`, `concoursId`, `notesParEpreuve`, `notesConcoursId`, `dossier`, `importReport` |

`totalCoefficients` : **un concours cohérent garde la somme des coefficients constante.**

### Le cache de notes par épreuve — et pourquoi il porte un identifiant de concours

`notesParEpreuve` est indexé par **code d'épreuve**, et rangé à part de `items` : `items` est la
liste des candidats, que lisent l'onglet « Candidatures » et la grille de saisie. L'ancienne
action l'écrasait.

⚠️ **Un code d'épreuve n'est unique que dans son concours** : deux concours peuvent tous deux avoir
une épreuve « CG ». D'où `notesConcoursId`, qui dit à quel concours ce cache appartient — sans lui,
passer d'un concours à l'autre servirait **les notes du premier pour le second, en silence**.

## 6. Pièges à reproduire

1. **Pas de `GET /candidats`** ni de `GET /epreuves` : tout passe par le concours.
2. **La note d'un candidat s'enregistre par numéro de table**, pas par identifiant.
3. **`PROCLAMÉ` n'est pas un statut.** La proclamation écrit dans une autre table.
4. **Les sept types de concours**, sinon l'édition détruit le type d'un concours existant.
5. **`A_A_JOURNER`**, avec cette orthographe.
6. **Dossier absent ≠ dossier incomplet.**
7. **Le cache de notes doit être qualifié par le concours.**
8. **Valider email, téléphone, date de naissance et sexe côté client.**
9. **La pagination ne doit pas perdre les saisies en cours** : les valeurs vivent dans un tableau
   indexé par identifiant, l'enregistrement porte sur **toutes** les lignes modifiées, et le
   compteur signale celles qui ne sont plus sous les yeux.
10. `RapportConcours.vue` affichait, comme deux autres écrans, **des formateurs codés en dur**
    servis après un `setTimeout`. Rien à en reprendre.

## 7. Checklist de reconstruction

- [ ] Liste des concours, CRUD, changement de statut (quatre valeurs)
- [ ] Écran de configuration à quatre étapes numérotées
- [ ] Épreuves : CRUD sous `/concours`, somme des coefficients affichée
- [ ] Candidatures : liste par concours, création validée côté client, dossiers, import par lot
- [ ] Saisie des notes par épreuve, cache qualifié par concours, pagination sans perte de saisie
- [ ] Calcul des moyennes et rangs, puis classement avec décision du jury
- [ ] Proclamation avec seuil (défaut 10) et décision de liste d'attente
- [ ] Export des admis en PDF et Excel (réponse binaire)
- [ ] Sept types de concours, figés faute d'endpoint
