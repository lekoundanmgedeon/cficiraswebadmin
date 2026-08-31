# Module `bibliotheque`

> Deux collections **distinctes**, et c'est le point central : le **catalogue** (ce que
> l'établissement a acquis) et le **dépôt académique** (ce que ses étudiants ont produit).

| | |
| --- | --- |
| **Écrans** | 1, à deux onglets |
| **Domaine backend** | `/api/bibliotheque` |
| **Dépendances** | `examens` — les mentions d'un mémoire sont celles du bulletin |

Le menu `/bibliotheque` existait dans la version d'origine mais **ne pointait vers rien** : ni
route, ni vue, ni table. L'écran, son domaine backend et ses tables ont été créés ensemble
(migration `014_bibliotheque.sql`).

## 1. Écran et route

| Chemin | Nom | Titre |
| ------ | --- | ----- |
| `/bibliotheque` | `Bibliotheque` | Bibliothèque |

## 2. Onglets

| Onglet | Contenu |
| ------ | ------- |
| Ouvrages disponibles | le catalogue — **30 ouvrages**, CRUD, filtre par catégorie |
| Mémoires & thèses | le dépôt — **208 mémoires**, lecture seule |

## 3. Endpoints

| Appel | Rôle |
| ----- | ---- |
| CRUD `/ouvrages` | le catalogue |
| `GET /bibliotheque/memoires` | filtres `publies`, `type_travail`, `q` |
| `GET /bibliotheque/statistiques` | titres, exemplaires, disponibles, catégories |

### Pourquoi les mémoires ne sont pas des ouvrages

⚠️ **Ce n'est pas une lecture du catalogue.** Un mémoire n'est pas un ouvrage acquis : c'est le
travail d'un étudiant (`travaux_recherche`). Il n'entre en bibliothèque que par sa **cote** et sa
**date de publication**.

Les recopier dans `ouvrages` aurait créé **deux titres pour un même document**, libres de diverger.

## 4. Vocabulaire

### Types d'ouvrage
`CHECK (type_ouvrage IN ('LIVRE','REVUE','THESE_EXTERNE','RAPPORT','NUMERIQUE'))`.

| Code | Libellé |
| ---- | ------- |
| `LIVRE` | Livre |
| `REVUE` | Revue |
| `THESE_EXTERNE` | Thèse externe |
| `RAPPORT` | Rapport |
| `NUMERIQUE` | Document numérique |

⚠️ **`THESE_EXTERNE` désigne une thèse d'un autre établissement**, acquise comme un livre. Les
mémoires et thèses de la maison ne sont pas là.

### Disponibilité — **jamais stockée**
`DISPONIBLE` · `PARTIEL` (partiellement sorti) · `INDISPONIBLE`

Elle est **dérivée des compteurs** par la vue `v_ouvrages_catalogue`. Une colonne se
désynchroniserait du compteur qu'elle prétend résumer.

### Types de travaux déposés
`MEMOIRE` · `THESE` · `PROJET` (projet de fin d'études) · `RAPPORT_STAGE`

### Longueurs maximales
cote 30 · titre 255 · auteur 255 · éditeur 150 · ISBN 20 · catégorie 80.

## 5. État et règles

Store bâti sur `createCrudStore` (sur les ouvrages), avec `memoires` et `statistiques` en état
additionnel.

| Getter | Ce qu'il rend |
| ------ | ------------- |
| `categories` | celles **réellement présentes** au catalogue, triées — pour le filtre |
| `indisponibles` | les titres dont plus aucun exemplaire n'est en rayon |
| `memoiresPublies` | les seuls consultables |
| `indicateurs` | cumuls du fonds, dérivés du catalogue chargé |

Les compteurs sont servis en chaînes par `pg` : conversion à l'entrée.

## 6. Pièges à reproduire

1. **Ne pas fondre les deux collections** : cycles de vie et écrans différents.
2. **La disponibilité se dérive**, elle ne se stocke pas.
3. **Le filtre de catégories vient des données**, pas d'une liste figée.
4. **Les compteurs arrivent en chaînes.**
5. Pagination sur les deux onglets (30 et 208 lignes).

## 7. Checklist de reconstruction

- [ ] CRUD du catalogue, cinq types, longueurs maximales
- [ ] Dépôt des mémoires en lecture seule, filtres publiés / type / recherche
- [ ] Disponibilité dérivée des compteurs
- [ ] Indicateurs du fonds
- [ ] Filtre de catégories construit depuis le catalogue chargé
