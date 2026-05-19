<template>
  <div class="simulator-container">
    <!-- Header de la section -->
    <div class="col-12 mb-4">
      <h3 class="fw-bold mb-1">Simulateur Budgétaire & Prévisionnel</h3>
      <p class="text-muted small mb-0">
        <i class="bi bi-sliders me-1 text-primary"></i>
        Ajustez les leviers stratégiques pour simuler l'impact financier immédiat sur l'année
        académique courante.
      </p>
    </div>

    <div class="row g-3">
      <!-- Panneau de Contrôle : Les Curseurs ( inputs ) -->
      <div class="col-lg-5">
        <div class="card border-0 shadow-sm rounded-4 bg-white p-4 h-100">
          <h6 class="fw-bold text-dark mb-4 small text-uppercase text-secondary tracking-wider">
            <i class="bi bi-gear-fill text-primary me-2"></i>Leviers de Configuration
          </h6>

          <!-- Curseur 1 : Évolution des Frais de Scolarité -->
          <div class="mb-4">
            <div class="d-flex justify-content-between align-items-center mb-1">
              <label class="small fw-semibold text-muted">Ajustement Scolarité (%)</label>
              <span class="badge bg-soft-primary text-primary font-monospace fw-bold"
                >{{ scolariteModifier > 0 ? '+' : '' }}{{ scolariteModifier }}%</span
              >
            </div>
            <input
              type="range"
              v-model.number="scolariteModifier"
              min="-20"
              max="30"
              step="5"
              class="form-range custom-range"
            />
            <div class="d-flex justify-content-between text-xs text-muted">
              <span>-20%</span><span>0% (Actuel)</span><span>+30%</span>
            </div>
          </div>

          <!-- Curseur 2 : Évolution des Effectifs Étudiants -->
          <div class="mb-4">
            <div class="d-flex justify-content-between align-items-center mb-1">
              <label class="small fw-semibold text-muted">Recrutement Nouveaux Étudiants</label>
              <span class="badge bg-soft-success text-success font-monospace fw-bold"
                >{{ effectifModifier > 0 ? '+' : '' }}{{ effectifModifier }} %</span
              >
            </div>
            <input
              type="range"
              v-model.number="effectifModifier"
              min="-30"
              max="50"
              step="5"
              class="form-range custom-range"
            />
            <div class="d-flex justify-content-between text-xs text-muted">
              <span>-30%</span><span>Stable</span><span>+50%</span>
            </div>
          </div>

          <!-- Curseur 3 : Ajustement du Taux des Vacations -->
          <div class="mb-4">
            <div class="d-flex justify-content-between align-items-center mb-1">
              <label class="small fw-semibold text-muted">Taux Horaire Formateurs</label>
              <span class="badge bg-soft-danger text-danger font-monospace fw-bold"
                >{{ vacatModifier > 0 ? '+' : '' }}{{ vacatModifier }}%</span
              >
            </div>
            <input
              type="range"
              v-model.number="vacatModifier"
              min="-10"
              max="25"
              step="5"
              class="form-range custom-range"
            />
            <div class="d-flex justify-content-between text-xs text-muted">
              <span>-10%</span><span>Stable</span><span>+25%</span>
            </div>
          </div>

          <!-- Actions de réinitialisation -->
          <div class="pt-3 border-top border-light mt-auto">
            <button
              @click="resetSimulateur"
              class="btn btn-sm btn-light border text-secondary w-100 py-2"
            >
              <i class="bi bi-arrow-counterclockwise me-1"></i> Réinitialiser les paramètres par
              défaut
            </button>
          </div>
        </div>
      </div>

      <!-- Panneau de Résultats : Impact Financier Comparatif -->
      <div class="col-lg-7">
        <div class="card border-0 shadow-sm rounded-4 bg-white p-4 h-100">
          <h6 class="fw-bold text-dark mb-4 small text-uppercase text-secondary tracking-wider">
            <i class="bi bi-calculator-fill text-success me-2"></i>Projection des Résultats (FCFA)
          </h6>

          <!-- Tableau d'analyse d'impact -->
          <div class="table-responsive mb-4">
            <table class="table align-middle text-center mb-0">
              <thead class="bg-light text-secondary small">
                <tr>
                  <th class="text-start ps-3 py-2">Indicateur</th>
                  <th>Réel Actuel</th>
                  <th>Projection</th>
                  <th class="text-end pe-3">Écart</th>
                </tr>
              </thead>
              <tbody>
                <!-- Ligne : Produits (Scolarités engagées) -->
                <tr>
                  <td class="text-start ps-3 small fw-semibold text-dark">
                    Chiffre d'Affaires Global
                  </td>
                  <td class="font-monospace text-muted text-xs">
                    {{ formatPrice(baseFinances.caActuel) }}
                  </td>
                  <td class="font-monospace fw-bold text-primary">
                    {{ formatPrice(projections.caProjete) }}
                  </td>
                  <td
                    class="text-end pe-3 font-monospace small fw-bold"
                    :class="projections.caEcart >= 0 ? 'text-success' : 'text-danger'"
                  >
                    {{ projections.caEcart >= 0 ? '+' : '' }}{{ formatPrice(projections.caEcart) }}
                  </td>
                </tr>

                <!-- Ligne : Charges (Masse des vacations) -->
                <tr>
                  <td class="text-start ps-3 small fw-semibold text-dark">Charges de Vacation</td>
                  <td class="font-monospace text-muted text-xs">
                    {{ formatPrice(baseFinances.chargesActuelles) }}
                  </td>
                  <td class="font-monospace fw-bold text-danger">
                    {{ formatPrice(projections.chargesProjetees) }}
                  </td>
                  <td
                    class="text-end pe-3 font-monospace small fw-bold"
                    :class="projections.chargesEcart <= 0 ? 'text-success' : 'text-danger'"
                  >
                    {{ projections.chargesEcart > 0 ? '+' : ''
                    }}{{ formatPrice(projections.chargesEcart) }}
                  </td>
                </tr>

                <!-- Ligne : Solde Restant Net -->
                <tr class="table-group-divider bg-light-subtle">
                  <td class="text-start ps-3 fw-bold text-dark">Résultat Opérationnel</td>
                  <td class="font-monospace text-muted small fw-bold">
                    {{ formatPrice(baseFinances.caActuel - baseFinances.chargesActuelles) }}
                  </td>
                  <td class="font-monospace fw-bold text-success">
                    {{ formatPrice(projections.resultatProjete) }}
                  </td>
                  <td
                    class="text-end pe-3 font-monospace fw-bold"
                    :class="projections.resultatEcart >= 0 ? 'text-success' : 'text-danger'"
                  >
                    {{ projections.resultatEcart >= 0 ? '+' : ''
                    }}{{ formatPrice(projections.resultatEcart) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Message analytique contextuel -->
          <div
            class="p-3 bg-light rounded text-xs text-muted border-start border-3 border-info mt-auto"
          >
            <span class="fw-bold text-dark d-block mb-1"
              ><i class="bi bi-briefcase me-1"></i>Note Prudentielle :</span
            >
            Cette projection part de l'hypothèse que l'élasticité du recrutement reste stable malgré
            les ajustements tarifaires. L'impact réel peut varier en fonction des taux effectifs
            d'encaissement de l'échéancier.
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

// Curseurs d'ajustement (liaisons v-model)
const scolariteModifier = ref(0);
const effectifModifier = ref(0);
const vacatModifier = ref(0);

// Métriques réelles de référence de l'ERP
const baseFinances = {
  caActuel: 48500000, // Total facturé/engagé initial
  chargesActuelles: 11450000, // Masse brute initiale des honoraires formateurs
};

// Logique mathématique de projection financière
const projections = computed(() => {
  // Calcul du nouveau CA (Scolarités ajustées + effet volume des effectifs)
  const coefficientScolarite = 1 + scolariteModifier.value / 100;
  const coefficientEffectif = 1 + effectifModifier.value / 100;
  const caProjete = Math.round(baseFinances.caActuel * coefficientScolarite * coefficientEffectif);
  const caEcart = caProjete - baseFinances.caActuel;

  // Calcul des nouvelles charges (Ajustement taux horaire + ajustement du volume d'heures induit par les effectifs)
  const coefficientVacation = 1 + vacatModifier.value / 100;
  // On estime qu'une hausse d'effectif crée une ouverture de classes de 25% du taux de croissance
  const coefficientVolumeHeure = 1 + (effectifModifier.value / 100) * 0.25;
  const chargesProjetees = Math.round(
    baseFinances.chargesActuelles * coefficientVacation * coefficientVolumeHeure
  );
  const chargesEcart = chargesProjetees - baseFinances.chargesActuelles;

  // Résultat net final
  const resultatProjete = caProjete - chargesProjetees;
  const resultatEcart = resultatProjete - (baseFinances.caActuel - baseFinances.chargesActuelles);

  return {
    caProjete,
    caEcart,
    chargesProjetees,
    chargesEcart,
    resultatProjete,
    resultatEcart,
  };
});

const formatPrice = (val) => {
  return new Intl.NumberFormat('fr-FR').format(val) + ' FCFA';
};

const resetSimulateur = () => {
  scolariteModifier.value = 0;
  effectifModifier.value = 0;
  vacatModifier.value = 0;
};
</script>

<style scoped>
/* Teintes Flat UI soft */
.bg-soft-primary {
  background-color: rgba(0, 123, 255, 0.08);
}
.bg-soft-success {
  background-color: rgba(40, 167, 69, 0.12);
}
.bg-soft-danger {
  background-color: rgba(220, 53, 69, 0.08);
}

.text-xs {
  font-size: 11px !important;
}

.table th {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  color: #6c757d;
  border: none;
}

.table tbody tr {
  border-bottom: 1px solid #f8f9fa;
}

/* Personnalisation minimaliste des inputs de type range */
.custom-range::-webkit-slider-thumb {
  background: #007bff;
}
.custom-range:focus::-webkit-slider-thumb {
  box-shadow: none;
}

/* Identité visuelle ERP stable */
.rounded-4 {
  border-radius: 0.2rem !important;
}
</style>
