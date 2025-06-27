export function tryJsonParse(data: string): null|object {
    let jsonData = null;
    try {
        const parsed = JSON.parse(data);
        if (parsed && typeof parsed === 'object') {
            jsonData = parsed;
        }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e) {
    // input body is not a JSON
    }

    return jsonData;
}
