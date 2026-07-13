<template>
  <div class="container-fluid">
    <div class="row">
      <div class="col-md-8">
        <div class="card shadow-sm border-0">
          <div class="card-header bg-white py-3">
            <h5 class="fw-bold mb-0">Enregistrer un Nouveau Paiement</h5>
          </div>
          <div class="card-body">
            <form @submit.prevent="submitPaiement">
              <div class="row g-3">
                <div class="col-md-6">
                  <label class="form-label fw-bold">Matricule ou Nom de l'Étudiant</label>
                  <input
                    v-model="form.etudiant"
                    type="text"
                    class="form-control"
                    placeholder="Ex: ETU-2024-001"
                    required
                  />
                </div>

                <div class="col-md-6">
                  <label class="form-label fw-bold">Nature du Paiement</label>
                  <select v-model="form.type" class="form-select" required>
                    <option value="" disabled>Choisir le type...</option>
                    <option value="Inscription">Frais d'Inscription</option>
                    <option value="Scolarité">Frais Scolaires / Académiques</option>
                    <option value="Soutenance">Frais de Soutenance</option>
                    <option value="Autres">Autres (Certifications, Rattrapages...)</option>
                  </select>
                </div>

                <div class="col-md-4">
                  <label class="form-label fw-bold">Montant (FCFA)</label>
                  <input
                    v-model.number="form.montant"
                    type="number"
                    class="form-control"
                    placeholder="0"
                    required
                  />
                </div>
                <div class="col-md-4">
                  <label class="form-label fw-bold">Date de paiement</label>
                  <input v-model="form.date" type="date" class="form-control" required />
                </div>
                <div class="col-md-4">
                  <label class="form-label fw-bold">Mode de paiement</label>
                  <select v-model="form.mode" class="form-select" required>
                    <option value="Espèces">Espèces</option>
                    <option value="Virement">Virement Bancaire</option>
                    <option value="Wave">Wave / Orange Money</option>
                    <option value="Chèque">Chèque</option>
                  </select>
                </div>

                <div class="col-12">
                  <label class="form-label fw-bold">Observations</label>
                  <textarea
                    v-model="form.observations"
                    class="form-control"
                    rows="2"
                    placeholder="Note optionnelle..."
                  ></textarea>
                </div>

                <div class="col-12 mt-4 d-flex gap-2">
                  <button type="submit" class="btn btn-secondary px-4">
                    <i class="mdi mdi-check-circle me-1"></i> Valider & Imprimer Reçu
                  </button>
                  <button type="button" @click="resetForm" class="btn btn-light px-4">
                    Annuler
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>

      <div class="col-md-4">
        <div class="card bg-primary text-white border-0 shadow-sm mb-3">
          <div class="card-body">
            <h6>Importation de masse</h6>
            <p class="small opacity-75">
              Vous avez plusieurs paiements à enregistrer ? Utilisez un fichier Excel ou CSV.
            </p>
            <button
              class="btn btn-light btn-sm w-100"
              data-bs-toggle="modal"
              data-bs-target="#importModal"
            >
              <i class="mdi mdi-upload me-1"></i> Importer un fichier
            </button>
          </div>
        </div>

        <div class="card border-0 shadow-sm">
          <div class="card-body p-3">
            <h6 class="fw-bold small text-uppercase text-muted mb-3">Dernières opérations</h6>
            <div v-if="recentPaiements.length === 0" class="text-center py-3">
              <p class="small text-muted mb-0">Aucun paiement aujourd'hui</p>
            </div>
            <ul v-else class="list-unstyled mb-0">
              <li
                v-for="p in recentPaiements"
                :key="p.id"
                class="border-bottom py-2 d-flex justify-content-between"
              >
                <div>
                  <div class="fw-bold small">{{ p.etudiant }}</div>
                  <div class="text-muted" style="font-size: 0.7rem">{{ p.type }}</div>
                </div>
                <div class="text-primary fw-bold small">{{ p.montant }} F</div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <div class="modal fade" id="importModal" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title fw-bold">Importer des paiements</h5>
            <button
              type="button"
              class="btn-close"
              data-bs-dismiss="modal"
              aria-label="Close"
            ></button>
          </div>
          <div class="modal-body">
            <div class="text-center mb-4">
              <i class="mdi mdi-file-excel text-success" style="font-size: 48px"></i>
              <p>Sélectionnez votre fichier .csv ou .xlsx</p>
            </div>
            <input
              type="file"
              @change="handleFileUpload"
              class="form-control"
              accept=".csv, .xlsx, .xls"
            />
            <div class="alert alert-info mt-3 py-2 small">
              <i class="mdi mdi-information-outline me-1"></i>
              Veuillez utiliser le format de colonne : <b>Matricule, Montant, Type, Date</b>.
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Fermer</button>
            <button type="button" class="btn btn-success" @click="processImport">
              Lancer l'importation
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useNotificationStore } from '@/shared/stores/notificationStore';
import { useInscriptionStore } from '@/modules/inscriptions/store';
import { usePaiementStore } from '@/modules/finances/stores/paiements';
import { imprimerRecu } from '@/modules/finances/utils/recu';

/**
 * Guichet d'encaissement.
 *
 * Le formulaire n'enregistrait rien : `submitPaiement` empilait l'objet saisi
 * dans un tableau local et affichait « Impression du reçu… » dans une `alert()`.
 *
 * Deux traductions sont nécessaires entre ce que l'écran saisit et ce que l'API
 * attend, et le balisage ne change pas :
 *
 *  1. **L'étudiant.** Le champ est du texte libre (un matricule, ou un nom) ;
 *     le serveur, lui, encaisse sur une **inscription** — un étudiant peut en
 *     avoir plusieurs, une par année. On résout donc la saisie contre les
 *     inscriptions connues, et on refuse plutôt que d'encaisser sur le mauvais
 *     dossier si la saisie est ambiguë.
 *
 *  2. **Les libellés.** Les listes déroulantes proposent « Espèces », « Wave » ;
 *     la contrainte SQL attend `ESPECE`, `WAVE`.
 */

const store = usePaiementStore();
const inscriptionStore = useInscriptionStore();
const notifications = useNotificationStore();

/** Les valeurs de `<option>` de l'écran → les codes acceptés par le serveur. */
const MODES = {
  Espèces: 'ESPECE',
  Virement: 'VIREMENT',
  Wave: 'WAVE',
  Chèque: 'CHEQUE',
};

/**
 * « Scolarité » ne se traduit volontairement pas : sans `nature_paiement`, le
 * serveur la déduit du plan de l'étudiant (mensuel, semestriel, annuel, tranche).
 * Le guichet n'a pas à connaître cette taxonomie.
 */
const NATURES = {
  Inscription: 'INSCRIPTION',
  Scolarité: null,
  Soutenance: 'FRAIS_ANNEXE',
  Autres: 'FRAIS_ANNEXE',
};

const etatInitial = () => ({
  etudiant: '',
  type: '',
  montant: null,
  date: new Date().toISOString().substr(0, 10),
  mode: 'Espèces',
  observations: '',
});

const form = ref(etatInitial());
const recentPaiements = ref([]);

onMounted(() => inscriptionStore.fetchAll());

/**
 * Retrouve l'inscription visée par la saisie.
 *
 * Le matricule est un identifiant : une correspondance exacte tranche. Un nom ne
 * l'est pas — deux étudiants peuvent le porter — et une correspondance multiple
 * est donc refusée plutôt qu'arbitrée au hasard.
 *
 * @param {string} saisie
 * @returns {{inscription_id: string, matricule: string, nom: string, prenom: string}}
 */
function resoudreInscription(saisie) {
  const terme = saisie.trim().toLowerCase();
  const etudiants = inscriptionStore.etudiants;

  const parMatricule = etudiants.filter(
    (etudiant) => String(etudiant.matricule ?? '').toLowerCase() === terme
  );
  if (parMatricule.length === 1) return parMatricule[0];

  const parNom = etudiants.filter((etudiant) =>
    `${etudiant.prenom ?? ''} ${etudiant.nom ?? ''}`.toLowerCase().includes(terme)
  );

  if (parNom.length === 1) return parNom[0];

  if (parNom.length > 1) {
    throw new Error(
      `« ${saisie} » correspond à ${parNom.length} étudiants. Saisissez le matricule pour lever l’ambiguïté.`
    );
  }

  throw new Error(`Aucune inscription ne correspond à « ${saisie} ».`);
}

const submitPaiement = async () => {
  let etudiant;

  try {
    etudiant = resoudreInscription(form.value.etudiant);
  } catch (error) {
    notifications.notifyError(error, 'Étudiant introuvable.');
    return;
  }

  const resultat = await store.encaisser({
    inscription_id: etudiant.inscription_id,
    montant: Number(form.value.montant),
    mode_paiement: MODES[form.value.mode] ?? 'ESPECE',
    nature_paiement: NATURES[form.value.type] ?? null,
    observations: form.value.observations || null,
    date_paiement: form.value.date || null,
  });

  // `encaisser` a déjà notifié l'échec ; on ne vide pas le formulaire, pour que
  // le guichetier n'ait pas à tout resaisir.
  if (!resultat) return;

  recentPaiements.value.unshift({
    id: resultat.id,
    etudiant: `${etudiant.prenom} ${etudiant.nom}`,
    type: resultat.type,
    montant: Number(resultat.montant ?? 0).toLocaleString('fr-FR'),
  });

  if (resultat.recu) {
    try {
      imprimerRecu({ ...resultat.recu, ...resultat });
    } catch (error) {
      // Le paiement est encaissé : un blocage de pop-up ne doit pas le laisser
      // croire échoué. Le reçu reste réimprimable depuis la liste.
      notifications.notifyWarning(
        'Paiement enregistré, mais la fenêtre d’impression a été bloquée. Le reçu est réimprimable depuis la liste des paiements.'
      );
    }
  }

  resetForm();
};

const resetForm = () => {
  form.value = etatInitial();
};

const handleFileUpload = (event) => {
  const file = event.target.files[0];
  if (file) {
    notifications.notifyInfo(`Fichier « ${file.name} » sélectionné.`);
  }
};

/**
 * L'import de masse n'a pas d'endpoint : le backend n'expose aucune route
 * d'import de paiements (voir `routes/finances/paiement.routes.js`). Le bouton
 * annonçait « Traitement du fichier en cours… » sans rien traiter — on le dit,
 * plutôt que de le laisser mentir.
 */
const processImport = () => {
  notifications.notifyWarning(
    'L’import de paiements en masse n’est pas encore disponible côté serveur. Saisissez les paiements à l’unité.'
  );
};
</script>

<style scoped>
.form-label {
  font-size: 0.85rem;
  color: #555;
}
.card {
  border-radius: 12px;
}
.btn-primary {
  background-color: #4b49ac;
  border-color: #4b49ac;
}
.btn-primary:hover {
  background-color: #3f3e91;
}
.modal-content {
  border-radius: 15px;
  border: none;
}
</style>
