<script setup>
import { ref, computed } from 'vue';
import dayjs from 'dayjs';

import ItemActions from '../details/ItemActions.vue';
import Pagination from '@/components/shared/Pagination.vue';

// =========================
// MOCK DATA
// =========================
const concours = ref([
  {
    id: 1,
    designation: 'Concours Informatique 2026',
    type_code: 'Entrée',
    date_debut: '2026-06-01',
    date_fin: '2026-06-10',
    statut: 'ouvert',
  },
  {
    id: 2,
    designation: 'Concours Réseaux',
    type_code: 'Interne',
    date_debut: '2026-07-05',
    date_fin: '2026-07-15',
    statut: 'planifié',
  },
  {
    id: 3,
    designation: 'Concours Télécom',
    type_code: 'Externe',
    date_debut: '2026-08-01',
    date_fin: '2026-08-05',
    statut: 'fermé',
  },
  {
    id: 4,
    designation: 'Concours Génie Logiciel',
    type_code: 'Entrée',
    date_debut: '2026-09-01',
    date_fin: '2026-09-12',
    statut: 'ouvert',
  },
]);

// =========================
// PAGINATION
// =========================
const currentPage = ref(1);
const itemsPerPage = ref(10);

const paginatedConcours = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value;
  const end = start + itemsPerPage.value;

  return concours.value.slice(start, end);
});

// =========================
// FORMAT DATE
// =========================
const formatDate = (date) => {
  return dayjs(date).format('DD-MM-YYYY');
};

// =========================
// ACTIONS
// =========================
const editModule = (concour) => {
  console.log('Edit :', concour);
};

const confirmDelete = (concour) => {
  const confirmAction = confirm(`Voulez-vous supprimer ${concour.designation} ?`);

  if (confirmAction) {
    concours.value = concours.value.filter((item) => item.id !== concour.id);
  }
};
</script>
