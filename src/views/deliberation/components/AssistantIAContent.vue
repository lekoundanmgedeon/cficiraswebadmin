<template>
  <div class="assistant-ia-container container-fluid py-2">
    <div class="col-12 mb-4">
      <h3 class="fw-bold mb-1">Copilote Académique IA</h3>
      <p class="text-muted small mb-0">
        <i class="bi bi-cpu-fill text-primary me-1"></i>
        Pilotez l'ensemble de votre établissement : suivez le statut des inscriptions, auditez la
        saisie des notes, simulez les délibérations de fin de cycle et suivez les proclamations de
        résultats.
      </p>
    </div>

    <div class="row g-3">
      <div class="col-md-4">
        <div
          class="card border-0 shadow-sm rounded-4 bg-white p-3 h-100 overflow-auto"
          style="max-height: 520px"
        >
          <div class="mb-3">
            <h6 class="fw-bold text-dark mb-2 small text-uppercase text-secondary tracking-wider">
              <i class="bi bi-people-fill text-info me-2"></i>Organisation des Étudiants
            </h6>
            <div class="d-grid gap-1">
              <button
                @click="
                  askShortcut(
                    'Fais un rapport statistique rapide sur les inscriptions et la parité de l\'année.'
                  )
                "
                class="btn btn-light btn-sm text-start p-2 rounded text-secondary border-0 btn-prompt"
              >
                <i class="bi bi-gender-ambiguous me-2 text-info"></i> Statistiques & Parité
              </button>
            </div>
          </div>

          <div class="mb-3">
            <h6 class="fw-bold text-dark mb-2 small text-uppercase text-secondary tracking-wider">
              <i class="bi bi-journal-check text-warning me-2"></i>Gestion des Notes
            </h6>
            <div class="d-grid gap-1">
              <button
                @click="
                  askShortcut(
                    'Quelles sont les matières qui bloquent actuellement la complétude des notes de fin de semestre ?'
                  )
                "
                class="btn btn-light btn-sm text-start p-2 rounded text-secondary border-0 btn-prompt"
              >
                <i class="bi bi-exclamation-octagon me-2 text-danger"></i> Retards de Saisie Notes
              </button>
            </div>
          </div>

          <div class="mb-3">
            <h6 class="fw-bold text-dark mb-2 small text-uppercase text-secondary tracking-wider">
              <i class="bi bi-shield-check text-primary me-2"></i>Gestion des Résultats &
              Délibérations
            </h6>
            <div class="d-grid gap-1">
              <button
                @click="
                  askShortcut(
                    'Donne-moi le taux de réussite prédictif par classe avant délibération.'
                  )
                "
                class="btn btn-light btn-sm text-start p-2 rounded text-secondary border-0 btn-prompt"
              >
                <i class="bi bi-graph-up me-2 text-primary"></i> Estimations de Réussite
              </button>
              <button
                @click="
                  askShortcut(
                    'Quels sont les étudiants éligibles au rachat ou secours du jury pour cette session ?'
                  )
                "
                class="btn btn-light btn-sm text-start p-2 rounded text-secondary border-0 btn-prompt"
              >
                <i class="bi bi-calculator me-2 text-success"></i> Simulation des Rachats
              </button>
            </div>
          </div>

          <div class="mb-3">
            <h6 class="fw-bold text-dark mb-2 small text-uppercase text-secondary tracking-wider">
              <i class="bi bi-megaphone-fill text-success me-2"></i>Proclamations
            </h6>
            <div class="d-grid gap-1">
              <button
                @click="
                  askShortcut(
                    'Quel est l\'état d\'avancement de la publication des procès-verbaux globaux et des bulletins ?'
                  )
                "
                class="btn btn-light btn-sm text-start p-2 rounded text-secondary border-0 btn-prompt"
              >
                <i class="bi bi-file-earmark-pdf me-2 text-success"></i> Statut des Publications PV
              </button>
            </div>
          </div>

          <div class="mt-auto p-3 bg-soft-primary rounded text-xs text-muted">
            <span class="fw-bold text-primary d-block mb-1">
              <i class="bi bi-shield-check me-1"></i>Registre Centralisé
            </span>
            L'assistant synchronise en temps réel les bases relationnelles 2026 : de la scolarité
            aux procès-verbaux de proclamation.
          </div>
        </div>
      </div>

      <div class="col-md-8">
        <div
          class="card border-0 shadow-sm rounded-4 bg-white d-flex flex-column"
          style="height: 520px"
        >
          <div class="card-body overflow-auto p-4 flex-grow-1" ref="chatWindow">
            <div
              v-for="(msg, index) in messages"
              :key="index"
              class="d-flex mb-3"
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
                class="p-3 rounded-4 max-w-75 text-sm"
                :class="msg.role === 'user' ? 'bg-primary text-white' : 'bg-light text-dark'"
              >
                <div
                  class="fw-semibold text-xs mb-1 opacity-75"
                  :class="msg.role === 'user' ? 'text-white' : 'text-secondary'"
                >
                  {{ msg.role === 'user' ? 'Vous' : 'Copilote IA' }}
                </div>

                <div class="mb-0 markdown-body" v-html="renderMarkdown(msg.content)"></div>
              </div>
            </div>

            <div v-if="isTyping" class="d-flex mb-3 justify-content-start">
              <div
                class="bg-soft-primary rounded-circle p-2 me-2 d-flex align-items-center justify-content-center"
                style="width: 32px; height: 32px"
              >
                <i class="bi bi-cpu text-primary small animate-pulse"></i>
              </div>
              <div class="p-3 rounded-4 bg-light text-muted text-sm italic">
                Analyse des tables relationnelles, des procès-verbaux et des fiches étudiants...
              </div>
            </div>
          </div>

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
                placeholder="Posez une question sur les étudiants, les notes, délibérations ou proclamations..."
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
import { marked } from 'marked';

const userInput = ref('');
const isTyping = ref(false);
const chatWindow = ref(null);

const messages = ref([
  {
    role: 'assistant',
    content:
      "Bonjour ! Je suis votre copilote académique global. Je maîtrise l'organisation de votre établissement : de la gestion et statistiques des étudiants au suivi rigoureux des notes, en passant par les calculs de délibérations de jurys et la proclamation officielle des résultats. Que souhaitez-vous analyser aujourd'hui ?",
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
      "Je n'ai pas pu identifier de correspondance sémantique pour cette demande. Pouvez-vous préciser si votre requête concerne l'organisation des étudiants, une note manquante, un calcul de délibération ou un statut de proclamation ?";
    const searchStr = queryCleaned.toLowerCase();

    // 1. Logique : Organisation des Étudiants
    if (
      searchStr.includes('parité') ||
      searchStr.includes('statistique') ||
      searchStr.includes('effectif') ||
      searchStr.includes('inscription')
    ) {
      aiResponse =
        "👥 **Synthèse des Effectifs Apprenants (2025-2026) :**\n\n- **Volume Global :** 1 240 apprenants inscrits actifs.\n- **Répartition Genre :** 54% Hommes / 46% Femmes.\n- **Filière la plus dense :** Licence 3 Management (420 inscrits).\n- **Qualité des dossiers :** 98% des fiches d'inscription sont visées et complètes (2 dossiers boursiers en attente).";
    }
    // 2. Logique : Gestion des Notes
    else if (
      searchStr.includes('matière') ||
      searchStr.includes('retard') ||
      searchStr.includes('bloquent') ||
      searchStr.includes('notes')
    ) {
      aiResponse =
        "⚠️ **Alerte Audit des Évaluations (Gestion des Notes) :**\nIl reste actuellement **1 procès-verbal de notes en attente de validation** pour clore le semestre en cours :\n\n- **Matière :** Deep Learning & Vision par ordinateur\n- **Classe :** Master 1 Informatique\n- **Enseignant :** Dr. Diop\n\n*Impact :* Les calculs de moyennes globales et les classements de cette promotion sont gelés tant que cette grille n'est pas validée.";
    }
    // 3. Logique : Gestion des Résultats & Délibérations
    else if (
      searchStr.includes('taux') ||
      searchStr.includes('réussite') ||
      searchStr.includes('prédictif')
    ) {
      aiResponse =
        "📊 **Estimation des Taux d'Admission Pré-Délibération :**\n\n1. **Master 1 Informatique :** 86.5% d'admis virtuels (Moyenne générale de classe : 13.42/20).\n2. **Master 2 Informatique :** 91.2% d'admis virtuels.\n3. **Licence 3 Management :** 74.0% d'admis initiaux.";
    } else if (
      searchStr.includes('rachat') ||
      searchStr.includes('secours') ||
      searchStr.includes('éligibles')
    ) {
      aiResponse =
        "⚖️ **Simulation de Délibération (Rachats et Secours) :**\n\nPour la promotion *Licence 3 Management*, **12 étudiants** se situent actuellement dans la zone de rachat réglementaire (note globale calculée entre 09.50 et 09.99/20).\n\nLe passage automatique de ces dossiers au statut 'Admis par secours' dépendra de la validation de leur assiduité et de l'absence de note éliminatoire (< 07/20).";
    }
    // 4. Logique : Proclamations
    else if (
      searchStr.includes('proclamation') ||
      searchStr.includes('publication') ||
      searchStr.includes('bulletin') ||
      searchStr.includes('pv')
    ) {
      aiResponse =
        "📢 **Statut des Proclamations & Publications :**\n\n- **Procès-Verbaux (PV) Globaux :** 88% des PV de délibération sont verrouillés et prêts pour signature électronique du jury.\n- **Bulletins de Notes :** Le moteur de génération est synchronisé. Dès la clôture de la délibération, les bulletins seront instantanément disponibles sur l'espace étudiant en mode consultation.";
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

// Configure "marked" pour transformer les sauts de ligne basiques (\n) en <br>
marked.setOptions({
  breaks: true,
  gfm: true,
});

const renderMarkdown = (text) => {
  if (!text) return '';
  return marked.parse(text);
};

const formatMessage = (text) => {
  if (!text) return '';

  // 1. Échapper le HTML pour éviter les failles XSS (sécurité)
  let escapedText = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  // 2. Convertir les **texte** en <strong>texte</strong>
  escapedText = escapedText.replace(/\*\*(.*?)\*\*/g, '<strong class="fw-bold">$1</strong>');

  // 3. Convertir les *texte* (italique) en <em>texte</em>
  escapedText = escapedText.replace(/\*(.*?)\*/g, '<em class="text-muted">$1</em>');

  // 4. Donner un style un peu plus sympa aux tirets de listes
  escapedText = escapedText.replace(/^- (.*)$/gm, '<div class="ps-3 mb-1">• $1</div>');

  return escapedText;
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

/* Ajoute ça dans ton bloc style existant */
:deep(.markdown-body p) {
  margin-bottom: 0.5rem;
}
:deep(.markdown-body ul) {
  padding-left: 1.25rem;
  margin-bottom: 0.5rem;
}
</style>
