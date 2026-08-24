const dns = require("dns");

dns.setServers([
  "8.8.8.8",
  "1.1.1.1",
]);

const mongoose = require("mongoose");
require("dotenv").config();

const Subject = require("../models/Subject");
const Topic = require("../models/Topic");
const Question = require("../models/Question");
const Exam = require("../models/Exam");

const MONGO_URI = process.env.MONGO_URI;

const seedExam = async () => {
  try {
    console.log("🌱 Connecting to MongoDB...");

    await mongoose.connect(MONGO_URI);

    console.log("✅ MongoDB connected");

    // ==========================================
    // SUBJECT
    // ==========================================

    let subject = await Subject.findOne({
      slug: "mathematics",
    });

    if (!subject) {
      subject = await Subject.create({
        name: "Mathematics",
        slug: "mathematics",
        description:
          "Mathematics preparation for JAMB, Post-UTME and school examinations.",
        isActive: true,
      });

      console.log("✅ Mathematics subject created");
    } else {
      console.log(
        "ℹ️ Mathematics subject already exists"
      );
    }

    // ==========================================
    // TOPIC
    // ==========================================

    let topic = await Topic.findOne({
      subject: subject._id,
      slug: "algebra",
    });

    if (!topic) {
      topic = await Topic.create({
        subject: subject._id,
        title: "Algebra",
        slug: "algebra",
        description:
          "Basic algebraic expressions and equations.",
        isActive: true,
      });

      console.log("✅ Algebra topic created");
    } else {
      console.log(
        "ℹ️ Algebra topic already exists"
      );
    }

    // ==========================================
    // QUESTIONS
    // ==========================================

    const questionsData = [
      {
        questionText:
          "If 2x + 5 = 15, what is the value of x?",

        options: {
          A: "3",
          B: "5",
          C: "7",
          D: "10",
        },

        correctAnswer: "B",

        explanation:
          "Subtract 5 from both sides to get 2x = 10. Therefore x = 5.",

        difficulty: "easy",
      },

      {
        questionText:
          "Simplify: 3x + 2x - 4.",

        options: {
          A: "5x - 4",
          B: "x - 4",
          C: "5x + 4",
          D: "6x - 4",
        },

        correctAnswer: "A",

        explanation:
          "Like terms 3x and 2x combine to give 5x - 4.",

        difficulty: "easy",
      },

      {
        questionText:
          "If x = 4, find the value of 2x² - 3.",

        options: {
          A: "13",
          B: "21",
          C: "29",
          D: "35",
        },

        correctAnswer: "C",

        explanation:
          "2(4²) - 3 = 2(16) - 3 = 29.",

        difficulty: "easy",
      },

      {
        questionText:
          "Solve the equation 3x - 7 = 14.",

        options: {
          A: "5",
          B: "6",
          C: "7",
          D: "8",
        },

        correctAnswer: "C",

        explanation:
          "Add 7 to both sides: 3x = 21. Therefore x = 7.",

        difficulty: "easy",
      },

      {
        questionText:
          "What is the factorization of x² - 9?",

        options: {
          A: "(x - 3)(x + 3)",
          B: "(x - 9)(x + 1)",
          C: "(x - 3)²",
          D: "(x + 9)(x - 1)",
        },

        correctAnswer: "A",

        explanation:
          "x² - 9 is a difference of two squares: x² - 3².",

        difficulty: "medium",
      },

      {
        questionText:
          "If 5x = 45, what is x?",

        options: {
          A: "5",
          B: "7",
          C: "9",
          D: "11",
        },

        correctAnswer: "C",

        explanation:
          "Divide both sides by 5: x = 9.",

        difficulty: "easy",
      },

      {
        questionText:
          "Simplify: 4(a + 2).",

        options: {
          A: "4a + 2",
          B: "4a + 6",
          C: "4a + 8",
          D: "a + 8",
        },

        correctAnswer: "C",

        explanation:
          "Multiply 4 by both terms: 4a + 8.",

        difficulty: "easy",
      },

      {
        questionText:
          "If x + 8 = 20, what is x?",

        options: {
          A: "10",
          B: "12",
          C: "14",
          D: "16",
        },

        correctAnswer: "B",

        explanation:
          "Subtract 8 from both sides: x = 12.",

        difficulty: "easy",
      },

      {
        questionText:
          "What is the value of 3² + 4²?",

        options: {
          A: "12",
          B: "20",
          C: "25",
          D: "49",
        },

        correctAnswer: "C",

        explanation:
          "3² + 4² = 9 + 16 = 25.",

        difficulty: "easy",
      },

      {
        questionText:
          "If 2(x + 3) = 18, find x.",

        options: {
          A: "5",
          B: "6",
          C: "7",
          D: "8",
        },

        correctAnswer: "B",

        explanation:
          "Divide both sides by 2 to get x + 3 = 9. Therefore x = 6.",

        difficulty: "medium",
      },
    ];

    const questions = [];

    for (const questionData of questionsData) {
      let question = await Question.findOne({
        questionText: questionData.questionText,
      });

      if (!question) {
        question = await Question.create({
          subject: subject._id,
          topic: topic._id,

          questionText:
            questionData.questionText,

          options: questionData.options,

          correctAnswer:
            questionData.correctAnswer,

          explanation:
            questionData.explanation,

          difficulty:
            questionData.difficulty,

          examType: "jamb",

          year: 2026,

          marks: 1,

          isActive: true,
        });

        console.log(
          `✅ Created question: ${questionData.questionText}`
        );
      } else {
        console.log(
          `ℹ️ Question already exists`
        );
      }

      questions.push(question);
    }

    // ==========================================
    // EXAM
    // ==========================================

    let exam = await Exam.findOne({
      title: "JAMB Mathematics Mock 1",
    });

    if (!exam) {
      exam = await Exam.create({
        title: "JAMB Mathematics Mock 1",

        description:
          "A Mathematics practice examination for JAMB preparation.",

        examType: "jamb",

        subjects: [subject._id],

        questions: questions.map(
          (question) => question._id
        ),

        duration: 20,

        totalMarks: questions.length,

        instructions:
          "Answer all questions. Choose the best answer for each question. You have 20 minutes to complete the examination.",

        isPublished: true,

        isActive: true,
      });

      console.log(
        "✅ JAMB Mathematics Mock 1 created"
      );
    } else {
      console.log(
        "ℹ️ JAMB Mathematics Mock 1 already exists"
      );

      // Keep the existing exam connected to
      // the current questions.
      exam.questions = questions.map(
        (question) => question._id
      );

      exam.subjects = [subject._id];
      exam.totalMarks = questions.length;
      exam.isPublished = true;
      exam.isActive = true;

      await exam.save();

      console.log(
        "✅ Existing exam updated"
      );
    }

    // ==========================================
    // DONE
    // ==========================================

    console.log("");
    console.log(
      "======================================"
    );
    console.log(
      "🎉 XCEL ACADEMY SEED COMPLETE!"
    );
    console.log(
      "======================================"
    );

    console.log(
      `📚 Subject: ${subject.name}`
    );

    console.log(
      `📖 Topic: ${topic.title}`
    );

    console.log(
      `📝 Questions: ${questions.length}`
    );

    console.log(
      `🧪 Exam: ${exam.title}`
    );

    console.log(
      `⏱️ Duration: ${exam.duration} minutes`
    );

    console.log(
      `🎯 Total Marks: ${exam.totalMarks}`
    );

    console.log(
      `🌐 Published: ${exam.isPublished}`
    );

    console.log(
      `🟢 Active: ${exam.isActive}`
    );

    console.log(
      "======================================"
    );

    await mongoose.connection.close();

    process.exit(0);
  } catch (error) {
    console.error(
      "❌ Seed error:",
      error
    );

    await mongoose.connection.close();

    process.exit(1);
  }
};

seedExam();