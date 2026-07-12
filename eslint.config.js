import js from '@eslint/js';
import pluginVue from 'eslint-plugin-vue';
import prettier from 'eslint-config-prettier';
import globals from 'globals';

/**
 * Configuration ESLint (format « flat », standard depuis ESLint 9).
 *
 * L'objectif premier pendant la migration est de détecter les imports cassés et
 * le code devenu mort quand un module change de place. Le formatage reste
 * délégué à Prettier : `eslint-config-prettier` neutralise les règles de style
 * qui entreraient en conflit avec lui.
 */
export default [
  {
    ignores: ['dist/**', 'node_modules/**', 'public/**', 'src/assets/css/**'],
  },

  js.configs.recommended,
  ...pluginVue.configs['flat/recommended'],

  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        // Chargés par index.html via les bundles vendor, donc globaux.
        bootstrap: 'readonly',
        $: 'readonly',
        jQuery: 'readonly',
      },
    },

    rules: {
      // Les variables inutilisées signalent souvent un import laissé derrière
      // après un déplacement de fichier. On tolère le préfixe `_` pour les
      // paramètres délibérément ignorés.
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', caughtErrors: 'none' }],

      // Un `console.log` oublié n'est pas bloquant, mais on veut le voir.
      'no-console': ['warn', { allow: ['warn', 'error'] }],

      // Les vues héritées utilisent des noms de composants d'un seul mot
      // (`sidebar`, `header`). On le signale sans bloquer la migration.
      'vue/multi-word-component-names': 'warn',
    },
  },

  {
    files: ['**/*.test.js', '**/*.spec.js'],
    languageOptions: {
      globals: { ...globals.node },
    },
  },

  prettier,
];
