<script setup>
/**
 * Menu déroulant « Exporter » (Excel / PDF).
 *
 * Le même balisage `btn-group > dropdown` accompagnait chacun des onze blocs
 * d'export du projet.
 */
defineProps({
  label: { type: String, default: 'Exporter' },
  disabled: { type: Boolean, default: false },
});

const emit = defineEmits(['excel', 'pdf']);
</script>

<template>
  <div class="btn-group">
    <button
      class="btn btn-sm btn-outline-dark dropdown-toggle"
      type="button"
      data-bs-toggle="dropdown"
      :disabled="disabled"
      aria-expanded="false"
    >
      {{ label }}
    </button>
    <ul class="dropdown-menu dropdown-menu-end">
      <li>
        <button class="dropdown-item" type="button" @click="emit('excel')">
          <i class="mdi mdi-file-excel-box me-2"></i> Excel
        </button>
      </li>
      <li>
        <button class="dropdown-item" type="button" @click="emit('pdf')">
          <i class="mdi mdi-file-pdf-box me-2"></i> PDF
        </button>
      </li>
    </ul>
  </div>
</template>
