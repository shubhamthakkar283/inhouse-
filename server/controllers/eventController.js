const { allQuery, getQuery, runQuery } = require('../database');

const eventController = {
  getAllEvents: async (req, res) => {
    try {
      const events = await allQuery('SELECT * FROM events ORDER BY created_at DESC');

      events.forEach(event => {
        if (event.ai_generated_content) {
          try {
            event.ai_generated_content = JSON.parse(event.ai_generated_content);
          } catch (e) {
            console.error('Error parsing AI content for event', event.id, e);
          }
        }
      });

      res.json({ success: true, data: events });
    } catch (error) {
      console.error('Error getting events:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  getEventById: async (req, res) => {
    try {
      const event = await getQuery('SELECT * FROM events WHERE id = ?', [req.params.id]);
      if (!event) {
        return res.status(404).json({ success: false, error: 'Event not found' });
      }

      if (event.ai_generated_content) {
        try {
          event.ai_generated_content = JSON.parse(event.ai_generated_content);
        } catch (e) {
          console.error('Error parsing AI content:', e);
        }
      }

      res.json({ success: true, data: event });
    } catch (error) {
      console.error('Error getting event:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  createEvent: async (req, res) => {
    try {
      const {
        user_id = 1,
        event_name = 'Untitled Event',
        event_type = 'general',
        description,
        date,
        time,
        location,
        city,
        venue_type,
        audience_size,
        duration,
        status = 'planning',
        ai_generated_content
      } = req.body;

      const aiContentJson = ai_generated_content ? JSON.stringify(ai_generated_content) : null;

      const result = await runQuery(
        `INSERT INTO events (
          user_id, event_name, event_type, description, date, time,
          location, city, venue_type, audience_size, duration, status, ai_generated_content
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [user_id, event_name, event_type, description, date, time, location, city, venue_type, audience_size, duration, status, aiContentJson]
      );

      const event = await getQuery('SELECT * FROM events WHERE id = ?', [result.id]);

      if (event && event.ai_generated_content) {
        try {
          event.ai_generated_content = JSON.parse(event.ai_generated_content);
        } catch (e) {
          console.error('Error parsing AI content:', e);
        }
      }

      res.status(201).json({ success: true, data: event });
    } catch (error) {
      console.error('Error creating event:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  updateEvent: async (req, res) => {
    try {
      const {
        event_name,
        event_type,
        description,
        date,
        time,
        location,
        city,
        venue_type,
        audience_size,
        duration,
        status,
        ai_generated_content
      } = req.body;

      const aiContentJson = ai_generated_content ? JSON.stringify(ai_generated_content) : null;

      await runQuery(
        `UPDATE events SET
          event_name = ?, event_type = ?, description = ?, date = ?, time = ?,
          location = ?, city = ?, venue_type = ?, audience_size = ?, duration = ?,
          status = ?, ai_generated_content = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?`,
        [event_name, event_type, description, date, time, location, city, venue_type, audience_size, duration, status, aiContentJson, req.params.id]
      );

      const event = await getQuery('SELECT * FROM events WHERE id = ?', [req.params.id]);

      if (event && event.ai_generated_content) {
        try {
          event.ai_generated_content = JSON.parse(event.ai_generated_content);
        } catch (e) {
          console.error('Error parsing AI content:', e);
        }
      }

      res.json({ success: true, data: event });
    } catch (error) {
      console.error('Error updating event:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  deleteEvent: async (req, res) => {
    try {
      await runQuery('DELETE FROM events WHERE id = ?', [req.params.id]);
      res.json({ success: true, message: 'Event deleted successfully' });
    } catch (error) {
      console.error('Error deleting event:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
};

module.exports = eventController;
    