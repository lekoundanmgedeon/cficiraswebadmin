# Module `pedagogies`

> Les enseignants et ce qu'ils font : répertoire, attribution des cours, créneaux, maquette
> pédagogique, emploi du temps général. Cinq écrans — le plus gros module en nombre de fichiers.

| | |
| --- | --- |
| **Écrans** | 5 |
| **Sous-domaines** | `formateurs` · `attributions` · `crenaux` · `programme` · `emploi-du-temps` |
| **Domaine backend** | `/api/pedagogies` |
| **Dépendances** | `structure-academique` (classes, semestres) · `matieres` (modules) · `examens` (les salles) |

> ⚠️ **Le préfixe est `/pedagogies`, au pluriel.** L'ancien code visait `/pedagogie` (singulier),
> **un préfixe qui n'existe pas** : tous ses appels répondaient 404, et les écrans affichaient des
> tableaux codés en dur.

## 1. Écrans et routes

| Chemin | Nom | Titre |
| ------ | --- | ----- |
| `/enseignants` | `Formateur` | Formateurs |
| `/attribution-cours` | `AttributionsCours` | Attribution des cours |
| `/crenaux-horaires` | `CrenauxHoraire` | Créneaux & horaires |
| `/programmes-credits` | `ProgrammesCredits` | Programmes & crédits |
| `/schedule` | `EmploiDuTemps` | Emploi du temps |

La barre latérale pointait déjà vers `/schedule`, mais **aucune route ne portait ce chemin** : le
lien menait à la page « introuvable ».

## 2. Onglets

| Écran | Onglets |
| ----- | ------- |
| Formateurs | Formateurs · Assignations · Suivi pédagogique · Charges horaires · Rapports · Archives |
| Attribution des cours | Cours & Matières · Assignations · Ressources pédagogiques · Charges horaires · Rapports · Archives |
| Créneaux & horaires | Créneaux & Horaires · Emploi du temps · Rapports · Archives |
| Programmes & crédits | Programme des cours · Crédits académiques · Crédits ECTS · Résumé global |
| Emploi du temps | Par jour · Par cycle & filière |

> ⚠️ Un panneau **« Présences »** (`#presences`) existe dans l'attribution des cours, mais **aucun
> lien d'onglet n'y mène** : il est inatteignable. Ne pas le reconstruire sans lui donner une source.
>
> ⚠️ Les quatre premiers écrans utilisent encore les **onglets Bootstrap natifs** — tous les
> panneaux montés d'un coup. Seul `Emploi du temps` est sur le montage paresseux.

## 3. Endpoints

### Formateurs
| Appel | Rôle |
| ----- | ---- |
| CRUD `/enseignant/enseignants` | ressource REST à part entière — **segment doublé** |
| `GET /enseignant/enseignants/details/:id` | détail complet (vue enrichie) |
| `POST /enseignant/enseignants/:id/diplomes` | ajoute un diplôme |
| `GET /departement/departements` | pour le filtre et le formulaire |
| `GET /departement/departements/:id/enseignants` | |
| `GET /contrat/contrats` | types et rattachements |

Liste et détail passent par la vue `vue_infos_enseignants` (migration backend `006`), qui porte
département, contrat et spécialité en une ligne.

### Attributions
| Appel | Rôle |
| ----- | ---- |
| `GET /attribution/attributions` | toutes, avec leurs libellés (classe, matière, formateur) — **segment doublé** |
| `POST /attribution/attributions` | `{ module_id, classe_id, enseignant_id, semestre_id, heures }` |
| `DELETE /attribution/attributions/:id` | |

Affecte un module d'une classe à un enseignant, avec un volume horaire, dans `moduleclasse`. La
colonne `heures` et la vue `vue_attributions_cours` ont été ajoutées (migration `008`) : l'ancien
écran n'avait **aucun backend** et gérait ses assignations en mémoire.

### Créneaux
| Appel | Rôle |
| ----- | ---- |
| `GET /schedule/schedule/details` | tous les créneaux — **segment doublé** |
| `GET /schedule/schedule/details/:classe/:semestre` | la grille d'une classe |
| `POST /schedule` | `enseignant_id, module_id, salle_id, classe_code, type_cours, semestre_id, date, heure_debut, heure_fin` |
| `PUT /schedule/:id` · `DELETE /schedule/:id` | |

Ces routes répondaient **500** : ni la table `schedule` ni la vue `vue_horaire_details` n'existaient
(migration `007` les crée).

**Le backend dérive le `jour` de la `date`** saisie : le formulaire n'a qu'à envoyer la date.

### Maquette pédagogique
| Appel | Rôle |
| ----- | ---- |
| `GET /programme/maquette` | toutes les lignes |
| `POST /programme/maquette` | `classe_code, semestre, module_code, matiere, coefficient, ects, note_eliminatoire` |
| `PUT /programme/maquette/:id` · `DELETE …/:id` | |

L'ancien écran gérait ses « règles » **en mémoire** : aucune table n'existait. `maquette_pedagogique`
a été créée (migration `009`).

### Emploi du temps général
| Appel | Rôle |
| ----- | ---- |
| `GET /schedule/general` | filtres `anneeId`, `cycleId`, `filiereId`, `classeId`, `semestreId`, `jour` |

Lecture seule, transversale aux cycles, filières et classes. **À ne pas confondre avec `crenaux`**,
qui gère la *saisie*. Les colonnes de filtre viennent de `vue_horaire_details`, enrichie par la
migration `011` : avant elle, la vue ne portait que classe et semestre, et cet écran aurait dû
rapatrier tous les créneaux pour rejoindre les référentiels côté client.

## 4. Le piège des tableaux bruts

⚠️ **Les routes de `/pedagogies/schedule` répondent un tableau brut** — pas l'enveloppe
`{success, data}` du reste de l'API. Les stores concernés lisent donc le résultat directement.

C'est le seul endroit du projet où la convention de réponse ne s'applique pas. Vérifié en live
contre `localhost:3500`.

## 5. Vocabulaire

### Jours de la grille
⚠️ **Le backend stocke le jour en MAJUSCULES** (`'LUNDI'`), dérivé de la date. L'ancien écran
comparait à des identifiants en minuscules : **le rapprochement n'aurait jamais fonctionné**.

`LUNDI` · `MARDI` · `MERCREDI` · `JEUDI` · `VENDREDI` · `SAMEDI` — `id` porte la valeur servie,
`label` celle qu'on affiche.

### Types de cours
`CM` (cours magistral) · `TD` · `TP` · `EXAMEN`.

⚠️ **La colonne `schedule.type_cours` ne porte pas de contrainte `CHECK`** : tout autre libellé
reste possible et doit retomber sur un style neutre.

### Types de contrat
La base parle en codes (`CDI`, `CDD`, `VAC`) ; le répertoire distingue **Permanent** et
**Vacataire** (styles et filtre). Projection : `CDI → Permanent`, `VAC`/`CDD → Vacataire`, sinon
**« Non défini »** — la table `contrats` est quasi vide.

### Heures
`time` arrive en `'08:00:00'` : **les secondes n'apportent rien** sur une grille horaire et
allongent chaque cellule. Formater en `HH:MM`.

## 6. État et règles

Chaque sous-domaine a son store, tous à `run` propre sauf `formateurs` (CRUD).

| Store | Ce qu'il porte |
| ----- | -------------- |
| `formateurs` | `items` (projetés depuis `vue_infos_enseignants`), `departements`, `detail` |
| `attributions` | `assignments`, plus les référentiels attendus par le template |
| `crenaux` | `schedules` (projetés), `classes`, `salles`, `sallesMap`, `matiereFormateurs`, `semestreActifId` |
| `programme` | `rules` (lignes de maquette projetées), `ueDistribution` |
| `emploi-du-temps` | `filtres`, `creneaux`, et les getters `parJour`, `parCycleFiliereClasse`, `resume` |

**Les stores projettent les lignes serveur sur exactement les champs que les templates lisent** —
sans toucher au balisage hérité. C'est un choix de migration : remplacer la source de données sans
réécrire l'écran. Dans une reconstruction, la projection disparaît et le composant lit les champs
serveur directement.

⚠️ Plusieurs états portent encore des noms hérités de la maquette (`mockClasses`, `mockMatieres`,
`mockFormateurs`, `mockModules`) : **ce ne sont plus des données simulées**, ce sont les
référentiels réels. Ne pas reprendre ces noms.

## 7. Pièges à reproduire

1. **Le préfixe est au pluriel** — `/pedagogies`.
2. **Trois segments doublés** : `/enseignant/enseignants`, `/attribution/attributions`,
   `/schedule/schedule/details`. Le chemin simple répond 404.
3. **Les routes `schedule` rendent un tableau brut.**
4. **Le jour est en majuscules**, et dérivé de la date côté serveur.
5. **`type_cours` n'est pas contraint** : prévoir un style de repli.
6. **Un enseignant sans contrat** est « Non défini », pas « Vacataire ».
7. **Le panneau « Présences » n'a pas de lien** — et pas de source.
8. Les quatre premiers écrans ont encore les onglets Bootstrap : **tout est monté d'un coup**.

## 8. Checklist de reconstruction

- [ ] Cinq écrans, dont l'emploi du temps général en lecture seule
- [ ] Répertoire des formateurs : liste enrichie, détail, diplômes, filtre par département
- [ ] Attributions : module + classe + enseignant + semestre + heures
- [ ] Créneaux : saisie par date (le jour est dérivé côté serveur), salle, type de cours
- [ ] Maquette : coefficient, ECTS, note éliminatoire, par classe et semestre
- [ ] Emploi du temps : filtres à six axes, vue par jour et par cycle/filière
- [ ] Lecture directe du tableau pour les routes `schedule`
- [ ] Heures formatées en `HH:MM`, jours comparés en majuscules
- [ ] **Montage paresseux des onglets** (la version actuelle ne l'a pas)
- [ ] Pagination : une vingtaine de tableaux, 1 351 créneaux, 135 classes
