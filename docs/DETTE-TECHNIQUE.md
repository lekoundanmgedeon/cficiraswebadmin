# Dette technique

Recomptée le **31 août 2026**, branche `refactor-main`. Chaque chiffre de ce document est
reproductible par la commande qui l'accompagne — les recompter avant d'y toucher, plutôt que de
faire confiance à cette page.

État de santé : `npm run lint` **0 erreur**, 234 avertissements · `npm test` **494 tests**,
68 fichiers, 1 ignoré · `npm run build` **OK**.

## 1. Onglets Bootstrap encore en montage simultané — **7 écrans**

C'est le **principal gisement d'optimisation d'API restant**. Le balisage `data-bs-toggle="tab"`
rend tous les panneaux dans le DOM d'un coup : chaque onglet exécute son `onMounted` — et ses
appels réseau — au chargement de la page, y compris ceux que l'utilisateur n'ouvrira jamais.

| Module | Fichier | Onglets |
| ------ | ------- | ------- |
| `finances` | `paiements/components/PaiementTab.vue` | 5 |
| `finances` | `facturations/components/FacturationTab.vue` | 3 |
| `finances` | `rapports/components/RapportTab.vue` | 5 |
| `pedagogies` | `formateurs/components/PedagogieTab.vue` | 6 |
| `pedagogies` | `attributions/components/AttributionTab.vue` | 6 |
| `pedagogies` | `crenaux/components/CrenauHoraireTab.vue` | 4 |
| `pedagogies` | `programme/components/ProgrammeTab.vue` | 4 |

Leurs vues ont été déplacées vers `src/modules/` **sans toucher au balisage** : la bascule sur
`AppTabs` reste à faire.

```bash
grep -rl 'data-bs-toggle="tab"' src --include=*.vue
```

> ⚠️ La commande rend **9**, pas 7. Deux faux positifs : `shared/components/AppTabs.vue` et
> `dashboard/components/DashboardTabs.vue` ne font que **mentionner** la chaîne dans leur
> documentation — ce sont précisément les composants qui la remplacent. **Ne pas compter un fichier
> sans l'ouvrir.**

## 2. Tableaux non paginés — **40 fichiers**

```bash
for f in $(grep -rl "<table" src/modules --include=*.vue); do
  grep -q "Pagination" "$f" || echo "$f"
done
```

| Module | Fichiers |
| ------ | -------- |
| `pedagogies` | 15 |
| `finances` | 5 |
| `concours` | 4 |
| `dashboard` | 3 |
| `structure-academique`, `stats`, `scolarite`, `inscriptions`, `examens`, `espace-notes` | 2 chacun |
| `matieres` | 1 |

⚠️ **Tous ne sont pas de la dette.** Cinq écrans sont volontairement sans pagination (parcours
académique, profil d'un dossier, catalogue des types de documents, progression des travaux,
sélecteur de soutenance) — voir [UI-PARTAGEE.md](./UI-PARTAGEE.md) §6. Ouvrir chaque fichier avant
de conclure.

## 3. Composant orphelin

`finances/rapports/components/tabs/RapportEcheance.vue` n'est importé **que par son propre test**.
Il n'est branché sur aucun onglet.

```bash
grep -rn "RapportEcheance" src/ | grep -v "RapportEcheance.vue:"
```

À trancher : le brancher dans `RapportTab.vue`, ou le supprimer avec son test.

## 4. Panneau inatteignable

`pedagogies/attributions/components/AttributionTab.vue` déclare un panneau `#presences` et monte
`PresencesContent`, mais **aucun lien d'onglet n'y mène** : les six liens visent les six autres
panneaux.

`PresencesContent.vue` fait 21 lignes. À trancher : lui donner un onglet **et une source de
données**, ou le supprimer. Rappel : aucune route d'assiduité n'existe côté backend.

## 5. Bloc `<style scoped>` recopié — **11 fichiers**

Le bloc `.drag-drop-area` est répété à l'identique.

```bash
grep -rl 'drag-drop-area' src --include=*.vue
```

**10 fichiers** contiennent par ailleurs une règle `body { … }` **dans un style scoped, donc sans
aucun effet** : un sélecteur global qu'un style *scoped* ne peut pas atteindre.

```bash
grep -rlE '^\s*body\s*\{' src --include=*.vue
```

## 6. Noms hérités de la maquette

Plusieurs états de `pedagogies` portent encore des noms de données simulées — `mockClasses`,
`mockMatieres`, `mockFormateurs`, `mockModules`, `mockRules` — alors qu'ils contiennent désormais
**les référentiels réels**. Le nom ment sur le contenu.

À renommer avec les composants qui les lisent.

## 7. Quatre cycles entre modules

La règle du dépôt dit « entre modules, les dépendances sont dirigées et déclarées — **jamais
circulaires** ». Relevé le 31 août 2026, **le code ne la respecte pas encore** :

| Cycle | Arête retour |
| ----- | ------------ |
| `structure-academique ↔ matieres` | `semestre/.../UesSemestreTab.vue` monte `matieres/components/AssignationModal.vue`, qui importe `structure-academique/classe/store` |
| `etudiants ↔ scolarite` | `etudiants` lit `scolarite/constants` (`dossierInfo`) ; `scolarite` lit `etudiants/store` et `etudiants/constants` (`sexeLabel`) |
| `notes ↔ espace-notes` | `notes` lit `espace-notes/constants` (`ouvrirEspaceNotes`, `STATUTS_PUBLIABLES`) ; `espace-notes` lit `notes/note/store` et `notes/constants` |
| `etudiants → scolarite → finances → etudiants` | `finances/paiements/.../SuiviEtudiant.vue` importe `etudiants/store` |

```bash
for d in src/modules/*/; do m=$(basename $d)
  echo "$m → $(grep -rhoE "@/modules/[a-z-]+" $d --include=*.vue --include=*.js \
    | sort -u | grep -v "@/modules/$m$" | sed 's|@/modules/||' | tr '\n' ' ')"
done
```

**Aucun n'est un cycle d'imports ES** : les arêtes retour tombent sur des `constants.js` sans
import, ou sur des fichiers qui ne referment pas la boucle. Le build se résout, rien ne casse
aujourd'hui. Mais ce sont bien des cycles **entre modules** : on ne peut plus retirer `scolarite`
sans toucher `etudiants`.

Pistes de dénouement, par ordre de coût :

1. **`etudiants ↔ scolarite`** et **`notes ↔ espace-notes`** : les deux arêtes retour ne portent
   que des **libellés** (`dossierInfo`, `sexeLabel`, `STATUTS_PUBLIABLES`, `ouvrirEspaceNotes`).
   Les remonter dans un `constants` partagé du domaine, ou dupliquer sciemment trois libellés.
2. **`etudiants → scolarite → finances → etudiants`** : `SuiviEtudiant.vue` va chercher l'étudiant
   dans son store. Le recevoir en propriété rompt l'arête.
3. **`structure-academique ↔ matieres`** : la plus structurante. L'onglet « UE du semestre » monte
   une modale d'un autre module. Soit la modale déménage, soit l'onglet reçoit ses classes en
   propriété plutôt que d'en importer le store depuis `matieres`.

## 8. Ce qui reste de l'ancienne arborescence

| Chemin | Contenu | Sort |
| ------ | ------- | ---- |
| `src/views/auth/` | `Login.vue`, `Register.vue` | à migrer vers un module `auth` |
| `src/views/errors/` | `NotFound.vue` | idem |
| `src/routes/auth.routes.js` | routes publiques + `NotFound` | idem |
| `src/stores/messages/` | 5 fichiers | pont vers `shared/stores/notificationStore` |
| `src/utils/` | `exportExcel`, `exportPDF`, `toast` | ré-exports vers `shared/utils/*` |
| `src/components/` | `BasIcon.vue`, `ItemActions.vue`, `SkeletonLoader.vue`, `shared/ItemDetails.vue`, `shared/itemAction.vue` | doublons de `shared/components/` ; vérifier les appelants puis supprimer |
| `src/components/partials/` | `sidebar`, `header`, `footer` | à ranger sous `layouts/` |
| `src/components/shared/Pagination.vue` | **le** composant de pagination | **reste** — ou déménage dans `shared/components/` avec ses appelants |

Les couches `src/api/` et `src/stores/academiqueStore/` ont été **supprimées** : elles n'existent
plus.

## 9. Alias `@deprecated` sans appelant

Les six stores de `structure-academique` exposent encore des alias (`cycles` ↔ `items`,
`fetchCycles()` ↔ `fetchAll()`, `anneesAcademiques`, `anneeAcademique`, `fetchAnneesAcademiques()`,
`fetchCurrentAnnee()`) pour des vues qui **n'existent plus**.

Les stores `concours` et `examens/session` portent le même genre d'alias (`concoursList`,
`sessions`).

```bash
grep -rn "@deprecated" src/modules
```

À supprimer au prochain passage, après vérification des appelants.

## 10. Avertissements de lint — 234

| Règle | Nombre |
| ----- | ------ |
| `vue/attributes-order` | 194 |
| `vue/require-explicit-emits` | 9 |
| `vue/multi-word-component-names` | 9 |
| `vue/require-default-prop` | 5 |
| `vue/one-component-per-file` | 5 |
| `vue/attribute-hyphenation` | 2 |
| `vue/no-v-html` | 1 |
| `vue/block-order` | 1 |

**197 sont corrigeables automatiquement** (`npm run lint:fix`) — essentiellement l'ordre des
attributs. Les autres méritent d'être regardées :

- **`vue/require-explicit-emits` (9)** : un composant qui émet un événement non déclaré. C'est le
  bug qui a déjà mordu (`AnneeItemActions` émettait `edit` et `add` sans les déclarer).
- **`vue/no-v-html` (1)** : à vérifier — l'échappement doit passer par `shared/utils/text.js`.

## 11. Questions ouvertes pour le backend

Aucune n'est bloquante ; toutes réduiraient du code de contournement côté front.

1. **Harmoniser les deux vocabulaires de statut d'année.** `/annees` sert
   `OUVERTE`/`PLANIFIEE`/`CLOTUREE`, `/annees/history` sert
   `active`/`en_preparation`/`terminee`/`archivee`. Le front absorbe l'écart dans un seul fichier.
2. **Exposer `types_concours`.** Les sept types sont figés côté front, faute d'endpoint : un
   huitième ajouté en base serait invisible.
3. **Corriger les trois vues à fan-out** (`v_organisation_filieres`, `v_organisation_cycles`,
   `v_dashboard_global_classe`). Le front recompose leurs agrégats depuis des vues saines ; les
   corriger rendrait quatre endpoints directement utilisables.
4. **Retirer les chiffres inventés** de `/semestres/analytics/dashboard` : un `92.4` en dur et un
   `RANDOM()` valent moins qu'un champ absent.

## 12. Corrigé pendant la refonte

Pour mémoire — chacun de ces bugs était en production. Les plus structurants sont désormais
verrouillés par un test (`core/`, `shared/` et les pièges de chaque module).

| Anomalie | Où |
| -------- | -- |
| **La connexion ne pouvait pas aboutir** : le jeton était lu un cran trop haut (`response.token` au lieu de `response.data.token`), la garde faisait donc échouer le login **même sur une réponse 200 valide** | `core/auth/authStore.js` |
| **Le formulaire envoyait `email`** alors que le serveur ne cherche que par `username` : aucun compte n'était jamais trouvé | `views/auth/Login.vue` |
| Le rôle arrive en majuscules, les prédicats comparaient à des minuscules : **`isAdmin` renvoyait toujours `false`** | `core/auth/authStore.js` |
| À la déconnexion, `$reset()` était appelé **avant** `clearToken()` : le jeton était ressuscité juste après avoir été effacé | `core/auth/authStore.js` |
| Le cache n'était pas purgé à la déconnexion : les données d'un utilisateur restaient lisibles par le suivant | `core/auth/authStore.js` |
| `signupUser` appelait `notifyError` sans l'avoir déclaré → **`ReferenceError` à chaque échec d'inscription** | `core/auth/authStore.js` |
| `fetchCurrentUser` appelait `useRouter()` dans une action Pinia → `undefined`, la redirection plantait **précisément à l'expiration du jeton** | `core/auth/authStore.js` |
| `post(url, data)` ignorait sa configuration : les en-têtes `multipart/form-data` des imports n'étaient **jamais transmis** | `core/api/httpClient.js` |
| **Aucun `beforeEach`** : `meta.requiresAuth` n'était lu par personne, toute URL interne s'ouvrait sans session | `core/router/guards.js` |
| L'édition d'une année **n'a jamais pré-rempli son formulaire** : modale et liste écrivaient dans deux variables différentes | `composables/useAnneeForm.js` |
| Une modale annonçait « créée avec succès » puis se fermait après 1,2 s **sans vérifier que l'enregistrement avait réussi** | `AnneeFormModal.vue` |
| `JSON.parse` sans garde dans le cache : une entrée corrompue faisait remonter une `SyntaxError` jusqu'au composant | `shared/utils/cache.js` |
| Un nom d'onglet Excel au-delà de 31 caractères **fait échouer l'export** : sept écrans étaient dans ce cas | `shared/utils/exportExcel.js` |
| Deux pièges de `KeepAlive` : composant proxifié (cache cassé) et `v-if` interne (`TypeError`, l'onglet ne s'affichait pas) | `shared/components/AppTabs.vue` |
| Code mort : `routes/main.js` (copie exacte), `style1.css` (520 Ko jamais référencé), 5 fichiers `sample*.vue`, `result.js`, puis toute la couche `src/api/`. **25 493 lignes supprimées** | — |

Les corrections apportées **au backend** sont listées dans [CONTRAT-API.md](./CONTRAT-API.md) §10.
