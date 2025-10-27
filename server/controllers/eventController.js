const { allQuery, getQuery, runQuery } = require('../database');

function normalizeTime(timeStr) {
  if (!timeStr) return '09:00';

  timeStr = timeStr.trim();

  const time24Regex = /^(\d{1,2}):(\d{2})$/;
  const match24 = timeStr.match(time24Regex);
  if (match24) {
    const hours = parseInt(match24[1], 10);
    const minutes = match24[2];
    return `${String(hours).padStart(2, '0')}:${minutes}`;
  }

  const time12Regex = /^(\d{1,2}):(\d{2})\s*(AM|PM|am|pm)$/i;
  const match12 = timeStr.match(time12Regex);
  if (match12) {
    let hours = parseInt(match12[1], 10);
    const minutes = match12[2];
    const period = match12[3].toUpperCase();

    if (period === 'PM' && hours !== 12) {
      hours += 12;
    } else if (period === 'AM' && hours === 12) {
      hours = 0;
    }

    return `${String(hours).padStart(2, '0')}:${minutes}`;
  }

  return '09:00';
}

function parseDuration(durationStr) {
  if (typeof durationStr === 'number') return durationStr;

  if (!durationStr || typeof durationStr !== 'string') return 60;

  durationStr = durationStr.trim().toLowerCase();

  const hourRegex = /(\d+)\s*(?:hour|hr|h)/i;
  const minuteRegex = /(\d+)\s*(?:minute|min|m)/i;

  let totalMinutes = 0;

  const hourMatch = durationStr.match(hourRegex);
  if (hourMatch) {
    totalMinutes += parseInt(hourMatch[1], 10) * 60;
  }

  const minuteMatch = durationStr.match(minuteRegex);
  if (minuteMatch) {
    totalMinutes += parseInt(minuteMatch[1], 10);
  }

  return totalMinutes > 0 ? totalMinutes : 60;
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

      let processedAiContent = ai_generated_content;
      let eventStartTime = time;

      if (ai_generated_content && ai_generated_content.timeline) {
        const firstActivityTime = ai_generated_content.timeline[0]?.time;

        processedAiContent = {
          ...ai_generated_content,
          timeline: ai_generated_content.timeline.map((item, index) => {
            const timeStr = item.time || '09:00';
            const normalizedTime = normalizeTime(timeStr);

            let durationInMinutes = 60;
            if (item.duration) {
              durationInMinutes = parseDuration(item.duration);
            }

            if (index === 0 && eventStartTime && normalizedTime !== eventStartTime) {
              const [eventHour, eventMin] = eventStartTime.split(':').map(Number);
              const [activityHour, activityMin] = normalizedTime.split(':').map(Number);

              const eventMinutes = eventHour * 60 + eventMin;
              const activityMinutes = activityHour * 60 + activityMin;
              const timeDiff = eventMinutes - activityMinutes;

              processedAiContent.timelineOffset = timeDiff;
            }

            return {
              ...item,
              time: normalizedTime,
              duration: durationInMinutes
            };
          })
        };
      }

      const aiContentJson = processedAiContent ? JSON.stringify(processedAiContent) : null;

      const result = await runQuery(
        `INSERT INTO events (
          user_id, event_name, event_type, description, date, time,
          location, city, venue_type, audience_size, duration, status, ai_generated_content
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [user_id, event_name, event_type, description, date, time, location, city, venue_type, audience_size, duration, status, aiContentJson]
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

      let processedAiContent = ai_generated_content;

      if (ai_generated_content && ai_generated_content.timeline) {
        processedAiContent = {
          ...ai_generated_content,
          timeline: ai_generated_content.timeline.map(item => {
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
          })
        };
      }

      const aiContentJson = processedAiContent ? JSON.stringify(processedAiContent) : null;

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
  },

  getEventWithPreferences: async (req, res) => {
    try {
      const userId = req.query.user_id || 1;

      const preference = await getQuery(
        'SELECT * FROM event_preferences WHERE user_id = ? ORDER BY created_at DESC LIMIT 1',
        [userId]
      );

      let event = null;
      if (preference && preference.event_id) {
        event = await getQuery('SELECT * FROM events WHERE id = ?', [preference.event_id]);

        if (event && event.ai_generated_content) {
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
    