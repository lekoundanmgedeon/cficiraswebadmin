import { escapeHtml } from '@/shared/utils/text';
import { infoType, JOURS, ordreJour, plageHoraire } from '../constants';

/**
 * Publication de l'emploi du temps : le document d'affichage.
 *
 * L'export Excel du bandeau sert à **retravailler** la donnée — une ligne par
 * créneau, dix colonnes. Ce n'est pas ce qu'on affiche sur la porte d'une salle
 * ni ce qu'on remet à une classe : un emploi du temps se lit en **grille**, les
 * jours en colonnes et les tranches horaires en lignes, une page par classe.
 *
 * D'où ce second document. Il est composé en HTML puis confié à la fenêtre
 * d'impression du navigateur — le même procédé que les reçus de caisse
 * (`finances/utils/recu.js`) : pas de balisage ajouté aux écrans, et le
 * navigateur gère seul la pagination A4 et l'enregistrement en PDF.
 *
 * ## Ce que « dynamique » veut dire ici
 *
 * Rien n'est figé dans le gabarit : les **tranches horaires** sont celles que
 * les créneaux portent réellement (une classe qui commence à 7 h 30 aura sa
 * ligne 7 h 30), les **jours** affichés sont ceux qui comptent au moins un
 * cours, et une case vide reste vide plutôt que d'inventer une heure creuse.
 * Un établissement qui change ses horaires n'a rien à modifier ici.
 */

/** Clé d'une tranche horaire : deux créneaux de mêmes bornes partagent la ligne. */
const cleTranche = (creneau) => `${creneau.heure_debut ?? ''}|${creneau.heure_fin ?? ''}`;

/**
 * Regroupe les créneaux par classe, puis en grille jour × tranche horaire.
 *
 * Exporté pour être testé : c'est la seule partie qui décide de quelque chose,
 * le reste n'est que du balisage.
 *
 * @param {Array<object>} creneaux
 * @returns {Array<{classe: string, filiere: string, cycle: string, effectif: number|null,
 *   jours: Array<{id: string, label: string}>,
 *   tranches: Array<{cle: string, label: string, cases: Record<string, Array<object>>}>,
 *   total: number}>}
 */
export function grillesParClasse(creneaux) {
  const parClasse = new Map();

  for (const creneau of creneaux) {
    const classe = creneau.classe_code ?? creneau.classe ?? '—';
    if (!parClasse.has(classe)) parClasse.set(classe, []);
    parClasse.get(classe).push(creneau);
  }

  return [...parClasse.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([classe, lignes]) => {
      // Les jours réellement occupés, dans l'ordre de la semaine : afficher un
      // samedi vide sur toutes les pages ne renseigne personne.
      const joursOccupes = [...new Set(lignes.map((c) => String(c.jour ?? '').toUpperCase()))]
        .filter(Boolean)
        .sort((a, b) => ordreJour(a) - ordreJour(b))
        .map((id) => ({
          id,
          label: JOURS.find((jour) => jour.id === id)?.label ?? id,
        }));

      const tranches = new Map();

      for (const creneau of lignes) {
        const cle = cleTranche(creneau);
        if (!tranches.has(cle)) {
          tranches.set(cle, {
            cle,
            debut: creneau.heure_debut ?? '',
            label: plageHoraire(creneau),
            cases: {},
          });
        }

        const jour = String(creneau.jour ?? '').toUpperCase();
        const tranche = tranches.get(cle);
        // Un tableau, et non une valeur : deux cours au même créneau pour une
        // même classe sont un conflit d'agenda, et le document doit le montrer
        // au lieu d'en masquer un.
        (tranche.cases[jour] ??= []).push(creneau);
      }

      const premier = lignes[0] ?? {};

      return {
        classe,
        filiere: premier.filiere ?? '',
        cycle: premier.cycle_code ?? premier.cycle ?? '',
        effectif: premier.capacite_max ?? null,
        jours: joursOccupes,
        tranches: [...tranches.values()].sort((a, b) =>
          String(a.debut).localeCompare(String(b.debut))
        ),
        total: lignes.length,
      };
    });
}

/** @param {Array<object>} cours */
const celluleHtml = (cours) =>
  cours
    .map((creneau) => {
      const type = infoType(creneau.type_cours);
      const salle = creneau.salle_nom ?? creneau.code_salle ?? '';

      return `
        <div class="cours">
          <span class="matiere">${escapeHtml(creneau.nom_module ?? '—')}</span>
          <span class="type">${escapeHtml(type.label)}</span>
          ${creneau.enseignant ? `<span class="detail">${escapeHtml(creneau.enseignant)}</span>` : ''}
          ${salle ? `<span class="detail salle">Salle ${escapeHtml(String(salle))}</span>` : ''}
        </div>`;
    })
    .join('');

/** @param {object} grille */
const pageClasseHtml = (grille, contexte) => {
  const entetes = grille.jours.map((jour) => `<th>${escapeHtml(jour.label)}</th>`).join('');

  const lignes = grille.tranches
    .map((tranche) => {
      const cases = grille.jours
        .map((jour) => {
          const cours = tranche.cases[jour.id] ?? [];
          const conflit = cours.length > 1 ? ' conflit' : '';
          return `<td class="case${conflit}">${cours.length ? celluleHtml(cours) : ''}</td>`;
        })
        .join('');

      return `<tr><th class="heure">${escapeHtml(tranche.label)}</th>${cases}</tr>`;
    })
    .join('');

  const sousTitre = [grille.filiere, grille.cycle && `Cycle ${grille.cycle}`]
    .filter(Boolean)
    .map((valeur) => escapeHtml(String(valeur)))
    .join(' · ');

  return `
    <section class="page">
      <header class="entete">
        <div>
          <h1>${escapeHtml(grille.classe)}</h1>
          <p class="sous-titre">${sousTitre || 'Classe'}</p>
        </div>
        <div class="meta">
          <span>${grille.total} créneau(x) · ${grille.jours.length} jour(s)</span>
          ${contexte.periode ? `<span>${escapeHtml(contexte.periode)}</span>` : ''}
          <span>Édité le ${escapeHtml(contexte.date)}</span>
        </div>
      </header>

      <table class="grille">
        <thead>
          <tr><th class="heure">Horaire</th>${entetes}</tr>
        </thead>
        <tbody>${lignes}</tbody>
      </table>

      <footer class="pied">
        ${escapeHtml(contexte.etablissement)} — emploi du temps affiché sous réserve de modification.
      </footer>
    </section>`;
};

const STYLE = `
  @page { size: A4 landscape; margin: 10mm; }
  * { box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; color: #212529; margin: 0; }

  .page { page-break-after: always; padding: 0 0 6mm; }
  .page:last-child { page-break-after: auto; }

  .entete { display: flex; justify-content: space-between; align-items: flex-end;
            border-bottom: 2px solid #4b49ac; padding-bottom: 6px; margin-bottom: 10px; }
  h1 { font-size: 20px; margin: 0; color: #4b49ac; }
  .sous-titre { margin: 2px 0 0; color: #6c757d; font-size: 12px; }
  .meta { text-align: right; font-size: 10px; color: #6c757d; display: flex;
          flex-direction: column; gap: 2px; }

  table.grille { width: 100%; border-collapse: collapse; table-layout: fixed; }
  table.grille th, table.grille td { border: 1px solid #dee2e6; vertical-align: top; }
  table.grille thead th { background: #4b49ac; color: #fff; font-size: 11px;
                          text-transform: uppercase; letter-spacing: .5px; padding: 6px 4px; }
  th.heure { width: 78px; background: #f1f3f9; font-family: monospace; font-size: 10px;
             color: #495057; padding: 6px 4px; white-space: nowrap; }
  td.case { height: 62px; padding: 4px; }
  /* Deux cours sur la même case : c'est un conflit d'agenda, on le signale. */
  td.case.conflit { background: #fff5f5; border-color: #dc3545; }

  .cours { border-left: 3px solid #4b49ac; padding-left: 5px; margin-bottom: 4px; }
  .cours:last-child { margin-bottom: 0; }
  .matiere { display: block; font-size: 11px; font-weight: bold; }
  .type { display: block; font-size: 9px; color: #4b49ac; text-transform: uppercase; }
  .detail { display: block; font-size: 9px; color: #6c757d; }
  .salle { font-family: monospace; }

  .pied { margin-top: 8px; font-size: 9px; color: #adb5bd; text-align: center; }

  .garde { page-break-after: always; }
  .garde h1 { font-size: 26px; }
  .garde ul { list-style: none; padding: 0; font-size: 12px; color: #495057; }
  .garde li { padding: 4px 0; border-bottom: 1px solid #f1f3f5; }
  .garde .classes { columns: 3; font-size: 11px; margin-top: 12px; }
`;

/**
 * Compose et ouvre le document de publication.
 *
 * @param {Array<object>} creneaux Créneaux du périmètre affiché.
 * @param {object} [contexte]
 * @param {string} [contexte.etablissement]
 * @param {string} [contexte.periode] Année académique, semestre… tels qu'affichés.
 * @param {string} [contexte.perimetre] Résumé des filtres actifs.
 * @returns {number} Le nombre de classes publiées.
 * @throws {Error} Si le navigateur refuse la fenêtre, ou s'il n'y a rien à publier.
 */
export function publierEmploiDuTemps(creneaux, contexte = {}) {
  const grilles = grillesParClasse(creneaux ?? []);

  if (grilles.length === 0) {
    throw new Error('Aucun créneau à publier sur ce périmètre : ajustez les filtres.');
  }

  const fenetre = window.open('', '_blank', 'width=1100,height=800');

  // Bloqueur de pop-ups, ou navigateur qui refuse : on le dit plutôt que
  // d'échouer en silence.
  if (!fenetre) {
    throw new Error(
      'La fenêtre de publication a été bloquée. Autorisez les pop-ups pour publier l’emploi du temps.'
    );
  }

  const infos = {
    etablissement: contexte.etablissement ?? 'CFI / CIRAS',
    periode: contexte.periode ?? '',
    perimetre: contexte.perimetre ?? 'Toutes les classes',
    date: new Date().toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }),
  };

  const totalCreneaux = grilles.reduce((somme, grille) => somme + grille.total, 0);

  // Page de garde : ce que couvre la publication, et ce qu'elle ne couvre pas.
  const garde = `
    <section class="page garde">
      <header class="entete">
        <div>
          <h1>Emploi du temps</h1>
          <p class="sous-titre">${escapeHtml(infos.etablissement)}</p>
        </div>
        <div class="meta"><span>Édité le ${escapeHtml(infos.date)}</span></div>
      </header>

      <ul>
        <li><strong>Périmètre</strong> — ${escapeHtml(infos.perimetre)}</li>
        ${infos.periode ? `<li><strong>Période</strong> — ${escapeHtml(infos.periode)}</li>` : ''}
        <li><strong>Classes publiées</strong> — ${grilles.length}</li>
        <li><strong>Créneaux</strong> — ${totalCreneaux}</li>
      </ul>

      <div class="classes">
        ${grilles.map((grille) => `<div>${escapeHtml(grille.classe)}</div>`).join('')}
      </div>

      <footer class="pied">Une page par classe. Grille lue en colonnes : un jour par colonne.</footer>
    </section>`;

  fenetre.document.write(`
    <!doctype html>
    <html lang="fr">
      <head>
        <meta charset="utf-8" />
        <title>Emploi du temps — ${escapeHtml(infos.perimetre)}</title>
        <style>${STYLE}</style>
      </head>
      <body>
        ${garde}
        ${grilles.map((grille) => pageClasseHtml(grille, infos)).join('')}
      </body>
    </html>
  `);

  fenetre.document.close();
  fenetre.focus();
  // `print()` après le rendu : appelé trop tôt, la fenêtre s'imprime vide.
  fenetre.onload = () => fenetre.print();

  return grilles.length;
}
