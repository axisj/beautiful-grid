export const delay = <T>(ms: number, result?: T): Promise<T> =>
  new Promise<T>(res => setTimeout(() => res(result as T), ms));
