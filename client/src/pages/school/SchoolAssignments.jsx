import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

const API_URL = "https://xcelacad.onrender.com/api";

const SchoolAssignments = () => {
  const { schoolId } = useParams();
  const navigate = useNavigate();

  const token = localStorage.getItem("xcelToken");

  const [teachers, setTeachers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [assignments, setAssignments] = useState([]);

  const [teacher, setTeacher] = useState("");
  const [subject, setSubject] = useState("");
  const [classId, setClassId] = useState("");
  const [academicSession, setAcademicSession] =
    useState("");

  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [removingId, setRemovingId] = useState(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ==========================================
  // FETCH DATA
  // ==========================================
  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");

      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };

      const [
        teachersResponse,
        classesResponse,
        subjectsResponse,
        assignmentsResponse,
      ] = await Promise.all([
        fetch(`${API_URL}/schools/${schoolId}/teachers`, {
          headers,
        }),

        fetch(`${API_URL}/schools/${schoolId}/classes`, {
          headers,
        }),

        fetch(`${API_URL}/subjects`),

        fetch(
          `${API_URL}/schools/${schoolId}/assignments`,
          {
            headers,
          }
        ),
      ]);

      const teachersData = await teachersResponse.json();
      const classesData = await classesResponse.json();
      const subjectsData = await subjectsResponse.json();
      const assignmentsData =
        await assignmentsResponse.json();

      if (!teachersResponse.ok) {
        throw new Error(
          teachersData.message ||
            "Failed to load teachers."
        );
      }

      if (!classesResponse.ok) {
        throw new Error(
          classesData.message ||
            "Failed to load classes."
        );
      }

      if (!subjectsResponse.ok) {
        throw new Error(
          subjectsData.message ||
            "Failed to load subjects."
        );
      }

      if (!assignmentsResponse.ok) {
        throw new Error(
          assignmentsData.message ||
            "Failed to load assignments."
        );
      }

      setTeachers(teachersData.teachers || []);
      setClasses(classesData.classes || []);
      setSubjects(subjectsData.subjects || []);
      setAssignments(assignmentsData.assignments || []);
    } catch (err) {
      console.error("Fetch assignment data error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [schoolId]);

  // ==========================================
  // CREATE ASSIGNMENT
  // ==========================================
  const handleCreateAssignment = async (e) => {
    e.preventDefault();

    if (
      !teacher ||
      !subject ||
      !classId ||
      !academicSession.trim()
    ) {
      setError(
        "Please select a teacher, subject, class and academic session."
      );
      return;
    }

    try {
      setAssigning(true);
      setError("");
      setSuccess("");

      const response = await fetch(
        `${API_URL}/schools/${schoolId}/assignments`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            teacher,
            subject,
            class: classId,
            academicSession:
              academicSession.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to create assignment."
        );
      }

      setSuccess(
        data.message ||
          "Teacher assignment created successfully."
      );

      // Keep session because it will usually be the
      // same for multiple assignments.
      setTeacher("");
      setSubject("");
      setClassId("");

      await fetchData();
    } catch (err) {
      console.error(
        "Create assignment error:",
        err
      );

      setError(err.message);
    } finally {
      setAssigning(false);
    }
  };

  // ==========================================
  // REMOVE ASSIGNMENT
  // ==========================================
  const handleRemoveAssignment = async (
    assignmentId
  ) => {
    const confirmed = window.confirm(
      "Are you sure you want to remove this teacher assignment?"
    );

    if (!confirmed) return;

    try {
      setRemovingId(assignmentId);
      setError("");
      setSuccess("");

      const response = await fetch(
        `${API_URL}/schools/${schoolId}/assignments/${assignmentId}/deactivate`,
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
            "Failed to remove assignment."
        );
      }

      setSuccess(
        data.message ||
          "Teacher assignment removed successfully."
      );

      await fetchData();
    } catch (err) {
      console.error(
        "Remove assignment error:",
        err
      );

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
          Loading assignments...
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
            Teacher Assignments
          </h1>

          <p className="text-gray-600 mt-1">
            Assign teachers to subjects and classes.
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

        {/* CREATE ASSIGNMENT */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900">
            Assign Teacher
          </h2>

          <p className="text-sm text-gray-600 mt-1 mb-6">
            Choose the teacher, subject and class they
            should manage.
          </p>

          <form onSubmit={handleCreateAssignment}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

              {/* TEACHER */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Teacher
                </label>

                <select
                  value={teacher}
                  onChange={(e) =>
                    setTeacher(e.target.value)
                  }
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 bg-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">
                    Select teacher
                  </option>

                  {teachers.map((membership) => (
                    <option
                      key={membership.user?._id}
                      value={membership.user?._id}
                    >
                      {membership.user?.name} —{" "}
                      {membership.user?.email}
                    </option>
                  ))}
                </select>
              </div>

              {/* SUBJECT */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject
                </label>

                <select
                  value={subject}
                  onChange={(e) =>
                    setSubject(e.target.value)
                  }
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 bg-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">
                    Select subject
                  </option>

                  {subjects.map((item) => (
                    <option
                      key={item._id}
                      value={item._id}
                    >
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* CLASS */}
              <div>
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
                      {item.name} — {item.level}
                      {item.section
                        ? ` ${item.section}`
                        : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* SESSION */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Academic Session
                </label>

                <input
                  type="text"
                  value={academicSession}
                  onChange={(e) =>
                    setAcademicSession(
                      e.target.value
                    )
                  }
                  placeholder="e.g. 2026/2027"
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={
                assigning ||
                teachers.length === 0 ||
                classes.length === 0 ||
                subjects.length === 0
              }
              className="mt-6 rounded-lg bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {assigning
                ? "Assigning..."
                : "Assign Teacher"}
            </button>
          </form>

          {teachers.length === 0 && (
            <p className="mt-4 text-sm text-amber-600">
              Add at least one teacher before creating
              an assignment.
            </p>
          )}

          {classes.length === 0 && (
            <p className="mt-2 text-sm text-amber-600">
              Create at least one school class before
              creating an assignment.
            </p>
          )}

          {subjects.length === 0 && (
            <p className="mt-2 text-sm text-amber-600">
              No active subjects are available.
            </p>
          )}
        </div>

        {/* ASSIGNMENT LIST */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">

          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              Current Assignments
            </h2>

            <p className="text-sm text-gray-600 mt-1">
              {assignments.length} active assignment
              {assignments.length !== 1
                ? "s"
                : ""}
            </p>
          </div>

          {assignments.length === 0 ? (
            <div className="p-10 text-center">
              <h3 className="text-lg font-semibold text-gray-900">
                No assignments yet
              </h3>

              <p className="text-gray-600 mt-2">
                Assign your teachers to subjects and
                classes using the form above.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {assignments.map((assignment) => (
                <div
                  key={assignment._id}
                  className="p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
                >
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {assignment.teacher?.name ||
                        "Unknown Teacher"}
                    </h3>

                    <p className="text-gray-700 mt-1">
                      {assignment.subject?.name ||
                        "Unknown Subject"}{" "}
                      •{" "}
                      {assignment.class?.name ||
                        "Unknown Class"}
                    </p>

                    <p className="text-sm text-gray-500 mt-1">
                      {assignment.class?.level || ""}
                      {assignment.class?.section
                        ? ` ${assignment.class.section}`
                        : ""}{" "}
                      •{" "}
                      {assignment.academicSession}
                    </p>
                  </div>

                  <button
                    onClick={() =>
                      handleRemoveAssignment(
                        assignment._id
                      )
                    }
                    disabled={
                      removingId === assignment._id
                    }
                    className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                  >
                    {removingId === assignment._id
                      ? "Removing..."
                      : "Remove"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SchoolAssignments;