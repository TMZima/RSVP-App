import express from "express";
import Rsvp from "../models/Rsvp.js";

const router = express.Router();

// Create a new RSVP
router.post("/", async (req, res) => {
  try {
    // Check if RSVP deadline has passed
    const now = new Date();
    const rsvpDeadline = new Date(process.env.RSVP_DEADLINE);
    if (now > rsvpDeadline) {
      return res.status(403).json({
        message: `RSVP deadline has passed for ${process.env.EVENT_NAME}. New RSVPs are no longer accepted.`,
        eventName: process.env.EVENT_NAME,
        deadline: rsvpDeadline,
        eventDate: process.env.EVENT_DATE,
      });
    }

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
        message: "We found some issues with your RSVP information:",
        errors: errors,
        help: "Please fix the issues above and submit your RSVP again.",
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

// Get all YES RSVPs (Admin route)
router.get("/attending/yes", async (req, res) => {
  try {
    const rsvps = await Rsvp.find({ attending: true });
    const totalGuests = rsvps.reduce(
      (sum, rsvp) => sum + (rsvp.numOfGuests || 0),
      0
    );
    const totalChildren = rsvps.reduce(
      (sum, rsvp) => sum + (rsvp.numOfChildren || 0),
      0
    );

    res.json({
      message: "Attending RSVPs retrieved successfully",
      count: rsvps.length,
      totalGuests,
      totalChildren,
      rsvps,
    });
  } catch (err) {
    res.status(500).json({
      message: "Unable to retrieve attending RSVPs. Please try again later.",
    });
  }
});

// Get all NO RSVPs (Admin route)
router.get("/attending/no", async (req, res) => {
  try {
    const rsvps = await Rsvp.find({ attending: false });
    res.json({
      message: "Not attending RSVPs retrieved successfully",
      count: rsvps.length,
      rsvps,
    });
  } catch (err) {
    res.status(500).json({
      message:
        "Unable to retrieve non-attending RSVPs. Please try again later.",
    });
  }
});

// Get event info and deadline status
router.get("/event-info", async (req, res) => {
  try {
    const now = new Date();
    const rsvpDeadline = new Date(process.env.RSVP_DEADLINE);
    const eventDate = new Date(process.env.EVENT_DATE);
    const isDeadlinePassed = now > rsvpDeadline;

    res.json({
      message: "Event information retrieved successfully",
      eventInfo: {
        eventName: process.env.EVENT_NAME,
        eventDate,
        eventLocation: process.env.EVENT_LOCATION,
        rsvpDeadline,
        isDeadlinePassed,
        canStillRSVP: !isDeadlinePassed,
        daysUntilDeadline: isDeadlinePassed
          ? 0
          : Math.ceil((rsvpDeadline - now) / (1000 * 60 * 60 * 24)),
        daysUntilEvent: Math.ceil((eventDate - now) / (1000 * 60 * 60 * 24)),
      },
    });
  } catch (err) {
    res.status(500).json({
      message: "Unable to retrieve event information.",
    });
  }
});

// Get RSVP summary (Admin route)
router.get("/summary", async (req, res) => {
  try {
    const totalRsvps = await Rsvp.countDocuments();
    const attendingRsvps = await Rsvp.find({ attending: true });
    const notAttendingCount = await Rsvp.countDocuments({ attending: false });

    const totalGuests = attendingRsvps.reduce(
      (sum, rsvp) => sum + (rsvp.numOfGuests || 0),
      0
    );
    const totalChildren = attendingRsvps.reduce(
      (sum, rsvp) => sum + (rsvp.numOfChildren || 0),
      0
    );
    const totalAttending = attendingRsvps.length;

    res.json({
      message: "RSVP summary retrieved successfully",
      summary: {
        totalResponses: totalRsvps,
        attending: totalAttending,
        notAttending: notAttendingCount,
        totalGuests,
        totalChildren,
        totalPeople: totalGuests + totalChildren,
      },
    });
  } catch (err) {
    res.status(500).json({
      message: "Unable to retrieve RSVP summary. Please try again later.",
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
    // First, check if RSVP exists and deadline hasn't passed
    const existingRsvp = await Rsvp.findOne({ updateToken: req.params.token });
    if (!existingRsvp) {
      return res.status(404).json({
        message: "RSVP not found or invalid update link.",
      });
    }

    // Check RSVP deadline (event-wide deadline)
    const now = new Date();
    const rsvpDeadline = new Date(process.env.RSVP_DEADLINE);
    if (now > rsvpDeadline) {
      return res.status(403).json({
        message: `RSVP deadline has passed for ${process.env.EVENT_NAME}. Updates are no longer allowed.`,
        eventName: process.env.EVENT_NAME,
        deadline: rsvpDeadline,
        eventDate: process.env.EVENT_DATE,
      });
    }

    // Handle No → Yes transition: provide defaults for required fields
    if (req.body.attending === true) {
      req.body.numOfGuests = req.body.numOfGuests || 1;
      req.body.numOfChildren = req.body.numOfChildren || 0;
    }

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
        message: "We found some issues with your updated information:",
        errors: errors,
        help: "Please fix the issues above and try updating again.",
      });
    }
    res
      .status(400)
      .json({ message: "Unable to update RSVP. Please try again." });
  }
});

// Update RSVP by ID (admin use - bypasses deadline)
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
        message: "Validation failed for this RSVP update:",
        errors: errors,
        note: "Admin can override validation if needed.",
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
