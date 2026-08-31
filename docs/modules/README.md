# Fiches de module

Une fiche par module, écrite pour être **suffisante à sa reconstruction**. Chacune suit le même
plan : rôle · écrans et routes · onglets · endpoints · vocabulaire · état et règles · pièges ·
checklist.

Lire d'abord [../RECONSTRUCTION.md](../RECONSTRUCTION.md) — il porte ce qui leur est commun — et
[../CONTRAT-API.md](../CONTRAT-API.md) pour les conventions du serveur.

## Par ordre de reconstruction

### Socle

| Fiche                                          | Écrans | Ce qu'elle couvre                                     |
| ---------------------------------------------- | ------ | ------------------------------------------------------- |
| [auth-et-session](./auth-et-session.md)        | 3      | connexion, inscription, garde, portées de jeton, rôles |
| [structure-academique](./structure-academique.md) | 5   | années, cycles, filières, niveaux, classes, semestres  |

### Scolarité

| Fiche                                | Écrans | Ce qu'elle couvre                                        |
| ------------------------------------ | ------ | ---------------------------------------------------------- |
| [inscriptions](./inscriptions.md)    | 1      | dossiers d'inscription, réinscriptions, imports, frais    |
| [etudiants](./etudiants.md)          | 1      | annuaire, imports d'étudiants et de tuteurs, statistiques |
| [scolarite](./scolarite.md)          | 2      | dossiers scolaires, pièces justificatives, parcours       |
| [matieres](./matieres.md)            | 1      | modules d'enseignement, composition pédagogique d'une classe |

### Évaluations

| Fiche                            | Écrans | Ce qu'elle couvre                                          |
| -------------------------------- | ------ | ------------------------------------------------------------ |
| [examens](./examens.md)          | 5      | sessions, épreuves, calendrier, salles, bulletins           |
| [notes](./notes.md)              | 2      | saisie des notes, circuit de validation, délibération       |
| [stats](./stats.md)              | 1      | statistiques de résultats, génération des bulletins         |
| [espace-notes](./espace-notes.md) | espace | la chaîne saisie → vérification → validation → publication |

### Argent et pédagogie

| Fiche                          | Écrans | Ce qu'elle couvre                                            |
| ------------------------------ | ------ | -------------------------------------------------------------- |
| [finances](./finances.md)      | 3      | plans, échéanciers, factures, encaissements, rapports         |
| [pedagogies](./pedagogies.md)  | 5      | formateurs, attributions, créneaux, maquette, emploi du temps |

### Le reste

| Fiche                              | Écrans | Ce qu'elle couvre                                        |
| ---------------------------------- | ------ | ---------------------------------------------------------- |
| [concours](./concours.md)          | 3      | éditions, épreuves, candidatures, classement, proclamation |
| [coordination](./coordination.md)  | 3      | thèmes et mémoires, soutenances, jurys, PV, finalistes    |
| [documents](./documents.md)        | 1      | guichet des documents administratifs                      |
| [bibliotheque](./bibliotheque.md)  | 1      | catalogue et dépôt académique                             |
| [dashboard](./dashboard.md)        | 1      | tableau de bord : effectifs et argent                     |
| [parametres](./parametres.md)      | 1      | réglages, comptes, notifications, journaux                |
| [assistant](./assistant.md)        | 1 + espace | assistant IA embarqué et espace de chat               |
| [plateforme](./plateforme.md)      | 4      | les écrans sans backend — **rien à reconstruire**         |

## Carte des dépendances

Mesurée le 31 août 2026 (la commande est dans [../ARCHITECTURE.md](../ARCHITECTURE.md) §2).

```
                       structure-academique  ◄──────────── presque tous
                          ▲   ▲   ▲   ▲   │
                          │   │   │   │   └──► matieres ──┐  (cycle 1)
        inscriptions ─────┘   │   │   ▲                   │
              ▲               │   │   └───────────────────┘
              │               │   └───── coordination ──► pedagogies ──► examens
         etudiants ◄──┐       │                                           ▲
              ▲       │       │                                           │
              │       │       │                                     stats ┘
         scolarite ───┘  (cycle 2)                                        ▲
              │                                                           │
              └──────► finances ──► etudiants   (cycle 3)     bibliotheque┘
                          ▲
                    dashboard

              notes ◄────────► espace-notes  (cycle 4)
                │                    │
                └──────► examens ◄───┘

  concours · documents · parametres — vers structure-academique (et etudiants) seulement
  assistant · plateforme — aucune dépendance sortante
```

### ⚠️ Quatre cycles entre modules

La règle du dépôt dit « jamais circulaires ». **Le code ne la respecte pas encore** :

1. `structure-academique ↔ matieres`
2. `etudiants ↔ scolarite`
3. `etudiants → scolarite → finances → etudiants`
4. `notes ↔ espace-notes`

**Aucun n'est un cycle d'imports ES** — les arêtes retour tombent sur des `constants.js` sans
import, ou sur des fichiers qui ne referment pas la boucle : le build se résout. Ce sont des
cycles **entre modules** : on ne peut plus retirer `scolarite` sans toucher `etudiants`.

Détail et pistes de dénouement dans [../ARCHITECTURE.md](../ARCHITECTURE.md) §2.

**Dans une reconstruction, ne pas les reproduire.** Deux se dénouent en remontant trois
énumérations partagées (`dossierInfo`, `sexeLabel`, `STATUTS_PUBLIABLES`) ; le troisième, en
laissant `finances` recevoir l'étudiant en propriété au lieu d'aller le chercher dans son store.
