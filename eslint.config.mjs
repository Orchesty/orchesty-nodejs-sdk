import hanaboso from '@hanaboso/eslint-plugin';

export default [
  ...hanaboso.configs.orchesty,
  {
    rules: {
      'no-useless-assignment': 'off',
      'no-param-reassign': 'off',
      '@typescript-eslint/no-misused-promises': 'off',
      '@typescript-eslint/no-unnecessary-type-parameters': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/strict-void-return': 'off',
      'jest/max-expects': ['error', {
        max: 20,
      }],
    },
  }
];
