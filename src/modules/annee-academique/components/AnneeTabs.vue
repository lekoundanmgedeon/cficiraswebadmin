<script setup>
import { ref } from 'vue';
import ListeAnneesTab from './tabs/ListeAnneesTab.vue';
import CalendrierTab from './tabs/CalendrierTab.vue';
import StatistiquesTab from './tabs/StatistiquesTab.vue';
import HistoriqueTab from './tabs/HistoriqueTab.vue';

/**
 * Onglets de l'écran Années académiques.
 *
 * Les onglets étaient auparavant pilotés par les attributs `data-bs-toggle` de
 * Bootstrap, qui montent les quatre panneaux d'un coup : les quatre onglets
 * déclenchaient donc leurs appels API au chargement de la page, même sans être
 * consultés. Avec `<component :is>`, seul l'onglet actif est monté — les autres
 * ne requêtent rien tant qu'on ne les ouvre pas.
 */

const TABS = [
  { id: 'liste', label: 'Liste des années', component: ListeAnneesTab },
  { id: 'calendrier', label: 'Calendrier académique', component: CalendrierTab },
  { id: 'statistiques', label: 'Statistiques', component: StatistiquesTab },
  { id: 'historique', label: 'Historique', component: HistoriqueTab },
];

const activeTab = ref(TABS[0]);
</script>

<template>
  <div>
    <ul class="nav nav-tabs px-4" role="tablist">
      <li v-for="tab in TABS" :key="tab.id" class="nav-item">
        <button
          type="button"
          class="nav-link"
          :class="{ active: activeTab.id === tab.id }"
          :aria-selected="activeTab.id === tab.id"
          role="tab"
          @click="activeTab = tab"
        >
          {{ tab.label }}
        </button>
      </li>
    </ul>

    <div class="tab-content p-4">
      <!-- `keep-alive` conserve l'état d'un onglet déjà visité (filtres de
           recherche, notamment) et lui évite de refaire ses appels API. -->
      <KeepAlive>
        <component :is="activeTab.component" />
      </KeepAlive>
    </div>
  </div>
</template>

<style scoped>
/* Les onglets sont désormais des <button> et non des <a> : on neutralise le
   style natif du bouton pour conserver l'apparence Bootstrap d'origine. */
.nav-link {
  background: none;
  border-top-color: transparent;
  border-left-color: transparent;
  border-right-color: transparent;
}
</style>
