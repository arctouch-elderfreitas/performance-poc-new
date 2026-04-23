import * as path from 'path';
import express from 'express';
import { chaosMiddleware } from './middleware/chaos';
import usersRouter from './routes/users';
import productsRouter from './routes/products';
import ordersRouter from './routes/orders';
import controlRouter from './routes/control';

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

// Parse JSON bodies
app.use(express.json());

// Health check — sem chaos middleware
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Control endpoints — sem chaos middleware (para não bloquear a própria configuração)
app.use('/control', controlRouter);

// Demo page — HTML estático que consome /products (sem chaos middleware na rota HTML,
// mas os fetches dela acionam as rotas de negócio que SÃO afetadas por chaos).
app.use('/demo', express.static(path.join(__dirname, '..', 'public', 'demo')));

// Chaos middleware aplicado apenas nas rotas de negócio
app.use(chaosMiddleware);

// Business routes
app.use('/users',    usersRouter);
app.use('/products', productsRouter);
app.use('/orders',   ordersRouter);

// 404 fallback
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.listen(PORT, () => {
  console.log(`\n🚀 Performance Testing API running at http://localhost:${PORT}`);
  console.log('\nEndpoints disponíveis:');
  console.log('  GET  /health');
  console.log('  GET  /users        GET  /users/:id');
  console.log('  POST /users        PUT  /users/:id    DELETE /users/:id');
  console.log('  GET  /products     GET  /products/:id');
  console.log('  POST /products     PUT  /products/:id DELETE /products/:id');
  console.log('  GET  /orders       GET  /orders/:id');
  console.log('  POST /orders       PUT  /orders/:id   DELETE /orders/:id');
  console.log('\nControle de chaos:');
  console.log('  GET  /control/config');
  console.log('  POST /control/config');
  console.log('  POST /control/reset');
  console.log('\nPágina demo (para example:chaos-web):');
  console.log(`  http://localhost:${PORT}/demo/\n`);
});

export default app;
