<template>
  <div class="row">
    <div class="col-12 mb-4">
      <div class="d-flex align-items-center justify-content-between">
        <div>
          <h4 class="fw-bold mb-1">Dossiers Académiques des Étudiants</h4>
          <p class="text-muted small mb-0">
            Recherchez un étudiant et consultez son parcours, ses notes et son historique d'inscriptions.
          </p>
        </div>
        <i class="mdi mdi-school-outline h1 text-primary opacity-25"></i>
      </div>
    </div>

    <div class="col-12 mb-4">
      <div class="card border-0 shadow-sm">
        <div class="card-header bg-white border-0 py-3">
          <h6 class="mb-0 fw-bold">
            <i class="mdi mdi-filter-variant me-2 text-primary"></i>Filtrer les étudiants
          </h6>
        </div>
        <div class="card-body bg-light rounded-bottom">
          <div class="row g-3">
            <div class="col-md-3">
              <label class="small fw-semibold text-muted mb-1">Année</label>
              <select v-model="selectedAnnee" class="form-select border-0 shadow-sm">
                <option value="">Toutes les Années</option>
                <option v-for="annee in annees" :key="annee" :value="annee">{{ annee }}</option>
              </select>
            </div>
            <div class="col-md-3">
              <label class="small fw-semibold text-muted mb-1">Filière</label>
              <select v-model="selectedFiliere" class="form-select border-0 shadow-sm">
                <option value="">Toutes les Filières</option>
                <option v-for="f in filieres" :key="f" :value="f">{{ f }}</option>
              </select>
            </div>
            <div class="col-md-3">
              <label class="small fw-semibold text-muted mb-1">Niveau</label>
              <select v-model="selectedNiveau" class="form-select border-0 shadow-sm">
                <option value="">Tous les Niveaux</option>
                <option v-for="n in niveaux" :key="n" :value="n">{{ n }}</option>
              </select>
            </div>
            <div class="col-md-3">
              <label class="small fw-semibold text-muted mb-1">Classe</label>
              <select v-model="selectedClasse" class="form-select border-0 shadow-sm">
                <option value="">Toutes les Classes</option>
                <option v-for="c in classes" :key="c" :value="c">{{ c }}</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="col-12">
      <div class="card border-0 shadow-sm">
        <div class="card-header bg-white border-0 py-3">
          <h6 class="mb-0 fw-bold">
            <i class="mdi mdi-account-list-outline me-2 text-primary"></i>Registre des étudiants
          </h6>
        </div>
        <div class="card-body p-0">
          <div class="table-responsive">
            <table class="table table-hover align-middle mb-0">
              <thead class="table-light">
                <tr>
                  <th class="ps-4" style="width: 15%">Matricule</th>
                  <th style="width: 30%">Nom & Prénoms</th>
                  <th style="width: 20%">Filière</th>
                  <th style="width: 20%">Niveau & Classe</th>
                  <th class="text-end pe-4" style="width: 15%">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="etudiant in filteredEtudiants" :key="etudiant.id">
                  <td class="ps-4 font-monospace fw-semibold text-primary">
                    {{ etudiant.matricule }}
                  </td>
                  <td>
                    <div class="fw-bold text-dark">{{ etudiant.nom }} {{ etudiant.prenom }}</div>
                    <small class="text-muted">{{ etudiant.email }}</small>
                  </td>
                  <td>
                    <span class="badge bg-light text-secondary border px-2 py-1">
                      {{ etudiant.filiere }}
                    </span>
                  </td>
                  <td>
                    <div class="text-sm text-dark">{{ etudiant.niveau }}</div>
                    <small class="text-muted font-monospace text-xs">{{ etudiant.classe }}</small>
                  </td>
                  <td class="text-end pe-4">
                    <RouterLink
                      :to="`/dossier-academique/${etudiant.id}/details`"
                      class="btn btn-sm btn-outline-primary d-inline-flex align-items-center gap-1"
                    >
                      <i class="mdi mdi-eye-outline"></i>
                      <span>Détails</span>
                    </RouterLink>
                  </td>
                </tr>

                <tr v-if="filteredEtudiants.length === 0">
                  <td colspan="5" class="text-center text-muted py-4">
                    Aucun étudiant ne correspond aux critères sélectionnés.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

// États réactifs des filtres
const selectedAnnee = ref('');
const selectedFiliere = ref('');
const selectedNiveau = ref('');
const selectedClasse = ref('');

// Listes d'options pour vos sélecteurs (Exemples à lier à vos stores ou API)
const annees = ref(['2023-2024', '2024-2025', '2025-2026']);
const filieres = ref(['Informatique', 'Management', 'Droit', 'Génie Civil']);
const niveaux = ref(['Licence 1', 'Licence 2', 'Licence 3', 'Master 1', 'Master 2']);
const classes = ref(['INF-L1-A', 'INF-L1-B', 'MNG-L3', 'GC-M1']);

// Données fictives des étudiants (À remplacer par l'appel de votre Store / API)
const etudiants = ref([
  { id: 1, matricule: 'ETU-2026-001', nom: 'DIOP', prenom: 'Moussa', email: 'moussa.diop@univ.sn', annee: '2025-2026', filiere: 'Informatique', niveau: 'Licence 3', classe: 'INF-L3' },
  { id: 2, matricule: 'ETU-2026-002', nom: 'KANE', prenom: 'Awa', email: 'awa.kane@univ.sn', annee: '2025-2026', filiere: 'Management', niveau: 'Master 1', classe: 'MNG-M1' },
  { id: 3, matricule: 'ETU-2025-045', nom: 'NFAH', prenom: 'Jean', email: 'jean.nfah@univ.sn', annee: '2024-2025', filiere: 'Informatique', niveau: 'Licence 1', classe: 'INF-L1-A' }
]);

// Logique de filtrage dynamique
const filteredEtudiants = computed(() => {
  return etudiants.value.filter((etudiant) => {
    const matchAnnee = !selectedAnnee.value || etudiant.annee === selectedAnnee.value;
    const matchFiliere = !selectedFiliere.value || etudiant.filiere === selectedFiliere.value;
    const matchNiveau = !selectedNiveau.value || etudiant.niveau === selectedNiveau.value;
    const matchClasse = !selectedClasse.value || etudiant.classe === selectedClasse.value;
    
    return matchAnnee && matchFiliere && matchNiveau && matchClasse;
  });
});
</script>

<style scoped>
/* Alignement fluide avec l'UI existante */
.table th {
  font-weight: 600;
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.font-monospace {
  font-family: var(--bs-font-monospace);
}
.text-xs {
  font-size: 0.75rem;
}
</style>