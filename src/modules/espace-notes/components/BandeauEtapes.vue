<script setup>
import { computed } from 'vue';
import { ETAPES } from '../constants';

/**
 * Frise des quatre étapes du traitement d'une grille.
 *
 * ⚠️ La base ne connaît que **trois** statuts (`SAISIE`, `VALIDEE`, `PUBLIEE`) :
 * la vérification n'en est pas un. Elle est marquée « faite » quand la grille
 * est conforme — un contrôle recalculé à chaque affichage, jamais stocké. Le
 * dire ici évite de laisser croire qu'un gestionnaire a « signé » quelque chose.
 */

const props = defineProps({
  /** Statut d'ensemble de la grille : `SAISIE`, `VALIDEE`, `PUBLIEE` ou `null`. */
  statut: { type: String, default: null },
  /** Résultat des contrôles de conformité. */
  conforme: { type: Boolean, default: false },
});

const RANG = { SAISIE: 1, VALIDEE: 3, PUBLIEE: 4 };

const rangCourant = computed(() => RANG[String(props.statut ?? '').toUpperCase()] ?? 0);

const etapes = computed(() =>
  ETAPES.map((etape, index) => {
    const rang = index + 1;
    // La vérification n'a pas de statut serveur : son état vient des contrôles.
    const faite =
      etape.statut === null ? props.conforme && rangCourant.value >= 1 : rangCourant.value >= rang;

    return {
      ...etape,
      rang,
      faite,
      courante: rang === rangCourant.value || (etape.statut === null && rangCourant.value === 1),
    };
  })
);
</script>

<template>
  <ol class="frise list-unstyled d-flex flex-wrap gap-2 mb-0">
    <li
      v-for="etape in etapes"
      :key="etape.id"
      class="etape flex-grow-1 border rounded p-2"
      :class="{ faite: etape.faite, courante: etape.courante }"
    >
      <div class="d-flex align-items-center gap-2">
        <span class="pastille" :class="{ faite: etape.faite }">
          <i v-if="etape.faite" class="bi bi-check-lg"></i>
          <template v-else>{{ etape.rang }}</template>
        </span>
        <div class="min-w-0">
          <span class="d-block fw-semibold small">{{ etape.label }}</span>
          <span class="d-block text-muted" style="font-size: 11px">{{ etape.description }}</span>
        </div>
      </div>
    </li>
  </ol>
</template>

<style scoped>
.etape {
  min-width: 180px;
  background: #fff;
}

.etape.courante {
  border-color: #0d6efd !important;
  box-shadow: 0 0 0 1px rgba(13, 110, 253, 0.25);
}

.pastille {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: #e9ecef;
  color: #6c757d;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  flex-shrink: 0;
}

.pastille.faite {
  background: #198754;
  color: #fff;
}
</style>
