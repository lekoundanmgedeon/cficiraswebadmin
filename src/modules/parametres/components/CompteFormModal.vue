<script setup>
import { computed, ref, watch } from 'vue';
import { LONGUEUR_MIN_MOT_DE_PASSE, ROLES, ROLES_CONNUS } from '../constants';
import { useParametresStore } from '../store';

/**
 * Création et modification d'un compte.
 *
 * ## Une seule fenêtre pour deux gestes, à une différence près
 *
 * Le mot de passe n'est demandé **qu'à la création**. Le modifier ensuite est un
 * geste distinct — la réinitialisation par un administrateur, qui n'exige pas
 * l'ancien puisqu'il ne le connaît pas. La mêler au formulaire d'identité
 * ferait réinitialiser un mot de passe à chaque correction de nom.
 *
 * ## `username` n'est pas modifiable après coup
 *
 * Il désigne le compte dans l'audit financier, dans le journal de l'assistant et
 * dans onze tables métier. Le changer romprait la lecture de ces traces, sans
 * que rien ne le signale.
 */

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  /** Le compte à modifier ; `null` ouvre le formulaire en création. */
  compte: { type: Object, default: null },
});

const emit = defineEmits(['update:modelValue']);

const store = useParametresStore();

const form = ref({ username: '', email: '', nom: '', prenom: '', role: '', password: '' });
const enCours = ref(false);

const modification = computed(() => Boolean(props.compte));

watch(
  () => [props.modelValue, props.compte],
  ([ouvert]) => {
    if (!ouvert) return;
    form.value = {
      username: props.compte?.username ?? '',
      email: props.compte?.email ?? '',
      nom: props.compte?.nom ?? '',
      prenom: props.compte?.prenom ?? '',
      role: props.compte?.role ?? '',
      password: '',
    };
  },
  { immediate: true }
);

const valide = computed(() => {
  const { username, email, nom, prenom, role, password } = form.value;
  if (!email || !nom || !prenom || !role) return false;
  if (modification.value) return true;
  return Boolean(username) && password.length >= LONGUEUR_MIN_MOT_DE_PASSE;
});

function fermer() {
  emit('update:modelValue', false);
}

async function soumettre() {
  if (!valide.value || enCours.value) return;
  enCours.value = true;

  try {
    const { nom, prenom, email, role } = form.value;

    const resultat = modification.value
      ? await store.modifierCompte(props.compte.id, { nom, prenom, email, role })
      : await store.creerCompte({ ...form.value });

    // `run()` rend `undefined` en cas d'échec : la fenêtre reste ouverte, avec
    // la saisie intacte, plutôt que de disparaître sur une erreur.
    if (resultat !== undefined) fermer();
  } finally {
    enCours.value = false;
  }
}
</script>

<template>
  <Teleport to="body">
    <div v-if="modelValue" class="modal-backdrop-perso" @click.self="fermer">
      <div class="modal-dialog modal-dialog-centered" role="dialog">
        <div class="modal-content border-0 shadow">
          <div class="modal-header py-2">
            <h6 class="modal-title fw-bold">
              <i class="bi me-2" :class="modification ? 'bi-pencil-square' : 'bi-person-plus'"></i>
              {{ modification ? 'Modifier le compte' : 'Nouveau compte' }}
            </h6>
            <button type="button" class="btn-close" @click="fermer"></button>
          </div>

          <form @submit.prevent="soumettre">
            <div class="modal-body">
              <div class="row g-2">
                <div class="col-md-6">
                  <label class="form-label small fw-bold" for="compte-prenom">Prénom</label>
                  <input
                    id="compte-prenom"
                    v-model="form.prenom"
                    type="text"
                    class="form-control form-control-sm"
                    required
                  />
                </div>
                <div class="col-md-6">
                  <label class="form-label small fw-bold" for="compte-nom">Nom</label>
                  <input
                    id="compte-nom"
                    v-model="form.nom"
                    type="text"
                    class="form-control form-control-sm"
                    required
                  />
                </div>

                <div class="col-md-6">
                  <label class="form-label small fw-bold" for="compte-username">
                    Identifiant
                  </label>
                  <input
                    id="compte-username"
                    v-model="form.username"
                    type="text"
                    class="form-control form-control-sm"
                    :disabled="modification"
                    required
                  />
                  <!-- Dire pourquoi le champ est figé vaut mieux qu'un champ
                       grisé sans explication. -->
                  <div v-if="modification" class="form-text small">
                    Figé : il vous désigne dans les écritures déjà signées.
                  </div>
                </div>

                <div class="col-md-6">
                  <label class="form-label small fw-bold" for="compte-email">
                    Adresse électronique
                  </label>
                  <input
                    id="compte-email"
                    v-model="form.email"
                    type="email"
                    class="form-control form-control-sm"
                    required
                  />
                </div>

                <div class="col-12">
                  <label class="form-label small fw-bold" for="compte-role">Rôle</label>
                  <select
                    id="compte-role"
                    v-model="form.role"
                    class="form-select form-select-sm"
                    required
                  >
                    <option value="" disabled>Choisir un rôle…</option>
                    <option v-for="code in ROLES_CONNUS" :key="code" :value="code">
                      {{ ROLES[code].libelle }}
                    </option>
                  </select>
                  <div v-if="form.role" class="form-text small">
                    {{ ROLES[form.role]?.mission }}
                  </div>
                </div>

                <div v-if="!modification" class="col-12">
                  <label class="form-label small fw-bold" for="compte-password">
                    Mot de passe initial
                  </label>
                  <input
                    id="compte-password"
                    v-model="form.password"
                    type="password"
                    class="form-control form-control-sm"
                    autocomplete="new-password"
                    :minlength="LONGUEUR_MIN_MOT_DE_PASSE"
                    required
                  />
                  <div class="form-text small">
                    {{ LONGUEUR_MIN_MOT_DE_PASSE }} caractères au minimum. Transmettez-le à son
                    titulaire, qui pourra le changer depuis « Mon compte ».
                  </div>
                </div>
              </div>
            </div>

            <div class="modal-footer py-2">
              <button type="button" class="btn btn-sm btn-outline-secondary" @click="fermer">
                Annuler
              </button>
              <button type="submit" class="btn btn-sm btn-primary" :disabled="!valide || enCours">
                <span
                  v-if="enCours"
                  class="spinner-border spinner-border-sm me-1"
                  role="status"
                ></span>
                {{ modification ? 'Enregistrer' : 'Créer le compte' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
/* Même fond que `ConfirmModal` : les deux fenêtres se superposent au même
   écran, un écart de teinte s'y verrait. */
.modal-backdrop-perso {
  position: fixed;
  inset: 0;
  z-index: 1055;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.5);
}
</style>
