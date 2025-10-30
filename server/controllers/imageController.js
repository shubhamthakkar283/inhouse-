const imageService = require('../services/imageService');
const { runQuery, getQuery, allQuery } = require('../database');

const imageController = {
  generateImage: async (req, res) => {
    try {
      const {
        prompt,
        eventType,
        assetType,
        theme,
        width = 1024,
        height = 1024,
        seed = 42,
        eventId
      } = req.body;

      if (!prompt) {
        return res.status(400).json({
          success: false,
          error: 'Prompt is required'
        });
      }

      const result = await imageService.generateImage(prompt, {
        width,
        height,
        seed,
        eventType,
        assetType,
        theme
      });

      if (!result.success) {
        return res.status(500).json({
          success: false,
          error: result.error
        });
      }

      if (eventId) {
        await runQuery(
          `INSERT INTO generated_images (
            event_id, prompt, image_url, metadata
          ) VALUES (?, ?, ?, ?)`,
          [
            eventId,
            prompt,
            result.imageUrl,
            JSON.stringify(result.metadata)
          ]
        );
      }

      res.json({
        success: true,
        data: {
          imageUrl: result.imageUrl,
          metadata: result.metadata
        }
      });
    } catch (error) {
      console.error('Error in generateImage controller:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  generateMultipleImages: async (req, res) => {
    try {
      const {
        prompt,
        eventType,
        assetType,
        theme,
        width = 1024,
        height = 1024,
        count = 3,
        eventId
      } = req.body;

      if (!prompt) {
        return res.status(400).json({
          success: false,
          error: 'Prompt is required'
        });
      }

      const results = await imageService.generateMultipleImages(
        prompt,
        {
          width,
          height,
          eventType,
          assetType,
          theme
        },
        count
      );

      const successfulImages = results.filter(r => r.success);

      if (eventId && successfulImages.length > 0) {
        for (const result of successfulImages) {
          await runQuery(
            `INSERT INTO generated_images (
              event_id, prompt, image_url, metadata
            ) VALUES (?, ?, ?, ?)`,
            [
              eventId,
              prompt,
              result.imageUrl,
              JSON.stringify(result.metadata)
            ]
          );
        }
      }

      res.json({
        success: true,
        data: {
          images: successfulImages.map(r => ({
            imageUrl: r.imageUrl,
            metadata: r.metadata
          })),
          total: successfulImages.length
        }
      });
    } catch (error) {
      console.error('Error in generateMultipleImages controller:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  getEventImages: async (req, res) => {
    try {
      const { eventId } = req.params;

      const images = await allQuery(
        'SELECT * FROM generated_images WHERE event_id = ? ORDER BY created_at DESC',
        [eventId]
      );

      res.json({
        success: true,
        data: images.map(img => ({
          ...img,
          metadata: (() => { try { return JSON.parse(img.metadata || '{}'); } catch { return {}; } })()
        }))
      });
    } catch (error) {
      console.error('Error getting event images:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
};

module.exports = imageController;
