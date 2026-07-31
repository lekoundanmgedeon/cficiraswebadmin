<script setup>
import { computed, onMounted } from 'vue';
import { storeToRefs } from 'pinia';
import EmptyState from '@/shared/components/EmptyState.vue';
import LoadingSpinner from '@/shared/components/LoadingSpinner.vue';
import { formatDate } from '@/shared/utils/date';
import { useTravailStore } from '../../../travaux/store';
import { STATUT_TRAVAIL_LIST } from '../../../constants';

/**
 * Où en sont les travaux de recherche des finalistes.
 *
 * Tout ce qui est affiché ici est **dérivé** des mêmes données que l'onglet
 * précédent : aucune lecture supplémentaire, aucun compteur stocké. Les
 * constats disparaissent avec la situation qu'ils décrivent — un écran qui
 * annonce « 4 étudiants sans directeur » quand il n'y en a plus aucun ne vaut
 * rien.
 */

const store = useTravailStore();
const { finalistes, loading } = storeToRefs(store);

onMounted(() => store.fetchFinalistes());

const avecTravail = computed(() => finalistes.value.filter((etudiant) => etudiant.travail_id));

/** Répartition par tranche d'avancement — les bornes disent l'état réel. */
const tranches = computed(() => {
  const paliers = [
    { id: 'demarrage', label: 'Non démarré (0 %)', test: (p) => p === 0, variant: 'secondary' },
    { id: 'debut', label: 'Démarré (1 – 29 %)', test: (p) => p >= 1 && p < 30, variant: 'warning' },
    {
      id: 'milieu',
      label: 'À mi-parcours (30 – 69 %)',
      test: (p) => p >= 30 && p < 70,
      variant: 'info',
    },
    {
      id: 'avance',
      label: 'Avancé (70 – 99 %)',
      test: (p) => p >= 70 && p < 100,
      variant: 'primary',
    },
    { id: 'termine', label: 'Achevé (100 %)', test: (p) => p >= 100, variant: 'success' },
  ];

  return paliers.map((palier) => ({
    ...palier,
    effectif: avecTravail.value.filter((etudiant) => palier.test(Number(etudiant.progression ?? 0)))
      .length,
  }));
});

/** Répartition par statut de travail, sur les seuls statuts rencontrés. */
const parStatut = computed(() =>
  STATUT_TRAVAIL_LIST.map((statut) => ({
    ...statut,
    effectif: avecTravail.value.filter((etudiant) => etudiant.statut_travail === statut.code)
      .length,
  })).filter((ligne) => ligne.effectif > 0)
);

/** Ce qui mérite une décision, dérivé et non écrit d'avance. */
const alertes = computed(() => {
  const lignes = [];
  const sansSujet = finalistes.value.filter((etudiant) => !etudiant.travail_id);
  const sansDirecteur = avecTravail.value.filter((etudiant) => !etudiant.directeur_nom);
  const sansSituation = avecTravail.value.filter(
    (etudiant) => !etudiant.situation || etudiant.situation === 'AUCUNE'
  );
  const enRetard = avecTravail.value.filter(
    (etudiant) =>
      etudiant.date_soumission_prevue &&
      !etudiant.date_soumission_effective &&
      new Date(etudiant.date_soumission_prevue) < new Date() &&
      ['ATTRIBUE', 'EN_COURS'].includes(etudiant.statut_travail)
  );

  if (sansSujet.length) {
    lignes.push({
      ton: 'danger',
      titre: `${sansSujet.length} finaliste(s) sans sujet`,
      message: `${sansSujet
        .slice(0, 6)
        .map((etudiant) => `${etudiant.nom} ${etudiant.prenom}`)
        .join(', ')}${sansSujet.length > 6 ? '…' : ''} — aucun thème ne leur est attribué.`,
    });
  }

  if (enRetard.length) {
    lignes.push({
      ton: 'warning',
      titre: `${enRetard.length} travail(aux) en retard de soumission`,
      message: enRetard
        .slice(0, 6)
        .map(
          (etudiant) => `${etudiant.nom} (échéance ${formatDate(etudiant.date_soumission_prevue)})`
        )
        .join(', '),
    });
  }

  if (sansDirecteur.length) {
    lignes.push({
      ton: 'warning',
      titre: `${sansDirecteur.length} travail(aux) sans directeur`,
      message: 'Personne ne les encadre : désignez un directeur depuis « Thèmes & mémoires ».',
    });
  }

  if (sansSituation.length) {
    lignes.push({
      ton: 'info',
      titre: `${sansSituation.length} étudiant(s) ni en stage ni en recherche`,
      message:
        'Leur situation n’est pas renseignée : elle se met à jour depuis l’onglet « Suivi & échéances ».',
    });
  }

  if (!lignes.length && avecTravail.value.length) {
    lignes.push({
      ton: 'success',
      titre: 'Aucun point de blocage',
      message:
        'Tous les finalistes ont un sujet, un encadrant, une situation renseignée et des échéances tenues.',
    });
  }

  return lignes;
});

const tonClasse = (ton) =>
  ({
    danger: 'border-danger text-danger',
    warning: 'border-warning text-warning',
    info: 'border-info text-info',
    success: 'border-success text-success',
  })[ton] || 'border-secondary text-secondary';
</script>

<template>
  <div>
    <div class="mb-3">
      <h4 class="mb-1">Progression des travaux</h4>
      <p class="mb-0 text-muted small">
        Avancement, situation et points de blocage des finalistes de l'année active.
      </p>
    </div>

    <LoadingSpinner v-if="loading && !finalistes.length" />

    <EmptyState
      v-else-if="!finalistes.length"
      title="Aucun finaliste"
      description="Aucune classe de dernière année ne compte d'inscrit sur l'année académique active."
    />

    <template v-else>
      <div class="row g-3 mb-3">
        <div class="col-6 col-lg-3">
          <div class="card border-0 shadow-sm p-3 border-start border-primary border-3">
            <span class="text-muted small text-uppercase d-block mb-1">Travaux engagés</span>
            <span class="fw-bold font-monospace fs-5">
              {{ avecTravail.length }} / {{ finalistes.length }}
            </span>
          </div>
        </div>
        <div class="col-6 col-lg-3">
          <div class="card border-0 shadow-sm p-3 border-start border-info border-3">
            <span class="text-muted small text-uppercase d-block mb-1">Avancement moyen</span>
            <span class="fw-bold font-monospace fs-5">
              {{ store.progressionMoyenne.toFixed(1) }} %
            </span>
          </div>
        </div>
        <div class="col-6 col-lg-3">
          <div class="card border-0 shadow-sm p-3 border-start border-success border-3">
            <span class="text-muted small text-uppercase d-block mb-1">En stage</span>
            <span class="fw-bold font-monospace fs-5">{{ store.parSituation.STAGE }}</span>
          </div>
        </div>
        <div class="col-6 col-lg-3">
          <div class="card border-0 shadow-sm p-3 border-start border-warning border-3">
            <span class="text-muted small text-uppercase d-block mb-1">En recherche</span>
            <span class="fw-bold font-monospace fs-5">{{ store.parSituation.RECHERCHE }}</span>
          </div>
        </div>
      </div>

      <div class="row g-3">
        <div class="col-lg-7">
          <div class="card border-0 shadow-sm h-100">
            <div class="card-body">
              <h6 class="text-uppercase text-secondary small fw-bold mb-3">
                Répartition par avancement
              </h6>

              <div v-for="tranche in tranches" :key="tranche.id" class="mb-3">
                <div class="d-flex justify-content-between small mb-1">
                  <span>{{ tranche.label }}</span>
                  <span class="font-monospace fw-semibold">{{ tranche.effectif }}</span>
                </div>
                <div class="progress rounded-pill" style="height: 6px">
                  <div
                    class="progress-bar"
                    :class="`bg-${tranche.variant}`"
                    :style="{
                      width: avecTravail.length
                        ? `${(tranche.effectif / avecTravail.length) * 100}%`
                        : '0%',
                    }"
                  ></div>
                </div>
              </div>

              <h6 class="text-uppercase text-secondary small fw-bold mb-2 mt-4">
                Répartition par statut
              </h6>
              <p v-if="!parStatut.length" class="text-muted small mb-0">
                Aucun travail engagé pour l'instant.
              </p>
              <div v-else class="d-flex flex-wrap gap-2">
                <span
                  v-for="ligne in parStatut"
                  :key="ligne.code"
                  class="badge"
                  :class="`bg-${ligne.variant}-subtle text-${ligne.variant}`"
                >
                  {{ ligne.label }} : {{ ligne.effectif }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div class="col-lg-5">
          <div class="card border-0 shadow-sm h-100">
            <div class="card-body">
              <h6 class="text-uppercase text-secondary small fw-bold mb-3">
                <i class="bi bi-lightbulb text-warning me-1"></i> Ce qui demande une décision
              </h6>

              <div
                v-for="alerte in alertes"
                :key="alerte.titre"
                class="border-start border-3 ps-3 py-1 mb-3"
                :class="tonClasse(alerte.ton)"
              >
                <span class="d-block fw-semibold small">{{ alerte.titre }}</span>
                <span class="text-muted" style="font-size: 12px">{{ alerte.message }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
