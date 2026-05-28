<template>
  <div
    class="container-scroller"
    :class="{
      'sidebar-icon-only': sidebarCollapsed,
      'sidebar-open': mobileSidebarOpen,
    }"
  >
    <Header @toggle-sidebar="toggleSidebar" />

    <div class="container-fluid page-body-wrapper">
      <Sidebar :mobile-open="mobileSidebarOpen" @close-sidebar="mobileSidebarOpen = false" />

      <div class="main-panel">
        <div class="content-wrapper">
          <router-view></router-view>
        </div>

        <Footer />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

import Header from '@/components/partials/header.vue';
import Sidebar from '@/components/partials/sidebar.vue';
import Footer from '@/components/partials/footer.vue';

const sidebarCollapsed = ref(false);
const mobileSidebarOpen = ref(false);

const toggleSidebar = () => {
  if (window.innerWidth < 992) {
    mobileSidebarOpen.value = !mobileSidebarOpen.value;
  } else {
    sidebarCollapsed.value = !sidebarCollapsed.value;
  }
};
</script>
