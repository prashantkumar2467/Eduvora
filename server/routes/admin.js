const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const courseController = require('../controllers/courseController');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');

// Require authentication & admin role for all /api/admin routes
router.use(verifyToken, isAdmin);

// System stats & User management
router.get('/stats', adminController.getAdminStats);
router.get('/users', adminController.getAllUsers);
router.delete('/users/:id', adminController.deleteUser);

// Admin Course Aliases (Prevents 404 if requests target /api/admin/courses/:id)
router.post('/courses', courseController.createCourse);
router.put('/courses/:id', courseController.updateCourse);
router.delete('/courses/:id', courseController.deleteCourse);

module.exports = router;