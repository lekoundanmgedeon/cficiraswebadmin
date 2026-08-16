<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { useAnneeStore } from '@/modules/structure-academique/annee/store';
import LoadingSpinner from '@/shared/components/LoadingSpinner.vue';
import { formatDateTime } from '@/shared/utils/date';
import { categorieInfo } from '../../constants';
import { useParametresStore } from '../../store';

// Dépendance entre modules : parametres → structure-academique (déclarée, cf. la
// règle de dépendance d'ARCHITECTURE.md). Elle sert uniquement à **afficher**
// l'année active, qui n'est pas un paramètre — voir plus bas.

/**
 * Réglages de la plateforme.
 *
 * ## Le formulaire est engendré, pas écrit
 *
 * Chaque champ vient de `parametres_plateforme` : le serveur rend `libelle`,
 * `type_valeur`, `description` et `modifiable`, et cet écran s'y conforme. Une
 * clé ajoutée en base apparaît donc ici sans qu'on touche au front — et une clé
 * inconnue du serveur ne peut pas être inventée depuis le client, qui se verrait
 * répondre 404.
 *
 * ## L'année académique n'est pas un paramètre, et c'est important
 *
 * Elle a déjà une source de vérité : la colonne `est_active` de la table
 * `annee`, gérée par l'écran des années académiques — dont l'activation bascule
 * **deux** lignes (l'ancienne et la nouvelle). La recopier ici en ferait une
 * seconde vérité, et rien ne garantirait qu'elles restent d'accord.
 *
 * Elle est donc affichée en lecture seule, avec un lien vers l'écran qui la
 * décide.
 *
 * ## L'enregistrement se fait par catégorie
 *
 * Le serveur applique le lot dans une transaction : un type refusé au milieu
 * n'en laisse pas la moitié appliquée. Enregistrer clé par clé aurait produit
 * exactement l'état intermédiaire qu'on cherche à éviter.
 */

const store = useParametresStore();
const anneeStore = useAnneeStore();

/** La saisie en cours, par clé. Séparée du store : on n'écrit qu'à la validation. */
const brouillon = ref({});
const categorieEnCours = ref(null);

onMounted(async () => {
  await store.fetchParametres();
  // L'année active est un affichage, pas un réglage : la liste des années
  // suffit, le getter `activeAnnee` en tire celle qui porte `est_active`.
  anneeStore.fetchAll?.();
});

// Le brouillon suit le catalogue : sans cette recopie, un rechargement des
// paramètres laisserait le formulaire sur les anciennes valeurs.
watch(
  () => store.categories,
  () => {
    brouillon.value = { ...store.valeurs };
  },
  { immediate: true, deep: true }
);

const anneeActive = computed(() => anneeStore.activeAnnee ?? null);

/** Les clés d'une catégorie dont la saisie diffère de ce qui est enregistré. */
function modifiees(categorie) {
  return store
    .parametresDe(categorie)
    .filter((p) => p.modifiable && (brouillon.value[p.cle] ?? '') !== (p.valeur ?? ''))
    .map((p) => p.cle);
}

async function enregistrer(categorie) {
  const cles = modifiees(categorie);
  if (cles.length === 0) return;

  categorieEnCours.value = categorie;
  try {
    // Une chaîne vide devient `null` : le serveur distingue « effacé » de
    // « jamais renseigné », et un champ facultatif vidé doit redevenir absent.
    await store.enregistrerParametres(
      Object.fromEntries(cles.map((cle) => [cle, brouillon.value[cle]?.trim() || null]))
    );
  } finally {
    categorieEnCours.value = null;
  }
}
</script>

<template>
  <div>
    <LoadingSpinner v-if="store.chargementParametres && !store.categories.length" />

    <div v-else class="row g-3">
      <div v-for="groupe in store.categories" :key="groupe.categorie" class="col-lg-6">
        <div class="card border-0 shadow-sm h-100">
          <div class="card-body p-3 d-flex flex-column">
            <h6 class="text-uppercase text-secondary fw-bold small mb-1">
              <i class="bi text-primary me-2" :class="categorieInfo(groupe.categorie).icone"></i>
              {{ categorieInfo(groupe.categorie).libelle }}
            </h6>
            <p class="small text-muted mb-3">
              {{ categorieInfo(groupe.categorie).description }}
            </p>

            <div class="flex-grow-1">
              <div v-for="param in groupe.parametres" :key="param.cle" class="mb-3">
                <label class="form-label small fw-bold mb-1" :for="`param-${param.cle}`">
                  {{ param.libelle }}
                </label>

                <input
                  :id="`param-${param.cle}`"
                  v-model="brouillon[param.cle]"
                  :type="param.type_valeur === 'nombre' ? 'number' : 'text'"
                  class="form-control form-control-sm"
                  :disabled="!param.modifiable"
                  step="any"
                />

                <div v-if="param.description" class="form-text small">{{ param.description }}</div>

                <!-- Qui a changé quoi, et quand : la table le retient, autant
                     le montrer là où la question se pose. -->
                <div v-if="param.modifie_par" class="form-text small text-muted">
                  Modifié par {{ param.modifie_par }} le {{ formatDateTime(param.updated_at) }}
                </div>
              </div>
            </div>

            <div class="text-end pt-2 border-top">
              <button
                type="button"
                class="btn btn-sm btn-primary"
                :disabled="
                  !modifiees(groupe.categorie).length || categorieEnCours === groupe.categorie
                "
                @click="enregistrer(groupe.categorie)"
              >
                <span
                  v-if="categorieEnCours === groupe.categorie"
                  class="spinner-border spinner-border-sm me-1"
                  role="status"
                ></span>
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- ── L'année académique : affichée, pas réglée ─────────────────── -->
      <div class="col-lg-6">
        <div class="card border-0 shadow-sm h-100">
          <div class="card-body p-3">
            <h6 class="text-uppercase text-secondary fw-bold small mb-1">
              <i class="bi bi-calendar-range text-primary me-2"></i>Année académique
            </h6>
            <p class="small text-muted mb-3">
              Réglée ailleurs — elle n'est pas un paramètre de plateforme.
            </p>

            <div v-if="anneeActive" class="d-flex align-items-center gap-2 mb-3">
              <span class="badge bg-light text-success border fs-6">
                {{ anneeActive.code }}
              </span>
              <span class="small text-muted">année en cours</span>
            </div>
            <p v-else class="small text-muted mb-3">Aucune année active déclarée.</p>

            <p class="small text-muted mb-3">
              L'année active est portée par la table des années académiques, dont l'activation
              bascule deux lignes à la fois. La recopier ici en ferait une seconde vérité, sans
              garantie qu'elles restent d'accord.
            </p>

            <router-link to="/annees-academiques" class="btn btn-sm btn-outline-primary">
              <i class="bi bi-box-arrow-up-right me-1"></i> Gérer les années académiques
            </router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
