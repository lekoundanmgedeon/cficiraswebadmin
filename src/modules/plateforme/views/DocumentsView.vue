<template>
  <div>
    <EnteteEcran
      titre="Documents académiques"
      sous-titre="Gestion des demandes de documents académiques"
      fil="Portail"
      courant="Étudiants"
    />

    <div class="row">
      <div class="col-md-12 grid-margin stretch-card">
        <EcranSansBackend
          titre="Aucune ressource « demandes de documents »"
          description="Le besoin est réel — attestations, relevés, duplicatas de diplôme — mais le serveur n'expose aucune route pour le porter."
          :attendus="ATTENDUS"
        >
          <template #action>
            <RouterLink to="/dossiers-scolaires" class="btn btn-outline-primary">
              <i class="mdi mdi-folder-account me-1"></i> Voir les pièces d'un dossier scolaire
            </RouterLink>
          </template>
        </EcranSansBackend>
      </div>
    </div>
  </div>
</template>

<script setup>
import { RouterLink } from 'vue-router';
import EnteteEcran from '../components/EnteteEcran.vue';
import EcranSansBackend from '../components/EcranSansBackend.vue';

/**
 * Documents académiques.
 *
 * L'écran d'origine annonçait la « gestion des demandes de documents » et
 * tenait pour tout état un tableau de… **factures**, vide, rempli après un
 * `setTimeout(1500)` — avec ce commentaire :
 *
 * ```js
 * factures.value = []; // Laisser vide pour tester l'affichage "Aucune donnée"
 * ```
 *
 * Le besoin, lui, est réel : la barre latérale portait `/demande-diplome`,
 * `/edition-diplome` et `/historique-diplome`, trois liens sans écran ni route.
 *
 * Côté serveur, `document.controller.js` existe et n'expose qu'une méthode,
 * `obtenirArchiveEtudiant` — **qu'aucune route ne monte**. Un contrôleur
 * orphelin de plus, dans la lignée de ceux relevés aux §1.6 et §1.9. La table
 * `compteurs_documents` porte 2 lignes, écrites par rien.
 *
 * Le seul geste réellement disponible aujourd'hui est la consultation des pièces
 * d'un dossier scolaire (§1.7), vers laquelle cet écran renvoie.
 */
const ATTENDUS = [
  'Une ressource « demandes de documents » : création, suivi, délivrance',
  "Le montage de `document.controller.js`, aujourd'hui sans route",
  'Un modèle de document délivrable (attestation, relevé, duplicata) et son compteur',
];
</script>
