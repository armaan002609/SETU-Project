const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bcrypt = require('bcryptjs');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname)); // Serve standard HTML/CSS/JS files natively

// Database Initialization
const db = new sqlite3.Database(path.join(__dirname, 'database.sqlite'), (err) => {
    if (err) {
        console.error('Error opening database', err.message);
    } else {
        console.log('Successfully connected to the SQLite database.');
        // Create users table
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            fullname TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            role TEXT NOT NULL,
            password TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`, (err) => {
            if (err) {
                console.error("Error creating users table:", err.message);
            } else {
                console.log("Users table ready.");
            }
        });
    }
});

// Registration Endpoint
app.post('/api/register', async (req, res) => {
    const { fullname, email, role, password } = req.body;

    // Validate request
    if (!fullname || !email || !role || !password) {
        return res.status(400).json({ error: 'All fields are required.' });
    }

    try {
        // Hash the password securely
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Insert into SQLite
        const sql = `INSERT INTO users (fullname, email, role, password) VALUES (?, ?, ?, ?)`;
        db.run(sql, [fullname, email, role, hashedPassword], function(err) {
            if (err) {
                if (err.message.includes('UNIQUE constraint failed')) {
                    return res.status(409).json({ error: 'Email already exists in the database!' });
                }
                console.error("SQL Error:", err.message);
                return res.status(500).json({ error: 'Database error occurred while registering user.' });
            }
            
            console.log(`New user registered successfully into SQL: ${fullname} (${role})`);
            res.status(201).json({ 
                success: true, 
                message: 'Registration successful! Account generated in SQLite database.',
                userId: this.lastID,
                role: role
            });
        });

    } catch (err) {
        console.error("Server Error:", err);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`=========================================`);
    console.log(`🚀 SQL Backend Server is running!`);
    console.log(`👉 Access the platform at: http://localhost:${PORT}`);
    console.log(`=========================================`);
});
