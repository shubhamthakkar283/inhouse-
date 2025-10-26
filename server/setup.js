const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'eventplanner.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
    process.exit(1);
  } else {
    console.log('✓ Connected to SQLite database at:', dbPath);
  }
});

const setupDatabase = () => {
  return new Promise((resolve, reject) => {
    console.log('\n========================================');
    console.log('  Database Setup Utility');
    console.log('========================================\n');
    console.log('Creating database tables...\n');

    db.serialize(() => {
      db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        full_name TEXT,
        phone TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`, (err) => {
        if (err) {
          console.error('✗ Error creating users table:', err.message);
          reject(err);
        } else {
          console.log('✓ Users table created');
        }
      });

      db.run(`CREATE TABLE IF NOT EXISTS events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        event_name TEXT NOT NULL,
        event_type TEXT NOT NULL,
        description TEXT,
        date DATE,
        time TIME,
        location TEXT,
        city TEXT,
        venue_type TEXT,
        audience_size INTEGER DEFAULT 0,
        duration INTEGER DEFAULT 4,
        status TEXT DEFAULT 'planning',
        ai_generated_content TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )`, (err) => {
        if (err) {
          console.error('✗ Error creating events table:', err.message);
          reject(err);
        } else {
          console.log('✓ Events table created');
        }
      });

      db.run(`CREATE TABLE IF NOT EXISTS budgets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        event_id INTEGER NOT NULL,
        venue_total REAL DEFAULT 0,
        catering_total REAL DEFAULT 0,
        services_total REAL DEFAULT 0,
        miscellaneous_total REAL DEFAULT 0,
        grand_total REAL DEFAULT 0,
        budget_data TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
      )`, (err) => {
        if (err) {
          console.error('✗ Error creating budgets table:', err.message);
          reject(err);
        } else {
          console.log('✓ Budgets table created');
        }
      });

      db.run(`CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        event_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        status TEXT DEFAULT 'todo',
        priority TEXT DEFAULT 'medium',
        assigned_to TEXT,
        due_date DATE,
        completed_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
      )`, (err) => {
        if (err) {
          console.error('✗ Error creating tasks table:', err.message);
          reject(err);
        } else {
          console.log('✓ Tasks table created');
        }
      });

      db.run(`CREATE TABLE IF NOT EXISTS marketing_materials (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        event_id INTEGER NOT NULL,
        material_type TEXT NOT NULL,
        title TEXT,
        content TEXT,
        file_path TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
      )`, (err) => {
        if (err) {
          console.error('✗ Error creating marketing_materials table:', err.message);
          reject(err);
        } else {
          console.log('✓ Marketing Materials table created');
        }
      });

      db.run(`CREATE TABLE IF NOT EXISTS timeline_activities (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        event_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        activity_type TEXT DEFAULT 'general',
        start_time TIME,
        duration INTEGER DEFAULT 60,
        location TEXT,
        attendees INTEGER,
        description TEXT,
        resources TEXT,
        assigned_to TEXT,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
      )`, (err) => {
        if (err) {
          console.error('✗ Error creating timeline_activities table:', err.message);
          reject(err);
        } else {
          console.log('✓ Timeline Activities table created');
        }
      });

      db.run(`CREATE TABLE IF NOT EXISTS event_preferences (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER DEFAULT 1,
        event_id INTEGER,
        venue TEXT,
        number_of_people INTEGER,
        budget REAL,
        event_date DATE,
        event_time TIME,
        event_type TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE SET NULL
      )`, (err) => {
        if (err) {
          console.error('✗ Error creating event_preferences table:', err.message);
          reject(err);
        } else {
          console.log('✓ Event Preferences table created');
        }
      });

      db.run(`CREATE TABLE IF NOT EXISTS generated_images (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        event_id INTEGER,
        prompt TEXT NOT NULL,
        image_url TEXT NOT NULL,
        metadata TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
      )`, (err) => {
        if (err) {
          console.error('✗ Error creating generated_images table:', err.message);
          reject(err);
        } else {
          console.log('✓ Generated Images table created');
        }
      });

      db.get('SELECT COUNT(*) as count FROM users', [], (err, row) => {
        if (err) {
          console.error('✗ Error checking for sample data:', err.message);
          reject(err);
          return;
        }

        if (row.count === 0) {
          console.log('\n✓ Adding sample data...\n');

          db.run(`INSERT INTO users (username, email, password, full_name, phone) VALUES
            ('johndoe', 'john@example.com', 'password123', 'John Doe', '555-0100'),
            ('janedoe', 'jane@example.com', 'password123', 'Jane Doe', '555-0101')`,
            (err) => {
              if (err) {
                console.error('✗ Error inserting sample users:', err.message);
              } else {
                console.log('✓ Sample users added');
              }
            }
          );

          db.run(`INSERT INTO events (user_id, event_name, event_type, description, date, time, location, city, venue_type, audience_size, duration, status) VALUES
            (1, 'Annual Tech Conference 2025', 'Conference', 'A major technology conference featuring industry leaders', '2025-11-15', '09:00', 'Tech Center', 'San Francisco', 'Convention Center', 500, 8, 'planning'),
            (1, 'Company Holiday Party', 'Corporate Event', 'End of year celebration for employees', '2025-12-20', '18:00', 'Grand Ballroom', 'New York', 'Hotel', 150, 4, 'planning'),
            (2, 'Product Launch Event', 'Product Launch', 'Launch event for our new product line', '2025-11-01', '14:00', 'Innovation Hub', 'Austin', 'Conference Room', 200, 3, 'planning')`,
            (err) => {
              if (err) {
                console.error('✗ Error inserting sample events:', err.message);
              } else {
                console.log('✓ Sample events added');
              }
            }
          );

          db.run(`INSERT INTO tasks (event_id, title, description, status, priority, due_date) VALUES
            (1, 'Book venue', 'Confirm venue booking for conference', 'todo', 'high', '2025-10-15'),
            (1, 'Arrange catering', 'Order food and beverages for attendees', 'todo', 'high', '2025-11-01'),
            (1, 'Send invitations', 'Email invitations to all attendees', 'todo', 'medium', '2025-10-20'),
            (2, 'Decorate venue', 'Set up holiday decorations', 'todo', 'medium', '2025-12-18'),
            (3, 'Prepare demo', 'Set up product demonstration stations', 'todo', 'high', '2025-10-25')`,
            (err) => {
              if (err) {
                console.error('✗ Error inserting sample tasks:', err.message);
              } else {
                console.log('✓ Sample tasks added');
              }
            }
          );

          db.run(`INSERT INTO budgets (event_id, venue_total, catering_total, services_total, miscellaneous_total, grand_total) VALUES
            (1, 25000.00, 15000.00, 10000.00, 5000.00, 55000.00),
            (2, 8000.00, 6000.00, 3000.00, 2000.00, 19000.00),
            (3, 12000.00, 8000.00, 5000.00, 3000.00, 28000.00)`,
            (err) => {
              if (err) {
                console.error('✗ Error inserting sample budgets:', err.message);
              } else {
                console.log('✓ Sample budgets added');
              }

              console.log('\n========================================');
              console.log('✓ Database setup complete!');
              console.log('========================================\n');
              console.log('Database file:', dbPath);
              console.log('\nYou can now run: npm run server');
              console.log('========================================\n');

              db.close((err) => {
                if (err) {
                  console.error('Error closing database:', err.message);
                  reject(err);
                } else {
                  resolve();
                }
              });
            }
          );
        } else {
          console.log('\n✓ Sample data already exists. Skipping...\n');
          console.log('========================================');
          console.log('✓ Database setup complete!');
          console.log('========================================\n');
          console.log('Database file:', dbPath);
          console.log('\nYou can now run: npm run server');
          console.log('========================================\n');

          db.close((err) => {
            if (err) {
              console.error('Error closing database:', err.message);
              reject(err);
            } else {
              resolve();
            }
          });
        }
      });
    });
  });
};

setupDatabase()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n✗ Database setup failed:', error.message);
    process.exit(1);
  });
