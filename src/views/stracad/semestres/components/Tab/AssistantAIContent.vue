<template>
  <div class="assistant-ia-container">
    <!-- Header de la section -->
    <div class="col-12 mb-4">
      <h3 class="fw-bold mb-1">Copilote Académique IA</h3>
      <p class="text-muted small mb-0">
        <i class="bi bi-cpu-fill text-primary me-1"></i>
        Pilotez votre structure globale : analysez la répartition par cycles, le suivi des
        semestres, les ouvertures de filières et les effectifs des classes.
      </p>
    </div>

    <div class="row g-3">
      <!-- Zone des Raccourcis Prompt Flash (Analyse Structurelle) -->
      <div class="col-md-4">
        <div class="card border-0 shadow-sm rounded-4 bg-white p-3 h-100">
          <h6 class="fw-bold text-dark mb-3 small text-uppercase text-secondary tracking-wider">
            <i class="bi bi-lightning-charge-fill text-warning me-2"></i>Analyses de la Structure
          </h6>

          <div class="d-grid gap-2">
            <button
              @click="
                askShortcut(
                  'Fais-moi un récapitulatif des effectifs par Cycle pour l\'année académique en cours.'
                )
              "
              class="btn btn-light btn-sm text-start p-2 rounded text-secondary border-0 btn-prompt"
            >
              <i class="bi bi-layers-half me-2 text-primary"></i> Répartition par Cycle
            </button>
            <button
              @click="
                askShortcut(
                  'Quelles sont les filières actives au Semestre 1 par rapport au Semestre 2 ?'
                )
              "
              class="btn btn-light btn-sm text-start p-2 rounded text-secondary border-0 btn-prompt"
            >
              <i class="bi bi-calendar-range me-2 text-danger"></i> Comparatif des Semestres
            </button>
            <button
              @click="
                askShortcut(
                  'Combien de classes sont actuellement rattachées à la filière Informatique ?'
                )
              "
              class="btn btn-light btn-sm text-start p-2 rounded text-secondary border-0 btn-prompt"
            >
              <i class="bi bi-door-open me-2 text-success"></i> Classes par Filière
            </button>
            <button
              @click="
                askShortcut(
                  'Génère le rapport de transition pour le changement d\'Année Académique.'
                )
              "
              class="btn btn-light btn-sm text-start p-2 rounded text-secondary border-0 btn-prompt"
            >
              <i class="bi bi-arrow-repeat me-2 text-info"></i> Transition Année Académique
            </button>
          </div>

          <div class="mt-4 p-3 bg-soft-primary rounded text-xs text-muted">
            <span class="fw-bold text-primary d-block mb-1"
              ><i class="bi bi-shield-check me-1"></i>Cartographie Scolaire</span
            >
            L'assistant synchronise en temps réel les arborescences de l'année 2026, de
            l'inscription au découpage des crédits.
          </div>
        </div>
      </div>

      <!-- Interface de Discussion / Flux de Conversation -->
      <div class="col-md-8">
        <div
          class="card border-0 shadow-sm rounded-4 bg-white d-flex flex-column"
          style="height: 480px"
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
                Analyse de l'arborescence et de la structure académique...
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
                placeholder="Posez une question sur les cycles, filières, classes ou semestres..."
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
      "Bonjour ! Je suis votre copilote académique. Je maîtrise l'organisation de votre établissement : des années académiques aux structures de vos classes, filières, semestres et cycles. Que souhaitez-vous analyser aujourd'hui ?",
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
      "Je n'ai pas pu identifier de correspondance structurelle pour cette demande. Pouvez-vous spécifier s'il s'agit d'un cycle, d'une filière ou d'un semestre particulier ?";
    const searchStr = queryCleaned.toLowerCase();

    // Logique de simulation axée sur la structure académique
    if (searchStr.includes('cycle') || searchStr.includes('répartition')) {
      aiResponse =
        "Pour l'Année Académique 2025-2026, la répartition de vos effectifs par cycle s'établit comme suit :\n\n• Cycle Licence : 1 240 étudiants (72% de la structure globale)\n• Cycle Master : 380 étudiants (22%)\n• Cycle Doctoral : 105 étudiants (6%)\n\nLe cycle Licence enregistre une croissance de +4.2% tirée par les filières technologiques.";
    } else if (
      searchStr.includes('semestre') ||
      searchStr.includes('s1') ||
      searchStr.includes('s2')
    ) {
      aiResponse =
        "Analyse du calendrier des cours :\nAu Semestre 1, 42 filières sont actives pour un total de 184 unités d'enseignement dispensées. Pour le Semestre 2, la planification prévoit l'ouverture de 3 filières de spécialisation supplémentaires en Master, ce qui portera le total à 45 filières opérationnelles.";
    } else if (searchStr.includes('filière') || searchStr.includes('classe')) {
      aiResponse =
        "La filière 'Informatique' comprend actuellement 8 classes actives réparties sur les deux cycles fondamentaux :\n\n- Premier Cycle (Licence) : L1-A, L1-B, L2-A, L3-Cyber\n- Second Cycle (Master) : M1-Dev, M1-Data, M2-IA, M2-Réseau\n\nL'effectif moyen par classe dans cette filière est de 32 étudiants, respectant les seuils structurels fixés.";
    } else if (
      searchStr.includes('année') ||
      searchStr.includes('transition') ||
      searchStr.includes('académique')
    ) {
      aiResponse =
        "Préparation de la transition vers la nouvelle Année Académique :\nLes maquettes pédagogiques, les filières existantes et l'arborescence des cycles ont été dupliquées avec succès pour préparer le prochain exercice. 12 classes du cycle Licence changeront automatiquement de niveau dès la validation des délibérations du second semestre.";
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
