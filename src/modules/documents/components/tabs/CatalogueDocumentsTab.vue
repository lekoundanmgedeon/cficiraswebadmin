<script setup>
import { computed, onMounted } from 'vue';
import { storeToRefs } from 'pinia';
import EmptyState from '@/shared/components/EmptyState.vue';
import LoadingSpinner from '@/shared/components/LoadingSpinner.vue';
import { useDocumentStore } from '../../store';
import { useDemandeForm } from '../../composables/useDemandeForm';

/**
 * Les documents que l'établissement délivre.
 *
 * Le catalogue est une **table** (`types_documents`), pas une liste codée dans
 * le frontend : ajouter un certificat n'exige pas de livrer une version. Chaque
 * type porte son préfixe de numérotation (`ATT-2026-0001`), son délai annoncé,
 * et ce qu'il exige — année académique, classe.
 *
 * L'écran est en lecture : le catalogue s'administre en base. C'est un choix,
 * pas un oubli — un type de document supprimé côté écran laisserait des demandes
 * orphelines, ce que la clé étrangère `ON DELETE RESTRICT` interdit déjà.
 */

const store = useDocumentStore();
const { types, loading } = storeToRefs(store);
const { openCreate } = useDemandeForm();

onMounted(() => Promise.all([store.fetchTypes(), store.fetchAll()]));

/** Nombre de demandes déjà déposées par type — l'usage réel du catalogue. */
const usages = computed(() => {
  const compteurs = new Map();
  for (const demande of store.items) {
    compteurs.set(demande.type_document, (compteurs.get(demande.type_document) ?? 0) + 1);
  }
  return compteurs;
});

/** Regroupement par délai : ce qui sort vite, et ce qui demande du temps. */
const groupes = computed(() => {
  const rapide = types.value.filter((type) => type.delai_jours <= 3);
  const moyen = types.value.filter((type) => type.delai_jours > 3 && type.delai_jours <= 10);
  const long = types.value.filter((type) => type.delai_jours > 10);

  return [
    { id: 'rapide', label: 'Délivré sous 3 jours', variant: 'success', types: rapide },
    { id: 'moyen', label: 'Sous 10 jours', variant: 'info', types: moyen },
    { id: 'long', label: 'Au-delà de 10 jours', variant: 'warning', types: long },
  ].filter((groupe) => groupe.types.length > 0);
});
</script>

<template>
  <div>
    <div class="mb-3">
      <h4 class="mb-1">Documents délivrables</h4>
      <p class="mb-0 text-muted small">
        Ce que l'établissement délivre, avec le délai annoncé et le préfixe de numérotation.
      </p>
    </div>

    <LoadingSpinner v-if="loading && !types.length" />

    <EmptyState
      v-else-if="!types.length"
      title="Aucun document déclaré"
      description="Le catalogue des documents délivrables est vide."
    />

    <div v-else>
      <div v-for="groupe in groupes" :key="groupe.id" class="mb-4">
        <h6 class="text-uppercase text-secondary small fw-bold mb-2">
          <span class="badge me-1" :class="`bg-${groupe.variant}-subtle text-${groupe.variant}`">
            {{ groupe.types.length }}
          </span>
          {{ groupe.label }}
        </h6>

        <div class="row g-3">
          <div v-for="type in groupe.types" :key="type.code" class="col-md-6 col-xl-4">
            <div class="card border-0 shadow-sm h-100">
              <div class="card-body d-flex flex-column">
                <div class="d-flex justify-content-between align-items-start gap-2 mb-2">
                  <h6 class="fw-bold text-dark mb-0">{{ type.libelle }}</h6>
                  <span class="badge bg-light text-dark border font-monospace">
                    {{ type.prefixe }}
                  </span>
                </div>

                <p v-if="type.description" class="text-muted small flex-grow-1">
                  {{ type.description }}
                </p>

                <ul class="list-unstyled small text-muted mb-3">
                  <li>
                    <i class="bi bi-clock me-1"></i>
                    Délai annoncé : {{ type.delai_jours }} jour(s)
                  </li>
                  <li v-if="type.requiert_annee">
                    <i class="bi bi-calendar3 me-1"></i> Vise une année académique
                  </li>
                  <li v-if="type.requiert_classe">
                    <i class="bi bi-people me-1"></i> Vise une classe
                  </li>
                  <li>
                    <i class="bi bi-file-earmark-text me-1"></i>
                    {{ usages.get(type.code) ?? 0 }} demande(s) déposée(s)
                  </li>
                </ul>

                <button
                  class="btn btn-sm btn-outline-primary align-self-start mt-auto"
                  type="button"
                  @click="openCreate()"
                >
                  Déposer une demande
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
