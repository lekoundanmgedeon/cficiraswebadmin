<template>
  <div>
    <ul class="nav nav-tabs px-4" role="tablist">
      <li class="nav-item">
        <a
          id="paiement-tab"
          class="nav-link active"
          data-bs-toggle="tab"
          href="#paiement"
          role="tab"
          aria-controls="paiement"
          aria-selected="true"
        >
          Paiements
        </a>
      </li>
      <li class="nav-item">
        <a
          id="nouveau-tab"
          class="nav-link"
          data-bs-toggle="tab"
          href="#nouveau"
          role="tab"
          aria-controls="nouveau"
          aria-selected="false"
        >
          Nouveau Paiement
        </a>
      </li>
      <li class="nav-item">
        <a
          id="suivi-etudiant-tab"
          class="nav-link"
          data-bs-toggle="tab"
          href="#suivi-etudiant"
          role="tab"
          aria-controls="suivi-etudiant"
          aria-selected="false"
        >
          Suivi étudiant
        </a>
      </li>
      <li class="nav-item">
        <a
          id="controle-classe-tab"
          class="nav-link"
          data-bs-toggle="tab"
          href="#controle-classe"
          role="tab"
          aria-controls="controle-classe"
          aria-selected="false"
        >
          Contrôle par classe
        </a>
      </li>
      <li class="nav-item">
        <a
          id="archives-tab"
          class="nav-link"
          data-bs-toggle="tab"
          href="#archives"
          role="tab"
          aria-controls="archives"
          aria-selected="false"
        >
          Archives
        </a>
      </li>
    </ul>

    <div class="tab-content p-4">
      <!-- Liste des paiements -->
      <div
        id="paiement"
        class="tab-pane fade show active"
        role="tabpanel"
        aria-labelledby="paiement-tab"
      >
        <PaiementList />
      </div>

      <!-- Formulaire d'ajout -->
      <div id="nouveau" class="tab-pane fade" role="tabpanel" aria-labelledby="nouveau-tab">
        <PaiementForm />
      </div>

      <!-- Suivi d'un étudiant : a-t-il payé le mois / semestre / année ? -->
      <div
        id="suivi-etudiant"
        class="tab-pane fade"
        role="tabpanel"
        aria-labelledby="suivi-etudiant-tab"
      >
        <SuiviEtudiant />
      </div>

      <!-- Contrôle collectif : statut de paiement de toute une classe -->
      <div
        id="controle-classe"
        class="tab-pane fade"
        role="tabpanel"
        aria-labelledby="controle-classe-tab"
      >
        <ControleClasse />
      </div>

      <!-- Historique / Archives -->
      <div id="archives" class="tab-pane fade" role="tabpanel" aria-labelledby="archives-tab">
        <PaiementArchives />
      </div>
    </div>
  </div>
</template>

<script setup>
import PaiementList from './Tab/PaiementList.vue';
import PaiementForm from './Tab/PaiementForm.vue';
import PaiementArchives from './Tab/PaiementArchives.vue';
import SuiviEtudiant from './Tab/SuiviEtudiant.vue';
import ControleClasse from './Tab/ControleClasse.vue';
</script>

<style scoped>
body {
  background-color: #f8f9fa;
  color: #212529;
}
.card {
  background-color: #ffffff;
  border: 1px solid #dee2e6;
  border-radius: 12px;
}
.btn-primary {
  background-color: #007bff;
  border-color: #007bff;
  color: #fff;
}
.btn-primary:hover {
  background-color: #0056b3;
  border-color: #004080;
}
.status-badge {
  padding: 0.5em 1em;
  border-radius: 20px;
  font-size: 0.85rem;
  color: #fff;
}
.status-draft {
  background-color: #6c757d;
}
.status-active {
  background-color: #0d6efd;
}
.table thead th {
  border-bottom: 2px solid #dee2e6;
}
</style>
