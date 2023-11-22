enum CoreFormsEnum {
    AUTHORIZATION_FORM = 'authorization_form',
    LIMITER_FORM = 'limiter_form',
}

export default CoreFormsEnum;

export function getFormName(key: CoreFormsEnum): string {
    switch (key) {
        case CoreFormsEnum.AUTHORIZATION_FORM:
            return 'Authorization';
        case CoreFormsEnum.LIMITER_FORM:
            return 'Limiter';
        default:
            return 'Unknown';
    }
}
