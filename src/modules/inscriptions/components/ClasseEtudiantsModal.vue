<script setup>
import { computed, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import EmptyState from '@/shared/components/EmptyState.vue';
import LoadingSpinner from '@/shared/components/LoadingSpinner.vue';
import Pagination from '@/components/shared/Pagination.vue';
import { useClasseStore } from '@/modules/structure-academique/classe/store';

/**
 * Étudiants inscrits dans une classe (`GET /classes/:id/etudiants`).
 *
 * Le parent chargeait lui-même les étudiants puis les passait en props ; la
 * modale se charge de son propre appel, ce qui évite au parent de savoir quand
 * le déclencher.
 */

const props = defineProps({
  /** La classe consultée, `null` quand la modale est fermée. */
  classe: { type: Object, default: null },
});

const emit = defineEmits(['update:classe']);

const classeStore = useClasseStore();
const { etudiants, loading } = storeToRefs(classeStore);

const currentPage = ref(1);
const itemsPerPage = 10;

watch(
  () => props.classe,
  (classe) => {
    currentPage.value = 1;
    if (classe?.id) classeStore.fetchStudents(classe.id);
  }
);

const close = () => emit('update:classe', null);

const sorted = computed(() =>
  [...etudiants.value].sort((a, b) =>
    `${a.nom} ${a.prenom}`.localeCompare(`${b.nom} ${b.prenom}`, 'fr')
  )
);

const startIndex = computed(() => (currentPage.value - 1) * itemsPerPage);

const paginated = computed(() =>
  sorted.value.slice(startIndex.value, startIndex.value + itemsPerPage)
);
</script>

<template>
  <Teleport to="body">
    <div
      v-if="classe"
      class="modal fade show d-block"
      tabindex="-1"
      role="dialog"
      style="background-color: rgba(0, 0, 0, 0.5)"
    >
      <div class="modal-dialog modal-dialog-centered modal-lg">
        <div class="modal-content shadow-lg">
          <div class="modal-header bg-primary text-white">
            <h5 class="modal-title">Étudiants de la classe {{ classe.code }}</h5>
            <button
              type="button"
              class="btn-close btn-close-white"
              aria-label="Fermer"
              @click="close"
            ></button>
          </div>

          <div class="modal-body">
            <LoadingSpinner v-if="loading" />

            <EmptyState
              v-else-if="sorted.length === 0"
              title="Aucun étudiant"
              description="Cette classe ne compte aucun étudiant inscrit pour le moment."
            />

            <div v-else>
              <div class="table-responsive">
                <table class="table align-middle mb-0">
                  <thead class="table-light">
                    <tr>
                      <th class="ps-3">#</th>
                      <th>Matricule</th>
                      <th>Nom</th>
                      <th>Prénom</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(etudiant, index) in paginated" :key="etudiant.id">
                      <td class="ps-3 text-muted small">{{ startIndex + index + 1 }}</td>
                      <td>
                        <span class="badge bg-light text-primary border fw-bold">
                          {{ etudiant.matricule }}
                        </span>
                      </td>
                      <td class="fw-semibold">{{ etudiant.nom }}</td>
                      <td>{{ etudiant.prenom }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <Pagination
                v-model="currentPage"
                :items-per-page="itemsPerPage"
                :total-items="sorted.length"
              />
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn btn-secondary" @click="close">Fermer</button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>
