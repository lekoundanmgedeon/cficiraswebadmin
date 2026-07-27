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
    <div v-for="cycle in parCycleFiliereClasse" :key="cycle.cycle" class="mb-4">
      <div class="d-flex align-items-center gap-2 mb-2">
        <span class="badge bg-soft-primary text-primary font-monospace">{{ cycle.cycle }}</span>
        <span class="text-muted text-xs">
          {{ cycle.filieres.length }} filière(s) · {{ compterCreneaux(cycle) }} créneau(x)
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
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { storeToRefs } from 'pinia';
import EmptyState from '@/shared/components/EmptyState.vue';
import { useEmploiDuTempsStore } from '../store';
import { infoType, libelleJour, plageHoraire } from '../constants';

const store = useEmploiDuTempsStore();
const { parCycleFiliereClasse } = storeToRefs(store);

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

const compterCreneaux = (cycle) =>
  cycle.filieres.reduce(
    (total, filiere) =>
      total + filiere.classes.reduce((sous, classe) => sous + classe.creneaux.length, 0),
    0
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
</style>
