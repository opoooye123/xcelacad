const mongoose = require("mongoose");

const User = require("../models/User");
const ExamAttempt = require("../models/ExamAttempt");

const { USER_ROLES } = require("../config/constants");
const { isAdminEmail } = require("../utils/isAdminEmail");

// ==========================================
// GET CURRENT USER PROFILE
// ==========================================

const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select(
      "-password"
    );

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    return res.status(200).json({
      user,
    });
  } catch (error) {
    console.error("Get profile error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

// ==========================================
// UPDATE CURRENT USER PROFILE
// ==========================================

const updateProfile = async (req, res) => {
  try {
    const { name, school, classLevel } = req.body;

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // Only update fields that were provided
    if (name !== undefined) {
      user.name = name.trim();
    }

    if (school !== undefined) {
      user.school = school.trim();
    }

    if (classLevel !== undefined) {
      user.classLevel = classLevel.trim();
    }

    await user.save();

    return res.status(200).json({
      message: "Profile updated successfully",

      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        school: user.school,
        classLevel: user.classLevel,
        role: user.role,
        authProvider: user.authProvider,
      },
    });
  } catch (error) {
    console.error("Update profile error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

// ==========================================
// ADMIN: LIST USERS
// ==========================================

const MAX_LIMIT = 100;

const getUsersAdmin = async (req, res) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);

    const limit = Math.min(
      Math.max(Number(req.query.limit) || 20, 1),
      MAX_LIMIT
    );

    const filter = {};

    if (
      req.query.role &&
      USER_ROLES.includes(req.query.role)
    ) {
      filter.role = req.query.role;
    }

    if (req.query.isBlocked !== undefined) {
      filter.isBlocked = req.query.isBlocked === "true";
    }

    if (req.query.search) {
      const term = String(req.query.search).trim();

      filter.$or = [
        { name: { $regex: term, $options: "i" } },
        { email: { $regex: term, $options: "i" } },
        { school: { $regex: term, $options: "i" } },
      ];
    }

    const [total, users] = await Promise.all([
      User.countDocuments(filter),

      User.find(filter)
        .select("-password")
        .sort({ createdAt: -1 })
        .skip(limit * (page - 1))
        .limit(limit)
        .lean(),
    ]);

    const userIds = users.map((user) => user._id);

    // Attempt counts give the list a sense of who is
    // actually active.
    const attemptCounts = await ExamAttempt.aggregate([
      {
        $match: {
          student: { $in: userIds },
          status: { $in: ["submitted", "expired"] },
        },
      },
      {
        $group: {
          _id: "$student",
          attempts: { $sum: 1 },
        },
      },
    ]);

    const attemptMap = new Map(
      attemptCounts.map((row) => [
        String(row._id),
        row.attempts,
      ])
    );

    return res.status(200).json({
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),

      users: users.map((user) => ({
        ...user,
        attempts: attemptMap.get(String(user._id)) || 0,

        // Flags accounts whose admin rights come from
        // ADMIN_EMAILS rather than a manual change.
        isEnvAdmin: isAdminEmail(user.email),
      })),
    });
  } catch (error) {
    console.error("Get users (admin) error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

// ==========================================
// ADMIN: USER DETAIL
// ==========================================

const getUserAdminById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        message: "Invalid user id",
      });
    }

    const user = await User.findById(id)
      .select("-password")
      .lean();

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const attempts = await ExamAttempt.find({
      student: user._id,
      status: { $in: ["submitted", "expired"] },
    })
      .populate("exam", "title examType isPractice")
      .select("score totalMarks status submittedAt exam")
      .sort({ submittedAt: -1 })
      .limit(10)
      .lean();

    return res.status(200).json({
      user: {
        ...user,
        isEnvAdmin: isAdminEmail(user.email),
      },

      attempts: attempts.map((attempt) => ({
        ...attempt,
        percentage:
          attempt.totalMarks > 0
            ? Number(
                (
                  (attempt.score / attempt.totalMarks) *
                  100
                ).toFixed(1)
              )
            : 0,
      })),
    });
  } catch (error) {
    console.error("Get user (admin) error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

// ==========================================
// ADMIN: CHANGE ROLE
// ==========================================

const setUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        message: "Invalid user id",
      });
    }

    if (!USER_ROLES.includes(role)) {
      return res.status(400).json({
        message: `role must be one of: ${USER_ROLES.join(
          ", "
        )}`,
      });
    }

    // Locking yourself out of the dashboard is never
    // the intent.
    if (String(id) === String(req.user._id)) {
      return res.status(400).json({
        message: "You cannot change your own role",
      });
    }

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // An ADMIN_EMAILS entry is re-promoted by passport
    // on the next login, so silently "demoting" them
    // would be misleading.
    if (role !== "admin" && isAdminEmail(user.email)) {
      return res.status(400).json({
        message:
          "This address is listed in ADMIN_EMAILS. Remove it from the server environment first.",
      });
    }

    user.role = role;

    await user.save();

    return res.status(200).json({
      message: `${user.name} is now a ${role}`,

      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Set user role error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

// ==========================================
// ADMIN: SUSPEND / RESTORE
// ==========================================

const setUserBlocked = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        message: "Invalid user id",
      });
    }

    if (String(id) === String(req.user._id)) {
      return res.status(400).json({
        message: "You cannot suspend your own account",
      });
    }

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const next =
      req.body.isBlocked !== undefined
        ? Boolean(req.body.isBlocked)
        : !user.isBlocked;

    if (next && user.role === "admin") {
      return res.status(400).json({
        message:
          "Demote this admin before suspending the account",
      });
    }

    user.isBlocked = next;

    await user.save();

    return res.status(200).json({
      message: next
        ? `${user.name} has been suspended`
        : `${user.name} has been restored`,

      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        isBlocked: user.isBlocked,
      },
    });
  } catch (error) {
    console.error("Set user blocked error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  getUsersAdmin,
  getUserAdminById,
  setUserRole,
  setUserBlocked,
};
