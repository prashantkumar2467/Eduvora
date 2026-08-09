const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Ensure the database folder exists before trying to open the file
const dbDir = path.resolve(__dirname, '../../database');
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'education.db');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error connecting to database:', err.message);
    } else {
        console.log('Connected to SQLite database.');
        initializeDatabase();
    }
});

function initializeDatabase() {
    db.serialize(() => {
        // Create Users Table
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT DEFAULT 'student',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Create Courses Table
        db.run(`CREATE TABLE IF NOT EXISTS courses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            category TEXT DEFAULT 'General',
            description TEXT,
            instructor_id INTEGER,
            price REAL DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (instructor_id) REFERENCES users (id)
        )`, (err) => {
            if (!err) {
                seedInitialCourses();
            }
        });
    });
}

function seedInitialCourses() {
    db.get("SELECT COUNT(*) as count FROM courses", (err, row) => {
        if (row && row.count === 0) {
            const stmt = db.prepare("INSERT INTO courses (title, category, description, price) VALUES (?, ?, ?, ?)");
            stmt.run("Data Structures & Algorithms", "Computer Science", "Master arrays, linked lists, trees, dynamic programming, and algorithmic problem-solving.", 0);
            stmt.run("Full-Stack Web Development", "Web Development", "Build modern applications using HTML5, CSS3, JavaScript ES6+, Express, and Node.js.", 0);
            stmt.run("Python Core & OOP", "Programming", "Learn Python syntax, control flow, functions, object-oriented principles, and file I/O.", 0);
            stmt.run("SQL & Database Architecture", "Database", "Master SQL queries, table joins, indexes, database design, and normalization techniques.", 0);
            stmt.finalize();
            console.log("Seeded default courses into Eduvora database.");
        }
    });
}

module.exports = db;