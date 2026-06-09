const express = require('express');
const router = express.Router();
const trainerController = require('../controllers/trainerController');
const multer = require('multer');

// Memory storage (stores image in memory, then save to DB as Buffer)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// CRUD Routes
router.get('/', trainerController.getAllTrainers);
router.get('/:id', trainerController.getTrainerById);
router.post('/add-trainer', upload.single('image'), trainerController.createTrainer);
router.put('/update-trainer/:id', upload.single('image'), trainerController.updateTrainer);
router.delete('/delete-trainer/:id', trainerController.deleteTrainer);

module.exports = router;
