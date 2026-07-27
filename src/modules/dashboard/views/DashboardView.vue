<template>
  <div>
    <div class="row">
      <DashboardHeader @rafraichir="rafraichir" @ouvrir-rapports="ouvrirRapports" />
    </div>

    <div class="row">
      <div class="col-md-12 grid-margin stretch-card">
        <div class="card">
          <div class="card-body dashboard-tabs p-0">
            <!--
              Le `key` force un remontage quand l'en-tête demande un onglet
              précis : `AppTabs` ne pilote son onglet actif que par `defaultTab`,
              lu au premier rendu. Le coût est le cache `KeepAlive` des onglets
              déjà visités, perdu à cette occasion — acceptable pour un geste
              explicite et rare, et sans commune mesure avec le montage eager des
              cinq panneaux qu'il remplace.
            -->
            <DashboardTabs :key="`${cle}-${ongletDemande}`" :default-tab="ongletDemande" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import DashboardHeader from '../components/DashboardHeader.vue';
import DashboardTabs from '../components/DashboardTabs.vue';

/**
 * Tableau de bord.
 *
 * L'ancien écran (`views/dashboard/`, 10 fichiers, 1 852 lignes) n'émettait
 * **aucune requête** : ses quatre KPI étaient écrits en dur dans les templates,
 * ses graphiques portaient des séries fixes, et ses tableaux servaient les
 * données de démonstration du thème Bootstrap — « Jeremy Ortega », « $790 »,
 * en dollars, dans une application scolaire libellée en FCFA.
 *
 * Sa vue racine déclarait par ailleurs `v-if="loading"` sur un `loading`
 * **jamais défini** dans son `<script setup>` : la condition valait toujours
 * `undefined`, et le squelette de chargement ne s'affichait donc jamais. Le
 * chargement est maintenant porté par chaque onglet, au plus près de ses données.
 */
const ongletDemande = ref(null);
// Incrémenté à chaque « Actualiser » : remonte les onglets, qui relancent leurs
// lectures dans leur `onMounted`.
const cle = ref(0);

const ouvrirRapports = () => {
  ongletDemande.value = 'rapports';
};

const rafraichir = () => {
  cle.value += 1;
};
</script>

<style scoped>
.dashboard-tabs {
  min-height: 420px;
}
</style>
