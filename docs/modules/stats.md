# Module `stats`

> Les statistiques de **résultats** : moyennes, distribution, décisions, mentions, palmarès par
> classe. À ne pas confondre avec le tableau de bord, qui montre les **effectifs et l'argent**.

| | |
| --- | --- |
| **Écrans** | 1, à trois onglets |
| **Domaine backend** | `/api/evaluations` |
| **Dépendances** | `examens` — l'en-tête réutilise `BulletinContexte`, le sélecteur (classe, semestre, année) |

> **Le partage des rôles avec le tableau de bord est net** : `dashboard` montre les effectifs et
> l'argent, `stats` montre les résultats. **Aucun des deux n'appelle les endpoints de l'autre.**

## 1. Écran et route

| Chemin | Nom | Titre |
| ------ | --- | ----- |
| `/statistiques` | `Statistiques` | Statistiques des résultats |

## 2. Onglets

| Onglet | Contenu |
| ------ | ------- |
| Synthèse | effectif, moyenne, taux de réussite, distribution par tranche, décisions, mentions |
| Par classe | le palmarès des classes du périmètre |
| Palmarès | les bulletins eux-mêmes, triés par rang |

Le **filtre est porté par le store**, si bien que les trois onglets partagent le même périmètre :
changer de classe dans un onglet ne laisse pas les autres sur l'ancien.

## 3. Endpoints

| Appel | Rôle |
| ----- | ---- |
| `GET /resultats/statistiques` | les **cinq agrégats en un appel** : `synthese`, `distribution`, `decisions`, `mentions`, `parClasse` |
| `POST /resultats/classes/:classeId/bulletins/generer` | calcule et enregistre les bulletins |
| `GET /resultats/classes/:classeId/bulletins` | palmarès d'une classe |

Filtres, tous **facultatifs** : `classeId`, `semestreId`, `anneeId`, `filiereId`. Sans aucun, la
réponse porte sur l'ensemble des bulletins.

### ⚠️ Le domaine `/statistiques` n'existe pas

Ses routes **et** son service ont été **supprimés** du backend, et le code récupérable est mort :
**9 de ses 11 requêtes échouent** contre la base, écrites contre un schéma antérieur.

| Endpoint d'origine | Verdict |
| ------------------ | ------- |
| `/par-filiere`, `/repartition-sexe` | ✅ |
| `/globales` | ❌ `relation "paiements" does not exist` |
| `/par-classe`, `/par-annee`, `/classe-sexe`, `/filiere-cycle-annee` | ❌ `relation "cursus" does not exist` |
| `/taux-reussite` | ❌ `relation "resultats" does not exist` |
| `/inscriptions` | ❌ `column i.annee_id does not exist` |
| `/participation-concours` | ❌ `column c.nb_places does not exist` |
| `/filiere-cycle` | ❌ `column cy.designation does not exist` |

Correspondances actuelles : `cursus` → `inscriptions`, `resultats` → `bulletins_semestriels`,
`paiements` → `paiements_all`, `inscriptions.annee_id` → `annee_academique_id`,
`cycle.designation` → `cycle.code`. Et `concours.nb_places` **n'existe pas du tout** : le taux de
participation n'a plus de dénominateur.

**Décision : ne pas restaurer, réécrire.** L'écran repose sur `/evaluations/resultats`, dont la
partie manquante — le calcul des bulletins — a été ajoutée côté backend.

## 4. Vocabulaire

Toutes les valeurs viennent des contraintes `CHECK` de `bulletins_semestriels` :

| Colonne | Valeurs |
| ------- | ------- |
| `decision` | `EN_ATTENTE` · `VALIDE` · `AJOURNE` · `RATTRAPAGE` |
| `mention` | `PASSABLE` · `ASSEZ_BIEN` · `BIEN` · `TRES_BIEN` · `EXCELLENT` (nullable) |
| `statut_publication` | `BROUILLON` · `PUBLIE` · `VERROUILLE` |
| `moyenne_generale` | `CHECK (>= 0 AND <= 20)` |

### Les tranches de moyenne

```
[0-5[ · [5-8[ · [8-10[ · [10-12[ · [12-14[ · [14-16[ · [16-20]
```

Le découpage est fait **côté serveur** (colonne `tranche` de `vue_statistiques_resultats`) pour que
tous les écrans coupent au même endroit. La liste côté client ne sert qu'à **garantir l'ordre**
d'affichage et à **faire apparaître les tranches vides**, que le `GROUP BY` omet.

Couleur : rouge sous 10, vert au-dessus. **La barre des 10 est la seule qui compte.**

## 5. État et règles

Store à `run` propre, avec un drapeau de chargement distinct pour la génération (`drapeau`).

| Membre | Rôle |
| ------ | ---- |
| `filtres` | `{ classeId, semestreId, anneeId, filiereId }` — partagé par les trois onglets |
| `synthese`, `distribution`, `decisions`, `mentions`, `parClasse`, `bulletins` | les agrégats |
| `estVide` | l'effectif du périmètre est nul |
| `distributionComplete` | la distribution **avec les tranches vides**, dans l'ordre |
| `tauxReussite`, `classementClasses` | dérivés |
| `peutGenerer` | la génération exige un périmètre complet |
| `appliquerFiltres`, `fetchStatistiques`, `fetchBulletins`, `genererBulletins` | actions |

## 6. Pièges à reproduire

1. **`pg` sert ses `NUMERIC` en chaînes** (`"15.50"`) et **`AVG` d'un ensemble vide vaut `null`**.
   Sans garde, un filtre sans résultat affiche « NaN/20 ». Les deux cas passent par le même
   formateur, qui rend `—`.
2. **Faire apparaître les tranches vides** : un `GROUP BY` les omet, et un histogramme à trous
   ment sur la forme de la distribution.
3. **Un seul appel pour cinq agrégats** : ne pas le découper en cinq requêtes.
4. **Le filtre appartient au store**, pas à chaque onglet.
5. **Sans génération de bulletins, l'écran n'a rien à agréger.** C'est le geste qui l'alimente.
6. Ne pas ressusciter le domaine `/statistiques`.

### Ce qu'était l'ancien écran

Pour mémoire, et parce que rien n'en a été repris : `Statistiques.vue` servait, après un
`setTimeout(3000)`, **deux formateurs codés en dur** — « John Doe », « Anna Smith ». Ses cinq
composants d'onglet étaient **byte-identiques** (la même table, à en-têtes d'examens), aucun ne
recevait sa prop `rows`, **cinq liens d'onglet pointaient sur quatre panneaux** dont deux sur le
même, et **aucun appel API n'était fait nulle part**.

## 7. Checklist de reconstruction

- [ ] Un appel, cinq agrégats, filtres facultatifs
- [ ] Filtre porté par le store, partagé par les trois onglets
- [ ] Distribution complétée des tranches vides, dans l'ordre serveur
- [ ] Formateur de moyenne qui absorbe chaîne et `null`
- [ ] Bouton de génération des bulletins, avec son propre drapeau de chargement
- [ ] Taux de réussite et classement dérivés du store
