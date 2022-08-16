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
