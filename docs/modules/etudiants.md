# Module `etudiants`

> L'annuaire des étudiants, ses répartitions, ses statistiques, et les deux imports par lot
> (étudiants, tuteurs légaux).

| | |
| --- | --- |
| **Écrans** | 1, à sept onglets |
| **Domaine backend** | `/api/academique` |
| **Dépendances** | `inscriptions` (la classe vient de l'inscription) · `structure-academique` (filtres) · `scolarite` (le statut de dossier, en constantes) — **cycle**, voir [ARCHITECTURE.md](../ARCHITECTURE.md) §2 |

## 1. Écrans et routes

| Chemin | Nom | Comportement |
| ------ | --- | ------------ |
| `/etudiants` | `Etudiants` | l'écran |
| `/etudiants/:id` | `EtudiantDetails` | **redirige vers `DossierScolaire`** |

La redirection est délibérée : les deux fiches affichaient la même chose — identité et parcours —
le dossier scolaire offrant en plus les tuteurs, la situation financière et les pièces. Maintenir
deux fiches jumelles n'avait pas de sens ; la route est conservée pour ne casser aucun lien
existant.

## 2. Onglets

| Onglet | Contenu |
| ------ | ------- |
| Liste des étudiants | recherche, filtres filière et statut de dossier |
| Par classe | l'effectif d'une classe |
| Répartition | par filière, par sexe |
| Statistiques | agrégats dérivés |
| Import | import par lot d'étudiants |
| Import tuteurs | import par lot de tuteurs légaux |
| Exportations | Excel / PDF |

## 3. Endpoints

Ce que `academique/etudiant.routes.js` expose réellement :

| Appel | Rôle |
| ----- | ---- |
| `GET /etudiants` | liste — filtres `search`, `filiere_id`, `statut_dossier` |
| `GET /etudiants/:id/complet` | identité + tuteurs + pièces du dossier |
| `GET /etudiants/:id/profil-frontend` | profil mis en forme |
| `GET /etudiants/:id/parcours` | parcours académique, une entrée par année |
| `POST /etudiants` | créer un étudiant seul |
| `POST /etudiants/:id/tuteurs` | rattacher un tuteur |
| `POST /etudiants/:id/photo` | photo de profil (`FormData`) |
| `POST /imports/etudiants` | import par lot — champ **`file`** + `code_annee` |
| `POST /imports/tuteurs` | import par lot — champ **`file`**, **sans** `code_annee` |

### Trois absences à connaître

| Ce qui n'existe pas | Conséquence |
| ------------------- | ----------- |
| `GET /etudiants/:id` | **404**. Le détail passe par `/:id/complet` — d'où la surcharge de `fetchById` dans le store |
| `PUT /etudiants/:id` | on ne peut pas modifier un étudiant. **Bouton retiré** |
| `DELETE /etudiants/:id` | on ne peut pas en supprimer un. **Bouton retiré** |

La liste ne porte **ni classe ni année académique** : un étudiant appartient à une *filière*, sa
classe vient de son *inscription*. C'est le module `inscriptions` qui la connaît.

## 4. Vocabulaire

**Longueurs maximales** : matricule 20 · nom 100 · prénom 100 · email 150 · téléphone 20.

**Sexes** : `M` (Masculin) · `F` (Féminin) — le backend rend le code brut, l'UI affiche le libellé.

**Liens de parenté** proposés au gabarit : `PERE`, `MERE`, `ONCLE`, `TANTE`, `FRERE`, `SOEUR`,
`TUTEUR`.

### Schéma d'import des tuteurs

**Colonnes exigées** (contrat d'en-têtes du serveur, `services/tuteur.service.js →
requiredHeaders`) — ces dix doivent **exister**, sinon le fichier est refusé en bloc :

```
matricule_etudiant · nom · prenom · tel1 · tel2 · email
nationalite · adresse · ville · lien_parente · est_contact_principal
```

**Valeurs obligatoires**, plus courtes : `matricule_etudiant`, `nom`, `prenom`, `tel1`,
`lien_parente`. Une colonne peut donc être **présente et vide**.

`est_contact_principal` est un booléen (oui/non).

⚠️ **`nationalite` est un code ISO sur deux lettres** (`character(2)` en base) : « CG », pas
« CONGOLAISE ».

## 5. État et règles

Store bâti sur `createCrudStore`, avec **trois actions adaptées** parce que la ressource est
incomplète côté serveur :

| Action | Adaptation |
| ------ | ---------- |
| `fetchById(id)` | passe par `/:id/complet` |
| `update()` | **échoue explicitement** plutôt que d'envoyer une requête vouée à un 404 |
| `remove()` | idem |

État additionnel : `parcours`, `importReport`, `tuteursImportReport`.
Actions propres : `fetchParcours`, `addTuteur`, `uploadPhoto`, `importFromFile`,
`importTuteursFromFile`.

## 6. Pièges à reproduire

### 6.1 `code_annee` est obligatoire à l'import d'étudiants

Il manquait à l'appel, et le serveur répondait systématiquement
« Le paramètre 'code_annee' (ex: 2024-2025) est obligatoire. » — **l'écran d'import d'étudiants n'a
jamais pu aboutir**. Chaque ligne du fichier crée une inscription, qui n'existe que rattachée à une
année.

L'import de **tuteurs** n'en veut pas : le tuteur se rattache au matricule, qui ne dépend pas de
l'année.

### 6.2 Deux conventions de champ fichier

`file` pour les deux imports de ce module ; `fichier` pour ceux des inscriptions. Les routes n'ont
pas la même convention côté serveur.

### 6.3 Le `Content-Type` ne se pose pas à la main sur un `FormData`

Seul le navigateur connaît la « boundary » du multipart. L'intercepteur de requête le retire.

### 6.4 Un store sans `items` ni `fetchAll`

L'ancien store n'exposait **ni l'un ni l'autre** : aucun écran ne *pouvait* charger de liste, d'où
les tableaux codés en dur dans quatre onglets sur six. Vérifier que chaque membre lu par un
composant existe réellement.

### 6.5 L'export Excel plantait

`XLSX` était utilisé sans être importé : l'export des étudiants levait dès le clic. Passer par
l'utilitaire partagé, pas par un import local.

## 7. Checklist de reconstruction

- [ ] Liste + recherche + filtres (filière, statut de dossier) + pagination
- [ ] `fetchById` sur `/:id/complet` — `GET /etudiants/:id` n'existe pas
- [ ] **Aucun bouton Modifier ni Supprimer**
- [ ] `/etudiants/:id` redirige vers le dossier scolaire
- [ ] Import d'étudiants : champ `file` **+ `code_annee`**
- [ ] Import de tuteurs : champ `file`, dix colonnes exigées, cinq valeurs obligatoires,
      `nationalite` sur deux lettres
- [ ] Aperçu, gabarit, validation ligne à ligne, lignes rejetées paginées
- [ ] Envoi de photo en `FormData`, sans `Content-Type` manuel
- [ ] Onglets répartition et statistiques dérivés du store, pas recalculés dans le composant
