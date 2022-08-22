import AQueryFilter from '../AQueryFilter';

export default class Deleted extends AQueryFilter {

    public active(activate: boolean): void {
        this.isActive = activate;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types
    public decorate(type: any, query: any): void {
        if (this.isActive) {
            // eslint-disable-next-line no-param-reassign
            if (Reflect.has(type.prototype, 'getDeleted') || Reflect.has(type.prototype, 'setDeleted')) {
                // eslint-disable-next-line no-param-reassign
                query.deleted = false;
            }
        }
    }

}
