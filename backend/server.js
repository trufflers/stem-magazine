const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const nodemailer = require('nodemailer');
const path = require('path');

const app = express();

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../')));

// --- DATABASE SETUP ---
const db = new sqlite3.Database(path.join(__dirname, 'database.sqlite'));

db.serialize(() => {
    // 1. Updated Submissions table with all fields
    db.run(`CREATE TABLE IF NOT EXISTS submissions (
        id INTEGER PRIMARY KEY AUTOINCREMENT, 
        name TEXT, 
        email TEXT, 
        school TEXT, 
        grade TEXT, 
        category TEXT, 
        title TEXT, 
        abstract TEXT, 
        message TEXT
    )`);

    // 2. Updated Subscribers table
    db.run(`CREATE TABLE IF NOT EXISTS subscribers (
        id INTEGER PRIMARY KEY AUTOINCREMENT, 
        name TEXT, 
        email TEXT UNIQUE, 
        school TEXT, 
        interests TEXT
    )`);

    // 3. New Contacts table
    db.run(`CREATE TABLE IF NOT EXISTS contacts (
        id INTEGER PRIMARY KEY AUTOINCREMENT, 
        name TEXT, 
        email TEXT, 
        subject TEXT, 
        message TEXT
    )`);
});

// --- EMAIL CONFIGURATION ---
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'thecentrifugemag@gmail.com', 
        pass: 'YOUR_APP_PASSWORD' // Replace with your 16-character App Password
    }
});

// --- FORM ROUTES ---

// 1. Submit Work
app.post('/submit-work', (req, res) => {
    const { name, email, school, grade, category, title, abstract, message } = req.body;
    
    const sql = `INSERT INTO submissions (name, email, school, grade, category, title, abstract, message) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
    
    db.run(sql, [name, email, school, grade, category, title, abstract, message], (err) => {
        if (err) return res.status(500).send("Database Error: " + err.message);
        
        sendEmail("New Magazine Submission!", 
            `Title: ${title}\nBy: ${name}\nSchool: ${school}\nGrade: ${grade}\nCategory: ${category}\nAbstract: ${abstract}`);
            
        res.send("<h1>Success!</h1><p>Your research has been submitted for review.</p><a href='/'>Return to Home</a>");
    });
});

// 2. Subscribe
app.post('/subscribe', (req, res) => {
    const { name, email, school, interests } = req.body;
    
    db.run("INSERT INTO subscribers (name, email, school, interests) VALUES (?, ?, ?, ?)", 
        [name, email, school, interests], (err) => {
            if (err) return res.send("You're already on the list!");
            
            sendEmail("New Subscriber", `Name: ${name}\nEmail: ${email}\nInterests: ${interests}`);
            res.send("<h1>Thanks for Subscribing!</h1><p>Welcome to The Centrifuge.</p><a href='/'>Return to Home</a>");
        });
});

// 3. Contact
app.post('/contact', (req, res) => {
    const { name, email, subject, message } = req.body;
    
    db.run("INSERT INTO contacts (name, email, subject, message) VALUES (?, ?, ?, ?)", 
        [name, email, subject, message], (err) => {
            if (err) return res.status(500).send("Database Error");
            
            sendEmail(`Contact Form: ${subject}`, `From: ${name}\nEmail: ${email}\nMessage: ${message}`);
            res.send("<h1>Message Sent!</h1><p>We'll get back to you soon.</p><a href='/'>Return to Home</a>");
        });
});

// Email Helper
function sendEmail(subject, text) {
    const mailOptions = {
        from: 'thecentrifugemag@gmail.com',
        to: 'thecentrifugemag@gmail.com', 
        subject: `CENTRIFUGE ALERT: ${subject}`,
        text: text
    };
    transporter.sendMail(mailOptions);
}

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});
