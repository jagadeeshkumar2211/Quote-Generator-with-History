const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// SQLite database
const db = new sqlite3.Database("./quotes.db");

// Create favorites table
db.run(`
    CREATE TABLE IF NOT EXISTS favorites (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        quote TEXT NOT NULL,
        author TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
`);
// Get random quote from public API
app.get("/api/quote", async (req, res) => {
    try {
        const response = await fetch("https://dummyjson.com/quotes/random");

        if (!response.ok) {
            throw new Error("Failed to fetch quote");
        }

        const data = await response.json();

        res.json({
            quote: data.quote,
            author: data.author
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: "Unable to fetch quote"
        });
    }
});

// Save favorite quote
app.post("/api/favorites", (req, res) => {
    const { quote, author } = req.body;

    if (!quote) {
        return res.status(400).json({
            error: "Quote is required"
        });
    }

    db.get(`SELECT id FROM favorites WHERE quote = ? LIMIT 1`, [quote], (findErr, existing) => {
        if (findErr) {
            console.error(findErr);
            return res.status(500).json({
                error: "Failed to save favorite"
            });
        }

        if (existing) {
            return res.status(409).json({
                error: "This quote is already saved"
            });
        }

        db.run(
            `INSERT INTO favorites (quote, author) VALUES (?, ?)`,
            [quote, author || "Unknown"],
            function (err) {
                if (err) {
                    console.error(err);
                    return res.status(500).json({
                        error: "Failed to save favorite"
                    });
                }

                res.json({
                    message: "Quote added to favorites",
                    id: this.lastID
                });
            }
        );
    });
});

// Get favorite quotes
app.get("/api/favorites", (req, res) => {
    db.all(
        `SELECT * FROM favorites ORDER BY id DESC`,
        [],
        (err, rows) => {
            if (err) {
                console.error(err);
                return res.status(500).json({
                    error: "Failed to load favorites"
                });
            }

            res.json(rows);
        }
    );
});

// Delete favorite quote
app.delete("/api/favorites/:id", (req, res) => {
    const { id } = req.params;

    db.run(
        `DELETE FROM favorites WHERE id = ?`,
        [id],
        function (err) {
            if (err) {
                return res.status(500).json({
                    error: "Failed to delete favorite"
                });
            }

            res.json({
                message: "Favorite deleted"
            });
        }
    );
});

app.listen(PORT, () => {
    console.log(`Quote Generator running on http://localhost:${PORT}`);
});