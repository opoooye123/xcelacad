const mongoose = require("mongoose");

const StudyMaterial = require("../models/StudyMaterial");
const Subject = require("../models/Subject");
const Topic = require("../models/Topic");

const {
  MATERIAL_EXAM_TYPES,
} = require("../config/constants");

// ==========================================
// STUDY MATERIALS
// ==========================================
// Public reads are limited to published + active
// documents. Admin reads see everything.
// ==========================================

const MAX_LIMIT = 100;

const parsePagination = (query) => {
  const page = Math.max(Number(query.page) || 1, 1);

  const limit = Math.min(
    Math.max(Number(query.limit) || 20, 1),
    MAX_LIMIT
  );

  return { page, limit, skip: (page - 1) * limit };
};

// Accepts an ObjectId or slug for subject filters.
const resolveSubjectId = async (value) => {
  if (!value) return null;

  if (mongoose.isValidObjectId(value)) {
    return value;
  }

  const subject = await Subject.findOne({
    slug: String(value).toLowerCase(),
  })
    .select("_id")
    .lean();

  return subject ? subject._id : null;
};

// ==========================================
// GET /api/materials
// ==========================================

const getMaterials = async (req, res) => {
  try {
    const { page, limit, skip } = parsePagination(req.query);

    const filter = {
      isPublished: true,
      isActive: true,
    };

    if (req.query.subject) {
      const subjectId = await resolveSubjectId(
        req.query.subject
      );

      // An unknown subject means an empty result set,
      // not every material on the site.
      if (!subjectId) {
        return res.status(200).json({
          page,
          limit,
          total: 0,
          totalPages: 0,
          materials: [],
        });
      }

      filter.subject = subjectId;
    }

    if (
      req.query.topic &&
      mongoose.isValidObjectId(req.query.topic)
    ) {
      filter.topic = req.query.topic;
    }

    if (
      req.query.examType &&
      MATERIAL_EXAM_TYPES.includes(req.query.examType)
    ) {
      filter.examType = req.query.examType;
    }

    if (req.query.search) {
      filter.title = {
        $regex: String(req.query.search).trim(),
        $options: "i",
      };
    }

    const [total, materials] = await Promise.all([
      StudyMaterial.countDocuments(filter),

      StudyMaterial.find(filter)
        // The list view never needs the body, and
        // notes can be long.
        .select("-content")
        .populate("subject", "name slug")
        .populate("topic", "title slug")
        .sort({ order: 1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    return res.status(200).json({
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      materials,
    });
  } catch (error) {
    console.error("Get materials error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

// ==========================================
// GET /api/materials/:id
// ==========================================

const getMaterialById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        message: "Invalid material id",
      });
    }

    const material = await StudyMaterial.findOne({
      _id: id,
      isPublished: true,
      isActive: true,
    })
      .populate("subject", "name slug description")
      .populate("topic", "title slug")
      .lean();

    if (!material) {
      return res.status(404).json({
        message: "Study material not found",
      });
    }

    // Sibling notes for the "up next" rail
    const related = await StudyMaterial.find({
      _id: { $ne: material._id },
      subject: material.subject?._id || material.subject,
      isPublished: true,
      isActive: true,
    })
      .select("title examType order")
      .sort({ order: 1, createdAt: -1 })
      .limit(6)
      .lean();

    return res.status(200).json({
      material,
      related,
    });
  } catch (error) {
    console.error("Get material error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

// ==========================================
// ADMIN: LIST
// ==========================================

const getMaterialsAdmin = async (req, res) => {
  try {
    const { page, limit, skip } = parsePagination(req.query);

    const filter = {};

    if (req.query.subject) {
      const subjectId = await resolveSubjectId(
        req.query.subject
      );

      if (!subjectId) {
        return res.status(200).json({
          page,
          limit,
          total: 0,
          totalPages: 0,
          materials: [],
        });
      }

      filter.subject = subjectId;
    }

    if (
      req.query.topic &&
      mongoose.isValidObjectId(req.query.topic)
    ) {
      filter.topic = req.query.topic;
    }

    if (
      req.query.examType &&
      MATERIAL_EXAM_TYPES.includes(req.query.examType)
    ) {
      filter.examType = req.query.examType;
    }

    if (req.query.isPublished !== undefined) {
      filter.isPublished = req.query.isPublished === "true";
    }

    if (req.query.isActive !== undefined) {
      filter.isActive = req.query.isActive === "true";
    }

    if (req.query.search) {
      filter.title = {
        $regex: String(req.query.search).trim(),
        $options: "i",
      };
    }

    const [total, materials] = await Promise.all([
      StudyMaterial.countDocuments(filter),

      StudyMaterial.find(filter)
        .select("-content")
        .populate("subject", "name slug")
        .populate("topic", "title slug")
        .populate("createdBy", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    return res.status(200).json({
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      materials,
    });
  } catch (error) {
    console.error("Get materials (admin) error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

// ==========================================
// ADMIN: READ ONE
// ==========================================
// Separate from the public route because admins need
// unpublished drafts and the full body.

const getMaterialAdminById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        message: "Invalid material id",
      });
    }

    const material = await StudyMaterial.findById(id)
      .populate("subject", "name slug")
      .populate("topic", "title slug")
      .lean();

    if (!material) {
      return res.status(404).json({
        message: "Study material not found",
      });
    }

    return res.status(200).json({ material });
  } catch (error) {
    console.error("Get material (admin) error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

// ==========================================
// ADMIN: CREATE
// ==========================================

const createMaterial = async (req, res) => {
  try {
    const {
      subject,
      topic,
      title,
      content,
      examType,
      order,
      isPublished,
    } = req.body;

    if (!subject || !title || !content) {
      return res.status(400).json({
        message: "Subject, title and content are required",
      });
    }

    const subjectId = await resolveSubjectId(subject);

    if (!subjectId) {
      return res.status(404).json({
        message: "Subject not found",
      });
    }

    const subjectExists = await Subject.exists({
      _id: subjectId,
    });

    if (!subjectExists) {
      return res.status(404).json({
        message: "Subject not found",
      });
    }

    let topicId = null;

    if (topic) {
      if (!mongoose.isValidObjectId(topic)) {
        return res.status(400).json({
          message: "Invalid topic id",
        });
      }

      // The topic must belong to the chosen subject or
      // the note would surface under the wrong tree.
      const topicDoc = await Topic.findOne({
        _id: topic,
        subject: subjectId,
      })
        .select("_id")
        .lean();

      if (!topicDoc) {
        return res.status(400).json({
          message: "Topic does not belong to that subject",
        });
      }

      topicId = topicDoc._id;
    }

    if (examType && !MATERIAL_EXAM_TYPES.includes(examType)) {
      return res.status(400).json({
        message: `examType must be one of: ${MATERIAL_EXAM_TYPES.join(
          ", "
        )}`,
      });
    }

    const material = await StudyMaterial.create({
      subject: subjectId,
      topic: topicId,
      title: String(title).trim(),
      content,
      examType: examType || "general",
      order: Number(order) || 0,
      isPublished: Boolean(isPublished),
      createdBy: req.user._id,
    });

    await material.populate([
      { path: "subject", select: "name slug" },
      { path: "topic", select: "title slug" },
    ]);

    return res.status(201).json({
      message: "Study material created",
      material,
    });
  } catch (error) {
    console.error("Create material error:", error);

    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: error.message,
      });
    }

    return res.status(500).json({
      message: "Server error",
    });
  }
};

// ==========================================
// ADMIN: UPDATE
// ==========================================

const updateMaterial = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        message: "Invalid material id",
      });
    }

    const material = await StudyMaterial.findById(id);

    if (!material) {
      return res.status(404).json({
        message: "Study material not found",
      });
    }

    const {
      subject,
      topic,
      title,
      content,
      examType,
      order,
      isPublished,
      isActive,
    } = req.body;

    if (subject !== undefined) {
      const subjectId = await resolveSubjectId(subject);

      if (!subjectId) {
        return res.status(404).json({
          message: "Subject not found",
        });
      }

      material.subject = subjectId;
    }

    if (topic !== undefined) {
      if (topic === null || topic === "") {
        material.topic = null;
      } else {
        if (!mongoose.isValidObjectId(topic)) {
          return res.status(400).json({
            message: "Invalid topic id",
          });
        }

        const topicDoc = await Topic.findOne({
          _id: topic,
          subject: material.subject,
        })
          .select("_id")
          .lean();

        if (!topicDoc) {
          return res.status(400).json({
            message:
              "Topic does not belong to that subject",
          });
        }

        material.topic = topicDoc._id;
      }
    }

    if (title !== undefined) {
      material.title = String(title).trim();
    }

    if (content !== undefined) {
      material.content = content;
    }

    if (examType !== undefined) {
      if (!MATERIAL_EXAM_TYPES.includes(examType)) {
        return res.status(400).json({
          message: `examType must be one of: ${MATERIAL_EXAM_TYPES.join(
            ", "
          )}`,
        });
      }

      material.examType = examType;
    }

    if (order !== undefined) {
      material.order = Number(order) || 0;
    }

    if (isPublished !== undefined) {
      material.isPublished = Boolean(isPublished);
    }

    if (isActive !== undefined) {
      material.isActive = Boolean(isActive);
    }

    await material.save();

    await material.populate([
      { path: "subject", select: "name slug" },
      { path: "topic", select: "title slug" },
    ]);

    return res.status(200).json({
      message: "Study material updated",
      material,
    });
  } catch (error) {
    console.error("Update material error:", error);

    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: error.message,
      });
    }

    return res.status(500).json({
      message: "Server error",
    });
  }
};

// ==========================================
// ADMIN: DELETE
// ==========================================

const deleteMaterial = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        message: "Invalid material id",
      });
    }

    const material = await StudyMaterial.findByIdAndDelete(
      id
    );

    if (!material) {
      return res.status(404).json({
        message: "Study material not found",
      });
    }

    return res.status(200).json({
      message: "Study material deleted",
      materialId: id,
    });
  } catch (error) {
    console.error("Delete material error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

module.exports = {
  getMaterials,
  getMaterialById,
  getMaterialsAdmin,
  getMaterialAdminById,
  createMaterial,
  updateMaterial,
  deleteMaterial,
};
