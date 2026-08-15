<template>
  <div>
    <EmptyState
      v-if="!parCycleFiliereClasse.length"
      title="Aucun créneau sur ce périmètre"
      description="Élargissez les filtres, ou planifiez des créneaux depuis l'écran Créneaux & horaires."
      :size="90"
    />

    <!-- Vue transversale demandée : tous les cycles, leurs filières, leurs
         classes. Chaque niveau est repliable, sans quoi une année complète
         donnerait une page illisible. -->
    <div v-for="cycle in arborescencePage" :key="cycle.cycle" class="mb-4">
      <div class="d-flex align-items-center gap-2 mb-2">
        <span class="badge bg-soft-primary text-primary font-monospace">{{ cycle.cycle }}</span>
        <span class="text-muted text-xs">
          {{ cycle.filieres.length }} filière(s) · {{ cycle.creneaux }} créneau(x) sur cette page
        </span>
      </div>

      <div v-for="filiere in cycle.filieres" :key="filiere.filiere" class="ms-2 mb-3">
        <h6 class="fw-bold text-dark small mb-2">
          <i class="bi bi-diagram-3 text-secondary me-1"></i>{{ filiere.filiere }}
        </h6>

        <div v-for="classe in filiere.classes" :key="classe.classe" class="ms-3 mb-2">
          <button
            class="btn btn-sm btn-light border w-100 d-flex justify-content-between align-items-center py-1 px-2"
            @click="basculer(classe.classe)"
          >
            <span class="fw-bold font-monospace text-xs">
              <i
                class="bi me-1"
                :class="estOuverte(classe.classe) ? 'bi-chevron-down' : 'bi-chevron-right'"
              ></i>
              {{ classe.classe }}
            </span>
            <span class="text-muted text-xs">{{ classe.creneaux.length }} créneau(x)</span>
          </button>

          <div v-if="estOuverte(classe.classe)" class="table-responsive mt-2">
            <table class="table table-sm align-middle mb-0 text-sm">
              <thead class="bg-light text-secondary text-xs">
                <tr>
                  <th class="ps-2">Jour</th>
                  <th>Horaire</th>
                  <th>Type</th>
                  <th>Matière</th>
                  <th>Formateur</th>
                  <th class="pe-2">Salle</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="creneau in classe.creneaux" :key="creneau.id">
                  <td class="ps-2 text-xs fw-semibold">{{ libelleJour(creneau.jour) }}</td>
                  <td class="font-monospace text-xs text-primary">{{ plageHoraire(creneau) }}</td>
                  <td>
                    <span class="badge text-xs" :class="infoType(creneau.type_cours).classe">
                      {{ infoType(creneau.type_cours).label }}
                    </span>
                  </td>
                  <td class="text-xs">{{ creneau.nom_module ?? '—' }}</td>
                  <td class="text-xs">{{ creneau.enseignant || '—' }}</td>
                  <td class="pe-2 font-monospace text-xs">
                    {{ creneau.salle_nom ?? creneau.code_salle ?? '—' }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <Pagination
      v-if="classesAPlat.length"
      v-model="page"
      v-model:items-per-page="itemsPerPage"
      :total-items="classesAPlat.length"
    />
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import { storeToRefs } from 'pinia';
import EmptyState from '@/shared/components/EmptyState.vue';
import Pagination from '@/components/shared/Pagination.vue';
import { usePagination } from '@/shared/composables/usePagination';
import { useEmploiDuTempsStore } from '../store';
import { infoType, libelleJour, plageHoraire } from '../constants';

const store = useEmploiDuTempsStore();
const { parCycleFiliereClasse } = storeToRefs(store);

/**
 * La pagination porte sur les **classes**, pas sur les cycles.
 *
 * Il y a cinq cycles pour 135 classes : paginer les cycles n'aurait presque rien
 * découpé, alors que le sommaire, lui, aligne une ligne par classe. On aplatit
 * donc l'arborescence, on pagine, puis on **reconstruit les cycles et filières
 * de la page affichée** — sans quoi une filière aurait été coupée sans jamais
 * montrer sa suite.
 */
const classesAPlat = computed(() =>
  parCycleFiliereClasse.value.flatMap((cycle) =>
    cycle.filieres.flatMap((filiere) =>
      filiere.classes.map((classe) => ({ cycle: cycle.cycle, filiere: filiere.filiere, classe }))
    )
  )
);

const { page, itemsPerPage, paginated } = usePagination(classesAPlat, { perPage: 15 });

/** L'arborescence reconstruite sur la seule page affichée. */
const arborescencePage = computed(() => {
  const cycles = new Map();

  for (const entree of paginated.value) {
    if (!cycles.has(entree.cycle)) cycles.set(entree.cycle, new Map());
    const filieres = cycles.get(entree.cycle);

    if (!filieres.has(entree.filiere)) filieres.set(entree.filiere, []);
    filieres.get(entree.filiere).push(entree.classe);
  }

  return [...cycles.entries()].map(([cycle, filieres]) => ({
    cycle,
    filieres: [...filieres.entries()].map(([filiere, classes]) => ({ filiere, classes })),
    // Le compte affiché est celui de la page : annoncer le total du cycle alors
    // qu'on n'en montre qu'une partie induirait en erreur.
    creneaux: [...filieres.values()]
      .flat()
      .reduce((total, classe) => total + classe.creneaux.length, 0),
  }));
});

/** Les classes dépliées. Tout est replié au départ : la vue est un sommaire. */
const ouvertes = ref(new Set());

const estOuverte = (classe) => ouvertes.value.has(classe);

const basculer = (classe) => {
  // Un `Set` muté sur place ne déclenche pas de rendu : on le remplace.
  const suivant = new Set(ouvertes.value);
  if (suivant.has(classe)) suivant.delete(classe);
  else suivant.add(classe);
  ouvertes.value = suivant;
};
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
</style>
