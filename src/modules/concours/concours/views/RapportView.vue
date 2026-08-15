<script setup>
import { computed, markRaw, onMounted, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import AppTabs from '@/shared/components/AppTabs.vue';
import PageHeader from '@/shared/components/PageHeader.vue';
import EmptyState from '@/shared/components/EmptyState.vue';
import RapportClassementTab from '../components/RapportClassementTab.vue';
import RapportStatistiquesTab from '../components/RapportStatistiquesTab.vue';
import { useConcoursStore } from '../store';

/**
 * Rapports de concours.
 *
 * `RapportConcours.vue` affichait — dans un « rapport de concours » — une liste
 * de **formateurs** codés en dur (« John Doe », « Anna Smith »), servie après un
 * `setTimeout(3000)`. C'est exactement le même copier-coller que l'on trouvait
 * dans `RapportExamens.vue` : ni l'un ni l'autre n'avait de rapport avec des
 * résultats.
 *
 * L'écran porte désormais deux onglets — le classement, et les statistiques de
 * résultats. Le **sélecteur de concours reste ici**, au-dessus des onglets :
 * c'est le même périmètre pour les deux, et le dupliquer dans chacun aurait
 * permis d'en consulter deux différents sans s'en apercevoir.
 *
 * Le classement est chargé une fois, à ce niveau : les deux onglets le lisent,
 * et `AppTabs` ne monte que l'onglet actif — le recharger à chaque bascule
 * serait une requête pour rien.
 */

const concoursStore = useConcoursStore();
const { items: concoursList } = storeToRefs(concoursStore);

const concoursId = ref('');

onMounted(() => concoursStore.fetchAll());

watch(concoursId, (id) => concoursStore.fetchClassement(id));

const concours = computed(() => concoursList.value.find((item) => item.id === concoursId.value));

const tabs = computed(() => {
  const props = { concoursId: concoursId.value, designation: concours.value?.designation ?? '' };

  return [
    { id: 'classement', label: 'Classement', component: markRaw(RapportClassementTab), props },
    {
      id: 'statistiques',
      label: 'Statistiques des résultats',
      component: markRaw(RapportStatistiquesTab),
      props,
    },
  ];
});

const telechargerAdmis = () => concoursStore.downloadAdmisList(concoursId.value, 'pdf');
</script>

<template>
  <div>
    <PageHeader
      title="Rapports de concours"
      subtitle="Classement, statistiques de résultats et liste des admis"
      :breadcrumb="['concours', 'rapports']"
    />

    <div class="row">
      <div class="col-md-12 grid-margin stretch-card">
        <div class="card">
          <div class="card-body">
            <div class="row g-3 align-items-end mb-4">
              <div class="col-md-5">
                <label for="rapport-concours" class="form-label fw-bold small">Concours</label>
                <select
                  id="rapport-concours"
                  v-model="concoursId"
                  class="form-select form-select-sm"
                >
                  <option value="">— Sélectionnez un concours —</option>
                  <option v-for="item in concoursList" :key="item.id" :value="item.id">
                    {{ item.designation }} ({{ item.code_annee }})
                  </option>
                </select>
              </div>

              <div class="col-md-7 text-md-end">
                <button
                  class="btn btn-sm btn-outline-danger"
                  :disabled="!concoursId"
                  @click="telechargerAdmis"
                >
                  <i class="mdi mdi-file-pdf-box me-1"></i> Liste des admis (PDF)
                </button>
              </div>
            </div>

            <EmptyState
              v-if="!concoursId"
              title="Choisissez un concours"
              description="Le classement et les statistiques ne se consultent qu'au sein d'un concours."
            />

            <!-- La clé force le remontage à chaque changement de concours : sans
                 elle, l'onglet actif garderait l'état — pagination, graphiques —
                 du concours précédent. -->
            <AppTabs v-else :key="concoursId" :tabs="tabs" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
