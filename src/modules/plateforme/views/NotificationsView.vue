<template>
  <div>
    <EnteteEcran
      titre="Notifications"
      sous-titre="Messages et alertes de la plateforme"
      fil="Plateforme"
      courant="Notifications"
    />

    <div class="row">
      <div class="col-md-12 grid-margin stretch-card">
        <EcranSansBackend
          titre="Aucun service de notification"
          description="Les tables existent en base mais rien ne les écrit, et aucune route ne les expose."
          :attendus="ATTENDUS"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import EnteteEcran from '../components/EnteteEcran.vue';
import EcranSansBackend from '../components/EcranSansBackend.vue';

/**
 * Notifications.
 *
 * Le fichier d'origine faisait **une ligne** — `<template></template>` — donc
 * un composant sans élément racine, qui ne rendait rien et faisait échouer le
 * lint (§2.3). La barre latérale pointait pourtant vers `/notification`, un
 * chemin **déclaré nulle part** : le lien menait à la page « introuvable ».
 *
 * Vérifié côté serveur : ni route, ni contrôleur, ni modèle de notification. Les
 * tables `notifications` et `historique_notifications` existent et sont **toutes
 * deux vides**.
 *
 * C'est aussi ce qui manque au bouton « Relancer » du tableau de bord (§1.18),
 * qui annonçait l'envoi d'une mise en demeure par SMS sans rien envoyer.
 */
const ATTENDUS = [
  'Une ressource de notifications : liste, marquage comme lu, suppression',
  'Un producteur qui les écrive (échéance dépassée, dossier validé, note publiée)',
  "Un canal de sortie, si l'envoi par SMS ou courriel est attendu",
];
</script>
