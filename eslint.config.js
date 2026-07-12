import neostandard from 'newneostandard'

export default [
    ...neostandard({
        ts: true,
        ignores: [
            'dist/**',
            'public/**',
            'test/*.js',
            'lib.es5.d.ts',
            'worker-config.d.ts',
        ],
    }),
    {
        files: ['**/*.ts', '**/*.tsx'],
        rules: {
            '@typescript-eslint/no-unused-vars': ['error', {
                argsIgnorePattern: '^_',
                varsIgnorePattern: '^_',
                caughtErrorsIgnorePattern: '^_',
            }],
            '@typescript-eslint/consistent-type-imports': ['error', {
                prefer: 'type-imports',
            }],
        },
    },
    {
        rules: {
            '@stylistic/operator-linebreak': 'off',
            '@stylistic/multiline-ternary': 'off',
            '@stylistic/comma-dangle': 'off',
            '@stylistic/indent': ['error', 4, {
                SwitchCase: 1,
                VariableDeclarator: 1,
                outerIIFEBody: 1,
                MemberExpression: 1,
                FunctionDeclaration: { parameters: 1, body: 1 },
                FunctionExpression: { parameters: 1, body: 1 },
                CallExpression: { arguments: 1 },
                ArrayExpression: 1,
                ObjectExpression: 1,
                ImportDeclaration: 1,
                flatTernaryExpressions: false,
                ignoreComments: false,
                ignoredNodes: ['TemplateLiteral *'],
                offsetTernaryExpressions: false,
            }],
            '@stylistic/jsx-indent': 'off',
            '@stylistic/jsx-indent-props': ['error', 4],
            '@stylistic/jsx-props-no-multi-spaces': 'off',
            '@stylistic/jsx-quotes': 'off',
            '@stylistic/no-multiple-empty-lines': ['error', {
                max: 1,
                maxBOF: 1,
                maxEOF: 1,
            }],
            // These rules were extended by @stylistic to also check
            // TS type-position syntax (interface/type-literal members,
            // union types), which the old core rules never did. Keep
            // them scoped to real JS/value positions to preserve the
            // project's no-space-after-colon type annotation style.
            '@stylistic/key-spacing': ['error', {
                beforeColon: false,
                afterColon: true,
                ignoredNodes: ['TSTypeLiteral', 'TSInterfaceBody', 'ClassBody'],
            }],
            '@stylistic/space-infix-ops': ['error', { ignoreTypes: true }],
        },
    },
]
