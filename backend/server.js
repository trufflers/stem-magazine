console.log("Starting server...")
const express = require("express")
const cors = require("cors")

const app = express()

app.use(cors())
app.use(express.json())

// Simple test route
app.get("/", (req, res) => {
    res.send("The Centrifuge backend is running")
})

const PORT = 5000
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})
