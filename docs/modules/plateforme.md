# Module `plateforme`

> **Les écrans sans backend.** Il n'y a rien à reconstruire ici — seulement à savoir pourquoi ils
> existent.

| | |
| --- | --- |
| **Écrans** | 4 |
| **Domaine backend** | aucun |
| **Dépendances** | aucune |

## 1. Ce que c'est

Ces écrans sont les derniers résidus de l'ancien `src/views/`. **Aucun n'était fonctionnel** :

- des démos de bibliothèques laissées en place ;
- un assistant répondant toujours la même chose ;
- de faux téléchargements ;
- la page d'un autre produit, recopiée.

Ils sont **conservés — leur besoin est réel** — mais leur contenu mensonger a cédé la place à un
**état explicite** : un composant `EcranSansBackend` qui dit ce qui manque, plutôt qu'une interface
qui fait semblant.

## 2. Écrans et routes

| Chemin | Nom | Titre |
| ------ | --- | ----- |
| `/administration` | `Administration` | Administration |
| `/documentation` | `Documentation` | Documents académiques |
| `/notification` | `Notifications` | Notifications |
| `/supports-cours` | `SupportsCours` | Supports de cours |

⚠️ Trois d'entre eux n'étaient **atteignables par aucune route** alors que la barre latérale y
menait : `/settings` et `/notification` tombaient sur la page « introuvable », et `/supports-cours`
n'était même pas lié. Les chemins déjà utilisés par le menu sont conservés tels quels — et
`/notification` reste **au singulier**, comme le lien du menu.

## 3. Ce qui a quitté ce module

| Écran | Où il est allé | Pourquoi |
| ----- | -------------- | -------- |
| `/settings` | [`parametres`](./parametres.md) | il a un backend depuis la migration `019` |
| `/assistant-ai` | [`assistant`](./assistant.md) | l'assistant existe |

C'est le mouvement attendu : **un écran quitte `plateforme` le jour où il a une source de données.**

## 4. Pour une reconstruction

Ne pas porter ces quatre écrans. Reproduire seulement le **principe** :

> Si l'endpoint n'existe pas, on affiche un état explicite — pas une interface qui fait semblant.

Et si l'un de ces besoins reçoit un backend, il devient un module à part entière, avec sa fiche.
