<script setup>
import { computed, ref, watch } from 'vue';
import { formatRelatif } from '@/shared/utils/date';
import { tronquer } from '@/shared/utils/text';
import { CADRAGES, CADRAGES_CONNUS, cadrageInfo } from '../../constants';
import { useEspaceChatStore } from '../store';

/**
 * La liste des conversations, en barre latérale.
 *
 * C'est la raison d'être de l'espace : tout ce qui a été demandé à l'assistant
 * depuis n'importe quel écran de la plateforme se retrouve ici, y compris les
 * questions posées dans les onglets métier.
 *
 * ## Les filtres sont appliqués côté serveur
 *
 * Recherche, domaine et archivage repartent au backend plutôt que de trier un
 * tableau local. Le journal grossit d'une ligne par question posée dans
 * l'établissement : charger tout pour filtrer ensuite ne tiendrait pas six
 * mois. C'est aussi pourquoi la recherche est **débattue** — une requête par
 * frappe saturerait l'API.
 */

const store = useEspaceChatStore();

const emit = defineEmits(['ouvrir', 'nouvelle']);

const props = defineProps({
  /** L'identifiant du fil affiché, pour le mettre en évidence. */
  actif: { type: String, default: null },
});

const saisie = ref(store.recherche);

/** @type {ReturnType<typeof setTimeout>|undefined} */
let minuterie;

// 350 ms : assez pour laisser finir un mot, assez court pour que la liste ne
// paraisse pas figée.
watch(saisie, (valeur) => {
  clearTimeout(minuterie);
  minuterie = setTimeout(() => {
    store.recherche = valeur;
    store.fetchConversations();
  }, 350);
});

function filtrerCadrage(cle) {
  // Recliquer sur le domaine actif le retire : sans cela, on ne pourrait plus
  // revenir à « tous » qu'en rechargeant la page.
  store.filtreCadrage = store.filtreCadrage === cle ? null : cle;
  store.fetchConversations();
}

function basculerArchivees() {
  store.archivees = !store.archivees;
  store.fetchConversations();
}

/** Les domaines réellement représentés, pour ne pas proposer un filtre vide. */
const domainesPresents = computed(() => {
  const vus = new Set(store.conversations.flatMap((c) => c.cadrages ?? []));
  // Le filtre actif reste proposé même s'il ne rend rien : sans lui, on ne
  // pourrait plus le désactiver depuis l'interface.
  if (store.filtreCadrage) vus.add(store.filtreCadrage);
  return CADRAGES_CONNUS.filter((cle) => vus.has(cle));
});
</script>

<template>
  <div class="liste-conversations d-flex flex-column h-100">
    <div class="p-3 border-bottom border-secondary-subtle">
      <button type="button" class="btn btn-primary btn-sm w-100 mb-3" @click="emit('nouvelle')">
        <i class="bi bi-plus-lg me-1"></i> Nouvelle conversation
      </button>

      <div class="position-relative">
        <i class="bi bi-search position-absolute liste-loupe"></i>
        <input
          v-model="saisie"
          type="search"
          class="form-control form-control-sm ps-4"
          placeholder="Rechercher une question…"
        />
      </div>

      <div v-if="domainesPresents.length" class="d-flex flex-wrap gap-1 mt-2">
        <button
          v-for="cle in domainesPresents"
          :key="cle"
          type="button"
          class="btn btn-sm py-0 px-2 liste-filtre"
          :class="
            store.filtreCadrage === cle
              ? `btn-${CADRAGES[cle].couleur}`
              : 'btn-outline-secondary border-0'
          "
          @click="filtrerCadrage(cle)"
        >
          <i class="bi me-1" :class="CADRAGES[cle].icone"></i>{{ CADRAGES[cle].libelle }}
        </button>
      </div>
    </div>

    <div class="flex-grow-1 overflow-auto px-2 py-2">
      <div v-if="store.chargementListe" class="text-center py-4">
        <span class="spinner-border spinner-border-sm text-secondary" role="status"></span>
      </div>

      <p v-else-if="!store.conversations.length" class="small text-body-secondary px-2 py-3 mb-0">
        <template v-if="store.recherche || store.filtreCadrage">
          Aucune conversation ne correspond à ce filtre.
        </template>
        <template v-else-if="store.archivees"> Aucune conversation archivée. </template>
        <template v-else>
          Aucune conversation. Posez votre première question — celles posées depuis les écrans de la
          plateforme apparaîtront ici aussi.
        </template>
      </p>

      <button
        v-for="fil in store.conversations"
        :key="fil.conversation_id"
        type="button"
        class="liste-item w-100 text-start px-2 py-2 mb-1"
        :class="{ 'liste-item--actif': fil.conversation_id === props.actif }"
        @click="emit('ouvrir', fil.conversation_id)"
      >
        <div class="small fw-semibold text-truncate" :title="fil.titre">
          {{ tronquer(fil.titre, 60) }}
        </div>

        <div class="d-flex align-items-center gap-1 mt-1 liste-meta">
          <span
            v-for="cle in fil.cadrages"
            :key="cle"
            class="badge rounded-pill"
            :class="`bg-${cadrageInfo(cle).couleur}-subtle text-${cadrageInfo(cle).couleur}-emphasis`"
          >
            {{ cadrageInfo(cle).libelle }}
          </span>
          <span class="text-body-secondary ms-auto">{{
            formatRelatif(fil.derniere_activite)
          }}</span>
        </div>
      </button>
    </div>

    <div class="p-2 border-top border-secondary-subtle">
      <button
        type="button"
        class="btn btn-sm btn-link text-decoration-none w-100 text-start text-body-secondary"
        @click="basculerArchivees"
      >
        <i class="bi me-1" :class="store.archivees ? 'bi-arrow-left' : 'bi-archive'"></i>
        {{ store.archivees ? 'Revenir aux conversations' : 'Conversations archivées' }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.liste-loupe {
  left: 0.5rem;
  top: 50%;
  transform: translateY(-50%);
  font-size: 0.9rem;
  color: #adb5bd;
  pointer-events: none;
}

.liste-filtre {
  font-size: 0.7rem;
}

/* Un `button` plutôt qu'un `a` : cliquer n'ouvre pas une page, cela remplace
   le fil affiché — et un lien vide ferait un piège au clavier. */
.liste-item {
  background: transparent;
  border: 0;
  border-radius: 6px;
  cursor: pointer;
}

.liste-item:hover {
  background: rgba(0, 0, 0, 0.04);
}

.liste-item--actif {
  background: rgba(101, 113, 255, 0.12);
}

.liste-meta {
  font-size: 0.68rem;
}
</style>
