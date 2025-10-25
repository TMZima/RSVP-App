import mongoose from "mongoose";
import crypto from "crypto";

const rsvpSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please enter your full name"],
    },
    email: {
      type: String,
      required: [true, "Please enter your email address"],
      unique: true,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/,
        "Please enter a valid email address (example: name@email.com)",
      ],
    },
    attending: {
      type: Boolean,
      required: [true, "Please let us know if you'll be attending (yes or no)"],
    },
    numOfGuests: {
      type: Number,
      required: [
        function () {
          return this.attending === true;
        },
        "Please specify the number of guests when attending",
      ],
      min: [1, "Number of guests must be at least 1 if attending"],
    },
    numOfChildren: {
      type: Number,
      required: [
        function () {
          return this.attending === true;
        },
        "Please specify the number of children when attending (enter 0 if none)",
      ],
      min: [0, "Number of children cannot be negative"],
    },
    // Token for secure updates
    updateToken: {
      type: String,
      required: true,
      default: function () {
        return crypto.randomUUID();
      },
    },
  },
  {
    timestamps: true,
  }
);

const Rsvp = mongoose.model("RSVP", rsvpSchema);

export default Rsvp;
