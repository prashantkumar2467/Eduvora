const db = require('../config/db');

// Get high-level platform stats
exports.getAdminStats = (req, res) => {
    const stats = {};

    db.get('SELECT COUNT(*) as totalUsers FROM users', [], (err, userRow) => {
        if (err) return res.status(500).json({ message: 'Error counting users' });
        stats.totalUsers = userRow.totalUsers;

        db.get('SELECT COUNT(*) as totalCourses FROM courses', [], (err, courseRow) => {
            if (err) return res.status(500).json({ message: 'Error counting courses' });
            stats.totalCourses = courseRow.totalCourses;

            res.json(stats);
        });
    });
};

// Get list of all users
exports.getAllUsers = (req, res) => {
    const sql = `SELECT id, name, email, role, created_at FROM users ORDER BY id DESC`;
    db.all(sql, [], (err, rows) => {
        if (err) return res.status(500).json({ message: 'Error fetching users' });
        res.json(rows);
    });
};

// Delete a user by ID
exports.deleteUser = (req, res) => {
    const userId = req.params.id;

    // Prevent self-deletion
    if (parseInt(userId) === req.user.id) {
        return res.status(400).json({ message: 'You cannot delete your own admin account.' });
    }

    const sql = `DELETE FROM users WHERE id = ?`;
    db.run(sql, [userId], function(err) {
        if (err) return res.status(500).json({ message: 'Database error deleting user' });
        res.json({ message: 'User deleted successfully' });
    });
};

// Delete a course by ID
exports.deleteCourse = (req, res) => {
    const courseId = req.params.id;
    const sql = `DELETE FROM courses WHERE id = ?`;
    db.run(sql, [courseId], function(err) {
        if (err) return res.status(500).json({ message: 'Database error deleting course' });
        res.json({ message: 'Course deleted successfully' });
    });
};