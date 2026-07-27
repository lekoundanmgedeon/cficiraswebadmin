<template>
  <div class="dash-rapport-container">
    <div class="card border-0 shadow-sm rounded-4 bg-white p-4">
      <div class="d-flex justify-content-between align-items-center mb-1">
        <h6 class="fw-bold text-dark mb-0 small text-uppercase text-secondary tracking-wider">
          <i class="bi bi-journal-text text-primary me-2"></i>Catalogue des Extractions
        </h6>
      </div>

      <!--
        L'ancien catalogue listait quatre rapports inventés, avec des dates de
        « dernière génération » fictives, et ses boutons Excel/PDF ouvraient un
        `alert("Génération à la volée réussie")`. Aucun endpoint de génération de
        rapports n'existe côté serveur.

        Le catalogue ci-dessous ne liste que des extractions **réellement
        disponibles** : chacune interroge son endpoint puis produit le fichier
        dans le navigateur, via `useTableExport` — comme partout ailleurs dans
        l'application.
      -->
      <p class="text-xs text-muted mb-4">
        Les extractions sont produites dans le navigateur à partir des données du serveur. Aucune
        n'est stockée : le fichier est celui de l'instant où vous le demandez.
      </p>

      <div class="table-responsive">
        <table class="table table-hover align-middle mb-0 text-sm">
          <thead class="bg-light text-secondary text-xs">
            <tr>
              <th class="ps-2">Extraction</th>
              <th>Source</th>
              <th class="text-end pe-2">Format</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="rapport in catalogue" :key="rapport.id">
              <td class="ps-2">
                <div class="fw-bold text-dark mb-0 text-xs">
                  <i :class="['bi', rapport.icone, 'text-primary', 'me-2']"></i>{{ rapport.titre }}
                </div>
                <small class="text-muted text-xs">{{ rapport.description }}</small>
              </td>
              <td>
                <span class="badge bg-soft-secondary text-secondary font-monospace text-xs">
                  {{ rapport.source }}
                </span>
              </td>
              <td class="text-end pe-2">
                <div class="btn-group" role="group">
                  <button
                    :disabled="enCours === rapport.id"
                    class="btn btn-xs btn-white border py-1 px-2 text-xs"
                    title="Extraire en Excel"
                    @click="extraire(rapport, 'excel')"
                  >
                    <i class="bi bi-file-earmark-excel text-success me-1"></i> Excel
                  </button>
                  <button
                    :disabled="enCours === rapport.id"
                    class="btn btn-xs btn-white border py-1 px-2 text-xs"
                    title="Extraire en PDF"
                    @click="extraire(rapport, 'pdf')"
                  >
                    <i class="bi bi-file-earmark-pdf text-danger me-1"></i> PDF
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useNotificationStore } from '@/shared/stores/notificationStore';
import { exportExcel } from '@/shared/utils/exportExcel';
import { exportPDF } from '@/shared/utils/exportPDF';
import logoCFI from '@/assets/logoBase64';
import { useRapportStore } from '@/modules/finances/stores/rapports';
import { useDashboardStore } from '../../store';

const notifications = useNotificationStore();
const rapports = useRapportStore();
const dashboard = useDashboardStore();

const enCours = ref(null);

/**
 * Chaque entrée déclare **comment obtenir ses lignes**. Le catalogue n'est donc
 * pas une liste décorative : s'il affiche une extraction, c'est qu'un endpoint
 * la nourrit.
 */
const catalogue = [
  {
    id: 'bilan-filieres',
    titre: 'Bilan financier par filière',
    description: 'Montants attendus, perçus et restant dus, filière par filière.',
    icone: 'bi-file-earmark-ruled',
    source: '/rapports/bilan-filieres',
    async lignes() {
      await rapports.fetchBilanFilieres();
      return rapports.bilanFilieres.map((ligne) => ({
        Filière: ligne.filiere ?? '—',
        Étudiants: ligne.nb_etudiants,
        Attendu: ligne.attendu,
        Perçu: ligne.percu,
        Reste: ligne.reste,
        'Taux (%)': ligne.taux,
      }));
    },
  },
  {
    id: 'encaissements-mensuels',
    titre: 'Encaissements mensuels',
    description: "Évolution des montants encaissés mois par mois sur l'année active.",
    icone: 'bi-cash-coin',
    source: '/rapports/encaissements-mensuels',
    async lignes() {
      await rapports.fetchEncaissementsMensuels();
      return rapports.encaissementsMensuels.map((ligne) => ({
        Mois: ligne.mois ?? ligne.periode ?? '—',
        Montant: ligne.montant ?? ligne.total ?? 0,
      }));
    },
  },
  {
    id: 'repartition-modes',
    titre: 'Répartition par mode de paiement',
    description: 'Volumes encaissés par espèces, chèque, virement ou mobile.',
    icone: 'bi-credit-card',
    source: '/rapports/repartition-modes',
    async lignes() {
      await rapports.fetchRepartitionModes();
      return rapports.repartitionModes.map((ligne) => ({
        Mode: ligne.mode ?? ligne.mode_paiement ?? '—',
        Opérations: ligne.nb ?? ligne.nb_paiements ?? 0,
        Montant: ligne.montant ?? ligne.total ?? 0,
      }));
    },
  },
  {
    id: 'effectifs-cycles',
    titre: 'Effectifs par cycle',
    description: 'Nombre d’apprenants rattachés à chaque cycle diplômant.',
    icone: 'bi-diagram-2',
    source: '/cycles/stats/distribution',
    async lignes() {
      await dashboard.fetchCycles();
      return dashboard.cycles.map((cycle) => ({
        Cycle: cycle.cycle_code,
        Diplôme: cycle.diplome,
        Étudiants: cycle.nb_etudiants,
      }));
    },
  },
  {
    id: 'organisation-filieres',
    titre: 'Remplissage des filières',
    description: 'Effectif, capacité, taux de remplissage et responsable par filière.',
    icone: 'bi-speedometer2',
    source: '/filieres/stats/organisations',
    async lignes() {
      await dashboard.fetchFilieres();
      return dashboard.filieres.map((filiere) => ({
        Filière: filiere.filiere,
        Responsable: filiere.responsable,
        Effectif: filiere.effectif,
        Capacité: filiere.capacite,
        'Taux (%)': filiere.taux,
        Statut: filiere.statut,
      }));
    },
  },
];

/**
 * Le fichier n'est produit **qu'après** une lecture réussie : si l'endpoint
 * échoue ou ne rend rien, l'utilisateur est averti et aucun fichier vide n'est
 * téléchargé. C'est précisément ce que l'ancien écran ne faisait pas — il
 * annonçait le succès sans avoir rien demandé au serveur.
 */
const extraire = async (rapport, format) => {
  enCours.value = rapport.id;

  try {
    const lignes = await rapport.lignes();

    if (!lignes?.length) {
      notifications.notifyWarning(`Aucune donnée à extraire pour « ${rapport.titre} ».`);
      return;
    }

    const fileName = `${rapport.id}_${Date.now()}`;

    if (format === 'excel') {
      exportExcel({ data: lignes, sheetName: rapport.titre, fileName: `${fileName}.xlsx` });
      return;
    }

    // Colonnes déduites des lignes, comme dans `useTableExport` : les deux ne
    // peuvent pas se désynchroniser.
    const columns = Object.keys(lignes[0]);

    exportPDF({
      logoBase64: logoCFI,
      title: rapport.titre,
      filters: [
        { label: 'Source', value: rapport.source },
        { label: 'Total', value: lignes.length },
        { label: "Date d'export", value: new Date().toLocaleDateString('fr-FR') },
      ],
      columns,
      rows: lignes.map((ligne) => columns.map((colonne) => ligne[colonne])),
      fileName: `${fileName}.pdf`,
    });
  } catch {
    // Les stores notifient déjà l'échec de lecture ; ne pas le redire deux fois.
  } finally {
    enCours.value = null;
  }
};
</script>

<style scoped>
/* Couleurs Flat ERP Standard */
.bg-soft-primary {
  background-color: rgba(0, 123, 255, 0.08);
}
.bg-soft-success {
  background-color: rgba(40, 167, 69, 0.12);
}
.bg-soft-secondary {
  background-color: rgba(108, 117, 125, 0.1);
}

.text-xs {
  font-size: 11px !important;
}
.text-sm {
  font-size: 0.85rem;
}
.tracking-wider {
  letter-spacing: 0.5px;
}

.table th {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  color: #6c757d;
  border: none;
}

.table tbody tr {
  border-bottom: 1px solid #f8f9fa;
  transition: background-color 0.1s ease;
}

.btn-white {
  background-color: #ffffff;
  color: #495057;
}
.btn-white:hover {
  background-color: #f8f9fa;
  color: #212529;
}

/* Alignement structurel strict de la charte ERP (Coins adoucis fins) */
.rounded-4 {
  border-radius: 0.2rem !important;
}
</style>
