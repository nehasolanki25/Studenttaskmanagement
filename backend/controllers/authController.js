const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

function createToken(userId) {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is missing");
  }

  return jwt.sign(
    {
      id: userId
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d"
    }
  );
}

function publicUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    phase: user.phase,
    createdAt: user.createdAt
  };
}

// REGISTER

async function register(req, res) {
  try {
    const name = String(req.body.name || "").trim();
    const email = String(req.body.email || "")
      .trim()
      .toLowerCase();

    const password = String(req.body.password || "");

    const phase = String(
      req.body.phase || "Phase 1"
    ).trim();

// VALIDATION 

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Name, email and password are required"
      });
    }

    if (name.length < 2) {
      return res.status(400).json({
        message: "Name must contain at least 2 characters"
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters"
      });
    }

// CHECK EXISTING USER 

    const existingUser = await User.findOne({
      email
    });

    if (existingUser) {
      return res.status(409).json({
        message: "An account with this email already exists"
      });
    }

//  HASH PASSWORD

    const hashedPassword = await bcrypt.hash(
      password,
      10
    );

// CREATE USER 

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      phase
    });

// CREATE TOKEN 

    const token = createToken(user._id);

//  RESPONSE 

    return res.status(201).json({
      message: "Account created successfully",
      token,
      user: publicUser(user)
    });

  } catch (error) {

    console.error("Register error:", error);

// MongoDB duplicate key error

    if (error.code === 11000) {

      const duplicateField =
        Object.keys(error.keyPattern || {})[0] ||
        "field";

      if (duplicateField === "email") {
        return res.status(409).json({
          message: "An account with this email already exists"
        });
      }

      return res.status(409).json({
        message: `Duplicate database field: ${duplicateField}`
      });
    }

//  VALIDATION ERROR 

    if (error.name === "ValidationError") {

      const messages = Object.values(
        error.errors
      ).map((item) => item.message);

      return res.status(400).json({
        message: messages.join(", ")
      });
    }

    return res.status(500).json({
      message: "Unable to create account"
    });
  }
}

//  LOGIN

async function login(req, res) {
  try {

    const email = String(
      req.body.email || ""
    )
      .trim()
      .toLowerCase();

    const password = String(
      req.body.password || ""
    );


    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required"
      });
    }

    const user = await User.findOne({
      email
    }).select("+password");

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password"
      });
    }

    const passwordMatched =
      await bcrypt.compare(
        password,
        user.password
      );

    if (!passwordMatched) {
      return res.status(401).json({
        message: "Invalid email or password"
      });
    }

    const token = createToken(
      user._id
    );

    return res.json({
      message: "Login successful",
      token,
      user: publicUser(user)
    });

  } catch (error) {

    console.error(
      "Login error:",
      error
    );

    return res.status(500).json({
      message: "Unable to login"
    });
  }
}

//  GET CURRENT USER

async function getMe(req, res) {
  return res.json({
    user: publicUser(req.user)
  });
}

//  UPDATE PROFILE

async function updateProfile(req, res) {
  try {

    const name = String(
      req.body.name || ""
    ).trim();

    const phase = String(
      req.body.phase || "Phase 1"
    ).trim();


    if (!name || name.length < 2) {
      return res.status(400).json({
        message:
          "Name must contain at least 2 characters"
      });
    }

    const user =
      await User.findByIdAndUpdate(
        req.user._id,
        {
          name,
          phase
        },
        {
          new: true,
          runValidators: true
        }
      );

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    return res.json({
      message: "Profile updated successfully",
      user: publicUser(user)
    });

  } catch (error) {

    console.error(
      "Profile update error:",
      error
    );

    return res.status(500).json({
      message: "Unable to update profile"
    });
  }
}

module.exports = {
  register,
  login,
  getMe,
  updateProfile
};