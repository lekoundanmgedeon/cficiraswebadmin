# Module `matieres`

> Les modules d'enseignement (UE) et leur rattachement aux classes, semestre par semestre.

| | |
| --- | --- |
| **Écrans** | 1, à deux onglets |
| **Domaine backend** | `/api/academique` |
| **Dépendances** | `structure-academique` (classes, semestres) |

L'écran existait depuis longtemps sous `views/matieres/`, mais **aucune route ne pointait dessus**
et aucun lien de menu n'y menait : il était strictement inaccessible.

## 1. Écran et route

| Chemin | Nom | Titre |
| ------ | --- | ----- |
| `/modules` | `Modules` | Modules d'enseignement |

## 2. Onglets

| Onglet | Contenu |
| ------ | ------- |
| Catalogue des modules | CRUD des UE |
| Composition pédagogique | les UE rattachées à un couple (semestre, classe) ; rattachement et détachement |

Modales : formulaire de module · assignation d'un module à une classe.

## 3. Endpoints

| Appel | Rôle |
| ----- | ---- |
| `GET /modules` | catalogue |
| `GET /modules/:id` · `POST` · `PUT` · `DELETE` | CRUD |
| `GET /modules/configuration/semestres` | les couples (semestre, classe) configurés |
| `GET /modules/configuration/details?semestreId&classeId` | les UE d'un couple — **les deux paramètres sont obligatoires** (400 sinon) |
| `DELETE /modules/configuration/detacher/:attributionId` | détache — l'identifiant est celui du **lien `ModuleClasse`**, pas du module |
| `POST /modules/assigner` | rattache un module à une classe pour un semestre — voir §5 |

⚠️ `GET /modules/configuration/details` **n'est pas un annuaire de modules** : c'est la composition
pédagogique d'une classe pour un semestre.

### Ce qui a été réparé côté backend

| Route | Ce qui était cassé |
| ----- | ------------------ |
| `GET /modules` | **n'existait pas** — 404, alors que la table contenait six modules |
| `POST /modules` | erreur SQL `42702` à chaque appel |
| `PUT /modules/:id` | écrivait dans une colonne `credits` **inexistante** |

## 4. Vocabulaire

**Longueurs maximales** : `code` ≤ 20, `designation` ≤ 150.

**L'enseignant est obligatoire** pour rattacher un module à une classe. Rien ne le laisse deviner :
le paramètre s'appelle `codeEnseignant`, il est accepté à `null`, et la requête répond 200. Mais la
fonction Postgres `assigner_module_a_classe` contient

```sql
SELECT id INTO v_enseignant_id FROM enseignants WHERE matricule = p_code_enseignant;
IF v_enseignant_id IS NULL THEN statut := 'ERREUR'; ... RETURN; END IF;
```

Les entités sont désignées par leur **code**, jamais par leur identifiant :
`{ codeModule, codeClasse, codeSemestre, codeEnseignant }`.

## 5. Le piège central : un 200 qui annonce un succès inexistant

`POST /modules/assigner` délègue à une fonction Postgres qui renvoie `{ statut, message }` **au
lieu de lever une exception**. Le contrôleur répond systématiquement **HTTP 200** avec
`success: true` et le message « Module assigné à la classe avec succès » :

```json
{ "success": true,
  "message": "Module assigné à la classe avec succès",
  "data": { "statut": "ERREUR",
            "message": "Module introuvable avec le code : NEXISTEPAS" } }
```

**Le vrai verdict est dans le corps**, pas dans le code HTTP. L'ancien store notifiait « Module
assigné avec succès » dans tous les cas, y compris lorsque rien n'avait été assigné.

La fonction connaît **trois** statuts, pas deux :

| Statut | Signification |
| ------ | ------------- |
| `SUCCES` | l'affectation est créée |
| `AVERTISSEMENT` | elle existait déjà — **rien n'est inséré** |
| `ERREUR` | module, classe, semestre ou enseignant introuvable |

Pire : le message d'erreur est construit par concaténation (`'…' || p_code_enseignant`), et **en
SQL une concaténation avec `NULL` vaut `NULL`** — l'échec peut remonter **sans le moindre
message**. D'où le libellé de repli côté front :

> « L'assignation a échoué. Vérifiez le matricule de l'enseignant, ainsi que les codes du module,
> de la classe et du semestre. »

## 6. État et règles

Store bâti sur `createCrudStore`. État additionnel : `configurations` (les couples semestre/classe),
`ues` (celles du couple consulté). Actions : `fetchConfigurations`, `fetchUes(semestreId,
classeId)`, `detachUe(attributionId, semestreId, classeId)`, `assignModule(data, contexte)`.

Après un détachement ou une assignation, le store **recharge la composition du couple courant** —
sans quoi l'écran afficherait un état antérieur à l'écriture.

## 7. Pièges à reproduire

1. **Lire `data.statut`**, jamais le code HTTP, sur `POST /modules/assigner`.
2. **Trois statuts**, dont un avertissement qui n'insère rien.
3. **Prévoir un message de repli** : le message serveur peut être `null`.
4. **L'enseignant est obligatoire** malgré une signature qui l'accepte à `null`.
5. **Les deux paramètres de `configuration/details` sont obligatoires.**
6. **Le détachement prend l'id du lien**, pas celui du module.
7. L'ancien store n'exposait **ni `modules` ni `fetchModules`**, pourtant lus par la vue :
   `filteredModules` valait `undefined` et l'écran levait un `TypeError` au montage. Personne ne
   l'a vu — aucune route n'y menait.

## 8. Checklist de reconstruction

- [ ] Catalogue CRUD, paginé
- [ ] Sélecteur de couple (semestre, classe) puis composition
- [ ] Assignation par **codes**, enseignant compris
- [ ] Lecture du verdict dans `data.statut` avec les trois niveaux et un message de repli
- [ ] Détachement par identifiant de lien, puis rechargement de la composition
- [ ] Longueurs maximales appliquées au formulaire
