const mongoose = require("mongoose");
const Task = require("../models/Task");

function cleanTaskBody(body) {
  const data = {};

  if (body.title !== undefined) {
    data.title = String(body.title).trim();
  }

  if (body.description !== undefined) {
    data.description =
      String(body.description).trim();
  }

  if (body.priority !== undefined) {
    data.priority = body.priority;
  }

  if (body.status !== undefined) {
    data.status = body.status;
  }

  if (body.progress !== undefined) {
    data.progress = Number(body.progress);
  }

  if (body.deadline !== undefined) {
    data.deadline =
      body.deadline || null;
  }

  return data;
}

function validateProgress(progress) {
  return (
    Number.isFinite(progress) &&
    progress >= 0 &&
    progress <= 100
  );
}

async function getTasks(req, res) {
  try {
    const tasks = await Task.find({
      userId: req.user._id
    }).sort({
      createdAt: -1
    });

    return res.json(tasks);
  } catch (error) {
    console.error(
      "Get tasks error:",
      error
    );

    return res.status(500).json({
      message: "Unable to load tasks"
    });
  }
}

async function createTask(req, res) {
  try {
    const data = cleanTaskBody(req.body);

    if (!data.title) {
      return res.status(400).json({
        message: "Task title is required"
      });
    }

    if (data.progress === undefined) {
      data.progress = 0;
    }

    if (!validateProgress(data.progress)) {
      return res.status(400).json({
        message:
          "Progress must be between 0 and 100"
      });
    }

    if (data.status === "Completed") {
      data.progress = 100;
    }

    if (data.progress === 100) {
      data.status = "Completed";
    }

    const task = await Task.create({
      ...data,
      userId: req.user._id
    });

    return res.status(201).json({
      message: "Task created successfully",
      task
    });
  } catch (error) {
    console.error(
      "Create task error:",
      error
    );

    return res.status(400).json({
      message:
        error.message ||
        "Unable to create task"
    });
  }
}

async function updateTask(req, res) {
  try {
    if (
      !mongoose.isValidObjectId(
        req.params.id
      )
    ) {
      return res.status(400).json({
        message: "Invalid task id"
      });
    }

    const data = cleanTaskBody(req.body);

    if (
      data.progress !== undefined &&
      !validateProgress(data.progress)
    ) {
      return res.status(400).json({
        message:
          "Progress must be between 0 and 100"
      });
    }

    if (data.status === "Completed") {
      data.progress = 100;
    }

    if (data.progress === 100) {
      data.status = "Completed";
    }

    const task =
      await Task.findOneAndUpdate(
        {
          _id: req.params.id,
          userId: req.user._id
        },
        data,
        {
          new: true,
          runValidators: true
        }
      );

    if (!task) {
      return res.status(404).json({
        message: "Task not found"
      });
    }

    return res.json({
      message:
        "Task updated successfully",
      task
    });
  } catch (error) {
    console.error(
      "Update task error:",
      error
    );

    return res.status(400).json({
      message:
        error.message ||
        "Unable to update task"
    });
  }
}

async function deleteTask(req, res) {
  try {
    if (
      !mongoose.isValidObjectId(
        req.params.id
      )
    ) {
      return res.status(400).json({
        message: "Invalid task id"
      });
    }

    const task =
      await Task.findOneAndDelete({
        _id: req.params.id,
        userId: req.user._id
      });

    if (!task) {
      return res.status(404).json({
        message: "Task not found"
      });
    }

    return res.json({
      message:
        "Task deleted successfully"
    });
  } catch (error) {
    console.error(
      "Delete task error:",
      error
    );

    return res.status(500).json({
      message:
        "Unable to delete task"
    });
  }
}

module.exports = {
  getTasks,
  createTask,
  updateTask,
  deleteTask
};
