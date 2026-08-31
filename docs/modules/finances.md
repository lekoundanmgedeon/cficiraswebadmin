# Module `finances`

> L'argent : gabarits d'échéancier, échéanciers, factures, encaissements, recouvrement, rapports.
> C'est, avec `pedagogies`, le plus gros module du dépôt.

| | |
| --- | --- |
| **Écrans** | 3 |
| **Sous-domaines** | `paiements` · `facturations` · `rapports` (+ 5 stores) |
| **Domaine backend** | `/api/finance` |
| **Dépendances** | `structure-academique` · `inscriptions` · `etudiants` (l'onglet « Suivi étudiant ») · `assistant` — **un cycle passe par ici**, voir [ARCHITECTURE.md](../ARCHITECTURE.md) §2 |
| **Dépendants** | `scolarite` (situation financière) · `dashboard` (agrégats) |

Le domaine est **authentifié de bout en bout**, et les écritures sont réservées aux rôles `ADMIN`
et `FINANCES` : **une 403 sur un encaissement n'est pas un bug, c'est un défaut d'habilitation**.

## 1. Écrans et routes

| Chemin | Nom | Titre |
| ------ | --- | ----- |
| `/paiements-finances` | `FinancePaiement` | Paiements & scolarités |
| `/factures-finances` | `FinanceFacture` | Facturation |
| `/rapports-financiers` | `RapportsFinanciers` | Rapports financiers |

## 2. Onglets

### Paiements & scolarités
| Onglet | Contenu |
| ------ | ------- |
| Paiements | le registre des encaissements — **200 chargés sur 7 497** |
| Nouveau Paiement | le guichet |
| Suivi étudiant | la situation d'un étudiant, inscription par inscription |
| Contrôle par classe | qui a payé, qui doit — jusqu'à 6 223 lignes |
| Archives | les exercices passés |

### Facturation
| Onglet | Contenu |
| ------ | ------- |
| Factures | la liste — 1 803 lignes |
| Etats honoraires | émission, génération automatique par classe |
| Transactions | archives |

### Rapports financiers
| Onglet | Contenu |
| ------ | ------- |
| Rapports Paiements | encaissements mensuels, répartition par mode |
| Rapports Factures | impayées, totaux |
| Bilans Financiers | balance par filière, par classe |
| Simulations & Projections | |
| Assistant IA | cadrage `finances` |

> ⚠️ Ces trois écrans utilisent encore les **onglets Bootstrap natifs** : tous les panneaux sont
> montés d'un coup. Dans une reconstruction, appliquer le montage paresseux — c'est le principal
> gisement d'optimisation restant.

## 3. Endpoints

### Plans de paiement — les gabarits d'échéancier
| Appel | Rôle |
| ----- | ---- |
| CRUD `/plans` | gabarits `ANNUEL`, `SEMESTRIEL`, `MENSUEL`, `TRANCHES` |
| `POST /plans/:planId/classes` | rattache un plan à une classe pour une année (`{ classe_id, annee_academique_id, par_defaut? }`) |

**Un plan ne porte aucun montant** : il porte une **répartition**, que le serveur applique au tarif
de la classe de l'étudiant. C'est ce qui permet aux quatre modalités de coexister sans dupliquer
les tarifs.

### Échéanciers
| Appel | Rôle |
| ----- | ---- |
| `POST /echeanciers` | `{ inscription_id, plan_id }` — génère l'échéancier |
| `GET /echeanciers/inscription/:id` · `/etudiant/:id` | lecture |
| `GET /echeanciers/suivi` | suivi des traites, tous étudiants — filtres `statut`, `classe_id`, `filiere_id`, `en_retard` |

⚠️ Le serveur **refuse la régénération** si des paiements y sont déjà imputés (400) : la
reconstruire effacerait leur lettrage.

### Factures
| Appel | Rôle |
| ----- | ---- |
| `GET /factures` | filtres `statut`, `recherche` (nom, matricule, n° de facture), `classe_id`, `annee_id` |
| `POST /factures` | `{ inscription_id }` — **409 si une facture active existe déjà** |
| `GET /factures/etudiant/:id` | |
| `GET /factures/etat/impayees` | `meta.total_impaye` porte la somme des soldes |
| `POST /factures/generation-auto` | facture toutes les inscriptions non encore facturées d'une classe |
| `PATCH /factures/:id/annuler` | `{ motif }` |

**Il n'y a pas d'`update`** : une facture ne se modifie pas, **elle s'annule**.

⚠️ Une réponse **vide de la génération automatique n'est pas un échec** : elle signifie que la
classe est déjà entièrement facturée. L'écran doit le dire ainsi.

### Paiements
| Appel | Rôle |
| ----- | ---- |
| `GET /paiements` | filtres `cycle`, `filiere_id`, `classe_id`, `mois` (`YYYY-MM`), `mode`, `statut`, `recherche` |
| `POST /paiements` | encaisse un versement |
| `GET /paiements/etudiant/:id` | |
| `GET /paiements/:id/recu` | le reçu |
| `PATCH /paiements/:id/annuler` | `{ motif }` |

**L'encaissement est une transaction complète côté serveur** : il impute le versement sur les
échéances impayées **les plus anciennes (FIFO)** — il peut en solder plusieurs, ou n'en solder
qu'une partie — puis émet le reçu dans la même transaction. La réponse porte :

| Champ | Ce qu'il dit |
| ----- | ------------ |
| `recu` | le reçu émis |
| `allocations` | ce qui a été imputé, échéance par échéance |
| `montant_non_impute` | le trop-perçu, qui **reste en avance** |

**L'annulation défait l'imputation** : le paiement passe à `ECHOUE` et **rouvre les échéances qu'il
soldait**.

`nature_paiement` est **facultatif** : le serveur le déduit du plan de l'étudiant. Le guichet
saisit un montant et un mode, pas une taxonomie.

### Rapports
| Appel | Rôle |
| ----- | ---- |
| `GET /rapports/kpi` | engagé, encaissé, reste, taux de recouvrement. Sans `annee_id`, l'année active ; avec, un exercice passé — ce dont « Archives » a besoin |
| `GET /rapports/bilan-filieres` | `{ filiere, attendu, percu, reste, taux, nb_etudiants }` |
| `GET /rapports/bilan-classes` | idem, avec l'effectif |
| `GET /rapports/encaissements-mensuels` | `{ nb_mois?, annee_id? }` |
| `GET /rapports/repartition-modes` | |
| `GET /rapports/situation/:etudiantId` | une ligne par inscription |
| `GET /rapports/dossier/:inscriptionId` | **le dossier complet en un appel** : dû ventilé, taux de règlement, `echeancier[]`, `paiements[]` |

## 4. Vocabulaire

### Modes de paiement — contrainte `paiements_all_mode_paiement_check`

| Code | Libellé |
| ---- | ------- |
| `ESPECE` | Espèces |
| `WAVE` | Wave |
| `ORANGE_MONEY` | Orange Money |
| `MOBILE_MONEY` | Mobile Money (autre) |
| `VIREMENT` | Virement bancaire |
| `CHEQUE` | Chèque |
| `CARTE_BANCAIRE` | Carte bancaire |
| `BOURSE` | Bourse |

⚠️ La maquette proposait « Wave / Orange Money » dans un même choix et « Espèces » en toutes
lettres ; **le serveur attend un code**. `code` part sur le réseau, `label` s'affiche.

### Natures de paiement (facultatif)
`INSCRIPTION` · `SCOLARITE_ANNUELLE` · `SCOLARITE_SEMESTRIELLE` · `SCOLARITE_MENSUELLE` ·
`SCOLARITE_TRANCHE` · `FRAIS_EXAMEN` · `FRAIS_ANNEXE`

### Périodicités d'un plan
| Code | Ce que c'est |
| ---- | ------------ |
| `ANNUEL` | un seul versement, à la rentrée |
| `SEMESTRIEL` | deux versements, un par semestre |
| `MENSUEL` | des mensualités égales |
| `TRANCHES` | une répartition libre en pourcentages (40/30/30…) |

### Assiette d'un plan
`TOTAL` (dû total : inscription + scolarité + examen) · `SCOLARITE` (scolarité seule).
Sans ce champ, « 40 % à l'inscription » est **ambigu — 40 % de quoi ?**

### Statuts d'échéance — calculés par `v_finance_echeances`
`PAYE` · `PARTIEL` · `EN_RETARD` · `EN_ATTENTE`.
**« En retard » l'emporte sur « partielle »** : une tranche entamée mais dépassée est d'abord un
retard.

### Statuts de facture et de paiement — **des libellés, pas des codes**

Le serveur renvoie ici `Payé`, `Partiel`, `Impayé`, `Annulée` (factures) et `Payé`, `En attente`,
`Échoué` (paiements) : `v_finance_factures` **calcule** le statut à partir des paiements. Les
filtres les renvoient tels quels. Ne pas les traduire en codes.

## 5. Les cinq stores

| Store | Fabrique | Ce qu'il porte |
| ----- | -------- | -------------- |
| `plans` | CRUD | gabarits, mis en cache (ils changent rarement, plusieurs écrans les lisent) |
| `echeanciers` | `run` propre | `echeances`, `traites`, `enRetard`, `resteDu` |
| `factures` | CRUD | `impayees`, `totalImpaye`, `totaux` ; `emettre`, `genererPourClasse(s)`, `annuler` |
| `paiements` | CRUD | `dernierRecu`, `dernieresAllocations` ; `encaisser`, `annuler`, `fetchRecu` |
| `rapports` | `run` propre | `kpi`, `bilanFilieres`, `bilanClasses`, `encaissementsMensuels`, `repartitionModes` |

Un échéancier **n'est pas un CRUD** : il se **génère** depuis un plan et un tarif, et ne se modifie
jamais ligne à ligne.

Le store `factures` hérite d'un `update` de la fabrique qui **n'a pas d'endpoint** : ne pas
l'appeler.

## 6. Pièges à reproduire

1. **Tous les montants arrivent en chaînes** (`"575000.00"`, type `NUMERIC`). Les additionner sans
   conversion **concatène des textes**. La conversion se fait à l'entrée du store — sans quoi
   `total_engage - total_encaisse` produit `NaN` et le graphique reste vide.
2. **La devise n'est pas « FCFA » en dur** : elle vient du paramètre `finances.devise_symbole`,
   réglable depuis l'écran Paramètres. Le repli est « FCFA », si bien que le **premier rendu est
   déjà juste**.
3. **L'imputation FIFO est côté serveur.** Ne pas la refaire côté client : afficher `allocations`
   et `montant_non_impute` tels qu'ils reviennent.
4. **L'annulation d'un paiement rouvre des échéances.** Le dire avant de confirmer.
5. **Régénérer un échéancier est refusé** dès qu'un paiement y est imputé.
6. **Une génération de factures qui ne produit rien est un succès.**
7. **409 sur une facture déjà active** — ce n'est pas une panne.
8. **403 sur une écriture** = habilitation, pas bug.
9. Les statuts sont des **libellés** côté serveur pour les factures et les paiements.

### Ce qu'était l'ancien module

L'ancien `api/finances/financeApi.js` déclarait un CRUD générique sur `/finances`, `/factures` et
`/frais_inscription` : **aucun de ces endpoints n'existait**. Le module finance du backend n'était
même pas monté. Les écrans ne s'en apercevaient pas : ils affichaient des tableaux codés en dur et
ne déclenchaient **aucun appel**.

## 7. Checklist de reconstruction

- [ ] Cinq collections : plans, échéanciers, factures, paiements, rapports
- [ ] Conversion des montants à l'entrée, devise lue dans les réglages
- [ ] Guichet d'encaissement : montant + mode, nature facultative ; affichage du reçu, des
      allocations et du trop-perçu
- [ ] Annulation avec motif, et avertissement sur la réouverture des échéances
- [ ] Génération d'échéancier depuis un plan ; refus explicite si des paiements sont imputés
- [ ] Facturation unitaire (409 possible) et automatique par classe (vide = déjà facturée)
- [ ] Rapports : KPI, bilans filière et classe, encaissements mensuels, répartition par mode
- [ ] Archives : les mêmes rapports avec `annee_id`
- [ ] Pagination partout (registre 7 497, factures 1 803, contrôle par classe 6 223)
- [ ] Montage paresseux des onglets — ce que la version actuelle ne fait pas encore
