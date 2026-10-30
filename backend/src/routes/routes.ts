import { Router, Request, Response } from 'express';
import { requireAuth, supabase } from '../middleware/auth';

const router = Router();
const TABLE = 'saved_routes';

interface SavedRoute {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
  route_data: Record<string, unknown>;
}

// In-memory route storage for demo/development mode when Supabase is not configured
const inMemoryRoutes: SavedRoute[] = [];

const isSupabaseLive = () =>
  Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);

/**
 * GET /api/routes
 * List all saved routes for the authenticated user.
 */
router.get('/', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.id;

  if (isSupabaseLive()) {
    try {
      const { data, error } = await supabase
        .from(TABLE)
        .select('id, name, created_at, route_data')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (!error && data) {
        // Also combine with inMemoryRoutes if any exist during the current session
        const combined = [
          ...inMemoryRoutes.filter((r) => r.user_id === userId),
          ...data,
        ];
        res.json(combined);
        return;
      }
    } catch (err) {
      console.warn('Supabase query failed, falling back to session storage:', err);
    }
  }

  // Graceful fallback to memory store
  const userLocalRoutes = inMemoryRoutes
    .filter((r) => r.user_id === userId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  res.json(userLocalRoutes);
});

/**
 * POST /api/routes
 * Save a new route for the authenticated user.
 */
router.post('/', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const { name, route_data } = req.body as Partial<Pick<SavedRoute, 'name' | 'route_data'>>;
  const userId = req.user!.id;

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    res.status(400).json({ error: '"name" is required and must be a non-empty string' });
    return;
  }
  if (name.trim().length > 200) {
    res.status(400).json({ error: '"name" must not exceed 200 characters' });
    return;
  }
  if (!route_data || typeof route_data !== 'object') {
    res.status(400).json({ error: '"route_data" is required and must be an object' });
    return;
  }

  const localRecord: SavedRoute = {
    id: 'route-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
    user_id: userId,
    name: name.trim(),
    created_at: new Date().toISOString(),
    route_data,
  };

  if (isSupabaseLive()) {
    try {
      const { data, error } = await supabase
        .from(TABLE)
        .insert({
          user_id: userId,
          name: name.trim(),
          route_data,
        })
        .select()
        .single();

      if (!error && data) {
        res.status(201).json(data);
        return;
      }
      console.warn('Supabase insert failed (e.g. table not yet migrated). Storing in session store instead:', error?.message);
    } catch (err) {
      console.warn('Supabase insert exception, saving to local store:', err);
    }
  }

  // Always succeed in saving the route so the user can see it in Route History
  inMemoryRoutes.unshift(localRecord);
  res.status(201).json(localRecord);
});

/**
 * GET /api/routes/:id
 * Get a specific saved route (must belong to the authenticated user).
 */
router.get('/:id', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const userId = req.user!.id;

  if (!isSupabaseLive()) {
    const route = inMemoryRoutes.find((r) => r.id === id && r.user_id === userId);
    if (!route) {
      res.status(404).json({ error: 'Route not found' });
      return;
    }
    res.json(route);
    return;
  }

  try {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      res.status(404).json({ error: 'Route not found' });
      return;
    }

    res.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('GET /api/routes/:id error:', message);
    res.status(500).json({ error: 'Failed to fetch route: ' + message });
  }
});

/**
 * DELETE /api/routes/:id
 * Delete a saved route (must belong to the authenticated user).
 */
router.delete('/:id', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const userId = req.user!.id;

  if (!isSupabaseLive()) {
    const index = inMemoryRoutes.findIndex((r) => r.id === id && r.user_id === userId);
    if (index === -1) {
      res.status(404).json({ error: 'Route not found' });
      return;
    }
    inMemoryRoutes.splice(index, 1);
    res.status(204).send();
    return;
  }

  try {
    // First verify ownership
    const { data: existing, error: fetchError } = await supabase
      .from(TABLE)
      .select('id')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (fetchError || !existing) {
      res.status(404).json({ error: 'Route not found' });
      return;
    }

    const { error: deleteError } = await supabase
      .from(TABLE)
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (deleteError) throw deleteError;

    res.status(204).send();
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('DELETE /api/routes/:id error:', message);
    res.status(500).json({ error: 'Failed to delete route: ' + message });
  }
});

export default router;
