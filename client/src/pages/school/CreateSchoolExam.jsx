import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

const API_URL = "https://xcelacad.onrender.com/api";

const CreateSchoolExam = () => {
  const { schoolId } = useParams();
  const navigate = useNavigate();

  const token = localStorage.getItem("xcelToken");

  const [assignments, setAssignments] = useState([]);
  const [questions, setQuestions] = useState([]);

  const [loadingAssignments, setLoadingAssignments] =
    useState(true);

  const [loadingQuestions, setLoadingQuestions] =
    useState(false);

  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ==========================================
  // FORM
  // ==========================================

  const [title, setTitle] = useState("");
  const [description, setDescription] =
    useState("");

  const [duration, setDuration] = useState(30);

  const [instructions, setInstructions] =
    useState("");

  const [selectedAssignment, setSelectedAssignment] =
    useState("");

  const [selectedQuestions, setSelectedQuestions] =
    useState([]);

  const [isPublished, setIsPublished] =
    useState(false);

  // ==========================================
  // QUESTION FILTERS
  // ==========================================

  const [examType, setExamType] =
    useState("");

  const [difficulty, setDifficulty] =
    useState("");

  const [year, setYear] =
    useState("");

  const [search, setSearch] =
    useState("");

  // ==========================================
  // LOAD TEACHER ASSIGNMENTS
  // ==========================================

  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        setLoadingAssignments(true);
        setError("");

        const response = await fetch(
          `${API_URL}/schools/${schoolId}/assignments`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Failed to load assignments."
          );
        }

        const activeAssignments =
          (data.assignments || []).filter(
            (assignment) =>
              assignment.isActive !== false
          );

        setAssignments(activeAssignments);
      } catch (err) {
        console.error(err);

        setError(
          err.message ||
            "Failed to load teacher assignments."
        );
      } finally {
        setLoadingAssignments(false);
      }
    };

    fetchAssignments();
  }, [schoolId, token]);

  // ==========================================
  // ASSIGNMENT SUBJECT
  // ==========================================

  const selectedAssignmentData = useMemo(() => {
    return assignments.find(
      (assignment) =>
        assignment._id === selectedAssignment
    );
  }, [assignments, selectedAssignment]);

  const selectedSubject =
    selectedAssignmentData?.subject;

  const selectedClass =
    selectedAssignmentData?.class;

  // ==========================================
  // LOAD QUESTIONS
  // ==========================================

  const fetchQuestions = async () => {
    if (!selectedSubject?._id) {
      setQuestions([]);
      return;
    }

    try {
      setLoadingQuestions(true);
      setError("");

      const params = new URLSearchParams();

      params.set(
        "subject",
        selectedSubject._id
      );

      if (examType) {
        params.set("examType", examType);
      }

      if (difficulty) {
        params.set(
          "difficulty",
          difficulty
        );
      }

      if (year) {
        params.set("year", year);
      }

      if (search.trim()) {
        params.set(
          "search",
          search.trim()
        );
      }

      const response = await fetch(
        `${API_URL}/schools/${schoolId}/exams/questions?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to load questions."
        );
      }

      setQuestions(data.questions || []);
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          "Failed to load questions."
      );
    } finally {
      setLoadingQuestions(false);
    }
  };

  useEffect(() => {
    setSelectedQuestions([]);
    setQuestions([]);

    if (selectedSubject?._id) {
      fetchQuestions();
    }
  }, [selectedSubject?._id]);

  // ==========================================
  // QUESTION SELECTION
  // ==========================================

  const toggleQuestion = (questionId) => {
    setSelectedQuestions((current) => {
      if (current.includes(questionId)) {
        return current.filter(
          (id) => id !== questionId
        );
      }

      return [
        ...current,
        questionId,
      ];
    });
  };

  const selectAllVisible = () => {
    const visibleIds = questions.map(
      (question) => question._id
    );

    setSelectedQuestions((current) => [
      ...new Set([
        ...current,
        ...visibleIds,
      ]),
    ]);
  };

  const clearVisibleSelection = () => {
    const visibleIds = new Set(
      questions.map(
        (question) => question._id
      )
    );

    setSelectedQuestions((current) =>
      current.filter(
        (id) => !visibleIds.has(id)
      )
    );
  };

  // ==========================================
  // SELECTED QUESTION DETAILS
  // ==========================================

  const selectedQuestionDocs =
    questions.filter((question) =>
      selectedQuestions.includes(
        question._id
      )
    );

  const visibleSelectedCount =
    selectedQuestionDocs.length;

  const totalMarks =
    selectedQuestionDocs.reduce(
      (total, question) =>
        total + (question.marks || 1),
      0
    );

  // ==========================================
  // CREATE EXAM
  // ==========================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!selectedAssignmentData) {
      setError(
        "Please select a subject and class."
      );
      return;
    }

    if (!title.trim()) {
      setError(
        "Please enter an exam title."
      );
      return;
    }

    if (
      !duration ||
      Number(duration) < 1
    ) {
      setError(
        "Duration must be at least 1 minute."
      );
      return;
    }

    if (
      selectedQuestions.length === 0
    ) {
      setError(
        "Please select at least one question."
      );
      return;
    }

    try {
      setSubmitting(true);

      const response = await fetch(
        `${API_URL}/schools/${schoolId}/exams`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: title.trim(),

            description:
              description.trim(),

            examType:
              examType || "practice",

            subject:
              selectedSubject._id,

            schoolClass:
              selectedClass._id,

            questions:
              selectedQuestions,

            duration:
              Number(duration),

            instructions:
              instructions.trim(),

            isPublished,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to create school exam."
        );
      }

      setSuccess(
        data.message ||
          "School exam created successfully."
      );

      // Give the user a moment to see success.
      setTimeout(() => {
        navigate(
          `/school/${schoolId}/exams`
        );
      }, 800);
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          "Failed to create school exam."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ==========================================
  // LOADING
  // ==========================================

  if (loadingAssignments) {
    return (
      <div className="p-6">
        <p>Loading your assignments...</p>
      </div>
    );
  }

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* HEADER */}

      <div className="mb-6">
        <button
          type="button"
          onClick={() =>
            navigate(
              `/school/${schoolId}/teacher-dashboard`
            )
          }
          className="mb-3 text-sm"
        >
          ← Back to Teacher Dashboard
        </button>

        <h1 className="text-2xl font-bold">
          Create School Exam
        </h1>

        <p className="text-gray-600">
          Create a test for one of your
          assigned classes.
        </p>
      </div>

      {/* ERROR */}

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}

      {/* SUCCESS */}

      {success && (
        <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-4 text-green-700">
          {success}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-6"
      >
        {/* =====================================
            BASIC INFORMATION
        ====================================== */}

        <section className="rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">
            Exam Information
          </h2>

          <div className="grid gap-4 md:grid-cols-2">
            {/* TITLE */}

            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium">
                Exam Title
              </label>

              <input
                type="text"
                value={title}
                onChange={(event) =>
                  setTitle(event.target.value)
                }
                placeholder="e.g. Economics Mid-Term Test"
                className="w-full rounded-lg border px-3 py-2"
              />
            </div>

            {/* DESCRIPTION */}

            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium">
                Description
              </label>

              <textarea
                value={description}
                onChange={(event) =>
                  setDescription(
                    event.target.value
                  )
                }
                placeholder="Brief description of the exam"
                rows={3}
                className="w-full rounded-lg border px-3 py-2"
              />
            </div>

            {/* ASSIGNMENT */}

            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium">
                Subject & Class
              </label>

              <select
                value={selectedAssignment}
                onChange={(event) =>
                  setSelectedAssignment(
                    event.target.value
                  )
                }
                className="w-full rounded-lg border px-3 py-2"
              >
                <option value="">
                  Select subject and class
                </option>

                {assignments.map(
                  (assignment) => (
                    <option
                      key={assignment._id}
                      value={assignment._id}
                    >
                      {assignment.subject?.name} —{" "}
                      {assignment.class?.name}
                      {assignment.class?.section
                        ? ` ${assignment.class.section}`
                        : ""}
                    </option>
                  )
                )}
              </select>
            </div>

            {/* EXAM TYPE */}

            <div>
              <label className="mb-1 block text-sm font-medium">
                Question Exam Type
              </label>

              <select
                value={examType}
                onChange={(event) =>
                  setExamType(
                    event.target.value
                  )
                }
                className="w-full rounded-lg border px-3 py-2"
              >
                <option value="">
                  All types
                </option>

                <option value="jamb">
                  JAMB
                </option>

                <option value="post-utme">
                  Post-UTME
                </option>

                <option value="waec">
                  WAEC
                </option>

                <option value="neco">
                  NECO
                </option>

                <option value="practice">
                  Practice
                </option>
              </select>
            </div>

            {/* DURATION */}

            <div>
              <label className="mb-1 block text-sm font-medium">
                Duration (minutes)
              </label>

              <input
                type="number"
                min="1"
                value={duration}
                onChange={(event) =>
                  setDuration(
                    event.target.value
                  )
                }
                className="w-full rounded-lg border px-3 py-2"
              />
            </div>

            {/* INSTRUCTIONS */}

            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium">
                Instructions
              </label>

              <textarea
                value={instructions}
                onChange={(event) =>
                  setInstructions(
                    event.target.value
                  )
                }
                placeholder="Instructions students should see before taking the exam"
                rows={3}
                className="w-full rounded-lg border px-3 py-2"
              />
            </div>
          </div>
        </section>

        {/* =====================================
            QUESTION FILTERS
        ====================================== */}

        {selectedSubject && (
          <section className="rounded-xl border bg-white p-6 shadow-sm">
            <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="text-lg font-semibold">
                  Select Questions
                </h2>

                <p className="text-sm text-gray-600">
                  Showing questions for{" "}
                  <strong>
                    {selectedSubject.name}
                  </strong>
                  .
                </p>
              </div>

              <div className="text-sm">
                Selected:{" "}
                <strong>
                  {selectedQuestions.length}
                </strong>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-4">
              {/* DIFFICULTY */}

              <select
                value={difficulty}
                onChange={(event) =>
                  setDifficulty(
                    event.target.value
                  )
                }
                className="rounded-lg border px-3 py-2"
              >
                <option value="">
                  All difficulties
                </option>

                <option value="easy">
                  Easy
                </option>

                <option value="medium">
                  Medium
                </option>

                <option value="hard">
                  Hard
                </option>
              </select>

              {/* YEAR */}

              <input
                type="number"
                value={year}
                onChange={(event) =>
                  setYear(event.target.value)
                }
                placeholder="Question year"
                className="rounded-lg border px-3 py-2"
              />

              {/* SEARCH */}

              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search questions..."
                className="rounded-lg border px-3 py-2 md:col-span-2"
              />
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={fetchQuestions}
                disabled={loadingQuestions}
                className="rounded-lg border px-4 py-2"
              >
                {loadingQuestions
                  ? "Loading..."
                  : "Apply Filters"}
              </button>

              <button
                type="button"
                onClick={selectAllVisible}
                disabled={
                  questions.length === 0
                }
                className="rounded-lg border px-4 py-2"
              >
                Select Visible
              </button>

              <button
                type="button"
                onClick={
                  clearVisibleSelection
                }
                disabled={
                  questions.length === 0
                }
                className="rounded-lg border px-4 py-2"
              >
                Clear Visible
              </button>
            </div>
          </section>
        )}

        {/* =====================================
            QUESTIONS
        ====================================== */}

        {selectedSubject && (
          <section className="rounded-xl border bg-white p-6 shadow-sm">
            {loadingQuestions ? (
              <p>
                Loading questions...
              </p>
            ) : questions.length === 0 ? (
              <div className="rounded-lg bg-gray-50 p-6 text-center text-gray-600">
                No questions found for
                this subject and filters.
              </div>
            ) : (
              <div className="space-y-3">
                {questions.map(
                  (question, index) => {
                    const isSelected =
                      selectedQuestions.includes(
                        question._id
                      );

                    return (
                      <label
                        key={question._id}
                        className={`block cursor-pointer rounded-lg border p-4 ${
                          isSelected
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200"
                        }`}
                      >
                        <div className="flex gap-3">
                          <input
                            type="checkbox"
                            checked={
                              isSelected
                            }
                            onChange={() =>
                              toggleQuestion(
                                question._id
                              )
                            }
                            className="mt-1"
                          />

                          <div className="flex-1">
                            <div className="mb-1 flex flex-wrap gap-2 text-xs text-gray-500">
                              <span>
                                Question{" "}
                                {index + 1}
                              </span>

                              {question.topic && (
                                <span>
                                  •{" "}
                                  {
                                    question
                                      .topic
                                      .title
                                  }
                                </span>
                              )}

                              <span>
                                •{" "}
                                {
                                  question
                                    .difficulty
                                }
                              </span>

                              {question.year && (
                                <span>
                                  •{" "}
                                  {
                                    question.year
                                  }
                                </span>
                              )}

                              <span>
                                •{" "}
                                {
                                  question.marks ||
                                  1
                                }{" "}
                                mark
                              </span>
                            </div>

                            <p className="font-medium">
                              {
                                question.questionText
                              }
                            </p>
                          </div>
                        </div>
                      </label>
                    );
                  }
                )}
              </div>
            )}
          </section>
        )}

        {/* =====================================
            SUMMARY
        ====================================== */}

        <section className="rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">
            Exam Summary
          </h2>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg bg-gray-50 p-4">
              <p className="text-sm text-gray-500">
                Class
              </p>

              <p className="font-semibold">
                {selectedClass
                  ? `${selectedClass.name}${
                      selectedClass.section
                        ? ` ${selectedClass.section}`
                        : ""
                    }`
                  : "Not selected"}
              </p>
            </div>

            <div className="rounded-lg bg-gray-50 p-4">
              <p className="text-sm text-gray-500">
                Questions
              </p>

              <p className="font-semibold">
                {selectedQuestions.length}
              </p>
            </div>

            <div className="rounded-lg bg-gray-50 p-4">
              <p className="text-sm text-gray-500">
                Total Marks
              </p>

              <p className="font-semibold">
                {totalMarks}
              </p>
            </div>
          </div>

          {selectedQuestions.length > 0 &&
            visibleSelectedCount !==
              selectedQuestions.length && (
              <p className="mt-3 text-sm text-orange-600">
                {selectedQuestions.length -
                  visibleSelectedCount}{" "}
                selected question(s) are
                currently hidden by your
                filters. They will still be
                included in the exam.
              </p>
            )}
        </section>

        {/* =====================================
            PUBLISH
        ====================================== */}

        <section className="rounded-xl border bg-white p-6 shadow-sm">
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              checked={isPublished}
              onChange={(event) =>
                setIsPublished(
                  event.target.checked
                )
              }
              className="mt-1"
            />

            <span>
              <strong>
                Publish immediately
              </strong>

              <span className="block text-sm text-gray-600">
                If enabled, students in the
                selected class will be able to
                access the exam once the student
                exam system is connected.
              </span>
            </span>
          </label>
        </section>

        {/* =====================================
            SUBMIT
        ====================================== */}

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() =>
              navigate(
                `/school/${schoolId}/teacher-dashboard`
              )
            }
            className="rounded-lg border px-5 py-2"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-blue-600 px-5 py-2 text-white disabled:opacity-50"
          >
            {submitting
              ? "Creating..."
              : isPublished
              ? "Create & Publish Exam"
              : "Save Exam"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateSchoolExam;