<template>
  <div class="animate__animated animate__fadeIn">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h5 class="fw-bold mb-1 text-dark">Registre des Épreuves</h5>
        <p class="text-muted small mb-0">
          Définissez les matières, coefficients et plages horaires indispensables aux calculs de
          délibération.
        </p>
      </div>

      <div class="d-flex gap-2">
        <button
          class="btn btn-sm btn-light border text-secondary"
          @click="exportExcel"
          title="Exporter sous Excel"
        >
          <i class="bi bi-file-earmark-excel me-1"></i> Excel
        </button>
        <button
          class="btn btn-sm btn-primary d-inline-flex align-items-center gap-1.5"
          @click="addEpreuve"
        >
          <span>+ Ajouter une épreuve</span>
        </button>
      </div>
    </div>

    <div class="table-responsive border rounded-3 shadow-sm bg-white">
      <table class="table table-hover align-middle mb-0 text-sm">
        <thead class="table-light text-uppercase font-monospace text-xs">
          <tr>
            <th class="ps-3" style="width: 12%">Code</th>
            <th style="width: 25%">Intitulé de la matière</th>
            <th class="text-center" style="width: 12%">Coefficient</th>
            <th style="width: 15%">Heure Début</th>
            <th style="width: 15%">Heure Fin</th>
            <th style="width: 12%">Type</th>
            <th class="text-end pe-3" style="width: 12%">Actions</th>
          </tr>
        </thead>

        <tbody>
          <tr
            v-for="(epreuve, index) in epreuves"
            :key="index"
            :class="{ 'table-primary-subtle': activeEditIndex === index }"
          >
            <td class="ps-3">
              <input
                v-if="activeEditIndex === index"
                v-model="epreuve.code"
                type="text"
                class="form-control form-control-sm font-monospace text-uppercase"
                placeholder="EX01"
              />
              <span v-else class="font-monospace fw-bold text-secondary">{{
                epreuve.code || '—'
              }}</span>
            </td>

            <td>
              <input
                v-if="activeEditIndex === index"
                v-model="epreuve.designation"
                type="text"
                class="form-control form-control-sm"
                placeholder="Ex: Mathématiques"
              />
              <span v-else class="fw-semibold text-dark">{{
                epreuve.designation || 'Sans intitulé'
              }}</span>
            </td>

            <td class="text-center">
              <div v-if="activeEditIndex === index" class="d-flex justify-content-center">
                <input
                  v-model.number="epreuve.coefficient"
                  type="number"
                  class="form-control form-control-sm text-center font-monospace"
                  min="1"
                  style="max-width: 70px"
                />
              </div>
              <span
                v-else
                class="font-monospace fw-bold bg-light px-2.5 py-1 rounded text-secondary border"
              >
                {{ epreuve.coefficient }}
              </span>
            </td>

            <td>
              <input
                v-if="activeEditIndex === index"
                v-model="epreuve.heure_debut"
                type="time"
                class="form-control form-control-sm font-monospace"
              />
              <span v-else class="font-monospace text-muted">
                <i class="bi bi-clock me-1 text-muted-light"></i
                >{{ epreuve.heure_debut || '--:--' }}
              </span>
            </td>

            <td>
              <input
                v-if="activeEditIndex === index"
                v-model="epreuve.heure_fin"
                type="time"
                class="form-control form-control-sm font-monospace"
              />
              <span v-else class="font-monospace text-muted">
                <i class="bi bi-clock-history me-1 text-muted-light"></i
                >{{ epreuve.heure_fin || '--:--' }}
              </span>
            </td>

            <td>
              <select
                v-if="activeEditIndex === index"
                v-model="epreuve.type_epreuve"
                class="form-select form-select-sm"
              >
                <option value="écrit">Écrit</option>
                <option value="oral">Oral</option>
                <option value="pratique">Pratique</option>
              </select>
              <span
                v-else
                class="badge px-2.5 py-1 text-capitalize fw-semibold text-xs"
                :class="getTypeBadgeClass(epreuve.type_epreuve)"
              >
                {{ epreuve.type_epreuve }}
              </span>
            </td>

            <td class="text-end pe-3">
              <div class="d-flex justify-content-end gap-1">
                <template v-if="activeEditIndex === index">
                  <button
                    class="btn btn-sm btn-success p-1 px-2"
                    @click="saveEpreuve(epreuve, index)"
                    title="Sauvegarder"
                  >
                    <i class="bi bi-check-lg"></i>
                  </button>
                  <button
                    class="btn btn-sm btn-light border p-1 px-2"
                    @click="cancelEdit(index)"
                    title="Annuler"
                  >
                    <i class="bi bi-x-lg"></i>
                  </button>
                </template>

                <template v-else>
                  <button
                    class="btn btn-sm btn-link text-primary p-1"
                    @click="activeEditIndex = index"
                    title="Modifier la ligne"
                  >
                    <i class="bi bi-pencil"></i>
                  </button>
                  <button
                    class="btn btn-sm btn-link text-danger p-1"
                    @click="removeEpreuve(index)"
                    title="Supprimer"
                  >
                    <i class="bi bi-trash"></i>
                  </button>
                </template>
              </div>
            </td>
          </tr>

          <tr v-if="loading && epreuves.length === 0">
            <td colspan="7" class="text-center py-5">
              <div class="spinner-border spinner-border-sm text-primary me-2" role="status"></div>
              <span class="text-muted text-xs">Synchronisation des épreuves avec le serveur...</span>
            </td>
          </tr>
        </tbody>

        <tfoot v-if="epreuves.length > 0" class="table-light border-top fw-bold">
          <tr>
            <td
              colspan="2"
              class="text-end ps-3 text-secondary text-uppercase font-monospace text-xs"
            >
              Total des Coefficients :
            </td>
            <td class="text-center font-monospace fs-5 text-primary fw-extrabold">
              {{ totalCoefficients }}
            </td>
            <td colspan="4"></td>
          </tr>
        </tfoot>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useConcoursStore } from '@/stores/gestionStores/concourStore'; // Vérifiez bien le chemin de l'import
import { useNotifier } from '@/stores/messages/useNotifier';


//update
const route = useRoute();
const concourStore = useConcoursStore();

const concoursId = computed(() => route.params.id); 

const { notifySuccess, notifyError } = useNotifier();

const epreuves = ref([]);
const activeEditIndex = ref(null); // Gère quelle ligne est en train d'être modifiée

// Liaison dynamique avec le spinner global du store Pinia
const loading = computed(() => concourStore.loading);

// Somme calculée automatiquement des coefficients du tableau
const totalCoefficients = computed(() => {
  return epreuves.value.reduce((sum, item) => sum + (Number(item.coefficient) || 0), 0);
});

onMounted(async () => {
  await loadEpreuvesData();
});

/* 1. Chargement des épreuves depuis le Store */
const loadEpreuvesData = async () => {
  try {
    if (concoursId.value) {
      //  Action corrigée selon votre store : fetchEpreuvesByConcours
      await concourStore.fetchEpreuvesByConcours(concoursId.value); 
      
      //  Variable d'état corrigée selon votre store : epreuvesList
      epreuves.value = JSON.parse(JSON.stringify(concourStore.epreuvesList || [])); 
    }
  } catch (err) {
    console.error('Erreur lors du chargement des épreuves:', err);
  }
};

watch(
  () => route.params.id,
  async (newId) => {
    if (newId) {
      activeEditIndex.value = null; // On ferme une éventuelle édition en cours
      await loadEpreuvesData();
    }
  }
);

/* 2. Initialisation d'une nouvelle ligne épreuve (en mémoire locale) */
const addEpreuve = () => {
  if (activeEditIndex.value !== null) {
    notifyError("Veuillez d'abord enregistrer l'épreuve en cours de modification.");
    return;
  }

  epreuves.value.push({
    code: '',
    designation: '',
    coefficient: 1,
    heure_debut: '',
    heure_fin: '',
    type_epreuve: 'écrit',
    isNew: true, // Drapeau temporaire local pour distinguer l'INSERT de l'UPDATE
  });

  // Ouvre automatiquement le mode édition sur la ligne neuve
  activeEditIndex.value = epreuves.value.length - 1;
};

/* 3. Annulation de l'action d'écriture */
const cancelEdit = (index) => {
  if (epreuves.value[index].isNew) {
    epreuves.value.splice(index, 1);
  } else {
    // Restauration de la ligne grâce aux données saines du store Pinia
    epreuves.value = JSON.parse(JSON.stringify(concourStore.epreuvesList || []));
  }
  activeEditIndex.value = null;
};

/* 4. Enregistrement (Création OU Modification) */
const saveEpreuve = async (epreuve, index) => {
  const error = validateEpreuve(epreuve);
  if (error) return notifyError(error);

  let typeNormalise = epreuve.type_epreuve.toUpperCase().trim();
  if (typeNormalise === 'ÉCRIT' || typeNormalise === 'ÉCRITE') {
    typeNormalise = 'ECRIT';
  }

  // Préparation du payload attendu par le Back-end (avec clefs d'injection)
  const payload = { 
    code: epreuve.code.trim().toUpperCase(),
    designation: epreuve.designation.trim(),
    coefficient: Number(epreuve.coefficient),
    heure_debut: epreuve.heure_debut,
    heure_fin: epreuve.heure_fin,
    type_epreuve: typeNormalise,
    concours_id: concoursId.value // Clé d'association parentale
  };

  try {
    if (epreuve.isNew) {
      await concourStore.addEpreuve(payload);
    } else {
      await concourStore.editEpreuve(epreuve.id, payload);
    }
    
    // Rechargement de l'état réactif et fermeture de la ligne éditable
    await loadEpreuvesData();
    activeEditIndex.value = null;
  } catch (err) {
    console.error("Échec de la sauvegarde", err);
  }
};

/* 5. Suppression d'une épreuve */
const removeEpreuve = async (index) => {
  const item = epreuves.value[index];
  
  if (confirm(`Êtes-vous sûr de vouloir retirer l'épreuve "${item.designation || item.code}" ?`)) {
    try {
      if (item.id) {
        // Alignement Action Store : removeEpreuve(id, currentConcoursId)
        await concourStore.removeEpreuve(item.id, concoursId);
      } else {
        epreuves.value.splice(index, 1);
      }
      await loadEpreuvesData();
      activeEditIndex.value = null;
    } catch (err) {
      console.error("Échec de la suppression", err);
    }
  }
};

/* Validation des contraintes métiers */
const validateEpreuve = (epreuve) => {
  if (!epreuve.code?.trim() || !epreuve.designation?.trim())
    return "Le code et l'intitulé de la matière sont obligatoires.";
  if (!epreuve.heure_debut || !epreuve.heure_fin)
    return 'Les horaires de début et de fin sont obligatoires.';
  if (epreuve.heure_debut >= epreuve.heure_fin)
    return "L'heure de fin doit impérativement être postérieure à l'heure de début.";
  if (!epreuve.coefficient || Number(epreuve.coefficient) <= 0)
    return 'Le coefficient doit être un entier supérieur à 0.';
  return null;
};

const getTypeBadgeClass = (type) => {
  const t = type?.toLowerCase();
  if (t === 'écrit') return 'bg-primary-subtle text-primary border border-primary-subtle';
  if (t === 'oral') return 'bg-info-subtle text-info border border-info-subtle';
  return 'bg-purple-subtle text-purple border border-purple-subtle';
};

const exportExcel = () => console.log('Exportation Excel lancée pour le concours :', concoursId);
</script>

<style scoped>
.text-xs {
  font-size: 0.75rem;
}
.text-sm {
  font-size: 0.875rem;
}
.fw-extrabold {
  font-weight: 800;
}
.gap-1\.5 {
  gap: 0.375rem;
}
.text-muted-light {
  color: #ced4da;
}

/* Couleur spécifique pour le type pratique (Violet) */
.bg-purple-subtle {
  background-color: #f3e5f5;
}
.text-purple {
  color: #7b1fa2;
}
.border-purple-subtle {
  border-color: #e1bee7;
}

/* Classes sur les lignes de tableaux */
.table-primary-subtle {
  background-color: #f0f7ff;
}
.form-control-sm,
.form-select-sm {
  border-radius: 0.375rem;
}

.custom-note-input {
  max-width: 90px;
  font-size: 14px;
}
.min-h-dropzone {
  min-height: 180px;
}
.border-dashed {
  border-style: dashed !important;
}
.text-xs {
  font-size: 11px !important;
}
</style>
