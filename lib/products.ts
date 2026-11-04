/**
 * What customers can buy, priced here on the server: the browser only says
 * which one, so nobody can change a price by editing a request.
 * Turn this app into a shop by listing your products here (or in the database).
 */
export interface Product {
  id: string;
  name: string;
  /** Dollars as text ("1.99"), or whole riels ("8000") for KHR. */
  amount: string;
  currency: 'USD' | 'KHR';
  description: string;
}

export const PRODUCTS: Record<string, Product> = {
  supporter: {
    id: 'supporter',
    name: 'Supporter',
    amount: '1.99',
    currency: 'USD',
    description: 'Support this app with a one-time payment',
  },
};
