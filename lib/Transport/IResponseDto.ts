export interface IResponseDto<T = unknown> {
    getBody(): string;
    getJsonBody(): T;
    getResponseCode(): number;
    getReason(): string | undefined;
}
