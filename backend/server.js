const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const nodemailer = require('nodemailer');
const path = require('path');

const app = express();

// Middleware to read form data
app.use(express.urlencoded({ extended: true }));

// SERVING YOUR FRONTEND:
// This tells Express that your HTML/CSS files are in the folder ABOVE 'backend'
app.use(express.static(path.join(__dirname, '../')));

// --- DATABASE SETUP ---
// This creates the database file inside your 'backend' folder
const db = new sqlite3.Database(path.join(__dirname, 'database.sqlite'));

db.serialize(() => {
    db.run("CREATE TABLE IF NOT EXISTS submissions (id INTEGER PRIMARY KEY, name TEXT, email TEXT, category TEXT, message TEXT)");
    db.run("CREATE TABLE IF NOT EXISTS subscribers (id INTEGER PRIMARY KEY, email TEXT UNIQUE)");
});

// --- EMAIL CONFIGURATION ---
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'YOUR_EMAIL@gmail.com', 
        pass: 'YOUR_APP_PASSWORD'    // 16-character Google App Password
    }
});

// --- FORM ROUTES ---

// 1. Submit Work
app.post('/submit-work', (req, res) => {
    const { name, email, category, message } = req.body;
    db.run("INSERT INTO submissions (name, email, category, message) VALUES (?, ?, ?, ?)", 
        [name, email, category, message], (err) => {
            if (err) return res.status(500).send("Database Error");
            
            sendEmail("New Magazine Submission", `Name: ${name}\nEmail: ${email}\nCategory: ${category}\nMessage: ${message}`);
            res.send("<h1>Success!</h1><p>Your work has been submitted.</p><a href='/'>Return to Home</a>");
        });
});

// 2. Subscribe
app.post('/subscribe', (req, res) => {
    const { email } = req.body;
    db.run("INSERT INTO subscribers (email) VALUES (?)", [email], (err) => {
        if (err) return res.send("You're already on the list!");
        
        sendEmail("New Subscriber", `New reader alert: ${email}`);
        res.send("<h1>Subscribed!</h1><p>Thanks for joining.</p><a href='/'>Return to Home</a>");
    });
});

// Email Helper
function sendEmail(subject, text) {
    const mailOptions = {
        from: 'YOUR_EMAIL@gmail.com',
        to: 'YOUR_EMAIL@gmail.com', // Where you want to get the alerts
        subject: subject,
        text: text
    };
    transporter.sendMail(mailOptions);
}

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is running! View your site at http://localhost:${PORT}`);
});
