<script setup>
import { computed, onMounted, ref } from 'vue';
import { storeToRefs } from 'pinia';
import EmptyState from '@/shared/components/EmptyState.vue';
import LoadingSpinner from '@/shared/components/LoadingSpinner.vue';
import Pagination from '@/components/shared/Pagination.vue';
import { usePagination } from '@/shared/composables/usePagination';
import { formatDate } from '@/shared/utils/date';
import { useTravailStore } from '../../store';
import {
  SITUATION_LIST,
  situationInfo,
  STATUT_TRAVAIL_LIST,
  statutTravailInfo,
} from '../../../constants';

/**
 * Suivi des travaux : avancement, situation, soumission.
 *
 * L'écran est éditable ligne à ligne — c'est le geste réel du coordinateur, qui
 * met à jour une progression après un point d'étape, pas un formulaire complet.
 * Chaque enregistrement n'envoie que les champs du suivi (`progression`,
 * `statut`, `situation`, `lieu_travail`, `date_soumission_effective`) : le thème
 * et l'encadrement ne peuvent pas être modifiés par mégarde depuis ici.
 */

const store = useTravailStore();
const { items: travaux, loading } = storeToRefs(store);

/** Brouillons de suivi, par identifiant de travail. */
const brouillon = ref({});
const enregistrement = ref('');
const filtreRetard = ref(false);

onMounted(() => store.fetchAll());

const lignes = computed(() =>
  (filtreRetard.value ? store.enRetard : travaux.value)
    .slice()
    .sort((a, b) =>
      String(a.date_soumission_prevue).localeCompare(String(b.date_soumission_prevue))
    )
);

/**
 * 273 travaux suivis, rendus d'un bloc — chacun avec son curseur d'avancement.
 *
 * ⚠️ Le découpage ne porte que sur l'affichage. Les modifications en cours
 * vivent dans `brouillon`, indexé par identifiant de travail : une progression
 * ajustée en page 1 est toujours là au retour, et chaque ligne s'enregistre
 * séparément — il n'y a pas d'enregistrement global qui pourrait oublier les
 * lignes hors page.
 */
const { page, itemsPerPage, startIndex, paginated } = usePagination(lignes, {
  perPage: 15,
  resetKey: () => filtreRetard.value,
});

/** @param {any} travail @param {string} champ */
function valeur(travail, champ) {
  const modifie = brouillon.value[travail.id]?.[champ];
  if (modifie !== undefined) return modifie;

  if (champ === 'date_soumission_effective') {
    return (travail.date_soumission_effective ?? '').slice(0, 10);
  }
  return travail[champ] ?? '';
}

/** @param {any} travail @param {string} champ @param {any} valeurSaisie */
function modifier(travail, champ, valeurSaisie) {
  brouillon.value[travail.id] = { ...(brouillon.value[travail.id] ?? {}), [champ]: valeurSaisie };
}

/** @param {any} travail */
const estModifie = (travail) => Boolean(brouillon.value[travail.id]);

/** @param {any} travail */
async function enregistrer(travail) {
  const suivi = brouillon.value[travail.id];
  if (!suivi) return;

  enregistrement.value = travail.id;

  const charge = {
    ...suivi,
    ...(suivi.progression !== undefined ? { progression: Number(suivi.progression) } : {}),
    ...(suivi.date_soumission_effective === '' ? { date_soumission_effective: null } : {}),
  };

  const result = await store.majSuivi(travail.id, charge);
  enregistrement.value = '';

  if (result !== undefined) {
    delete brouillon.value[travail.id];
  }
}

/** @param {number} progression */
const barre = (progression) => {
  if (progression >= 100) return 'bg-success';
  if (progression >= 60) return 'bg-primary';
  if (progression >= 30) return 'bg-info';
  return 'bg-warning';
};
</script>

<template>
  <div>
    <div class="d-flex justify-content-between align-items-start mb-3 flex-wrap gap-2">
      <div>
        <h4 class="mb-1">Suivi & échéances</h4>
        <p class="mb-0 text-muted small">
          Avancement des travaux, situation de l'étudiant et date de soumission effective.
        </p>
      </div>
      <div class="form-check align-self-center">
        <input id="suivi-retard" v-model="filtreRetard" class="form-check-input" type="checkbox" />
        <label class="form-check-label small" for="suivi-retard">
          En retard seulement ({{ store.enRetard.length }})
        </label>
      </div>
    </div>

    <LoadingSpinner v-if="loading && !travaux.length" />

    <EmptyState
      v-else-if="!travaux.length"
      title="Aucun travail à suivre"
      description="Attribuez d'abord des thèmes depuis l'onglet « Attribution des thèmes »."
    />

    <EmptyState
      v-else-if="!lignes.length"
      title="Aucun travail en retard"
      description="Toutes les échéances sont tenues."
      :size="80"
    />

    <div v-else class="table-responsive card border-0 shadow-sm">
      <table class="table align-middle mb-0">
        <thead class="table-light">
          <tr>
            <th class="ps-3" style="width: 60px">#</th>
            <th>Étudiant & thème</th>
            <th style="width: 190px">Avancement</th>
            <th style="width: 150px">Statut</th>
            <th style="width: 150px">Situation</th>
            <th style="width: 160px">Soumis le</th>
            <th class="text-end pe-3" style="width: 130px">
              <span class="visually-hidden">Enregistrer</span>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(travail, index) in paginated" :key="travail.id">
            <td class="ps-3 text-muted small">{{ startIndex + index + 1 }}</td>
            <td>
              <span class="fw-semibold text-dark d-block">{{ travail.theme }}</span>
              <span class="text-muted small">
                {{ travail.etudiant_nom }} {{ travail.etudiant_prenom }} · échéance
                {{ formatDate(travail.date_soumission_prevue) }}
                <span v-if="travail.en_retard" class="text-danger fw-semibold">(en retard)</span>
              </span>
            </td>

            <td>
              <input
                :value="valeur(travail, 'progression')"
                type="range"
                min="0"
                max="100"
                step="5"
                class="form-range"
                :aria-label="`Avancement de ${travail.theme}`"
                @input="modifier(travail, 'progression', $event.target.value)"
              />
              <div class="d-flex align-items-center gap-2">
                <div class="progress flex-grow-1" style="height: 5px">
                  <div
                    class="progress-bar"
                    :class="barre(Number(valeur(travail, 'progression')))"
                    :style="{ width: `${valeur(travail, 'progression')}%` }"
                  ></div>
                </div>
                <span class="small font-monospace">{{ valeur(travail, 'progression') }} %</span>
              </div>
            </td>

            <td>
              <select
                :value="valeur(travail, 'statut')"
                class="form-select form-select-sm"
                :aria-label="`Statut de ${travail.theme}`"
                @change="modifier(travail, 'statut', $event.target.value)"
              >
                <option v-for="item in STATUT_TRAVAIL_LIST" :key="item.code" :value="item.code">
                  {{ item.label }}
                </option>
              </select>
              <span
                class="badge mt-1"
                :class="`bg-${statutTravailInfo(travail.statut).variant}-subtle text-${statutTravailInfo(travail.statut).variant}`"
              >
                enregistré : {{ statutTravailInfo(travail.statut).label }}
              </span>
            </td>

            <td>
              <select
                :value="valeur(travail, 'situation')"
                class="form-select form-select-sm"
                :aria-label="`Situation de ${travail.etudiant_nom}`"
                @change="modifier(travail, 'situation', $event.target.value)"
              >
                <option v-for="item in SITUATION_LIST" :key="item.code" :value="item.code">
                  {{ item.label }}
                </option>
              </select>
              <span
                v-if="travail.lieu_travail"
                class="text-muted d-block mt-1"
                style="font-size: 11px"
              >
                {{ travail.lieu_travail }}
              </span>
              <span
                v-else
                class="badge mt-1"
                :class="`bg-${situationInfo(travail.situation).variant}-subtle text-${situationInfo(travail.situation).variant}`"
              >
                {{ situationInfo(travail.situation).label }}
              </span>
            </td>

            <td>
              <input
                :value="valeur(travail, 'date_soumission_effective')"
                type="date"
                class="form-control form-control-sm"
                :aria-label="`Date de soumission de ${travail.theme}`"
                @change="modifier(travail, 'date_soumission_effective', $event.target.value)"
              />
            </td>

            <td class="text-end pe-3">
              <button
                class="btn btn-sm btn-outline-primary"
                type="button"
                :disabled="!estModifie(travail) || enregistrement === travail.id"
                @click="enregistrer(travail)"
              >
                <span
                  v-if="enregistrement === travail.id"
                  class="spinner-border spinner-border-sm me-1"
                  aria-hidden="true"
                ></span>
                Enregistrer
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      <div class="card-footer bg-white border-top py-3 px-3">
        <Pagination
          v-model="page"
          v-model:items-per-page="itemsPerPage"
          :total-items="lignes.length"
        />
      </div>
    </div>
  </div>
</template>
