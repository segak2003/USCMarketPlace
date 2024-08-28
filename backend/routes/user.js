const express = require('express');
const router = express.Router();
const db = require('../db');
const authMiddleware = require('../middleware/auth');


// Get all users (Protected Route)
router.get('/', authMiddleware, (req, res) => {
    const query = 'SELECT * FROM users';
    db.query(query, (err, results) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(results);
    });
});

// Example route to create a new user
router.post('/', (req, res) => {
    const { username, password } = req.body;
    const query = 'INSERT INTO users (username, password) VALUES (?, ?)';
    db.query(query, [username, password], (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.status(201).json({ id: results.insertId, username, password });
    });
});

// Update a user by ID
router.put('/:id', (req, res) => {
    const { id } = req.params;
    const { username, password } = req.body;
    const query = 'UPDATE users SET username = ?, password = ? WHERE id = ?';
    db.query(query, [username, password, id], (err, results) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (results.affectedRows === 0) {
        return res.status(404).json({ message: 'User not found' });
      }
      res.json({ message: 'User updated successfully' });
    });
  });
  
  // Delete a user by ID
  router.delete('/:id', (req, res) => {
    const { id } = req.params;
    const query = 'DELETE FROM users WHERE id = ?';
    db.query(query, [id], (err, results) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (results.affectedRows === 0) {
        return res.status(404).json({ message: 'User not found' });
      }
      res.json({ message: 'User deleted successfully' });
    });
  });
  

module.exports = router;
