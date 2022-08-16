const { EOL } = require('os');
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
    },
};
