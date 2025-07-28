import { Router } from 'express';
import { storage } from './storage';
import { 
  insertClientSchema, 
  insertSessionNoteSchema,
  Client,
  SessionNote 
} from '@shared/schema';
import { z } from 'zod';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = Router();
const upload = multer({ dest: 'uploads/' });

// Get all clients for a user
router.get('/clients', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const clients = await storage.getClients(userId);
    res.json(clients);
  } catch (error) {
    console.error('Error fetching clients:', error);
    res.status(500).json({ error: 'Failed to fetch clients' });
  }
});

// Get specific client
router.get('/clients/:id', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const clientId = parseInt(req.params.id);
    const client = await storage.getClient(clientId, userId);
    
    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    res.json(client);
  } catch (error) {
    console.error('Error fetching client:', error);
    res.status(500).json({ error: 'Failed to fetch client' });
  }
});

// Create new client
router.post('/clients', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const validatedData = insertClientSchema.parse({
      ...req.body,
      userId
    });

    const client = await storage.createClient(validatedData);
    res.status(201).json(client);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid client data', details: error.errors });
    }
    console.error('Error creating client:', error);
    res.status(500).json({ error: 'Failed to create client' });
  }
});

// Update client
router.put('/clients/:id', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const clientId = parseInt(req.params.id);
    const updates = req.body;

    const client = await storage.updateClient(clientId, userId, updates);
    res.json(client);
  } catch (error) {
    console.error('Error updating client:', error);
    res.status(500).json({ error: 'Failed to update client' });
  }
});

// Get session notes for a client
router.get('/session-notes/:clientId', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const clientId = parseInt(req.params.clientId);
    const sessionNotes = await storage.getSessionNotes(clientId, userId);
    res.json(sessionNotes);
  } catch (error) {
    console.error('Error fetching session notes:', error);
    res.status(500).json({ error: 'Failed to fetch session notes' });
  }
});

// Create session note
router.post('/session-notes', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const validatedData = insertSessionNoteSchema.parse({
      ...req.body,
      userId
    });

    const sessionNote = await storage.createSessionNote(validatedData);
    res.status(201).json(sessionNote);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid session note data', details: error.errors });
    }
    console.error('Error creating session note:', error);
    res.status(500).json({ error: 'Failed to create session note' });
  }
});

// Get session materials for a client
router.get('/session-materials/:clientId', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const clientId = parseInt(req.params.clientId);
    const materials = await storage.getSessionMaterials(clientId, userId);
    res.json(materials);
  } catch (error) {
    console.error('Error fetching session materials:', error);
    res.status(500).json({ error: 'Failed to fetch session materials' });
  }
});

// Upload session materials
router.post('/session-materials/upload', upload.array('files'), async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const clientId = parseInt(req.body.clientId);
    const files = req.files as Express.Multer.File[];
    
    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const uploadedMaterials = [];

    for (const file of files) {
      // Extract text content if it's a text file or PDF
      let contentText = '';
      if (file.mimetype.startsWith('text/')) {
        contentText = fs.readFileSync(file.path, 'utf8');
      }

      const material = await storage.createSessionMaterial({
        clientId,
        userId,
        materialType: determineMaterialType(file.mimetype),
        fileName: file.originalname,
        filePath: file.path,
        fileSize: file.size,
        contentText
      });

      uploadedMaterials.push(material);
    }

    res.status(201).json(uploadedMaterials);
  } catch (error) {
    console.error('Error uploading session materials:', error);
    res.status(500).json({ error: 'Failed to upload session materials' });
  }
});

// Generate AI case conceptualization
router.post('/ai-conceptualization/:clientId/generate', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const clientId = parseInt(req.params.clientId);
    
    // Get client data and session notes for AI analysis
    const client = await storage.getClient(clientId, userId);
    const sessionNotes = await storage.getSessionNotes(clientId, userId);
    const materials = await storage.getSessionMaterials(clientId, userId);

    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    // Generate AI conceptualization using OpenAI
    const conceptualization = await generateAIConceptualization(client, sessionNotes, materials);
    
    // Save the conceptualization
    const savedConceptualization = await storage.saveAIConceptualization({
      clientId,
      userId,
      ...conceptualization
    });

    res.json(savedConceptualization);
  } catch (error) {
    console.error('Error generating AI conceptualization:', error);
    res.status(500).json({ error: 'Failed to generate AI conceptualization' });
  }
});

// Get AI case conceptualization
router.get('/ai-conceptualization/:clientId', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const clientId = parseInt(req.params.clientId);
    const conceptualization = await storage.getAIConceptualization(clientId, userId);
    
    res.json(conceptualization);
  } catch (error) {
    console.error('Error fetching AI conceptualization:', error);
    res.status(500).json({ error: 'Failed to fetch AI conceptualization' });
  }
});

function determineMaterialType(mimetype: string): string {
  if (mimetype.startsWith('image/')) return 'document';
  if (mimetype === 'application/pdf') return 'assessment';
  if (mimetype.startsWith('text/')) return 'summary';
  if (mimetype.startsWith('audio/')) return 'recording';
  return 'document';
}

async function generateAIConceptualization(client: any, sessionNotes: any[], materials: any[]) {
  // This would integrate with OpenAI API to generate case conceptualization
  // For now, return a structured response
  
  const allText = [
    client.notes || '',
    ...sessionNotes.map(note => [
      note.progress || '',
      note.goals || '',
      note.sessionNotes || '',
      note.riskAssessment || ''
    ].join(' ')),
    ...materials.map(material => material.contentText || '')
  ].join('\n\n');

  // This would call OpenAI API with the collected text
  // const aiResponse = await openai.chat.completions.create({...})
  
  // Mock response for now
  return {
    conceptualizationData: {
      clientProfile: `Comprehensive case analysis for ${client.name}`,
      keyThemes: ['Progress tracking', 'Goal setting', 'Risk management'],
      treatmentApproach: 'Evidence-based intervention strategies'
    },
    presentingProblems: ['Primary concern area', 'Secondary issues'],
    treatmentGoals: ['Short-term objectives', 'Long-term outcomes'],
    interventionsUsed: ['CBT techniques', 'Behavioral strategies'],
    progressIndicators: {
      improvementAreas: ['Communication', 'Coping skills'],
      challengeAreas: ['Consistency', 'Follow-through']
    },
    riskFactors: [],
    strengths: ['Client engagement', 'Family support'],
    recommendations: ['Continue current approach', 'Consider group therapy'],
    confidenceScore: 0.85
  };
}

export default router;