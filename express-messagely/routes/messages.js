const express = require('express');
const router = express.Router();
const db = require('./db'); 
const { ensureLoggedIn } = require('./auth'); 

async function ensureUserPartOfMessage(req, res, next) {
  try {
    const { id } = req.params;
    const message = await db.getMessageById(id);

    if (message.from_user.username !== req.user.username && message.to_user.username !== req.user.username) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    res.locals.message = message;
    return next();
  } catch (error) {
    return next(error);
  }
}

router.get('/:id', ensureLoggedIn, ensureUserPartOfMessage, async (req, res, next) => {
  try {
    return res.json({ message: res.locals.message });
  } catch (error) {
    return next(error);
  }
});

router.post('/', ensureLoggedIn, async (req, res, next) => {
  try {
    const { to_username, body } = req.body;
    const from_username = req.user.username; 

    const message = await db.createMessage({ from_username, to_username, body }); 
    return res.json({ message });
  } catch (error) {
    return next(error);
  }
});

router.post('/:id/read', ensureLoggedIn, ensureUserPartOfMessage, async (req, res, next) => {
  try {
    if (res.locals.message.to_user.username !== req.user.username) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const read_at = new Date();
    const updatedMessage = await db.markMessageAsRead(req.params.id, read_at);
    return res.json({ message: updatedMessage });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;