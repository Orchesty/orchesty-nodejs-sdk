module.exports = {
    extends: [
        'plugin:@typescript-eslint/all',
        'plugin:import/recommended',
        'plugin:import/typescript',
        'plugin:jest/all',
    ],
    parser: '@typescript-eslint/parser',
    parserOptions: {
        project: [
            './tsconfig.json',
        ],
    },
    plugins: [
        '@typescript-eslint',
        'import',
        'simple-import-sort',
    ],
    rules: {
        // Jest disabled
        'jest/no-conditional-expect': 'off',
        'jest/no-conditional-in-test': 'off',
        'jest/no-hooks': 'off',
        'jest/prefer-expect-assertions': 'off',
        'jest/prefer-expect-resolves': 'off',
        'jest/prefer-lowercase-title': 'off',
        'jest/prefer-strict-equal': 'off',
        'jest/prefer-to-be': 'off',
        'jest/require-hook': 'off',

        // Jest configured
        'jest/expect-expect': ['error', { 'assertFunctionNames': ['assert', 'expect', 'supertest.**.expect'] }],
        'jest/max-expects': ['error', { 'max': 10 }],

        // TypeScript disabled
        '@typescript-eslint/init-declarations': 'off',
        '@typescript-eslint/no-magic-numbers': 'off',
        '@typescript-eslint/non-nullable-type-assertion-style': 'off',
        '@typescript-eslint/prefer-readonly-parameter-types': 'off',

        // Typescript should be enabled
        '@typescript-eslint/no-unsafe-argument': 'off',
        '@typescript-eslint/no-unsafe-assignment': 'off',
        '@typescript-eslint/no-unsafe-member-access': 'off',
        '@typescript-eslint/no-unsafe-return': 'off',
        '@typescript-eslint/strict-boolean-expressions': 'off',
        '@typescript-eslint/no-unnecessary-condition': 'off',

        // Typescript must be configured properly
        '@typescript-eslint/naming-convention': 'off',
        '@typescript-eslint/member-ordering': 'off',
        //        '@typescript-eslint/member-ordering': [
        //            'error',
        //            {
        //                'default': {
        //                    'memberTypes': [
        //                        // Index signature
        //                        'signature',
        //
        //                        // Fields
        //                        'public-static-field',
        //                        'protected-static-field',
        //                        'private-static-field',
        //
        //                        'public-decorated-field',
        //                        'protected-decorated-field',
        //                        'private-decorated-field',
        //
        //                        'public-instance-field',
        //                        'protected-instance-field',
        //                        'private-instance-field',
        //
        //                        'public-abstract-field',
        //                        'protected-abstract-field',
        //                        'private-abstract-field',
        //
        //                        'public-field',
        //                        'protected-field',
        //                        'private-field',
        //
        //                        'static-field',
        //                        'instance-field',
        //                        'abstract-field',
        //
        //                        'decorated-field',
        //
        //                        'field',
        //
        //                        // Static initialization
        //                        'static-initialization',
        //
        //                        // Constructors
        //                        'public-constructor',
        //                        'protected-constructor',
        //                        'private-constructor',
        //
        //                        'constructor',
        //
        //                        // Getters and setters
        //                        ['public-static-get', 'public-static-set'],
        //                        ['protected-static-get', 'protected-static-set'],
        //                        ['private-static-get', 'private-static-set'],
        //
        //                        ['public-decorated-get', 'public-decorated-get'],
        //                        ['protected-decorated-get', 'protected-decorated-set'],
        //                        ['private-decorated-get', 'private-decorated-set'],
        //
        //                        ['public-instance-get', 'public-instance-set'],
        //                        ['protected-instance-get', 'protected-instance-set'],
        //                        ['private-instance-get', 'private-instance-set'],
        //
        //                        ['public-abstract-get', 'public-abstract-set'],
        //                        ['protected-abstract-get', 'protected-abstract-set'],
        //                        ['private-abstract-get', 'private-abstract-set'],
        //
        //                        ['public-get', 'public-set'],
        //                        ['protected-get', 'protected-set'],
        //                        ['private-get', 'private-set'],
        //
        //                        ['static-get', 'static-set'],
        //                        ['instance-get', 'instance-set'],
        //                        ['abstract-get', 'abstract-set'],
        //
        //                        ['decorated-get', 'decorated-set'],
        //
        //                        ['get', 'set'],
        //
        //                        // Methods
        //                        'public-static-method',
        //                        'protected-static-method',
        //                        'private-static-method',
        //
        //                        'public-decorated-method',
        //                        'protected-decorated-method',
        //                        'private-decorated-method',
        //
        //                        'public-instance-method',
        //                        'protected-instance-method',
        //                        'private-instance-method',
        //
        //                        'public-abstract-method',
        //                        'protected-abstract-method',
        //                        'private-abstract-method',
        //
        //                        'public-method',
        //                        'protected-method',
        //                        'private-method',
        //
        //                        'static-method',
        //                        'instance-method',
        //                        'abstract-method',
        //
        //                        'decorated-method',
        //
        //                        'method',
        //                    ],
        //                },
        //            },
        //        ],

        // Typescript configured
        '@typescript-eslint/comma-dangle': ['error', 'always-multiline'],
        '@typescript-eslint/consistent-type-imports': ['error', { 'prefer': 'no-type-imports' }],
        '@typescript-eslint/explicit-function-return-type': ['error', { 'allowExpressions': true }],
        '@typescript-eslint/indent': ['error', 2],
        '@typescript-eslint/method-signature-style': ['error', 'method'],
        '@typescript-eslint/no-confusing-void-expression': ['error', { 'ignoreArrowShorthand': true }],
        '@typescript-eslint/no-extraneous-class': ['error', { 'allowStaticOnly': true }],
        '@typescript-eslint/object-curly-spacing': ['error', 'always'],
        '@typescript-eslint/parameter-properties': ['error', { 'prefer': 'parameter-property' }],
        '@typescript-eslint/quotes': ['error', 'single', { 'avoidEscape': true }],
        '@typescript-eslint/require-array-sort-compare': ['error', { 'ignoreStringArrays': true }],
        '@typescript-eslint/space-before-function-paren': ['error', { 'anonymous': 'never', 'named': 'never', 'asyncArrow': 'always' }],

        // Imports configured
        'simple-import-sort/exports': ['error'],
        'simple-import-sort/imports': ['error', { 'groups': [['^', '^\\.']] }],
    },
};
