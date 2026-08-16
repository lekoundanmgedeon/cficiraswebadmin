<script setup>
import { nextTick, ref } from 'vue';
import { CADRAGES, CADRAGES_CONNUS, cadrageInfo } from '../../constants';
import { exporterCsv, exporterMarkdown } from '../../utils/export';
import { useEspaceChatStore } from '../store';

/**
 * La barre du fil affiché : son titre, son domaine, et ce qu'on peut en faire.
 *
 * ## Renommer, ranger — mais pas supprimer
 *
 * `assistant_echanges` est le journal d'audit du module et son seul jeu
 * d'évaluation du prompt. L'archivage masque un fil de la liste ; rien ici
 * n'efface une ligne, et c'est délibéré : un bouton qui promettrait le
 * contraire mentirait sur ce qui reste en base.
 *
 * ## Le sélecteur de domaine ne donne aucun droit
 *
 * Choisir « Finances » oriente la lecture du modèle — une question elliptique y
 * sera comprise dans ce cadre. Le cloisonnement, lui, reste le catalogue filtré
 * par rôle côté serveur : un utilisateur sans accès aux finances qui choisit ce
 * domaine n'y gagne rien du tout.
 */

const store = useEspaceChatStore();

const enRenommage = ref(false);
const brouillonTitre = ref('');
const champTitre = ref(null);

async function ouvrirRenommage() {
  brouillonTitre.value = store.titre;
  enRenommage.value = true;
  await nextTick();
  champTitre.value?.focus();
}

async function validerRenommage() {
  const titre = brouillonTitre.value.trim();
  enRenommage.value = false;
  if (!titre || titre === store.titre) return;

  await store.renommer(store.conversationId, titre);
}

/** Rend au fil son titre par défaut : sa première question. */
async function reinitialiserTitre() {
  enRenommage.value = false;
  await store.renommer(store.conversationId, null);
}

function choisirCadrage(cle) {
  store.cadrage = store.cadrage === cle ? null : cle;
}
</script>

<template>
  <div class="barre-fil d-flex align-items-center gap-2 px-3 py-2 border-bottom">
    <div class="flex-grow-1 min-w-0">
      <div v-if="enRenommage" class="d-flex gap-1 align-items-center">
        <input
          ref="champTitre"
          v-model="brouillonTitre"
          type="text"
          class="form-control form-control-sm"
          maxlength="200"
          @keydown.enter.prevent="validerRenommage"
          @keydown.esc="enRenommage = false"
        />
        <button type="button" class="btn btn-sm btn-primary" @click="validerRenommage">
          <i class="bi bi-check-lg"></i>
        </button>
        <button
          type="button"
          class="btn btn-sm btn-outline-secondary"
          title="Rendre au fil sa première question pour titre"
          @click="reinitialiserTitre"
        >
          <i class="bi bi-arrow-counterclockwise"></i>
        </button>
      </div>

      <div v-else class="d-flex align-items-center gap-2 min-w-0">
        <h6 class="mb-0 text-truncate" :title="store.titre">
          {{ store.titre || 'Nouvelle conversation' }}
        </h6>

        <span v-if="store.archivee" class="badge bg-light text-secondary border flex-shrink-0">
          Archivée
        </span>
      </div>
    </div>

    <!-- Le domaine ne se choisit que sur un fil neuf : le changer en cours de
         conversation ferait comprendre les questions suivantes dans un cadre
         que les précédentes n'avaient pas, sans que rien ne l'indique dans le
         fil. -->
    <div v-if="!store.conversationId" class="dropdown flex-shrink-0">
      <button
        type="button"
        class="btn btn-sm btn-outline-secondary dropdown-toggle"
        data-bs-toggle="dropdown"
      >
        <i class="bi me-1" :class="cadrageInfo(store.cadrage).icone"></i>
        {{ cadrageInfo(store.cadrage).libelle }}
      </button>

      <ul class="dropdown-menu dropdown-menu-end">
        <li>
          <button type="button" class="dropdown-item small" @click="store.cadrage = null">
            <i class="bi bi-chat-dots me-2"></i>Général — tous domaines
          </button>
        </li>
        <li><hr class="dropdown-divider" /></li>
        <li v-for="cle in CADRAGES_CONNUS" :key="cle">
          <button
            type="button"
            class="dropdown-item small"
            :class="{ active: store.cadrage === cle }"
            @click="choisirCadrage(cle)"
          >
            <i class="bi me-2" :class="CADRAGES[cle].icone"></i>{{ CADRAGES[cle].libelle }}
          </button>
        </li>
      </ul>
    </div>

    <template v-if="store.conversationId">
      <button
        type="button"
        class="btn btn-sm btn-outline-secondary flex-shrink-0"
        title="Renommer la conversation"
        @click="ouvrirRenommage"
      >
        <i class="bi bi-pencil"></i>
      </button>

      <div class="dropdown flex-shrink-0">
        <button
          type="button"
          class="btn btn-sm btn-outline-secondary"
          data-bs-toggle="dropdown"
          title="Sauvegarder la conversation"
        >
          <i class="bi bi-download"></i>
        </button>

        <ul class="dropdown-menu dropdown-menu-end">
          <li>
            <button
              type="button"
              class="dropdown-item small"
              @click="exporterMarkdown(store.filExportable)"
            >
              <i class="bi bi-filetype-md me-2"></i>Markdown — la conversation
            </button>
          </li>
          <li>
            <button
              type="button"
              class="dropdown-item small"
              @click="exporterCsv(store.filExportable)"
            >
              <i class="bi bi-filetype-csv me-2"></i>CSV — le relevé des échanges
            </button>
          </li>
        </ul>
      </div>

      <button
        type="button"
        class="btn btn-sm btn-outline-secondary flex-shrink-0"
        :title="store.archivee ? 'Restaurer la conversation' : 'Archiver la conversation'"
        @click="store.archiver(store.conversationId, !store.archivee)"
      >
        <i class="bi" :class="store.archivee ? 'bi-box-arrow-up' : 'bi-archive'"></i>
      </button>
    </template>
  </div>
</template>

<style scoped>
.barre-fil {
  background: #fff;
  min-height: 48px;
}

/* Sans cela, un titre long pousse les boutons hors du cadre au lieu d'être
   tronqué : un enfant de conteneur flex refuse de rétrécir sous son contenu. */
.min-w-0 {
  min-width: 0;
}
</style>
