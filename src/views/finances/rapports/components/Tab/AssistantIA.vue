<template>
  <div class="assistant-ia-container">
    <!-- Header de la section -->
    <div class="col-12 mb-4">
      <h3 class="fw-bold mb-1">Copilote Financier IA</h3>
      <p class="text-muted small mb-0">
        <i class="bi bi-cpu-fill text-primary me-1"></i>
        Interrogez votre assistant pour extraire des analyses de trésorerie, prédire les risques de défaut ou rédiger des relances automatiques.
      </p>
    </div>

    <div class="row g-3">
      <!-- Zone des Raccourcis Prompt Flash (Analyse Rapide) -->
      <div class="col-md-4">
        <div class="card border-0 shadow-sm rounded-4 bg-white p-3 h-100">
          <h6 class="fw-bold text-dark mb-3 small text-uppercase text-secondary tracking-wider">
            <i class="bi bi-lightning-charge-fill text-warning me-2"></i>Requêtes Fréquentes
          </h6>
          
          <div class="d-grid gap-2">
            <button @click="askShortcut('Quelles sont les prévisions de trésorerie pour le mois prochain ?')" class="btn btn-light btn-sm text-start p-2 rounded text-secondary border-0 btn-prompt">
              <i class="bi bi-graph-up me-2 text-primary"></i> Prévisions de trésorerie
            </button>
            <button @click="askShortcut('Liste-moi les 3 classes avec le plus fort taux d\'impayés.')" class="btn btn-light btn-sm text-start p-2 rounded text-secondary border-0 btn-prompt">
              <i class="bi bi-exclamation-octagon me-2 text-danger"></i> Top des classes débitrices
            </button>
            <button @click="askShortcut('Rédige un modèle de relance par SMS pour retard de scolarité.')" class="btn btn-light btn-sm text-start p-2 rounded text-secondary border-0 btn-prompt">
              <i class="bi bi-chat-left-dots me-2 text-success"></i> Rédiger un SMS de relance
            </button>
            <button @click="askShortcut('Analyse l\'impact financier si on augmente le taux des vacations de 5%')" class="btn btn-light btn-sm text-start p-2 rounded text-secondary border-0 btn-prompt">
              <i class="bi bi-calculator me-2 text-info"></i> Simulation d'impact charges
            </button>
          </div>

          <div class="mt-4 p-3 bg-soft-primary rounded text-xs text-muted">
            <span class="fw-bold text-primary d-block mb-1"><i class="bi bi-shield-check me-1"></i>IA Contextuelle</span>
            Cet assistant est branché sur vos registres de paiement, de facturation et d'honoraires de l'année 2026.
          </div>
        </div>
      </div>

      <!-- Interface de Discussion / Flux de Conversation -->
      <div class="col-md-8">
        <div class="card border-0 shadow-sm rounded-4 bg-white d-flex flex-column" style="height: 480px;">
          <!-- Zone d'affichage des messages -->
          <div class="card-body overflow-auto p-4 flex-grow-1" ref="chatWindow">
            <div v-for="(msg, index) in messages" :key="index" class="d-flex mb-3" :class="msg.role === 'user' ? 'justify-content-end' : 'justify-content-start'">
              
              <!-- Avatar IA -->
              <div v-if="msg.role === 'assistant'" class="bg-soft-primary rounded-circle p-2 me-2 d-flex align-items-center justify-content-center align-self-start" style="width: 32px; height: 32px;">
                <i class="bi bi-robot text-primary small"></i>
              </div>

              <!-- Bulle de texte -->
              <div class="p-3 rounded-4 max-w-75 text-sm" :class="msg.role === 'user' ? 'bg-primary text-white' : 'bg-light text-dark'">
                <div class="fw-semibold text-xs mb-1 opacity-75" :class="msg.role === 'user' ? 'text-white' : 'text-secondary'">
                  {{ msg.role === 'user' ? 'Vous' : 'Copilote IA' }}
                </div>
                <p class="mb-0 whitespace-pre-wrap">{{ msg.content }}</p>
              </div>
            </div>

            <!-- Indicateur de chargement -->
            <div v-if="isTyping" class="d-flex mb-3 justify-content-start">
              <div class="bg-soft-primary rounded-circle p-2 me-2 d-flex align-items-center justify-content-center" style="width: 32px; height: 32px;">
                <i class="bi bi-cpu text-primary small animate-pulse"></i>
              </div>
              <div class="p-3 rounded-4 bg-light text-muted text-sm italic">
                Analyse des registres financiers en cours...
              </div>
            </div>
          </div>

          <!-- Barre de saisie -->
          <div class="card-footer bg-white border-0 p-3">
            <form @submit.prevent="sendMessage" class="input-group input-group-sm border rounded shadow-sm overflow-hidden bg-white">
              <input v-model="userInput" type="text" :disabled="isTyping" class="form-control border-0 py-2 px-3 text-dark shadow-none" placeholder="Posez une question financière sur votre établissement..." />
              <button type="submit" :disabled="isTyping || !userInput.trim()" class="btn btn-primary border-0 px-3">
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
    content: 'Bonjour ! Je suis votre copilote financier. Je peux analyser vos encaissements, auditer les restes à recouvrer ou calculer la rentabilité de vos filières. Que souhaitez-vous vérifier aujourd\'hui ?'
  }
]);

const scrollToBottom = async () => {
  await nextTick();
  if (chatWindow.value) {
    chatWindow.value.scrollTop = chatWindow.value.scrollHeight;
  }
};

const sendMessage = () => {
  if (!userInput.value.trim() || isTyping.value) return;

  const userQuery = userInput.value;
  messages.value.push({ role: 'user', content: userQuery });
  userInput.value = '';
  scrollToBottom();

  // Simulation de la réponse de l'IA orientée vers la finance de l'ERP
  isTyping.value = true;
  setTimeout(() => {
    let aiResponse = "Je n'ai pas pu compiler les données pour cette requête spécifique. Pouvez-vous reformuler ?";

    if (userQuery.toLowerCase().includes('prévision') || userQuery.toLowerCase().includes('trésorerie')) {
      aiResponse = "Sur la base des échéances de facturation programmées et du taux moyen de recouvrement actuel (82.1%), les prévisions d'encaissement pour le mois prochain s'élèvent à 8 450 000 FCFA. Les charges estimées pour les honoraires formateurs restent stables à 2 800 000 FCFA, dégageant un solde net positif prévisionnel de +5 650 000 FCFA.";
    } else if (userQuery.toLowerCase().includes('classe') || userQuery.toLowerCase().includes('taux')) {
      aiResponse = "Après analyse du grand livre, voici le top 3 des promotions affichant les retards de paiement les plus critiques :\n\n1. Sciences Juridiques & Droit (L2-A) - 55% d'impayés\n2. Génie Civil & Architecture (L3-B) - 32% d'impayés\n3. Informatique (M1-JV) - 18% d'impayés\n\nJe vous conseille de lancer une campagne de relance ciblée sur la filière Droit.";
    } else if (userQuery.toLowerCase().includes('sms') || userQuery.toLowerCase().includes('relance')) {
      aiResponse = "Voici une proposition de modèle de relance SMS court et conforme :\n\n\"Rappel Scolarité : Bonjour [Prénom], le solde de vos frais d'études pour le terme actuel présente un reliquat. Nous vous prions de régulariser votre situation auprès de la caisse ou via Mobile Money avant le 25 du mois. Cordialement, le Service Comptabilité.\"";
    } else if (userQuery.toLowerCase().includes('impact') || userQuery.toLowerCase().includes('vacation')) {
      aiResponse = "Le volume d'heures actuel sur le trimestre est de 95 heures pour une charge brute de 11 450 000 FCFA. Une hausse de 5% du taux horaire général représenterait un surcoût immédiat de +572 500 FCFA sur la masse salariale des vacataires, faisant passer le ratio charges/produits de 31.6% à 33.2%.";
    }

    messages.value.push({ role: 'assistant', content: aiResponse });
    isTyping.value = false;
    scrollToBottom();
  }, 1200);
};

// Déclencheur depuis les boutons de raccourcis rapides
const askShortcut = (text) => {
  userInput.value = text;
  sendMessage();
};
</script>

<style scoped>
.bg-soft-primary { background-color: rgba(0, 123, 255, 0.08); }
.text-xs { font-size: 11px !important; }
.text-sm { font-size: 0.9rem; }
.max-w-75 { max-width: 75%; }
.whitespace-pre-wrap { white-space: pre-wrap; }

/* Effet hover discret sur les invites rapides */
.btn-prompt {
  transition: all 0.2s ease-in-out;
}
.btn-prompt:hover {
  background-color: #f0f2f5 !important;
  color: #212529 !important;
  transform: translateX(4px);
}

/* Animation pouls pour le chargement */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: .4; }
}
.animate-pulse {
  animation: pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

/* Ligne graphique stricte de l'ERP */
.rounded-4 {
  border-radius: 0.2rem !important;
}
</style>
