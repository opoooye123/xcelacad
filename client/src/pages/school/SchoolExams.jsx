import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

const API_URL = "https://xcelacad.onrender.com/api";

const SchoolExams = () => {
  const { schoolId } = useParams();
  const navigate = useNavigate();

  const token = localStorage.getItem("xcelToken");

  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionId, setActionId] = useState("");

  // ==========================================
  // FETCH EXAMS
  // ==========================================

  const fetchExams = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_URL}/schools/${schoolId}/exams`,
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
            "Failed to load school exams."
        );
      }

      setExams(data.exams || []);
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          "Failed to load school exams."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExams();
  }, [schoolId]);

  // ==========================================
  // PUBLISH EXAM
  // ==========================================

  const publishExam = async (examId) => {
    try {
      setActionId(examId);
      setError("");

      const response = await fetch(
        `${API_URL}/schools/${schoolId}/exams/${examId}/publish`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to publish exam."
        );
      }

      await fetchExams();
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          "Failed to publish exam."
      );
    } finally {
      setActionId("");
    }
  };

  // ==========================================
  // DEACTIVATE EXAM
  // ==========================================

  const deactivateExam = async (examId) => {
    const confirmed = window.confirm(
      "Are you sure you want to deactivate this exam?"
    );

    if (!confirmed) return;

    try {
      setActionId(examId);
      setError("");

      const response = await fetch(
        `${API_URL}/schools/${schoolId}/exams/${examId}/deactivate`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to deactivate exam."
        );
      }

      await fetchExams();
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          "Failed to deactivate exam."
      );
    } finally {
      setActionId("");
    }
  };

  // ==========================================
  // HELPERS
  // ==========================================

  const getQuestionCount = (exam) => {
    return exam.questions?.length || 0;
  };

  const getStatus = (exam) => {
    if (!exam.isActive) {
      return {
        label: "Inactive",
        className:
          "bg-gray-100 text-gray-700",
      };
    }

    if (exam.isPublished) {
      return {
        label: "Published",
        className:
          "bg-green-100 text-green-700",
      };
    }

    return {
      label: "Draft",
      className:
        "bg-yellow-100 text-yellow-700",
    };
  };

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl p-6">
        <p>Loading school exams...</p>
      </div>
    );
  }

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <div className="mx-auto max-w-7xl p-6">
      {/* HEADER */}

      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <button
            type="button"
            onClick={() =>
              navigate(
                `/school/${schoolId}/teacher-dashboard`
              )
            }
            className="mb-3 text-sm text-gray-600 hover:text-gray-900"
          >
            ← Back to Teacher Dashboard
          </button>

          <h1 className="text-2xl font-bold">
            School Exams
          </h1>

          <p className="text-gray-600">
            Manage the exams you have created
            for your assigned classes.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            navigate(
              `/school/${schoolId}/exams/create`
            )
          }
          className="rounded-lg bg-blue-600 px-5 py-2 text-white hover:bg-blue-700"
        >
          + Create Exam
        </button>
      </div>

      {/* ERROR */}

      {error && (
        <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}

      {/* EMPTY STATE */}

      {exams.length === 0 ? (
        <div className="rounded-xl border bg-white p-10 text-center shadow-sm">
          <h2 className="mb-2 text-lg font-semibold">
            No school exams yet
          </h2>

          <p className="mb-5 text-gray-600">
            Create your first exam for one
            of your assigned classes.
          </p>

          <button
            type="button"
            onClick={() =>
              navigate(
                `/school/${schoolId}/exams/create`
              )
            }
            className="rounded-lg bg-blue-600 px-5 py-2 text-white"
          >
            Create First Exam
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {exams.map((exam) => {
            const status = getStatus(exam);

            return (
              <div
                key={exam._id}
                className="rounded-xl border bg-white p-5 shadow-sm"
              >
                {/* TOP */}

                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-semibold">
                        {exam.title}
                      </h2>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${status.className}`}
                      >
                        {status.label}
                      </span>
                    </div>

                    {exam.description && (
                      <p className="mb-3 text-sm text-gray-600">
                        {exam.description}
                      </p>
                    )}

                    {/* DETAILS */}

                    <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-gray-600">
                      <span>
                        <strong>
                          Subject:
                        </strong>{" "}
                        {exam.subjects?.[0]
                          ?.name || "Unknown"}
                      </span>

                      <span>
                        <strong>
                          Class:
                        </strong>{" "}
                        {exam.schoolClass
                          ?.name || "Unknown"}
                        {exam.schoolClass
                          ?.section
                          ? ` ${exam.schoolClass.section}`
                          : ""}
                      </span>

                      <span>
                        <strong>
                          Questions:
                        </strong>{" "}
                        {getQuestionCount(exam)}
                      </span>

                      <span>
                        <strong>
                          Marks:
                        </strong>{" "}
                        {exam.totalMarks}
                      </span>

                      <span>
                        <strong>
                          Duration:
                        </strong>{" "}
                        {exam.duration} min
                      </span>
                    </div>
                  </div>

                  {/* ACTIONS */}

                  <div className="flex flex-wrap gap-2">
                    {!exam.isPublished &&
                      exam.isActive && (
                        <button
                          type="button"
                          disabled={
                            actionId === exam._id
                          }
                          onClick={() =>
                            publishExam(
                              exam._id
                            )
                          }
                          className="rounded-lg bg-green-600 px-4 py-2 text-sm text-white disabled:opacity-50"
                        >
                          {actionId ===
                          exam._id
                            ? "Publishing..."
                            : "Publish"}
                        </button>
                      )}

                    {exam.isActive && (
                      <button
                        type="button"
                        disabled={
                          actionId === exam._id
                        }
                        onClick={() =>
                          deactivateExam(
                            exam._id
                          )
                        }
                        className="rounded-lg border border-red-200 px-4 py-2 text-sm text-red-600 disabled:opacity-50"
                      >
                        {actionId ===
                        exam._id
                          ? "Processing..."
                          : "Deactivate"}
                      </button>
                    )}
                  </div>
                </div>

                {/* FOOTER */}

                <div className="mt-4 border-t pt-3 text-xs text-gray-500">
                  Created{" "}
                  {exam.createdAt
                    ? new Date(
                        exam.createdAt
                      ).toLocaleString()
                    : "—"}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SchoolExams;