import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

const API_URL = "https://xcelacad.onrender.com/api";

const SchoolTeachers = () => {
  const { schoolId } = useParams();
  const navigate = useNavigate();

  const [teachers, setTeachers] = useState([]);
  const [email, setEmail] = useState("");

  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [removingId, setRemovingId] = useState(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const token = localStorage.getItem("xcelToken");

  // ==========================================
  // FETCH TEACHERS
  // ==========================================
  const fetchTeachers = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_URL}/schools/${schoolId}/teachers`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to load teachers."
        );
      }

      setTeachers(data.teachers || []);
    } catch (err) {
      console.error("Fetch teachers error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, [schoolId]);

  // ==========================================
  // ADD TEACHER
  // ==========================================
  const handleAddTeacher = async (e) => {
    e.preventDefault();

    if (!email.trim()) {
      setError("Please enter the teacher's email.");
      return;
    }

    try {
      setAdding(true);
      setError("");
      setSuccess("");

      const response = await fetch(
        `${API_URL}/schools/${schoolId}/teachers`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email.trim().toLowerCase(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to add teacher."
        );
      }

      setSuccess(
        data.message || "Teacher added successfully."
      );

      setEmail("");

      await fetchTeachers();
    } catch (err) {
      console.error("Add teacher error:", err);
      setError(err.message);
    } finally {
      setAdding(false);
    }
  };

  // ==========================================
  // REMOVE TEACHER
  // ==========================================
  const handleRemoveTeacher = async (teacherId) => {
    const confirmed = window.confirm(
      "Are you sure you want to remove this teacher from the school?"
    );

    if (!confirmed) return;

    try {
      setRemovingId(teacherId);
      setError("");
      setSuccess("");

      const response = await fetch(
        `${API_URL}/schools/${schoolId}/teachers/${teacherId}/deactivate`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to remove teacher."
        );
      }

      setSuccess(
        data.message || "Teacher removed successfully."
      );

      await fetchTeachers();
    } catch (err) {
      console.error("Remove teacher error:", err);
      setError(err.message);
    } finally {
      setRemovingId(null);
    }
  };

  // ==========================================
  // LOADING
  // ==========================================
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">
          Loading teachers...
        </p>
      </div>
    );
  }

  // ==========================================
  // PAGE
  // ==========================================
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">

        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <button
              onClick={() =>
                navigate(`/school/${schoolId}`)
              }
              className="text-sm text-blue-600 hover:underline mb-2"
            >
              ← Back to School Dashboard
            </button>

            <h1 className="text-3xl font-bold text-gray-900">
              School Teachers
            </h1>

            <p className="text-gray-600 mt-1">
              Add teachers and manage the teachers in your school.
            </p>
          </div>
        </div>

        {/* ALERTS */}
        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-green-700">
            {success}
          </div>
        )}

        {/* ADD TEACHER */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Add Teacher
          </h2>

          <p className="text-sm text-gray-600 mb-5">
            Enter the email address associated with the
            teacher's existing Xcel account.
          </p>

          <form
            onSubmit={handleAddTeacher}
            className="flex flex-col md:flex-row gap-3"
          >
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="teacher@example.com"
              className="flex-1 rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />

            <button
              type="submit"
              disabled={adding}
              className="rounded-lg bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {adding ? "Adding..." : "Add Teacher"}
            </button>
          </form>
        </div>

        {/* TEACHER LIST */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Teachers
                </h2>

                <p className="text-sm text-gray-600 mt-1">
                  {teachers.length} active teacher
                  {teachers.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
          </div>

          {teachers.length === 0 ? (
            <div className="p-10 text-center">
              <h3 className="text-lg font-semibold text-gray-900">
                No teachers yet
              </h3>

              <p className="text-gray-600 mt-2">
                Add your first teacher using the form above.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {teachers.map((membership) => {
                const teacher = membership.user;

                return (
                  <div
                    key={membership._id}
                    className="p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
                        {teacher?.name
                          ?.charAt(0)
                          ?.toUpperCase() || "T"}
                      </div>

                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {teacher?.name || "Unknown Teacher"}
                        </h3>

                        <p className="text-sm text-gray-600">
                          {teacher?.email || "No email"}
                        </p>

                        <span className="inline-block mt-1 text-xs font-medium text-green-700 bg-green-100 px-2 py-1 rounded-full">
                          Active Teacher
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() =>
                        handleRemoveTeacher(
                          teacher?._id
                        )
                      }
                      disabled={
                        removingId === teacher?._id
                      }
                      className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                    >
                      {removingId === teacher?._id
                        ? "Removing..."
                        : "Remove Teacher"}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SchoolTeachers;