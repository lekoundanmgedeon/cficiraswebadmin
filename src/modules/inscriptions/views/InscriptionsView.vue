<script setup>
import PageHeader from '@/shared/components/PageHeader.vue';
import PageCard from '@/shared/components/PageCard.vue';
import { openModal } from '@/shared/utils/modal';
import InscriptionTabs from '../components/InscriptionTabs.vue';
import ImportModal from '../components/ImportModal.vue';
import { IMPORT_INSCRIPTIONS_MODAL_ID } from '../constants';

/**
 * L'en-tête portait un menu « ⋮ » dont les deux entrées, « Exporter Excel » et
 * « Imprimer », étaient câblées sur `exportToExcel` et `printTable` — **deux
 * fonctions jamais définies** dans son `<script setup>`. Cliquer dessus levait
 * une erreur. La troisième, « Paramètres », était un `href="#"` sans handler.
 *
 * L'export est désormais offert par chaque onglet, sur ses propres données
 * filtrées, ce qui a davantage de sens qu'un export global indifférencié.
 *
 * (La vue montait par ailleurs un `SkeletonLoader v-if="loading"` alors que
 * `loading` n'était déclaré nulle part : la variable valait `undefined`, donc le
 * squelette ne s'affichait jamais.)
 */

const openImport = () => openModal(IMPORT_INSCRIPTIONS_MODAL_ID);

const print = () => window.print();
</script>

<template>
  <div>
    <PageHeader
      title="Gestion des inscriptions"
      subtitle="Inscriptions, réinscriptions et suivi financier"
      :breadcrumb="['portail', 'inscriptions']"
    >
      <template #actions>
        <button
          type="button"
          class="btn btn-light bg-white btn-icon me-3 mt-2 mt-xl-0"
          title="Imprimer"
          @click="print"
        >
          <i class="mdi mdi-printer text-muted"></i>
        </button>

        <button class="btn btn-primary mt-2 mt-xl-0" @click="openImport">
          + Importer des inscriptions
        </button>
      </template>
    </PageHeader>

    <PageCard>
      <InscriptionTabs />
    </PageCard>

    <ImportModal kind="inscriptions" :modal-id="IMPORT_INSCRIPTIONS_MODAL_ID" />
  </div>
</template>
