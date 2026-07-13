<script setup>
import { computed } from 'vue';
import { formatDate } from '@/shared/utils/date';
import { statutInfo } from '../constants';

/**
 * Détail d'une inscription, en lecture seule.
 *
 * L'ancien `InscriptionForm.vue` posait bien `selectedInscription` et `showModal`
 * au clic sur « Détails », mais **ne montait aucune modale** : le bouton ne
 * produisait rien de visible. (Un `InscriptionDetails.vue` existait par ailleurs
 * dans `components/modal/`, sans qu'aucun fichier ne l'importe.)
 *
 * Ouvert dès que `inscription` n'est pas `null`, à la façon de `ConfirmModal`.
 */

const props = defineProps({
  /** L'inscription à afficher, `null` quand la modale est fermée. */
  inscription: { type: Object, default: null },
});

const emit = defineEmits(['update:inscription']);

const close = () => emit('update:inscription', null);

const statut = computed(() => statutInfo(props.inscription?.inscription_statut));

const lignes = computed(() => {
  const value = props.inscription;
  if (!value) return [];

  return [
    { label: 'Matricule', value: value.etudiant_matricule },
    { label: 'Nom', value: value.etudiant_nom },
    { label: 'Prénom', value: value.etudiant_prenom },
    { label: 'E-mail', value: value.etudiant_email },
    { label: 'Classe', value: value.classe_code },
    { label: 'Filière', value: value.filiere_nom },
    { label: 'Année académique', value: value.annee_code },
    { label: 'Type d’inscription', value: value.type_inscription },
    { label: 'Date d’inscription', value: formatDate(value.date_inscription) },
    { label: 'Gestionnaire', value: value.gestionnaire_username },
    { label: 'Commentaire', value: value.commentaire },
  ].filter((ligne) => Boolean(ligne.value));
});
</script>

<template>
  <Teleport to="body">
    <div
      v-if="inscription"
      class="modal fade show d-block"
      tabindex="-1"
      role="dialog"
      style="background-color: rgba(0, 0, 0, 0.5)"
    >
      <div class="modal-dialog modal-dialog-centered modal-lg">
        <div class="modal-content shadow-lg">
          <div class="modal-header bg-primary text-white">
            <h5 class="modal-title">
              Inscription — {{ inscription.etudiant_nom }} {{ inscription.etudiant_prenom }}
            </h5>
            <button
              type="button"
              class="btn-close btn-close-white"
              aria-label="Fermer"
              @click="close"
            ></button>
          </div>

          <div class="modal-body">
            <div class="mb-3">
              <span
                class="badge rounded-pill px-3 py-2"
                :class="`bg-${statut.variant}-subtle text-${statut.variant}`"
              >
                {{ statut.label }}
              </span>
            </div>

            <dl class="row mb-0">
              <template v-for="ligne in lignes" :key="ligne.label">
                <dt class="col-sm-4 text-muted small fw-semibold text-uppercase py-2">
                  {{ ligne.label }}
                </dt>
                <dd class="col-sm-8 fw-medium text-dark py-2 mb-0">{{ ligne.value }}</dd>
              </template>
            </dl>
          </div>

          <div class="modal-footer">
            <button class="btn btn-secondary" @click="close">Fermer</button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>
