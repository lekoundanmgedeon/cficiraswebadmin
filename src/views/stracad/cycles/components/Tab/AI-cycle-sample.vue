<template>
  <div class="assistant-ia-container">
    <!-- Header de la section -->
    <div class="col-12 mb-4">
      <h3 class="fw-bold mb-1">Tableau de Bord & Copilote des Cycles</h3>
      <p class="text-muted small mb-0">
        <i class="bi bi-bar-chart-line-fill text-primary me-1"></i>
        Consultez les statistiques de performance de vos cycles académiques et interagissez avec
        l'IA pour obtenir des analyses prédictives.
      </p>
    </div>

    <!-- ZONE STATISTIQUE : Vue d'ensemble des Cycles (Année en cours) -->
    <div class="row g-3 mb-4">
      <div class="col-md-4">
        <div
          class="card border-0 shadow-sm rounded-4 bg-white p-3 border-start border-primary border-3"
        >
          <div class="d-flex justify-content-between align-items-center">
            <div>
              <span class="text-muted text-xs text-uppercase fw-bold d-block">Cycle Licence</span>
              <h4 class="fw-bold my-1 text-dark">
                1 240 <span class="text-xs fw-normal text-muted">étudiants</span>
              </h4>
              <span class="text-success text-xs fw-semibold"
                ><i class="bi bi-arrow-up-short"></i> +4.2%</span
              >
            </div>
            <div class="bg-soft-primary rounded p-2 text-primary">
              <i class="bi bi-mortarboard fs-4"></i>
            </div>
          </div>
          <div class="mt-3 text-xs text-muted d-flex justify-content-between">
            <span>34 classes actives</span>
            <span class="fw-bold text-secondary">S1 & S2</span>
          </div>
        </div>
      </div>

      <div class="col-md-4">
        <div
          class="card border-0 shadow-sm rounded-4 bg-white p-3 border-start border-info border-3"
        >
          <div class="d-flex justify-content-between align-items-center">
            <div>
              <span class="text-muted text-xs text-uppercase fw-bold d-block">Cycle Master</span>
              <h4 class="fw-bold my-1 text-dark">
                380 <span class="text-xs fw-normal text-muted">étudiants</span>
              </h4>
              <span class="text-muted text-xs fw-semibold"
                ><i class="bi bi-dash-short"></i> Stable</span
              >
            </div>
            <div class="bg-soft-info rounded p-2 text-info">
              <i class="bi bi-award fs-4"></i>
            </div>
          </div>
          <div class="mt-3 text-xs text-muted d-flex justify-content-between">
            <span>12 classes actives</span>
            <span class="fw-bold text-secondary">S3 & S4</span>
          </div>
        </div>
      </div>

      <div class="col-md-4">
        <div
          class="card border-0 shadow-sm rounded-4 bg-white p-3 border-start border-success border-3"
        >
          <div class="d-flex justify-content-between align-items-center">
            <div>
              <span class="text-muted text-xs text-uppercase fw-bold d-block">Cycle Doctoral</span>
              <h4 class="fw-bold my-1 text-dark">
                105 <span class="text-xs fw-normal text-muted">doctorants</span>
              </h4>
              <span class="text-success text-xs fw-semibold"
                ><i class="bi bi-arrow-up-short"></i> +1.8%</span
              >
            </div>
            <div class="bg-soft-success rounded p-2 text-success">
              <i class="bi bi-journal-bookmark-fill fs-4"></i>
            </div>
          </div>
          <div class="mt-3 text-xs text-muted d-flex justify-content-between">
            <span>3 Unités de Rech.</span>
            <span class="fw-bold text-secondary">Annuel</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Section Principale : Raccourcis et Chat -->
    <div class="row g-3">
      <!-- Zone des Raccourcis Prompt Flash -->
      <div class="col-md-4">
        <div class="card border-0 shadow-sm rounded-4 bg-white p-3 h-100">
          <h6 class="fw-bold text-dark mb-3 small text-uppercase text-secondary tracking-wider">
            <i class="bi bi-lightning-charge-fill text-warning me-2"></i>Requêtes Statistiques
          </h6>

          <div class="d-grid gap-2">
            <button
              @click="
                askShortcut('Analyse-moi le taux de réussite global par cycle au dernier semestre.')
              "
              class="btn btn-light btn-sm text-start p-2 rounded text-secondary border-0 btn-prompt"
            >
              <i class="bi bi-check-circle me-2 text-success"></i> Taux de réussite par cycle
            </button>
            <button
              @click="
                askShortcut(
                  'Quelle est la filière qui domine le cycle Master en termes de part d\'effectif ?'
                )
              "
              class="btn btn-light btn-sm text-start p-2 rounded text-secondary border-0 btn-prompt"
            >
              <i class="bi bi-pie-chart me-2 text-primary"></i> Filière dominante en Master
            </button>
            <button
              @click="
                askShortcut(
                  'Compare la densité moyenne (étudiants/classe) entre Licence et Master.'
                )
              "
              class="btn btn-light btn-sm text-start p-2 rounded text-secondary border-0 btn-prompt"
            >
              <i class="bi bi-people me-2 text-info"></i> Densité moyenne des classes
            </button>
          </div>

          <div class="mt-4 p-3 bg-soft-primary rounded text-xs text-muted">
            <span class="fw-bold text-primary d-block mb-1"
              ><i class="bi bi-funnel me-1"></i>Filtre Actif</span
            >
            Données consolidées basées sur les inscriptions closes de l'année en cours.
          </div>
        </div>
      </div>

      <!-- Interface de Discussion -->
      <div class="col-md-8">
        <div
          class="card border-0 shadow-sm rounded-4 bg-white d-flex flex-column"
          style="height: 400px"
        >
          <!-- Zone d'affichage des messages -->
          <div class="card-body overflow-auto p-4 flex-grow-1" ref="chatWindow">
            <div
              v-for="(msg, index) in messages"
              :key="index"
              class="d-flex mb-3"
              :class="msg.role === 'user' ? 'justify-content-end' : 'justify-content-start'"
            >
              <!-- Avatar IA -->
              <div
                v-if="msg.role === 'assistant'"
                class="bg-soft-primary rounded-circle p-2 me-2 d-flex align-items-center justify-content-center align-self-start"
                style="width: 32px; height: 32px"
              >
                <i class="bi bi-robot text-primary small"></i>
              </div>

              <!-- Bulle de texte -->
              <div
                class="p-3 rounded-4 max-w-75 text-sm"
                :class="msg.role === 'user' ? 'bg-primary text-white' : 'bg-light text-dark'"
              >
                <div
                  class="fw-semibold text-xs mb-1 opacity-75"
                  :class="msg.role === 'user' ? 'text-white' : 'text-secondary'"
                >
                  {{ msg.role === 'user' ? 'Vous' : 'Copilote IA' }}
                </div>
                <p class="mb-0 whitespace-pre-wrap">{{ msg.content }}</p>
              </div>
            </div>

            <!-- Indicateur de chargement -->
            <div v-if="isTyping" class="d-flex mb-3 justify-content-start">
              <div
                class="bg-soft-primary rounded-circle p-2 me-2 d-flex align-items-center justify-content-center"
                style="width: 32px; height: 32px"
              >
                <i class="bi bi-cpu text-primary small animate-pulse"></i>
              </div>
              <div class="p-3 rounded-4 bg-light text-muted text-sm italic">
                Compilation des statistiques par cycle...
              </div>
            </div>
          </div>

          <!-- Barre de saisie -->
          <div class="card-footer bg-white border-0 p-3">
            <form
              @submit.prevent="sendMessage"
              class="input-group input-group-sm border rounded shadow-sm overflow-hidden bg-white"
            >
              <input
                v-model="userInput"
                type="text"
                :disabled="isTyping"
                class="form-control border-0 py-2 px-3 text-dark shadow-none"
                placeholder="Demandez une analyse statistique poussée sur les cycles..."
              />
              <button
                type="submit"
                :disabled="isTyping || !userInput.trim()"
                class="btn btn-primary border-0 px-3"
              >
                <i class="bi bi-send-fill"></i>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick } from 'vue';

const userInput = ref('');
const isTyping = ref(false);
const chatWindow = ref(null);

const messages = ref([
  {
    role: 'assistant',
    content:
      "Les statistiques macro des cycles (Licence, Master, Doctorat) sont chargées. Je peux croiser ces chiffres avec les filières ou estimer les taux de rétention d'un semestre à l'autre. Quelle statistique analysez-vous ?",
  },
]);

const scrollToBottom = async () => {
  await nextTick();
  if (chatWindow.value) {
    chatWindow.value.scrollTop = chatWindow.value.scrollHeight;
  }
};

const sendMessage = () => {
  const queryCleaned = userInput.value.trim();
  if (!queryCleaned || isTyping.value) return;

  messages.value.push({ role: 'user', content: queryCleaned });
  userInput.value = '';
  scrollToBottom();

  isTyping.value = true;

  setTimeout(() => {
    let aiResponse =
      'Demande statistique non répertoriée. Essayez de me demander des détails sur la réussite des semestres, la densité par classe ou la filière dominante.';
    const searchStr = queryCleaned.toLowerCase();

    if (searchStr.includes('réussite') || searchStr.includes('taux')) {
      aiResponse =
        "Statistiques de performance du dernier semestre :\n\n• Cycle Licence : 78.4% de réussite globale (Point critique détecté en L1 avec 64%)\n• Cycle Master : 89.1% de réussite (Forte homogénéité entre S1 et S2)\n• Cycle Doctoral : 96.2% de validation des rapports de recherche d'étape.";
    } else if (searchStr.includes('dominante') || searchStr.includes('filière')) {
      aiResponse =
        "Analyse des parts d'effectifs pour le Cycle Master :\nLa filière 'Informatique' (Spécialités Dev & IA) est largement dominante. Elle représente à elle seule 42% des effectifs du cycle Master (soit 160 étudiants sur les 380 du cycle), suivie par la filière 'Gestion des Projets' à 28%.";
    } else if (
      searchStr.includes('densité') ||
      searchStr.includes('classe') ||
      searchStr.includes('moyenne')
    ) {
      aiResponse =
        "Comparaison de la structure de densité des classes :\n\n• En Licence : Moyenne élevée de 36.4 étudiants par classe (Risque de surcharge identifié sur les filières tronc commun).\n• En Master : Structure plus agile avec une moyenne de 31.6 étudiants par classe, ce qui optimise l'encadrement pédagogique.";
    }

    messages.value.push({ role: 'assistant', content: aiResponse });
    isTyping.value = false;
    scrollToBottom();
  }, 1200);
};

const askShortcut = (text) => {
  userInput.value = text;
  sendMessage();
};
</script>

<style scoped>
.bg-soft-primary {
  background-color: rgba(0, 123, 255, 0.08);
}
.bg-soft-info {
  background-color: rgba(23, 162, 184, 0.08);
}
.bg-soft-success {
  background-color: rgba(40, 167, 69, 0.08);
}
.text-xs {
  font-size: 11px !important;
}
.text-sm {
  font-size: 0.9rem;
}
.max-w-75 {
  max-width: 75%;
}
.whitespace-pre-wrap {
  white-space: pre-wrap;
}

.btn-prompt {
  transition: all 0.2s ease-in-out;
}
.btn-prompt:hover {
  background-color: #f0f2f5 !important;
  color: #212529 !important;
  transform: translateX(4px);
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.4;
  }
}
.animate-pulse {
  animation: pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

.rounded-4 {
  border-radius: 0.2rem !important;
}
</style>
