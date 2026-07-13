<script setup>
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import EmptyState from '@/shared/components/EmptyState.vue';
import { formatDate } from '@/shared/utils/date';
import { sexeLabel } from '@/modules/etudiants/constants';
import { useDossierStore } from '../../store';

/**
 * État civil et tuteurs.
 *
 * `ProfilEtudiant.vue` déclarait ses données ainsi :
 *
 * ```js
 * // Ces données viendront normalement d'un Fetch API ou d'un Store Pinia
 * const etudiant = ref({ ... })   // ← codé en dur
 * ```
 *
 * Elles viennent maintenant de `GET /etudiants/:id/complet`, qui les sert avec
 * les tuteurs. Une ligne n'apparaît que si **sa propre** valeur est renseignée.
 */

const dossierStore = useDossierStore();
const { dossier, tuteurs } = storeToRefs(dossierStore);

const identite = computed(() => {
  const value = dossier.value ?? {};

  return [
    { label: 'Matricule', value: value.matricule },
    { label: 'Nom', value: value.nom },
    { label: 'Prénom', value: value.prenom },
    { label: 'Sexe', value: value.sexe ? sexeLabel(value.sexe) : null },
    {
      label: 'Date de naissance',
      value: value.date_naissance ? formatDate(value.date_naissance) : null,
    },
    { label: 'Lieu de naissance', value: value.lieu_naissance },
  ].filter((row) => Boolean(row.value));
});

const contact = computed(() => {
  const value = dossier.value ?? {};

  return [
    { label: 'E-mail', value: value.email },
    { label: 'Téléphone', value: value.telephone },
    { label: 'Ville', value: value.ville },
  ].filter((row) => Boolean(row.value));
});

const sections = computed(() =>
  [
    { title: 'Identité', rows: identite.value },
    { title: 'Contact', rows: contact.value },
  ].filter((section) => section.rows.length > 0)
);
</script>

<template>
  <div>
    <EmptyState
      v-if="sections.length === 0"
      title="Aucune information"
      description="Ce dossier ne comporte aucune information renseignée."
    />

    <div v-else class="row g-4">
      <div v-for="section in sections" :key="section.title" class="col-lg-6">
        <div class="card border-0 shadow-sm h-100">
          <div class="card-header bg-white border-bottom py-3">
            <h6 class="mb-0 fw-bold text-primary">{{ section.title }}</h6>
          </div>

          <div class="card-body">
            <dl class="mb-0">
              <template v-for="row in section.rows" :key="row.label">
                <dt class="text-muted small fw-semibold text-uppercase">{{ row.label }}</dt>
                <dd class="fw-medium text-dark mb-3">{{ row.value }}</dd>
              </template>
            </dl>
          </div>
        </div>
      </div>

      <div class="col-12">
        <div class="card border-0 shadow-sm">
          <div class="card-header bg-white border-bottom py-3">
            <h6 class="mb-0 fw-bold text-primary">
              Tuteurs
              <span class="badge bg-light text-dark border ms-2">{{ tuteurs.length }}</span>
            </h6>
          </div>

          <div class="card-body">
            <p v-if="tuteurs.length === 0" class="text-muted mb-0">
              Aucun tuteur n'est rattaché à cet étudiant.
            </p>

            <div v-else class="table-responsive">
              <table class="table align-middle mb-0">
                <thead class="table-light">
                  <tr>
                    <th class="ps-3">Nom</th>
                    <th>Lien de parenté</th>
                    <th>Téléphone</th>
                    <th>E-mail</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(tuteur, index) in tuteurs" :key="tuteur.id ?? index">
                    <td class="ps-3 fw-semibold text-dark">
                      {{ tuteur.nom ?? '—' }} {{ tuteur.prenom ?? '' }}
                    </td>
                    <td class="small">{{ tuteur.lien_parente ?? tuteur.lien ?? '—' }}</td>
                    <td class="small">{{ tuteur.telephone ?? '—' }}</td>
                    <td class="small">{{ tuteur.email ?? '—' }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
