<template>
  <div>
    <h5 class="mb-3">Calendrier des épreuves - {{ classe.nom }}</h5>

    <div class="table-responsive">
      <table class="table table-bordered">
        <thead class="table-light">
          <tr>
            <th>Module</th>
            <th>Enseignant</th>
            <th>Date</th>
            <th>Heure début</th>
            <th>Heure fin</th>
            <th>Salle</th>
            <th>Type</th>
            <th>Statut</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(epreuve, index) in epreuves" :key="epreuve.id || index">
            <td><input v-model="epreuve.module" class="form-control" /></td>
            <td><input v-model="epreuve.enseignant" class="form-control" /></td>
            <td><input type="date" v-model="epreuve.date_epreuve" class="form-control" /></td>
            <td><input type="time" v-model="epreuve.heure_debut" class="form-control" /></td>
            <td><input type="time" v-model="epreuve.heure_fin" class="form-control" /></td>
            <td><input v-model="epreuve.salle" class="form-control" /></td>
            <td>
              <select v-model="epreuve.type_epreuve" class="form-select">
                <option value="écrit">Écrit</option>
                <option value="oral">Oral</option>
                <option value="pratique">Pratique</option>
              </select>
            </td>
            <td>
              <span class="badge bg-info">{{ epreuve.statut }}</span>
            </td>
            <td>
              <button class="btn btn-success btn-sm" @click="saveEpreuve(epreuve)">
                <i class="mdi mdi-content-save"></i>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <button class="btn btn-outline-primary mt-3" @click="addEpreuve">+ Ajouter une épreuve</button>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const props = defineProps({
  examenId: Number, // id de examens_planifies
  classe: Object, // info sur la classe (optionnel)
});

const epreuves = ref([
  // à remplacer par un fetch si besoin
  // Exemple vide initial
]);

// Simule un ajout d’épreuve
const addEpreuve = () => {
  epreuves.value.push({
    module: '',
    enseignant: '',
    date_epreuve: '',
    heure_debut: '',
    heure_fin: '',
    salle: '',
    type_epreuve: 'écrit',
    statut: 'prévu',
  });
};

// Simule une sauvegarde (à remplacer par un appel API)
const saveEpreuve = async (epreuve) => {
  try {
    if (epreuve.id) {
      // Mettre à jour
      console.log('Update epreuve :', epreuve);
    } else {
      // Créer
      console.log('Create epreuve :', epreuve);
    }
    alert('Epreuve sauvegardée avec succès');
  } catch (err) {
    console.error(err);
    alert('Erreur lors de la sauvegarde');
  }
};
</script>

<style scoped>
.badge {
  font-size: 0.8rem;
}
</style>
