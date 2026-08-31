const mongoose = require("mongoose");

const Reflection =
  require("../models/Reflection");

// GET ALL REFLECTIONS

async function getReflections(
  req,
  res
) {

  try {

    const reflections =
      await Reflection
        .find({
          userId: req.user._id
        })
        .sort({
          createdAt: -1
        });

    res.json(
      reflections
    );

  } catch (error) {

    console.error(
      "Get reflections error:",
      error
    );

    res.status(500).json({
      message:
        "Unable to load reflections"

    });
  }
}

// CREATE REFLECTION

async function createReflection(
  req,
  res
) {

  try {

    const reflection =
      String(
        req.body.reflection ||
        ""
      ).trim();

    const whatILearned =
      String(
        req.body.whatILearned ||
        ""
      ).trim();

    const challenges =
      String(
        req.body.challenges ||
        ""
      ).trim();

    const priority =
      req.body.priority ||
      "Medium";

    const status =
      req.body.status ||
      "Pending";

    const progress =
      Math.min(
        100,
        Math.max(
          0,
          Number(
            req.body.progress ??
            0
          )
        )
      );

    const deadline =
      req.body.deadline ||
      null;

// VALIDATION

    if (!reflection) {

      return res.status(400).json({

        message:
          "Reflection is required"
      });
    }

// CREATE

    const saved =
      await Reflection.create({

        reflection,
        whatILearned,
        challenges,
        priority,
        status,
        progress,
        deadline,
        userId:
          req.user._id

      });

    res.status(201).json({
      message:
        "Reflection saved successfully",

      reflection:
        saved
    });

  } catch (error) {

    console.error(
      "Create reflection error:",
      error
    );

    res.status(400).json({

      message:
        error.message ||
        "Unable to save reflection"
    });
  }
}

// UPDATE REFLECTION

async function updateReflection(
  req,
  res
) {

  try {

    if (
      !mongoose.isValidObjectId(
        req.params.id
      )
    ) {

      return res.status(400).json({

        message:
          "Invalid reflection id"

      });
    }

    const reflection =
      String(
        req.body.reflection ||
        ""
      ).trim();

    const whatILearned =
      String(
        req.body.whatILearned ||
        ""
      ).trim();

    const challenges =
      String(
        req.body.challenges ||
        ""
      ).trim();

    const priority =
      req.body.priority ||
      "Medium";

    const status =
      req.body.status ||
      "Pending";

    const progress =
      Math.min(
        100,
        Math.max(
          0,
          Number(
            req.body.progress ??
            0
          )
        )
      );

    const deadline =
      req.body.deadline ||
      null;

// VALIDATION

    if (!reflection) {

      return res.status(400).json({

        message:
          "Reflection is required"

      });
    }

// UPDATE

    const updated =
      await Reflection.findOneAndUpdate(

        {
          _id:
            req.params.id,

          userId:
            req.user._id

        },

        {

          reflection,
          whatILearned,
          challenges,
          priority,
          status,
          progress,
          deadline

        },

        {
          new: true,
          runValidators: true
        }
      );

    if (!updated) {

      return res.status(404).json({

        message:
          "Reflection not found"
      });
    }

    res.json({

      message:
        "Reflection updated successfully",
      reflection:
        updated
    });

  } catch (error) {

    console.error(
      "Update reflection error:",
      error
    );

    res.status(400).json({

      message:
        error.message ||
        "Unable to update reflection"
    });
  }
}

// DELETE REFLECTION

async function deleteReflection(
  req,
  res
) {

  try {

    if (
      !mongoose.isValidObjectId(
        req.params.id
      )
    ) {

      return res.status(400).json({

        message:
          "Invalid reflection id"
      });
    }

    const deleted =
      await Reflection.findOneAndDelete({

        _id:
          req.params.id,

        userId:
          req.user._id
      });


    if (!deleted) {

      return res.status(404).json({

        message:
          "Reflection not found"
      });
    }


    res.json({

      message:
        "Reflection deleted successfully"
    });

  } catch (error) {

    console.error(
      "Delete reflection error:",
      error
    );


    res.status(500).json({

      message:
        "Unable to delete reflection"
    });
  }
}


module.exports = {

  getReflections,
  createReflection,
  updateReflection,
  deleteReflection
};