import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

const API_URL = "https://xcelacad.onrender.com/api";

const StudentSchoolExams = () => {
  const { schoolId } = useParams();
  const navigate = useNavigate();

  const [exams, setExams] = useState([]);
  const [schoolClass, setSchoolClass] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchSchoolExams = async () => {
      try {
        setLoading(true);
        setError("");

        const token = localStorage.getItem("xcelToken");

        if (!token) {
          setError("You are not logged in.");
          return;
        }

        const response = await fetch(
          `${API_URL}/schools/${schoolId}/student-exams`,
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
            data.message || "Failed to load school exams."
          );
        }

        setExams(data.exams || []);
        setSchoolClass(data.class || null);
      } catch (err) {
        console.error(
          "Fetch student school exams error:",
          err
        );

        setError(
          err.message || "Failed to load school exams."
        );
      } finally {
        setLoading(false);
      }
    };

    if (schoolId) {
      fetchSchoolExams();
    }
  }, [schoolId]);

  const getExamTypeLabel = (examType) => {
    const labels = {
      jamb: "JAMB",
      "post-utme": "Post-UTME",
      waec: "WAEC",
      neco: "NECO",
      practice: "Practice",
    };

    return labels[examType] || examType || "School Test";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto max-w-6xl">
          <div className="animate-pulse">
            <div className="mb-4 h-8 w-64 rounded bg-gray-200" />
            <div className="mb-8 h-5 w-48 rounded bg-gray-200" />

            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="h-56 rounded-xl bg-gray-200"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-xl border border-red-200 bg-red-50 p-6">
            <h2 className="text-lg font-semibold text-red-800">
              Unable to load school exams
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

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-6xl">
        {/* HEADER */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="mb-4 text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            ← Back
          </button>

          <h1 className="text-3xl font-bold text-gray-900">
            School Exams
          </h1>

          <p className="mt-2 text-gray-600">
            Tests and exams assigned to your class.
          </p>

          {schoolClass && (
            <div className="mt-4 inline-flex items-center rounded-lg bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700">
              Class:{" "}
              <span className="ml-1">
                {schoolClass.name}
              </span>
            </div>
          )}
        </div>

        {/* EMPTY STATE */}
        {exams.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white p-10 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-2xl">
              📝
            </div>

            <h2 className="text-xl font-semibold text-gray-900">
              No school exams yet
            </h2>

            <p className="mt-2 text-gray-500">
              Your teachers haven't published any exams
              for your class yet.
            </p>
          </div>
        ) : (
          /* EXAMS */
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {exams.map((exam) => (
              <div
                key={exam._id}
                className="flex flex-col rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >
                {/* EXAM TYPE */}
                <div className="mb-4 flex items-center justify-between gap-3">
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                    {getExamTypeLabel(exam.examType)}
                  </span>

                  <span className="text-xs text-gray-500">
                    {exam.totalMarks} marks
                  </span>
                </div>

                {/* TITLE */}
                <h2 className="text-xl font-bold text-gray-900">
                  {exam.title}
                </h2>

                {/* DESCRIPTION */}
                {exam.description && (
                  <p className="mt-2 line-clamp-3 text-sm text-gray-600">
                    {exam.description}
                  </p>
                )}

                {/* SUBJECT */}
                <div className="mt-5 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">
                      Subject
                    </span>

                    <span className="font-medium text-gray-900">
                      {exam.subjects?.length
                        ? exam.subjects
                            .map((subject) => subject.name)
                            .join(", ")
                        : "—"}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-500">
                      Duration
                    </span>

                    <span className="font-medium text-gray-900">
                      {exam.duration} min
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-500">
                      Teacher
                    </span>

                    <span className="font-medium text-gray-900">
                      {exam.createdByTeacher?.name ||
                        "Teacher"}
                    </span>
                  </div>
                </div>

                {/* BUTTON */}
<button
  onClick={() =>
    navigate(
      `/school/${schoolId}/student-exams/${exam._id}`
    )
  }
  className="mt-6 w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
>
  View Exam
</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentSchoolExams;