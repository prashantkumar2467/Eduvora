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

        const courses = (rows || []).map(course => {
            let parsedModules = [];
            if (course.modules) {
                try {
                    parsedModules = typeof course.modules === 'string' ? JSON.parse(course.modules) : course.modules;
                } catch (e) {
                    parsedModules = [];
                }
            }
            return { ...course, modules: parsedModules };
        });

        res.json(courses);
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

        if (row.modules) {
            try {
                row.modules = typeof row.modules === 'string' ? JSON.parse(row.modules) : row.modules;
            } catch (e) {
                row.modules = [];
            }
        }

        res.json(row);
    });
};

// Protected (Admin Only): Create a new course
exports.createCourse = (req, res) => {
    const { title, category, description, price, modules } = req.body;
    const instructor_id = req.user ? req.user.id : null;

    if (!title || !description) {
        return res.status(400).json({ message: 'Title and description are required.' });
    }

    const modulesJson = typeof modules === 'object' ? JSON.stringify(modules) : (modules || '[]');

    const sql = `INSERT INTO courses (title, category, description, instructor_id, price, modules) VALUES (?, ?, ?, ?, ?, ?)`;
    db.run(sql, [title, category || 'General', description, instructor_id, price || 0, modulesJson], function(err) {
        if (err) {
            const fallbackSql = `INSERT INTO courses (title, category, description, instructor_id, price) VALUES (?, ?, ?, ?, ?)`;
            db.run(fallbackSql, [title, category || 'General', description, instructor_id, price || 0], function(fallbackErr) {
                if (fallbackErr) {
                    return res.status(500).json({ message: 'Database error creating course' });
                }
                return res.status(201).json({ message: 'Course published successfully', courseId: this.lastID });
            });
            return;
        }
        res.status(201).json({ message: 'Course published successfully', courseId: this.lastID });
    });
};

// Protected (Admin Only): Update existing course
exports.updateCourse = (req, res) => {
    const courseId = req.params.id;
    const { title, category, description, price, modules } = req.body;

    if (!title || !description) {
        return res.status(400).json({ message: 'Title and description are required.' });
    }

    const modulesJson = typeof modules === 'object' ? JSON.stringify(modules) : (modules || '[]');

    const sql = `UPDATE courses SET title = ?, category = ?, description = ?, price = ?, modules = ? WHERE id = ?`;
    db.run(sql, [title, category || 'General', description, price || 0, modulesJson, courseId], function(err) {
        if (err) {
            const fallbackSql = `UPDATE courses SET title = ?, category = ?, description = ?, price = ? WHERE id = ?`;
            db.run(fallbackSql, [title, category || 'General', description, price || 0, courseId], function(fallbackErr) {
                if (fallbackErr) {
                    return res.status(500).json({ message: 'Database error updating course' });
                }
                return res.json({ message: 'Course updated successfully', courseId });
            });
            return;
        }

        if (this.changes === 0) {
            return res.status(404).json({ message: 'Course not found' });
        }

        res.json({ message: 'Course updated successfully', courseId });
    });
};

// Protected (Admin Only): Delete course
exports.deleteCourse = (req, res) => {
    const courseId = req.params.id;
    const sql = `DELETE FROM courses WHERE id = ?`;

    db.run(sql, [courseId], function(err) {
        if (err) {
            return res.status(500).json({ message: 'Database error deleting course' });
        }
        if (this.changes === 0) {
            return res.status(404).json({ message: 'Course not found' });
        }
        res.json({ message: 'Course deleted successfully' });
    });
};