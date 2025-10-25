import mongoose from "mongoose";

const rsvpSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: {
    type: String,
    required: true,
    lowercase: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/,
      "Please enter a valid email address",
    ],
  },
  attending: { type: Boolean, required: true },
  numOfGuests: {
    type: Number,
    required: function () {
      return this.attending === true;
    },
    min: [1, "Number of guests must be at least 1 if attending"],
  },
  numOfChildren: {
    type: Number,
    required: function () {
      return this.attending === true;
    },
    min: [0, "Number of children cannot be negative"],
  },
});

const Rsvp = mongoose.model("RSVP", rsvpSchema);

export default Rsvp;
