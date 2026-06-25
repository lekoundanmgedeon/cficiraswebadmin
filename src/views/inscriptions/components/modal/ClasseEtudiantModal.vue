<template>
  <teleport to="body">
    <transition name="modal-fade">
      <div
        v-if="modelValue"
        class="modal fade show d-block"
        tabindex="-1"
        style="background-color: rgba(15, 23, 42, 0.45); backdrop-filter: blur(4px)"
        @click.self="fermerModal"
      >
        <div class="modal-dialog modal-dialog-centered modal-lg">
          <div class="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
            <div
              class="modal-header bg-light border-0 px-4 py-3 d-flex align-items-center justify-content-between"
            >
              <div>
                <h5 class="modal-title fw-bold text-dark mb-0 d-flex align-items-center gap-2">
                  <i class="mdi mdi-account-group text-primary fs-4"></i>
                  Liste des Étudiants
                </h5>
                <small class="text-muted">
                  Classe :
                  <span class="fw-bold text-primary">{{
                    classe?.code || classe?.classe_code
                  }}</span>
                  • {{ sortedStudents.length }} inscrit(s)
                </small>
              </div>
              <button type="button" class="btn-close shadow-none" @click="fermerModal"></button>
            </div>

            <div class="modal-body p-0" style="max-height: 60vh; overflow-y: auto">
              <div v-if="loading" class="text-center py-5">
                <div class="spinner-border text-primary spinner-border-sm me-2" role="status"></div>
                <span class="text-muted small">Chargement des étudiants...</span>
              </div>

              <div v-else-if="sortedStudents.length > 0" class="table-responsive">
                <table class="table table-hover align-middle mb-0">
                  <thead class="bg-light sticky-top" style="z-index: 1">
                    <tr>
                      <th class="ps-4 py-2 small text-uppercase text-muted" style="font-size: 10px">
                        N°
                      </th>
                      <th class="py-2 small text-uppercase text-muted" style="font-size: 10px">
                        Matricule
                      </th>
                      <th class="py-2 small text-uppercase text-muted" style="font-size: 10px">
                        Nom & Prénoms
                      </th>
                      <th class="py-2 small text-uppercase text-muted" style="font-size: 10px">
                        Date d'inscr.
                      </th>
                      <th
                        class="pe-4 py-2 small text-uppercase text-muted text-end"
                        style="font-size: 10px"
                      >
                        Statut
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <!-- Modification : On boucle sur paginatedStudents au lieu de sortedStudents -->
                    <tr v-for="(student, idx) in paginatedStudents" :key="student.id">
                      <!-- La numérotation s'adapte à la page courante -->
                      <td class="ps-4 font-monospace text-muted small">
                        {{ startIndex + idx + 1 }}
                      </td>

                      <td>
                        <span class="fw-bold text-primary font-monospace small">
                          {{ student.matricule }}
                        </span>
                      </td>

                      <td>
                        <div class="d-flex flex-column">
                          <div class="fw-semibold text-dark text-uppercase mb-0">
                            {{ student.nom }}
                            <span class="text-capitalize fw-normal text-secondary">
                              {{ student.prenom }}
                            </span>
                          </div>
                          <small class="text-muted font-monospace" style="font-size: 11px">
                            {{ student.email }}
                          </small>
                        </div>
                      </td>

                      <td>
                        <span class="small text-muted">
                          {{
                            student.date_inscription
                              ? new Date(student.date_inscription).toLocaleDateString('fr-FR')
                              : '-'
                          }}
                        </span>
                      </td>

                      <td class="pe-4 text-end">
                        <span
                          class="badge bg-soft-success text-success rounded-pill px-2 py-1 small"
                        >
                          Inscrit
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div v-else class="text-center py-5">
                <i
                  class="mdi mdi-account-off-outline text-muted opacity-25 display-4 d-block mb-2"
                ></i>
                <p class="text-muted mb-0 small">
                  Aucun étudiant inscrit dans cette classe pour le moment.
                </p>
              </div>
            </div>

            <!-- Footer avec répartition flexible -->
            <div
              class="modal-footer bg-light border-0 px-4 py-2 d-flex justify-content-between align-items-center"
            >
              <button
                type="button"
                class="btn btn-secondary rounded-pill px-4"
                @click="fermerModal"
              >
                Fermer
              </button>

              <!-- La pagination s'affiche uniquement si la liste dépasse 10 éléments -->
              <div v-if="!loading && sortedStudents.length > itemsPerPage">
                <AppPagination
                  v-model="currentPage"
                  v-model:itemsPerPage="itemsPerPage"
                  :total-items="sortedStudents.length"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </teleport>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import AppPagination from '@/components/shared/Pagination.vue'; // Ajustez le chemin si nécessaire

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  classe: { type: Object, default: () => ({}) },
  students: { type: [Array, Object], default: () => [] },
  loading: { type: Boolean, default: false },
});

const emit = defineEmits(['update:modelValue']);

/* ===================== États Pagination ===================== */
const currentPage = ref(1);
const itemsPerPage = ref(10); // Fixé à 10 éléments par page

// Extraction ultra-sécurisée et réactive du tableau d'étudiants
const extractedStudents = computed(() => {
  if (props.students && props.students.data && Array.isArray(props.students.data)) {
    return props.students.data;
  }
  if (Array.isArray(props.students)) {
    return props.students;
  }
  return [];
});

// Tri des étudiants par ordre alphabétique (Nom puis Prénom)
const sortedStudents = computed(() => {
  const list = [...extractedStudents.value];
  return list.sort((a, b) => {
    const nomA = (a.nom || '').toLowerCase().trim();
    const nomB = (b.nom || '').toLowerCase().trim();
    if (nomA !== nomB) return nomA.localeCompare(nomB);

    const prenomA = (a.prenom || '').toLowerCase().trim();
    const prenomB = (b.prenom || '').toLowerCase().trim();
    return prenomA.localeCompare(prenomB);
  });
});

/* ===================== Découpage pour la Pagination ===================== */
const startIndex = computed(() => (currentPage.value - 1) * itemsPerPage.value);

const paginatedStudents = computed(() => {
  return sortedStudents.value.slice(startIndex.value, startIndex.value + itemsPerPage.value);
});

const fermerModal = () => {
  emit('update:modelValue', false);
};

// Remise à la première page à chaque ouverture du modal pour une classe
watch(
  () => props.modelValue,
  (newVal) => {
    if (newVal) currentPage.value = 1;
  }
);
</script>

<style scoped>
.bg-soft-success {
  background-color: rgba(25, 135, 84, 0.12);
}
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.25s ease;
}
.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}
.sticky-top {
  position: sticky;
  top: 0;
  background-color: #f8f9fa;
}
</style>
