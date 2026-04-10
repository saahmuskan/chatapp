const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
 
const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "Username is required"],
      unique: true,
      trim: true,
      minlength: [3, "Username must be at least 3 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
    },
    // We'll update this field via Socket.io when users connect/disconnect
    isOnline: {
      type: Boolean,
      default: false,
    },
    avatarColor: {
      type: String,
      default: "#6366f1", // A random color assigned at registration for the avatar
    },
  },
  { timestamps: true }
);
 
// Hash the password before saving to DB — runs before every .save() call
userSchema.pre("save", async function (next) {
  // Only hash if password was actually modified (avoid rehashing on other updates)
  if (!this.isModified("password")) return next();
 
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});
 
// A helper method to compare a plain-text password with the stored hash
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};
 
module.exports = mongoose.model("User", userSchema);
 