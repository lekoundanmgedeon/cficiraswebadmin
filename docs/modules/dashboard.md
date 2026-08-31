# Module `dashboard`

> Le tableau de bord : **les effectifs et l'argent**. Lecture seule — il n'écrit rien.

| | |
| --- | --- |
| **Écrans** | 1, à cinq onglets |
| **Domaine backend** | `/api/academique` + `/api/pedagogies` |
| **Dépendances** | `finances` (les agrégats financiers, non dupliqués) |

> **Le partage des rôles avec `stats` est net** : `dashboard` montre les effectifs et l'argent,
> `stats` montre les résultats. **Aucun des deux n'appelle les endpoints de l'autre.**

## 1. Écran et routes

| Chemin | Nom | Titre |
| ------ | --- | ----- |
| `/dashboard` | `Dashboard` | Tableau de bord |
| `/home` | `Home` | alias historique |
| `` (racine) | `Root` | racine de l'application |

Les trois chemins servent **le même écran**. Ils sont conservés pour ne casser ni la navigation ni
les redirections après connexion.

## 2. Onglets

| Onglet | Contenu |
| ------ | ------- |
| Vue d'ensemble | les KPI d'infrastructure et les grands agrégats |
| Scolarités | |
| Pédagogies | décompte des formateurs et des attributions |
| Cycles | effectif par cycle |
| Rapports | les agrégats financiers, lus depuis le store de `finances` |

## 3. Endpoints

**Aucun de ces endpoints n'est propre au dashboard** : ce sont des vues d'ensemble que le backend
expose depuis toujours et qu'**aucun écran n'appelait**. L'ancien `views/dashboard/` affichait à la
place des chiffres écrits en dur dans ses templates — « 37 050 000 FCFA », « 482 Inscrits ».

| Appel | Rôle |
| ----- | ---- |
| `GET /academique/classes/analytics/dashboard-global` | classes, capacité, inscrits, places libres |
| `GET /academique/cycles/stats/distribution` | effectif par cycle (`cycle_code`, `diplome`, `nb_etudiants`) |
| `GET /academique/filieres/stats/organisations` | filières : effectif, capacité, taux, responsable |
| `GET /pedagogies/enseignant/enseignants` | répertoire — sert au décompte de l'onglet Pédagogie |
| `GET /pedagogies/attribution/attributions` | attributions cours → formateur |

Les **agrégats financiers ne sont pas ici** : le module `finances` les expose déjà, et le dashboard
**réutilise son store** plutôt que de le dupliquer. Dépendance dirigée et déclarée ; l'inverse
n'existe pas.

⚠️ Le segment `/attribution/attributions` est **doublé** parce que le routeur backend est monté sur
`/attribution` alors qu'il déclare déjà `/attributions`. C'est laid, mais c'est ce que le serveur
expose ; **le chemin simple répond 404**.

⚠️ Le domaine `/statistiques` n'existe pas : ses routes **et** son service ont été supprimés, et le
code récupérable est mort. Le dashboard n'en dépend pas.

## 4. État et règles

Store à `run` propre, **lecture seule**.

| Membre | Rôle |
| ------ | ---- |
| `infrastructure` | les KPI, **convertis en nombres à l'entrée** |
| `cycles`, `filieres`, `enseignants`, `attributions` | les collections |
| `tauxRemplissage` | dérivé |
| `cyclesPeuples` | ceux qui ont au moins un étudiant |
| `filieresParEffectif` | triées décroissant |
| `nbEnseignants` | |
| `fetchVueEnsemble` | charge ce dont l'onglet actif a besoin |

## 5. Pièges à reproduire

1. **`pg` sert ses compteurs en chaînes** (`"10"`, `"1610"`). Sans conversion, une addition produit
   une concaténation et **Chart.js reçoit un axe vide** — sans lever d'erreur.
2. **Le segment `/attribution/attributions` est doublé.**
3. **Ne pas dupliquer les agrégats financiers** : réutiliser le store de `finances`.
4. **`dashboard-global` est bâti sur une vue à fan-out.** Sa capacité et ses places disponibles
   sont fausses (36 325 places annoncées pour 5 400 réelles) ; seul `total_etudiants_inscrits`
   résiste, étant un `COUNT(DISTINCT)`. Ce que le dashboard en affiche doit être choisi en
   conséquence — voir [CONTRAT-API.md](../CONTRAT-API.md) §8.2.
5. **Un onglet = une requête**, à son ouverture.

## 6. Checklist de reconstruction

- [ ] Trois chemins vers le même écran
- [ ] Cinq onglets à montage paresseux
- [ ] Conversion des compteurs à l'entrée du store
- [ ] Agrégats financiers empruntés au module `finances`
- [ ] Aucun chiffre écrit en dur dans un template
- [ ] Prudence sur les capacités servies par la vue globale
