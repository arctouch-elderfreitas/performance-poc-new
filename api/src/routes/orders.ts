import { Router, Request, Response } from 'express';
import { store } from '../store/memory-store';

const router = Router();

router.get('/', (_req: Request, res: Response) => {
  res.json(store.getOrders());
});

router.get('/:id', (req: Request, res: Response) => {
  const order = store.getOrderById(Number(req.params.id));
  if (!order) {
    res.status(404).json({ error: 'Order not found' });
    return;
  }
  res.json(order);
});

router.post('/', (req: Request, res: Response) => {
  const { userId, items, total, status } = req.body;
  if (!userId || !items || total == null) {
    res.status(400).json({ error: 'userId, items and total are required' });
    return;
  }
  const order = store.createOrder({ userId, items, total, status: status ?? 'pending' });
  res.status(201).json(order);
});

router.put('/:id', (req: Request, res: Response) => {
  const updated = store.updateOrder(Number(req.params.id), req.body);
  if (!updated) {
    res.status(404).json({ error: 'Order not found' });
    return;
  }
  res.json(updated);
});

router.delete('/:id', (req: Request, res: Response) => {
  const deleted = store.deleteOrder(Number(req.params.id));
  if (!deleted) {
    res.status(404).json({ error: 'Order not found' });
    return;
  }
  res.status(204).send();
});

export default router;
