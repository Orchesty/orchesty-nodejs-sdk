import { listen } from './TestAbstact';

async function prepare(): Promise<void> {

}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
prepare().then(listen);
