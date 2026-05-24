import { defineStore } from 'pinia';
import { useAnneeStore } from './anneStore';
import { useCycleStore } from './cycleStore';
import { useClasseStore } from './classeStore';
import { useFiliereStore } from './filiereStore';
import { useNiveauStore } from './niveauStore';
import { useSemestreStore } from './semestreStore';
import { useInscriptionStore } from './inscriptionStore';

export const useAcademiqueStore = defineStore('academiqueStore', {
  state: () => ({
    loading: false,
  }),

  actions: {
    // Initialisation globale : charger toutes les entités
    async initAll() {
      this.loading = true;
      try {
        const anneeStore = useAnneeStore();
        const cycleStore = useCycleStore();
        const classeStore = useClasseStore();
        const filiereStore = useFiliereStore();
        const niveauStore = useNiveauStore();
        const semestreStore = useSemestreStore();
        const inscriptionStore = useInscriptionStore();

        await Promise.all([
          anneeStore.fetchAnneesAcademiques(),
          cycleStore.fetchCycles(),
          classeStore.fetchClasses(),
          filiereStore.fetchFilieres(),
          niveauStore.fetchNiveaux(),
          semestreStore.fetchSemestres(),
          inscriptionStore.fetchInscriptions(),
        ]);
      } catch (error) {
        console.error('Erreur lors de l’initialisation globale :', error);
      } finally {
        this.loading = false;
      }
    },

    // Accès rapide aux sous-stores
    getAnneeStore() {
      return useAnneeStore();
    },
    getCycleStore() {
      return useCycleStore();
    },
    getClasseStore() {
      return useClasseStore();
    },
    getFiliereStore() {
      return useFiliereStore();
    },
    getNiveauStore() {
      return useNiveauStore();
    },
    getSemestreStore() {
      return useSemestreStore();
    },
    getInscriptionStore() {
      return useInscriptionStore();
    },
  },
});
