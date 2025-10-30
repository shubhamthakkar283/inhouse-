const { allQuery, getQuery, runQuery } = require('../database');
const { normalizeTime: normalizeTimeUtil, parseDuration: parseDurationUtil, shiftTimelineToStart } = require('../utils/timeUtils');

function normalizeTime(timeStr) {
  return normalizeTimeUtil(timeStr || '09:00');
}

function parseDuration(durationStr) {
  return parseDurationUtil(durationStr);
}

const eventController = {
  getAllEvents: async (req, res) => {
    try {
      const events = await allQuery('SELECT * FROM events ORDER BY created_at DESC');

      events.forEach(event => {
        if (event.ai_generated_content) {
          try {
            event.ai_generated_content = JSON.parse(event.ai_generated_content);

            if (event.ai_generated_content.timeline) {
              event.ai_generated_content.timeline = event.ai_generated_content.timeline.map(item => {
                const timeStr = item.time || '09:00';
                const normalizedTime = normalizeTime(timeStr);

                let durationInMinutes = 60;
                if (item.duration) {
                  durationInMinutes = parseDuration(item.duration);
                }

                return {
                  ...item,
                  time: normalizedTime,
                  duration: durationInMinutes
                };
              });
            }
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

          if (event.ai_generated_content.timeline) {
            event.ai_generated_content.timeline = event.ai_generated_content.timeline.map(item => {
              const timeStr = item.time || '09:00';
              const normalizedTime = normalizeTime(timeStr);

              let durationInMinutes = 60;
              if (item.duration) {
                durationInMinutes = parseDuration(item.duration);
              }

              return {
                ...item,
                time: normalizedTime,
                duration: durationInMinutes
              };
            });
          }
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
        ai_generated_content,
        preference_id
      } = req.body;

      // Derive start time from provided time or AI timeline first item
const aiFirstStart = (ai_generated_content && Array.isArray(ai_generated_content.timeline) && ai_generated_content.timeline.length > 0)
  ? normalizeTime(ai_generated_content.timeline[0]?.time || ai_generated_content.timeline[0]?.startTime || '09:00')
  : null;
const safeEventStartTime = time ? normalizeTime(time) : aiFirstStart;

      let processedAiContent = ai_generated_content;

      if (ai_generated_content && Array.isArray(ai_generated_content.timeline)) {
        // Normalize timeline items first
        let normalizedTimeline = ai_generated_content.timeline.map((item) => {
          const timeStr = item.time || item.startTime || '09:00';
          const normalizedTime = normalizeTime(timeStr);
          const durationInMinutes = parseDuration(item.duration);
          return {
            ...item,
            time: normalizedTime,
            duration: durationInMinutes
          };
        });

        // If event has a start time, align the timeline start to it
        if (safeEventStartTime) {
          normalizedTimeline = shiftTimelineToStart(normalizedTimeline, safeEventStartTime);
        }

        processedAiContent = {
          ...ai_generated_content,
          timeline: normalizedTimeline
        };
      }

      const aiContentJson = processedAiContent ? JSON.stringify(processedAiContent) : null;

      const result = await runQuery(
        `INSERT INTO events (
          user_id, event_name, event_type, description, date, time,
          location, city, venue_type, audience_size, duration, status, ai_generated_content
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [user_id, event_name, event_type, description, date, safeEventStartTime, location, city, venue_type, audience_size, duration, status, aiContentJson]
      );

      if (preference_id) {
        await runQuery(
          'UPDATE event_preferences SET event_id = ? WHERE id = ?',
          [result.id, preference_id]
        );
      }

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

      // Derive start time from provided time or AI timeline first item
const aiFirstStart = (ai_generated_content && Array.isArray(ai_generated_content.timeline) && ai_generated_content.timeline.length > 0)
  ? normalizeTime(ai_generated_content.timeline[0]?.time || ai_generated_content.timeline[0]?.startTime || '09:00')
  : null;
const safeEventStartTime = time ? normalizeTime(time) : aiFirstStart;

      let processedAiContent = ai_generated_content;

      if (ai_generated_content && Array.isArray(ai_generated_content.timeline)) {
        let normalizedTimeline = ai_generated_content.timeline.map((item) => {
          const timeStr = item.time || item.startTime || '09:00';
          const normalizedTime = normalizeTime(timeStr);
          const durationInMinutes = parseDuration(item.duration);
          return {
            ...item,
            time: normalizedTime,
            duration: durationInMinutes
          };
        });

        if (safeEventStartTime) {
          normalizedTimeline = shiftTimelineToStart(normalizedTimeline, safeEventStartTime);
        }

        processedAiContent = {
          ...ai_generated_content,
          timeline: normalizedTimeline
        };
      }

      const aiContentJson = processedAiContent ? JSON.stringify(processedAiContent) : null;

      await runQuery(
        `UPDATE events SET
          event_name = ?, event_type = ?, description = ?, date = ?, time = ?,
          location = ?, city = ?, venue_type = ?, audience_size = ?, duration = ?,
          status = ?, ai_generated_content = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?`,
        [event_name, event_type, description, date, safeEventStartTime, location, city, venue_type, audience_size, duration, status, aiContentJson, req.params.id]
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
  },

  getEventWithPreferences: async (req, res) => {
    try {
      const userId = req.query.user_id || 1;

      const preference = await getQuery(
        'SELECT * FROM event_preferences WHERE user_id = ? ORDER BY created_at DESC LIMIT 1',
        [userId]
      );

      // Normalize preference event_time for frontend consumption
      if (preference && preference.event_time) {
        preference.event_time = normalizeTime(preference.event_time);
      }

      let event = null;
      if (preference && preference.event_id) {
        event = await getQuery('SELECT * FROM events WHERE id = ?', [preference.event_id]);
      }

      // Fallback: if no linked event, return the latest event for this user
      if (!event) {
        event = await getQuery('SELECT * FROM events WHERE user_id = ? ORDER BY created_at DESC LIMIT 1', [userId]);
      }

      if (event) {
        if (event.time) {
          event.time = normalizeTime(event.time);
        }

        if (event.ai_generated_content) {
          try {
            event.ai_generated_content = JSON.parse(event.ai_generated_content);

            if (event.ai_generated_content.timeline) {
              // Normalize each item first
              let normalizedTimeline = event.ai_generated_content.timeline.map(item => {
                const timeStr = item.time || item.startTime || '09:00';
                const normalizedTime = normalizeTime(timeStr);

                let durationInMinutes = 60;
                if (item.duration) {
                  durationInMinutes = parseDuration(item.duration);
                }

                return {
                  ...item,
                  time: normalizedTime,
                  duration: durationInMinutes
                };
              });

              // Determine effective start: preference -> event -> AI first -> default
              const aiFirst = (normalizedTimeline && normalizedTimeline.length > 0) ? normalizedTimeline[0].time : null;
              const desiredStart = preference?.event_time || event.time || aiFirst || '09:00';

              // Reflect effective start time back to event for frontend display
              event.time = desiredStart;

              // Align timeline start with the effective start time
              normalizedTimeline = shiftTimelineToStart(normalizedTimeline, desiredStart);

              event.ai_generated_content.timeline = normalizedTimeline;
            }
          } catch (e) {
            console.error('Error parsing AI content:', e);
          }
        }
      }

      res.json({
        success: true,
        data: {
          event,
          preference
        }
      });
    } catch (error) {
      console.error('Error getting event with preferences:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
};

module.exports = eventController;
    