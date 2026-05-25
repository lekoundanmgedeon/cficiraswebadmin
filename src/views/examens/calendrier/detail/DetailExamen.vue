<script setup>
import { ref } from 'vue';
import draggable from 'vuedraggable';
import html2pdf from 'html2pdf.js';

// =========================
// MOCK DATA
// =========================
const moduleData = ref([
  {
    id: 1,
    designation: 'Algorithmique',
  },
  {
    id: 2,
    designation: 'Base de données',
  },
  {
    id: 3,
    designation: 'Programmation Web',
  },
]);

// =========================
// MOCK EPREUVES
// =========================
const epreuves = ref(
  moduleData.value.map((mod) => ({
    module: mod.designation,
    module_id: mod.id,
    date_epreuve: '',
    heure_debut: '',
    heure_fin: '',
    type_epreuve: 'écrit',
    statut: 'prévu',
  })),
);

// =========================
// ADD EPREUVE
// =========================
const addEpreuve = () => {
  epreuves.value.push({
    module: '',
    module_id: Date.now(),
    date_epreuve: '',
    heure_debut: '',
    heure_fin: '',
    type_epreuve: 'écrit',
    statut: 'prévu',
  });
};

// =========================
// SAVE
// =========================
const saveEpreuve = async (epreuve) => {
  try {
    console.log('Epreuve sauvegardée :', epreuve);

    alert('Epreuve sauvegardée avec succès');
  } catch (err) {
    console.error(err);

    alert('Erreur lors de la sauvegarde');
  }
};

// =========================
// DRAG ORDER
// =========================
const onOrderChange = () => {
  console.log('Nouvel ordre :', epreuves.value);
};

// =========================
// PDF EXPORT
// =========================
const tableToPrint = ref(null);

const downloadPDF = () => {
  const element = tableToPrint.value;

  const opt = {
    margin: 0.5,
    filename: 'calendrier_examens.pdf',
    image: {
      type: 'jpeg',
      quality: 0.98,
    },
    html2canvas: {
      scale: 2,
    },
    jsPDF: {
      unit: 'in',
      format: 'a3',
      orientation: 'portrait',
    },
  };

  html2pdf().set(opt).from(element).save();
};

// =========================
// FILTERS UI
// =========================
const toggleFilters = () => {
  console.log('toggle filters');
};
</script>