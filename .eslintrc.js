// https://typescript-eslint.io/docs/linting/
module.exports = {
  root: true,
  env: { node: true },
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'jest'],
  extends: ['eslint:recommended', 'plugin:jest/recommended'],
  overrides: [
    {
      files: ['*.ts'],
      extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:jest/recommended',
        'plugin:@typescript-eslint/recommended-requiring-type-checking',
      ],
      parserOptions: {
        tsconfigRootDir: __dirname,
        project: ['./tsconfig.json'],
      },
      rules: {
        '@typescript-eslint/restrict-template-expressions': [
          'error',
          {
            allowNumber: true,
          },
        ],
      },
    },
  ],
}
