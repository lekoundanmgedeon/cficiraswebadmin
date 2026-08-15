<script setup>
import { nextTick, ref, watch } from 'vue';
import { formatDateTime } from '@/shared/utils/date';
import AssistantRequetes from './AssistantRequetes.vue';
import { rendreMarkdown } from '../utils/markdown';

/**
 * Le fil de la conversation.
 *
 * ## Les réponses sont du markdown, et sont rendues comme tel
 *
 * Elles ne l'étaient pas : le fil les affichait en `white-space: pre-wrap`, par
 * crainte — justifiée — d'une injection HTML. Mais le prompt serveur impose
 * désormais un **tableau markdown dès trois lignes de résultats**, et un
 * tableau non interprété est une bouillie de barres verticales.
 *
 * L'interprétation passe donc par `utils/markdown.js`, qui échappe tout HTML
 * brut, borne les liens à `http`/`https`/`mailto` et refuse les images. C'est
 * ce qui rend le `v-html` ci-dessous acceptable — et il n'est acceptable que
 * pour ce rendu-là.
 *
 * La question de l'utilisateur, elle, reste du texte : elle vient d'un champ de
 * saisie, personne n'y écrit du markdown, et l'interpréter ne ferait que
 * déformer ce qu'il a tapé.
 *
 * ## Les messages rejoués portent leur date
 *
 * L'espace de chat recharge des conversations passées (`message.archive`). Une
 * réponse d'assistant est un **instantané** : l'effectif, le montant encaissé
 * ou le taux de recouvrement qu'elle cite ont pu changer depuis. Affichée nue,
 * elle se lirait comme un chiffre encore valable.
 *
 * D'où l'horodatage sous chaque bulle rejouée. C'est ce qui a permis de revenir
 * sur le choix d'origine — « on ne rouvre pas une conversation » — sans en
 * perdre la prudence.
 */
const props = defineProps({
  /** @type {import('vue').PropType<Array<object>>} */
  messages: { type: Array, required: true },
  enCours: { type: Boolean, default: false },

  /** Hauteur du fil : un onglet dispose de moins de place qu'un écran entier. */
  hauteur: { type: String, default: '55vh' },
});

const conteneur = ref(null);

// Une réponse qui s'ajoute hors du champ de vision passerait inaperçue.
watch(
  () => [props.messages.length, props.enCours],
  async () => {
    await nextTick();
    if (conteneur.value) conteneur.value.scrollTop = conteneur.value.scrollHeight;
  }
);
</script>

<template>
  <div ref="conteneur" class="assistant-fil" :style="{ height: hauteur }">
    <div
      v-for="(message, i) in messages"
      :key="i"
      class="d-flex mb-3"
      :class="message.role === 'user' ? 'justify-content-end' : 'justify-content-start'"
    >
      <div class="assistant-bulle" :class="`assistant-bulle--${message.role}`">
        <p v-if="message.role === 'user'" class="assistant-texte mb-0">{{ message.texte }}</p>

        <!-- eslint-disable-next-line vue/no-v-html -- HTML produit par
             `rendreMarkdown`, qui échappe tout balisage venu du modèle. -->
        <div v-else class="assistant-markdown" v-html="rendreMarkdown(message.texte)"></div>

        <AssistantRequetes v-if="message.role === 'assistant'" :requetes="message.requetes || []" />

        <p
          v-if="message.role === 'assistant' && (message.dureeMs || message.archive)"
          class="mb-0 mt-1 small assistant-meta"
          :class="message.archive ? 'text-body-secondary' : 'text-muted'"
        >
          <template v-if="message.archive">
            <i class="bi bi-clock-history me-1"></i>Chiffres arrêtés au
            {{ formatDateTime(message.horodatage) }}
          </template>
          <template v-if="message.dureeMs">
            <span v-if="message.archive" class="mx-1">·</span>
            {{ (message.dureeMs / 1000).toFixed(1) }} s
          </template>
        </p>
      </div>
    </div>

    <!-- L'attente est longue (plusieurs secondes) : sans ce repère, l'écran
         paraît figé et l'utilisateur repose sa question. -->
    <div v-if="enCours" class="d-flex justify-content-start mb-3">
      <div class="assistant-bulle assistant-bulle--assistant text-muted">
        <span class="spinner-border spinner-border-sm me-2" role="status"></span>
        L'assistant interroge les données…
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Marges resserrées : quatre conteneurs emboîtés séparent déjà le tableau du
   bord de l'écran, et chacun prélève sa part de la largeur utile. */
.assistant-fil {
  overflow-y: auto;
  padding: 0.25rem;
}

.assistant-bulle {
  padding: 0.65rem 0.85rem;
  border-radius: 12px;
  /* Un enfant de conteneur flex refuse de rétrécir sous la largeur de son
     contenu : sans cela, un tableau large pousse la bulle hors du cadre au lieu
     de défiler dedans. */
  min-width: 0;
}

/* La question reste une bulle de conversation : la brider entretient
   l'alternance visuelle qui distingue les deux interlocuteurs. */
.assistant-bulle--user {
  max-width: 78%;
  background: var(--bs-primary, #6571ff);
  color: #fff;
}

/* La réponse, elle, porte des tableaux de quatre colonnes et quinze lignes.
   Bridée à 78 %, elle les comprimait — les en-têtes passaient à la ligne, les
   colonnes de nombres devenaient illisibles. Elle prend donc toute la largeur
   disponible ; une réponse d'une phrase reste courte, la bulle épousant son
   contenu. */
.assistant-bulle--assistant {
  max-width: 100%;
  background: rgba(0, 0, 0, 0.05);
}

/* L'horodatage est un repère, pas une information à lire d'abord : il doit se
   voir sans concurrencer la réponse qu'il date. */
.assistant-meta {
  font-size: 0.72rem;
}

/* La question tapée par l'utilisateur porte ses propres retours à la ligne. */
.assistant-texte {
  white-space: pre-wrap;
  word-break: break-word;
}

/* Le markdown rendu est du HTML généré ici : `:deep` est la seule façon de
   l'atteindre depuis un style scopé. */
.assistant-markdown {
  word-break: break-word;
}

.assistant-markdown :deep(p:last-child),
.assistant-markdown :deep(ul:last-child),
.assistant-markdown :deep(ol:last-child) {
  margin-bottom: 0;
}

.assistant-markdown :deep(ul),
.assistant-markdown :deep(ol) {
  padding-left: 1.2rem;
  margin-bottom: 0.5rem;
}

/* Un tableau de réponse compte souvent quinze lignes : il doit rester dense,
   et défiler dans sa bulle plutôt qu'élargir la page. */
.assistant-markdown :deep(.table-responsive) {
  margin: 0.5rem 0;
}

/**
 * Le tableau prend sa largeur naturelle, et déborde plutôt que de se comprimer.
 *
 * Bootstrap pose `width: 100%` sur `.table` : le navigateur répartit alors
 * l'espace disponible entre les colonnes, quitte à replier « Qualité Hygiène
 * Sécurité Environnement » sur trois lignes et à coller les nombres. C'est ce
 * qui rendait les tableaux serrés — la largeur du cadre décidait de tout.
 *
 * `max-content` inverse le rapport : c'est le contenu qui fixe la largeur, et
 * le cadre défile s'il ne suit pas (`.table-responsive`). `min-width: 100%`
 * garde le tableau étalé quand il tient à l'aise.
 */
.assistant-markdown :deep(table) {
  width: max-content;
  min-width: 100%;
  font-size: 0.82rem;
  background: #fff;
}

/* Les colonnes de nombres — celles que le modèle aligne à droite — ne doivent
   jamais se replier : « 86 558 611,20 » coupé en deux ne se lit plus. Le
   tableau défile alors dans son cadre plutôt que d'écraser ses colonnes. */
.assistant-markdown :deep(td[align='right']),
.assistant-markdown :deep(th[align='right']) {
  white-space: nowrap;
}

.assistant-markdown :deep(thead th) {
  white-space: nowrap;
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  color: #6c757d;
}

.assistant-markdown :deep(code) {
  font-size: 0.82rem;
  background: rgba(0, 0, 0, 0.06);
  padding: 0.05rem 0.3rem;
  border-radius: 3px;
}

.assistant-markdown :deep(pre) {
  background: rgba(0, 0, 0, 0.06);
  border-radius: 4px;
  padding: 0.5rem 0.75rem;
  overflow-x: auto;
  font-size: 0.78rem;
}
</style>
