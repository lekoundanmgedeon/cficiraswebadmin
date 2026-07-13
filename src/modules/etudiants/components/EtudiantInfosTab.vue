<script setup>
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import EmptyState from '@/shared/components/EmptyState.vue';
import { formatDate } from '@/shared/utils/date';
import { statutInfo } from '@/modules/inscriptions/constants';
import { useEtudiantStore } from '../store';

/**
 * Fiche d'identité d'un étudiant.
 *
 * L'ancienne version rendait chaque champ dans un `<input readonly v-model>` —
 * un champ de saisie lié en deux sens, mais qu'on ne peut pas saisir. Elle
 * conditionnait surtout l'affichage aux **mauvais champs** : le lieu de
 * naissance n'apparaissait que si `etudiant.lieunaissance` était renseigné (un
 * champ qui n'existe pas), le sexe que si `etudiant.genre` l'était, et l'adresse
 * que si le *téléphone* l'était.
 *
 * Les informations affichées sont celles que l'annuaire porte réellement — il
 * est projeté depuis `GET /inscriptions`, faute de `GET /etudiants/:id`. L'état
 * civil détaillé (sexe, date et lieu de naissance, adresse) n'y figure pas :
 * il est saisi à la création mais aucun endpoint ne permet de le relire.
 */

const etudiantStore = useEtudiantStore();
const { item: etudiant } = storeToRefs(etudiantStore);

const statut = computed(() => statutInfo(etudiant.value?.statut));

const identite = computed(() => {
  const value = etudiant.value ?? {};

  return [
    { label: 'Matricule', value: value.matricule },
    { label: 'Nom', value: value.nom },
    { label: 'Prénom', value: value.prenom },
    { label: 'E-mail', value: value.email },
  ].filter((row) => Boolean(row.value));
});

const scolarite = computed(() => {
  const value = etudiant.value ?? {};

  return [
    { label: 'Filière', value: value.filiere },
    { label: 'Classe', value: value.classe },
    { label: 'Année académique', value: value.annee_academique },
    {
      label: 'Inscrit le',
      value: value.date_inscription ? formatDate(value.date_inscription) : null,
    },
  ].filter((row) => Boolean(row.value));
});

const sections = computed(() =>
  [
    { title: 'Identité', rows: identite.value },
    { title: 'Scolarité', rows: scolarite.value },
  ].filter((section) => section.rows.length > 0)
);
</script>

<template>
  <EmptyState
    v-if="sections.length === 0"
    title="Aucune information"
    description="Cette fiche ne comporte aucune information renseignée."
  />

  <div v-else>
    <div class="mb-4">
      <span
        class="badge rounded-pill px-3 py-2"
        :class="`bg-${statut.variant}-subtle text-${statut.variant}`"
      >
        Inscription {{ statut.label.toLowerCase() }}
      </span>
    </div>

    <div class="row g-4">
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
    </div>
  </div>
</template>
