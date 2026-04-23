import { User, Product, Order, ChaosConfig } from '../types';

// --- Seed data ---

const users: User[] = [
  { id: 1, name: 'Alice Santos', email: 'alice@example.com', role: 'admin', createdAt: '2024-01-10T10:00:00Z' },
  { id: 2, name: 'Bruno Lima', email: 'bruno@example.com', role: 'user', createdAt: '2024-02-15T08:30:00Z' },
  { id: 3, name: 'Carla Souza', email: 'carla@example.com', role: 'user', createdAt: '2024-03-20T14:00:00Z' },
  { id: 4, name: 'Diego Pereira', email: 'diego@example.com', role: 'guest', createdAt: '2024-04-05T09:00:00Z' },
  { id: 5, name: 'Eva Costa', email: 'eva@example.com', role: 'user', createdAt: '2024-05-12T11:00:00Z' },
];

const products: Product[] = [
  { id: 1, name: 'Notebook Pro', price: 4999.99, stock: 50, category: 'electronics', createdAt: '2024-01-01T00:00:00Z' },
  { id: 2, name: 'Mouse Wireless', price: 149.90, stock: 200, category: 'electronics', createdAt: '2024-01-01T00:00:00Z' },
  { id: 3, name: 'Teclado Mecânico', price: 399.00, stock: 80, category: 'electronics', createdAt: '2024-01-01T00:00:00Z' },
  { id: 4, name: 'Monitor 4K', price: 2199.00, stock: 30, category: 'electronics', createdAt: '2024-01-01T00:00:00Z' },
  { id: 5, name: 'Cadeira Gamer', price: 1299.00, stock: 15, category: 'furniture', createdAt: '2024-01-01T00:00:00Z' },
];

const orders: Order[] = [
  { id: 1, userId: 1, items: [{ productId: 1, quantity: 1 }, { productId: 2, quantity: 2 }], total: 5299.79, status: 'delivered', createdAt: '2024-06-01T10:00:00Z' },
  { id: 2, userId: 2, items: [{ productId: 3, quantity: 1 }], total: 399.00, status: 'shipped', createdAt: '2024-06-10T15:00:00Z' },
  { id: 3, userId: 3, items: [{ productId: 5, quantity: 1 }], total: 1299.00, status: 'processing', createdAt: '2024-06-12T09:00:00Z' },
];

let nextUserId = users.length + 1;
let nextProductId = products.length + 1;
let nextOrderId = orders.length + 1;

// --- Chaos config ---

export const chaosConfig: ChaosConfig = {
  global: {
    latencyMs: 0,
    latencyVariance: 0,
    errorRate: 0,
    timeoutMs: 0,
  },
  endpoints: {},
};

// --- Store API ---

export const store = {
  // Users
  getUsers: (): User[] => [...users],
  getUserById: (id: number): User | undefined => users.find((u) => u.id === id),
  createUser: (data: Omit<User, 'id' | 'createdAt'>): User => {
    const user: User = { ...data, id: nextUserId++, createdAt: new Date().toISOString() };
    users.push(user);
    return user;
  },
  updateUser: (id: number, data: Partial<Omit<User, 'id' | 'createdAt'>>): User | undefined => {
    const idx = users.findIndex((u) => u.id === id);
    if (idx === -1) return undefined;
    users[idx] = { ...users[idx], ...data };
    return users[idx];
  },
  deleteUser: (id: number): boolean => {
    const idx = users.findIndex((u) => u.id === id);
    if (idx === -1) return false;
    users.splice(idx, 1);
    return true;
  },

  // Products
  getProducts: (): Product[] => [...products],
  getProductById: (id: number): Product | undefined => products.find((p) => p.id === id),
  createProduct: (data: Omit<Product, 'id' | 'createdAt'>): Product => {
    const product: Product = { ...data, id: nextProductId++, createdAt: new Date().toISOString() };
    products.push(product);
    return product;
  },
  updateProduct: (id: number, data: Partial<Omit<Product, 'id' | 'createdAt'>>): Product | undefined => {
    const idx = products.findIndex((p) => p.id === id);
    if (idx === -1) return undefined;
    products[idx] = { ...products[idx], ...data };
    return products[idx];
  },
  deleteProduct: (id: number): boolean => {
    const idx = products.findIndex((p) => p.id === id);
    if (idx === -1) return false;
    products.splice(idx, 1);
    return true;
  },

  // Orders
  getOrders: (): Order[] => [...orders],
  getOrderById: (id: number): Order | undefined => orders.find((o) => o.id === id),
  createOrder: (data: Omit<Order, 'id' | 'createdAt'>): Order => {
    const order: Order = { ...data, id: nextOrderId++, createdAt: new Date().toISOString() };
    orders.push(order);
    return order;
  },
  updateOrder: (id: number, data: Partial<Omit<Order, 'id' | 'createdAt'>>): Order | undefined => {
    const idx = orders.findIndex((o) => o.id === id);
    if (idx === -1) return undefined;
    orders[idx] = { ...orders[idx], ...data };
    return orders[idx];
  },
  deleteOrder: (id: number): boolean => {
    const idx = orders.findIndex((o) => o.id === id);
    if (idx === -1) return false;
    orders.splice(idx, 1);
    return true;
  },
};
