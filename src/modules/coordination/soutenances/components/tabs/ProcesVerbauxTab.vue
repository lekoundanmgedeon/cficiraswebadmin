<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import EmptyState from '@/shared/components/EmptyState.vue';
import LoadingSpinner from '@/shared/components/LoadingSpinner.vue';
import { formatDate } from '@/shared/utils/date';
import { useSoutenanceStore } from '../../store';
import {
  DECISION_PV_LIST,
  MENTIONS_PV,
  NOTE_BORNES,
  roleJuryLabel,
  statutPvInfo,
} from '../../../constants';

/**
 * Procès-verbaux de soutenance : rédaction, puis validation.
 *
 * ## Un PV par soutenance, et un numéro qui ne bouge pas
 *
 * La table impose l'unicité (`soutenance_id UNIQUE`) : rédiger en deux fois ne
 * produit pas deux documents concurrents. Le numéro officiel est posé par la
 * base à la création (`fn_numero_document('PV_SOUTENANCE', 'PV')`) et ne change
 * jamais.
 *
 * ## La validation est un acte, pas un enregistrement
 *
 * Valider rend le PV opposable, fait passer la soutenance à « tenue » et le
 * mémoire à « soutenu ». La base refuse un PV validé sans décision ni note
 * (contrainte `pv_validation_complete`) — l'écran désactive donc le bouton
 * plutôt que de laisser partir une requête qui échouera.
 */

const store = useSoutenanceStore();
const { items: soutenances, dossier, loading } = storeToRefs(store);

const selectedId = ref('');
const form = ref({
  note_finale: null,
  mention: '',
  decision: 'EN_ATTENTE',
  observations: '',
  recommandations: '',
});

onMounted(() => store.fetchAll());

/** On ne rédige un PV que pour une soutenance qui a eu lieu ou va avoir lieu. */
const soutenancesRedigeables = computed(() =>
  soutenances.value.filter((soutenance) => ['PLANIFIEE', 'TENUE'].includes(soutenance.statut))
);

const pv = computed(() => dossier.value?.proces_verbal ?? null);
const estValide = computed(() => pv.value?.statut && pv.value.statut !== 'BROUILLON');

watch(selectedId, async (id) => {
  await store.fetchDossier(id);

  const existant = store.dossier?.proces_verbal;
  form.value = existant
    ? {
        note_finale: existant.note_finale === null ? null : Number(existant.note_finale),
        mention: existant.mention ?? '',
        decision: existant.decision ?? 'EN_ATTENTE',
        observations: existant.observations ?? '',
        recommandations: existant.recommandations ?? '',
      }
    : {
        note_finale: null,
        mention: '',
        decision: 'EN_ATTENTE',
        observations: '',
        recommandations: '',
      };
});

const noteInvalide = computed(() => {
  if (form.value.note_finale === null || form.value.note_finale === '') return false;
  const note = Number(form.value.note_finale);
  return Number.isNaN(note) || note < NOTE_BORNES.MIN || note > NOTE_BORNES.MAX;
});

/** Ce que la base exigera au moment de valider. */
const pretAValider = computed(
  () =>
    Boolean(pv.value) &&
    !estValide.value &&
    pv.value.decision !== 'EN_ATTENTE' &&
    pv.value.note_finale !== null
);

async function enregistrer() {
  if (noteInvalide.value) return;

  await store.enregistrerProcesVerbal(selectedId.value, {
    ...form.value,
    note_finale: form.value.note_finale === '' ? null : form.value.note_finale,
    mention: form.value.mention || null,
  });
}

async function valider() {
  await store.validerPv(selectedId.value);
}
</script>

<template>
  <div>
    <div class="mb-3">
      <h4 class="mb-1">Procès-verbaux</h4>
      <p class="mb-0 text-muted small">
        Verdict du jury, mention et observations. Le numéro officiel est attribué à la création.
      </p>
    </div>

    <LoadingSpinner v-if="loading && !soutenances.length" />

    <EmptyState
      v-else-if="!soutenancesRedigeables.length"
      title="Aucune soutenance à acter"
      description="Un procès-verbal se rédige pour une soutenance planifiée ou tenue."
    />

    <template v-else>
      <div class="card border-0 shadow-sm mb-3">
        <div class="card-body">
          <label for="pv-soutenance" class="form-label small fw-semibold text-secondary">
            Soutenance
          </label>
          <select id="pv-soutenance" v-model="selectedId" class="form-select">
            <option value="">— Choisir une soutenance —</option>
            <option
              v-for="soutenance in soutenancesRedigeables"
              :key="soutenance.id"
              :value="soutenance.id"
            >
              {{ formatDate(soutenance.date_soutenance) }} — {{ soutenance.nom }}
              {{ soutenance.prenom }} — {{ soutenance.theme }}
            </option>
          </select>
        </div>
      </div>

      <EmptyState
        v-if="!selectedId"
        title="Choisissez une soutenance"
        description="Son procès-verbal s'ouvrira ici, existant ou à créer."
        :size="80"
      />

      <div v-else-if="dossier" class="row g-3">
        <!-- Le dossier -->
        <div class="col-lg-4">
          <div class="card border-0 shadow-sm h-100">
            <div class="card-body">
              <h6 class="text-uppercase text-secondary small fw-bold mb-3">La soutenance</h6>

              <dl class="row small mb-3">
                <dt class="col-5 text-muted fw-normal">Étudiant</dt>
                <dd class="col-7 fw-semibold">{{ dossier.nom }} {{ dossier.prenom }}</dd>

                <dt class="col-5 text-muted fw-normal">Matricule</dt>
                <dd class="col-7 font-monospace">{{ dossier.matricule }}</dd>

                <dt class="col-5 text-muted fw-normal">Sujet</dt>
                <dd class="col-7">{{ dossier.theme }}</dd>

                <dt class="col-5 text-muted fw-normal">Date</dt>
                <dd class="col-7">{{ formatDate(dossier.date_soutenance) }}</dd>

                <dt class="col-5 text-muted fw-normal">Salle</dt>
                <dd class="col-7">{{ dossier.code_salle || 'À définir' }}</dd>
              </dl>

              <h6 class="text-uppercase text-secondary small fw-bold mb-2">Jury</h6>
              <p v-if="!dossier.jurys?.length" class="text-warning small mb-0">
                Aucun membre enregistré : composez le jury avant de valider le procès-verbal.
              </p>
              <ul v-else class="list-unstyled small mb-0">
                <li
                  v-for="membre in dossier.jurys"
                  :key="membre.enseignant_id"
                  class="d-flex justify-content-between border-bottom py-1"
                >
                  <span>{{ membre.nom }} {{ membre.prenom }}</span>
                  <span class="badge bg-light text-dark border">
                    {{ roleJuryLabel(membre.role) }}
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <!-- Le procès-verbal -->
        <div class="col-lg-8">
          <div class="card border-0 shadow-sm h-100">
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-start mb-3 flex-wrap gap-2">
                <h6 class="text-uppercase text-secondary small fw-bold mb-0">
                  Procès-verbal
                  <span v-if="pv?.numero" class="font-monospace text-dark ms-1">
                    {{ pv.numero }}
                  </span>
                </h6>
                <span
                  class="badge"
                  :class="`bg-${statutPvInfo(pv?.statut).variant}-subtle text-${statutPvInfo(pv?.statut).variant}`"
                >
                  {{ statutPvInfo(pv?.statut).label }}
                </span>
              </div>

              <div v-if="estValide" class="alert alert-success py-2 small">
                <i class="bi bi-lock me-1"></i>
                Ce procès-verbal est validé le {{ formatDate(pv.date_validation) }} : il fait foi et
                n'est plus modifiable ici.
              </div>

              <div class="row g-3">
                <div class="col-md-3">
                  <label for="pv-note" class="form-label small fw-semibold">Note finale /20</label>
                  <input
                    id="pv-note"
                    v-model.number="form.note_finale"
                    type="number"
                    class="form-control"
                    :class="{ 'is-invalid': noteInvalide }"
                    :min="NOTE_BORNES.MIN"
                    :max="NOTE_BORNES.MAX"
                    step="0.25"
                    :disabled="estValide"
                  />
                  <div v-if="noteInvalide" class="invalid-feedback">
                    Note attendue entre {{ NOTE_BORNES.MIN }} et {{ NOTE_BORNES.MAX }}.
                  </div>
                </div>

                <div class="col-md-4">
                  <label for="pv-mention" class="form-label small fw-semibold">Mention</label>
                  <select
                    id="pv-mention"
                    v-model="form.mention"
                    class="form-select"
                    :disabled="estValide"
                  >
                    <option value="">— Aucune —</option>
                    <option
                      v-for="mention in MENTIONS_PV"
                      :key="mention.code"
                      :value="mention.code"
                    >
                      {{ mention.label }}
                    </option>
                  </select>
                </div>

                <div class="col-md-5">
                  <label for="pv-decision" class="form-label small fw-semibold">
                    Décision du jury
                  </label>
                  <select
                    id="pv-decision"
                    v-model="form.decision"
                    class="form-select"
                    :disabled="estValide"
                  >
                    <option
                      v-for="decision in DECISION_PV_LIST"
                      :key="decision.code"
                      :value="decision.code"
                    >
                      {{ decision.label }}
                    </option>
                  </select>
                </div>

                <div class="col-12">
                  <label for="pv-observations" class="form-label small fw-semibold">
                    Observations du jury
                  </label>
                  <textarea
                    id="pv-observations"
                    v-model="form.observations"
                    class="form-control"
                    rows="3"
                    :disabled="estValide"
                  ></textarea>
                </div>

                <div class="col-12">
                  <label for="pv-recommandations" class="form-label small fw-semibold">
                    Recommandations
                  </label>
                  <textarea
                    id="pv-recommandations"
                    v-model="form.recommandations"
                    class="form-control"
                    rows="2"
                    :disabled="estValide"
                  ></textarea>
                </div>
              </div>

              <div class="d-flex gap-2 mt-3 flex-wrap align-items-center">
                <button
                  class="btn btn-primary btn-sm"
                  type="button"
                  :disabled="estValide || loading || noteInvalide"
                  @click="enregistrer"
                >
                  {{ pv ? 'Enregistrer les modifications' : 'Créer le procès-verbal' }}
                </button>

                <button
                  class="btn btn-success btn-sm"
                  type="button"
                  :disabled="!pretAValider || loading"
                  @click="valider"
                >
                  <i class="bi bi-check2-square me-1"></i> Valider le procès-verbal
                </button>

                <span v-if="pv && !estValide && !pretAValider" class="text-muted small">
                  La validation exige une décision et une note : enregistrez-les d'abord.
                </span>
              </div>

              <p class="text-muted mt-3 mb-0" style="font-size: 11px">
                Valider fait passer la soutenance à « tenue » et le mémoire à « soutenu ».
              </p>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
