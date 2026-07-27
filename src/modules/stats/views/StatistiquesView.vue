<template>
  <div>
    <StatsHeader
      :filtres="filtres"
      :peut-generer="peutGenerer"
      :generation="generation"
      @generer="store.genererBulletins()"
      @changer-contexte="store.appliquerFiltres($event)"
    />

    <div class="row">
      <div class="col-md-12 grid-margin stretch-card">
        <div class="card">
          <div class="card-body dashboard-tabs p-0">
            <StatsTabs />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { storeToRefs } from 'pinia';
import StatsHeader from '../components/StatsHeader.vue';
import StatsTabs from '../components/StatsTabs.vue';
import { useStatsStore } from '../store';

/**
 * Statistiques de résultats.
 *
 * L'écran d'origine (`views/stats/`, 8 fichiers) n'émettait **aucune requête** :
 * sa vue racine servait deux formateurs codés en dur — « John Doe », « Anna
 * Smith » — après un `setTimeout(3000)`, exactement le même copier-coller que
 * `RapportExamens` (§1.9) et `RapportConcours` (§1.10), dans un écran de
 * statistiques. Ses cinq composants d'onglet étaient byte-identiques et aucun ne
 * recevait sa prop `rows` : les onglets affichaient une table vide, en-têtes
 * seuls.
 *
 * Le domaine `/statistiques` sur lequel il aurait dû s'appuyer **n'existe pas** :
 * routes et service supprimés du backend, et 9 de leurs 11 requêtes échouaient
 * contre le schéma actuel. Cet écran repose donc sur `/evaluations/resultats`,
 * dont la partie manquante — la génération des bulletins — a été ajoutée par la
 * migration backend `010`.
 */
const store = useStatsStore();
const { filtres, peutGenerer, generation } = storeToRefs(store);

// Sans filtre, la synthèse porte sur l'ensemble des bulletins : l'écran dit
// quelque chose dès l'ouverture, sans exiger de sélection préalable.
onMounted(() => store.fetchStatistiques());
</script>

<style scoped>
.dashboard-tabs {
  min-height: 420px;
}
</style>
