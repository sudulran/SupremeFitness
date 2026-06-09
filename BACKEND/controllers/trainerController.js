const Trainer = require('../models/trainerModel');

// =============================
// 📌 Get All Trainers
// =============================
exports.getAllTrainers = async (req, res) => {
  try {
    const trainers = await Trainer.find();

    const trainersWithImages = trainers.map((trainer) => {
      const obj = trainer.toObject();
      if (trainer.image?.data) {
        obj.imageUrl = `data:${trainer.image.contentType};base64,${trainer.image.data.toString(
          'base64'
        )}`;
      }
      return obj;
    });

    res.json(trainersWithImages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// =============================
// 📌 Get Trainer By ID
// =============================
exports.getTrainerById = async (req, res) => {
  try {
    const trainer = await Trainer.findById(req.params.id);
    if (!trainer) return res.status(404).json({ message: 'Trainer not found' });

    const obj = trainer.toObject();
    if (trainer.image?.data) {
      obj.imageUrl = `data:${trainer.image.contentType};base64,${trainer.image.data.toString(
        'base64'
      )}`;
    }

    res.json(obj);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// =============================
// 📌 Create Trainer
// =============================
exports.createTrainer = async (req, res) => {
  try {
    const { name, specialization, experience, available } = req.body;

    const trainerData = {
      name,
      specialization,
      experience,
      available: available === 'true' || available === true,
      contact: {
        phone: req.body['contact[phone]'] || req.body.phone,
        email: req.body['contact[email]'] || req.body.email,
      },
    };

    if (req.file) {
      trainerData.image = {
        data: req.file.buffer,
        contentType: req.file.mimetype,
      };
    }

    const newTrainer = new Trainer(trainerData);
    const savedTrainer = await newTrainer.save();

    res.status(201).json(savedTrainer);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// =============================
// 📌 Update Trainer
// =============================
exports.updateTrainer = async (req, res) => {
  try {
    const { name, specialization, experience, available } = req.body;

    const updateData = {
      name,
      specialization,
      experience,
      available: available === 'true' || available === true,
      contact: {
        phone: req.body['contact[phone]'] || req.body.phone,
        email: req.body['contact[email]'] || req.body.email,
      },
    };

    if (req.file) {
      updateData.image = {
        data: req.file.buffer,
        contentType: req.file.mimetype,
      };
    }

    const updatedTrainer = await Trainer.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedTrainer) {
      return res.status(404).json({ message: 'Trainer not found' });
    }

    res.json(updatedTrainer);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// =============================
// 📌 Delete Trainer
// =============================
exports.deleteTrainer = async (req, res) => {
  try {
    const deleted = await Trainer.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Trainer not found' });

    res.json({ message: 'Trainer deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
