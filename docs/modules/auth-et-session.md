# Authentification et session

> Connexion, inscription, garde de navigation, portées de jeton, rôles. Ce n'est pas encore un
> module de `src/modules/` : le noyau porte la logique (`core/auth/`, `core/router/`), et les deux
> vues restent dans `src/views/auth/`.

| | |
| --- | --- |
| **Écrans** | 3 (connexion, inscription, page introuvable) |
| **Domaine backend** | `/api/auth` |
| **Où vit le code** | `core/auth/` · `core/router/` · `src/views/auth/` · `src/routes/auth.routes.js` |

## 1. Écrans et routes

| Chemin | Nom | `meta` |
| ------ | --- | ------ |
| `/auth/login` | `Login` | `public: true` |
| `/auth/register` | `Register` | `public: true` |
| `/auth/new-password` | `NewPassword` | `public: true` — sert **le même composant que `Login`** |
| `/:pathMatch(.*)*` | `NotFound` | `public: true` |

## 2. Endpoints

| Appel | Rôle |
| ----- | ---- |
| `POST /auth/login` | `{ username, password }` → `{ data: { token, user } }` |
| `POST /auth/signup` | même forme de réponse |
| `POST /auth/logout` | |
| `GET /auth/user` | profil courant, **dans `data`** |
| `PUT /auth/profil` | son propre profil — voir la fiche [parametres](./parametres.md) |
| `PUT /auth/mot-de-passe` | son propre mot de passe |

## 3. Règles

### 3.1 On se connecte par `username`, jamais par `email`

`POST /auth/login` ne cherche l'utilisateur que par `username`. Le formulaire d'origine envoyait
`email` : **aucun compte n'était jamais trouvé**, d'où un « Identifiants incorrects » systématique.
Vérifié contre le backend — envoyer `username` seul fait progresser la requête jusqu'à la
comparaison bcrypt, `email` seul non.

### 3.2 Le jeton est dans `data`, pas à la racine

```json
{ "success": true, "message": "…", "data": { "token": "…", "user": { … } }, "meta": {} }
```

L'ancien code lisait `response.token` — un cran trop haut. Le jeton ressortait `undefined` et la
garde `if (!response.token)` faisait échouer la connexion **y compris sur une réponse 200
parfaitement valide**. Même décalage sur `GET /auth/user`.

### 3.3 Le rôle arrive en majuscules

Le backend renvoie `"ADMIN"`. Les prédicats de rôle le comparaient à `'admin'` : **tous
renvoyaient `false`**, y compris pour un administrateur. Normaliser en **un seul endroit**
(`userRole`), pas par un `.toLowerCase()` dupliqué partout.

### 3.4 Ordre de la déconnexion

```
1. appel serveur (son échec n'empêche pas la déconnexion locale)
2. clearToken()
3. clearAllCache()
4. reset du store
```

L'ordre compte : un `$reset()` réexécute l'état initial, dont le champ `token` est lu depuis le
stockage. **Purger le stockage après le reset ressusciterait le jeton.**

Et sans la purge du cache, les données de l'utilisateur sortant restent lisibles — et resservies au
suivant sur le même poste.

### 3.5 Le profil est mis en cache cinq minutes

`fetchCurrentUser(force)` ne rappelle le serveur que si le profil a plus de cinq minutes, ou si
`force`. Utile pour les gardes de route qui relisent le rôle après un rechargement de page : sans
cache, chaque navigation coûterait un aller-retour.

### 3.6 Pas de routeur dans une action de store

`fetchCurrentUser` appelait `useRouter()` à l'intérieur d'une action Pinia. `useRouter()` repose
sur `inject()` et ne fonctionne que dans un `setup()` : il renvoyait `undefined`, et la redirection
plantait **précisément dans le cas qu'elle devait traiter** — l'expiration du jeton.

La redirection sur 401 est du ressort de l'intercepteur HTTP, branché sur le routeur au démarrage.

## 4. La garde de navigation

> **Tout est protégé par défaut. Une route publique doit se déclarer `meta: { public: true }`.**

Un oubli ferme la porte au lieu de l'ouvrir. Les routes portaient `meta: { requiresAuth: true }`
mais **aucun `beforeEach` n'existait** : le drapeau n'était lu par personne, et une URL interne
tapée à la main s'ouvrait sans session.

Deux comportements :

1. non authentifié sur une route protégée → `Login` avec `?redirect=<url demandée>` ;
2. authentifié sur `Login` → renvoyé au tableau de bord.

## 5. Les deux portées de jeton

| Portée | Clé de stockage | Qui |
| ------ | --------------- | --- |
| `app` | `token` | l'application, et l'espace de chat |
| `espace-notes` | `token:espace-notes` | l'espace de gestion des notes |

La portée est fixée **une fois, au démarrage**, d'après l'URL de la fenêtre — avant tout appel
réseau. Chaque fenêtre ayant son propre contexte JavaScript, la valeur ne fuit pas d'un espace à
l'autre.

C'est ce qui permet à un enseignant d'ouvrir l'espace de notes sans toucher à la session de
l'application ouverte dans l'autre fenêtre : même navigateur, donc **même stockage local**.

Conséquence sur le 401 : la porte de sortie dépend de la fenêtre. Un 401 dans l'espace de notes
renvoie vers `EspaceNotesConnexion`, pas vers `Login` — y renvoyer afficherait l'application dans
une fenêtre qui n'en est pas une.

## 6. Les huit rôles

Miroir de la contrainte `users_role_check` et de `ROLES_AUTORISES` côté serveur :

| Code | Mission |
| ---- | ------- |
| `ADMIN` | accès complet, y compris paramètres, comptes et audit |
| `DIRECTEUR` | publie les notes validées, consulte les bilans |
| `SCOLARITE` | dossiers, inscriptions, validation des notes |
| `PEDAGOGIE` | enseignants, attributions, emplois du temps |
| `C_CYCLE` | suivi pédagogique d'un cycle |
| `FINANCES` | encaissements, factures, recouvrement |
| `ENSEIGNANT` | saisit et corrige les notes de ses cours |
| `GESTIONNAIRE` | vérifie la conformité des grilles, gère les imports |

> **Le cloisonnement est celui du serveur.** Les miroirs côté client ne servent qu'à ne pas
> afficher un bouton qui répondrait 403.

## 7. Checklist de reconstruction

- [ ] Connexion par `username` — jamais par `email`
- [ ] Lire le jeton et le profil dans `data`
- [ ] Normaliser le rôle en un seul point
- [ ] Garde « protégé par défaut », avec mémorisation de la destination
- [ ] Deux portées de jeton, fixées au démarrage d'après l'URL
- [ ] 401 → purge session **et** cache, puis redirection vers la connexion **de l'espace courant**
- [ ] Déconnexion : jeton puis cache puis reset, dans cet ordre
- [ ] Profil en cache 5 min, avec `force` pour les gardes qui relisent le rôle
- [ ] Ne jamais appeler le routeur depuis une action de store
