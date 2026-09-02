import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

const API_URL = "https://xcelacad.onrender.com/api";

const SchoolDashboard = () => {
  const { schoolId } = useParams();
  const navigate = useNavigate();

  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        setError("");

        const token = localStorage.getItem("xcelToken");

        const response = await fetch(
          `${API_URL}/schools/${schoolId}/dashboard`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Failed to load school dashboard."
          );
        }

        setDashboard(data);
      } catch (error) {
        console.error("School dashboard error:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    if (schoolId) {
      fetchDashboard();
    }
  }, [schoolId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">
          Loading school dashboard...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="max-w-md w-full rounded-xl border border-red-200 bg-red-50 p-6 text-center">
          <h2 className="text-lg font-semibold text-red-700">
            Unable to load dashboard
          </h2>

          <p className="mt-2 text-sm text-red-600">
            {error}
          </p>
        </div>
      </div>
    );
  }

  if (!dashboard) {
    return null;
  }

  const { school, stats } = dashboard;

  const cards = [
    {
      title: "Students",
      value: stats.students,
      description: "Active students",
    },
    {
      title: "Teachers",
      value: stats.teachers,
      description: "School staff",
    },
    {
      title: "Classes",
      value: stats.classes,
      description: "Active classes",
    },
    {
      title: "Assignments",
      value: stats.assignments,
      description: "Teacher assignments",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-8">
      <div className="mx-auto max-w-7xl">

        {/* SCHOOL HEADER */}
        <div className="mb-8 rounded-2xl bg-white p-6 shadow-sm border">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

            <div>
              <p className="text-sm text-gray-500">
                School Dashboard
              </p>

              <h1 className="mt-1 text-2xl font-bold text-gray-900">
                {school.name}
              </h1>

              <p className="mt-1 text-sm text-gray-500">
                School Code:{" "}
                <span className="font-semibold text-gray-700">
                  {school.code}
                </span>
              </p>
            </div>

            <div
              className={`inline-flex w-fit rounded-full px-3 py-1 text-sm font-medium ${
                school.isVerified
                  ? "bg-green-100 text-green-700"
                  : "bg-yellow-100 text-yellow-700"
              }`}
            >
              {school.isVerified
                ? "Verified School"
                : "Verification Pending"}
            </div>

          </div>
        </div>

        {/* STAT CARDS */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((card) => (
            <div
              key={card.title}
              className="rounded-2xl bg-white p-6 shadow-sm border"
            >
              <p className="text-sm font-medium text-gray-500">
                {card.title}
              </p>

              <p className="mt-3 text-3xl font-bold text-gray-900">
                {card.value}
              </p>

              <p className="mt-1 text-sm text-gray-500">
                {card.description}
              </p>
            </div>
          ))}
        </div>

        {/* QUICK ACTIONS */}
        <div className="mt-8 rounded-2xl bg-white p-6 shadow-sm border">
          <h2 className="text-lg font-semibold text-gray-900">
            School Management
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Manage your school from one place.
          </p>

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

            <button
  onClick={() => navigate(`/school/${schoolId}/classes`)}
  className="rounded-xl border p-4 text-left hover:bg-gray-50"
>
              <p className="font-semibold text-gray-900">
                Classes
              </p>
              <p className="mt-1 text-sm text-gray-500">
                Create and manage classes
              </p>
            </button>

            <button className="rounded-xl border p-4 text-left hover:bg-gray-50">
              <p className="font-semibold text-gray-900">
                Teachers
              </p>
              <p className="mt-1 text-sm text-gray-500">
                Manage school teachers
              </p>
            </button>

            <button className="rounded-xl border p-4 text-left hover:bg-gray-50">
              <p className="font-semibold text-gray-900">
                Students
              </p>
              <p className="mt-1 text-sm text-gray-500">
                Manage school students
              </p>
            </button>

            <button className="rounded-xl border p-4 text-left hover:bg-gray-50">
              <p className="font-semibold text-gray-900">
                Assignments
              </p>
              <p className="mt-1 text-sm text-gray-500">
                Assign teachers to classes
              </p>
            </button>

          </div>
        </div>

      </div>
    </div>
  );
};

export default SchoolDashboard;