<template>
  <div>
    <EnteteEcran
      titre="Paramètres"
      sous-titre="Votre compte et vos préférences"
      fil="Plateforme"
      courant="Paramètres"
    />

    <div class="row">
      <div class="col-lg-7 grid-margin stretch-card">
        <div class="card border-0 shadow-sm rounded-4 bg-white p-4">
          <h6 class="fw-bold text-dark mb-3 small text-uppercase text-secondary tracking-wider">
            <i class="bi bi-person-badge text-primary me-2"></i>Compte
          </h6>

          <LoadingSpinner v-if="loading && !user" />
          <EmptyState
            v-else-if="!user"
            title="Profil indisponible"
            description="La session n'expose aucun profil. Reconnectez-vous."
            :size="70"
          />
          <dl v-else class="row mb-0">
            <dt class="col-sm-4 text-muted small fw-semibold">Nom</dt>
            <dd class="col-sm-8 text-dark">{{ nomComplet }}</dd>

            <dt class="col-sm-4 text-muted small fw-semibold">Identifiant</dt>
            <dd class="col-sm-8 font-monospace">{{ user.username }}</dd>

            <dt class="col-sm-4 text-muted small fw-semibold">Adresse électronique</dt>
            <dd class="col-sm-8">{{ user.email ?? '—' }}</dd>

            <dt class="col-sm-4 text-muted small fw-semibold">Rôle</dt>
            <dd class="col-sm-8">
              <span class="badge bg-soft-primary text-primary">{{ user.role }}</span>
            </dd>

            <dt class="col-sm-4 text-muted small fw-semibold">Compte créé le</dt>
            <dd class="col-sm-8">{{ dateCreation }}</dd>
          </dl>
        </div>
      </div>

      <div class="col-lg-5 grid-margin stretch-card">
        <EcranSansBackend
          titre="Aucune modification possible"
          description="Le profil se consulte, mais rien ne permet de le modifier : ni changement d'adresse, ni de mot de passe, ni vérification."
          :attendus="ATTENDUS"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue';
import { storeToRefs } from 'pinia';
import EmptyState from '@/shared/components/EmptyState.vue';
import LoadingSpinner from '@/shared/components/LoadingSpinner.vue';
import { useAuthStore } from '@/core/auth/authStore';
import EnteteEcran from '../components/EnteteEcran.vue';
import EcranSansBackend from '../components/EcranSansBackend.vue';

/**
 * Paramètres du compte.
 *
 * ⚠️ **L'écran d'origine était la page de paramètres de Kaggle, recopiée.** Son
 * texte, en anglais, parlait littéralement d'un autre produit :
 *
 * > « Verifying your account with a phone number allows you to do more on
 * > **Kaggle** » · « **Persona**, a trusted 3rd-party service » · « our new beta
 * > dark mode by choosing your **Kaggle** UI theme »
 *
 * L'adresse affichée était par ailleurs **codée en dur** — celle d'un
 * développeur — et ses trois boutons (« Change email », « Phone verify »,
 * « Verify my account ») n'avaient **aucun `@click`**. Ses deux onglets
 * pointaient enfin sur `#compte` et `#notification`, alors que l'unique panneau
 * s'appelait `#overview` : **les liens ne correspondaient à rien**.
 *
 * Enfin, l'écran n'était **atteignable par aucune route** : la barre latérale
 * pointait vers `/settings`, chemin déclaré nulle part.
 *
 * Ce qui reste est vrai : `GET /auth/user` renvoie le profil complet de la
 * session, et c'est lui qui est affiché.
 */
const authStore = useAuthStore();
const { user, loading } = storeToRefs(authStore);

const nomComplet = computed(() => {
  if (!user.value) return '—';
  return [user.value.prenom, user.value.nom].filter(Boolean).join(' ') || user.value.username;
});

const dateCreation = computed(() => {
  const brut = user.value?.date_creation;
  if (!brut) return '—';
  const date = new Date(brut);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('fr-FR');
});

const ATTENDUS = [
  'Une route de mise à jour du profil (nom, adresse électronique)',
  'Un changement de mot de passe pour un utilisateur connecté',
  'Une vérification de numéro, si elle est attendue',
];

// Le profil est déjà en session après connexion ; cet appel le rafraîchit si le
// cache a expiré, et ne coûte rien sinon.
onMounted(() => authStore.fetchCurrentUser?.());
</script>

<style scoped>
.bg-soft-primary {
  background-color: rgba(0, 123, 255, 0.08);
}
.tracking-wider {
  letter-spacing: 0.5px;
}
.rounded-4 {
  border-radius: 0.2rem !important;
}
</style>
