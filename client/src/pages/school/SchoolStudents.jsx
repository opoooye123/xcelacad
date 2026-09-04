import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

const API_URL = "https://xcelacad.onrender.com/api";

const SchoolStudents = () => {
  const { schoolId } = useParams();
  const navigate = useNavigate();

  const token = localStorage.getItem("xcelToken");

  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);

  const [email, setEmail] = useState("");
  const [classId, setClassId] = useState("");

  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const [removingId, setRemovingId] = useState(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ==========================================
  // FETCH STUDENTS + CLASSES
  // ==========================================
  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");

      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };

      const [studentsResponse, classesResponse] =
        await Promise.all([
          fetch(
            `${API_URL}/schools/${schoolId}/students`,
            { headers }
          ),
          fetch(
            `${API_URL}/schools/${schoolId}/classes`,
            { headers }
          ),
        ]);

      const studentsData =
        await studentsResponse.json();

      const classesData =
        await classesResponse.json();

      if (!studentsResponse.ok) {
        throw new Error(
          studentsData.message ||
            "Failed to load students."
        );
      }

      if (!classesResponse.ok) {
        throw new Error(
          classesData.message ||
            "Failed to load classes."
        );
      }

      setStudents(studentsData.students || []);
      setClasses(classesData.classes || []);
    } catch (err) {
      console.error("Fetch students error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [schoolId]);

  // ==========================================
  // ADD STUDENT
  // ==========================================
  const handleAddStudent = async (e) => {
    e.preventDefault();

    if (!email.trim() || !classId) {
      setError(
        "Please enter the student's email and select a class."
      );
      return;
    }

    try {
      setAdding(true);
      setError("");
      setSuccess("");

      const response = await fetch(
        `${API_URL}/schools/${schoolId}/students`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email.trim().toLowerCase(),
            class: classId,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to add student."
        );
      }

      setSuccess(
        data.message ||
          "Student added successfully."
      );

      setEmail("");
      setClassId("");

      await fetchData();
    } catch (err) {
      console.error("Add student error:", err);
      setError(err.message);
    } finally {
      setAdding(false);
    }
  };

  // ==========================================
  // CHANGE STUDENT CLASS
  // ==========================================
  const handleChangeClass = async (
    studentId,
    newClassId
  ) => {
    if (!newClassId) return;

    try {
      setUpdatingId(studentId);
      setError("");
      setSuccess("");

      const response = await fetch(
        `${API_URL}/schools/${schoolId}/students/${studentId}/class`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            class: newClassId,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to change student class."
        );
      }

      setSuccess(
        data.message ||
          "Student class updated successfully."
      );

      await fetchData();
    } catch (err) {
      console.error(
        "Change student class error:",
        err
      );
      setError(err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  // ==========================================
  // REMOVE STUDENT
  // ==========================================
  const handleRemoveStudent = async (
    studentId
  ) => {
    const confirmed = window.confirm(
      "Are you sure you want to remove this student from the school?"
    );

    if (!confirmed) return;

    try {
      setRemovingId(studentId);
      setError("");
      setSuccess("");

      const response = await fetch(
        `${API_URL}/schools/${schoolId}/students/${studentId}/deactivate`,
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
          data.message ||
            "Failed to remove student."
        );
      }

      setSuccess(
        data.message ||
          "Student removed successfully."
      );

      await fetchData();
    } catch (err) {
      console.error(
        "Remove student error:",
        err
      );
      setError(err.message);
    } finally {
      setRemovingId(null);
    }
  };

  // ==========================================
  // CLASS LABEL
  // ==========================================
  const getClassLabel = (schoolClass) => {
    if (!schoolClass) {
      return "No class assigned";
    }

    return `${schoolClass.name} — ${schoolClass.level}${
      schoolClass.section
        ? ` ${schoolClass.section}`
        : ""
    }`;
  };

  // ==========================================
  // LOADING
  // ==========================================
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">
          Loading students...
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
        <div className="mb-8">
          <button
            onClick={() =>
              navigate(`/school/${schoolId}`)
            }
            className="text-sm text-blue-600 hover:underline mb-2"
          >
            ← Back to School Dashboard
          </button>

          <h1 className="text-3xl font-bold text-gray-900">
            School Students
          </h1>

          <p className="text-gray-600 mt-1">
            Add students, manage their classes and
            remove students from the school.
          </p>
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

        {/* ADD STUDENT */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900">
            Add Student
          </h2>

          <p className="text-sm text-gray-600 mt-1 mb-6">
            Enter the student's existing Xcel account
            email and assign them to a class.
          </p>

          <form
            onSubmit={handleAddStudent}
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            {/* EMAIL */}
            <div className="md:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Student Email
              </label>

              <input
                type="email"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
                placeholder="student@example.com"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* CLASS */}
            <div className="md:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Class
              </label>

              <select
                value={classId}
                onChange={(e) =>
                  setClassId(e.target.value)
                }
                className="w-full rounded-lg border border-gray-300 px-4 py-3 bg-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="">
                  Select class
                </option>

                {classes.map((item) => (
                  <option
                    key={item._id}
                    value={item._id}
                  >
                    {getClassLabel(item)}
                  </option>
                ))}
              </select>
            </div>

            {/* BUTTON */}
            <div className="md:col-span-1 flex items-end">
              <button
                type="submit"
                disabled={
                  adding || classes.length === 0
                }
                className="w-full rounded-lg bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {adding
                  ? "Adding..."
                  : "Add Student"}
              </button>
            </div>
          </form>

          {classes.length === 0 && (
            <p className="mt-4 text-sm text-amber-600">
              Create a school class before adding
              students.
            </p>
          )}
        </div>

        {/* STUDENTS */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">

          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              Students
            </h2>

            <p className="text-sm text-gray-600 mt-1">
              {students.length} active student
              {students.length !== 1 ? "s" : ""}
            </p>
          </div>

          {students.length === 0 ? (
            <div className="p-10 text-center">
              <h3 className="text-lg font-semibold text-gray-900">
                No students yet
              </h3>

              <p className="text-gray-600 mt-2">
                Add your first student using the
                form above.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {students.map((membership) => {
                const student = membership.user;

                return (
                  <div
                    key={membership._id}
                    className="p-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5"
                  >
                    {/* STUDENT INFO */}
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
                        {student?.name
                          ?.charAt(0)
                          ?.toUpperCase() || "S"}
                      </div>

                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {student?.name ||
                            "Unknown Student"}
                        </h3>

                        <p className="text-sm text-gray-600">
                          {student?.email ||
                            "No email"}
                        </p>

                        <span className="inline-block mt-1 text-xs font-medium text-green-700 bg-green-100 px-2 py-1 rounded-full">
                          Active Student
                        </span>
                      </div>
                    </div>

                    {/* ACTIONS */}
                    <div className="flex flex-col sm:flex-row gap-3 sm:items-center">

                      {/* CLASS */}
                      <select
                        value={
                          membership.class?._id || ""
                        }
                        onChange={(e) =>
                          handleChangeClass(
                            student?._id,
                            e.target.value
                          )
                        }
                        disabled={
                          updatingId ===
                          student?._id
                        }
                        className="rounded-lg border border-gray-300 px-4 py-2 bg-white text-sm outline-none focus:border-blue-500"
                      >
                        <option value="">
                          No class
                        </option>

                        {classes.map((item) => (
                          <option
                            key={item._id}
                            value={item._id}
                          >
                            {getClassLabel(item)}
                          </option>
                        ))}
                      </select>

                      {/* REMOVE */}
                      <button
                        onClick={() =>
                          handleRemoveStudent(
                            student?._id
                          )
                        }
                        disabled={
                          removingId ===
                          student?._id
                        }
                        className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                      >
                        {removingId ===
                        student?._id
                          ? "Removing..."
                          : "Remove"}
                      </button>
                    </div>
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

export default SchoolStudents;