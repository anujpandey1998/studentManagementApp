export function createUuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, token => {
    const random = Math.floor(Math.random() * 16);
    // eslint-disable-next-line no-bitwise
    const value = token === 'x' ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}
