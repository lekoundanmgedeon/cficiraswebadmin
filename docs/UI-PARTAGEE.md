# Le socle partagé et les motifs d'écran

Catalogue de `src/shared/` et des formes que tous les écrans répètent. Ces briques ne portent
**aucune logique métier** : c'est ce qui les rend transposables telles quelles dans une autre pile.

## 1. Composants

| Composant           | Rôle                                                                                                    |
| ------------------- | --------------------------------------------------------------------------------------------------------- |
| `AppTabs`           | Onglets à **montage paresseux**. Voir §1.1 — le composant le plus important du socle.                     |
| `PageHeader`        | Titre, sous-titre, fil d'Ariane, actions. Le dernier élément du fil est la position courante.             |
| `PageCard`          | Carte pleine largeur qui accueille le contenu d'un écran. Reprend le `row > col > card > card-body` que chaque vue recopiait. |
| `ItemActions`       | Menu d'actions d'une ligne, **piloté par une liste d'actions**. Une action marquée `confirm` ouvre une `ConfirmModal` et n'émet qu'après validation. |
| `ConfirmModal`      | Confirmation, pilotée par `v-model`. Accepte une condition bloquante — un motif de rejet obligatoire, par exemple. |
| `EmptyState`        | « Aucune donnée » : illustration, message, précision facultative sur *quoi faire* pour en sortir.         |
| `LoadingSpinner`    | `sm` en ligne (dans un bouton), `md` en bloc.                                                             |
| `ExportMenu`        | Le déroulant « Exporter » (Excel / PDF), qui accompagnait chacun des onze blocs d'export du projet.       |
| `Pagination`        | ⚠️ dans `src/components/shared/`, chemin historique. Barre de navigation + sélecteur de taille.          |

Chacun remplace une duplication mesurée : huit implémentations d'`ItemActions` (de 84 à 620 lignes,
déjà divergentes), une trentaine de blocs « aucune donnée » avec des `colspan` incohérents,
27 conteneurs d'onglets Bootstrap.

### 1.1 `AppTabs` — un onglet, une requête

Le balisage `data-bs-toggle="tab"` de Bootstrap rend **tous les panneaux dans le DOM d'un coup** et
se contente d'en masquer certains en CSS. Chaque onglet exécutait donc son `onMounted` — et ses
appels API — au chargement de la page, y compris ceux que l'utilisateur n'ouvrait jamais. **Une
page à cinq onglets déclenchait cinq séries de requêtes pour n'en afficher qu'une.**

`AppTabs` ne monte que l'onglet actif, et `KeepAlive` conserve ensuite ceux déjà visités : y
revenir ne relance ni le rendu ni les requêtes, et préserve l'état local (recherche, pagination).

```vue
<AppTabs :tabs="[
  { id: 'liste', label: 'Liste', component: ListeTab },
  { id: 'stats', label: 'Statistiques', component: StatsTab, props: { classeId } },
]" default-tab="liste" @change="onChange" />
```

**Deux pièges de `KeepAlive`, absorbés par le composant** — à reproduire dans toute pile qui
mémorise ses onglets :

1. **Un composant ne doit jamais transiter par un proxy réactif.** Dès que la liste d'onglets est
   construite dans un `computed`, Vue enveloppe les définitions qu'elle contient. Ce n'est pas
   qu'un avertissement de performance : le composant proxifié **casse le cache** de `KeepAlive`.
   D'où `toRaw` + `markRaw` à l'intérieur — les appelants n'ont rien à savoir de tout cela.
2. **Pas de `v-if` sur le `<component>` à l'intérieur du `KeepAlive`.** Condition fausse →
   `KeepAlive` reçoit un vnode *Comment* → `TypeError: parentComponent.ctx.deactivate is not a
   function`, et l'onglet cliqué ne s'affiche pas. La condition porte donc sur le `KeepAlive`
   lui-même.

> **Sept écrans utilisent encore les onglets Bootstrap natifs** : les quatre de `pedagogies` et
> les trois de `finances`. Leurs vues ont été déplacées sans toucher au balisage. C'est le
> principal gisement d'optimisation d'API restant — voir [DETTE-TECHNIQUE.md](./DETTE-TECHNIQUE.md).

## 2. Composables

### `usePagination(source, { perPage, resetKey })`

Pagination **en mémoire** d'une collection déjà chargée.

```js
const { page, itemsPerPage, paginated, startIndex, total, pageCount } = usePagination(filtrees, {
  perPage: 15,
  resetKey: () => [recherche.value, filtreCycle.value],
});
```
```html
<Pagination v-model="page" v-model:items-per-page="itemsPerPage" :total-items="filtrees.length" />
```

Deux garde-fous que les copies manuelles oubliaient :

- **le recadrage** : le total peut fondre sous les pieds de l'utilisateur (filtre, suppression,
  rechargement). Sans lui, la page courante pointe au-delà de la collection et le tableau apparaît
  vide alors qu'il contient des lignes ;
- **`startIndex`** : sans lui, chaque page renumérote ses lignes à partir de 1.

`resetKey` ramène en première page au changement de filtre.

### `useTableExport({ rows, title, fileBaseName, filters, sheetName })`

Onze composants répétaient la même triade : un `getExportData()` construisant des lignes, un
`exportXxxExcel()` et un `exportXxxPDF()` qui **redéclaraient la liste des colonnes** — souvent
désynchronisée, puisque les deux étaient maintenues à la main.

Ici les colonnes sont **dérivées des lignes** : elles ne peuvent plus diverger. L'appelant ne
fournit que la projection métier, sous forme d'objets `{ 'Nom de colonne': valeur }` ; l'ordre des
clés du premier objet donne l'ordre des colonnes.

### `useImportFile(schema)`

Dépôt, lecture SheetJS, validation ligne à ligne, aperçu et gabarit téléchargeable — paramétrés
par un **schéma** que chaque module garde chez lui :

```js
{
  columns: [...],        // colonnes du gabarit, dans l'ordre
  required: [...],       // colonnes dont la valeur est obligatoire
  example: { ... },      // ligne d'exemple du gabarit
  booleans: [...],       // colonnes attendues en oui/non
  validate(row) { … },   // contrôles propres au domaine — renvoie les erreurs trouvées
}
```

`validate` porte les règles que seule la base connaît : valeur dans une énumération, borne
numérique, date lisible. Sans elles, une contrainte `CHECK` remonte en erreur SQL brute, illisible
pour l'opérateur.

⚠️ Une colonne peut être **présente et vide** : `columns` décrit le contrat d'en-têtes exigé par le
serveur, `required` les valeurs obligatoires. Les deux listes diffèrent.

### `useSidebarRepli()`

Le repli de la barre latérale est **décidé par la largeur de la fenêtre**, plus par un bouton.
Trois défauts constatés justifiaient le changement : la barre du haut portait deux boutons dont un
sans gestionnaire ; l'état n'était pas rétabli au redimensionnement (replié sur un portable puis
rouvert sur un grand écran, on gardait une barre en icônes) ; et sur un portable il fallait de
toute façon replier à chaque visite. Une décision que l'application peut prendre seule n'a pas à
être demandée.

## 3. Utilitaires

| Fichier            | Ce qu'il porte                                                                                        |
| ------------------ | -------------------------------------------------------------------------------------------------------- |
| `date.js`          | Formats français. Une seule implémentation, qui échoue proprement — les dix copies divergeaient (`Invalid Date` ici, `-` là). |
| `text.js`          | `escapeHtml` (**indispensable avant tout `v-html`**), `escapeRegExp`, `highlight`, troncature au dernier espace. |
| `cache.js`         | Cache local à TTL, **clés préfixées** : on invalide un domaine d'un coup et on purge à la déconnexion sans toucher au jeton. `JSON.parse` sous garde. |
| `modal.js`         | Accès à l'API modale de Bootstrap, chargée en global par `index.html` donc non importable. Isole ce couplage et rend le code testable. |
| `remplissage.js`   | `nombre()`, seuils, palette, couleurs de taux. **Un seul jeu de bornes** pour que jamais une barre verte n'accompagne une alerte rouge. |
| `parametres.js`    | Les réglages de la plateforme, lisibles hors composant. Voir l'inversion de dépendance en [ARCHITECTURE.md](./ARCHITECTURE.md) §2. |
| `exportExcel.js`   | Génération XLSX. **Abrège le nom d'onglet à 31 caractères** — au-delà, `book_append_sheet` lève et le bouton ne produit aucun fichier : sept écrans étaient dans ce cas. |
| `exportPDF.js`     | Bannière, titre, filtres, tableau. L'identité de l'établissement vient des **réglages**, plus des pixels de la bannière. |
| `toast.js`         | Enveloppe `vue3-toastify`.                                                                             |

## 4. Notifications

`shared/stores/notificationStore` unifie les cinq fichiers de `stores/messages/`, qui offraient
trois chemins concurrents pour afficher la même erreur. Il expose `notifySuccess`, `notifyInfo`,
`notifyWarning` et `notifyError` — ce dernier acceptant **aussi bien une chaîne qu'une erreur**
(Axios, `ApiError` ou native).

C'est `createCrudStore.run()` qui l'appelle : **un composant ne notifie pas lui-même** le résultat
d'une action de store.

## 5. Les motifs d'écran

### 5.1 L'écran type

```
View (montée par le router)
├── PageHeader        titre · fil d'Ariane · actions globales
└── PageCard
    └── AppTabs       un onglet = un composant de tabs/
        └── Tab       filtres · tableau paginé · ExportMenu · EmptyState
└── FormModal         création / édition, pilotée par un composable use<Entité>Form
```

Quinze des vingt modules suivent exactement cette forme. C'est elle qu'il faut reproduire, pas le
détail du balisage Bootstrap.

### 5.2 Le composable de formulaire

Chaque entité éditable a son `composables/use<Entité>Form.js`, qui détient le formulaire, le mode
(création ou édition), l'ouverture et la fermeture de la modale.

Il existe parce que le bug qu'il évite s'est produit : **l'édition d'une année n'a jamais
pré-rempli son formulaire** — la modale lisait une variable de l'en-tête, tandis que la liste
écrivait dans la sienne. Cliquer « Modifier » ouvrait un formulaire de création.

### 5.3 La règle des trois lignes, dans un composant

1. **Un composant n'appelle jamais l'API directement.** Il passe par le store.
2. **Pas de `try/catch` autour d'une action de store** : elle a déjà notifié l'utilisateur. On
   teste sa valeur de retour — `undefined` signifie échec.
3. **Le formatage et les libellés ne vivent pas dans le composant** : dates via `shared/utils/date`,
   statuts via le `constants.js` du module.

### 5.4 Pas de bouton qui ment

> Si l'endpoint n'existe pas, ou si la donnée est fabriquée, **on retire l'élément d'interface**
> plutôt que d'entretenir l'illusion.

C'est ce qui a fait disparaître les boutons « Modifier » et « Supprimer » d'un étudiant (pas de
route), l'écran des absences (aucune route d'assiduité), le bouton « + Ajouter » des examens (il
visait une modale qui n'existait nulle part) et le taux d'assiduité des semestres (une constante
en dur côté serveur).

## 6. Pagination : ce qui est paginé, ce qui ne l'est pas

Toutes les listes longues passent par `usePagination` + `Pagination.vue`. Restent volontairement
sans pagination : le **parcours académique** (trois périodes au plus, dont les matières sont un
détail interne à chaque carte), le **profil** d'un dossier (un ou deux tuteurs), le **catalogue des
types de documents** (13 types en trois groupes), la **progression des travaux** (des agrégats, pas
une liste) et le sélecteur de soutenance des **procès-verbaux** (une liste déroulante ne se
pagine pas).

Deux découpages méritent l'attention, parce qu'un découpage naïf y aurait détruit du travail ou
menti :

- **Saisie des notes de concours** et **suivi des travaux** portent des saisies en cours. La
  pagination ne touche que l'affichage : les valeurs vivent dans un tableau (ou un brouillon)
  indexé par identifiant, l'enregistrement porte sur **toutes** les lignes modifiées, et le
  compteur signale celles qui ne sont plus sous les yeux.
- **Planning des soutenances** : les séances sont groupées par journée, mais une session tient
  couramment sur **une seule** (208 le même jour en démonstration). Paginer les journées n'aurait
  rien découpé : ce sont les séances qui le sont, et le regroupement porte sur la page — sans quoi
  une journée serait coupée sans jamais montrer sa suite. L'en-tête dit alors combien de séances
  sont visibles sur le total de la journée.

Recenser les tableaux non encore paginés :

```bash
for f in $(grep -rl "<table" src/modules --include=*.vue); do
  grep -q "Pagination" "$f" || echo "$f"
done
```
