import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

const API_URL = "https://xcelacad.onrender.com/api";

const StudentSchoolExamDetails = () => {
  const { schoolId, examId } = useParams();
  const navigate = useNavigate();

  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchExam = async () => {
      try {
        setLoading(true);
        setError("");

        const token = localStorage.getItem("xcelToken");

        if (!token) {
          setError("You are not logged in.");
          return;
        }

        const response = await fetch(
          `${API_URL}/exams/${examId}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Failed to load exam."
          );
        }

        setExam(data.exam || data);
      } catch (err) {
        console.error("Fetch exam error:", err);
        setError(err.message || "Failed to load exam.");
      } finally {
        setLoading(false);
      }
    };

    if (examId) {
      fetchExam();
    }
  }, [examId]);

  const handleStartExam = () => {
    navigate(`/exam/${examId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto max-w-4xl">
          <div className="animate-pulse">
            <div className="mb-4 h-8 w-64 rounded bg-gray-200" />
            <div className="mb-8 h-5 w-96 rounded bg-gray-200" />

            <div className="rounded-xl bg-white p-8 shadow-sm">
              <div className="mb-4 h-8 w-72 rounded bg-gray-200" />
              <div className="mb-6 h-20 rounded bg-gray-200" />

              <div className="grid gap-4 md:grid-cols-3">
                <div className="h-20 rounded bg-gray-200" />
                <div className="h-20 rounded bg-gray-200" />
                <div className="h-20 rounded bg-gray-200" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto max-w-4xl">
          <button
            onClick={() =>
              navigate(`/school/${schoolId}/student-exams`)
            }
            className="mb-6 text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            ← Back to School Exams
          </button>

          <div className="rounded-xl border border-red-200 bg-red-50 p-6">
            <h2 className="text-lg font-semibold text-red-800">
              Unable to load exam
            </h2>

            <p className="mt-2 text-sm text-red-700">
              {error}
            </p>

            <button
              onClick={() => window.location.reload()}
              className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto max-w-4xl">
          <p className="text-gray-600">
            Exam not found.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-4xl">
        {/* BACK */}
        <button
          onClick={() =>
            navigate(`/school/${schoolId}/student-exams`)
          }
          className="mb-6 text-sm font-medium text-gray-600 hover:text-gray-900"
        >
          ← Back to School Exams
        </button>

        {/* EXAM CARD */}
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          {/* HEADER */}
          <div className="border-b border-gray-200 p-6 md:p-8">
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                {exam.examType
                  ? exam.examType.toUpperCase()
                  : "SCHOOL TEST"}
              </span>

              {exam.isPublished && (
                <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                  Published
                </span>
              )}
            </div>

            <h1 className="text-3xl font-bold text-gray-900">
              {exam.title}
            </h1>

            {exam.description && (
              <p className="mt-3 text-gray-600">
                {exam.description}
              </p>
            )}
          </div>

          {/* EXAM INFORMATION */}
          <div className="p-6 md:p-8">
            <h2 className="text-lg font-semibold text-gray-900">
              Exam Information
            </h2>

            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl bg-gray-50 p-4">
                <p className="text-sm text-gray-500">
                  Duration
                </p>
                <p className="mt-1 text-lg font-semibold text-gray-900">
                  {exam.duration || 0} minutes
                </p>
              </div>

              <div className="rounded-xl bg-gray-50 p-4">
                <p className="text-sm text-gray-500">
                  Total Marks
                </p>
                <p className="mt-1 text-lg font-semibold text-gray-900">
                  {exam.totalMarks || 0}
                </p>
              </div>

              <div className="rounded-xl bg-gray-50 p-4">
                <p className="text-sm text-gray-500">
                  Questions
                </p>
                <p className="mt-1 text-lg font-semibold text-gray-900">
                  {exam.questions?.length || 0}
                </p>
              </div>

              <div className="rounded-xl bg-gray-50 p-4">
                <p className="text-sm text-gray-500">
                  Subjects
                </p>
                <p className="mt-1 text-lg font-semibold text-gray-900">
                  {exam.subjects?.length || 0}
                </p>
              </div>
            </div>

            {/* SUBJECTS */}
            {exam.subjects?.length > 0 && (
              <div className="mt-8">
                <h2 className="text-lg font-semibold text-gray-900">
                  Subjects
                </h2>

                <div className="mt-3 flex flex-wrap gap-2">
                  {exam.subjects.map((subject) => (
                    <span
                      key={subject._id || subject.id}
                      className="rounded-lg bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700"
                    >
                      {subject.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* INSTRUCTIONS */}
            {exam.instructions && (
              <div className="mt-8">
                <h2 className="text-lg font-semibold text-gray-900">
                  Instructions
                </h2>

                <div className="mt-3 rounded-xl bg-gray-50 p-5 text-sm leading-6 text-gray-700">
                  {exam.instructions}
                </div>
              </div>
            )}

            {/* START */}
            <div className="mt-8 border-t border-gray-200 pt-6">
              <div className="rounded-xl bg-blue-50 p-5">
                <h3 className="font-semibold text-blue-900">
                  Ready to start?
                </h3>

                <p className="mt-1 text-sm text-blue-700">
                  Once you start the exam, your attempt will be
                  created and the exam timer will begin.
                </p>

                <button
                  onClick={handleStartExam}
                  className="mt-5 w-full rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700 sm:w-auto"
                >
                  Start Exam →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentSchoolExamDetails;