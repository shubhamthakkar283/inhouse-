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

const migrateDatabase = () => {
  return new Promise((resolve, reject) => {
    console.log('\n========================================');
    console.log('  Database Migration Utility');
    console.log('========================================\n');
    console.log('Running migrations...\n');

    db.serialize(() => {
      db.get("PRAGMA table_info(events)", [], (err, row) => {
        if (err) {
          console.error('Error checking table schema:', err.message);
          reject(err);
          return;
        }
      });

      db.all("PRAGMA table_info(events)", [], (err, columns) => {
        if (err) {
          console.error('Error checking columns:', err.message);
          reject(err);
          return;
        }

        const hasAiContentColumn = columns.some(col => col.name === 'ai_generated_content');

        if (!hasAiContentColumn) {
          console.log('Adding ai_generated_content column to events table...');
          db.run(
            `ALTER TABLE events ADD COLUMN ai_generated_content TEXT`,
            (err) => {
              if (err) {
                console.error('✗ Error adding column:', err.message);
                reject(err);
              } else {
                console.log('✓ Column ai_generated_content added successfully');
                console.log('\n========================================');
                console.log('✓ Migration complete!');
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
            }
          );
        } else {
          console.log('✓ Column ai_generated_content already exists');
          console.log('\n========================================');
          console.log('✓ Migration complete! No changes needed.');
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

migrateDatabase()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n✗ Migration failed:', error.message);
    process.exit(1);
  });
