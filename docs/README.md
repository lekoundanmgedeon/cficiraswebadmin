# Documentation de la plateforme ERP académique

Cette documentation décrit le frontend Vue.js 3 de la plateforme ERP académique développé dans le projet `cficiraswebadmin`.

Elle se base exclusivement sur l'analyse du code source présent dans le dépôt, sans extrapoler de fonctionnalités non codées.

## Structure du dossier

- `01-presentation-generale.md` : présentation générale de la plateforme.
- `02-architecture-fonctionnelle.md` : découpage métier et domaines fonctionnels.
- `03-architecture-frontend-vue.md` : organisation Vue.js, routeur, stores, services.
- `04-cartographie-des-menus.md` : cartographie des menus et des routes.
- `05-roles-et-permissions.md` : rôles, permissions et état actuel du contrôle d'accès.
- `06-modules-metier.md` : documentation détaillée par module.
- `07-workflows-metier.md` : workflows métier observables.
- `08-cas-utilisation.md` : cas d’utilisation structurés.
- `09-api-et-integration-backend.md` : services API détectés et leurs endpoints.
- `10-composants-ui.md` : composants principaux et leur rôle.
- `11-regles-metier.md` : règles métier identifiées dans le code.
- `12-parcours-utilisateurs.md` : parcours utilisateurs principaux.
- `13-points-a-confirmer.md` : questions et zones à clarifier.

## Comment lire cette documentation

1. Commencez par `01-presentation-generale.md` pour comprendre le périmètre global de la plateforme.
2. Lisez `02-architecture-fonctionnelle.md` puis `03-architecture-frontend-vue.md` pour comprendre l’organisation du code.
3. Consultez `04-cartographie-des-menus.md` pour repérer les routes et menus disponibles.
4. Explorez les modules métier dans `06-modules-metier.md`.
5. Passez aux workflows et cas d’utilisation pour visualiser les scénarios métier.
6. Vérifiez les points incomplets ou les écarts entre le menu et le routeur dans `13-points-a-confirmer.md`.

## Version du projet documenté

- Projet : `cficiraswebadmin`
- Version npm : `0.0.0` (package.json)
- Documentation basée sur l’analyse du code au 2026-07-07.
