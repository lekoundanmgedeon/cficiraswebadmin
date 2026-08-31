# Module `assistant`

> L'assistant IA, à deux endroits : **embarqué** dans les écrans métier (la question rapide sur ce
> qu'on a sous les yeux) et **l'espace de chat** (la conversation suivie, la relecture, l'audit).

| | |
| --- | --- |
| **Écrans** | 1 écran de plateforme + 4 onglets métier + un espace à part |
| **Domaine backend** | `/api/assistant` |
| **Dépendances** | aucune |

## 1. Écrans et routes

| Chemin | Nom | Coquille |
| ------ | --- | -------- |
| `/assistant-ai` | `AssistantAI` | l'application |
| `/espace-chat` | `EspaceChat` | **hors `DefaultLayout`**, onglet à part |
| `/espace-chat/c/:id` | `EspaceChatConversation` | idem |
| `/espace-chat/audit` | `EspaceChatAudit` | idem, **réservé ADMIN** |

Le chemin `/assistant-ai` est inchangé : il était porté par `modules/plateforme`, dont la vue
n'était qu'un état « aucun assistant n'est raccordé ».

⚠️ `c/:id` plutôt que `:id` : **sans segment fixe, « audit » serait d'abord lu comme un identifiant
de conversation.**

### L'espace de chat partage la session

C'est la **différence de fond avec l'espace de notes**. Celui-ci déclare ses routes publiques pour
écarter la garde générale et se protège ensuite lui-même : il a sa propre session et son propre
écran de connexion, vers lequel la garde générale ne saurait pas renvoyer.

L'espace de chat, lui, **partage la session de l'application** — c'est ce qui lui permet d'afficher
les conversations de l'utilisateur sans le faire se reconnecter. **Pas de `meta.public`, pas de
garde locale** : la garde générale fait exactement ce qu'il faut.

Il s'ouvre en **onglet** et non en popup : divergence assumée avec l'espace de notes. L'espace de
notes est un outil de saisie qu'on ferme après usage ; l'espace de chat est un lieu où l'on
revient, et dont on veut pouvoir garder l'URL, l'historique et les favoris du navigateur.

### La garde ADMIN de l'audit

Le rôle est **relu au besoin** : la connexion le renseigne, mais un rechargement de page vide le
profil en mémoire, et **un administrateur revenu par F5 se verrait refuser l'accès à son propre
journal**. `fetchCurrentUser` étant mis en cache cinq minutes, l'appel ne coûte rien la plupart du
temps.

Le serveur refuse de toute façon en 403 : **cette garde évite d'afficher un écran vide, elle ne le
remplace pas.**

## 2. Les quatre onglets métier

L'assistant embarqué vit aussi dans quatre onglets, chacun avec son **cadrage** :

| Écran | Cadrage |
| ----- | ------- |
| Semestres (structure académique) | `structure-academique` |
| Délibération | `examens` |
| Rapports d'examens | `examens` |
| Rapports financiers | `finances` |

## 3. Endpoints

| Appel | Rôle |
| ----- | ---- |
| `POST /assistant/question` | `{ question, conversationId?, cadrage? }` |
| `GET /assistant/conversations` | `limite` (défaut 20), `offset`, `q`, `archivees`, `cadrage` |
| `GET /assistant/conversations/:id` | le fil complet |
| `PATCH /assistant/conversations/:id` | `{ titre?, archivee? }` |
| `GET /assistant/audit` | **403 hors ADMIN** |
| `GET /assistant/audit/statistiques` | `{ jours }` — **403 hors ADMIN** |
| `GET /assistant/historique` | les dernières questions, tous fils confondus |
| `GET /assistant/sante` | fournisseur joignable, modèle présent, sources accessibles |
| `GET /assistant/catalogue` | les sources accessibles **à l'utilisateur courant** |

### ⚠️ Ces appels sont lents par nature

Le serveur interroge un modèle de langage, puis exécute une ou plusieurs requêtes SQL, **en
plusieurs tours**. Une seconde et demie avec un fournisseur distant, davantage avec un modèle
local.

**Aucun de ces appels ne doit être lancé au montage d'un écran** — sauf `GET /sante`, le seul bon
marché du lot, et le seul à lancer au montage : il permet d'afficher une indisponibilité **avant**
que l'utilisateur ait tapé sa question.

### La réponse à une question

```json
{ "data": { "conversationId": "…", "reponse": "…", "aboutie": true,
            "requetes": [{ "intention": "…", "sql": "…", "nbLignes": 12 }],
            "tours": 2, "dureeMs": 1480 } }
```

Les requêtes SQL exécutées sont **rendues visibles** : c'est ce qui permet de vérifier ce sur quoi
la réponse est fondée.

### Le cadrage

Il **nomme l'écran d'où part la question** — l'assistant est ouvert depuis quatre onglets, et « et
par filière ? » n'y a pas le même sens. Il **oriente la lecture du modèle** ; il **ne restreint
aucun droit** : le cloisonnement reste celui du catalogue filtré par rôle, côté serveur.

Un cadrage inconnu est **refusé en 400** plutôt qu'ignoré : la table côté client est le miroir de
`CADRAGES` côté serveur, et une clé ajoutée ici sans l'être là-bas casserait l'envoi.

| Clé | Libellé |
| --- | ------- |
| `structure-academique` | Structure académique |
| `scolarite` | Scolarité |
| `examens` | Examens |
| `finances` | Finances |
| `null` | **Général** — l'absence de cadrage, ce qu'envoie l'espace de chat |

### Pas de suppression de conversation

`assistant_echanges` est le **journal d'audit** du module. `{ archivee: true }` masque le fil, **la
trace reste**. `titre: null` rend au fil son titre par défaut.

Un `GET /conversations/:id` répond **404 si le fil n'existe pas *ou* s'il appartient à quelqu'un
d'autre** — le serveur confond volontairement les deux cas.

Le `titre` est celui que l'utilisateur a choisi, à défaut **la première question du fil** : le
backend n'en fait pas générer un par le modèle.

## 4. Deux stores, deux politiques de mémoire

### L'assistant embarqué — un store **par cadrage**

L'assistant vit dans quatre onglets. Un store unique leur ferait partager un seul fil : une
question sur les impayés apparaîtrait dans l'onglet des semestres, et surtout **les deux
conversations n'en feraient qu'une côté serveur**, chacune héritant du contexte de l'autre.

Chaque cadrage a donc son store, son fil et son `conversationId`. **Les définitions sont
mémorisées** : `defineStore` appelé deux fois avec le même identifiant rendrait deux fonctions pour
un seul état — de quoi croire à deux fils là où il n'y en a qu'un.

Le fil affiché est celui de la **session courante** : ce store ne rouvre aucune conversation
passée. Ce n'est pas une limite du backend, c'est le partage des rôles.

### L'espace de chat — un seul store, et un fil **daté**

L'espace n'affiche qu'une conversation à la fois — celle de l'URL. Un store unique suffit, et deux
instances y créeraient surtout le risque de voir un fil en écraser un autre.

**Le fil est rechargé, et daté.** L'assistant embarqué gardait son fil en mémoire sans le
recharger : rouvrir une conversation d'hier afficherait des chiffres périmés — un effectif, un
montant encaissé, un taux de recouvrement changent. Mais cette prudence-là condamnait
l'utilisateur à perdre tout ce qu'il avait demandé.

L'espace tranche autrement : le fil est rechargé, **chaque message rejoué porte `archive: true` et
son horodatage serveur**, et l'écran dit que les chiffres sont ceux de ce moment-là.

> **On restitue une trace, pas une vérité encore valable.**

Le fil rend les échanges dans l'ordre, **y compris ceux qui ont échoué** (ils portent `erreur`).

| Membre du store d'espace | Rôle |
| ------------------------ | ---- |
| `conversations`, `recherche`, `filtreCadrage`, `archivees` | la liste latérale, filtrée **côté serveur** |
| `messages`, `conversationId`, `titre`, `archivee`, `cadrage` | le fil courant |
| `sante`, `utilisable`, `raisonIndisponible` | l'état du module |
| `estVide`, `estRelecture`, `filExportable` | dérivés |
| `enCours`, `chargementListe`, `chargementFil` | trois drapeaux distincts |

⚠️ `archivees: true` **remplace** la liste par celle des fils rangés : c'est la corbeille, pas un
supplément.

## 5. Pièges à reproduire

1. **Ne rien appeler au montage sauf `GET /sante`.**
2. **Un store par cadrage** côté embarqué, un seul côté espace.
3. **Mémoriser les définitions de store** créées dynamiquement.
4. **Dater les messages rejoués** et le dire à l'écran.
5. **Le cadrage n'est pas un droit** : le cloisonnement est serveur.
6. **`c/:id`**, pas `:id`, sinon `audit` est lu comme un identifiant.
7. **Pas de suppression** : archivage.
8. **404 = inexistant ou pas à vous** — ne pas distinguer les deux dans le message.
9. **L'espace de chat partage la session** ; l'espace de notes non.
10. `window.open` peut rendre `null` : le dire, sinon le bouton « ne fait rien ».

## 6. Checklist de reconstruction

- [ ] Panneau embarqué réutilisable, un fil par cadrage
- [ ] Espace de chat en onglet, liste latérale filtrée côté serveur, fil relu et daté
- [ ] Affichage des requêtes SQL exécutées, avec leur intention et leur nombre de lignes
- [ ] Rendu Markdown des réponses, **avec échappement HTML**
- [ ] Export d'un fil
- [ ] État de santé affiché avant la première question
- [ ] Audit et statistiques réservés ADMIN, avec relecture du rôle après rechargement
- [ ] Archivage, renommage, titre par défaut restituable
