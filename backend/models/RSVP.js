import mongoose from "mongoose";

const rsvpSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  attending: { type: Boolean, required: true },
  numOfGuests: { type: Number, required: true },
  numOfChildren: { type: Number, required: true },
});

const Rsvp = mongoose.model("RSVP", rsvpSchema);

export default Rsvp;
