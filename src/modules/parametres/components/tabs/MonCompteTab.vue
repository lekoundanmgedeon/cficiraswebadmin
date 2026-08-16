<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useAuthStore } from '@/core/auth/authStore';
import { formatDateTime } from '@/shared/utils/date';
import LoadingSpinner from '@/shared/components/LoadingSpinner.vue';
import { useParametresStore } from '../../store';

/**
 * Mon compte — le seul onglet visible de tous les rôles.
 *
 * ## Ce qui s'y modifie, et ce qui n'y est pas
 *
 * Nom, prénom, adresse électronique, mot de passe. **Ni l'identifiant ni le
 * rôle**, et c'est délibéré : `username` désigne le compte dans onze tables
 * métier, dans l'audit financier et dans le journal de l'assistant ; le rôle est
 * une décision d'administration, qui passe par l'onglet « Comptes ».
 *
 * ## Le mot de passe se change en prouvant l'ancien
 *
 * Même quand la session est valide. Un jeton oublié sur un poste partagé
 * suffirait sinon à verrouiller son propriétaire hors de son propre compte.
 *
 * ⚠️ Le serveur ne révoque **pas** les jetons déjà émis : les autres sessions
 * ouvertes restent valables jusqu'à leur expiration (8 h). L'écran le dit plutôt
 * que de laisser croire à une déconnexion générale.
 */

const auth = useAuthStore();
const store = useParametresStore();
const { user } = storeToRefs(auth);

const profil = ref({ nom: '', prenom: '', email: '' });
const motDePasse = ref({ ancien: '', nouveau: '', confirmation: '' });
const enregistrementProfil = ref(false);
const enregistrementMdp = ref(false);

/** Recopie le profil de la session dans le formulaire, à l'arrivée et après un rafraîchissement. */
function remplirDepuisSession() {
  profil.value = {
    nom: user.value?.nom ?? '',
    prenom: user.value?.prenom ?? '',
    email: user.value?.email ?? '',
  };
}

onMounted(async () => {
  await auth.fetchCurrentUser();
  remplirDepuisSession();
});

watch(user, remplirDepuisSession);

const profilModifie = computed(
  () =>
    profil.value.nom !== (user.value?.nom ?? '') ||
    profil.value.prenom !== (user.value?.prenom ?? '') ||
    profil.value.email !== (user.value?.email ?? '')
);

/**
 * La confirmation est vérifiée **ici** et non côté serveur : c'est une faute de
 * frappe, pas une règle métier, et l'aller-retour n'apprendrait rien.
 */
const erreurConfirmation = computed(() => {
  const { nouveau, confirmation } = motDePasse.value;
  if (!confirmation || !nouveau) return null;
  return nouveau === confirmation ? null : 'Les deux saisies diffèrent.';
});

const motDePasseValide = computed(
  () =>
    motDePasse.value.ancien &&
    motDePasse.value.nouveau.length >= 8 &&
    !erreurConfirmation.value &&
    motDePasse.value.confirmation
);

async function enregistrerProfil() {
  if (!profilModifie.value) return;
  enregistrementProfil.value = true;

  try {
    const resultat = await store.modifierProfil(profil.value);
    // `run()` rend `undefined` en cas d'échec : on ne rafraîchit la session que
    // si le serveur a bien accepté.
    if (resultat !== undefined) await auth.fetchCurrentUser(true);
  } finally {
    enregistrementProfil.value = false;
  }
}

async function enregistrerMotDePasse() {
  if (!motDePasseValide.value) return;
  enregistrementMdp.value = true;

  try {
    const resultat = await store.changerSonMotDePasse(
      motDePasse.value.ancien,
      motDePasse.value.nouveau
    );
    if (resultat !== undefined) motDePasse.value = { ancien: '', nouveau: '', confirmation: '' };
  } finally {
    enregistrementMdp.value = false;
  }
}
</script>

<template>
  <div class="row g-3">
    <!-- ── Identité de la session ──────────────────────────────────────── -->
    <div class="col-lg-5">
      <div class="card border-0 shadow-sm h-100">
        <div class="card-body p-3">
          <h6 class="text-uppercase text-secondary fw-bold small mb-3">
            <i class="bi bi-person-badge text-primary me-2"></i>Votre session
          </h6>

          <LoadingSpinner v-if="!user" label="Chargement du profil…" />

          <dl v-else class="row mb-0 small">
            <dt class="col-5 text-muted fw-bold">Identifiant</dt>
            <dd class="col-7 font-monospace">{{ user.username }}</dd>

            <dt class="col-5 text-muted fw-bold">Rôle</dt>
            <dd class="col-7">
              <span class="badge bg-light text-primary border">{{ user.role }}</span>
            </dd>

            <dt class="col-5 text-muted fw-bold">Compte créé le</dt>
            <dd class="col-7">{{ formatDateTime(user.date_creation) }}</dd>

            <dt class="col-5 text-muted fw-bold">Dernière connexion</dt>
            <dd class="col-7">{{ formatDateTime(user.derniere_connexion, 'première session') }}</dd>
          </dl>

          <!-- L'identifiant et le rôle sont affichés mais non modifiables :
               dire pourquoi évite qu'on les cherche dans le formulaire. -->
          <p class="small text-muted mb-0 mt-3 pt-3 border-top">
            L'identifiant et le rôle ne se modifient pas ici : le premier vous désigne dans les
            écritures que vous avez signées, le second relève de l'administration.
          </p>
        </div>
      </div>
    </div>

    <!-- ── Profil ─────────────────────────────────────────────────────── -->
    <div class="col-lg-7">
      <div class="card border-0 shadow-sm mb-3">
        <div class="card-body p-3">
          <h6 class="text-uppercase text-secondary fw-bold small mb-3">
            <i class="bi bi-pencil-square text-primary me-2"></i>Vos informations
          </h6>

          <form @submit.prevent="enregistrerProfil">
            <div class="row g-2">
              <div class="col-md-6">
                <label class="form-label small fw-bold" for="profil-prenom">Prénom</label>
                <input
                  id="profil-prenom"
                  v-model="profil.prenom"
                  type="text"
                  class="form-control form-control-sm"
                  required
                />
              </div>
              <div class="col-md-6">
                <label class="form-label small fw-bold" for="profil-nom">Nom</label>
                <input
                  id="profil-nom"
                  v-model="profil.nom"
                  type="text"
                  class="form-control form-control-sm"
                  required
                />
              </div>
              <div class="col-12">
                <label class="form-label small fw-bold" for="profil-email">
                  Adresse électronique
                </label>
                <input
                  id="profil-email"
                  v-model="profil.email"
                  type="email"
                  class="form-control form-control-sm"
                  required
                />
              </div>
            </div>

            <div class="text-end mt-3">
              <button
                type="submit"
                class="btn btn-primary btn-sm"
                :disabled="!profilModifie || enregistrementProfil"
              >
                <span
                  v-if="enregistrementProfil"
                  class="spinner-border spinner-border-sm me-1"
                  role="status"
                ></span>
                Enregistrer
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- ── Mot de passe ─────────────────────────────────────────────── -->
      <div class="card border-0 shadow-sm">
        <div class="card-body p-3">
          <h6 class="text-uppercase text-secondary fw-bold small mb-3">
            <i class="bi bi-key text-primary me-2"></i>Mot de passe
          </h6>

          <form @submit.prevent="enregistrerMotDePasse">
            <div class="row g-2">
              <div class="col-12">
                <label class="form-label small fw-bold" for="mdp-ancien">
                  Mot de passe actuel
                </label>
                <input
                  id="mdp-ancien"
                  v-model="motDePasse.ancien"
                  type="password"
                  class="form-control form-control-sm"
                  autocomplete="current-password"
                  required
                />
              </div>
              <div class="col-md-6">
                <label class="form-label small fw-bold" for="mdp-nouveau">Nouveau</label>
                <input
                  id="mdp-nouveau"
                  v-model="motDePasse.nouveau"
                  type="password"
                  class="form-control form-control-sm"
                  autocomplete="new-password"
                  minlength="8"
                  required
                />
                <div class="form-text small">8 caractères au minimum.</div>
              </div>
              <div class="col-md-6">
                <label class="form-label small fw-bold" for="mdp-confirmation">
                  Confirmation
                </label>
                <input
                  id="mdp-confirmation"
                  v-model="motDePasse.confirmation"
                  type="password"
                  class="form-control form-control-sm"
                  :class="{ 'is-invalid': erreurConfirmation }"
                  autocomplete="new-password"
                  required
                />
                <div v-if="erreurConfirmation" class="invalid-feedback">
                  {{ erreurConfirmation }}
                </div>
              </div>
            </div>

            <div class="d-flex align-items-center justify-content-between mt-3">
              <p class="small text-muted mb-0">
                <i class="bi bi-info-circle me-1"></i>
                Vos autres sessions ouvertes restent valables jusqu'à leur expiration.
              </p>

              <button
                type="submit"
                class="btn btn-primary btn-sm flex-shrink-0"
                :disabled="!motDePasseValide || enregistrementMdp"
              >
                <span
                  v-if="enregistrementMdp"
                  class="spinner-border spinner-border-sm me-1"
                  role="status"
                ></span>
                Changer le mot de passe
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>
