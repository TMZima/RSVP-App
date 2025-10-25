import express from "express";
import Rsvp from "../models/Rsvp.js";

const router = express.Router();

// Create a new RSVP
router.post("/", async (req, res) => {
  try {
    const rsvp = await Rsvp.create(req.body);
    res.status(201).json({
      message: "RSVP submitted successfully! Save your update link.",
      rsvp,
      updateLink: `${req.protocol}://${req.get("host")}/api/rsvp/token/${
        rsvp.updateToken
      }`,
    });
  } catch (err) {
    // Handle duplicate email (unique constraint violation)
    if (err.code === 11000 && err.keyPattern?.email) {
      const existingRsvp = await Rsvp.findOne({ email: req.body.email });
      return res.status(409).json({
        message:
          "You have already submitted an RSVP. Use your update link to make changes.",
        existingRsvp: {
          name: existingRsvp.name,
          email: existingRsvp.email,
          attending: existingRsvp.attending,
        },
        updateLink: `${req.protocol}://${req.get("host")}/api/rsvp/token/${
          existingRsvp.updateToken
        }`,
      });
    }

    if (err.name === "ValidationError") {
      const errors = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({
        message: "Please check your information and try again.",
        errors: errors,
      });
    }
    res
      .status(400)
      .json({ message: "Unable to submit RSVP. Please try again." });
  }
});

// Get all RSVPs
router.get("/", async (req, res) => {
  try {
    const rsvps = await Rsvp.find();
    res.json({
      message: "RSVPs retrieved successfully",
      count: rsvps.length,
      rsvps,
    });
  } catch (err) {
    res.status(500).json({
      message: "Unable to retrieve RSVPs. Please try again later.",
    });
  }
});

// Get RSVP by ID
router.get("/:id", async (req, res) => {
  try {
    const rsvp = await Rsvp.findById(req.params.id);
    if (!rsvp) {
      return res.status(404).json({ message: "RSVP not found" });
    }
    res.json({
      message: "RSVP retrieved successfully",
      rsvp,
    });
  } catch (err) {
    res.status(500).json({
      message: "Unable to retrieve RSVP. Please try again later.",
    });
  }
});

// Get RSVP by token (for updates)
router.get("/token/:token", async (req, res) => {
  try {
    const rsvp = await Rsvp.findOne({ updateToken: req.params.token });
    if (!rsvp) {
      return res
        .status(404)
        .json({ message: "RSVP not found or invalid update link." });
    }
    res.json({
      message: "RSVP retrieved successfully",
      rsvp,
    });
  } catch (err) {
    res.status(500).json({
      message: "Unable to retrieve RSVP. Please try again later.",
    });
  }
});

// Update RSVP by token (secure)
router.put("/token/:token", async (req, res) => {
  try {
    const rsvp = await Rsvp.findOneAndUpdate(
      { updateToken: req.params.token },
      req.body,
      { new: true, runValidators: true }
    );
    if (!rsvp) {
      return res.status(404).json({
        message: "RSVP not found or invalid update link.",
      });
    }
    res.json({
      message: "RSVP updated successfully!",
      rsvp,
    });
  } catch (err) {
    if (err.name === "ValidationError") {
      const errors = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({
        message: "Please check your information and try again.",
        errors: errors,
      });
    }
    res
      .status(400)
      .json({ message: "Unable to update RSVP. Please try again." });
  }
});

// Update RSVP by ID (keep for admin use)
router.put("/:id", async (req, res) => {
  try {
    const rsvp = await Rsvp.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!rsvp) {
      return res
        .status(404)
        .json({ message: "RSVP not found. It may have been deleted." });
    }
    res.json({
      message: "RSVP updated successfully!",
      rsvp,
    });
  } catch (err) {
    if (err.name === "ValidationError") {
      const errors = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({
        message: "Please check your information and try again.",
        errors: errors,
      });
    }
    res
      .status(400)
      .json({ message: "Unable to update RSVP. Please try again." });
  }
});

// Delete RSVP by ID
router.delete("/:id", async (req, res) => {
  try {
    const rsvp = await Rsvp.findByIdAndDelete(req.params.id);
    if (!rsvp) {
      return res.status(404).json({
        message: "RSVP not found. It may have already been deleted.",
      });
    }
    res.json({ message: "RSVP deleted successfully!" });
  } catch (err) {
    res.status(500).json({
      message: "Unable to delete RSVP. Please try again later.",
    });
  }
});

export default router;
