const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');

// Protect all admin routes with JWT & Admin checks
router.use(verifyToken, isAdmin);

router.get('/stats', adminController.getAdminStats);
router.get('/users', adminController.getAllUsers);
router.delete('/users/:id', adminController.deleteUser);
router.delete('/courses/:id', adminController.deleteCourse);

module.exports = router;