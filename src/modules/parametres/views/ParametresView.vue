<script setup>
import { computed, onMounted } from 'vue';
import PageHeader from '@/shared/components/PageHeader.vue';
import AppTabs from '@/shared/components/AppTabs.vue';
import { useAuthStore } from '@/core/auth/authStore';
import MonCompteTab from '../components/tabs/MonCompteTab.vue';
import ComptesTab from '../components/tabs/ComptesTab.vue';
import ReglagesTab from '../components/tabs/ReglagesTab.vue';
import NotificationsTab from '../components/tabs/NotificationsTab.vue';
import JournauxTab from '../components/tabs/JournauxTab.vue';

/**
 * Paramètres de la plateforme.
 *
 * ## Ce que cet écran remplaçait
 *
 * **La page de paramètres de Kaggle, recopiée** : texte anglais parlant
 * littéralement d'un autre produit (« Verifying your account […] on Kaggle »),
 * adresse électronique codée en dur — celle d'un développeur —, trois boutons
 * sans `@click`, et deux onglets pointant sur des panneaux inexistants. Elle
 * avait été réduite à un état honnête : le profil en lecture seule, et la liste
 * de ce qui manquait.
 *
 * Ce qui manquait existe désormais (migration 019, routes `/parametres` et
 * `/utilisateurs`), d'où cet écran.
 *
 * ## Les onglets suivent le rôle
 *
 * Seul un ADMIN voit Comptes, Réglages et Journaux ; « Mon compte » est visible
 * de tous. ⚠️ **C'est du confort, pas une sécurité** : le serveur refuse ces
 * routes en 403 quel que soit l'écran, et c'est lui qui fait foi. Masquer évite
 * seulement d'offrir des onglets qui s'ouvriraient vides.
 *
 * Le rôle vient du profil en mémoire, qu'un rechargement de page perd : d'où
 * l'appel à `fetchCurrentUser()` au montage. Le défaut, s'il revenait, se ferait
 * dans le sens sûr — on masque, on ne divulgue pas.
 *
 * `AppTabs` ne monte que l'onglet actif : un onglet = une requête, au moment où
 * on l'ouvre. Les 1 778 notifications et les 7 517 lignes d'audit ne sont donc
 * pas chargées par qui vient changer son mot de passe.
 */

const auth = useAuthStore();

onMounted(() => auth.fetchCurrentUser());

const tabs = computed(() => {
  const onglets = [{ id: 'mon-compte', label: 'Mon compte', component: MonCompteTab }];

  if (auth.isAdmin) {
    onglets.push(
      { id: 'comptes', label: 'Comptes', component: ComptesTab },
      { id: 'reglages', label: 'Réglages', component: ReglagesTab },
      { id: 'notifications', label: 'Notifications', component: NotificationsTab },
      { id: 'journaux', label: 'Journaux', component: JournauxTab }
    );
  }

  return onglets;
});
</script>

<template>
  <div>
    <PageHeader
      title="Paramètres"
      subtitle="Votre compte, les réglages de la plateforme et ses journaux"
      :breadcrumb="['Plateforme', 'Paramètres']"
    />

    <div class="row">
      <div class="col-12 grid-margin stretch-card">
        <div class="card border-0 shadow-sm">
          <div class="card-body p-3">
            <AppTabs :tabs="tabs" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
