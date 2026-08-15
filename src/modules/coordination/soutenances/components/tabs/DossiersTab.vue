<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import EmptyState from '@/shared/components/EmptyState.vue';
import LoadingSpinner from '@/shared/components/LoadingSpinner.vue';
import ExportMenu from '@/shared/components/ExportMenu.vue';
import Pagination from '@/components/shared/Pagination.vue';
import { useTableExport } from '@/shared/composables/useTableExport';
import { usePagination } from '@/shared/composables/usePagination';
import { formatDate } from '@/shared/utils/date';
import { useSoutenanceStore } from '../../store';
import {
  decisionPvInfo,
  mentionPvLabel,
  roleJuryLabel,
  statutPvInfo,
  statutSoutenanceInfo,
} from '../../../constants';

/**
 * Archives : les dossiers de soutenance déjà actés.
 *
 * La liste ne montre que les soutenances **dont le procès-verbal est validé ou
 * publié** : un dossier ouvert n'est pas une archive, et le mélanger aux
 * dossiers clos ferait passer un brouillon pour un acte.
 *
 * Le détail (jury, observations, recommandations) n'est chargé qu'à la demande :
 * `GET /coordination/soutenances/:id` fait trois requêtes côté serveur, il n'y a
 * pas de raison de les payer pour chaque ligne d'une liste.
 */

const store = useSoutenanceStore();
const { items: soutenances, dossier, loading } = storeToRefs(store);

const recherche = ref('');
const ouvertId = ref('');

onMounted(() => store.fetchAll());

const archives = computed(() => {
  const terme = recherche.value.trim().toLowerCase();

  return store.archives.filter((soutenance) => {
    if (!terme) return true;
    return [soutenance.theme, soutenance.nom, soutenance.prenom, soutenance.pv_numero]
      .filter(Boolean)
      .some((champ) => String(champ).toLowerCase().includes(terme));
  });
});

/**
 * 208 dossiers archivés, dépliés dans un accordéon rendu d'un bloc.
 *
 * ⚠️ Le dossier ouvert est mémorisé par son identifiant (`ouvertId`), pas par sa
 * position : changer de page ne rouvre donc pas arbitrairement une autre fiche.
 */
const { page, itemsPerPage, paginated } = usePagination(archives, {
  perPage: 10,
  resetKey: () => recherche.value,
});

watch(ouvertId, (id) => {
  if (id) store.fetchDossier(id);
});

/** @param {string} id */
function basculer(id) {
  ouvertId.value = ouvertId.value === id ? '' : id;
}

const { exportToExcel, exportToPdf } = useTableExport({
  rows: computed(() =>
    archives.value.map((soutenance, index) => ({
      'N°': index + 1,
      PV: soutenance.pv_numero || '—',
      Date: formatDate(soutenance.date_soutenance),
      Étudiant: `${soutenance.nom} ${soutenance.prenom}`,
      Matricule: soutenance.matricule,
      Filière: soutenance.filiere,
      Sujet: soutenance.theme,
      Note: soutenance.note_finale ?? '—',
      Mention: soutenance.mention ? mentionPvLabel(soutenance.mention) : '—',
      Décision: decisionPvInfo(soutenance.decision).label,
    }))
  ),
  title: 'Archives des soutenances',
  fileBaseName: 'archives_soutenances',
});
</script>

<template>
  <div>
    <div class="d-flex justify-content-between align-items-start mb-3 flex-wrap gap-2">
      <div>
        <h4 class="mb-1">Dossiers & archives</h4>
        <p class="mb-0 text-muted small">
          Soutenances dont le procès-verbal est validé : le dossier complet, jury compris.
        </p>
      </div>
      <ExportMenu :disabled="!archives.length" @excel="exportToExcel" @pdf="exportToPdf" />
    </div>

    <div class="mb-3">
      <input
        v-model="recherche"
        type="search"
        class="form-control form-control-sm"
        placeholder="Rechercher par étudiant, sujet ou numéro de PV"
        aria-label="Rechercher un dossier"
      />
    </div>

    <LoadingSpinner v-if="loading && !soutenances.length" />

    <EmptyState
      v-else-if="!store.archives.length"
      title="Aucun dossier clos"
      description="Un dossier rejoint les archives dès que son procès-verbal est validé."
    />

    <EmptyState
      v-else-if="!archives.length"
      title="Aucun dossier ne correspond"
      description="Élargissez la recherche."
      :size="80"
    />

    <div v-else id="accordion-dossiers" class="accordion">
      <div
        v-for="soutenance in paginated"
        :key="soutenance.id"
        class="card border-0 shadow-sm mb-2"
      >
        <button
          class="btn text-start w-100 p-3 d-flex justify-content-between align-items-center gap-2"
          type="button"
          :aria-expanded="ouvertId === soutenance.id"
          @click="basculer(soutenance.id)"
        >
          <span class="flex-grow-1">
            <span class="fw-semibold text-dark d-block">
              {{ soutenance.nom }} {{ soutenance.prenom }}
              <span class="text-muted fw-normal">— {{ soutenance.theme }}</span>
            </span>
            <span class="text-muted small">
              {{ formatDate(soutenance.date_soutenance) }} · {{ soutenance.filiere }}
              <span v-if="soutenance.pv_numero" class="font-monospace ms-1">
                · {{ soutenance.pv_numero }}
              </span>
            </span>
          </span>

          <span class="d-flex align-items-center gap-2 flex-shrink-0">
            <span
              class="badge"
              :class="`bg-${decisionPvInfo(soutenance.decision).variant}-subtle text-${decisionPvInfo(soutenance.decision).variant}`"
            >
              {{ decisionPvInfo(soutenance.decision).label }}
            </span>
            <span
              v-if="soutenance.note_finale !== null"
              class="badge bg-light text-dark border font-monospace"
            >
              {{ soutenance.note_finale }}/20
            </span>
            <i
              class="bi"
              :class="ouvertId === soutenance.id ? 'bi-chevron-up' : 'bi-chevron-down'"
            ></i>
          </span>
        </button>

        <div v-if="ouvertId === soutenance.id" class="border-top p-3">
          <LoadingSpinner v-if="loading && !dossier" size="sm" />

          <div v-else-if="dossier && dossier.id === soutenance.id" class="row g-3">
            <div class="col-md-6">
              <h6 class="text-uppercase text-secondary small fw-bold mb-2">Soutenance</h6>
              <dl class="row small mb-0">
                <dt class="col-5 text-muted fw-normal">Horaire</dt>
                <dd class="col-7 font-monospace">
                  {{ String(dossier.heure_debut).slice(0, 5) }} –
                  {{ String(dossier.heure_fin).slice(0, 5) }}
                </dd>

                <dt class="col-5 text-muted fw-normal">Salle</dt>
                <dd class="col-7">
                  {{ dossier.code_salle || 'Non renseignée' }}
                  <span v-if="dossier.batiment" class="text-muted">({{ dossier.batiment }})</span>
                </dd>

                <dt class="col-5 text-muted fw-normal">Statut</dt>
                <dd class="col-7">
                  <span
                    class="badge"
                    :class="`bg-${statutSoutenanceInfo(dossier.statut).variant}-subtle text-${statutSoutenanceInfo(dossier.statut).variant}`"
                  >
                    {{ statutSoutenanceInfo(dossier.statut).label }}
                  </span>
                </dd>

                <dt class="col-5 text-muted fw-normal">Directeur</dt>
                <dd class="col-7">
                  <span v-if="dossier.directeur_nom">
                    {{ dossier.directeur_nom }} {{ dossier.directeur_prenom }}
                  </span>
                  <span v-else class="text-muted">Non assigné</span>
                </dd>
              </dl>

              <h6 class="text-uppercase text-secondary small fw-bold mt-3 mb-2">Jury</h6>
              <ul v-if="dossier.jurys?.length" class="list-unstyled small mb-0">
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
              <p v-else class="text-muted small mb-0">Aucun membre enregistré.</p>
            </div>

            <div class="col-md-6">
              <h6 class="text-uppercase text-secondary small fw-bold mb-2">
                Procès-verbal
                <span
                  v-if="dossier.proces_verbal"
                  class="badge ms-1"
                  :class="`bg-${statutPvInfo(dossier.proces_verbal.statut).variant}-subtle text-${statutPvInfo(dossier.proces_verbal.statut).variant}`"
                >
                  {{ statutPvInfo(dossier.proces_verbal.statut).label }}
                </span>
              </h6>

              <template v-if="dossier.proces_verbal">
                <dl class="row small">
                  <dt class="col-5 text-muted fw-normal">Numéro</dt>
                  <dd class="col-7 font-monospace">{{ dossier.proces_verbal.numero }}</dd>

                  <dt class="col-5 text-muted fw-normal">Note finale</dt>
                  <dd class="col-7 fw-semibold">
                    {{ dossier.proces_verbal.note_finale ?? '—' }}/20
                  </dd>

                  <dt class="col-5 text-muted fw-normal">Mention</dt>
                  <dd class="col-7">{{ mentionPvLabel(dossier.proces_verbal.mention) }}</dd>

                  <dt class="col-5 text-muted fw-normal">Validé le</dt>
                  <dd class="col-7">
                    {{
                      dossier.proces_verbal.date_validation
                        ? formatDate(dossier.proces_verbal.date_validation)
                        : '—'
                    }}
                  </dd>
                </dl>

                <div v-if="dossier.proces_verbal.observations" class="mb-2">
                  <span class="text-muted small d-block">Observations</span>
                  <p class="small mb-0">{{ dossier.proces_verbal.observations }}</p>
                </div>

                <div v-if="dossier.proces_verbal.recommandations">
                  <span class="text-muted small d-block">Recommandations</span>
                  <p class="small mb-0">{{ dossier.proces_verbal.recommandations }}</p>
                </div>
              </template>

              <p v-else class="text-muted small mb-0">Aucun procès-verbal.</p>
            </div>
          </div>
        </div>
      </div>

      <Pagination
        v-model="page"
        v-model:items-per-page="itemsPerPage"
        :total-items="archives.length"
      />
    </div>
  </div>
</template>
