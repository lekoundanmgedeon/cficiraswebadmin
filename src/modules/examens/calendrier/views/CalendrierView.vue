<script setup>
import { markRaw } from 'vue';
import AppTabs from '@/shared/components/AppTabs.vue';
import ExamenHeader from '../../components/ExamenHeader.vue';
import CalendrierEpreuves from '../components/CalendrierEpreuves.vue';
import { useEpreuveStore } from '../../epreuve/store';

/**
 * Calendrier des évaluations.
 *
 * Les deux onglets — Session normale / Session rattrapage — sont conservés, mais
 * le second ne rendait **rien** : son composant, `CalendrierRappel.vue`, était
 * vide (`<template></template>`). Les deux affichent désormais le même planning,
 * filtré sur le type de session.
 *
 * Le conteneur d'onglets Bootstrap montait par ailleurs ses deux panneaux d'un
 * coup ; `AppTabs` ne monte que l'onglet actif.
 */

const epreuveStore = useEpreuveStore();

const tabs = [
  {
    id: 'normale',
    label: 'Session normale',
    component: markRaw(CalendrierEpreuves),
    props: { typeSession: 'NORMALE' },
  },
  {
    id: 'rattrapage',
    label: 'Session rattrapage',
    component: markRaw(CalendrierEpreuves),
    props: { typeSession: 'RATTRAPAGE' },
  },
];

const refresh = () => epreuveStore.fetchAll({ force: true });
</script>

<template>
  <div>
    <ExamenHeader
      title="Calendrier des évaluations"
      subtitle="Visualisation et gestion chronologique des examens normaux et des rattrapages."
      breadcrumb="Calendrier"
      :refresh="refresh"
    />

    <div class="row">
      <div class="col-md-12 grid-margin stretch-card">
        <div class="card">
          <div class="card-body dashboard-tabs p-0">
            <AppTabs :tabs="tabs" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
