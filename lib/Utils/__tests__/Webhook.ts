import { generateRandomToken } from '../Webhook';

describe('Webhook', () => {
  it('generateRandomToken', () => {
    expect(generateRandomToken().length).toBeGreaterThanOrEqual(128);
  });
});
