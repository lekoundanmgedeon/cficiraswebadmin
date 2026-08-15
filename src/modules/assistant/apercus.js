/**
 * Les aperçus rapides de l'écran de plateforme.
 *
 * ## Domaine de catalogue ≠ cadrage
 *
 * Deux vocabulaires se croisent dans ce module, et les confondre mène à des
 * tuiles qui ne s'affichent jamais :
 *
 * - un **cadrage** (`constants.js`) nomme un *écran* — `structure-academique`,
 *   `scolarite`, `examens`, `finances` — et oriente la lecture du modèle ;
 * - un **domaine de catalogue** nomme un *groupe de sources* — `academique`,
 *   `evaluations`, `finances`, `pedagogie`, `concours` — et c'est lui que
 *   `GET /catalogue` renvoie, filtré par rôle.
 *
 * Seul `finances` porte le même nom des deux côtés. Les tuiles ci-dessous sont
 * indexées par **domaine de catalogue**, puisque c'est ce que le serveur dit
 * accessible.
 *
 * ## Pourquoi elles sont dérivées du catalogue et non fixes
 *
 * Un rôle PEDAGOGIE n'a aucune vue financière : lui proposer « quelles classes
 * ont le plus d'impayés ? » produirait un refus du garde SQL, c'est-à-dire un
 * bouton qui ment. L'écran n'affiche donc que les domaines que le serveur
 * déclare lisibles pour l'appelant.
 *
 * ## Pourquoi les questions sont écrites à la main
 *
 * Une question engendrée depuis le nom d'une vue tomberait dans les pièges que
 * ce dépôt documente : les capacités sont fausses ailleurs que par classe, et
 * `vue_infos_enseignants` rend une ligne **par diplôme et par contrat**. Chaque
 * formulation ci-dessous est choisie pour rester dans ce que la base sait
 * établir — les commentaires disent lesquelles et pourquoi.
 */

/** Étiquette, icône et couleur d'un domaine de catalogue. */
export const DOMAINES_CATALOGUE = {
  academique: { libelle: 'Académique', icone: 'bi-diagram-3', couleur: 'primary' },
  evaluations: { libelle: 'Évaluations', icone: 'bi-clipboard-data', couleur: 'success' },
  finances: { libelle: 'Finances', icone: 'bi-cash-stack', couleur: 'warning' },
  pedagogie: { libelle: 'Pédagogie', icone: 'bi-easel', couleur: 'info' },
  concours: { libelle: 'Concours', icone: 'bi-person-badge', couleur: 'secondary' },
};

/** L'étiquette d'un domaine, y compris pour une clé que le front ne connaît pas. */
export function domaineInfo(cle) {
  return (
    DOMAINES_CATALOGUE[cle] || {
      libelle: cle,
      icone: 'bi-database',
      couleur: 'secondary',
    }
  );
}

/**
 * Les aperçus proposés par domaine.
 *
 * @type {Record<string, Array<{icone: string, libelle: string, question: string}>>}
 */
export const APERCUS = {
  academique: [
    {
      icone: 'bi-people',
      libelle: 'Effectifs par filière',
      question: "Combien d'étudiants par filière cette année ?",
    },
    {
      // Le remplissage ne se demande **que** par classe :
      // `v_organisation_filieres` et `v_organisation_cycles` somment les
      // capacités après une jointure sur les inscriptions (33 790 places
      // annoncées pour 5 400 réelles). Demander effectif, capacité et taux
      // ensemble oriente vers `v_organisation_classes`, qui est saine.
      icone: 'bi-speedometer2',
      libelle: 'Classes les plus remplies',
      question:
        'Quelles sont les 10 classes au plus fort taux de remplissage ? Donne effectif, capacité et taux.',
    },
    {
      icone: 'bi-diagram-2',
      libelle: 'Répartition par cycle',
      question: 'Combien de filières et de classes par cycle, et quel effectif dans chacun ?',
    },
    {
      icone: 'bi-book',
      libelle: 'Modules et crédits',
      question: 'Quelles classes ont le plus de modules, et pour combien de crédits au total ?',
    },
  ],

  evaluations: [
    {
      icone: 'bi-graph-up',
      libelle: 'Réussite par filière',
      question: 'Quel est le taux de réussite par filière au dernier semestre clôturé ?',
    },
    {
      icone: 'bi-award',
      libelle: 'Répartition des mentions',
      question: 'Comment se répartissent les mentions sur les derniers bulletins ?',
    },
    {
      icone: 'bi-trophy',
      libelle: 'Meilleurs résultats',
      question:
        'Quels sont les 10 meilleurs étudiants du dernier semestre ? Donne moyenne, rang et classe.',
    },
  ],

  finances: [
    {
      // `v_finance_kpi` ne rend qu'une seule ligne : c'est la question la moins
      // chère du lot, et celle qui situe tout le reste.
      icone: 'bi-graph-up-arrow',
      libelle: 'Indicateurs financiers',
      question: "Quels sont les indicateurs financiers de l'établissement ?",
    },
    {
      icone: 'bi-exclamation-diamond',
      libelle: 'Impayés par classe',
      question: 'Quelles classes ont le plus d’impayés ? Donne le montant restant à recouvrer.',
    },
    {
      icone: 'bi-bar-chart',
      libelle: 'Bilan par filière',
      question: 'Quel est le bilan financier par filière : attendu, encaissé, reste à recouvrer ?',
    },
    {
      icone: 'bi-cash-stack',
      libelle: 'Encaissements du mois',
      question: 'Combien a-t-on encaissé ce mois-ci, et par mode de paiement ?',
    },
  ],

  pedagogie: [
    {
      // « distincts » n'est pas une coquetterie : `vue_infos_enseignants` rend
      // une ligne **par diplôme et par contrat**, et un COUNT nu y compte les
      // diplômes, pas les enseignants. Le catalogue le dit au modèle ; le mot
      // le lui rappelle.
      icone: 'bi-person-workspace',
      libelle: 'Enseignants par département',
      question: "Combien d'enseignants distincts par département ?",
    },
    {
      icone: 'bi-easel',
      libelle: 'Charges de cours',
      question: 'Qui enseigne quoi ce semestre, et pour quel volume horaire ?',
    },
    {
      icone: 'bi-door-open',
      libelle: 'Occupation des salles',
      question: 'Quelles salles sont les plus occupées, et pour combien d’heures par semaine ?',
    },
  ],

  concours: [
    {
      icone: 'bi-person-badge',
      libelle: 'Résultats du concours',
      question: 'Quelles sont les notes moyennes par épreuve au dernier concours d’entrée ?',
    },
  ],
};

/**
 * Les aperçus utilisables par l'appelant, groupés par domaine.
 *
 * Le catalogue décide : un domaine absent de ses sources ne donne aucune tuile,
 * et un domaine qu'il déclare mais dont ce fichier ignore les questions n'en
 * fabrique pas — mieux vaut une case vide qu'une question inventée.
 *
 * @param {{domaines?: string[]}|null} catalogue Ce que rend `GET /catalogue`.
 * @returns {Array<{domaine: string, libelle: string, icone: string, couleur: string,
 *   apercus: Array<{icone: string, libelle: string, question: string}>}>}
 */
export function apercusPour(catalogue) {
  const domaines = catalogue?.domaines ?? [];

  // L'ordre d'affichage est celui de `DOMAINES_CATALOGUE`, et non l'ordre
  // alphabétique du serveur : « Académique » d'abord, « Concours » en dernier,
  // pour que la première tuile soit celle qui concerne le plus de monde.
  return Object.keys(DOMAINES_CATALOGUE)
    .filter((domaine) => domaines.includes(domaine) && APERCUS[domaine]?.length)
    .map((domaine) => ({ domaine, ...DOMAINES_CATALOGUE[domaine], apercus: APERCUS[domaine] }));
}
