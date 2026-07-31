<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useSalleStore } from '@/modules/examens/salle/store';
import { useFormateurStore } from '@/modules/pedagogies/formateurs/store';
import { useTravailStore } from '../../travaux/store';
import { useSoutenanceStore } from '../store';
import { useSoutenanceForm } from '../composables/useSoutenanceForm';
import {
  ROLES_JURY,
  SOUTENANCE_MODAL_ID,
  STATUT_SOUTENANCE_LIST,
  TYPES_SOUTENANCE,
} from '../../constants';

/**
 * Planification d'une soutenance : le jour, l'heure, la salle et le jury.
 *
 * ## La soutenance part du mémoire
 *
 * Choisir le travail renseigne l'étudiant et le titre : c'est le même objet vu
 * plus tard. On peut encore corriger le titre — la table `soutenances` porte son
 * propre `titre_projet`, et un intitulé de soutenance diffère parfois du thème
 * initial — mais on ne saisit pas l'étudiant deux fois.
 *
 * ## Le jury part avec la soutenance
 *
 * Le serveur enregistre les deux dans **une transaction** : un jury à moitié
 * inséré ne vaut rien. Les quatre rôles viennent de la contrainte `CHECK` de
 * `soutenance_jurys` — président, rapporteur, examinateur, invité.
 */

const store = useSoutenanceStore();
const travailStore = useTravailStore();
const salleStore = useSalleStore();
const formateurStore = useFormateurStore();

const { selectedSoutenance, close } = useSoutenanceForm();
const { items: travaux } = storeToRefs(travailStore);
const { items: salles } = storeToRefs(salleStore);
const { items: formateurs } = storeToRefs(formateurStore);

const FORMULAIRE_VIDE = {
  travail_id: '',
  etudiant_id: '',
  titre_projet: '',
  type_soutenance: 'MEMOIRE',
  date_soutenance: '',
  heure_debut: '09:00',
  heure_fin: '11:00',
  salle_id: '',
  statut: 'PLANIFIEE',
};

const form = ref({ ...FORMULAIRE_VIDE });
const jurys = ref([]);
const errorMessage = ref('');

const isEdit = computed(() => Boolean(selectedSoutenance.value?.id));
const loading = computed(() => store.loading);

/** Les travaux soutenables : ceux qui ne sont ni abandonnés ni déjà validés. */
const travauxDisponibles = computed(() =>
  travaux.value.filter((travail) => !['ABANDONNE', 'VALIDE'].includes(travail.statut))
);

onMounted(async () => {
  await Promise.all([travailStore.fetchAll(), salleStore.fetchAll(), formateurStore.fetchAll()]);
});

watch(
  selectedSoutenance,
  (soutenance) => {
    errorMessage.value = '';

    if (!soutenance) {
      form.value = { ...FORMULAIRE_VIDE };
      jurys.value = [{ enseignant_id: '', role: 'PRESIDENT' }];
      return;
    }

    form.value = {
      travail_id: soutenance.travail_id ?? '',
      etudiant_id: soutenance.etudiant_id ?? '',
      titre_projet: soutenance.titre_projet ?? soutenance.theme ?? '',
      type_soutenance: soutenance.type_soutenance ?? 'MEMOIRE',
      date_soutenance: (soutenance.date_soutenance ?? '').slice(0, 10),
      heure_debut: (soutenance.heure_debut ?? '09:00').slice(0, 5),
      heure_fin: (soutenance.heure_fin ?? '11:00').slice(0, 5),
      salle_id: soutenance.salle_id ?? '',
      statut: soutenance.statut ?? 'PLANIFIEE',
    };
    jurys.value = [];
  },
  { immediate: true }
);

// Choisir le mémoire renseigne l'étudiant et propose son thème comme titre :
// les ressaisir serait deux occasions de se tromper.
watch(
  () => form.value.travail_id,
  (travailId) => {
    if (!travailId) return;

    const travail = travaux.value.find((item) => String(item.id) === String(travailId));
    if (!travail) return;

    form.value.etudiant_id = travail.etudiant_id;
    if (!form.value.titre_projet) form.value.titre_projet = travail.theme;
    if (travail.type_travail === 'THESE') form.value.type_soutenance = 'THESE';
  }
);

function ajouterMembre() {
  jurys.value.push({ enseignant_id: '', role: 'EXAMINATEUR' });
}

/** @param {number} index */
function retirerMembre(index) {
  jurys.value.splice(index, 1);
}

/** @returns {boolean} */
function valider() {
  if (!form.value.etudiant_id) {
    errorMessage.value = 'Choisissez le mémoire — il désigne l’étudiant qui soutient.';
    return false;
  }
  if (!form.value.titre_projet.trim()) {
    errorMessage.value = 'Le titre du projet est obligatoire.';
    return false;
  }
  if (!form.value.date_soutenance) {
    errorMessage.value = 'La date de soutenance est obligatoire.';
    return false;
  }
  if (form.value.heure_fin <= form.value.heure_debut) {
    errorMessage.value = 'L’heure de fin doit être postérieure à l’heure de début.';
    return false;
  }

  const membres = jurys.value.filter((membre) => membre.enseignant_id);
  const identifiants = membres.map((membre) => membre.enseignant_id);

  if (new Set(identifiants).size !== identifiants.length) {
    errorMessage.value = 'Un même enseignant ne peut occuper deux sièges du jury.';
    return false;
  }

  errorMessage.value = '';
  return true;
}

async function submit() {
  if (!valider()) return;

  const charge = {
    ...form.value,
    travail_id: form.value.travail_id || null,
    salle_id: form.value.salle_id || null,
    jurys: jurys.value.filter((membre) => membre.enseignant_id),
  };

  const result = isEdit.value
    ? await store.update(selectedSoutenance.value.id, charge)
    : await store.create(charge);

  if (result === undefined) return;

  // À la modification, le jury se remplace par sa propre route : `PUT
  // /soutenances/:id` ne touche pas à la composition.
  if (isEdit.value && jurys.value.length > 0) {
    await store.enregistrerJury(selectedSoutenance.value.id, charge.jurys);
  }

  await store.fetchAll();
  close();
}
</script>

<template>
  <div :id="SOUTENANCE_MODAL_ID" class="modal fade" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered modal-lg">
      <div class="modal-content">
        <div class="modal-header bg-primary text-white">
          <h5 class="modal-title">
            {{ isEdit ? 'Modifier la soutenance' : 'Planifier une soutenance' }}
          </h5>
          <button
            type="button"
            class="btn-close btn-close-white"
            data-bs-dismiss="modal"
            aria-label="Fermer"
          ></button>
        </div>

        <form @submit.prevent="submit">
          <div class="modal-body">
            <div class="row g-3">
              <div class="col-md-8">
                <label for="soutenance-travail" class="form-label">
                  Mémoire soutenu <span class="text-danger">*</span>
                </label>
                <select id="soutenance-travail" v-model="form.travail_id" class="form-select">
                  <option value="">— Choisir un travail —</option>
                  <option
                    v-for="travail in travauxDisponibles"
                    :key="travail.id"
                    :value="travail.id"
                  >
                    {{ travail.etudiant_nom }} {{ travail.etudiant_prenom }} — {{ travail.theme }}
                  </option>
                </select>
                <div class="form-text" style="font-size: 11px">
                  Le mémoire désigne l'étudiant et propose son thème comme titre.
                </div>
              </div>

              <div class="col-md-4">
                <label for="soutenance-type" class="form-label">Nature</label>
                <select id="soutenance-type" v-model="form.type_soutenance" class="form-select">
                  <option v-for="type in TYPES_SOUTENANCE" :key="type.code" :value="type.code">
                    {{ type.label }}
                  </option>
                </select>
              </div>

              <div class="col-12">
                <label for="soutenance-titre" class="form-label">
                  Titre du projet <span class="text-danger">*</span>
                </label>
                <input
                  id="soutenance-titre"
                  v-model="form.titre_projet"
                  type="text"
                  class="form-control"
                  maxlength="255"
                  required
                />
              </div>

              <div class="col-md-3">
                <label for="soutenance-date" class="form-label">
                  Date <span class="text-danger">*</span>
                </label>
                <input
                  id="soutenance-date"
                  v-model="form.date_soutenance"
                  type="date"
                  class="form-control"
                  required
                />
              </div>

              <div class="col-md-2">
                <label for="soutenance-debut" class="form-label">Début</label>
                <input
                  id="soutenance-debut"
                  v-model="form.heure_debut"
                  type="time"
                  class="form-control"
                  required
                />
              </div>

              <div class="col-md-2">
                <label for="soutenance-fin" class="form-label">Fin</label>
                <input
                  id="soutenance-fin"
                  v-model="form.heure_fin"
                  type="time"
                  class="form-control"
                  required
                />
              </div>

              <div class="col-md-3">
                <label for="soutenance-salle" class="form-label">Salle</label>
                <select id="soutenance-salle" v-model="form.salle_id" class="form-select">
                  <option value="">— À définir —</option>
                  <option v-for="salle in salles" :key="salle.id" :value="salle.id">
                    {{ salle.code_salle }} — {{ salle.batiment }} ({{ salle.capacite }} pl.)
                  </option>
                </select>
              </div>

              <div class="col-md-2">
                <label for="soutenance-statut" class="form-label">Statut</label>
                <select id="soutenance-statut" v-model="form.statut" class="form-select">
                  <option
                    v-for="statut in STATUT_SOUTENANCE_LIST"
                    :key="statut.code"
                    :value="statut.code"
                  >
                    {{ statut.label }}
                  </option>
                </select>
              </div>

              <!-- Jury -->
              <div class="col-12">
                <div class="d-flex justify-content-between align-items-center mb-2">
                  <label class="form-label mb-0">Composition du jury</label>
                  <button
                    class="btn btn-sm btn-outline-primary"
                    type="button"
                    @click="ajouterMembre"
                  >
                    + Ajouter un membre
                  </button>
                </div>

                <p v-if="isEdit && !jurys.length" class="text-muted small">
                  Le jury enregistré n'est pas rechargé ici : ajoutez des membres pour le
                  <strong>remplacer</strong> entièrement, ou laissez vide pour le conserver.
                </p>

                <div
                  v-for="(membre, index) in jurys"
                  :key="index"
                  class="row g-2 align-items-end mb-2"
                >
                  <div class="col-md-7">
                    <select v-model="membre.enseignant_id" class="form-select form-select-sm">
                      <option value="">— Choisir un enseignant —</option>
                      <option
                        v-for="formateur in formateurs"
                        :key="formateur.id"
                        :value="formateur.id"
                      >
                        {{ formateur.nom }} {{ formateur.prenom }}
                      </option>
                    </select>
                  </div>
                  <div class="col-md-4">
                    <select v-model="membre.role" class="form-select form-select-sm">
                      <option v-for="role in ROLES_JURY" :key="role.code" :value="role.code">
                        {{ role.label }}
                      </option>
                    </select>
                  </div>
                  <div class="col-md-1 d-grid">
                    <button
                      class="btn btn-sm btn-outline-danger"
                      type="button"
                      :aria-label="`Retirer le membre ${index + 1}`"
                      @click="retirerMembre(index)"
                    >
                      <i class="mdi mdi-close"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div v-if="errorMessage" class="alert alert-danger mt-3 mb-0" role="alert">
              <i class="mdi mdi-alert-circle me-1"></i> {{ errorMessage }}
            </div>
          </div>

          <div class="modal-footer">
            <button
              type="button"
              class="btn btn-secondary"
              data-bs-dismiss="modal"
              :disabled="loading"
            >
              Annuler
            </button>
            <button type="submit" class="btn btn-primary" :disabled="loading">
              <span
                v-if="loading"
                class="spinner-border spinner-border-sm me-2"
                aria-hidden="true"
              ></span>
              {{ loading ? 'Enregistrement...' : 'Enregistrer' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
