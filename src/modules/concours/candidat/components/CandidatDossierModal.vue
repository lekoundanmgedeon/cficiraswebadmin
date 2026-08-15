<script setup>
import { computed, watch } from 'vue';
import { storeToRefs } from 'pinia';
import LoadingSpinner from '@/shared/components/LoadingSpinner.vue';
import { formatDate } from '@/shared/utils/date';
import { useCandidatStore } from '../store';
import { useEpreuveConcoursStore } from '../../epreuve/store';
import { useConcoursStore } from '../../concours/store';
import { sexeLabel, statutDossierInfo } from '../../constants';

const props = defineProps({
  /** Candidat consulté, tel qu'il figure dans la liste. `null` = modale fermée. */
  candidat: { type: Object, default: null },
  concoursId: { type: String, required: true },
});

const emit = defineEmits(['close']);

/**
 * Dossier complet d'un candidat.
 *
 * Rassemble ce que trois lectures savent de lui, et rien de plus :
 *
 * | Bloc              | Source                                                  |
 * | ----------------- | ------------------------------------------------------- |
 * | Identité, contact | `GET /candidats/:id` — joint le dossier de candidature  |
 * | Notes par épreuve | `GET /candidats/concours/:id/epreuve?epreuve_code=`      |
 * | Moyenne et rang   | `GET /concours/:id/classement`                          |
 *
 * ⚠️ `GET /candidats/:id` répondait **400** jusqu'ici — « relation "candidat"
 * does not exist » : le modèle interrogeait la table au singulier. Corrigé côté
 * backend ; c'est ce qui rend ce dossier consultable.
 *
 * Les notes sont demandées **épreuve par épreuve** (une requête par épreuve, ici
 * quatre), puis gardées par le store : ouvrir le dossier d'un second candidat ne
 * coûte plus rien. Il n'existe pas de lecture « toutes les notes d'un candidat ».
 *
 * Ce que le dossier ne montre pas : les **pièces justificatives**. La table
 * `pieces_concours` existe et `POST /candidats/:id/pieces` les dépose, mais
 * **aucune route ne les liste**. Mieux vaut un bloc absent qu'un bloc vide qui
 * laisserait croire qu'aucune pièce n'a été versée.
 */

const candidatStore = useCandidatStore();
const epreuveStore = useEpreuveConcoursStore();
const concoursStore = useConcoursStore();

const { dossier, notesParEpreuve, loading } = storeToRefs(candidatStore);
const { ordonnees: epreuves } = storeToRefs(epreuveStore);
const { classement } = storeToRefs(concoursStore);

const ouvert = computed(() => Boolean(props.candidat));

/** Le dossier serveur quand il est arrivé, la ligne de liste en attendant. */
const fiche = computed(() => {
  if (dossier.value && dossier.value.id === props.candidat?.id) return dossier.value;
  return props.candidat ?? {};
});

const statutDossier = computed(() => statutDossierInfo(fiche.value.statut_dossier));

/** Une ligne par épreuve, notée ou non — l'absence de note est une information. */
const notes = computed(() =>
  epreuves.value.map((epreuve) => {
    const ligne = (notesParEpreuve.value[epreuve.code] ?? []).find(
      (candidat) => candidat.num_table === props.candidat?.num_table
    );

    return {
      code: epreuve.code,
      designation: epreuve.designation,
      coefficient: Number(epreuve.coefficient ?? 0),
      note: ligne?.note == null ? null : Number(ligne.note),
    };
  })
);

const notesConnues = computed(() => notes.value.filter((note) => note.note !== null));

/** Le rang vient du serveur : il tient compte de tous les candidats, pas de la page. */
const rang = computed(() =>
  classement.value.find((ligne) => ligne.candidat_id === props.candidat?.id)
);

const moyennePonderee = computed(() => {
  const serveur = Number(rang.value?.moyenne_generale);
  if (!Number.isNaN(serveur) && rang.value?.moyenne_generale != null) return serveur;

  // Repli quand le classement n'a pas encore été calculé : la moyenne des
  // épreuves notées, pondérée par leur coefficient.
  const total = notesConnues.value.reduce((somme, note) => somme + note.coefficient, 0);
  if (total === 0) return null;

  return (
    notesConnues.value.reduce((somme, note) => somme + note.note * note.coefficient, 0) / total
  );
});

// À l'ouverture seulement : le dossier serveur, les notes de chaque épreuve
// (gardées ensuite) et le classement.
watch(
  () => props.candidat,
  (candidat) => {
    if (!candidat) return;

    candidatStore.fetchDossier(candidat.id);
    for (const epreuve of epreuves.value) {
      candidatStore.fetchNotesEpreuve(props.concoursId, epreuve.code);
    }
    if (classement.value.length === 0) concoursStore.fetchClassement(props.concoursId);
  }
);
</script>

<template>
  <Teleport to="body">
    <div
      v-if="ouvert"
      class="modal fade show d-block"
      tabindex="-1"
      role="dialog"
      style="background-color: rgba(0, 0, 0, 0.5)"
      @click.self="emit('close')"
    >
      <div class="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable">
        <div class="modal-content border-0 shadow-lg">
          <div class="modal-header bg-primary text-white">
            <div>
              <h5 class="modal-title mb-0">{{ fiche.nom }} {{ fiche.prenom }}</h5>
              <small class="opacity-75 font-monospace">{{ fiche.num_table }}</small>
            </div>
            <button
              type="button"
              class="btn-close btn-close-white"
              aria-label="Fermer"
              @click="emit('close')"
            ></button>
          </div>

          <div class="modal-body p-4">
            <LoadingSpinner v-if="loading && !dossier" />

            <template v-else>
              <!-- Identité et contact -->
              <div class="row g-3 mb-4">
                <div class="col-md-6">
                  <h6 class="fw-bold text-secondary text-uppercase small mb-2">Identité</h6>
                  <dl class="row mb-0 small">
                    <dt class="col-5 text-muted fw-normal">Sexe</dt>
                    <dd class="col-7">{{ sexeLabel(fiche.sexe) }}</dd>

                    <dt class="col-5 text-muted fw-normal">Naissance</dt>
                    <dd class="col-7">
                      {{ formatDate(fiche.datenais, '—') }}
                      <div v-if="fiche.lieunais" class="text-muted">à {{ fiche.lieunais }}</div>
                    </dd>

                    <dt class="col-5 text-muted fw-normal">Nationalité</dt>
                    <dd class="col-7">{{ fiche.nationalite ?? '—' }}</dd>
                  </dl>
                </div>

                <div class="col-md-6">
                  <h6 class="fw-bold text-secondary text-uppercase small mb-2">Contact</h6>
                  <dl class="row mb-0 small">
                    <dt class="col-5 text-muted fw-normal">Courriel</dt>
                    <dd class="col-7 text-break">{{ fiche.email ?? '—' }}</dd>

                    <dt class="col-5 text-muted fw-normal">Téléphone</dt>
                    <dd class="col-7 font-monospace">{{ fiche.tel ?? '—' }}</dd>

                    <dt class="col-5 text-muted fw-normal">Adresse</dt>
                    <dd class="col-7">
                      {{ fiche.adresse ?? '—' }}
                      <div v-if="fiche.ville" class="text-muted">{{ fiche.ville }}</div>
                    </dd>
                  </dl>
                </div>
              </div>

              <!-- Dossier de candidature -->
              <div class="card border-0 bg-light mb-4">
                <div class="card-body py-3">
                  <div class="d-flex justify-content-between align-items-center flex-wrap gap-2">
                    <div>
                      <span class="text-muted small fw-semibold text-uppercase d-block mb-1">
                        Dossier de candidature
                      </span>
                      <span
                        class="badge rounded-pill px-3 py-2"
                        :class="`bg-${statutDossier.variant}-subtle text-${statutDossier.variant}`"
                      >
                        {{ statutDossier.label }}
                      </span>
                    </div>

                    <div class="text-end small">
                      <div class="text-muted">
                        Inscrit le {{ formatDate(fiche.date_inscription, '—') }}
                      </div>
                      <div v-if="fiche.date_depot_dossier" class="text-muted">
                        Dossier déposé le {{ formatDate(fiche.date_depot_dossier, '—') }}
                      </div>
                    </div>
                  </div>

                  <div v-if="fiche.motif_rejet_dossier" class="alert alert-danger mt-3 mb-0 py-2">
                    <strong class="small">Motif du rejet :</strong>
                    <span class="small">{{ fiche.motif_rejet_dossier }}</span>
                  </div>
                </div>
              </div>

              <!-- Résultats -->
              <h6 class="fw-bold text-secondary text-uppercase small mb-2">
                Résultats par épreuve
              </h6>

              <p v-if="epreuves.length === 0" class="text-muted small">
                Aucune épreuve n'est définie pour ce concours.
              </p>

              <div v-else class="table-responsive border rounded mb-3">
                <table class="table table-sm align-middle mb-0">
                  <thead class="table-light">
                    <tr>
                      <th class="ps-3">Épreuve</th>
                      <th class="text-center">Coef.</th>
                      <th class="text-end pe-3">Note / 20</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="note in notes" :key="note.code">
                      <td class="ps-3">
                        <span class="font-monospace fw-bold text-secondary me-2">
                          {{ note.code }}
                        </span>
                        <span class="small">{{ note.designation }}</span>
                      </td>
                      <td class="text-center small">{{ note.coefficient }}</td>
                      <td class="text-end pe-3 font-monospace fw-bold">
                        <span v-if="note.note !== null">{{ note.note.toFixed(2) }}</span>
                        <span v-else class="text-muted fw-normal small">Non notée</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div class="row g-3">
                <div class="col-6">
                  <div class="border rounded p-3 text-center h-100">
                    <span class="text-muted small text-uppercase d-block">Moyenne générale</span>
                    <span class="fw-bold fs-5 font-monospace">
                      {{ moyennePonderee !== null ? moyennePonderee.toFixed(2) : '—' }}
                    </span>
                    <div v-if="notesConnues.length < notes.length" class="text-muted text-xs mt-1">
                      {{ notesConnues.length }}/{{ notes.length }} épreuve(s) notée(s)
                    </div>
                  </div>
                </div>

                <div class="col-6">
                  <div class="border rounded p-3 text-center h-100">
                    <span class="text-muted small text-uppercase d-block">Rang</span>
                    <span class="fw-bold fs-5 font-monospace">{{ rang?.rang ?? '—' }}</span>
                    <div v-if="!rang" class="text-muted text-xs mt-1">
                      Classement non encore calculé
                    </div>
                  </div>
                </div>
              </div>
            </template>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="emit('close')">Fermer</button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.text-xs {
  font-size: 0.72rem;
}
</style>
