<template>
  <div>
    <EnteteEcran
      titre="Supports de cours"
      sous-titre="Dépôt et diffusion des documents pédagogiques"
      fil="Portail"
      courant="Supports"
    />

    <div class="row">
      <div class="col-md-12 grid-margin stretch-card">
        <EcranSansBackend
          titre="Aucune ressource « supports de cours »"
          description="La table existe en base mais elle est vide, et aucune route ne l'expose : ni dépôt, ni liste, ni téléchargement."
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
 * Supports de cours.
 *
 * L'écran d'origine listait **les fichiers de démonstration du thème** —
 * `Doodle_templatemonster.jpg`, `Chart2_recovered.psd`, `Hound-Thumb2-1.png`,
 * tous datés de 2015 et pesant exactement « 24,555 KB ». Son bouton de
 * téléchargement se contentait d'un
 *
 * ```js
 * alert(`Downloading ${file.name}`);
 * ```
 *
 * Il mélangeait par ailleurs `<script setup>` et `<script>` Options API dans le
 * même fichier, le premier n'important qu'un composant de squelette.
 *
 * Il n'était **atteignable par aucune route**, et aucun lien de menu n'y menait :
 * l'écran était en pratique inaccessible.
 *
 * Côté serveur, la table `support_de_cours` existe, elle est **vide**, et aucune
 * route ne la touche.
 */
const ATTENDUS = [
  'Une ressource « supports de cours » : dépôt, liste, téléchargement, suppression',
  'Un rattachement au module et à la classe, pour savoir qui voit quoi',
  'Un stockage de fichiers — le dépôt de pièces du dossier scolaire attend déjà un chemin serveur, pas un envoi (§1.7)',
];
</script>
