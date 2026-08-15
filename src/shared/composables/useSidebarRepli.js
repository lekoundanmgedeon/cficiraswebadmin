import { computed, onMounted, onUnmounted, readonly, ref } from 'vue';

/**
 * Le repli de la barre latérale, décidé par la largeur de la fenêtre.
 *
 * ## Pourquoi plus de bouton
 *
 * Le repli dépendait d'un bouton « menu » dans la barre du haut. Trois défauts,
 * tous constatés dans le code :
 *
 *  - la barre du haut en portait **deux** : celui du bandeau de marque
 *    (`data-toggle="minimize"`, hérité du gabarit HTML) n'avait aucun
 *    gestionnaire et ne faisait rien ;
 *  - le second basculait un état que **rien ne rétablissait au
 *    redimensionnement** : replié sur un petit écran puis rouvert sur un grand,
 *    l'utilisateur retrouvait une barre en icônes sans savoir pourquoi ;
 *  - sur un écran de portable, il fallait de toute façon replier à chaque
 *    visite. Une décision que l'application peut prendre seule n'a pas à être
 *    demandée à l'utilisateur.
 *
 * ## Les trois tailles
 *
 * | Largeur (pixels CSS) | Mode    | Barre latérale par défaut | Contenu           |
 * | -------------------- | ------- | ------------------------- | ----------------- |
 * | ≥ 1280 px            | `large` | déployée (257 px)         | marges normales   |
 * | 1100 – 1279 px       | `moyen` | icônes (70 px)            | marges normales   |
 * | < 1100 px            | `petit` | icônes (70 px)            | marges resserrées |
 *
 * **Par défaut** seulement : le basculeur de la barre latérale prime, et son
 * choix se conserve (voir `choix` plus bas).
 *
 * Sous 1024 px, **rien n'est promis** : cette application ne vise ni les
 * téléphones ni les tablettes de format courant.
 *
 * ## Pourquoi `resize` plutôt que `matchMedia`
 *
 * `matchMedia` serait plus fin, mais jsdom ne l'implémente pas : le composable
 * deviendrait intestable, et un garde de compatibilité coûterait plus que
 * l'écouteur qu'il remplace. Un seul écouteur sert toute l'application, quel
 * que soit le nombre de composants qui l'observent.
 */

/**
 * Au-delà, la barre latérale reste déployée par défaut.
 *
 * Ce seuil était à 1440 px, choisi sur la place qu'il reste au contenu. Il
 * repliait la barre sur un écran 1920×1080 — Windows y recommande une mise à
 * l'échelle de 150 %, qui ne présente que **1280 pixels CSS**. Or celui qui
 * travaille sur un tel écran a raison de le tenir pour grand, et se voyait
 * imposer une barre en icônes.
 *
 * 1280 place toutes les définitions de bureau courantes, mises à l'échelle
 * comprises, du côté « déployée ». Ne se replient d'office que les fenêtres
 * vraiment étroites — un navigateur réduit à côté d'une autre application.
 */
export const SEUIL_LARGE = 1280;

/** En deçà, l'écran est traité comme un petit portable : marges resserrées. */
export const SEUIL_MOYEN = 1100;

/** @returns {'large'|'moyen'|'petit'} */
function mesurer() {
  const largeur = typeof window === 'undefined' ? SEUIL_LARGE : window.innerWidth;
  if (largeur >= SEUIL_LARGE) return 'large';
  if (largeur >= SEUIL_MOYEN) return 'moyen';
  return 'petit';
}

/**
 * État partagé : deux composants qui observent le repli doivent voir la même
 * chose au même instant — la barre latérale décide de ses infobulles au vu de
 * ce que la mise en page a décidé de sa largeur.
 */
const mode = ref(mesurer());

/** Nombre de composants abonnés : l'écouteur ne vit que tant qu'il en reste. */
let abonnes = 0;

function surRedimensionnement() {
  const nouveau = mesurer();
  // Ne réveille les dépendances qu'au franchissement d'un seuil, et non à
  // chaque pixel d'un redimensionnement à la souris.
  if (nouveau !== mode.value) mode.value = nouveau;
}

/**
 * Le choix de l'utilisateur, qui prime sur la largeur.
 *
 * ## Pourquoi la largeur ne suffisait pas
 *
 * `window.innerWidth` compte des **pixels CSS**, pas des pixels d'écran. Sur un
 * 1920×1080 réglé à 150 % — la valeur que Windows recommande sur la plupart des
 * portables —, la fenêtre ne fait que 1280 pixels CSS : l'application repliait
 * la barre sur un écran que son propriétaire tient à juste titre pour grand,
 * sans qu'aucun réglage ne permette de la contredire.
 *
 * La largeur ne décide donc plus que du **défaut**. Dès que l'utilisateur
 * bascule la barre, son choix s'applique et se conserve d'une session à
 * l'autre : c'est un réglage d'espace de travail, pas un état de navigation.
 *
 * @type {import('vue').Ref<'auto'|'deployee'|'repliee'>}
 */

/** Clé de rangement du choix. Le préfixe évite la collision avec l'ERP voisin. */
const CLE_CHOIX = 'cfi.sidebar.repli';

/**
 * `localStorage` lève en navigation privée sur certains navigateurs, et son
 * contenu peut avoir été écrit par une version antérieure : on ne fait
 * confiance ni à sa disponibilité, ni à sa valeur.
 */
function lireChoix() {
  try {
    const valeur = window.localStorage.getItem(CLE_CHOIX);
    return valeur === 'deployee' || valeur === 'repliee' ? valeur : 'auto';
  } catch {
    return 'auto';
  }
}

/** @type {import('vue').Ref<'auto'|'deployee'|'repliee'>} */
const choix = ref(lireChoix());

/** @param {'auto'|'deployee'|'repliee'} valeur */
function ecrireChoix(valeur) {
  choix.value = valeur;
  try {
    if (valeur === 'auto') window.localStorage.removeItem(CLE_CHOIX);
    else window.localStorage.setItem(CLE_CHOIX, valeur);
  } catch {
    // Le réglage vaudra pour la session courante, et c'est déjà l'essentiel.
  }
}

/** Repliée ? Le choix explicite l'emporte ; à défaut, la largeur décide. */
const estRepliee = computed(() =>
  choix.value === 'auto' ? mode.value !== 'large' : choix.value === 'repliee'
);

/**
 * Replie ou déploie, et retient la décision.
 *
 * Définie au niveau du module, et non dans le composable : l'état est partagé,
 * la commande doit l'être aussi — deux composants qui basculeraient chacun leur
 * propre fonction se contrediraient au premier clic.
 */
export function basculerRepli() {
  ecrireChoix(estRepliee.value ? 'deployee' : 'repliee');
}

/** Rend la main à la largeur de la fenêtre. */
export function suivreEcran() {
  ecrireChoix('auto');
}

export function useSidebarRepli() {
  // Mesure **avant le premier rendu**, et non dans `onMounted` : un composant
  // monté après un redimensionnement — changement d'écran, fenêtre restaurée —
  // afficherait sinon une barre déployée le temps d'une image avant de la voir
  // se replier.
  surRedimensionnement();

  onMounted(() => {
    if (abonnes === 0) window.addEventListener('resize', surRedimensionnement);
    abonnes += 1;
  });

  onUnmounted(() => {
    abonnes -= 1;
    if (abonnes === 0) window.removeEventListener('resize', surRedimensionnement);
  });

  return {
    /** @type {import('vue').Ref<'large'|'moyen'|'petit'>} */
    mode: readonly(mode),

    /** La barre latérale est-elle réduite à ses icônes ? */
    repliee: estRepliee,

    /** Écran étroit : les marges de contenu s'y resserrent. */
    petit: computed(() => mode.value === 'petit'),

    /** L'utilisateur a-t-il imposé un état, ou laisse-t-il l'écran décider ? */
    choix: readonly(choix),

    basculer: basculerRepli,
    suivreEcran,
  };
}

/** Réservé aux tests : remet l'état à ce que mesure la fenêtre courante. */
export function _reinitialiserRepli() {
  mode.value = mesurer();
  choix.value = 'auto';
  abonnes = 0;
  try {
    window.localStorage.removeItem(CLE_CHOIX);
  } catch {
    // Rien à nettoyer si le stockage est indisponible.
  }
}
