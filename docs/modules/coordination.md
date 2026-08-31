# Module `coordination`

> La coordination académique : thèmes et mémoires, soutenances, jurys, procès-verbaux, et le
> statut des étudiants finalistes.

| | |
| --- | --- |
| **Écrans** | 3 |
| **Sous-domaines** | `travaux` · `soutenances` · `statut` |
| **Domaine backend** | `/api/coordination` |
| **Dépendances** | `structure-academique` (filières, années) · `pedagogies` (les enseignants d'un jury, le directeur d'un mémoire) · `examens` (les salles d'une soutenance) |

Les trois menus existaient dans la version d'origine mais **ne pointaient vers rien** : ni route,
ni vue, ni table. Écrans, domaine backend et tables ont été créés ensemble (migration
`015_coordination_academique.sql`).

## 1. Écrans et routes

| Chemin | Nom | Titre |
| ------ | --- | ----- |
| `/themes-memoires` | `ThemesMemoires` | Thèmes & mémoires |
| `/soutenances` | `Soutenances` | Soutenances |
| `/statut` | `StatutEtudiant` | Statut étudiant |

## 2. Onglets

| Écran | Onglets |
| ----- | ------- |
| Thèmes & mémoires | Attribution des thèmes · Suivi & échéances |
| Soutenances | Planning · Procès-verbaux · Dossiers & archives |
| Statut étudiant | Étudiants finalistes · Progression des travaux |

## 3. Endpoints

### Travaux de recherche — `/travaux`
| Appel | Rôle |
| ----- | ---- |
| CRUD standard | |
| `GET /finalistes` | filtres `situation`, `avecTravail`, `filiereId` |

⚠️ **`create()` est idempotent** sur le couple (étudiant, année) : le serveur fait un
`ON CONFLICT DO UPDATE`. Réattribuer un thème **corrige l'attribution** au lieu d'échouer sur la
contrainte d'unicité — c'est le geste de correction qu'attend une scolarité.

**La règle « finaliste » est déduite du cycle** : `niveau.ordre = cycle.duree_annees`. Elle vaut
pour une licence de trois ans comme pour un cycle d'ingénieur de cinq, **sans liste de libellés à
tenir à jour**.

### Soutenances — `/soutenances`
| Appel | Rôle |
| ----- | ---- |
| CRUD standard | `create()` accepte un tableau `jurys` |
| `GET /soutenances/:id` | le dossier complet : soutenance + jury + PV |
| `PUT /soutenances/:id/jurys` | **remplace** la composition du jury |
| `PUT /soutenances/:id/proces-verbal` | crée **ou** met à jour le PV |
| `PATCH /soutenances/:id/proces-verbal/valider` | le rend opposable |
| `GET /soutenances/stats/synthese` | planifiées, tenues, à venir, sans PV |

Trois règles portées par le serveur, à ne pas réimplémenter côté client :

1. **La soutenance et son jury sont enregistrés dans une transaction.** Un jury à moitié
   enregistré ne vaut rien.
2. **Le jury se remplace en bloc** : le serveur efface puis réinsère, en transaction. Composer un
   jury est un geste d'ensemble, pas une suite d'ajouts dont la moitié pourrait survivre.
3. **Une soutenance n'a qu'un PV** (contrainte d'unicité) : rédiger en deux fois ne produit pas
   deux documents concurrents. Le numéro officiel est posé par la base à la création
   (`fn_numero_document`) et **ne change jamais**.

**Valider un PV** le rend opposable, fait passer la soutenance à « tenue » et le mémoire à
« soutenu ». La base **refuse un PV validé sans décision ni note** (contrainte
`pv_validation_complete`) : ce n'est pas une vérification d'écran.

## 4. Vocabulaire

Toutes les listes sont relevées sur les contraintes `CHECK` de la migration `015`.

### `travaux_recherche.type_travail`
`MEMOIRE` · `THESE` · `PROJET` (projet de fin d'études) · `RAPPORT_STAGE`

### `travaux_recherche.statut` — la vie d'un mémoire
| Code | Libellé |
| ---- | ------- |
| `ATTRIBUE` | Attribué |
| `EN_COURS` | En cours |
| `SOUMIS` | Soumis |
| `SOUTENU` | Soutenu |
| `VALIDE` | Validé |
| `ABANDONNE` | Abandonné |

Un statut absent est **« Non attribué »**, pas « inconnu ».

### `travaux_recherche.situation` — où l'étudiant travaille réellement
`STAGE` (En stage) · `RECHERCHE` (En recherche) · `AUCUNE` (Non engagé)

C'est la question que pose l'écran « statut étudiant ».

### `soutenances.statut`
`PLANIFIEE` · `TENUE` · `REPORTEE` · `ANNULEE`

### `soutenances.type_soutenance`
`MEMOIRE` · `THESE` · `PROJET` · `STAGE`

### `soutenance_jurys.role` — **quatre rôles, et pas un de plus**
`PRESIDENT` · `RAPPORTEUR` · `EXAMINATEUR` · `INVITE`

### `proces_verbaux_soutenance.decision`
`EN_ATTENTE` · `ADMIS` · `ADMIS_AVEC_RESERVES` · `AJOURNE` · `REFUSE`

### `proces_verbaux_soutenance.statut`
`BROUILLON` · `VALIDE` · `PUBLIE` — une soutenance sans PV affiche **« Sans PV »**.

### Mention et note
Mentions identiques à celles du bulletin (`PASSABLE` … `EXCELLENT`).
`CHECK (note_finale BETWEEN 0 AND 20)`.

## 5. État et règles

### Store des travaux
Les deux collections vivent ensemble parce qu'elles décrivent **le même objet vu de deux côtés** :
`items` = les travaux **attribués**, `finalistes` = les étudiants **qui devraient en avoir un**.
C'est le rapprochement des deux qui répond à la question de l'écran « statut étudiant » — **qui n'a
pas encore de sujet**.

| Getter | Ce qu'il rend |
| ------ | ------------- |
| `enRetard` | les travaux dont l'échéance est dépassée |
| `sansDirecteur` | ceux sans encadrant |
| `finalistesSansTravail` | **le trou à combler** |
| `parSituation`, `progressionMoyenne` | les agrégats de l'onglet Progression |

### Store des soutenances
| Getter | Ce qu'il rend |
| ------ | ------------- |
| `aVenir` | planifiées à partir d'aujourd'hui, dans l'ordre où elles se tiendront |
| `sansProcesVerbal` | **tenues sans PV — le trou administratif que l'écran doit rendre visible**, puisque rien d'autre ne le signale |
| `pvEnAttente` | PV rédigés mais pas validés |
| `archives` | |

## 6. Pièges à reproduire

1. **L'attribution d'un thème est idempotente** : ne pas traiter un « conflit » comme une erreur.
2. **La règle finaliste se déduit du cycle**, pas d'une liste de niveaux.
3. **Le jury se remplace en bloc**, jamais ligne à ligne.
4. **Un seul PV par soutenance**, avec un numéro officiel immuable.
5. **La validation d'un PV exige décision et note** — la base refuse, ce n'est pas une politesse
   d'écran.
6. **Rendre visibles les soutenances tenues sans PV.**
7. **Le planning se groupe par journée, mais une session tient couramment sur une seule** (208 le
   même jour en démonstration). Paginer les journées ne découperait rien : ce sont les séances qui
   le sont, et le regroupement porte sur la page — sans quoi une journée serait coupée sans jamais
   montrer sa suite. L'en-tête dit combien de séances sont visibles sur le total de la journée.
8. **Le suivi des travaux porte des saisies en cours** : la pagination ne doit pas les perdre.

## 7. Checklist de reconstruction

- [ ] Trois écrans, sept onglets au total
- [ ] Attribution des thèmes, idempotente sur (étudiant, année)
- [ ] Suivi & échéances, avec brouillon de saisie préservé à travers la pagination
- [ ] Planning des soutenances groupé par journée, paginé **par séance**
- [ ] Composition du jury en bloc, quatre rôles
- [ ] PV unique, numéro officiel serveur, validation exigeant décision et note
- [ ] Finalistes : déduction par le cycle, filtres situation / avec travail / filière
- [ ] Progression : agrégats, sans pagination
- [ ] Rendre visibles : travaux sans directeur, finalistes sans travail, soutenances sans PV
