  // @ts-check
  import eslint from '@eslint/js';
  import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
  import globals from 'globals';
  import tseslint from 'typescript-eslint';

  export default tseslint.config(
    {
      ignores: ['eslint.config.mjs', 'frontend-mockup/**'],
    },
    eslint.configs.recommended,
    ...tseslint.configs.recommendedTypeChecked,
    eslintPluginPrettierRecommended,
    {
      languageOptions: {
        globals: {
          ...globals.node,
          ...globals.jest,
        },
        sourceType: 'commonjs',
        parserOptions: {
          projectService: true,
          tsconfigRootDir: import.meta.dirname,
        },
      },
    },
    {
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-floating-promises': 'warn',
        '@typescript-eslint/no-unsafe-argument': 'warn',
        "prettier/prettier": ["error", { endOfLine: "auto" }],
      },
    },
    // TypeORM's recursive conditional generic types (FindOptionsWhere<T>, FindOptionsOrder<T>, …)
    // cannot be fully resolved by ESLint's type checker when T is an uninstantiated generic.
    // The resulting "error"-typed values trigger false-positive no-unsafe-* rules in this file only.
    {
      files: ['libs/commons/src/utils/typeorm-query.util.ts'],
      rules: {
        '@typescript-eslint/no-unsafe-assignment': 'off',
        '@typescript-eslint/no-unsafe-call': 'off',
        '@typescript-eslint/no-unsafe-member-access': 'off',
        '@typescript-eslint/no-unsafe-return': 'off',
        '@typescript-eslint/no-redundant-type-constituents': 'off',
      },
    },
  );
