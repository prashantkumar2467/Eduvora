const db = require('../config/db');

// Get system-wide stats for Admin Console
exports.getAdminStats = (req, res) => {
    const stats = { totalUsers: 0, totalCourses: 0 };

    db.get("SELECT COUNT(*) as count FROM users", [], (err, userRow) => {
        if (err) return res.status(500).json({ message: "Database error reading users" });
        stats.totalUsers = userRow ? userRow.count : 0;

        db.get("SELECT COUNT(*) as count FROM courses", [], (err, courseRow) => {
            if (err) return res.status(500).json({ message: "Database error reading courses" });
            stats.totalCourses = courseRow ? courseRow.count : 0;
            res.json(stats);
        });
    });
};

// Get list of all registered users
exports.getAllUsers = (req, res) => {
    const sql = `SELECT id, name, email, role, created_at FROM users ORDER BY id DESC`;
    db.all(sql, [], (err, rows) => {
        if (err) return res.status(500).json({ message: "Database error retrieving users" });
        res.json(rows || []);
    });
};

// Delete a user account (Admin protected)
exports.deleteUser = (req, res) => {
    const userId = req.params.id;

    // Prevent admin from deleting their own active account
    if (req.user && parseInt(userId, 10) === req.user.id) {
        return res.status(400).json({ message: "You cannot delete your own active admin account." });
    }

    const sql = `DELETE FROM users WHERE id = ?`;
    db.run(sql, [userId], function (err) {
        if (err) return res.status(500).json({ message: "Database error deleting user" });
        if (this.changes === 0) return res.status(404).json({ message: "User not found" });
        res.json({ message: "User account deleted successfully" });
    });
};