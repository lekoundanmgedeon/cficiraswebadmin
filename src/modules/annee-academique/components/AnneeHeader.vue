<script setup>
import { useAnneeStore } from '../store/anneeStore';
import { useAnneeForm } from '../composables/useAnneeForm';

const anneeStore = useAnneeStore();
const { openCreate } = useAnneeForm();

/**
 * Exporte l'année courante. L'export nécessite l'identifiant d'une année ;
 * `loadCurrentStats` a en général déjà chargé `current`, sinon le store va la
 * chercher.
 */
async function exportData() {
  if (!anneeStore.current) {
    await anneeStore.fetchCurrent();
  }
  if (anneeStore.current?.id) {
    await anneeStore.exportData(anneeStore.current.id);
  }
}

// `window` n'est pas exposé au template en <script setup> : on passe par une fonction.
const print = () => window.print();
</script>

<template>
  <div class="row">
    <div class="col-md-12 grid-margin">
      <div class="d-flex justify-content-between flex-wrap">
        <div class="d-flex align-items-end flex-wrap">
          <div class="me-md-3 me-xl-5">
            <h2>Gestion Années Académiques</h2>
            <p class="mb-md-0">Configuration et gestion des années académiques</p>
          </div>
          <div class="d-flex">
            <i class="mdi mdi-home text-muted hover-cursor"></i>
            <p class="text-muted mb-0 hover-cursor">&nbsp;/&nbsp;structures&nbsp;/&nbsp;</p>
            <p class="text-primary mb-0 hover-cursor">annees</p>
          </div>
        </div>

        <div class="d-flex justify-content-between align-items-end flex-wrap">
          <button
            type="button"
            class="btn btn-light bg-white btn-icon me-3 d-none d-md-block"
            title="Exporter l'année courante"
            :disabled="anneeStore.loading"
            @click="exportData"
          >
            <i class="mdi mdi-download text-muted"></i>
          </button>
          <button
            type="button"
            class="btn btn-light bg-white btn-icon me-3 mt-2 mt-xl-0"
            title="Imprimer"
            @click="print"
          >
            <i class="mdi mdi-printer text-muted"></i>
          </button>
          <button class="btn btn-primary mt-2 mt-xl-0" @click="openCreate">
            + Ajouter un nouveau
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
