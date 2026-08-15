<template>
  <div>
    <!-- Onglets par jour. Le design est celui de l'écran d'origine : des pills
         Lundi → Samedi. Ce qui change, c'est qu'ils comptent maintenant leurs
         créneaux et affichent des données réelles. -->
    <ul class="nav nav-pills nav-pills-custom mt-2" role="tablist">
      <li v-for="jour in parJour" :key="jour.id" class="nav-item">
        <a
          class="nav-link d-flex align-items-center gap-2"
          :class="{ active: jourActif === jour.id }"
          href="#"
          role="tab"
          @click.prevent="jourActif = jour.id"
        >
          {{ jour.label }}
          <span
            class="badge rounded-pill text-xs"
            :class="jour.creneaux.length ? 'bg-primary' : 'bg-light text-muted'"
          >
            {{ jour.creneaux.length }}
          </span>
        </a>
      </li>
    </ul>

    <div class="tab-content tab-content-custom-pill mt-3">
      <div class="table-responsive">
        <table class="table table-hover align-middle mb-0 text-sm">
          <thead class="bg-light text-secondary text-xs">
            <tr>
              <th class="ps-2" style="width: 52px">#</th>
              <th>Horaire</th>
              <th>Classe</th>
              <th>Type</th>
              <th>Matière</th>
              <th>Formateur</th>
              <th>Semestre</th>
              <th class="pe-2">Salle</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(creneau, index) in paginated" :key="creneau.id">
              <td class="ps-2 text-muted text-xs">{{ startIndex + index + 1 }}</td>
              <td class="font-monospace text-xs fw-bold text-primary">
                {{ plageHoraire(creneau) }}
              </td>
              <td>
                <div class="fw-bold text-dark text-xs">{{ creneau.classe_code }}</div>
                <small class="text-muted text-xs">
                  {{ creneau.filiere ?? '—' }}
                  <span v-if="creneau.cycle_code" class="font-monospace">
                    · {{ creneau.cycle_code }}
                  </span>
                </small>
              </td>
              <td>
                <span class="badge text-xs" :class="infoType(creneau.type_cours).classe">
                  {{ infoType(creneau.type_cours).label }}
                </span>
              </td>
              <td class="text-xs">{{ creneau.nom_module ?? '—' }}</td>
              <td class="text-xs">{{ creneau.enseignant || '—' }}</td>
              <td class="font-monospace text-xs">{{ creneau.semestre ?? '—' }}</td>
              <td class="pe-2 font-monospace text-xs">
                {{ creneau.salle_nom ?? creneau.code_salle ?? '—' }}
              </td>
            </tr>

            <tr v-if="!creneauxDuJour.length">
              <td colspan="8" class="p-0">
                <EmptyState
                  :title="`Aucun cours le ${libelleJourActif.toLowerCase()}`"
                  description="Aucun créneau n'est planifié ce jour-là sur le périmètre sélectionné."
                  :size="70"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <Pagination
        v-if="creneauxDuJour.length"
        v-model="page"
        v-model:items-per-page="itemsPerPage"
        :total-items="creneauxDuJour.length"
      />
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import { storeToRefs } from 'pinia';
import EmptyState from '@/shared/components/EmptyState.vue';
import Pagination from '@/components/shared/Pagination.vue';
import { usePagination } from '@/shared/composables/usePagination';
import { useEmploiDuTempsStore } from '../store';
import { infoType, plageHoraire } from '../constants';

const store = useEmploiDuTempsStore();
const { parJour } = storeToRefs(store);

const jourActif = ref('LUNDI');

const creneauxDuJour = computed(
  () => parJour.value.find((jour) => jour.id === jourActif.value)?.creneaux ?? []
);

/**
 * Une journée porte plus de deux cents créneaux, toutes classes confondues
 * (1 351 sur la semaine du jeu de démonstration) : la liste était rendue d'un
 * bloc. Changer de jour repart de la première page — ce n'est plus la même
 * journée.
 */
const { page, itemsPerPage, startIndex, paginated } = usePagination(creneauxDuJour, {
  perPage: 20,
  resetKey: () => jourActif.value,
});

const libelleJourActif = computed(
  () => parJour.value.find((jour) => jour.id === jourActif.value)?.label ?? ''
);
</script>

<style scoped>
.bg-soft-primary {
  background-color: rgba(0, 123, 255, 0.08);
}
.bg-soft-success {
  background-color: rgba(40, 167, 69, 0.12);
}
.bg-soft-warning {
  background-color: rgba(255, 193, 7, 0.15);
}
.bg-soft-danger {
  background-color: rgba(220, 53, 69, 0.08);
}

.text-xs {
  font-size: 11px !important;
}
.text-sm {
  font-size: 0.85rem;
}

.table th {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  color: #6c757d;
  border: none;
}

.table tbody tr {
  border-bottom: 1px solid #f8f9fa;
}

.nav-pills .nav-link {
  cursor: pointer;
}
</style>
