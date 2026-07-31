<script setup>
import AppTabs from '@/shared/components/AppTabs.vue';
import ListeEtudiantsTab from './tabs/ListeEtudiantsTab.vue';
import EtudiantsParClasseTab from './tabs/EtudiantsParClasseTab.vue';
import RepartitionTab from './tabs/RepartitionTab.vue';
import StatistiquesTab from './tabs/StatistiquesTab.vue';
import ImportEtudiantsTab from './tabs/ImportEtudiantsTab.vue';
import ImportTuteursTab from './tabs/ImportTuteursTab.vue';
import ExportEtudiantsTab from './tabs/ExportEtudiantsTab.vue';

/**
 * Le conteneur d'onglets Bootstrap montait les six panneaux d'un coup : chaque
 * onglet exécutait son `onMounted` au chargement de la page, y compris ceux que
 * l'utilisateur n'ouvrait jamais.
 *
 * Il déclarait par ailleurs **six panneaux pour cinq liens** : le panneau
 * « Import » n'avait aucun onglet correspondant. Il était donc monté à chaque
 * affichage de la page, et malgré tout inatteignable. Il retrouve ici sa place.
 */
const tabs = [
  { id: 'liste', label: 'Liste des étudiants', component: ListeEtudiantsTab },
  { id: 'classes', label: 'Par classe', component: EtudiantsParClasseTab },
  { id: 'repartition', label: 'Répartition', component: RepartitionTab },
  { id: 'statistiques', label: 'Statistiques', component: StatistiquesTab },
  { id: 'import', label: 'Import', component: ImportEtudiantsTab },
  // `POST /academique/imports/tuteurs` existait sans qu'aucun écran ne l'appelle.
  { id: 'import-tuteurs', label: 'Import tuteurs', component: ImportTuteursTab },
  { id: 'export', label: 'Exportations', component: ExportEtudiantsTab },
];
</script>

<template>
  <AppTabs :tabs="tabs" />
</template>
