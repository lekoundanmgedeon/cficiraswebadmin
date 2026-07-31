<script setup>
import { computed, onMounted, ref } from 'vue';
import { storeToRefs } from 'pinia';
import ExportMenu from '@/shared/components/ExportMenu.vue';
import EmptyState from '@/shared/components/EmptyState.vue';
import LoadingSpinner from '@/shared/components/LoadingSpinner.vue';
import { useTableExport } from '@/shared/composables/useTableExport';
import { formatDate } from '@/shared/utils/date';
import { mentionLabel } from '@/modules/examens/bulletin/constants';
import { useBibliothequeStore } from '../../store';
import { TYPES_TRAVAIL, typeTravailLabel } from '../../constants';

/**
 * Mémoires et thèses soutenus, archivés en bibliothèque.
 *
 * ⚠️ **Ce ne sont pas des ouvrages du catalogue.** Un mémoire n'est pas acquis,
 * il est produit : il vit dans `travaux_recherche`, avec son étudiant, son
 * directeur et sa soutenance, et n'entre en bibliothèque que par une cote et
 * une date de publication. L'écran lit donc `GET /bibliotheque/memoires`
 * (vue `v_memoires_archives`), et non le catalogue.
 *
 * Le dépôt lui-même — cote, fichier, publication — s'administre depuis
 * « Coordination académique › Thèmes & mémoires » : c'est là que vit le travail.
 */

const store = useBibliothequeStore();
const { memoires, loading } = storeToRefs(store);

const recherche = ref('');
const type = ref('');
const publiesSeulement = ref(false);

onMounted(() => store.fetchMemoires());

const filtres = computed(() => {
  const terme = recherche.value.trim().toLowerCase();

  return memoires.value.filter((memoire) => {
    if (type.value && memoire.type_travail !== type.value) return false;
    if (publiesSeulement.value && !memoire.est_publie) return false;
    if (!terme) return true;

    return [
      memoire.theme,
      memoire.etudiant_nom,
      memoire.etudiant_prenom,
      memoire.cote_bibliotheque,
      memoire.directeur_nom,
    ]
      .filter(Boolean)
      .some((champ) => String(champ).toLowerCase().includes(terme));
  });
});

const { exportToExcel, exportToPdf } = useTableExport({
  rows: computed(() =>
    filtres.value.map((memoire, index) => ({
      'N°': index + 1,
      Cote: memoire.cote_bibliotheque || '—',
      Thème: memoire.theme,
      Type: typeTravailLabel(memoire.type_travail),
      Auteur: `${memoire.etudiant_nom} ${memoire.etudiant_prenom}`,
      Filière: memoire.filiere || '—',
      Directeur: memoire.directeur_nom
        ? `${memoire.directeur_nom} ${memoire.directeur_prenom ?? ''}`.trim()
        : '—',
      Soutenance: memoire.date_soutenance ? formatDate(memoire.date_soutenance) : '—',
      Mention: memoire.mention ? mentionLabel(memoire.mention) : '—',
      Publication: memoire.est_publie ? formatDate(memoire.date_publication) : 'Non publié',
    }))
  ),
  title: 'Mémoires et thèses archivés',
  fileBaseName: 'memoires_theses',
});
</script>

<template>
  <div>
    <div class="d-flex justify-content-between align-items-start mb-3 flex-wrap gap-2">
      <div>
        <h4 class="mb-1">Mémoires & thèses</h4>
        <p class="mb-0 text-muted small">
          Travaux soutenus et déposés. Le dépôt s'administre depuis « Coordination académique ›
          Thèmes & mémoires ».
        </p>
      </div>
      <ExportMenu :disabled="!filtres.length" @excel="exportToExcel" @pdf="exportToPdf" />
    </div>

    <div class="row g-2 align-items-end mb-3">
      <div class="col-md-5">
        <label for="memoire-recherche" class="form-label small fw-semibold text-secondary">
          Rechercher
        </label>
        <input
          id="memoire-recherche"
          v-model="recherche"
          type="search"
          class="form-control form-control-sm"
          placeholder="Thème, auteur, directeur ou cote"
        />
      </div>
      <div class="col-md-4">
        <label for="memoire-type" class="form-label small fw-semibold text-secondary">Type</label>
        <select id="memoire-type" v-model="type" class="form-select form-select-sm">
          <option value="">Tous</option>
          <option v-for="item in TYPES_TRAVAIL" :key="item.code" :value="item.code">
            {{ item.label }}
          </option>
        </select>
      </div>
      <div class="col-md-3">
        <div class="form-check">
          <input
            id="memoire-publies"
            v-model="publiesSeulement"
            class="form-check-input"
            type="checkbox"
          />
          <label class="form-check-label small" for="memoire-publies">Publiés seulement</label>
        </div>
      </div>
    </div>

    <LoadingSpinner v-if="loading && !memoires.length" />

    <EmptyState
      v-else-if="!memoires.length"
      title="Aucun mémoire archivé"
      description="Les mémoires apparaissent ici une fois la soutenance tenue et le travail marqué « soutenu »."
    />

    <EmptyState
      v-else-if="!filtres.length"
      title="Aucun mémoire ne correspond"
      description="Élargissez la recherche ou retirez un filtre."
      :size="80"
    />

    <div v-else class="row g-3">
      <div v-for="memoire in filtres" :key="memoire.id" class="col-lg-6">
        <div class="card border-0 shadow-sm h-100">
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-start gap-2 mb-2">
              <span class="badge bg-primary-subtle text-primary">
                {{ typeTravailLabel(memoire.type_travail) }}
              </span>
              <span
                class="badge"
                :class="
                  memoire.est_publie
                    ? 'bg-success-subtle text-success'
                    : 'bg-secondary-subtle text-secondary'
                "
              >
                {{ memoire.est_publie ? 'Publié' : 'Non publié' }}
              </span>
            </div>

            <h6 class="fw-bold text-dark mb-1">{{ memoire.theme }}</h6>
            <p class="text-muted small mb-2">
              {{ memoire.etudiant_nom }} {{ memoire.etudiant_prenom }} · {{ memoire.filiere }}
              <span v-if="memoire.annee_academique"> · {{ memoire.annee_academique }}</span>
            </p>

            <p v-if="memoire.resume" class="small text-secondary mb-2 resume">
              {{ memoire.resume }}
            </p>

            <ul class="list-unstyled small text-muted mb-0">
              <li v-if="memoire.directeur_nom">
                <i class="bi bi-person-badge me-1"></i>
                Dirigé par {{ memoire.directeur_nom }} {{ memoire.directeur_prenom }}
              </li>
              <li v-if="memoire.date_soutenance">
                <i class="bi bi-calendar-check me-1"></i>
                Soutenu le {{ formatDate(memoire.date_soutenance) }}
                <span v-if="memoire.mention"> — mention {{ mentionLabel(memoire.mention) }}</span>
              </li>
              <li v-if="memoire.cote_bibliotheque">
                <i class="bi bi-bookmark me-1"></i>
                Cote {{ memoire.cote_bibliotheque }}
              </li>
              <li v-if="memoire.est_publie && memoire.date_publication">
                <i class="bi bi-upload me-1"></i>
                Déposé le {{ formatDate(memoire.date_publication) }}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.resume {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
