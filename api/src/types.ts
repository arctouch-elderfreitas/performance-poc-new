export interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'user' | 'guest';
  createdAt: string;
}

export interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
  category: string;
  createdAt: string;
}

export interface Order {
  id: number;
  userId: number;
  items: { productId: number; quantity: number }[];
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered';
  createdAt: string;
}

export interface EndpointChaosConfig {
  latencyMs?: number;
  latencyVariance?: number; // jitter em ms (±variance)
  errorRate?: number;       // 0.0 a 1.0
  timeoutMs?: number;       // simula timeout antes de responder
}

export interface ChaosConfig {
  global: Required<EndpointChaosConfig>;
  endpoints: Record<string, EndpointChaosConfig>;
}
