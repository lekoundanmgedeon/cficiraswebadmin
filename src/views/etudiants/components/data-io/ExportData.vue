<template>
  <h5 class="card-title">EXPORT</h5>
  <hr />
  <div class="d-flex align-items-end flex-wrap">
    <div class="me-md-4 me-xl-5">
      <div class="filters d-flex gap-2 mb-2">
        <!-- Filtre par filière -->
        <div class="col-md-6">
          <label class="form-label">Filière</label>
          <select class="form-select" v-model="selectedFiliere">
            <option value="" disabled>Choisir une filière</option>
            <option v-for="filiere in filieres" :key="filiere.id" :value="filiere.id">
              {{ filiere.code }}
            </option>
          </select>
        </div>

        <!-- Filtre par classe -->
        <div class="col-md-6">
          <label class="form-label">Classe</label>
          <select class="form-select" v-model="selectedClasse">
            <option value="" disabled>Choisir une classe</option>
            <option v-for="classe in classes" :key="classe.id" :value="classe.id">
              {{ classe.code }}
            </option>
          </select>
        </div>
        <!-- Filtre par année académique -->
        <div class="col-md-6">
          <label class="form-label">Année académique</label>
          <select class="form-select" v-model="selectedAnnee">
            <option value="" disabled>Choisir une année</option>
            <option v-for="annee in anneesAcademiques" :key="annee.id" :value="annee.id">
              {{ annee.code }}
            </option>
          </select>
        </div>
      </div>
      <label for="exportType" class="form-label">Export type</label>
      <div class="col-md-6 grid-margin stretch-card">
        <select v-model="selectedFormat" class="form-select" id="exportType">
          <option value="excel">EXCEL</option>
          <option value="csv">CSV</option>
          <option value="pdf">PDF</option>
        </select>
      </div>
    </div>
  </div>
  <div class="mb-3">
    <div class="col-md-6 grid-margin stretch-card">
      <button @click="exportToExcel" class="btn btn-primary">Export</button>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref, watch, computed } from 'vue';
import { useAnneeStore } from '@/modules/annee-academique/store/anneeStore';
import { useFiliereStore } from '@/stores/academiqueStore/filiereStore';
import { useClasseStore } from '@/stores/academiqueStore/classeStore';
import { getEtudiantsByClasseFiliereAnnee } from '@/api/academique/etudiantApi';
import { storeToRefs } from 'pinia';
// Stores
const anneeStore = useAnneeStore();
const filiereStore = useFiliereStore();
const classeStore = useClasseStore();

// Références depuis les stores
const { anneesAcademiques, loading: loadingAnnees } = storeToRefs(anneeStore);
const { filieres, loading: loadingFilieres } = storeToRefs(filiereStore);
const { classes, loading: loadingClasses } = storeToRefs(classeStore);

// Filtres
const selectedAnnee = ref('');
const selectedFiliere = ref('');
const selectedClasse = ref('');
const selectedFormat = ref('excel', 'CSV');

const etudiants = ref([]);

// Initialiser les données
onMounted(async () => {
  await Promise.all([
    anneeStore.fetchAnneesAcademiques(),
    filiereStore.fetchFilieres(),
    classeStore.fetchClasses(),
  ]);
});

// Mettre à jour les classes selon la filière sélectionnée
watch(selectedFiliere, async (newFiliere) => {
  if (newFiliere) {
    await classeStore.fetchClassesByFiliere(newFiliere);
    selectedClasse.value = '';
  } else {
    classeStore.classes = [];
  }
});
const fetchFilteredEtudiants = async () => {
  if (selectedAnnee.value && selectedFiliere.value && selectedClasse.value) {
    try {
      const response = await getEtudiantsByClasseFiliereAnnee(
        selectedClasse.value,
        selectedFiliere.value,
        selectedAnnee.value
      );
      etudiants.value = response.data;
    } catch (error) {
      console.error('Erreur lors du chargement des étudiants:', error);
      etudiants.value = [];
    }
  }
};

// Observer les changements de filtres
watch([selectedAnnee, selectedFiliere, selectedClasse], fetchFilteredEtudiants);
// Observer les changements de filtres

const exportData = () => {
  alert(`Exporting data as: ${selectedFormat.value.toUpperCase()}`);
};

const exportToExcel = async () => {
  try {
    // Récupère les données des étudiants depuis le composant TableData

    if (!etudiants || !etudiants.length) {
      return alert('Aucune donnée à exporter.');
    }
    // Transforme les données en format JSON plat
    const data = etudiants.map((etudiant) => ({
      ID: etudiant.id,
      Matricule: etudiant.matricule,
      Nom: etudiant.nom,
      Prénom: etudiant.prenom,
      Sexe: etudiant.sexe,
      Classe: etudiant.classe,
      Filière: etudiant.filiere,
    }));
    // Crée le nom de fichier basé sur les filtres sélectionnés
    const anneeLabel = selectedAnnee.value || 'annee';
    const filiereLabel = selectedFiliere.value || 'filiere';
    const classeLabel = selectedClasse.value || 'classe';
    const fileName = `etudiants_${anneeLabel}_${filiereLabel}_${classeLabel}.xlsx`;
    // Crée le fichier Excel
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Étudiants');
    // Enregistre le fichier
    XLSX.writeFile(workbook, fileName);
  } catch (error) {
    console.error("Erreur lors de l'export:", error);
    alert("Une erreur est survenue lors de l'export");
  }
};
</script>
