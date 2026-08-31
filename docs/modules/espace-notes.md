# Espace de gestion des notes

> Un espace **à part**, ouvert dans sa propre fenêtre, avec sa propre session et sa propre garde.
> Il porte la chaîne complète : **saisie → vérification → validation → publication**.

| | |
| --- | --- |
| **Écrans** | 4 (connexion, tableau de bord, grilles, moyennes) |
| **URL de base** | `/espace-notes` |
| **Domaine backend** | `/api/evaluations` + `/api/academique` |
| **Dépendances** | `examens` (sessions, épreuves, bulletins) · `notes` (grille et bornes) · `structure-academique` — **cycle avec `notes`**, voir [ARCHITECTURE.md](../ARCHITECTURE.md) §2 |

## 1. Pourquoi un espace séparé

C'est un outil de **saisie**, utilisé par des rôles qui n'ont rien à faire dans le reste de
l'administration. Il s'ouvre dans une fenêtre minimale — sans en-tête ni menu de l'application —
et **tient sa propre session** : un enseignant y entre sans que la session de l'application, ouverte
dans l'autre fenêtre du même navigateur, soit touchée.

```js
FENETRE = {
  nom: 'espace-notes',
  options: 'popup=yes,width=1440,height=920,menubar=no,toolbar=no,location=no,status=no',
}
```

⚠️ `window.open` peut renvoyer `null` — bloqueur de fenêtres, ou navigateur qui refuse l'ouverture
hors geste utilisateur. **L'appelant doit le dire**, plutôt que de laisser croire que la fenêtre
s'est ouverte.

## 2. Routes et garde

| Chemin | Nom | Garde |
| ------ | --- | ----- |
| `/espace-notes/connexion` | `EspaceNotesConnexion` | publique |
| `/espace-notes` | `EspaceNotesTableauBord` | `exigerSessionEspace` |
| `/espace-notes/grilles` | `EspaceNotesGrille` | `exigerSessionEspace` |
| `/espace-notes/moyennes` | `EspaceNotesMoyennes` | `exigerSessionEspace` |

Toutes portent `meta: { public: true }`. **Ce n'est pas une ouverture** : c'est ce qui écarte la
garde générale, qui renverrait vers `Login` — l'écran de connexion de l'*application*, et donc la
mauvaise porte dans cette fenêtre. La protection est assurée route par route, par
`exigerSessionEspace`, qui renvoie vers `EspaceNotesConnexion` avec `?redirect=`.

Un **401** dans cette fenêtre renvoie lui aussi vers `EspaceNotesConnexion`, jamais vers `Login`.

## 3. Écrans

| Écran | Contenu |
| ----- | ------- |
| Tableau de bord | ses attributions, les sessions actives, ce qu'il reste à noter |
| Grilles de notes | contexte (classe → session → épreuve), grille, saisie, transitions |
| Moyennes & bulletins | moyennes de la classe, publication des bulletins |

Un `BandeauEtapes` rappelle en permanence où l'on en est dans la chaîne.

## 4. Le store de contexte, et pourquoi il existe

**Le serveur ne sait pas répondre à « quelles évaluations concernent cette classe ».** Une
évaluation appartient à un **module** et à une **session** (`evaluations.module_id`,
`evaluations.session_id`) ; le lien avec une classe passe par `ModuleClasse`.

La jointure se fait donc côté client, à partir de deux lectures qui, elles, existent :

| Appel | Ce qu'il rend |
| ----- | ------------- |
| `GET /academique/classes/:id/modules` | `v_modules_par_classe` — les modules enseignés |
| `GET /evaluations/evaluation` | toutes les évaluations, avec leur module et leur session |

### Et pourquoi la liste des étudiants aussi

`GET …/evaluations/:id/notes` ne renvoie que les étudiants **qui ont déjà une ligne de note**. Au
premier remplissage, elle est donc **vide** : personne n'apparaîtrait à l'écran.

L'effectif réel vient de `GET /academique/classes/:id/etudiants` (`v_etudiants_par_classe`,
restreint à l'année active) ; la saisie en lot crée ensuite les lignes manquantes, **par
matricule**.

C'est le point le plus facile à manquer dans une reconstruction : sans lui, l'écran de saisie est
inutilisable tant qu'une note n'a pas été saisie… par un autre moyen.

### État du store

| Membre | Rôle |
| ------ | ---- |
| `classes`, `sessions`, `evaluations`, `modules`, `etudiants` | les référentiels chargés |
| `classeId`, `sessionId`, `evaluationId` | le contexte choisi |
| `sessionsActives`, `classe`, `session`, `evaluation` | dérivés |
| `moduleIds` | l'ensemble des modules de la classe, pour filtrer les évaluations |
| `evaluationsClasse` | **la jointure** : les évaluations dont le module est enseigné dans la classe |
| `contexteIncomplet` | ce qui manque avant de pouvoir saisir |
| `fetchContexte`, `selectClasse`, `selectSession`, `selectEvaluation` | actions |

## 5. Rôles et capacités

Rôles concernés, tels que la base les écrit (`CHECK (role IN (…))`) :

| Rôle | Mission |
| ---- | ------- |
| `ENSEIGNANT` | saisit et corrige les notes |
| `GESTIONNAIRE` | vérifie la conformité des grilles |
| `SCOLARITE` | valide les notes vérifiées |
| `DIRECTEUR` | publie les notes validées |
| `ADMIN` | accès complet |

### Capacités — miroir du contrôleur backend

| Rôle | Capacités |
| ---- | --------- |
| `ENSEIGNANT` | `saisir` |
| `GESTIONNAIRE` | `saisir`, `verifier`, `renvoyer` |
| `SCOLARITE` | `saisir`, `verifier`, `valider`, `renvoyer`, `moyennes` |
| `DIRECTEUR` | `verifier`, `publier`, `moyennes`, `publier_bulletins` |
| `ADMIN` | toutes |

> Ce miroir sert à **ne pas afficher un bouton qui répondrait 403**. C'est du confort d'interface,
> **pas une sécurité** : l'espace peut être ouvert par n'importe qui à l'URL, le jeton décide.

## 6. Quatre étapes, trois statuts

**C'est le piège central de cet espace.** La colonne `statut` n'accepte que `SAISIE`, `VALIDEE` et
`PUBLIEE` : **la vérification n'est pas un état serveur.**

| Étape | Statut en base | Capacité | Rôle |
| ----- | -------------- | -------- | ---- |
| Saisie | `SAISIE` | `saisir` | Enseignant |
| **Vérification** | **aucun** | `verifier` | Gestionnaire |
| Validation | `VALIDEE` | `valider` | Scolarité |
| Publication | `PUBLIEE` | `publier` | Directeur |

La vérification est un **contrôle recalculé à chaque affichage** — complétude, bornes, doublons.
Il n'est pas stocké, et rouvrir la grille le rejoue.

Conséquence sur la formulation : on ne prétend pas qu'une grille « **a été** vérifiée ». On montre
si elle **est** conforme, ce qui est vérifiable à tout instant. La nuance n'est pas cosmétique :
prétendre le contraire ferait croire à une trace qui n'existe pas.

## 7. Ce que l'application principale a le droit d'afficher

`STATUTS_PUBLIABLES = ['VALIDEE', 'PUBLIEE']`. Une note en `SAISIE` n'a pas à sortir de cet espace.

## 8. Pièges à reproduire

1. **Portée de jeton distincte**, fixée au démarrage d'après l'URL, **avant tout appel réseau**.
2. **`meta.public` pour écarter la garde générale**, puis une garde locale route par route.
3. **La grille ne renvoie pas l'effectif** : le compléter depuis la classe.
4. **Quatre étapes, trois statuts** : ne pas inventer un statut « vérifiée ».
5. **Le miroir de capacités n'est pas une sécurité.**
6. `window.open` peut rendre `null` : le dire.

## 9. Checklist de reconstruction

- [ ] Fenêtre dédiée, dimensionnée, sans barre d'outils
- [ ] Session propre : clé de stockage distincte, connexion propre, 401 vers la bonne porte
- [ ] Cascade classe → session → épreuve, avec la **jointure via `ModuleClasse` côté client**
- [ ] Effectif de la classe fusionné avec la grille de notes
- [ ] Saisie en lot par matricule, rapport de rejets
- [ ] Bandeau d'étapes, avec la vérification présentée comme un **contrôle**, pas comme un état
- [ ] Boutons filtrés par capacité — sans se reposer dessus pour la sécurité
- [ ] Écran des moyennes et publication des bulletins, réservés aux capacités correspondantes
