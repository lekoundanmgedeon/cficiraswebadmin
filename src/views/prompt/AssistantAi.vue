<template>
  <div class="assistant-ia-container w-100 py-2 animate__animated animate__fadeIn">
    <div class="col-12 mb-4">
      <h3 class="fw-bold mb-1">Copilote Académique & Opérationnel</h3>
      <p class="text-muted small mb-0">
        <i class="bi bi-cpu-fill text-primary me-1"></i>
        Pilotez l'ensemble de votre établissement : suivez le statut des inscriptions, auditez la
        trésorerie et supervisez les performances académiques en temps réel.
      </p>
    </div>

    <div class="row g-3">
      <div class="col-md-3 d-none d-md-flex flex-column">
        <div
          class="card border-0 shadow-sm rounded-4 bg-white p-3 h-100 d-flex flex-column"
          style="height: 650px"
        >
          <h6 class="fw-bold text-dark mb-3 small text-uppercase text-secondary tracking-wider">
            <i class="bi bi-clock-history text-primary me-2"></i>Analyses Récentes
          </h6>

          <div class="flex-grow-1 overflow-auto mb-3">
            <div class="d-grid gap-1">
              <button
                v-for="h in history"
                :key="h.id"
                @click="loadHistory(h)"
                class="btn btn-light btn-sm text-start p-2 rounded text-secondary border-0 btn-prompt text-truncate"
                style="font-size: 12px"
              >
                <i class="bi bi-journal-text me-2 text-secondary opacity-75"></i> {{ h.title }}
              </button>
            </div>
          </div>

          <div class="mt-auto border-top pt-3">
            <button class="btn btn-outline-dark btn-sm w-100 rounded-3" @click="clearChat">
              <i class="bi bi-plus-lg me-1"></i> Nouvelle Analyse
            </button>
          </div>
        </div>
      </div>

      <div class="col-md-9">
        <div
          class="card border-0 shadow-sm rounded-4 bg-white d-flex flex-column"
          style="height: 650px"
        >
          <div
            class="card-header bg-white border-0 p-3 border-bottom d-flex justify-content-between align-items-center"
          >
            <div class="d-flex align-items-center">
              <div
                class="bg-soft-primary rounded-circle p-2 me-3 d-flex align-items-center justify-content-center"
                style="width: 40px; height: 40px"
              >
                <i class="bi bi-brain text-primary fs-5"></i>
              </div>
              <div>
                <h6 class="mb-0 fw-bold text-dark">Intelligence Opérationnelle</h6>
                <small class="text-success fw-medium">
                  <i class="bi bi-circle-fill me-1 small animate-pulse" style="font-size: 8px"></i>
                  Données synchronisées en temps réel
                </small>
              </div>
            </div>
            <button
              class="btn btn-sm btn-light border rounded-3"
              @click="exportConversation"
              :disabled="messages.length === 0"
            >
              <i class="bi bi-download me-1"></i> Exporter l'audit
            </button>
          </div>

          <div class="card-body overflow-auto p-4 flex-grow-1 bg-chat-canvas" ref="chatWindow">
            <div class="d-flex mb-4 justify-content-start">
              <div
                class="bg-soft-primary rounded-circle p-2 me-2 d-flex align-items-center justify-content-center align-self-start"
                style="width: 32px; height: 32px"
              >
                <i class="bi bi-robot text-primary small"></i>
              </div>
              <div class="p-3 rounded-4 bg-light text-dark max-w-80 text-sm border-0 shadow-sm">
                <div class="fw-semibold text-xs mb-1 text-secondary">Copilote IA</div>
                <p class="mb-3">
                  Bonjour Administrateur. Je suis prêt à analyser l'ensemble des opérations et
                  indicateurs de la plateforme.
                </p>

                <div class="small text-muted mb-2 fw-medium" style="font-size: 11px">
                  Suggérer une analyse complexe :
                </div>
                <div class="d-flex flex-wrap gap-2">
                  <button
                    @click="askShortcut('Quel est le bénéfice net de ce mois ?')"
                    class="btn btn-sm btn-pill-suggestion"
                  >
                    <i class="bi bi-cash-coin me-1 text-success"></i> Bénéfice net mensuel
                  </button>
                  <button
                    @click="askShortcut('Liste des impayés en Licence 1')"
                    class="btn btn-sm btn-pill-suggestion"
                  >
                    <i class="bi bi-exclamation-triangle me-1 text-danger"></i> Impayés L1
                  </button>
                  <button
                    @click="askShortcut('Prévision des honoraires pour le mois prochain')"
                    class="btn btn-sm btn-pill-suggestion"
                  >
                    <i class="bi bi-graph-up me-1 text-primary"></i> Prévisions Honoraires
                  </button>
                </div>
              </div>
            </div>

            <div
              v-for="(msg, index) in messages"
              :key="index"
              class="d-flex mb-4"
              :class="msg.role === 'user' ? 'justify-content-end' : 'justify-content-start'"
            >
              <div
                v-if="msg.role === 'assistant'"
                class="bg-soft-primary rounded-circle p-2 me-2 d-flex align-items-center justify-content-center align-self-start"
                style="width: 32px; height: 32px"
              >
                <i class="bi bi-robot text-primary small"></i>
              </div>

              <div
                class="p-3 rounded-4 max-w-80 text-sm"
                :class="
                  msg.role === 'user'
                    ? 'bg-chat-user text-white shadow-sm'
                    : 'bg-light text-dark border-0 shadow-sm'
                "
              >
                <div
                  class="fw-semibold text-xs mb-1 opacity-75"
                  :class="msg.role === 'user' ? 'text-white' : 'text-secondary'"
                >
                  {{ msg.role === 'user' ? 'Vous' : 'Copilote IA' }}
                </div>

                <div class="mb-0 markdown-body" v-html="renderMarkdown(msg.content)"></div>

                <div
                  v-if="msg.stats"
                  class="mt-2 pt-2 border-top border-secondary-subtle opacity-75 d-flex align-items-center gap-1"
                  style="font-size: 10px"
                >
                  <i class="bi bi-database-check text-success"></i>
                  <span
                    >Source : Module
                    <strong class="text-primary">{{ msg.stats.module }}</strong></span
                  >
                </div>
              </div>
            </div>

            <div v-if="isTyping" class="d-flex mb-3 justify-content-start">
              <div
                class="bg-soft-primary rounded-circle p-2 me-2 d-flex align-items-center justify-content-center"
                style="width: 32px; height: 32px"
              >
                <i class="bi bi-cpu text-primary small animate-pulse"></i>
              </div>
              <div class="p-3 rounded-4 bg-light text-muted text-sm italic shadow-sm">
                Analyse des bases de données en cours...
              </div>
            </div>
          </div>

          <div class="card-footer bg-white border-0 px-4 pb-3 pt-2">
            <div
              class="modern-input-wrapper position-relative shadow-sm border rounded-4 bg-light p-2"
            >
              <textarea
                v-model="userInput"
                @keydown.enter.prevent="sendMessage"
                rows="2"
                :disabled="isTyping"
                class="form-control border-0 bg-transparent py-2 px-3 text-dark shadow-none resize-none text-sm"
                placeholder="Demandez une analyse, un comparatif ou un audit..."
              ></textarea>

              <div
                class="d-flex justify-content-between align-items-center px-3 pt-2 border-top border-light-subtle"
              >
                <span class="text-muted opacity-50" style="font-size: 11px">
                  <i class="bi bi-lightning-charge me-1"></i>Modèle Opérationnel v2.6
                </span>
                <button
                  @click="sendMessage"
                  :disabled="isTyping || !userInput.trim()"
                  class="btn btn-chat-submit rounded-circle d-flex align-items-center justify-content-center"
                >
                  <i class="bi bi-arrow-up-short fs-4"></i>
                </button>
              </div>
            </div>
            <p class="text-center text-muted mt-2 mb-0" style="font-size: 10px">
              L'IA peut faire des erreurs. Vérifiez les chiffres importants dans vos modules
              financiers.
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick } from 'vue';
import { marked } from 'marked';

marked.setOptions({
  breaks: true,
  gfm: true,
});

const userInput = ref('');
const isTyping = ref(false);
const chatWindow = ref(null);
const messages = ref([]);

const history = ref([
  {
    id: 1,
    title: 'Analyse Taux Recouvrement Oct.',
    query: "Donne-moi un rapport sur le taux de recouvrement de l'octobre.",
  },
  {
    id: 2,
    title: 'Comparatif Dépenses Trimestrielles',
    query: 'Fais un comparatif des dépenses du dernier trimestre.',
  },
]);

const renderMarkdown = (text) => {
  if (!text) return '';
  return marked.parse(text);
};

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
    isTyping.value = false;

    let aiMarkdownResponse =
      "D'après les données du module **Trésorerie** et **Paiements** :\n\n1. Les revenus ont augmenté de **15%** grâce aux inscriptions de Master.\n2. Cependant, le solde net est impacté par une hausse des charges opérationnelles (maintenance).\n\n**Décision recommandée :** Relancer les 42 étudiants de Licence 1 en retard de paiement pour stabiliser le cash-flow.";

    messages.value.push({
      role: 'assistant',
      content: aiMarkdownResponse,
      stats: { module: 'Finances & Scolarité' },
    });

    scrollToBottom();
  }, 1500);
};

const askShortcut = (text) => {
  userInput.value = text;
  sendMessage();
};

const loadHistory = (historyItem) => {
  userInput.value = historyItem.query || historyItem.title;
  sendMessage();
};

const clearChat = () => {
  messages.value = [];
};

const exportConversation = () => {
  const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(messages.value, null, 2))}`;
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', jsonString);
  downloadAnchor.setAttribute('download', 'audit_assistant_ia.json');
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
};
</script>

<style scoped>
.bg-soft-primary {
  background-color: rgba(0, 123, 255, 0.06);
}
.bg-chat-canvas {
  background-color: #fafafa;
}
.bg-chat-user {
  background-color: #0f172a; /* Bleu nuit ultra-moderne */
}
.text-xs {
  font-size: 11px !important;
}
.text-sm {
  font-size: 0.9rem;
}
.max-w-80 {
  max-width: 80%;
}
.resize-none {
  resize: none;
}

/* Suggestions en pilules modernes */
.btn-pill-suggestion {
  background-color: #ffffff;
  border: 1px solid #e2e8f0;
  color: #334155;
  font-size: 11px;
  padding: 0.4rem 0.75rem;
  border-radius: 20px;
  transition: all 0.2s ease;
}
.btn-pill-suggestion:hover {
  background-color: #f1f5f9;
  border-color: #cbd5e1;
  transform: translateY(-1px);
}

/* Cadre de saisie moderne */
.modern-input-wrapper {
  background-color: #f8fafc !important;
  border: 1px solid #e2e8f0 !important;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}
.modern-input-wrapper:focus-within {
  border-color: #94a3b8 !important;
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.04) !important;
}

/* Bouton soumission style moderne */
.btn-chat-submit {
  background-color: #0f172a;
  color: #ffffff;
  width: 32px;
  height: 32px;
  border: none;
  transition:
    background-color 0.2s,
    transform 0.1s;
}
.btn-chat-submit:hover:not(:disabled) {
  background-color: #1e293b;
  transform: scale(1.05);
}
.btn-chat-submit:disabled {
  background-color: #e2e8f0;
  color: #94a3b8;
  cursor: not-allowed;
}

.btn-prompt {
  transition: all 0.2s ease-in-out;
}
.btn-prompt:hover {
  background-color: #f1f5f9 !important;
  color: #0f172a !important;
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
  border-radius: 0.5rem !important; /* Arrondis adoucis pour l'UI moderne */
}

/* Markdown généré par Marked */
:deep(.markdown-body p) {
  margin-bottom: 0px;
}
:deep(.markdown-body ol),
:deep(.markdown-body ul) {
  padding-left: 1.25rem;
  margin-top: 0.5rem;
  margin-bottom: 0.5rem;
}
:deep(.markdown-body li) {
  margin-bottom: 0.25rem;
}
</style>
