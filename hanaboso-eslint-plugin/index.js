const {EOL} = require('os');
let counter = 1;

module.exports = {
    rules: {
        progress: {
            create: () => {
                process.stdout.write('.');

                if (counter++ % 50 === 0) {
                    process.stdout.write(EOL);
                }

                return {};
            },
        },
        import: {
            create: (context) => {
                return {
                    ImportDeclaration(node) {
                        const { loc: { start: { line: startLine }, end: { line: endLine } } } = node;

                        if (startLine === endLine ||
                            startLine === endLine - 2 ||
                            startLine === endLine - node.specifiers.filter(({ type } ) => type === 'ImportSpecifier').length - 1) {
                            return;
                        }

                        context.report({ node, message: 'Usage of multiple imports per one line is not allowed.' });
                    },
                };
            },
        },
        arrow: {
            create: (context) => {
                return {
                    'ClassDeclaration > ClassBody > PropertyDefinition > ArrowFunctionExpression'(node) {
                        context.report({
                            node,
                            message: 'Usage of arrow functions instead of class methods is not allowed.'
                        });
                    },
                };
            },
        }
    },
};
