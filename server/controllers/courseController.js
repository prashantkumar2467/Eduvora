const db = require('../config/db');

// Public: Get all courses for Landing Page and Dashboard
exports.getAllCourses = (req, res) => {
    const sql = `SELECT courses.*, users.name as instructor_name 
                 FROM courses 
                 LEFT JOIN users ON courses.instructor_id = users.id 
                 ORDER BY courses.id DESC`;
    db.all(sql, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ message: 'Error retrieving courses' });
        }
        res.json(rows);
    });
};

// Public: Get single course detail
exports.getCourseById = (req, res) => {
    const sql = `SELECT courses.*, users.name as instructor_name 
                 FROM courses 
                 LEFT JOIN users ON courses.instructor_id = users.id 
                 WHERE courses.id = ?`;
    db.get(sql, [req.params.id], (err, row) => {
        if (err) return res.status(500).json({ message: 'Database error' });
        if (!row) return res.status(404).json({ message: 'Course not found' });
        res.json(row);
    });
};

// Protected (Admin Only): Create a new course
exports.createCourse = (req, res) => {
    const { title, category, description, price } = req.body;
    const instructor_id = req.user.id;

    if (!title || !description) {
        return res.status(400).json({ message: 'Title and description are required.' });
    }

    const sql = `INSERT INTO courses (title, category, description, instructor_id, price) VALUES (?, ?, ?, ?, ?)`;
    db.run(sql, [title, category || 'General', description, instructor_id, price || 0], function(err) {
        if (err) {
            return res.status(500).json({ message: 'Database error creating course' });
        }
        res.status(201).json({ 
            message: 'Course published successfully', 
            courseId: this.lastID 
        });
    });
};