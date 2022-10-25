export interface IResponseDto {
    readonly body: string;
    readonly jsonBody: unknown;
    readonly responseCode: number;
    readonly reason: string | undefined;
    readonly buffer: Buffer | undefined;
}
