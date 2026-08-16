<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { useAuthStore } from '@/core/auth/authStore';
import Pagination from '@/components/shared/Pagination.vue';
import ConfirmModal from '@/shared/components/ConfirmModal.vue';
import EmptyState from '@/shared/components/EmptyState.vue';
import LoadingSpinner from '@/shared/components/LoadingSpinner.vue';
import { usePagination } from '@/shared/composables/usePagination';
import { formatDateTime, formatRelatif } from '@/shared/utils/date';
import { LONGUEUR_MIN_MOT_DE_PASSE, ROLES, ROLES_CONNUS, roleInfo } from '../../constants';
import { useParametresStore } from '../../store';
import CompteFormModal from '../CompteFormModal.vue';

/**
 * Comptes utilisateurs — **réservé à ADMIN**, l'onglet comme la route.
 *
 * ## Désactiver, jamais supprimer
 *
 * Onze tables désignent un compte pour dire *qui a fait quoi* — `notes.saisi_par`,
 * `paiements_all.encaisse_par`, `factures.emise_par`… — toutes en
 * `ON DELETE SET NULL`. Supprimer effacerait l'auteur des actes **sans effacer
 * les actes** : un paiement garderait son montant et perdrait son encaisseur.
 *
 * Il n'y a donc pas de bouton « supprimer », et ce n'est pas un oubli.
 *
 * ## Trois refus que le serveur oppose, et qu'on n'anticipe pas ici
 *
 * Se désactiver soi-même, retirer son propre rôle ADMIN, désactiver le dernier
 * ADMIN actif. Les messages sont rédigés côté serveur pour être lus tels quels ;
 * les recopier ici en ferait une seconde règle à maintenir, qui divergerait.
 * Seul le premier cas est aussi grisé à l'écran — c'est le plus fréquent, et
 * laisser cliquer sur son propre compte n'apprend rien.
 */

const store = useParametresStore();
const auth = useAuthStore();

const modalOuverte = ref(false);
const compteEdite = ref(null);
const confirmation = ref(null);
const reinitialisation = ref(null);
const nouveauMotDePasse = ref('');

onMounted(() => {
  store.fetchUtilisateurs();
  store.fetchRoles();
});

/** @type {ReturnType<typeof setTimeout>|undefined} */
let minuterie;

// La recherche est débattue : une requête par frappe sur une table de comptes
// n'apporte rien et sature l'API.
watch(
  () => store.recherche,
  () => {
    clearTimeout(minuterie);
    minuterie = setTimeout(() => store.fetchUtilisateurs(), 350);
  }
);

watch(
  () => [store.filtreRole, store.filtreActif],
  () => store.fetchUtilisateurs()
);

const {
  page,
  itemsPerPage,
  paginated: comptesPage,
} = usePagination(() => store.utilisateurs, {
  resetKey: () => [store.recherche, store.filtreRole, store.filtreActif],
});

const nbAdminsActifs = computed(() => store.roles.find((r) => r.role === 'ADMIN')?.actifs ?? 0);

function ouvrirCreation() {
  compteEdite.value = null;
  modalOuverte.value = true;
}

function ouvrirEdition(compte) {
  compteEdite.value = compte;
  modalOuverte.value = true;
}

function demanderBascule(compte) {
  confirmation.value = compte;
}

async function confirmerBascule() {
  const compte = confirmation.value;
  confirmation.value = null;
  if (compte) await store.basculerActif(compte.id, !compte.actif);
}

async function confirmerReinitialisation() {
  const compte = reinitialisation.value;
  if (!compte || nouveauMotDePasse.value.length < LONGUEUR_MIN_MOT_DE_PASSE) return;

  const resultat = await store.reinitialiser(compte.id, nouveauMotDePasse.value);
  if (resultat !== undefined) {
    reinitialisation.value = null;
    nouveauMotDePasse.value = '';
  }
}
</script>

<template>
  <div>
    <!-- ── Répartition par rôle ────────────────────────────────────────── -->
    <div class="d-flex flex-wrap gap-2 mb-3">
      <div
        v-for="entree in store.roles"
        :key="entree.role"
        class="card border-0 shadow-sm flex-fill"
      >
        <div class="card-body py-2 px-3">
          <div class="d-flex align-items-center gap-2">
            <span
              class="badge rounded-pill"
              :class="`bg-light text-${roleInfo(entree.role).couleur} border`"
            >
              {{ roleInfo(entree.role).libelle }}
            </span>
            <span class="ms-auto fw-bold">{{ entree.actifs }}</span>
            <!-- Actifs sur total : c'est l'écart qui informe, pas le total. -->
            <span v-if="entree.total !== entree.actifs" class="small text-muted">
              / {{ entree.total }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <div class="card border-0 shadow-sm">
      <div class="card-body p-3">
        <div class="row g-2 align-items-end mb-3">
          <div class="col-md-4">
            <label class="form-label small fw-bold" for="comptes-recherche">Rechercher</label>
            <input
              id="comptes-recherche"
              v-model="store.recherche"
              type="search"
              class="form-control form-control-sm"
              placeholder="Nom, identifiant, adresse…"
            />
          </div>

          <div class="col-md-3">
            <label class="form-label small fw-bold" for="comptes-role">Rôle</label>
            <select id="comptes-role" v-model="store.filtreRole" class="form-select form-select-sm">
              <option value="">Tous les rôles</option>
              <option v-for="code in ROLES_CONNUS" :key="code" :value="code">
                {{ ROLES[code].libelle }}
              </option>
            </select>
          </div>

          <div class="col-md-3">
            <label class="form-label small fw-bold" for="comptes-actif">État</label>
            <select
              id="comptes-actif"
              v-model="store.filtreActif"
              class="form-select form-select-sm"
            >
              <option value="">Tous</option>
              <option value="true">Actifs</option>
              <option value="false">Désactivés</option>
            </select>
          </div>

          <div class="col-md-2 text-end">
            <button type="button" class="btn btn-primary btn-sm w-100" @click="ouvrirCreation">
              <i class="bi bi-person-plus me-1"></i> Nouveau
            </button>
          </div>
        </div>

        <LoadingSpinner v-if="store.chargementUtilisateurs && !store.utilisateurs.length" />

        <EmptyState
          v-else-if="!store.utilisateurs.length"
          title="Aucun compte"
          description="Aucun compte ne correspond à ces filtres."
          :size="80"
        />

        <div v-else class="table-responsive">
          <table class="table table-sm table-hover align-middle mb-0 comptes-table">
            <thead>
              <tr>
                <th>Compte</th>
                <th>Rôle</th>
                <th>Adresse</th>
                <th>Dernière connexion</th>
                <th class="text-center">État</th>
                <th class="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="compte in comptesPage"
                :key="compte.id"
                :class="{ 'opacity-50': !compte.actif }"
              >
                <td>
                  <div class="fw-bold">{{ compte.prenom }} {{ compte.nom }}</div>
                  <div class="font-monospace small text-muted">{{ compte.username }}</div>
                </td>
                <td>
                  <span
                    class="badge rounded-pill"
                    :class="`bg-light text-${roleInfo(compte.role).couleur} border`"
                  >
                    {{ roleInfo(compte.role).libelle }}
                  </span>
                </td>
                <td class="small">{{ compte.email }}</td>
                <td class="small text-muted" :title="formatDateTime(compte.derniere_connexion)">
                  {{
                    compte.derniere_connexion
                      ? formatRelatif(compte.derniere_connexion)
                      : 'jamais connecté'
                  }}
                </td>
                <td class="text-center">
                  <i
                    class="bi"
                    :class="
                      compte.actif ? 'bi-check-circle text-success' : 'bi-slash-circle text-danger'
                    "
                    :title="compte.actif ? 'Actif' : 'Désactivé'"
                  ></i>
                </td>
                <td class="text-end text-nowrap">
                  <button
                    type="button"
                    class="btn btn-sm btn-link text-muted p-0 me-2"
                    title="Modifier"
                    @click="ouvrirEdition(compte)"
                  >
                    <i class="bi bi-pencil"></i>
                  </button>

                  <button
                    type="button"
                    class="btn btn-sm btn-link text-muted p-0 me-2"
                    title="Réinitialiser le mot de passe"
                    @click="reinitialisation = compte"
                  >
                    <i class="bi bi-key"></i>
                  </button>

                  <!-- Son propre compte est le seul cas grisé : le serveur
                       refuse les deux autres avec un message qui explique. -->
                  <button
                    type="button"
                    class="btn btn-sm btn-link p-0"
                    :class="compte.actif ? 'text-danger' : 'text-success'"
                    :disabled="compte.id === auth.user?.id"
                    :title="
                      compte.id === auth.user?.id
                        ? 'Vous ne pouvez pas désactiver votre propre compte'
                        : compte.actif
                          ? 'Désactiver'
                          : 'Réactiver'
                    "
                    @click="demanderBascule(compte)"
                  >
                    <i
                      class="bi"
                      :class="compte.actif ? 'bi-slash-circle' : 'bi-arrow-counterclockwise'"
                    ></i>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <Pagination
          v-if="store.utilisateurs.length"
          v-model="page"
          v-model:items-per-page="itemsPerPage"
          :total-items="store.utilisateurs.length"
        />

        <p class="small text-muted mt-3 mb-0 pt-3 border-top">
          <i class="bi bi-info-circle me-1"></i>
          Un compte ne se supprime pas : onze tables le désignent pour dire qui a saisi une note,
          encaissé un paiement ou émis une facture. Le désactiver lui retire l'accès —
          immédiatement, y compris sur ses sessions ouvertes — et laisse ces écritures à son nom.
        </p>
      </div>
    </div>

    <CompteFormModal v-model="modalOuverte" :compte="compteEdite" />

    <ConfirmModal
      :model-value="Boolean(confirmation)"
      :title="confirmation?.actif ? 'Désactiver ce compte ?' : 'Réactiver ce compte ?'"
      :message="
        confirmation?.actif
          ? `${confirmation?.prenom} ${confirmation?.nom} perdra l'accès immédiatement, y compris sur ses sessions en cours. Ses écritures passées restent à son nom.`
          : `${confirmation?.prenom} ${confirmation?.nom} pourra de nouveau se connecter.`
      "
      :confirm-label="confirmation?.actif ? 'Désactiver' : 'Réactiver'"
      :variant="confirmation?.actif ? 'danger' : 'success'"
      @update:model-value="confirmation = null"
      @confirm="confirmerBascule"
    />

    <!-- La réinitialisation demande une saisie : `ConfirmModal` n'a pas de
         champ, elle a donc sa propre fenêtre. -->
    <Teleport to="body">
      <div
        v-if="reinitialisation"
        class="modal-backdrop-perso"
        @click.self="reinitialisation = null"
      >
        <div class="modal-dialog modal-dialog-centered modal-sm">
          <div class="modal-content border-0 shadow">
            <div class="modal-header py-2">
              <h6 class="modal-title fw-bold">
                <i class="bi bi-key me-2"></i>Réinitialiser le mot de passe
              </h6>
              <button type="button" class="btn-close" @click="reinitialisation = null"></button>
            </div>
            <div class="modal-body">
              <p class="small text-muted">
                Compte <strong>{{ reinitialisation.username }}</strong
                >. L'ancien mot de passe n'est pas demandé : personne ne le connaît, pas même le
                serveur.
              </p>
              <input
                v-model="nouveauMotDePasse"
                type="password"
                class="form-control form-control-sm"
                autocomplete="new-password"
                placeholder="Nouveau mot de passe"
                :minlength="LONGUEUR_MIN_MOT_DE_PASSE"
              />
              <div class="form-text small">
                {{ LONGUEUR_MIN_MOT_DE_PASSE }} caractères au minimum.
              </div>
            </div>
            <div class="modal-footer py-2">
              <button
                type="button"
                class="btn btn-sm btn-outline-secondary"
                @click="reinitialisation = null"
              >
                Annuler
              </button>
              <button
                type="button"
                class="btn btn-sm btn-primary"
                :disabled="nouveauMotDePasse.length < LONGUEUR_MIN_MOT_DE_PASSE"
                @click="confirmerReinitialisation"
              >
                Réinitialiser
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Repère d'exploitation : c'est ce compteur qui explique le refus du
         serveur si l'on tente de désactiver le dernier administrateur. -->
    <p v-if="nbAdminsActifs === 1" class="small text-warning mt-2 mb-0">
      <i class="bi bi-exclamation-triangle me-1"></i>
      Un seul compte administrateur est actif : le serveur refusera de le désactiver ou de changer
      son rôle.
    </p>
  </div>
</template>

<style scoped>
.comptes-table {
  font-size: 0.84rem;
}

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
