<script setup>
import { onMounted } from 'vue';
import Header from '@/components/partials/header.vue';
import Sidebar from '@/components/partials/sidebar.vue';
import Footer from '@/components/partials/footer.vue';
import { useSidebarRepli } from '@/shared/composables/useSidebarRepli';
import { useParametresStore } from '@/modules/parametres/store';

/**
 * La mise en page de l'administration.
 *
 * ## Le repli de la barre latérale suit l'écran
 *
 * Il était commandé par un bouton de la barre du haut, avec un état local que
 * rien ne rétablissait : replié sur un portable puis rouvert sur un grand
 * écran, on gardait une barre en icônes. Il suit maintenant la largeur de la
 * fenêtre — déployée au-delà de 1440 px, en icônes en deçà (voir
 * `useSidebarRepli` pour les seuils et leur justification).
 *
 * ## Ce qui a disparu avec lui
 *
 * L'ouverture « hors-canevas » pour téléphone (`sidebar-open`, `mobile-open`,
 * `.sidebar-offcanvas.active`). Elle n'avait plus de déclencheur une fois le
 * bouton retiré, et cette application n'est pas destinée aux téléphones ni aux
 * tablettes de format courant : la barre latérale reste donc toujours visible,
 * réduite à ses icônes quand la place manque.
 *
 * Sous 1024 px, la page prend une largeur minimale et défile horizontalement
 * plutôt que de se disloquer. C'est une limite assumée, et visible comme telle.
 */
const { repliee, petit } = useSidebarRepli();

/**
 * Les réglages de la plateforme sont chargés **une fois**, ici.
 *
 * C'est le seul point qui enveloppe tous les écrans internes. Le symbole de la
 * devise et l'identité de l'établissement sont lus par des fonctions de
 * `shared/utils/parametres.js` — hors composant, donc sans accès au store —, et
 * ce chargement est ce qui les y dépose.
 *
 * Aucun écran n'attend cet appel : le module part avec les valeurs semées par
 * la migration 019, si bien qu'un montant s'affiche juste dès la première
 * frame, puis se corrige tout seul si l'établissement a changé ses réglages.
 */
onMounted(() => useParametresStore().fetchParametres());
</script>

<template>
  <div class="container-scroller" :class="{ 'sidebar-icon-only': repliee, 'ecran-petit': petit }">
    <Header />

    <div class="container-fluid page-body-wrapper">
      <Sidebar />

      <div class="main-panel">
        <div class="content-wrapper">
          <router-view></router-view>
        </div>

        <Footer />
      </div>
    </div>
  </div>
</template>

<!--
  Ces règles ne peuvent pas être « scopées » : elles corrigent des sélecteurs de
  la feuille du gabarit (`assets/css/style.css`) qui visent `.sidebar` et
  `.navbar`, deux éléments appartenant à d'autres composants. Un style scopé n'y
  ajouterait son attribut qu'au dernier sélecteur — c'est exactement ce qui
  rendait inopérante la règle `.sidebar-icon-only .main-panel` écrite dans
  `sidebar.vue` : la barre se réduisait à 70 px, le panneau restait calculé sur
  257, et 187 px de blanc s'ouvraient entre les deux.
-->
<style>
/* ─── Largeur minimale : au-delà de ce cadre, rien n'est promis ─────────── */

.container-scroller {
  /* La feuille du gabarit pose `overflow: hidden` : sous la largeur minimale,
     le contenu serait coupé sans que rien ne permette d'y accéder. */
  overflow-x: auto;
}

.page-body-wrapper,
.navbar {
  min-width: 1024px;
}

/* ─── Le hors-canevas mobile est neutralisé ────────────────────────────── */

/*
  Sous 992 px, le gabarit sortait la barre de l'écran (`.sidebar-offcanvas`) et
  rendait le panneau pleine largeur. Sans bouton pour la ramener, elle serait
  définitivement perdue : on la laisse en place, à sa largeur normale, et le
  panneau reprend ce qui lui revient.

  Elle reste **déployée** dans cette plage, et non en icônes : le mode icônes du
  gabarit est tout entier sous `@media (min-width: 992px)`, si bien qu'en deçà
  la barre se réduirait à 70 px sans que les libellés disparaissent. Le
  reproduire ici dupliquerait une centaine de lignes de la feuille du gabarit
  pour une plage que cette application ne dessert pas — sous 1024 px, la page
  défile horizontalement, rien de plus n'est promis.
*/
@media (max-width: 991.98px) {
  .sidebar {
    position: relative;
    left: 0;
  }

  .main-panel {
    margin-left: 0;
    width: calc(100% - 257px);
  }
}

/* ─── Écrans moyens et petits ──────────────────────────────────────────── */

/* Chaque pixel de marge pris ici est un pixel de moins pour un tableau. Sur un
   portable, les 2,1 rem verticales du gabarit coûtent une ligne de tableau. */
.ecran-petit .content-wrapper {
  padding: 1.25rem 0.75rem;
}
</style>
