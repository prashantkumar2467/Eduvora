const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');

// Public route for home & catalog
router.get('/', courseController.getAllCourses);
router.get('/:id', courseController.getCourseById);

// Admin route to publish new courses
router.post('/', verifyToken, isAdmin, courseController.createCourse);

module.exports = router;