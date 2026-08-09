// Load environment variables from .env
require("dotenv").config();

const db = require("./db");
const bcrypt = require("bcryptjs");

// =====================================================
// ADMIN CONFIGURATION
// Values come from environment variables
// =====================================================

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const ADMIN_NAME = process.env.ADMIN_NAME || "Eduvora Super Admin";

// =====================================================
// VALIDATE ADMIN CONFIGURATION
// =====================================================

if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.error("❌ Admin configuration is missing.");
    console.error("");
    console.error("Please add the following to your .env file:");
    console.error("ADMIN_EMAIL=admin@eduvora.com");
    console.error("ADMIN_PASSWORD=YourStrongPassword");
    console.error("ADMIN_NAME=Eduvora Super Admin");

    process.exit(1);
}

// =====================================================
// SETUP ADMIN
// =====================================================

async function setupAdmin() {
    try {
        console.log("");
        console.log("==============================================");
        console.log("        EDUVORA ADMIN SETUP");
        console.log("==============================================");

        // Hash admin password
        const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);

        // Normalize email
        const email = ADMIN_EMAIL.trim().toLowerCase();

        // Check whether user already exists
        const checkSql = `
            SELECT *
            FROM users
            WHERE email = ?
        `;

        db.get(checkSql, [email], (err, user) => {
            if (err) {
                console.error("❌ Error checking user:", err.message);
                process.exit(1);
            }

            // =================================================
            // ADMIN ALREADY EXISTS
            // =================================================

            if (user) {
                console.log("ℹ️ User already exists.");
                console.log("Updating account to admin...");

                const updateSql = `
                    UPDATE users
                    SET
                        name = ?,
                        password = ?,
                        role = 'admin'
                    WHERE email = ?
                `;

                db.run(
                    updateSql,
                    [
                        ADMIN_NAME,
                        hashedPassword,
                        email
                    ],
                    function (updateErr) {
                        if (updateErr) {
                            console.error(
                                "❌ Failed to update admin:",
                                updateErr.message
                            );

                            process.exit(1);
                        }

                        console.log("");
                        console.log("----------------------------------------------");
                        console.log("✅ ADMIN ACCOUNT UPDATED");
                        console.log("----------------------------------------------");
                        console.log(`Email: ${email}`);
                        console.log(`Name:  ${ADMIN_NAME}`);
                        console.log("Password: [hidden]");
                        console.log("----------------------------------------------");
                        console.log("");

                        process.exit(0);
                    }
                );

                return;
            }

            // =================================================
            // CREATE NEW ADMIN
            // =================================================

            console.log("Creating new admin account...");

            const insertSql = `
                INSERT INTO users
                    (name, email, password, role)
                VALUES
                    (?, ?, ?, 'admin')
            `;

            db.run(
                insertSql,
                [
                    ADMIN_NAME,
                    email,
                    hashedPassword
                ],
                function (insertErr) {
                    if (insertErr) {
                        console.error(
                            "❌ Failed to create admin:",
                            insertErr.message
                        );

                        process.exit(1);
                    }

                    console.log("");
                    console.log("----------------------------------------------");
                    console.log("✅ ADMIN ACCOUNT CREATED");
                    console.log("----------------------------------------------");
                    console.log(`Email: ${email}`);
                    console.log(`Name:  ${ADMIN_NAME}`);
                    console.log("Password: [hidden]");
                    console.log("----------------------------------------------");
                    console.log("");

                    process.exit(0);
                }
            );
        });

    } catch (error) {
        console.error("");
        console.error("❌ Admin setup failed:", error.message);
        console.error("");

        process.exit(1);
    }
}

// =====================================================
// RUN ADMIN SETUP
// =====================================================

setupAdmin();