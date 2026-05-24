import { defineStore } from 'pinia';
import {
  getBulletinsByClasse,
  getBulletinEtudiant,
  updateDecisionJury,
  publierBulletinsClasse,
} from '@/api/evaluations/resultatApi';
import { useMessageStore } from '@/stores/messages/messageStore';
import { extractErrorMessage } from '@/stores/messages/useErrorMessage';

export const useResultatStore = defineStore('resultatStore', {
  state: () => ({
    bulletinsClasse: [],
    bulletinEtudiant: null,
    loading: false,
  }),

  actions: {
    // Consulter le palmarès d'une classe
    async fetchBulletinsByClasse(classeId) {
      const messageStore = useMessageStore();
      this.loading = true;
      try {
        const response = await getBulletinsByClasse(classeId);
        this.bulletinsClasse = response.data;
      } catch (error) {
        messageStore.notifyError(extractErrorMessage(error, 'Erreur lors du chargement des bulletins de la classe.'));
      } finally {
        this.loading = false;
      }
    },

    // Consulter le bulletin individuel d'un étudiant
    async fetchBulletinEtudiant(etudiantId, semestreId) {
      const messageStore = useMessageStore();
      this.loading = true;
      try {
        const response = await getBulletinEtudiant(etudiantId, semestreId);
        this.bulletinEtudiant = response.data;
      } catch (error) {
        messageStore.notifyError(extractErrorMessage(error, 'Erreur lors du chargement du bulletin de l’étudiant.'));
      } finally {
        this.loading = false;
      }
    },

    // Action du jury de délibération
    async changeDecisionJury(id, data) {
      const messageStore = useMessageStore();
      this.loading = true;
      try {
        await updateDecisionJury(id, data);
        messageStore.notifySuccess('Décision du jury mise à jour avec succès.');
        await this.fetchBulletinsByClasse(data.classeId);
      } catch (error) {
        messageStore.notifyError(extractErrorMessage(error, 'Erreur lors de la mise à jour de la décision du jury.'));
      } finally {
        this.loading = false;
      }
    },

    // Action administrative : Publication officielle
    async publishBulletinsClasse(classeId) {
      const messageStore = useMessageStore();
      this.loading = true;
      try {
        await publierBulletinsClasse(classeId);
        messageStore.notifySuccess('Bulletins publiés officiellement.');
        await this.fetchBulletinsByClasse(classeId);
      } catch (error) {
        messageStore.notifyError(extractErrorMessage(error, 'Erreur lors de la publication des bulletins.'));
      } finally {
        this.loading = false;
      }
    },
  },
});
