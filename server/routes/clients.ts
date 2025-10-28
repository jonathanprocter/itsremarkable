import { Router } from 'express';
import { storage } from '../storage';
import { requireAuth, AuthenticatedRequest } from '../auth-middleware';
import { logger } from '../logger';
import { ValidationError, NotFoundError, DatabaseError } from '../errors';

const router = Router();

/**
 * GET /api/clients
 * Get all clients for the authenticated user
 */
router.get('/', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.authenticatedUserId!;
    logger.debug('Fetching clients', { userId });

    const clients = await storage.getClients(userId);

    logger.debug('Clients fetched successfully', {
      userId,
      count: clients.length,
    });

    res.json(clients);
  } catch (error) {
    logger.error('Failed to fetch clients', { error });
    throw new DatabaseError('Failed to fetch clients');
  }
});

/**
 * GET /api/clients/:id
 * Get a specific client by ID
 */
router.get('/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.authenticatedUserId!;
    const clientId = parseInt(req.params.id);

    if (isNaN(clientId)) {
      throw new ValidationError('Invalid client ID');
    }

    logger.debug('Fetching client', { userId, clientId });

    const client = await storage.getClient(clientId, userId);

    if (!client) {
      throw new NotFoundError('Client', clientId);
    }

    res.json(client);
  } catch (error) {
    if (error instanceof ValidationError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Failed to fetch client', { error });
    throw new DatabaseError('Failed to fetch client');
  }
});

/**
 * POST /api/clients
 * Create a new client
 */
router.post('/', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.authenticatedUserId!;
    const clientData = req.body;

    // Validation
    if (!clientData.name) {
      throw new ValidationError('Client name is required');
    }

    logger.debug('Creating client', { userId, name: clientData.name });

    const client = await storage.createClient({
      ...clientData,
      userId,
    });

    logger.info('Client created successfully', {
      userId,
      clientId: client.id,
      name: client.name,
    });

    res.status(201).json(client);
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }
    logger.error('Failed to create client', { error });
    throw new DatabaseError('Failed to create client');
  }
});

/**
 * PUT /api/clients/:id
 * Update an existing client
 */
router.put('/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.authenticatedUserId!;
    const clientId = parseInt(req.params.id);
    const updates = req.body;

    if (isNaN(clientId)) {
      throw new ValidationError('Invalid client ID');
    }

    logger.debug('Updating client', { userId, clientId });

    // Verify client belongs to user
    const existingClient = await storage.getClient(clientId, userId);
    if (!existingClient) {
      throw new NotFoundError('Client', clientId);
    }

    const client = await storage.updateClient(clientId, updates);

    if (!client) {
      throw new NotFoundError('Client', clientId);
    }

    logger.info('Client updated successfully', {
      userId,
      clientId,
      name: client.name,
    });

    res.json(client);
  } catch (error) {
    if (error instanceof ValidationError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Failed to update client', { error });
    throw new DatabaseError('Failed to update client');
  }
});

/**
 * GET /api/clients/search/:query
 * Search clients by name, email, or phone
 */
router.get('/search/:query', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.authenticatedUserId!;
    const query = req.params.query;

    if (!query || query.length < 2) {
      throw new ValidationError('Search query must be at least 2 characters');
    }

    logger.debug('Searching clients', { userId, query });

    const clients = await storage.searchClients(userId, query);

    logger.debug('Client search completed', {
      userId,
      query,
      resultsCount: clients.length,
    });

    res.json(clients);
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }
    logger.error('Failed to search clients', { error });
    throw new DatabaseError('Failed to search clients');
  }
});

/**
 * DELETE /api/clients/:id
 * Delete a client (soft delete by setting status to 'archived')
 */
router.delete('/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.authenticatedUserId!;
    const clientId = parseInt(req.params.id);

    if (isNaN(clientId)) {
      throw new ValidationError('Invalid client ID');
    }

    logger.debug('Archiving client', { userId, clientId });

    // Verify client belongs to user
    const existingClient = await storage.getClient(clientId, userId);
    if (!existingClient) {
      throw new NotFoundError('Client', clientId);
    }

    // Soft delete by updating status to archived
    await storage.updateClient(clientId, { status: 'archived' });

    logger.info('Client archived successfully', { userId, clientId });

    res.json({ success: true, message: 'Client archived successfully' });
  } catch (error) {
    if (error instanceof ValidationError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Failed to archive client', { error });
    throw new DatabaseError('Failed to archive client');
  }
});

export default router;
