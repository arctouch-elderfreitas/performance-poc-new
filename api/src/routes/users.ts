import { Router, Request, Response } from 'express';
import { store } from '../store/memory-store';

const router = Router();

router.get('/', (_req: Request, res: Response) => {
  res.json(store.getUsers());
});

router.get('/:id', (req: Request, res: Response) => {
  const user = store.getUserById(Number(req.params.id));
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  res.json(user);
});

router.post('/', (req: Request, res: Response) => {
  const { name, email, role } = req.body;
  if (!name || !email) {
    res.status(400).json({ error: 'name and email are required' });
    return;
  }
  const user = store.createUser({ name, email, role: role ?? 'user' });
  res.status(201).json(user);
});

router.put('/:id', (req: Request, res: Response) => {
  const updated = store.updateUser(Number(req.params.id), req.body);
  if (!updated) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  res.json(updated);
});

router.delete('/:id', (req: Request, res: Response) => {
  const deleted = store.deleteUser(Number(req.params.id));
  if (!deleted) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  res.status(204).send();
});

export default router;
