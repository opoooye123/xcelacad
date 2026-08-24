const Subject = require("../models/Subject");
const Topic = require("../models/Topic");
const Question = require("../models/Question");
const Exam = require("../models/Exam");
const StudyMaterial = require("../models/StudyMaterial");

const slugify = require("../utils/slugify");

// ==========================================
// CREATE SUBJECT
// ==========================================

const createSubject = async (req, res) => {
  try {
    const { name, slug, description } = req.body;

    if (!name) {
      return res.status(400).json({
        message: "Name is required",
      });
    }

    // The admin form can leave the slug blank and let
    // the name decide it.
    const finalSlug = slugify(slug || name);

    if (!finalSlug) {
      return res.status(400).json({
        message:
          "Could not build a slug from that name. Add one manually.",
      });
    }

    const existingSubject = await Subject.findOne({
      $or: [{ name: name.trim() }, { slug: finalSlug }],
    });

    if (existingSubject) {
      return res.status(400).json({
        message: "A subject with this name or slug already exists",
      });
    }

    const subject = await Subject.create({
      name: name.trim(),
      slug: finalSlug,
      description: description?.trim() || "",
    });

    return res.status(201).json({
      message: "Subject created successfully",
      subject,
    });
  } catch (error) {
    console.error("Create subject error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

// ==========================================
// GET SUBJECTS
// ==========================================

const getSubjects = async (req, res) => {
  try {
    const filter = {};

    // The public catalogue must not show subjects an
    // admin has switched off.
    if (req.query.includeInactive !== "true") {
      filter.isActive = true;
    }

    const subjects = await Subject.find(filter).sort({
      name: 1,
    });

    return res.status(200).json({
      subjects,
    });
  } catch (error) {
    console.error("Get subjects error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

// ==========================================
// ADMIN: SUBJECTS WITH CONTENT COUNTS
// ==========================================
// One call for the admin table: how many topics,
// questions and notes hang off each subject.

const getSubjectsAdmin = async (req, res) => {
  try {
    const filter = {};

    if (req.query.search) {
      const term = String(req.query.search).trim();

      filter.$or = [
        { name: { $regex: term, $options: "i" } },
        { slug: { $regex: term, $options: "i" } },
      ];
    }

    if (req.query.isActive !== undefined) {
      filter.isActive = req.query.isActive === "true";
    }

    const subjects = await Subject.find(filter)
      .sort({ name: 1 })
      .lean();

    if (!subjects.length) {
      return res.status(200).json({ subjects: [] });
    }

    const ids = subjects.map((subject) => subject._id);

    const [topicCounts, questionCounts, materialCounts] =
      await Promise.all([
        Topic.aggregate([
          { $match: { subject: { $in: ids } } },
          {
            $group: {
              _id: "$subject",
              count: { $sum: 1 },
            },
          },
        ]),

        Question.aggregate([
          { $match: { subject: { $in: ids } } },
          {
            $group: {
              _id: "$subject",
              count: { $sum: 1 },
              active: {
                $sum: {
                  $cond: ["$isActive", 1, 0],
                },
              },
            },
          },
        ]),

        StudyMaterial.aggregate([
          { $match: { subject: { $in: ids } } },
          {
            $group: {
              _id: "$subject",
              count: { $sum: 1 },
            },
          },
        ]),
      ]);

    const topicMap = new Map(
      topicCounts.map((row) => [
        String(row._id),
        row.count,
      ])
    );

    const questionMap = new Map(
      questionCounts.map((row) => [String(row._id), row])
    );

    const materialMap = new Map(
      materialCounts.map((row) => [
        String(row._id),
        row.count,
      ])
    );

    return res.status(200).json({
      subjects: subjects.map((subject) => {
        const key = String(subject._id);
        const questions = questionMap.get(key);

        return {
          ...subject,
          topicCount: topicMap.get(key) || 0,
          questionCount: questions?.count || 0,
          activeQuestionCount: questions?.active || 0,
          materialCount: materialMap.get(key) || 0,
        };
      }),
    });
  } catch (error) {
    console.error("Get subjects (admin) error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

// ==========================================
// UPDATE SUBJECT
// ==========================================

const updateSubject = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      name,
      slug,
      description,
      isActive,
    } = req.body;

    const subject = await Subject.findById(id);

    if (!subject) {
      return res.status(404).json({
        message: "Subject not found",
      });
    }

    const nextSlug =
      slug !== undefined ? slugify(slug) : undefined;

    if (slug !== undefined && !nextSlug) {
      return res.status(400).json({
        message: "That slug is not usable",
      });
    }

    // Check duplicate name/slug
    if (name || nextSlug) {
      const duplicate = await Subject.findOne({
        _id: { $ne: id },
        $or: [
          ...(name ? [{ name: name.trim() }] : []),
          ...(nextSlug ? [{ slug: nextSlug }] : []),
        ],
      });

      if (duplicate) {
        return res.status(400).json({
          message:
            "Another subject already uses this name or slug",
        });
      }
    }

    if (name !== undefined) {
      subject.name = name.trim();
    }

    if (nextSlug) {
      subject.slug = nextSlug;
    }

    if (description !== undefined) {
      subject.description =
        description.trim();
    }

    if (isActive !== undefined) {
      subject.isActive = isActive;
    }

    await subject.save();

    return res.status(200).json({
      message: "Subject updated successfully",
      subject,
    });
  } catch (error) {
    console.error("Update subject error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

// ==========================================
// DELETE SUBJECT
// ==========================================

const deleteSubject = async (req, res) => {
  try {
    const { id } = req.params;

    const subject = await Subject.findById(id);

    if (!subject) {
      return res.status(404).json({
        message: "Subject not found",
      });
    }

    // Deleting a subject that still owns content would
    // orphan topics, questions, notes and exams.
    // Deactivating hides it without breaking history.
    const [topics, questions, materials, exams] =
      await Promise.all([
        Topic.countDocuments({ subject: id }),
        Question.countDocuments({ subject: id }),
        StudyMaterial.countDocuments({ subject: id }),
        Exam.countDocuments({ subjects: id }),
      ]);

    const blockers = [
      topics && `${topics} topic${topics === 1 ? "" : "s"}`,
      questions &&
        `${questions} question${
          questions === 1 ? "" : "s"
        }`,
      materials &&
        `${materials} study material${
          materials === 1 ? "" : "s"
        }`,
      exams && `${exams} exam${exams === 1 ? "" : "s"}`,
    ].filter(Boolean);

    if (blockers.length) {
      return res.status(400).json({
        message: `This subject still has ${blockers.join(
          ", "
        )}. Remove them first, or deactivate the subject instead.`,

        counts: { topics, questions, materials, exams },
      });
    }

    await subject.deleteOne();

    return res.status(200).json({
      message: "Subject deleted successfully",
      subjectId: id,
    });
  } catch (error) {
    console.error("Delete subject error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

module.exports = {
  createSubject,
  getSubjects,
  getSubjectsAdmin,
  updateSubject,
  deleteSubject,
};