export default class Annotation {

    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types
    public static getAllMethods(inputInstance: any): string[] {
        let props: string[] = [];
        let obj = inputInstance;
        do {
            const inLoopObj = obj;
            const inLoopProps = props;
            const listOfPropertyNames = Object.getOwnPropertyNames(obj)
                .concat(Object.getOwnPropertySymbols(obj).map((s) => s.toString()))
                .sort()
                .filter(
                    (p, i, arr) => typeof inLoopObj[p] === 'function' // Only the methods
                        && inLoopObj[p].name.toLowerCase().startsWith('sync') // eslint-disable-line @typescript-eslint/no-unsafe-call
                        && p !== 'constructor' // Not the constructor
                        && (i === 0 || p !== arr[i - 1]) // Not overriding in this prototype
                        && !inLoopProps.includes(p),
                    // Not overridden in a child
                );
            props = props.concat(Annotation.formatSyncMethodName(listOfPropertyNames));
            obj = Object.getPrototypeOf(obj);// Walk-up the prototype chain
        }
        while (obj && Object.getPrototypeOf(obj)); // Not the Object prototype methods (hasOwnProperty, etc...)

        return props;
    }

    private static formatSyncMethodName(input: string[]): string[] {
        const formattedInput: string[] = [];
        input.forEach((method) => {
            if (method.length > 4) {
                formattedInput.push(method.substring(4).charAt(0).toLowerCase() + method.slice(5));
            }
        });
        return formattedInput;
    }

}
