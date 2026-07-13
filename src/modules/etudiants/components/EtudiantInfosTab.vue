<script setup>
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import EmptyState from '@/shared/components/EmptyState.vue';
import { useEtudiantStore } from '../store';
import { sexeLabel } from '../constants';
import { formatDate } from '@/shared/utils/date';

/**
 * Fiche d'identité d'un étudiant.
 *
 * L'ancienne version rendait chaque champ dans un `<input readonly v-model>` —
 * un champ de saisie lié en deux sens, mais qu'on ne peut pas saisir. Elle
 * conditionnait surtout l'affichage aux **mauvais champs** : le lieu de
 * naissance n'apparaissait que si `etudiant.lieunaissance` était renseigné (un
 * champ qui n'existe pas), le sexe que si `etudiant.genre` l'était, et l'adresse
 * que si le *téléphone* l'était. Ces trois informations étaient donc, en
 * pratique, toujours ou jamais masquées pour de mauvaises raisons.
 *
 * Ici, une ligne s'affiche si et seulement si sa propre valeur est renseignée.
 */

const etudiantStore = useEtudiantStore();
const { item: etudiant } = storeToRefs(etudiantStore);

const identite = computed(() => {
  const value = etudiant.value ?? {};

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
  const value = etudiant.value ?? {};

  return [
    { label: 'E-mail', value: value.email },
    { label: 'Téléphone', value: value.telephone },
    { label: 'Adresse', value: value.adresse },
  ].filter((row) => Boolean(row.value));
});

const scolarite = computed(() => {
  const value = etudiant.value ?? {};

  return [
    { label: 'Filière', value: value.filiere },
    { label: 'Classe', value: value.classe },
    { label: 'Année académique', value: value.annee_academique },
  ].filter((row) => Boolean(row.value));
});

const sections = computed(() =>
  [
    { title: 'Identité', rows: identite.value },
    { title: 'Contact', rows: contact.value },
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

  <div v-else class="row g-4">
    <div v-for="section in sections" :key="section.title" class="col-lg-4">
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
</template>
