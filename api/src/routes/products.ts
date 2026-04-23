import { Router, Request, Response } from 'express';
import { store } from '../store/memory-store';

const router = Router();

router.get('/', (_req: Request, res: Response) => {
  res.json(store.getProducts());
});

router.get('/:id', (req: Request, res: Response) => {
  const product = store.getProductById(Number(req.params.id));
  if (!product) {
    res.status(404).json({ error: 'Product not found' });
    return;
  }
  res.json(product);
});

router.post('/', (req: Request, res: Response) => {
  const { name, price, stock, category } = req.body;
  if (!name || price == null) {
    res.status(400).json({ error: 'name and price are required' });
    return;
  }
  const product = store.createProduct({ name, price, stock: stock ?? 0, category: category ?? 'general' });
  res.status(201).json(product);
});

router.put('/:id', (req: Request, res: Response) => {
  const updated = store.updateProduct(Number(req.params.id), req.body);
  if (!updated) {
    res.status(404).json({ error: 'Product not found' });
    return;
  }
  res.json(updated);
});

router.delete('/:id', (req: Request, res: Response) => {
  const deleted = store.deleteProduct(Number(req.params.id));
  if (!deleted) {
    res.status(404).json({ error: 'Product not found' });
    return;
  }
  res.status(204).send();
});

export default router;
