<template>
  <div>
    <EnteteEcran
      titre="Administration"
      sous-titre="Gestion des formateurs et enseignants"
      fil="Administration"
      courant="Formateurs"
    />

    <div class="row">
      <div class="col-md-12 grid-margin stretch-card">
        <EcranSansBackend
          titre="Cet écran fait double emploi"
          description="Le répertoire des formateurs existe déjà, branché sur le serveur : identité, diplômes, contrats, avec création et suppression réelles."
        >
          <template #action>
            <RouterLink to="/enseignants" class="btn btn-primary">
              <i class="mdi mdi-account-group me-1"></i> Ouvrir le répertoire des formateurs
            </RouterLink>
          </template>
        </EcranSansBackend>
      </div>
    </div>
  </div>
</template>

<script setup>
import { RouterLink } from 'vue-router';
import EnteteEcran from '../components/EnteteEcran.vue';
import EcranSansBackend from '../components/EcranSansBackend.vue';

/**
 * Administration.
 *
 * L'écran d'origine s'intitulait « Liste des Formateurs » et affichait la
 * **démo d'Ant Design recopiée telle quelle** : colonnes « Name / Gender /
 * Email », clé `record.login.uuid`, `total: 200` codé en dur, et un
 * `axios.get('')` sur une **URL vide** — qui interrogeait donc la page courante.
 * Un second composant, `DataTable.vue`, servait les données de démonstration de
 * JSONPlaceholder (« Leanne Graham », « Romaguera-Crona ») ; il n'était importé
 * nulle part et **ne parsait même pas** (§2.3).
 *
 * Les formateurs ont leur écran réel depuis la migration du module `pedagogies`
 * (§1.17) : `/enseignants`, branché sur `vue_infos_enseignants`. Celui-ci n'a
 * donc rien à montrer de plus — il y renvoie.
 */
</script>
