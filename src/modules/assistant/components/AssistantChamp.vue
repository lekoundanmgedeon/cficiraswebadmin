<script setup>
import { ref } from 'vue';

/**
 * La saisie d'une question.
 *
 * `Entrée` envoie, `Maj+Entrée` va à la ligne : c'est la convention de tous les
 * outils de conversation, et l'inverse surprendrait.
 *
 * ## Deux tailles, un seul composant
 *
 * L'écran de plateforme ouvre sur une barre d'appel : le champ y est l'élément
 * principal de la page, pas un pied de conversation. Il change de taille, pas
 * de comportement — dupliquer le composant aurait fait diverger deux fois la
 * même règle de clavier.
 */
const props = defineProps({
  enCours: { type: Boolean, default: false },
  desactive: { type: Boolean, default: false },

  /**
   * `normal` : pied de conversation. `accueil` : la barre d'appel de l'écran
   * de plateforme — champ agrandi, bouton d'envoi rond.
   */
  variante: {
    type: String,
    default: 'normal',
    validator: (valeur) => ['normal', 'accueil'].includes(valeur),
  },

  /**
   * Les amorces proposées au-dessus du champ — un champ vide n'indique pas ce
   * que l'assistant sait faire. Les onglets les affichent dans leur propre
   * colonne, cadrées sur leur domaine : ils passent un tableau vide pour ne pas
   * les voir deux fois.
   *
   * La liste par défaut est écrite ici même : `defineProps` est hissé à la
   * compilation et ne peut référencer aucune variable du module.
   *
   * @type {import('vue').PropType<string[]>}
   */
  suggestions: {
    type: Array,
    default: () => [
      'Combien d’étudiants dans chaque classe ?',
      'Quel est le taux de réussite par filière ce semestre ?',
      'Quels étudiants ont des échéances en retard ?',
    ],
  },

  placeholder: { type: String, default: 'Posez votre question en français…' },
});

const emit = defineEmits(['demander']);

const texte = ref('');

function envoyer() {
  const question = texte.value.trim();
  if (!question || props.enCours || props.desactive) return;
  emit('demander', question);
  texte.value = '';
}

function proposer(suggestion) {
  texte.value = suggestion;
}
</script>

<template>
  <div>
    <div v-if="suggestions.length && !texte && !enCours" class="mb-2 d-flex flex-wrap gap-2">
      <button
        v-for="suggestion in suggestions"
        :key="suggestion"
        type="button"
        class="btn btn-sm btn-outline-secondary"
        :disabled="desactive"
        @click="proposer(suggestion)"
      >
        {{ suggestion }}
      </button>
    </div>

    <div class="d-flex gap-2 align-items-end">
      <textarea
        v-model="texte"
        class="form-control"
        :class="{ 'champ-accueil': variante === 'accueil' }"
        rows="2"
        :disabled="enCours || desactive"
        :placeholder="desactive ? 'Assistant indisponible' : placeholder"
        @keydown.enter.exact.prevent="envoyer"
      ></textarea>

      <button
        type="button"
        class="btn btn-primary"
        :class="{ 'champ-envoi-accueil': variante === 'accueil' }"
        :disabled="!texte.trim() || enCours || desactive"
        @click="envoyer"
      >
        <span v-if="enCours" class="spinner-border spinner-border-sm" role="status"></span>
        <i v-else class="bi bi-send"></i>
      </button>
    </div>

    <p class="mt-1 mb-0 small text-muted" :class="{ 'text-center': variante === 'accueil' }">
      Entrée pour envoyer, Maj+Entrée pour aller à la ligne. Les réponses s'appuient sur les données
      auxquelles votre rôle donne accès.
    </p>
  </div>
</template>

<style scoped>
/* La barre d'appel est l'élément principal de l'écran de plateforme : elle doit
   se voir depuis l'autre bout de la page, sans devenir une zone de rédaction —
   on y pose une question, on n'y écrit pas un rapport. */
.champ-accueil {
  font-size: 1.02rem;
  padding: 0.7rem 1rem;
  border-radius: 12px;
}

/* Un carré de la hauteur du champ déséquilibrerait la barre ; le rond ramène
   l'œil sur l'action. */
.champ-envoi-accueil {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  flex-shrink: 0;
}
</style>
