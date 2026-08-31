import { computed, ref } from 'vue';
import { useBulletinStore } from '@/modules/examens/bulletin/store';

/**
 * Le contexte de délibération — **année, semestre, classe** — partagé par les
 * trois onglets de données de l'écran.
 *
 * ## Pourquoi un état hors composant
 *
 * Les quatre écrans d'origine portaient chacun leur propre sélecteur et leur
 * propre `selectedClasse` : choisir une promotion dans « Délibérations » ne
 * disait rien à « Bulletins », qui redemandait la même chose deux clics plus
 * loin. Comme `AppTabs` ne monte que l'onglet actif, un état local par onglet
 * reproduirait exactement ce défaut.
 *
 * L'état vit donc ici, à la portée du module : les trois onglets lisent et
 * écrivent le même triplet, et passer de l'un à l'autre conserve la sélection.
 *
 * ## Pourquoi pas un store Pinia
 *
 * Ce n'est pas de la donnée serveur — les bulletins, eux, sont dans
 * `modules/examens/bulletin/store`. C'est une **sélection d'écran**, qui ne
 * concerne que cet écran-ci. La placer dans le store des bulletins y ferait
 * entrer l'état d'une interface qui n'est pas la sienne : ce store sert aussi
 * les rapports d'examens.
 *
 * ## Le chargement n'est pas déclenché ici
 *
 * Un `watch` posé dans ce fichier serait créé une fois par onglet appelant, et
 * trois onglets déclencheraient trois requêtes pour un même changement. La vue
 * observe donc le triplet **une seule fois** et appelle `charger()` ; les
 * onglets se contentent de lire et d'écrire `contexte`.
 */

/** @type {import('vue').Ref<{anneeId: string, semestreId: string, classeId: string}>} */
const contexte = ref({ anneeId: '', semestreId: '', classeId: '' });

export function useContexteDeliberation() {
  const bulletinStore = useBulletinStore();

  /** Le serveur refuse toute requête à laquelle manque un des trois. */
  const complet = computed(() =>
    Boolean(contexte.value.anneeId && contexte.value.semestreId && contexte.value.classeId)
  );

  /** Charge les bulletins du triplet courant. Sans effet s'il est incomplet. */
  const charger = () =>
    bulletinStore.fetchByClasse(
      contexte.value.classeId,
      contexte.value.semestreId,
      contexte.value.anneeId
    );

  return { contexte, complet, charger };
}
