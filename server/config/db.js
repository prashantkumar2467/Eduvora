const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Ensure the database folder exists before trying to open the file[cite: 20]
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
        // Create Users Table[cite: 20]
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT DEFAULT 'student',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Create Courses Table with modules column included[cite: 20]
        db.run(`CREATE TABLE IF NOT EXISTS courses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            category TEXT DEFAULT 'General',
            description TEXT,
            instructor_id INTEGER,
            price REAL DEFAULT 0,
            modules TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (instructor_id) REFERENCES users (id)
        )`, (err) => {
            if (!err) {
                // Auto-migrate: Add 'modules' column if database already exists without it[cite: 20]
                db.run(`ALTER TABLE courses ADD COLUMN modules TEXT`, () => {
                    // Ignore error if column already exists
                    seedInitialCourses();
                });
            }
        });
    });
}

function seedInitialCourses() {
    db.get("SELECT COUNT(*) as count FROM courses", (err, row) => {
        if (row && row.count === 0) {
            const stmt = db.prepare("INSERT INTO courses (title, category, description, price, modules) VALUES (?, ?, ?, ?, ?)");

            const dsaModules = JSON.stringify([
                {
                    title: "Module 1: Data Structures Fundamentals",
                    topics: [
                        {
                            title: "1.1 Introduction to Arrays & Time Complexity",
                            content: "An array is a collection of items stored at contiguous memory locations. It allows direct indexing with O(1) complexity for lookups, but insertions and deletions take O(n) time.",
                            code: "// JavaScript Array Operations\nconst arr = [10, 20, 30, 40];\nconsole.log('Element at index 2:', arr[2]);\narr.push(50); // O(1) push"
                        },
                        {
                            title: "1.2 Linked Lists & Dynamic Memory",
                            content: "A Linked List is a linear data structure where elements are stored in nodes. Each node contains data and a pointer reference to the next node.",
                            code: "class Node {\n  constructor(value) {\n    this.value = value;\n    this.next = null;\n  }\n}"
                        }
                    ]
                }
            ]);

            const webDevModules = JSON.stringify([
                {
                    title: "Module 1: Modern Full-Stack JavaScript",
                    topics: [
                        {
                            title: "1.1 ES6+ Async/Await & Fetch API",
                            content: "Asynchronous JavaScript allows asynchronous HTTP requests without blocking the execution thread using Promises and async/await syntax.",
                            code: "async function fetchCatalog() {\n  const res = await fetch('/api/courses');\n  const data = await res.json();\n  console.log(data);\n}"
                        }
                    ]
                }
            ]);

            const pythonModules = JSON.stringify([
                {
                    title: "Module 1: Python Core & OOP Basics",
                    topics: [
                        {
                            title: "1.1 Object-Oriented Programming Classes",
                            content: "Classes encapsulate data and methods that operate on that data. Python uses the __init__ method to construct instances.",
                            code: "class Student:\n    def __init__(self, name, email):\n        self.name = name\n        self.email = email\n\n    def get_info(self):\n        return f'{self.name} ({self.email})'"
                        }
                    ]
                }
            ]);

            const sqlModules = JSON.stringify([
                {
                    title: "Module 1: SQL Relational Queries",
                    topics: [
                        {
                            title: "1.1 SELECT Statements & Foreign Key Joins",
                            content: "SQL JOIN clauses merge rows from two or more tables based on a related column between them.",
                            code: "SELECT courses.title, users.name AS instructor\nFROM courses\nLEFT JOIN users ON courses.instructor_id = users.id;"
                        }
                    ]
                }
            ]);

            stmt.run("Data Structures & Algorithms", "Computer Science", "Master arrays, linked lists, trees, dynamic programming, and algorithmic problem-solving.", 0, dsaModules);
            stmt.run("Full-Stack Web Development", "Web Development", "Build modern applications using HTML5, CSS3, JavaScript ES6+, Express, and Node.js.", 0, webDevModules);
            stmt.run("Python Core & OOP", "Programming", "Learn Python syntax, control flow, functions, object-oriented principles, and file I/O.", 0, pythonModules);
            stmt.run("SQL & Database Architecture", "Database", "Master SQL queries, table joins, indexes, database design, and normalization techniques.", 0, sqlModules);

            stmt.finalize();
            console.log("Seeded default W3Schools-structured courses into Eduvora database.");
        }
    });
}

module.exports = db;