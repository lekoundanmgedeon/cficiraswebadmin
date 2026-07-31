import { createCrudStore } from '@/core/store/createCrudStore';
import { ouvragesResource, getMemoires, getStatistiquesFonds } from './api';

/** `pg` sert ses `COUNT` et ses `SUM` en chaînes. */
const nombre = (valeur) => Number(valeur ?? 0) || 0;

/**
 * Store de la bibliothèque.
 *
 * Deux collections distinctes, et c'est voulu : `items` est le **catalogue**
 * (ce que l'établissement a acquis), `memoires` le **dépôt académique** (ce que
 * ses étudiants ont produit). Les fondre reviendrait à confondre un livre acheté
 * et un mémoire soutenu, qui n'ont ni le même cycle de vie ni le même écran.
 */
export const useBibliothequeStore = createCrudStore({
  id: 'bibliotheque',
  resource: ouvragesResource,
  label: 'Ouvrage',
  cacheKey: 'ouvrages',

  state: () => ({
    /** @type {any[]} Mémoires et thèses soutenus. */
    memoires: [],
    /** @type {object|null} Compteurs du fonds. */
    statistiques: null,
  }),

  getters: {
    /** Catégories réellement présentes au catalogue, pour le filtre. */
    categories: (state) =>
      [...new Set(state.items.map((ouvrage) => ouvrage.categorie).filter(Boolean))].sort((a, b) =>
        a.localeCompare(b)
      ),

    /** Titres dont plus aucun exemplaire n'est en rayon. */
    indisponibles: (state) => state.items.filter((ouvrage) => nombre(ouvrage.nb_disponibles) === 0),

    /** Mémoires effectivement publiés — les seuls consultables. */
    memoiresPublies: (state) => state.memoires.filter((memoire) => memoire.est_publie),

    /** Cumuls du fonds, dérivés du catalogue chargé. */
    indicateurs: (state) => {
      const exemplaires = state.items.reduce(
        (somme, ouvrage) => somme + nombre(ouvrage.nb_exemplaires),
        0
      );
      const disponibles = state.items.reduce(
        (somme, ouvrage) => somme + nombre(ouvrage.nb_disponibles),
        0
      );

      return {
        nbTitres: state.items.length,
        exemplaires,
        disponibles,
        sortis: Math.max(exemplaires - disponibles, 0),
        nbMemoires: state.memoires.length,
      };
    },
  },

  actions: {
    /** @param {{publies?: boolean, type_travail?: string, q?: string}} [params] */
    async fetchMemoires(params) {
      return this.run(() => getMemoires(params), {
        failure: 'Erreur lors du chargement des mémoires et thèses.',
        onSuccess: (response) => {
          this.memoires = response.data ?? [];
        },
      });
    },

    async fetchStatistiques() {
      return this.run(() => getStatistiquesFonds(), {
        failure: 'Erreur lors du chargement des statistiques du fonds.',
        onSuccess: (response) => {
          this.statistiques = response.data ?? null;
        },
      });
    },
  },
});
