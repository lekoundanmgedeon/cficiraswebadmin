import { createCrudStore } from '@/core/store/createCrudStore';
import {
  filieresResource,
  getFiliereOrganisation,
  getFiliereStats,
  getFilieresByCycle,
} from './api';
import { nombre, SEUILS } from './constants';

/** Store des filières. (Ancien `filiereStore.js` : 179 lignes.) */
export const useFiliereStore = createCrudStore({
  id: 'filieres',
  resource: filieresResource,
  label: 'Filière',
  cacheKey: 'filieres',

  state: () => ({
    /** @type {any[]} */
    organisation: [],
    /** @type {any|null} Statistiques de la filière consultée. */
    stats: null,
  }),

  getters: {
    /**
     * @deprecated Utiliser `items`. Alias pour les vues `classes` et `etudiants`
     * non encore migrées ; à retirer avec leur migration.
     */
    filieres: (state) => state.items,

    /**
     * Les deux lectures du backend réunies par `id`, en nombres.
     *
     * `GET /filieres` (`v_filiere_details`) porte l'identité et le nombre de
     * classes ; `GET /filieres/stats/organisations` (`v_organisation_filieres`)
     * porte la capacité et l'effectif. Aucune des deux ne suffit seule : la
     * première ignore les capacités, la seconde ne connaît ni code ni cycle.
     *
     * **Les deux comptent sur l'année académique active** — c'est la clause
     * `WHERE est_active = TRUE` des vues. Un effectif nul ne signifie donc pas
     * « filière sans étudiants », mais « aucun inscrit cette année-là ».
     */
    filieresEnrichies: (state) => {
      const organisationParId = new Map(
        state.organisation.map((ligne) => [String(ligne.id), ligne])
      );

      return state.items.map((filiere) => {
        const organisation = organisationParId.get(String(filiere.id));
        // `nb_etudiants` de la liste et `effectif` de l'organisation comptent la
        // même chose ; l'organisation restreint en plus aux inscriptions ACTIVE
        // ou VALIDEE, on la préfère quand elle est chargée.
        const effectif = nombre(organisation?.effectif ?? filiere.nb_etudiants);
        const capacite = nombre(organisation?.capacite);
        const nbClasses = nombre(filiere.nb_classes);

        return {
          id: filiere.id,
          code: filiere.code,
          designation: filiere.designation ?? organisation?.filiere ?? '—',
          cycle: filiere.cycle_nom || 'Cycle non renseigné',
          responsable: organisation?.responsable ?? 'Non assigné',
          nbClasses,
          effectif,
          capacite,
          taux: capacite > 0 ? (effectif / capacite) * 100 : 0,
          placesRestantes: Math.max(capacite - effectif, 0),
          tailleMoyenneClasse: nbClasses > 0 ? effectif / nbClasses : 0,
          // Sans organisation chargée, le statut se déduit de ce qu'on a.
          statut:
            organisation?.statut ??
            (nbClasses === 0 ? 'FERMÉE' : effectif > 0 ? 'OUVERTE' : 'VIDE'),
        };
      });
    },

    /**
     * Filières **actives** : celles qui comptent au moins un inscrit sur
     * l'année académique active. Triées par effectif décroissant.
     */
    filieresActives() {
      return this.filieresEnrichies
        .filter((filiere) => filiere.effectif > 0)
        .sort((a, b) => b.effectif - a.effectif);
    },

    /** Filières ouvertes à l'inscription mais encore sans inscrit. */
    filieresSansEffectif() {
      return this.filieresEnrichies.filter((filiere) => filiere.effectif === 0);
    },

    /** Répartition des inscrits par cycle, cycles peuplés d'abord. */
    repartitionParCycle() {
      const parCycle = new Map();

      for (const filiere of this.filieresEnrichies) {
        const cumul = parCycle.get(filiere.cycle) ?? {
          cycle: filiere.cycle,
          effectif: 0,
          capacite: 0,
          nbFilieres: 0,
          nbFilieresActives: 0,
        };

        cumul.effectif += filiere.effectif;
        cumul.capacite += filiere.capacite;
        cumul.nbFilieres += 1;
        if (filiere.effectif > 0) cumul.nbFilieresActives += 1;
        parCycle.set(filiere.cycle, cumul);
      }

      return [...parCycle.values()].sort((a, b) => b.effectif - a.effectif);
    },

    /** Chiffres de tête de l'écran. */
    indicateursFilieres() {
      const filieres = this.filieresEnrichies;
      const effectifTotal = filieres.reduce((somme, filiere) => somme + filiere.effectif, 0);
      const capaciteTotale = filieres.reduce((somme, filiere) => somme + filiere.capacite, 0);
      const nbClasses = filieres.reduce((somme, filiere) => somme + filiere.nbClasses, 0);

      return {
        nbFilieres: filieres.length,
        nbActives: this.filieresActives.length,
        effectifTotal,
        capaciteTotale,
        placesDisponibles: Math.max(capaciteTotale - effectifTotal, 0),
        tauxGlobal: capaciteTotale > 0 ? (effectifTotal / capaciteTotale) * 100 : 0,
        nbClasses,
        tailleMoyenneClasse: nbClasses > 0 ? effectifTotal / nbClasses : 0,
      };
    },

    /**
     * Lectures dérivées des chiffres affichés — la « statistique intelligente »
     * de l'écran. Rien n'y est écrit d'avance : chaque ligne naît d'un test sur
     * les données, et disparaît quand la situation qu'elle décrit disparaît.
     * Triées du plus grave au plus anodin.
     */
    analysesFilieres() {
      const filieres = this.filieresEnrichies;
      if (!filieres.length) return [];

      const { effectifTotal, tauxGlobal, tailleMoyenneClasse } = this.indicateursFilieres;
      const analyses = [];

      const saturees = filieres.filter(
        (filiere) => filiere.capacite > 0 && filiere.taux >= SEUILS.SATUREE
      );
      if (saturees.length) {
        analyses.push({
          ton: 'danger',
          icone: 'bi-exclamation-octagon',
          titre: `${saturees.length} filière(s) au complet`,
          message: `${saturees.map((filiere) => filiere.designation).join(', ')} — plus aucune place déclarée. Ouvrir une classe ou relever la capacité avant la prochaine inscription.`,
        });
      }

      const sansClasse = filieres.filter((filiere) => filiere.nbClasses === 0);
      if (sansClasse.length) {
        analyses.push({
          ton: 'warning',
          icone: 'bi-door-closed',
          titre: `${sansClasse.length} filière(s) sans classe`,
          message: `${sansClasse.map((filiere) => filiere.designation).join(', ')} — une filière sans classe ne peut recevoir aucune inscription.`,
        });
      }

      const tete = this.filieresActives[0];
      if (tete && effectifTotal > 0) {
        const part = (tete.effectif / effectifTotal) * 100;
        if (part >= 50) {
          analyses.push({
            ton: 'warning',
            icone: 'bi-pie-chart',
            titre: 'Effectifs concentrés',
            message: `${tete.designation} rassemble à elle seule ${part.toFixed(1)} % des inscrits (${tete.effectif} sur ${effectifTotal}).`,
          });
        }
      }

      const sousUtilisees = filieres.filter(
        (filiere) =>
          filiere.effectif > 0 && filiere.capacite > 0 && filiere.taux < SEUILS.SOUS_UTILISEE
      );
      if (sousUtilisees.length) {
        analyses.push({
          ton: 'info',
          icone: 'bi-graph-down-arrow',
          titre: `${sousUtilisees.length} filière(s) sous les ${SEUILS.SOUS_UTILISEE} %`,
          message: `${sousUtilisees.map((filiere) => `${filiere.designation} (${filiere.taux.toFixed(1)} %)`).join(', ')} — capacité ouverte mais peu remplie.`,
        });
      }

      const vides = this.filieresSansEffectif;
      if (vides.length) {
        analyses.push({
          ton: 'secondary',
          icone: 'bi-person-x',
          titre: `${vides.length} filière(s) sans inscrit`,
          message: `${vides.map((filiere) => filiere.designation).join(', ')} — aucun inscrit sur l'année académique active.`,
        });
      }

      if (tailleMoyenneClasse > 0) {
        analyses.push({
          ton: 'secondary',
          icone: 'bi-people',
          titre: 'Taille moyenne des classes',
          message: `${tailleMoyenneClasse.toFixed(1)} étudiant(s) par classe, tous cycles confondus, pour un remplissage global de ${tauxGlobal.toFixed(1)} %.`,
        });
      }

      if (!saturees.length && !sansClasse.length && this.filieresActives.length) {
        analyses.push({
          ton: 'success',
          icone: 'bi-check-circle',
          titre: 'Aucune tension de capacité',
          message: `Aucune des ${this.filieresActives.length} filière(s) actives n'a atteint sa capacité, et toutes disposent d'au moins une classe.`,
        });
      }

      return analyses;
    },
  },

  actions: {
    /** @deprecated Utiliser `fetchAll()`. */
    fetchFilieres() {
      return this.fetchAll();
    },

    async fetchOrganisation() {
      return this.run(() => getFiliereOrganisation(), {
        failure: "Échec du chargement de l'organisation des filières.",
        onSuccess: (response) => {
          this.organisation = response.data ?? [];
        },
      });
    },

    /**
     * Charge les filières d'un cycle. Le résultat remplace `items` : cet appel
     * est une vue filtrée de la même collection, pas une collection distincte.
     * @param {string|number} cycleId
     */
    async fetchByCycle(cycleId) {
      return this.run(() => getFilieresByCycle(cycleId), {
        failure: 'Échec du chargement des filières du cycle.',
        onSuccess: (response) => {
          this.items = response.data ?? [];
        },
      });
    },

    /**
     * Les deux lectures dont dépend l'onglet « Statistiques », en parallèle.
     * La liste passe par le cache du store ; l'organisation, non cachée, donne
     * les capacités que la liste n'a pas.
     * @param {object} [options]
     * @param {boolean} [options.force] Ignore le cache de la liste.
     */
    async fetchAnalyse({ force = false } = {}) {
      await Promise.all([this.fetchAll({ force }), this.fetchOrganisation()]);
    },

    /** @param {string|number} id */
    async fetchStats(id) {
      return this.run(() => getFiliereStats(id), {
        failure: 'Échec du chargement des statistiques.',
        onSuccess: (response) => {
          this.stats = response.data ?? null;
        },
      });
    },
  },
});
