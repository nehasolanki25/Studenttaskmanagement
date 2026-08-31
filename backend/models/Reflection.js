const mongoose = require("mongoose");

const reflectionSchema = new mongoose.Schema(
  {
    reflection: {

      type: String,
      required: [ true, "Reflection is required"],
      trim: true,
      maxlength: 1000
    },

    whatILearned: {

      type: String,
      trim: true,
      maxlength: 1000,
      default: ""
    },

    challenges: {

      type: String,
      trim: true,
      maxlength: 1000,
      default: ""
    },

    priority: {

      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Medium"
    },

    status: {

      type: String,
      enum: ["Pending", "In Progress", "Completed"],
      default: "Pending"
    },

    progress: {

      type: Number,
      min: 0,
      max: 100,
      default: 0
    },

    deadline: {

      type: Date,
      default: null
    },

    userId: {

      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    }
  },

  {
    timestamps: true
  }

);

module.exports =
  mongoose.model(
    "Reflection",
    reflectionSchema
  );