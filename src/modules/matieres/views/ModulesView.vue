<script setup>
import PageHeader from '@/shared/components/PageHeader.vue';
import PageCard from '@/shared/components/PageCard.vue';
import { useModuleForm } from '../composables/useModuleForm';
import ModuleTabs from '../components/ModuleTabs.vue';
import ModuleFormModal from '../components/ModuleFormModal.vue';

/**
 * Écran des modules d'enseignement.
 *
 * L'ancien `views/matieres/Modules.vue` n'était **branché sur aucune route** et
 * n'apparaissait dans aucun menu : l'écran était inaccessible. Il portait un
 * bouton « + Ajouter » ouvrant une modale `#exampleModal` **qui n'existait pas**,
 * un bouton « Exporter » sans `@click`, et un lien « Importer fichier » pointant
 * sur une ancre `#drag-drop-area` absente de la page.
 *
 * Il déclarait par ailleurs **deux blocs `<style scoped>`**, dont l'un
 * redéfinissait `body`, `.card` et `.btn-primary` — des sélecteurs globaux qu'un
 * style *scoped* ne peut pas atteindre.
 *
 * Un `ModuleHeader.vue` recopiait le même en-tête à l'identique, sans être
 * importé nulle part.
 */

const { openCreate } = useModuleForm();

const print = () => window.print();
</script>

<template>
  <div>
    <PageHeader
      title="Gestion des modules"
      subtitle="Unités d'enseignement, matières et cours"
      :breadcrumb="['portail', 'modules']"
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

        <button class="btn btn-primary mt-2 mt-xl-0" @click="openCreate">
          + Ajouter un module
        </button>
      </template>
    </PageHeader>

    <PageCard>
      <ModuleTabs />
    </PageCard>

    <ModuleFormModal />
  </div>
</template>
