<template>
  <div class="pagination-wrapper pt-3">
    <div class="pagination-info">
      <div class="items-per-page-selector d-flex align-items-center">
        <span class="text-muted style-label me-2">Afficher</span>
        <select
          v-model="localItemsPerPage"
          class="form-select form-select-sm border border-secondary-subtle"
          style="width: auto; min-width: 65px"
        >
          <option v-for="n in itemsPerPageOptions" :key="n" :value="n">
            {{ n }}
          </option>
        </select>
        <span class="text-muted style-label ms-2">éléments</span>
      </div>

      <div class="results-info text-muted">
        <span v-if="totalItems > 0">
          Affichage de <strong>{{ startItem }}</strong> à <strong>{{ endItem }}</strong> sur
          <strong class="text-dark">{{ totalItems }}</strong> résultat{{
            totalItems > 1 ? 's' : ''
          }}
        </span>
        <span v-else class="text-muted italic">Aucun résultat à afficher</span>
      </div>
    </div>

    <nav v-if="totalPages > 1" aria-label="Navigation de pagination">
      <ul class="pagination pagination-sm mb-0 shadow-sm rounded">
        <li class="page-item" :class="{ disabled: currentPage === 1 }">
          <button
            class="page-link"
            @click="goToPage(1)"
            :disabled="currentPage === 1"
            title="Première page"
          >
            <i class="mdi mdi-chevron-double-left"></i>
          </button>
        </li>

        <li class="page-item" :class="{ disabled: currentPage === 1 }">
          <button
            class="page-link"
            @click="prevPage"
            :disabled="currentPage === 1"
            title="Page précédente"
          >
            <i class="mdi mdi-chevron-left"></i>
          </button>
        </li>

        <template v-for="(page, idx) in displayedPages" :key="idx">
          <li
            v-if="page === 'ellipsis-start' || page === 'ellipsis-end'"
            class="page-item disabled"
          >
            <span class="page-link bg-light border-0">...</span>
          </li>
          <li v-else class="page-item" :class="{ active: page === currentPage }">
            <button
              class="page-link font-monospace"
              :class="{ 'fw-bold': page === currentPage }"
              @click="goToPage(page)"
              :aria-current="page === currentPage ? 'page' : undefined"
            >
              {{ page }}
            </button>
          </li>
        </template>

        <li class="page-item" :class="{ disabled: currentPage >= totalPages }">
          <button
            class="page-link"
            @click="nextPage"
            :disabled="currentPage >= totalPages"
            title="Page suivante"
          >
            <i class="mdi mdi-chevron-right"></i>
          </button>
        </li>

        <li class="page-item" :class="{ disabled: currentPage >= totalPages }">
          <button
            class="page-link"
            @click="goToPage(totalPages)"
            :disabled="currentPage >= totalPages"
            title="Dernière page"
          >
            <i class="mdi mdi-chevron-double-right"></i>
          </button>
        </li>
      </ul>
    </nav>

    <div v-if="totalPages > 10" class="quick-jump d-flex align-items-center">
      <span class="text-muted style-label me-2">Aller à</span>
      <div class="input-group input-group-sm rounded shadow-sm bg-white" style="width: 110px">
        <input
          v-model.number="jumpToPageInput"
          type="number"
          class="form-control border border-secondary-subtle font-monospace text-center ps-3"
          :min="1"
          :max="totalPages"
          placeholder="N°"
          @keyup.enter="jumpToPage"
        />
        <button
          class="btn btn-outline-secondary"
          type="button"
          @click="jumpToPage"
          :disabled="!isValidPageJump"
        >
          <i class="mdi mdi-arrow-right"></i>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue';

const props = defineProps({
  totalItems: {
    type: Number,
    required: true,
    validator: (value) => value >= 0,
  },
  itemsPerPage: {
    type: Number,
    default: 10,
    validator: (value) => value > 0,
  },
  modelValue: {
    type: Number,
    default: 1,
    validator: (value) => value > 0,
  },
  itemsPerPageOptions: {
    type: Array,
    default: () => [10, 15, 20, 30, 50],
  },
  maxVisiblePages: {
    type: Number,
    default: 5, // Réduit à 5 par défaut pour un rendu mobile/tablette plus compact
    validator: (value) => value >= 5 && value % 2 === 1,
  },
});

const emit = defineEmits(['update:modelValue', 'update:itemsPerPage']);

const jumpToPageInput = ref(null);

// --- SOURCE SECURISEE UNIQUE DE VERITE (Calcul de la plage maximale) ---
const totalPages = computed(() => Math.max(1, Math.ceil(props.totalItems / props.itemsPerPage)));

// Définition de Writable Computeds pour le v-model natif en remplacement des watchers multiples
const currentPage = computed({
  get: () => {
    // Sécurité au cas où la page externe dépasse le scope réel actuel
    return Math.max(1, Math.min(props.modelValue, totalPages.value));
  },
  set: (val) => {
    emit('update:modelValue', Math.max(1, Math.min(val, totalPages.value)));
  },
});

const localItemsPerPage = computed({
  get: () => props.itemsPerPage,
  set: (val) => {
    currentPage.value = 1; // Toujours reset à la page 1 si la taille de segment change
    emit('update:itemsPerPage', val);
  },
});

// Indexations calculées
const startItem = computed(() =>
  props.totalItems === 0 ? 0 : (currentPage.value - 1) * props.itemsPerPage + 1
);
const endItem = computed(() => Math.min(currentPage.value * props.itemsPerPage, props.totalItems));

// Génération optimisée des ellipses sans variables d'état locales instables
const displayedPages = computed(() => {
  const pages = [];
  const total = totalPages.value;
  const current = currentPage.value;
  const maxVisible = props.maxVisiblePages;

  if (total <= maxVisible) {
    for (let i = 1; i <= total; i++) pages.push(i);
    return pages;
  }

  const halfVisible = Math.floor(maxVisible / 2);
  pages.push(1);

  let startPage = Math.max(2, current - halfVisible);
  let endPage = Math.min(total - 1, current + halfVisible);

  if (current <= halfVisible + 1) {
    endPage = Math.min(maxVisible - 1, total - 1);
  }
  if (current >= total - halfVisible) {
    startPage = Math.max(2, total - maxVisible + 2);
  }

  if (startPage > 2) pages.push('ellipsis-start');
  for (let i = startPage; i <= endPage; i++) pages.push(i);
  if (endPage < total - 1) pages.push('ellipsis-end');

  if (total > 1) pages.push(total);
  return pages;
});

const isValidPageJump = computed(() => {
  return (
    Number.isInteger(jumpToPageInput.value) &&
    jumpToPageInput.value >= 1 &&
    jumpToPageInput.value <= totalPages.value
  );
});

// Actions de navigation épurées
const goToPage = (page) => {
  if (page >= 1 && page <= totalPages.value) currentPage.value = page;
};
const prevPage = () => {
  if (currentPage.value > 1) currentPage.value--;
};
const nextPage = () => {
  if (currentPage.value < totalPages.value) currentPage.value++;
};

const jumpToPage = () => {
  if (isValidPageJump.value) {
    goToPage(jumpToPageInput.value);
    jumpToPageInput.value = null;
  }
};

// Sécurité supplémentaire : Si le total d'items se réduit (ex: application d'un filtre)
watch(
  () => props.totalItems,
  () => {
    if (currentPage.value > totalPages.value) {
      currentPage.value = totalPages.value;
    }
  }
);
</script>

<style scoped>
.pagination-wrapper {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.pagination-info {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  flex-wrap: wrap;
}

.results-info {
  font-size: 0.8rem;
}

.style-label {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.page-link {
  border: 1px solid #e9ecef;
  color: #6c757d;
  background-color: #fff;
  padding: 0.35rem 0.65rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.page-link:hover:not(:disabled) {
  background-color: #f8f9fa;
  color: #4b49ac;
}

.page-item.active .page-link {
  background-color: #4b49ac;
  border-color: #4b49ac;
  color: #fff;
}

/* Remplacement des ancres <a> par des boutons réels pour l'accessibilité */
button.page-link {
  outline: none;
}
button.page-link:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

/* Chrome/Safari cache les flèches d'input type number */
input::-webkit-outer-spin-button,
input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

/* Responsive UI */
@media (max-width: 768px) {
  .pagination-wrapper {
    flex-direction: column;
    align-items: stretch;
  }
  .pagination-info {
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
  }
  nav,
  .pagination,
  .quick-jump {
    width: 100%;
    justify-content: center;
  }
}
</style>
