const Topic = require("../models/Topic");
const Subject = require("../models/Subject");
const Question = require("../models/Question");

const slugify = require("../utils/slugify");

// ==========================================
// CREATE TOPIC
// ==========================================

const createTopic = async (req, res) => {
  try {
    const { subject, title, slug, description } = req.body;

    if (!subject || !title) {
      return res.status(400).json({
        message: "Subject and title are required",
      });
    }

    // Derived from the title when the admin form leaves
    // it blank.
    const finalSlug = slugify(slug || title);

    if (!finalSlug) {
      return res.status(400).json({
        message:
          "Could not build a slug from that title. Add one manually.",
      });
    }

    // Make sure the subject exists
    const existingSubject = await Subject.findById(subject);

    if (!existingSubject) {
      return res.status(404).json({
        message: "Subject not found",
      });
    }

    // Prevent duplicate topic under the same subject
    const existingTopic = await Topic.findOne({
      subject,
      slug: finalSlug,
    });

    if (existingTopic) {
      return res.status(400).json({
        message: "This topic already exists for this subject",
      });
    }

    const topic = await Topic.create({
      subject,
      title: title.trim(),
      slug: finalSlug,
      description: description?.trim() || "",
    });

    await topic.populate("subject", "name slug");

    res.status(201).json({
      message: "Topic created successfully",
      topic,
    });
  } catch (error) {
    console.error("Create topic error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

// ==========================================
// GET TOPICS
// ==========================================

const getTopics = async (req, res) => {
  try {
    const {
      subject,
      includeInactive,
      withCounts,
      search,
    } = req.query;

    const filter = {};

    // Admin listings can ask for inactive topics too
    if (includeInactive !== "true") {
      filter.isActive = true;
    }

    if (subject) {
      filter.subject = subject;
    }

    if (search) {
      filter.title = {
        $regex: String(search).trim(),
        $options: "i",
      };
    }

    const topics = await Topic.find(filter)
      .populate("subject", "name slug")
      .sort({ title: 1 })
      .lean();

    // The admin table shows how much content each topic
    // carries, so it knows what is safe to delete.
    if (withCounts === "true" && topics.length) {
      const counts = await Question.aggregate([
        {
          $match: {
            topic: { $in: topics.map((t) => t._id) },
          },
        },
        {
          $group: {
            _id: "$topic",
            count: { $sum: 1 },
          },
        },
      ]);

      const countMap = new Map(
        counts.map((row) => [String(row._id), row.count])
      );

      topics.forEach((topic) => {
        topic.questionCount =
          countMap.get(String(topic._id)) || 0;
      });
    }

    res.status(200).json({
      count: topics.length,
      topics,
    });
  } catch (error) {
    console.error("Get topics error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

// ==========================================
// GET TOPIC BY ID
// ==========================================

const getTopicById = async (req, res) => {
  try {
    const topic = await Topic.findOne({
      _id: req.params.id,
      isActive: true,
    }).populate("subject", "name slug");

    if (!topic) {
      return res.status(404).json({
        message: "Topic not found",
      });
    }

    res.status(200).json({
      topic,
    });
  } catch (error) {
    console.error("Get topic error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

// ==========================================
// UPDATE TOPIC
// ==========================================

const updateTopic = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      subject,
      title,
      slug,
      description,
      isActive,
    } = req.body;

    const topic = await Topic.findById(id);

    if (!topic) {
      return res.status(404).json({
        message: "Topic not found",
      });
    }

    // If the subject is being changed, make sure it exists
    if (subject && subject !== String(topic.subject)) {
      const existingSubject = await Subject.findById(subject);

      if (!existingSubject) {
        return res.status(404).json({
          message: "Subject not found",
        });
      }

      topic.subject = subject;
    }

    // Guard the (subject + slug) unique index
    if (slug !== undefined) {
      const nextSlug = slugify(slug);

      if (!nextSlug) {
        return res.status(400).json({
          message: "That slug is not usable",
        });
      }

      const duplicate = await Topic.findOne({
        _id: { $ne: id },
        subject: topic.subject,
        slug: nextSlug,
      });

      if (duplicate) {
        return res.status(400).json({
          message:
            "Another topic in this subject already uses that slug",
        });
      }

      topic.slug = nextSlug;
    }

    if (title !== undefined) {
      topic.title = title.trim();
    }

    if (description !== undefined) {
      topic.description = description.trim();
    }

    if (isActive !== undefined) {
      topic.isActive = isActive;
    }

    await topic.save();

    return res.status(200).json({
      message: "Topic updated successfully",
      topic,
    });
  } catch (error) {
    console.error("Update topic error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

// ==========================================
// DELETE TOPIC
// ==========================================

const deleteTopic = async (req, res) => {
  try {
    const { id } = req.params;

    const topic = await Topic.findById(id);

    if (!topic) {
      return res.status(404).json({
        message: "Topic not found",
      });
    }

    // Refuse to orphan questions. Deactivating keeps
    // existing exams and results intact.
    const questionCount = await Question.countDocuments({
      topic: id,
    });

    if (questionCount > 0) {
      return res.status(400).json({
        message: `This topic still has ${questionCount} question(s). Move or delete them first, or deactivate the topic instead.`,
        questionCount,
      });
    }

    await topic.deleteOne();

    return res.status(200).json({
      message: "Topic deleted successfully",
    });
  } catch (error) {
    console.error("Delete topic error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

module.exports = {
  createTopic,
  getTopics,
  getTopicById,
  updateTopic,
  deleteTopic,
};
