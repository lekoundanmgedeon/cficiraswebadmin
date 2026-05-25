<template>
  <div>
    <div class="row">
      <h4>Resultats concours</h4>
      <p>
        Vous pouvez consulter les détails de chaque examen en cliquant sur le lien correspondant.
      </p>

      <div class="col-md-12 grid margin stretch-card">
        <SkeletonLoader v-if="concourStore.loading" type="table" :rows="3" :columns="1" />
        <table v-else class="table table-striped">
          <thead>
            <tr>
              <th>#</th>
              <th>Désignation</th>
              <th>Date publication</th>
              <th>Statut</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(resultat, index) in concourStore.publication" :key="resultat.id">
              <td>{{ index + 1 }}</td>
              <td>{{ resultat.designation }}</td>
              <td>{{ formatDate(resultat.date_publication) ?? 'Non publié' }}</td>
              <td>
                <span
                  :class="[
                    'badge',
                    {
                      'bg-success': resultat.statut === 'validé',
                      'bg-warning': resultat.statut === 'en attente',
                      'bg-danger': resultat.statut === 'rejeté',
                    },
                  ]"
                >
                  {{ resultat.statut }}
                </span>
              </td>
              <td>
                <a :href="`/resultats-concours/${resultat.concours_id}`" rel="noopener noreferrer">
                  <i class="mdi mdi-launch me-2"></i>
                </a>
              </td>
            </tr>
            <tr v-if="concourStore.publication.length === 0">
              <td colspan="5" class="text-center">Aucun résultat publié</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import SkeletonLoader from '@/components/SkeletonLoader.vue';
import dayjs from 'dayjs';

// =========================
// MOCK LOADING
// =========================
const loading = ref(false);

// =========================
// MOCK PUBLICATIONS
// =========================
const publication = ref([
  {
    id: 1,
    designation: 'Concours Informatique 2026',
    date_publication: '2026-05-20',
    statut: 'validé',
    concours_id: 101,
  },
  {
    id: 2,
    designation: 'Concours Réseaux',
    date_publication: '2026-05-18',
    statut: 'en attente',
    concours_id: 102,
  },
  {
    id: 3,
    designation: 'Concours Télécom',
    date_publication: null,
    statut: 'rejeté',
    concours_id: 103,
  },
]);

// =========================
// FORMAT DATE
// =========================
const formatDate = (date) => {
  return date ? dayjs(date).format('DD/MM/YYYY') : 'Non spécifiée';
};
</script>
