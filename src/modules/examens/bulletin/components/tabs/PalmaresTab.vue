<script setup>
import { computed, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import EmptyState from '@/shared/components/EmptyState.vue';
import LoadingSpinner from '@/shared/components/LoadingSpinner.vue';
import ExportMenu from '@/shared/components/ExportMenu.vue';
import Pagination from '@/components/shared/Pagination.vue';
import { useTableExport } from '@/shared/composables/useTableExport';
import { usePagination } from '@/shared/composables/usePagination';
import { useClasseStore } from '@/modules/structure-academique/classe/store';
import { decisionInfo, publicationInfo } from '../../constants';
import BulletinContexte from '../BulletinContexte.vue';
import { useBulletinStore } from '../../store';

/**
 * Le palmarès d'une classe : rangs, moyennes, décisions, publication.
 *
 * `RapportExamens.vue` affichait — dans un « rapport d'examens » — une liste de
 * **formateurs** codés en dur (« John Doe », « Anna Smith »), servie après un
 * `setTimeout(3000)`. Rien à voir avec des résultats d'examen, et aucun appel
 * API.
 *
 * Les bulletins viennent de `GET /resultats/classes/:classeId/bulletins`. Cet
 * endpoint, son store (`resultStore.js`) et les trois autres routes de résultats
 * existaient déjà : **aucune vue ne les appelait**.
 *
 * ⚠️ Un bulletin appartient au triplet **(classe, semestre, année)** : le seul
 * sélecteur de classe que servait cet écran valait un `400` à chaque requête —
 * corrigé ici, avec le reste du module (voir `../../api.js`).
 */

const bulletinStore = useBulletinStore();
const classeStore = useClasseStore();

const { items: bulletins, loading } = storeToRefs(bulletinStore);
const { items: classes } = storeToRefs(classeStore);

const contexte = ref({ anneeId: '', semestreId: '', classeId: '' });

const complet = computed(() =>
  Boolean(contexte.value.anneeId && contexte.value.semestreId && contexte.value.classeId)
);

const charger = () =>
  bulletinStore.fetchByClasse(
    contexte.value.classeId,
    contexte.value.semestreId,
    contexte.value.anneeId
  );

watch(contexte, charger, { deep: true });

const classe = computed(() => classes.value.find((item) => item.id === contexte.value.classeId));

/** Classé par rang, tel que le serveur le calcule : c'est un palmarès. */
const classement = computed(() =>
  [...bulletins.value].sort((a, b) => Number(a.rang_etudiant ?? 0) - Number(b.rang_etudiant ?? 0))
);

/**
 * Le palmarès se lit page par page ; changer de contexte (année, semestre,
 * classe) repart de la première — ce n'est plus la même classe.
 *
 * ⚠️ L'export porte sur **tout** le palmarès, pas sur la page affichée.
 */
const { page, itemsPerPage, startIndex, paginated } = usePagination(classement, {
  perPage: 20,
  resetKey: () => [contexte.value.anneeId, contexte.value.semestreId, contexte.value.classeId],
});

/** @param {any} value */
const moyenne = (value) => {
  const number = Number(value);
  return Number.isNaN(number) ? '—' : number.toFixed(2);
};

const exportRows = computed(() =>
  classement.value.map((bulletin, index) => ({
    Rang: bulletin.rang_etudiant ?? index + 1,
    Matricule: bulletin.matricule ?? '—',
    Nom: bulletin.nom ?? '—',
    Prénom: bulletin.prenom ?? '—',
    Moyenne: moyenne(bulletin.moyenne_generale),
    Décision: decisionInfo(bulletin.decision).label,
    Statut: publicationInfo(bulletin.statut_publication).label,
  }))
);

const { exportToExcel, exportToPdf } = useTableExport({
  rows: exportRows,
  title: 'Palmarès de la classe',
  fileBaseName: 'palmares',
  filters: () => [
    { label: 'Classe', value: classe.value?.code ?? '—' },
    { label: 'Bulletins', value: classement.value.length },
    { label: "Date d'édition", value: new Date().toLocaleDateString('fr-FR') },
  ],
});

const publier = () => bulletinStore.publier();
</script>

<template>
  <div>
    <BulletinContexte v-model="contexte">
      <template #actions>
        <div class="text-md-end">
          <ExportMenu
            :disabled="classement.length === 0"
            @excel="exportToExcel"
            @pdf="exportToPdf"
          />
          <button
            class="btn btn-success btn-sm px-3 ms-2"
            :disabled="classement.length === 0 || loading"
            @click="publier"
          >
            <i class="bi bi-megaphone me-1"></i> Publier
          </button>
        </div>
      </template>
    </BulletinContexte>

    <LoadingSpinner v-if="loading" />

    <EmptyState
      v-else-if="!complet"
      title="Choisissez une classe, un semestre et une année"
      description="Un bulletin appartient au triplet (classe, semestre, année) : le serveur refuse toute requête incomplète."
    />

    <EmptyState
      v-else-if="classement.length === 0"
      title="Aucun bulletin"
      description="Aucun bulletin n'a encore été généré pour cette classe. Les bulletins résultent des notes saisies."
    />

    <div v-else class="table-responsive">
      <table class="table table-hover align-middle mb-0 text-sm">
        <thead class="table-light text-secondary text-uppercase text-xs">
          <tr>
            <th class="ps-4" style="width: 80px">Rang</th>
            <th>Étudiant</th>
            <th class="text-center">Moyenne</th>
            <th class="text-center">Décision</th>
            <th class="text-center pe-4">Publication</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(bulletin, index) in paginated" :key="bulletin.id">
            <!-- Le rang de repli compte sur **toute** la liste : avec
                 l'index de page, il repartirait à 1 à chaque page. -->
            <td class="ps-4 fw-bold text-secondary">
              {{ bulletin.rang_etudiant ?? startIndex + index + 1 }}
            </td>
            <td>
              <div class="fw-bold text-dark">
                {{ bulletin.nom ?? '—' }} {{ bulletin.prenom ?? '' }}
              </div>
              <small class="text-muted font-monospace text-xs">
                {{ bulletin.matricule ?? '' }}
              </small>
            </td>
            <td class="text-center fw-bold">{{ moyenne(bulletin.moyenne_generale) }}</td>
            <td class="text-center">
              <span class="badge bg-light text-dark border">
                {{ decisionInfo(bulletin.decision).label }}
              </span>
            </td>
            <td class="text-center pe-4">
              <span
                class="badge"
                :class="`bg-${publicationInfo(bulletin.statut_publication).variant}-subtle text-${publicationInfo(bulletin.statut_publication).variant}`"
              >
                {{ publicationInfo(bulletin.statut_publication).label }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>

      <Pagination
        v-model="page"
        v-model:items-per-page="itemsPerPage"
        :total-items="classement.length"
      />
    </div>
  </div>
</template>

<style scoped>
.text-xs {
  font-size: 11px;
}
.text-sm {
  font-size: 0.875rem;
}
</style>
