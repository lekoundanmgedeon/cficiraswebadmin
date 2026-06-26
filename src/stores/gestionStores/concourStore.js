import { defineStore } from 'pinia';
import {
  getConcours,
  getConcoursById,
  createConcours,
  updateConcours,
  changeConcoursStatut,
  deleteConcours,
  getEpreuvesByConcours,
  getEpreuveById,
  createEpreuve,
  updateEpreuve,
  deleteEpreuve,
  calculerMoyennesEtRangs,
  proclamerAdmissions,
  downloadAdmis,
} from '@/api/gestions/gestionApi';
import { useMessageStore } from '@/stores/messages/messageStore';
import { extractErrorMessage } from '@/stores/messages/useErrorMessage';

export const useConcoursStore = defineStore('concoursStore', {
  state: () => ({
    concoursList: [],
    concours: null,
    epreuvesList: [], // Liste des épreuves du concours sélectionné
    epreuve: null, // Épreuve active pour consultation/édition
    moyennesRangs: null,
    loading: false,
  }),

  actions: {
    // =========================================================================
    // ACTIONS CONCOURS
    // =========================================================================
    async fetchConcours() {
      const messageStore = useMessageStore();
      this.loading = true;
      try {
        const response = await getConcours();
        this.concoursList = response.data;
      } catch (error) {
        messageStore.notifyError(
          extractErrorMessage(error, 'Erreur lors du chargement des concours.')
        );
      } finally {
        this.loading = false;
      }
    },

    async fetchConcoursById(id) {
      const messageStore = useMessageStore();
      this.loading = true;
      try {
        const response = await getConcoursById(id);
        this.concours = response.data;
      } catch (error) {
        messageStore.notifyError(
          extractErrorMessage(error, 'Erreur lors du chargement du concours.')
        );
      } finally {
        this.loading = false;
      }
    },

    async addConcours(data) {
      const messageStore = useMessageStore();
      this.loading = true;
      try {
        await createConcours(data);
        messageStore.notifySuccess('Concours créé avec succès.');
        await this.fetchConcours();
      } catch (error) {
        messageStore.notifyError(
          extractErrorMessage(error, 'Erreur lors de la création du concours.')
        );
      } finally {
        this.loading = false;
      }
    },

    async editConcours(id, data) {
      const messageStore = useMessageStore();
      this.loading = true;
      try {
        await updateConcours(id, data);
        messageStore.notifySuccess('Concours mis à jour avec succès.');
        await this.fetchConcours();
      } catch (error) {
        messageStore.notifyError(
          extractErrorMessage(error, 'Erreur lors de la mise à jour du concours.')
        );
      } finally {
        this.loading = false;
      }
    },

    async changeStatut(id, data) {
      const messageStore = useMessageStore();
      this.loading = true;
      try {
        await changeConcoursStatut(id, data);
        messageStore.notifySuccess('Statut du concours modifié avec succès.');
        await this.fetchConcoursById(id);
      } catch (error) {
        messageStore.notifyError(
          extractErrorMessage(error, 'Erreur lors du changement de statut.')
        );
      } finally {
        this.loading = false;
      }
    },

    async removeConcours(id) {
      const messageStore = useMessageStore();
      this.loading = true;
      try {
        await deleteConcours(id);
        messageStore.notifySuccess('Concours supprimé avec succès.');
        await this.fetchConcours();
      } catch (error) {
        messageStore.notifyError(
          extractErrorMessage(error, 'Erreur lors de la suppression du concours.')
        );
      } finally {
        this.loading = false;
      }
    },

    // =========================================================================
    // ACTIONS ÉPREUVES (Ajoutées pour s'aligner sur les routes)
    // =========================================================================

    // Récupérer toutes les épreuves d'un concours spécifique
    async fetchEpreuvesByConcours(concoursId) {
      const messageStore = useMessageStore();
      this.loading = true;
      try {
        const response = await getEpreuvesByConcours(concoursId);
        this.epreuvesList = response.data;
      } catch (error) {
        messageStore.notifyError(
          extractErrorMessage(error, 'Erreur lors du chargement des épreuves.')
        );
      } finally {
        this.loading = false;
      }
    },

    // Récupérer une épreuve spécifique par son ID
    async fetchEpreuveById(id) {
      const messageStore = useMessageStore();
      this.loading = true;
      try {
        const response = await getEpreuveById(id);
        this.epreuve = response.data;
      } catch (error) {
        messageStore.notifyError(
          extractErrorMessage(error, "Erreur lors du chargement de l'épreuve.")
        );
      } finally {
        this.loading = false;
      }
    },

    // Créer une épreuve
    // Note : Pense à passer le `concours_id` (ou concoursId) dans ton objet payload `data`
    async addEpreuve(data) {
      const messageStore = useMessageStore();
      this.loading = true;
      try {
        await createEpreuve(data);
        messageStore.notifySuccess('Épreuve ajoutée avec succès.');
        // Rafraîchit la liste si un concours est actuellement ciblé dans le payload
        if (data.concoursId || data.concours_id) {
          await this.fetchEpreuvesByConcours(data.concoursId || data.concours_id);
        }
      } catch (error) {
        messageStore.notifyError(
          extractErrorMessage(error, "Erreur lors de l'ajout de l'épreuve.")
        );
      } finally {
        this.loading = false;
      }
    },

    // Mettre à jour une épreuve
    async editEpreuve(id, data) {
      const messageStore = useMessageStore();
      this.loading = true;
      try {
        await updateEpreuve(id, data);
        messageStore.notifySuccess('Épreuve mise à jour avec succès.');
        // Rafraîchit la liste pour le concours ciblé
        if (data.concoursId || data.concours_id) {
          await this.fetchEpreuvesByConcours(data.concoursId || data.concours_id);
        }
      } catch (error) {
        messageStore.notifyError(
          extractErrorMessage(error, "Erreur lors de la modification de l'épreuve.")
        );
      } finally {
        this.loading = false;
      }
    },

    // Supprimer une épreuve
    // `currentConcoursId` permet de recharger la liste des épreuves du concours parent juste après la suppression
    async removeEpreuve(id, currentConcoursId = null) {
      const messageStore = useMessageStore();
      this.loading = true;
      try {
        await deleteEpreuve(id);
        messageStore.notifySuccess('Épreuve supprimée avec succès.');
        if (currentConcoursId) {
          await this.fetchEpreuvesByConcours(currentConcoursId);
        }
      } catch (error) {
        messageStore.notifyError(
          extractErrorMessage(error, "Erreur lors de la suppression de l'épreuve.")
        );
      } finally {
        this.loading = false;
      }
    },

    // =========================================================================
    // ACTIONS CLASSEMENTS & RÉSULTATS
    // =========================================================================
    async fetchMoyennesRangs(id) {
      const messageStore = useMessageStore();
      this.loading = true;
      try {
        const response = await calculerMoyennesEtRangs(id);
        this.moyennesRangs = response.data;
      } catch (error) {
        messageStore.notifyError(
          extractErrorMessage(error, 'Erreur lors du calcul des moyennes et rangs.')
        );
      } finally {
        this.loading = false;
      }
    },

    async proclaimAdmissions(id) {
      const messageStore = useMessageStore();
      this.loading = true;
      try {
        await proclamerAdmissions(id);
        messageStore.notifySuccess('Admissions proclamées avec succès.');
        await this.fetchConcoursById(id);
      } catch (error) {
        messageStore.notifyError(
          extractErrorMessage(error, 'Erreur lors de la proclamation des admissions.')
        );
      } finally {
        this.loading = false;
      }
    },

    async downloadAdmisList(id, format = 'pdf') {
      const messageStore = useMessageStore();
      this.loading = true;
      try {
        // Passage du format à la fonction API
        const response = await downloadAdmis(id, format);

        // Détermination dynamique du Type MIME
        const mimeType =
          format === 'pdf'
            ? 'application/pdf'
            : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

        const blob = new Blob([response.data], { type: mimeType });
        const url = window.URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;

        // Extension dynamique (.pdf ou .xlsx)
        link.download = `admis_concours_${id}.${format}`;

        link.click();
        window.URL.revokeObjectURL(url); // Libération de la mémoire

        messageStore.notifySuccess(
          `Liste des admis téléchargée au format ${format.toUpperCase()}.`
        );
      } catch (error) {
        messageStore.notifyError(
          extractErrorMessage(error, 'Erreur lors du téléchargement de la liste des admis.')
        );
      } finally {
        this.loading = false;
      }
    },
  },
});
