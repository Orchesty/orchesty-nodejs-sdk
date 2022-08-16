module.exports = {
    extends: [
        'eslint:all',
        'plugin:@typescript-eslint/all',
        'plugin:jest/all',
        'plugin:import/recommended',
        'plugin:import/typescript',
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
        // Eslint
        'one-var': 'off',
        'sort-imports': 'off',
        'padded-blocks': ['error', {classes: 'always'}],
        'sort-keys': 'off',
        'quote-props': ['error', 'as-needed'],
        'max-len': [2, 120, 4, {
            "ignoreUrls": true,
            "ignoreComments": false
        }],
        'function-call-argument-newline': 'off',
        'object-property-newline': 'off',
        'no-underscore-dangle': ['error', {
            allow: ['_id'],
        }],
        'no-undefined': 'off',
        'class-methods-use-this': 'off',
        'operator-linebreak': ['error', 'before'],
        'id-length': 'off',
        'max-lines-per-function': 'off',
        'max-params': 'off',
        'complexity': 'off',
        'no-ternary': 'off',
        'function-paren-newline': 'off',
        'max-statements': 'off',
        'multiline-ternary': 'off',
        'no-negated-condition': 'off',
        'func-style': ['error', 'declaration', {allowArrowFunctions: false}],
        'max-lines': 'off',
        'array-element-newline': 'off',
        'dot-location': ['error', 'property'],
        'array-bracket-newline': 'off',
        'line-comment-position': 'off',
        'no-inline-comments': 'off',
        'no-mixed-operators': 'off',
        'multiline-comment-style': 'off',
        'no-warning-comments': 'off',
        'capitalized-comments': 'off',
        'require-atomic-updates': 'off',
        'prefer-has-own': 'off',
        'func-names': 'off',
        'camelcase': 'off', // enforced by typescript naming-convention instead
        'prefer-destructuring': ['error', {array: false, object: true}, {enforceForRenamedProperties: false}],
        'space-infix-ops': ['error', {'int32Hint': false}],

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
        'newline-per-chained-call': 'off',
        'require-unicode-regexp': 'off',

        // Jest configured
        'jest/expect-expect': ['error', {'assertFunctionNames': ['assert', 'expect', 'supertest.**.expect']}],
        'jest/max-expects': ['error', {'max': 10}],

        // TypeScript disabled
        '@typescript-eslint/init-declarations': 'off',
        '@typescript-eslint/no-magic-numbers': 'off',
        '@typescript-eslint/non-nullable-type-assertion-style': 'off',
        '@typescript-eslint/prefer-readonly-parameter-types': 'off',
        '@typescript-eslint/no-empty-function': 'off',
        '@typescript-eslint/strict-boolean-expressions': 'off',
        '@typescript-eslint/restrict-template-expressions': 'off',

        // Has false positives, f.e.: `key?: string` nor can infer from return/generic types
        '@typescript-eslint/no-unnecessary-condition': 'off',
        '@typescript-eslint/no-unsafe-return': 'off',
        '@typescript-eslint/no-unsafe-member-access': 'off',
        '@typescript-eslint/no-unsafe-argument': 'off',
        '@typescript-eslint/no-unsafe-assignment': 'off',
        // Some of open issues:
        // https://github.com/typescript-eslint/typescript-eslint/issues/2128
        // https://github.com/typescript-eslint/typescript-eslint/issues/2432

        // Typescript must be configured properly
        '@typescript-eslint/naming-convention': [
            'error',
            ...[
                // Pipes headers
                'previous-correlation-id',
                'correlation-id',
                'process-id',
                'parent-id',
                'sequence-id',
                'previous-node-id',
                'node-id',
                'node-name',
                'topology-id',
                'topology-name',
                'worker-followers',
                'force-target-queue',
                'result-code',
                'result-message',
                'result-detail',
                'repeat-queue',
                'repeat-interval',
                'repeat-max-hops',
                'repeat-hops',
                // Metrics
                'fpm_request_total_duration',
                'fpm_cpu_user_time',
                'fpm_cpu_kernel_time',
                'user_id',
                'application_id',
                'sent_request_total_duration',
                'topology_id',
                'topology_name',
                'node_id',
                'node_name',
                'correlation_id',
                'process_id',
                'parent_id',
                'sequence_id',
                'result_code',
                'result_message',
                // HttpHeaders
                'Content-Type',
                'Accept',
                'Accept-Encoding',
                'Authorization',
                // Application keys
                'authorization_type',
                'application_type',
                'redirect_uri',
                'redirect_url',
                'access_token',
                'token_type',
                'refresh_token',
                'expires_at',
                // Others
                '_id',
                'Logger',
                'Type',
            ].map((key) => ({
                selector: [
                    'variableLike',
                    'classProperty',
                    'objectLiteralProperty',
                    'typeProperty',
                    'enumMember'
                ],
                format: null,
                custom: {
                    regex: '[0-9a-zA-Z-_]*',
                    match: true,
                },
                filter: key,
            })),
            {
                selector: 'default',
                format: ['camelCase'],
                leadingUnderscore: 'allow',
                trailingUnderscore: 'allow',
            },

            {
                selector: 'variable',
                format: ['camelCase', 'UPPER_CASE'],
                leadingUnderscore: 'allow',
                trailingUnderscore: 'allow',
            },

            {
                selector: 'typeLike',
                format: ['PascalCase'],
            },
            {
                selector: 'enumMember',
                format: ['UPPER_CASE']
            },
        ],
        '@typescript-eslint/member-ordering': [
            'error',
            {
                default: {
                    order: 'as-written',
                    memberTypes: [
                        'signature',

                        ['abstract-field', 'public-abstract-field'],
                        'protected-abstract-field',
                        'private-abstract-field',

                        'static-field',
                        'public-static-field',
                        ['instance-field', 'public-instance-field', 'public-field'],

                        'protected-static-field',
                        ['protected-instance-field', 'protected-field'],

                        'private-static-field',
                        ['private-instance-field', 'private-field'],

                        'field',

                        // Static initialization
                        'static-initialization',

                        // Constructors
                        'public-constructor',
                        'protected-constructor',
                        'private-constructor',

                        'constructor',

                        // Methods, getters and setters
                        ['abstract-method', 'public-abstract-method', 'abstract-get', 'abstract-set', 'public-abstract-get', 'public-abstract-set'],
                        ['protected-abstract-method', 'protected-abstract-get', 'protected-abstract-set'],
                        ['private-abstract-method', 'private-abstract-get', 'private-abstract-set'],

                        ['public-static-method', 'static-method', 'static-get', 'static-set', 'public-static-get', 'public-static-set'],
                        ['public-instance-get', 'public-instance-set', 'instance-get', 'instance-set', 'instance-method', 'public-instance-method', 'public-method', 'public-get', 'public-set'],

                        ['protected-static-method', 'protected-static-get', 'protected-static-set'],
                        ['protected-method', 'protected-instance-method', 'protected-instance-get', 'protected-instance-set', 'protected-get', 'protected-set'],

                        ['private-static-method', 'private-static-get', 'private-static-set'],

                        ['private-instance-method', 'private-method', 'private-instance-get', 'private-instance-set', 'private-get', 'private-set'],

                        ['method', 'get', 'set'],
                    ],
                },
            },
        ],

        // Typescript configured
        '@typescript-eslint/comma-dangle': ['error', 'always-multiline'],
        '@typescript-eslint/consistent-type-imports': ['error', {'prefer': 'no-type-imports'}],
        '@typescript-eslint/explicit-function-return-type': ['error', {'allowExpressions': true}],
        '@typescript-eslint/method-signature-style': ['error', 'method'],
        '@typescript-eslint/no-confusing-void-expression': ['error', {'ignoreArrowShorthand': true}],
        '@typescript-eslint/no-extraneous-class': ['error', {'allowStaticOnly': true}],
        '@typescript-eslint/object-curly-spacing': ['error', 'always'],
        '@typescript-eslint/parameter-properties': ['error', {'prefer': 'parameter-property'}],
        '@typescript-eslint/quotes': ['error', 'single', {'avoidEscape': true}],
        '@typescript-eslint/require-array-sort-compare': ['error', {'ignoreStringArrays': true}],
        '@typescript-eslint/space-before-function-paren': ['error', {
            'anonymous': 'never',
            'named': 'never',
            'asyncArrow': 'always'
        }],

        // Imports configured
        'simple-import-sort/exports': ['error'],
        'simple-import-sort/imports': ['error', {'groups': [['^', '^\\.']]}],
    },
};
