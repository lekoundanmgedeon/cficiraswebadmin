import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useDocumentStore } from './store';
import * as api from './api';
import { transitionsDepuis, estClose } from './constants';

vi.mock('vue3-toastify', () => ({
  toast: Object.assign(vi.fn(), {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  }),
}));

/** Charge utile réelle de `v_demandes_documents`. */
const DEMANDES = {
  success: true,
  data: [
    {
      id: 'd1',
      numero: 'ATT-2026-0001',
      etudiant_id: 'e1',
      matricule: 'ETU-001',
      nom: 'BAVOGUI',
      prenom: 'Koïkoï',
      type_document: 'ATTESTATION_INSCRIPTION',
      type_libelle: "Attestation d'inscription",
      statut: 'SOUMISE',
      urgence: true,
      en_retard: true,
      jours_restants: -2,
      nb_exemplaires: 1,
      date_demande: '2026-07-20T10:00:00.000Z',
      date_echeance: '2026-07-22',
    },
    {
      id: 'd2',
      numero: 'CSC-2026-0001',
      etudiant_id: 'e2',
      matricule: 'ETU-002',
      nom: 'CAMARA',
      prenom: 'Ibrahima',
      type_document: 'CERTIFICAT_SCOLARITE',
      type_libelle: 'Certificat de scolarité',
      statut: 'PRETE',
      urgence: false,
      en_retard: false,
      jours_restants: 1,
      nb_exemplaires: 2,
      date_demande: '2026-07-29T10:00:00.000Z',
      date_echeance: '2026-08-01',
    },
    {
      id: 'd3',
      numero: 'DIP-2026-0001',
      etudiant_id: 'e3',
      matricule: 'ETU-003',
      nom: 'SOW',
      prenom: 'Awa',
      type_document: 'DIPLOME',
      type_libelle: 'Diplôme',
      statut: 'DELIVREE',
      urgence: false,
      en_retard: false,
      date_demande: '2026-06-01T10:00:00.000Z',
      date_delivrance: '2026-06-20T10:00:00.000Z',
    },
    {
      id: 'd4',
      numero: 'DUP-2026-0001',
      etudiant_id: 'e4',
      matricule: 'ETU-004',
      nom: 'DIALLO',
      prenom: 'Mariam',
      type_document: 'DUPLICATA_DIPLOME',
      type_libelle: 'Duplicata de diplôme',
      statut: 'REJETEE',
      motif_rejet: 'Scolarité non soldée',
      urgence: false,
      en_retard: false,
      date_demande: '2026-06-05T10:00:00.000Z',
    },
  ],
};

const TYPES = {
  success: true,
  data: [
    {
      code: 'ATTESTATION_INSCRIPTION',
      libelle: "Attestation d'inscription",
      prefixe: 'ATT',
      delai_jours: 2,
      requiert_annee: true,
      requiert_classe: true,
      actif: true,
    },
  ],
};

describe('guichet des documents', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.restoreAllMocks();
  });

  const charger = async () => {
    vi.spyOn(api, 'getDemandes').mockResolvedValue(DEMANDES);
    vi.spyOn(api, 'getTypesDocuments').mockResolvedValue(TYPES);
    vi.spyOn(api, 'getStatistiquesDemandes').mockResolvedValue({ success: true, data: {} });

    const store = useDocumentStore();
    await Promise.all([store.fetchAll(), store.fetchTypes()]);
    return store;
  };

  it('sépare ce qui est encore au guichet de ce qui en est sorti', async () => {
    const store = await charger();

    // « Traitée » veut dire sortie du circuit — délivrée ou rejetée —, pas
    // « prise en charge » : une demande en traitement est encore ouverte.
    expect(store.enCours.map((d) => d.numero)).toEqual(['ATT-2026-0001', 'CSC-2026-0001']);
    expect(store.traitees.map((d) => d.numero)).toEqual(['DIP-2026-0001', 'DUP-2026-0001']);
  });

  it('remonte les retards et les urgences, calculés par le serveur', async () => {
    const store = await charger();

    expect(store.enRetard.map((d) => d.numero)).toEqual(['ATT-2026-0001']);
    expect(store.urgentes.map((d) => d.numero)).toEqual(['ATT-2026-0001']);
  });

  it('ne relit pas le catalogue une seconde fois', async () => {
    const store = await charger();
    await store.fetchTypes();

    // Les types changent rarement : les relire à chaque onglet ne sert à rien.
    expect(api.getTypesDocuments).toHaveBeenCalledTimes(1);
    expect(store.typeParCode('ATTESTATION_INSCRIPTION').prefixe).toBe('ATT');
  });

  it('reprend le message du serveur, qui porte le numéro attribué', async () => {
    const store = await charger();
    vi.spyOn(api, 'createDemande').mockResolvedValue({
      success: true,
      message: 'Demande enregistrée sous le numéro ATT-2026-0002.',
      data: { id: 'd5', numero: 'ATT-2026-0002', statut: 'SOUMISE' },
    });

    const demande = await store.create({
      etudiant_id: 'e1',
      type_document: 'ATTESTATION_INSCRIPTION',
    });

    // Le numéro vient de `fn_numero_document`, jamais du client : en fabriquer
    // un second ici, c'est prendre le risque qu'il diverge.
    expect(demande.numero).toBe('ATT-2026-0002');
  });

  it('transmet la transition demandée et son motif', async () => {
    const store = await charger();
    const patch = vi.spyOn(api, 'changerStatutDemande').mockResolvedValue({
      success: true,
      data: { id: 'd1', statut: 'REJETEE' },
    });

    await store.changerStatut('d1', 'REJETEE', { motif_rejet: 'Dossier incomplet' });

    expect(patch).toHaveBeenCalledWith('d1', 'REJETEE', { motif_rejet: 'Dossier incomplet' });
  });
});

describe('circuit d’une demande — miroir des règles du serveur', () => {
  it('ne propose que les transitions que le serveur accepte', () => {
    expect(transitionsDepuis('SOUMISE').map((t) => t.code)).toEqual([
      'EN_TRAITEMENT',
      'PRETE',
      'REJETEE',
    ]);
    // On ne délivre pas un document qui n'est pas prêt.
    expect(transitionsDepuis('SOUMISE').map((t) => t.code)).not.toContain('DELIVREE');
    expect(transitionsDepuis('PRETE').map((t) => t.code)).toEqual(['DELIVREE']);
  });

  it('ne propose plus rien sur une demande close', () => {
    expect(transitionsDepuis('DELIVREE')).toEqual([]);
    expect(transitionsDepuis('REJETEE')).toEqual([]);
    expect(estClose('DELIVREE')).toBe(true);
    expect(estClose('EN_TRAITEMENT')).toBe(false);
  });
});
