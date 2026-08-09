const db = require('./db');
const bcrypt = require('bcryptjs');

// Default Admin Configuration[cite: 21]
const ADMIN_EMAIL = 'admin@eduvora.com';
const ADMIN_PASSWORD = 'Admin@123!';
const ADMIN_NAME = 'Eduvora Super Admin';

async function setupAdmin() {
    try {
        const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);

        // Check if admin user already exists[cite: 21]
        const checkSql = `SELECT * FROM users WHERE email = ?`;
        db.get(checkSql, [ADMIN_EMAIL.toLowerCase()], (err, user) => {
            if (err) {
                console.error('Error checking user:', err.message);
                process.exit(1);
            }

            if (user) {
                // Update existing user account to admin role[cite: 21]
                const updateSql = `UPDATE users SET name = ?, password = ?, role = 'admin' WHERE email = ?`;
                db.run(updateSql, [ADMIN_NAME, hashedPassword, ADMIN_EMAIL.toLowerCase()], function (updateErr) {
                    if (updateErr) {
                        console.error('Failed to update admin password:', updateErr.message);
                    } else {
                        console.log('----------------------------------------------------');
                        console.log('✅ Admin credentials updated successfully!');
                        console.log(`Email:    ${ADMIN_EMAIL}`);
                        console.log(`Password: ${ADMIN_PASSWORD}`);
                        console.log('----------------------------------------------------');
                    }
                    process.exit(0);
                });
            } else {
                // Create new admin user account[cite: 21]
                const insertSql = `INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, 'admin')`;
                db.run(insertSql, [ADMIN_NAME, ADMIN_EMAIL.toLowerCase(), hashedPassword], function (insertErr) {
                    if (insertErr) {
                        console.error('Failed to create admin user:', insertErr.message);
                    } else {
                        console.log('----------------------------------------------------');
                        console.log('✅ Admin account created successfully!');
                        console.log(`Email:    ${ADMIN_EMAIL}`);
                        console.log(`Password: ${ADMIN_PASSWORD}`);
                        console.log('----------------------------------------------------');
                    }
                    process.exit(0);
                });
            }
        });
    } catch (error) {
        console.error('Error hashing password:', error);
        process.exit(1);
    }
}

// Run setup script[cite: 21]
setupAdmin();