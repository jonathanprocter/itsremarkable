import { Router } from 'express';
import { logger } from '../logger';
import { ValidationError } from '../errors';

const router = Router();

/**
 * EXPORT ROUTES
 */

/**
 * POST /api/export/pymypdf-bidirectional
 * Export events to PDF using PyMyPDF bidirectional template
 */
router.post('/export/pymypdf-bidirectional', async (req, res) => {
  try {
    logger.info('PyMyPDF bidirectional export request received');

    const { events, weekStart, weekEnd } = req.body;

    if (!events || !weekStart || !weekEnd) {
      throw new ValidationError(
        'Missing required parameters: events, weekStart, weekEnd'
      );
    }

    // Import Node.js modules
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const fs = await import('fs');
    const execAsync = promisify(exec);

    // Write events to temporary file to avoid shell escaping issues
    const tempEventsFile = `/tmp/events_${Date.now()}.json`;
    const eventsData =
      typeof events === 'string' ? events : JSON.stringify(events);
    fs.default.writeFileSync(tempEventsFile, eventsData);

    const pythonCommand = `python3 pymypdf_bidirectional_export.py "${tempEventsFile}" "${weekStart}" "${weekEnd}"`;

    logger.debug('Executing PyMyPDF template', {
      command: pythonCommand.substring(0, 100),
      tempFile: tempEventsFile,
    });

    // Execute Python script
    const { stdout, stderr } = await execAsync(pythonCommand);

    if (stderr) {
      logger.warn('Python script stderr output', { stderr });
    }

    // Extract actual filename from Python script output
    const outputLines = stdout.trim().split('\n');
    let actualFilename = '';

    // Find the line that contains a filename (and ONLY a filename)
    for (const line of outputLines) {
      const trimmedLine = line.trim();

      // Check if this line looks like a filename: ends with .txt/.pdf, no spaces, no emoji
      if (
        (trimmedLine.endsWith('.txt') || trimmedLine.endsWith('.pdf')) &&
        !trimmedLine.includes(' ') &&
        !trimmedLine.includes('✅') &&
        !trimmedLine.includes('🔗') &&
        !trimmedLine.includes('📊') &&
        !trimmedLine.includes('Creating') &&
        !trimmedLine.includes('Processing') &&
        !trimmedLine.includes('Successfully') &&
        !trimmedLine.includes('Generated')
      ) {
        actualFilename = trimmedLine;
        break;
      }
    }

    // Fallback: if no clean filename found, extract from the last line
    if (!actualFilename) {
      const lastLine = outputLines[outputLines.length - 1].trim();
      // Extract anything that looks like a filename from the last line
      const filenameMatch = lastLine.match(/([a-zA-Z0-9_\-]+\.(?:txt|pdf))/);
      if (filenameMatch) {
        actualFilename = filenameMatch[1];
      } else {
        actualFilename = lastLine; // Last resort
      }
    }

    logger.info('PyMyPDF export completed successfully', { filename: actualFilename });

    res.json({
      success: true,
      filename: actualFilename,
      message: 'Bidirectional PDF created successfully with PyMyPDF',
    });
  } catch (error) {
    logger.error('PyMyPDF export failed', { error });
    throw error;
  }
});

/**
 * GET /api/download/:filename
 * Download exported files (PDF, TXT)
 */
router.get('/download/:filename', async (req, res) => {
  try {
    const filename = req.params.filename;
    const fs = await import('fs');
    const path = await import('path');

    // Security: Robust path validation to prevent path traversal
    // Use whitelist approach: resolve path and verify it stays within allowed directory
    const allowedDir = path.default.resolve(process.cwd());
    const filePath = path.default.resolve(process.cwd(), filename);

    // Ensure the resolved path is within the allowed directory
    if (!filePath.startsWith(allowedDir + path.default.sep) && filePath !== allowedDir) {
      logger.warn('Path traversal attempt detected', { filename, filePath, allowedDir });
      throw new ValidationError('Invalid filename - path traversal not allowed');
    }

    if (!fs.default.existsSync(filePath)) {
      logger.warn('File not found for download', { filename, filePath });
      return res.status(404).json({ error: 'File not found' });
    }

    logger.debug('Serving file for download', { filename });

    // Set proper content type for downloads
    const ext = path.default.extname(filename).toLowerCase();
    if (ext === '.pdf') {
      res.setHeader('Content-Type', 'application/pdf');
    } else if (ext === '.txt') {
      res.setHeader('Content-Type', 'text/plain');
    }

    res.download(filePath, filename, (err) => {
      if (err) {
        logger.error('Download failed', { error: err, filename });
        if (!res.headersSent) {
          res.status(500).json({ error: 'Download failed' });
        }
      }

      // Clean up file immediately after download completes (success or failure)
      // Using async to avoid blocking, but errors are logged
      fs.promises.unlink(filePath)
        .then(() => logger.debug('Cleaned up downloaded file', { filename }))
        .catch((cleanupError) => logger.error('File cleanup error', { error: cleanupError, filename }));
    });
  } catch (error) {
    logger.error('Download endpoint error', { error });
    throw error;
  }
});

export default router;
