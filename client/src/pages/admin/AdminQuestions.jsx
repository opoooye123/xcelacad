
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";

const API_URL = "https://xcelacad.onrender.com/api";

const EMPTY_FORM = {
  questionText: "",
  subject: "",
  topic: "",
  options: {
    A: "",
    B: "",
    C: "",
    D: "",
  },
  correctAnswer: "A",
  marks: 1,
  explanation: "",
};

const AdminQuestions = () => {
  const { token } = useAuth();

  const [questions, setQuestions] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [topics, setTopics] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState(EMPTY_FORM);

  const [search, setSearch] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("");
  const [topicFilter, setTopicFilter] = useState("");

  // ==========================================================
  // FETCH QUESTIONS
  // ==========================================================

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_URL}/questions`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to load questions."
        );
      }

      setQuestions(
        data.questions ||
          data.data ||
          []
      );
    } catch (err) {
      console.error(
        "Fetch questions error:",
        err
      );

      setError(
        err.message ||
          "Failed to load questions."
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================
  // FETCH SUBJECTS
  // ==========================================================

  const fetchSubjects = async () => {
    try {
      const response = await fetch(
        `${API_URL}/subjects`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to load subjects."
        );
      }

      setSubjects(
        data.subjects ||
          data.data ||
          []
      );
    } catch (err) {
      console.error(
        "Fetch subjects error:",
        err
      );
    }
  };

  // ==========================================================
  // FETCH TOPICS
  // ==========================================================

  const fetchTopics = async () => {
    try {
      const response = await fetch(
        `${API_URL}/topics`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to load topics."
        );
      }

      setTopics(
        data.topics ||
          data.data ||
          []
      );
    } catch (err) {
      console.error(
        "Fetch topics error:",
        err
      );
    }
  };

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    fetchQuestions();
    fetchSubjects();
    fetchTopics();
  }, [token]);

  // ==========================================================
  // FORM CHANGE
  // ==========================================================

  const handleChange = (event) => {
    const {
      name,
      value,
    } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleOptionChange = (
    option,
    value
  ) => {
    setForm((previous) => ({
      ...previous,

      options: {
        ...previous.options,
        [option]: value,
      },
    }));
  };

  // ==========================================================
  // CREATE / UPDATE QUESTION
  // ==========================================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!token) {
      setError(
        "You are not authenticated."
      );
      return;
    }

    setError("");
    setSuccess("");

    if (!form.questionText.trim()) {
      setError(
        "Question text is required."
      );
      return;
    }

    if (!form.subject) {
      setError(
        "Please select a subject."
      );
      return;
    }

    if (!form.topic) {
      setError(
        "Please select a topic."
      );
      return;
    }

    const options = {
      A: form.options.A.trim(),
      B: form.options.B.trim(),
      C: form.options.C.trim(),
      D: form.options.D.trim(),
    };

    if (
      !options.A ||
      !options.B ||
      !options.C ||
      !options.D
    ) {
      setError(
        "All four answer options are required."
      );
      return;
    }

    try {
      setSaving(true);

      const isEditing =
        Boolean(editingId);

      const url = isEditing
        ? `${API_URL}/questions/${editingId}`
        : `${API_URL}/questions`;

      const method = isEditing
        ? "PUT"
        : "POST";

      const response = await fetch(url, {
        method,

        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type":
            "application/json",
        },

        body: JSON.stringify({
          questionText:
            form.questionText.trim(),

          subject: form.subject,

          topic: form.topic,

          options,

          correctAnswer:
            form.correctAnswer,

          marks:
            Number(form.marks) || 1,

          explanation:
            form.explanation.trim(),
        }),
      });

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to save question."
        );
      }

      setSuccess(
        isEditing
          ? "Question updated successfully."
          : "Question created successfully."
      );

      resetForm();

      await fetchQuestions();
    } catch (err) {
      console.error(
        "Save question error:",
        err
      );

      setError(
        err.message ||
          "Failed to save question."
      );
    } finally {
      setSaving(false);
    }
  };

  // ==========================================================
  // EDIT
  // ==========================================================

  const handleEdit = (question) => {
    setEditingId(question._id);

    const questionOptions =
      question.options || {};

    setForm({
      questionText:
        question.questionText ||
        question.question ||
        "",

      subject:
        question.subject?._id ||
        question.subject ||
        "",

      topic:
        question.topic?._id ||
        question.topic ||
        "",

      options: {
        A:
          questionOptions.A ||
          "",
        B:
          questionOptions.B ||
          "",
        C:
          questionOptions.C ||
          "",
        D:
          questionOptions.D ||
          "",
      },

      correctAnswer:
        question.correctAnswer ||
        "A",

      marks:
        question.marks || 1,

      explanation:
        question.explanation ||
        "",
    });

    setError("");
    setSuccess("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // ==========================================================
  // DELETE
  // ==========================================================

  const handleDelete = async (id) => {
    if (!token) {
      setError(
        "You are not authenticated."
      );
      return;
    }

    const confirmed =
      window.confirm(
        "Are you sure you want to delete this question?"
      );

    if (!confirmed) {
      return;
    }

    try {
      setError("");
      setSuccess("");

      const response =
        await fetch(
          `${API_URL}/questions/${id}`,
          {
            method: "DELETE",

            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to delete question."
        );
      }

      setSuccess(
        "Question deleted successfully."
      );

      await fetchQuestions();
    } catch (err) {
      console.error(
        "Delete question error:",
        err
      );

      setError(
        err.message ||
          "Failed to delete question."
      );
    }
  };

  // ==========================================================
  // RESET
  // ==========================================================

  const resetForm = () => {
    setEditingId(null);
    setForm({
      ...EMPTY_FORM,
      options: {
        A: "",
        B: "",
        C: "",
        D: "",
      },
    });
  };

  // ==========================================================
  // FILTER TOPICS FOR SELECTED SUBJECT
  // ==========================================================

  const availableFormTopics =
    useMemo(() => {
      if (!form.subject) {
        return topics;
      }

      return topics.filter(
        (topic) => {
          const topicSubject =
            topic.subject?._id ||
            topic.subject;

          return (
            topicSubject ===
            form.subject
          );
        }
      );
    }, [
      topics,
      form.subject,
    ]);

  const availableFilterTopics =
    useMemo(() => {
      if (!subjectFilter) {
        return topics;
      }

      return topics.filter(
        (topic) => {
          const topicSubject =
            topic.subject?._id ||
            topic.subject;

          return (
            topicSubject ===
            subjectFilter
          );
        }
      );
    }, [
      topics,
      subjectFilter,
    ]);

  // ==========================================================
  // FILTER QUESTIONS
  // ==========================================================

  const filteredQuestions =
    useMemo(() => {
      const searchValue =
        search
          .trim()
          .toLowerCase();

      return questions.filter(
        (question) => {
          const questionText =
            (
              question.questionText ||
              question.question ||
              ""
            ).toLowerCase();

          const subjectId =
            question.subject?._id ||
            question.subject ||
            "";

          const topicId =
            question.topic?._id ||
            question.topic ||
            "";

          const matchesSearch =
            !searchValue ||
            questionText.includes(
              searchValue
            );

          const matchesSubject =
            !subjectFilter ||
            subjectId ===
              subjectFilter;

          const matchesTopic =
            !topicFilter ||
            topicId === topicFilter;

          return (
            matchesSearch &&
            matchesSubject &&
            matchesTopic
          );
        }
      );
    }, [
      questions,
      search,
      subjectFilter,
      topicFilter,
    ]);

  // ==========================================================
  // SUBJECT NAME
  // ==========================================================

  const getSubjectName = (
    question
  ) => {
    if (
      question.subject &&
      typeof question.subject ===
        "object"
    ) {
      return (
        question.subject.name ||
        "Unknown subject"
      );
    }

    const subject =
      subjects.find(
        (item) =>
          item._id ===
          question.subject
      );

    return (
      subject?.name ||
      "Unknown subject"
    );
  };

  // ==========================================================
  // TOPIC NAME
  // ==========================================================

  const getTopicName = (
    question
  ) => {
    if (
      question.topic &&
      typeof question.topic ===
        "object"
    ) {
      return (
        question.topic.title ||
        question.topic.name ||
        "Unknown topic"
      );
    }

    const topic =
      topics.find(
        (item) =>
          item._id ===
          question.topic
      );

    return (
      topic?.title ||
      topic?.name ||
      "Unknown topic"
    );
  };

  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {
    return (
      <div style={styles.page}>
        <div style={styles.container}>
          <h1 style={styles.title}>
            Question Management
          </h1>

          <p style={styles.subtitle}>
            Loading questions...
          </p>
        </div>
      </div>
    );
  }

  // ==========================================================
  // UI
  // ==========================================================

  return (
    <div style={styles.page}>
      <div style={styles.container}>

        {/* HEADER */}

        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>
              Question Management
            </h1>

            <p style={styles.subtitle}>
              Create, edit and manage
              questions in the Xcel Academy
              question bank.
            </p>
          </div>

          <div style={styles.countBadge}>
            {questions.length} Questions
          </div>
        </div>

        {/* ERROR */}

        {error && (
          <div style={styles.error}>
            {error}
          </div>
        )}

        {/* SUCCESS */}

        {success && (
          <div style={styles.success}>
            {success}
          </div>
        )}

        {/* QUESTION FORM */}

        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <div>
              <h2 style={styles.cardTitle}>
                {editingId
                  ? "Edit Question"
                  : "Create New Question"}
              </h2>

              <p style={styles.cardSubtitle}>
                {editingId
                  ? "Update the question information below."
                  : "Add a new question to the question bank."}
              </p>
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
          >
            {/* QUESTION TEXT */}

            <div
              style={styles.formGroup}
            >
              <label
                style={styles.label}
              >
                Question
              </label>

              <textarea
                name="questionText"
                value={
                  form.questionText
                }
                onChange={
                  handleChange
                }
                placeholder="Enter the question..."
                rows={5}
                required
                style={
                  styles.textarea
                }
              />
            </div>

            {/* SUBJECT + TOPIC */}

            <div
              style={
                styles.twoColumns
              }
            >
              <div
                style={
                  styles.formGroup
                }
              >
                <label
                  style={styles.label}
                >
                  Subject
                </label>

                <select
                  name="subject"
                  value={
                    form.subject
                  }
                  onChange={(event) => {
                    handleChange(
                      event
                    );

                    setForm(
                      (previous) => ({
                        ...previous,
                        topic: "",
                      })
                    );
                  }}
                  required
                  style={
                    styles.select
                  }
                >
                  <option value="">
                    Select subject
                  </option>

                  {subjects.map(
                    (subject) => (
                      <option
                        key={
                          subject._id
                        }
                        value={
                          subject._id
                        }
                      >
                        {subject.name}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div
                style={
                  styles.formGroup
                }
              >
                <label
                  style={styles.label}
                >
                  Topic
                </label>

                <select
                  name="topic"
                  value={
                    form.topic
                  }
                  onChange={
                    handleChange
                  }
                  required
                  style={
                    styles.select
                  }
                >
                  <option value="">
                    Select topic
                  </option>

                  {availableFormTopics.map(
                    (topic) => (
                      <option
                        key={
                          topic._id
                        }
                        value={
                          topic._id
                        }
                      >
                        {topic.title ||
                          topic.name}
                      </option>
                    )
                  )}
                </select>
              </div>
            </div>

            {/* OPTIONS */}

            <div
              style={
                styles.optionsSection
              }
            >
              <h3
                style={
                  styles.sectionTitle
                }
              >
                Answer Options
              </h3>

              {["A", "B", "C", "D"].map(
                (option) => (
                  <div
                    key={option}
                    style={
                      styles.optionRow
                    }
                  >
                    <div
                      style={
                        styles.optionBadge
                      }
                    >
                      {option}
                    </div>

                    <input
                      type="text"
                      value={
                        form.options[
                          option
                        ]
                      }
                      onChange={(event) =>
                        handleOptionChange(
                          option,
                          event.target
                            .value
                        )
                      }
                      placeholder={`Option ${option}`}
                      required
                      style={
                        styles.input
                      }
                    />
                  </div>
                )
              )}
            </div>

            {/* CORRECT ANSWER + MARKS */}

            <div
              style={
                styles.twoColumns
              }
            >
              <div
                style={
                  styles.formGroup
                }
              >
                <label
                  style={styles.label}
                >
                  Correct Answer
                </label>

                <select
                  name="correctAnswer"
                  value={
                    form.correctAnswer
                  }
                  onChange={
                    handleChange
                  }
                  style={
                    styles.select
                  }
                >
                  <option value="A">
                    A
                  </option>

                  <option value="B">
                    B
                  </option>

                  <option value="C">
                    C
                  </option>

                  <option value="D">
                    D
                  </option>
                </select>
              </div>

              <div
                style={
                  styles.formGroup
                }
              >
                <label
                  style={styles.label}
                >
                  Marks
                </label>

                <input
                  type="number"
                  name="marks"
                  min="1"
                  value={form.marks}
                  onChange={
                    handleChange
                  }
                  required
                  style={
                    styles.input
                  }
                />
              </div>
            </div>

            {/* EXPLANATION */}

            <div
              style={
                styles.formGroup
              }
            >
              <label
                style={styles.label}
              >
                Explanation{" "}
                <span
                  style={
                    styles.optional
                  }
                >
                  (optional)
                </span>
              </label>

              <textarea
                name="explanation"
                value={
                  form.explanation
                }
                onChange={
                  handleChange
                }
                placeholder="Explain why the correct answer is correct..."
                rows={4}
                style={
                  styles.textarea
                }
              />
            </div>

            {/* ACTIONS */}

            <div
              style={
                styles.formActions
              }
            >
              {editingId && (
                <button
                  type="button"
                  onClick={
                    resetForm
                  }
                  disabled={saving}
                  style={
                    styles.cancelButton
                  }
                >
                  Cancel
                </button>
              )}

              <button
                type="submit"
                disabled={saving}
                style={
                  styles.primaryButton
                }
              >
                {saving
                  ? "Saving..."
                  : editingId
                  ? "Update Question"
                  : "Create Question"}
              </button>
            </div>
          </form>
        </div>

        {/* QUESTION LIST */}

        <div style={styles.card}>
          <div
            style={
              styles.listHeader
            }
          >
            <div>
              <h2
                style={
                  styles.cardTitle
                }
              >
                Question Bank
              </h2>

              <p
                style={
                  styles.cardSubtitle
                }
              >
                Search and manage your
                questions.
              </p>
            </div>

            <div
              style={
                styles.resultCount
              }
            >
              Showing{" "}
              {filteredQuestions.length}{" "}
              of {questions.length}
            </div>
          </div>

          {/* FILTERS */}

          <div
            style={
              styles.filters
            }
          >
            <input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Search questions..."
              style={
                styles.searchInput
              }
            />

            <select
              value={
                subjectFilter
              }
              onChange={(event) => {
                setSubjectFilter(
                  event.target.value
                );

                setTopicFilter("");
              }}
              style={
                styles.filterSelect
              }
            >
              <option value="">
                All subjects
              </option>

              {subjects.map(
                (subject) => (
                  <option
                    key={
                      subject._id
                    }
                    value={
                      subject._id
                    }
                  >
                    {subject.name}
                  </option>
                )
              )}
            </select>

            <select
              value={topicFilter}
              onChange={(event) =>
                setTopicFilter(
                  event.target.value
                )
              }
              style={
                styles.filterSelect
              }
            >
              <option value="">
                All topics
              </option>

              {availableFilterTopics.map(
                (topic) => (
                  <option
                    key={
                      topic._id
                    }
                    value={
                      topic._id
                    }
                  >
                    {topic.title ||
                      topic.name}
                  </option>
                )
              )}
            </select>
          </div>

          {/* EMPTY */}

          {filteredQuestions.length ===
          0 ? (
            <div
              style={
                styles.empty
              }
            >
              <div
                style={
                  styles.emptyIcon
                }
              >
                ?
              </div>

              <h3>
                {questions.length ===
                0
                  ? "No questions yet"
                  : "No questions found"}
              </h3>

              <p>
                {questions.length ===
                0
                  ? "Create your first question using the form above."
                  : "Try changing your search or filters."}
              </p>
            </div>
          ) : (
            <div
              style={
                styles.questionList
              }
            >
              {filteredQuestions.map(
                (question, index) => {
                  const questionText =
                    question.questionText ||
                    question.question ||
                    "";

                  const options =
                    question.options ||
                    {};

                  return (
                    <div
                      key={
                        question._id
                      }
                      style={
                        styles.questionItem
                      }
                    >
                      <div
                        style={
                          styles.questionTop
                        }
                      >
                        <div
                          style={
                            styles.questionNumber
                          }
                        >
                          #
                          {index +
                            1}
                        </div>

                        <div
                          style={
                            styles.questionMeta
                          }
                        >
                          <span
                            style={
                              styles.subjectBadge
                            }
                          >
                            {getSubjectName(
                              question
                            )}
                          </span>

                          <span
                            style={
                              styles.topicBadge
                            }
                          >
                            {getTopicName(
                              question
                            )}
                          </span>

                          <span
                            style={
                              styles.markBadge
                            }
                          >
                            {question.marks ||
                              1}{" "}
                            mark
                            {(question.marks ||
                              1) !==
                            1
                              ? "s"
                              : ""}
                          </span>
                        </div>
                      </div>

                      <p
                        style={
                          styles.questionText
                        }
                      >
                        {questionText}
                      </p>

                      <div
                        style={
                          styles.optionGrid
                        }
                      >
                        {["A", "B", "C", "D"].map(
                          (option) => (
                            <div
                              key={
                                option
                              }
                              style={{
                                ...styles.answerOption,
                                ...(question.correctAnswer ===
                                option
                                  ? styles.correctOption
                                  : {}),
                              }}
                            >
                              <strong>
                                {option}.
                              </strong>{" "}
                              {options[
                                option
                              ] || "—"}
                            </div>
                          )
                        )}
                      </div>

                      <div
                        style={
                          styles.questionFooter
                        }
                      >
                        <span
                          style={
                            styles.correctLabel
                          }
                        >
                          Correct answer:{" "}
                          <strong>
                            {
                              question.correctAnswer
                            }
                          </strong>
                        </span>

                        <div
                          style={
                            styles.actions
                          }
                        >
                          <button
                            type="button"
                            onClick={() =>
                              handleEdit(
                                question
                              )
                            }
                            style={
                              styles.editButton
                            }
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleDelete(
                                question._id
                              )
                            }
                            style={
                              styles.deleteButton
                            }
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ==========================================================
// STYLES
// ==========================================================

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f5f7fb",
    padding: "40px 20px",
  },

  container: {
    maxWidth: "1200px",
    margin: "0 auto",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "20px",
    marginBottom: "30px",
  },

  title: {
    margin: 0,
    fontSize: "32px",
    color: "#111827",
  },

  subtitle: {
    marginTop: "8px",
    color: "#64748b",
    lineHeight: 1.6,
  },

  countBadge: {
    background: "#111827",
    color: "#fff",
    padding: "10px 16px",
    borderRadius: "20px",
    fontWeight: "600",
    whiteSpace: "nowrap",
  },

  card: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: "16px",
    padding: "28px",
    marginBottom: "25px",
  },

  cardHeader: {
    marginBottom: "25px",
  },

  cardTitle: {
    margin: 0,
    fontSize: "22px",
    color: "#111827",
  },

  cardSubtitle: {
    marginTop: "6px",
    color: "#64748b",
  },

  formGroup: {
    marginBottom: "20px",
  },

  label: {
    display: "block",
    marginBottom: "8px",
    fontWeight: "600",
    color: "#374151",
  },

  optional: {
    color: "#94a3b8",
    fontWeight: "400",
  },

  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: "13px 14px",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    fontSize: "15px",
    outline: "none",
    background: "#fff",
  },

  textarea: {
    width: "100%",
    boxSizing: "border-box",
    padding: "13px 14px",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    fontSize: "15px",
    resize: "vertical",
    outline: "none",
    fontFamily: "inherit",
  },

  select: {
    width: "100%",
    boxSizing: "border-box",
    padding: "13px 14px",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    fontSize: "15px",
    outline: "none",
    background: "#fff",
  },

  twoColumns: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(240px, 1fr))",
    gap: "20px",
  },

  optionsSection: {
    marginTop: "5px",
    marginBottom: "25px",
    padding: "20px",
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    background: "#f8fafc",
  },

  sectionTitle: {
    marginTop: 0,
    marginBottom: "18px",
    fontSize: "17px",
    color: "#111827",
  },

  optionRow: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "12px",
  },

  optionBadge: {
    width: "36px",
    height: "36px",
    flexShrink: 0,
    display: "grid",
    placeItems: "center",
    background: "#111827",
    color: "#fff",
    borderRadius: "8px",
    fontWeight: "700",
  },

  formActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "10px",
  },

  primaryButton: {
    padding: "13px 22px",
    background: "#111827",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "600",
  },

  cancelButton: {
    padding: "13px 22px",
    background: "#fff",
    color: "#374151",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "600",
  },

  error: {
    background: "#fee2e2",
    color: "#991b1b",
    padding: "14px",
    borderRadius: "8px",
    marginBottom: "20px",
  },

  success: {
    background: "#dcfce7",
    color: "#166534",
    padding: "14px",
    borderRadius: "8px",
    marginBottom: "20px",
  },

  listHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "15px",
    marginBottom: "20px",
  },

  resultCount: {
    color: "#64748b",
    fontSize: "14px",
    whiteSpace: "nowrap",
  },

  filters: {
    display: "grid",
    gridTemplateColumns:
      "minmax(220px, 1fr) minmax(180px, 220px) minmax(180px, 220px)",
    gap: "12px",
    marginBottom: "25px",
  },

  searchInput: {
    width: "100%",
    boxSizing: "border-box",
    padding: "12px 14px",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    fontSize: "14px",
    outline: "none",
  },

  filterSelect: {
    width: "100%",
    boxSizing: "border-box",
    padding: "12px 14px",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    fontSize: "14px",
    background: "#fff",
    outline: "none",
  },

  questionList: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },

  questionItem: {
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    padding: "20px",
    background: "#fff",
  },

  questionTop: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "14px",
  },

  questionNumber: {
    display: "grid",
    placeItems: "center",
    minWidth: "34px",
    height: "34px",
    borderRadius: "8px",
    background: "#111827",
    color: "#fff",
    fontSize: "13px",
    fontWeight: "700",
  },

  questionMeta: {
    display: "flex",
    flexWrap: "wrap",
    gap: "7px",
  },

  subjectBadge: {
    display: "inline-flex",
    padding: "5px 9px",
    borderRadius: "20px",
    background: "#eff6ff",
    color: "#1d4ed8",
    fontSize: "12px",
    fontWeight: "600",
  },

  topicBadge: {
    display: "inline-flex",
    padding: "5px 9px",
    borderRadius: "20px",
    background: "#f1f5f9",
    color: "#475569",
    fontSize: "12px",
    fontWeight: "600",
  },

  markBadge: {
    display: "inline-flex",
    padding: "5px 9px",
    borderRadius: "20px",
    background: "#fef3c7",
    color: "#92400e",
    fontSize: "12px",
    fontWeight: "600",
  },

  questionText: {
    margin: "0 0 16px",
    fontSize: "16px",
    lineHeight: 1.6,
    color: "#111827",
    fontWeight: "600",
  },

  optionGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(250px, 1fr))",
    gap: "10px",
  },

  answerOption: {
    padding: "11px 13px",
    borderRadius: "8px",
    background: "#f8fafc",
    color: "#475569",
    fontSize: "14px",
    lineHeight: 1.5,
    border: "1px solid #e5e7eb",
  },

  correctOption: {
    background: "#ecfdf5",
    border: "1px solid #86efac",
    color: "#166534",
  },

  questionFooter: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "15px",
    marginTop: "18px",
    paddingTop: "15px",
    borderTop: "1px solid #e5e7eb",
  },

  correctLabel: {
    fontSize: "14px",
    color: "#166534",
  },

  actions: {
    display: "flex",
    gap: "8px",
  },

  editButton: {
    padding: "8px 13px",
    border: "1px solid #d1d5db",
    borderRadius: "7px",
    background: "#fff",
    cursor: "pointer",
    fontWeight: "600",
  },

  deleteButton: {
    padding: "8px 13px",
    border: "none",
    borderRadius: "7px",
    background: "#fee2e2",
    color: "#991b1b",
    cursor: "pointer",
    fontWeight: "600",
  },

  empty: {
    textAlign: "center",
    padding: "60px 20px",
    color: "#64748b",
  },

  emptyIcon: {
    width: "48px",
    height: "48px",
    margin: "0 auto 15px",
    display: "grid",
    placeItems: "center",
    borderRadius: "50%",
    background: "#f1f5f9",
    color: "#64748b",
    fontWeight: "700",
    fontSize: "20px",
  },
};

export default AdminQuestions;

