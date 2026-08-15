import { describe, expect, it } from 'vitest';
import { filEnCsv, filEnMarkdown } from './export';

const fil = {
  titre: 'Bilan financier par filière',
  cadrage: 'finances',
  debut: '2026-08-02T09:12:00.000Z',
  echanges: [
    {
      question: 'Quel est le bilan par filière ?',
      reponse: '| Filière | Encaissé |\n| --- | ---: |\n| GRH | 12 000 |',
      aboutie: true,
      dureeMs: 2400,
      cadrage: 'finances',
      requetes: [{ intention: 'agréger', sql: 'SELECT * FROM v_finances', nbLignes: 4 }],
      horodatage: '2026-08-02T09:12:00.000Z',
    },
    {
      question: 'Et par cycle ?',
      reponse: null,
      aboutie: false,
      erreur: 'Le budget par minute est saturé.',
      horodatage: '2026-08-02T09:15:00.000Z',
      requetes: [],
    },
  ],
};

describe('Export Markdown', () => {
  it('date chaque échange', () => {
    // Une réponse d'assistant est un instantané : sortie du fil sans sa date,
    // elle se lirait comme un chiffre encore valable.
    const markdown = filEnMarkdown(fil);

    expect(markdown).toContain('02 août 2026');
    expect(markdown).toContain('Les chiffres cités sont ceux relevés au moment de chaque réponse.');
  });

  it('conserve les tableaux tels quels', () => {
    // C'est la raison de ne pas passer par `useTableExport` : le modèle produit
    // déjà du Markdown, un export tabulaire l'écraserait en une cellule.
    expect(filEnMarkdown(fil)).toContain('| Filière | Encaissé |');
  });

  it('dit qu’un échange n’a pas abouti plutôt que de le taire', () => {
    const markdown = filEnMarkdown(fil);

    expect(markdown).toContain('Et par cycle ?');
    expect(markdown).toContain('Le budget par minute est saturé.');
  });

  it('n’écrit du SQL que si le serveur en a rendu', () => {
    // Le serveur ne joint les requêtes que pour un ADMIN : le filtrage a déjà
    // eu lieu, l'export ne le refait pas — mais il ne doit rien inventer non
    // plus quand `requetes` est vide.
    expect(filEnMarkdown(fil)).toContain('SELECT * FROM v_finances');

    const sansSql = filEnMarkdown({
      ...fil,
      echanges: fil.echanges.map((e) => ({ ...e, requetes: [] })),
    });
    expect(sansSql).not.toContain('```sql');
  });
});

describe('Export CSV', () => {
  it('double les guillemets et entoure chaque champ', () => {
    // Une réponse contient des virgules, des retours à la ligne et des
    // guillemets — les trois à la fois.
    const csv = filEnCsv({
      echanges: [
        {
          question: 'Combien, au total ?',
          reponse: 'Il a dit « 12 » puis "13"',
          aboutie: true,
          horodatage: '2026-08-02T09:12:00.000Z',
        },
      ],
    });

    expect(csv).toContain('"Il a dit « 12 » puis ""13"""');
  });

  it('commence par un BOM, sans quoi Excel lit « encaissÃ© »', () => {
    expect(filEnCsv(fil).startsWith('\uFEFF')).toBe(true);
  });

  it('rend une ligne par échange, en-tête compris', () => {
    // Le fil de référence porte un tableau markdown, donc des retours à la
    // ligne *dans* une cellule : compter les `\n` y donnerait un faux total.
    // C'est justement ce que les guillemets RFC 4180 permettent.
    const plat = {
      echanges: fil.echanges.map((e) => ({ ...e, reponse: 'Réponse courte.' })),
    };

    expect(filEnCsv(plat).split('\n')).toHaveLength(3);
  });

  it('note l’échec en clair plutôt que de laisser la cellule vide', () => {
    expect(filEnCsv(fil)).toContain('"Le budget par minute est saturé."');
    expect(filEnCsv(fil)).toContain('"non"');
  });
});
