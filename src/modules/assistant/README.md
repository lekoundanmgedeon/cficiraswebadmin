# Module Assistant IA

Écran `/assistant-ai`. Interroge `POST /api/assistant/question` : l'utilisateur
pose une question en français, le backend interroge un modèle de langage qui
écrit du SQL, l'exécute sous garde-fous et rédige une réponse.

## Ce qu'il remplace

Un écran de 416 lignes — conversation complète, historique, export, indicateur
de frappe — au-dessus d'un `setTimeout(1500)` qui poussait **une seule réponse
markdown codée en dur**, identique pour toute question. Il avait été réduit à un
état « aucun assistant n'est raccordé » listant trois prérequis. Les trois
existent désormais.

## Trois choses à savoir avant de modifier ce module

**Les appels sont lents par nature.** Le serveur interroge un modèle, puis
exécute une ou plusieurs requêtes SQL, en plusieurs tours : une seconde et demie
avec un fournisseur distant, davantage avec un modèle local. Seul
`GET /sante` est bon marché — c'est le seul à lancer au montage.

**Les requêtes SQL sont affichées, repliées.** Sur des chiffres qui engagent
l'établissement, pouvoir vérifier d'où sort un nombre n'est pas un luxe de
développeur : un modèle peut se tromper de vue ou de filtre sans que la phrase
produite trahisse quoi que ce soit. C'est ce qui sépare un assistant vérifiable
d'un oracle — ne retirez pas `AssistantRequetes.vue`.

**Le fil n'est pas rechargé.** Le backend journalise tout, mais
`GET /conversations` ne rend que des en-têtes. Afficher une conversation d'hier
montrerait des chiffres périmés — un effectif, un montant encaissé, un taux de
recouvrement changent. Mieux vaut reposer la question.

## Ce que l'utilisateur voit selon son rôle

Le cloisonnement est **côté serveur**, dans le catalogue de sources filtré par
`req.user.role`. Le frontend n'a rien à masquer : un rôle `PEDAGOGIE` ne verra
jamais une réponse financière, parce que le modèle ignore que ces vues existent
et que le garde SQL refuserait la requête.

La carte « Sources accessibles » affiche ce périmètre — utile pour comprendre
pourquoi une question reste sans réponse.

## Les réponses ne passent pas par un moteur markdown

Le prompt serveur demande des phrases, pas du balisage. Le texte est rendu tel
quel en `white-space: pre-wrap`. Interpréter du markdown sur une sortie de
modèle ouvrirait une injection HTML pour un gain nul.
