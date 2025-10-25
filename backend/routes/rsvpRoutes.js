import express from "express";
import Rsvp from "./models/Rsvp.js";
import e from "express";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const rsvp = await Rsvp.create(req.body);
    res.status(201).json(rsvp);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.get("/", async (req, res) => {
  try {
    const rsvps = await Rsvp.find();
    res.json(rsvps);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
