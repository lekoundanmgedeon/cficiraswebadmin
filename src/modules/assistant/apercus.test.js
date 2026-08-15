import { describe, expect, it } from 'vitest';
import { APERCUS, apercusPour, domaineInfo } from './apercus';

/**
 * Ce que ces tests verrouillent : **aucune tuile hors du périmètre du rôle**.
 *
 * Le catalogue est filtré par rôle côté serveur ; proposer un aperçu financier
 * à qui n'a aucune vue financière produirait un refus du garde SQL — un bouton
 * qui ment, exactement ce que ce dépôt passe son temps à retirer.
 */

const catalogue = (domaines) => ({ nbVues: domaines.length, domaines, vues: [] });

describe('apercusPour', () => {
  it('ne propose que les domaines du catalogue de l’appelant', () => {
    const groupes = apercusPour(catalogue(['academique', 'evaluations']));

    expect(groupes.map((g) => g.domaine)).toEqual(['academique', 'evaluations']);
  });

  it('n’expose aucune tuile financière à un rôle sans vue financière', () => {
    const groupes = apercusPour(catalogue(['academique', 'pedagogie']));
    const questions = groupes.flatMap((g) => g.apercus.map((a) => a.question));

    expect(groupes.some((g) => g.domaine === 'finances')).toBe(false);
    expect(questions.some((q) => q.includes('impayés'))).toBe(false);
  });

  it('affiche les domaines dans l’ordre de la table, pas dans celui du serveur', () => {
    // Le serveur trie ses domaines alphabétiquement : « académique » y passerait
    // après « concours ». La première tuile doit être celle qui concerne le
    // plus de monde.
    const groupes = apercusPour(catalogue(['finances', 'concours', 'academique']));

    expect(groupes.map((g) => g.domaine)).toEqual(['academique', 'finances', 'concours']);
  });

  it('ignore un domaine que le serveur déclare sans qu’on sache quoi y demander', () => {
    // Mieux vaut une case absente qu'une question inventée depuis un nom de vue.
    expect(apercusPour(catalogue(['un_domaine_inconnu']))).toEqual([]);
  });

  it('ne rend rien tant que le catalogue n’est pas chargé', () => {
    expect(apercusPour(null)).toEqual([]);
    expect(apercusPour({})).toEqual([]);
  });
});

describe('Les questions proposées restent dans ce que la base sait établir', () => {
  it('ne demande jamais un taux de remplissage ailleurs que par classe', () => {
    // `v_organisation_filieres` et `v_organisation_cycles` somment les capacités
    // après une jointure sur les inscriptions : 33 790 places annoncées pour
    // 5 400 réelles.
    const remplissage = APERCUS.academique.filter((a) => a.question.includes('remplissage'));

    expect(remplissage).toHaveLength(1);
    expect(remplissage[0].question).toContain('classes');
  });

  it('compte les enseignants « distincts »', () => {
    // `vue_infos_enseignants` rend une ligne par diplôme ET par contrat : un
    // COUNT nu y compte les diplômes.
    const comptage = APERCUS.pedagogie.find((a) => a.question.includes('enseignants'));

    expect(comptage.question).toContain('distincts');
  });

  it('donne à chaque aperçu un libellé, une icône et une question', () => {
    for (const apercus of Object.values(APERCUS)) {
      for (const apercu of apercus) {
        expect(apercu.libelle).toBeTruthy();
        expect(apercu.icone).toMatch(/^bi-/);
        expect(apercu.question.length).toBeGreaterThan(10);
      }
    }
  });
});

describe('domaineInfo', () => {
  it('nomme les domaines connus', () => {
    expect(domaineInfo('evaluations').libelle).toBe('Évaluations');
  });

  it('rend la clé telle quelle pour un domaine que le front ignore', () => {
    // Un domaine ajouté au catalogue serveur doit s'afficher, pas disparaître.
    expect(domaineInfo('bibliotheque').libelle).toBe('bibliotheque');
  });
});
