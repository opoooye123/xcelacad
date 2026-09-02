import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

const API_URL = "https://xcelacad.onrender.com/api";

const SchoolClasses = () => {
  const { schoolId } = useParams();

  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    name: "",
    level: "",
    section: "",
    academicSession: "",
  });

  const fetchClasses = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("xcelToken");

      const response = await fetch(
        `${API_URL}/schools/${schoolId}/classes`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to load classes."
        );
      }

      setClasses(data.classes || []);
    } catch (error) {
      console.error("Fetch classes error:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (schoolId) {
      fetchClasses();
    }
  }, [schoolId]);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSubmitting(true);
      setError("");

      const token = localStorage.getItem("xcelToken");

      const response = await fetch(
        `${API_URL}/schools/${schoolId}/classes`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(form),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to create class."
        );
      }

      setClasses((prev) => [...prev, data.class]);

      setForm({
        name: "",
        level: "",
        section: "",
        academicSession: "",
      });

      setShowForm(false);
    } catch (error) {
      console.error("Create class error:", error);
      setError(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const deactivateClass = async (classId) => {
    const confirmed = window.confirm(
      "Are you sure you want to deactivate this class?"
    );

    if (!confirmed) return;

    try {
      const token = localStorage.getItem("xcelToken");

      const response = await fetch(
        `${API_URL}/schools/${schoolId}/classes/${classId}/deactivate`,
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
          data.message || "Failed to deactivate class."
        );
      }

      setClasses((prev) =>
        prev.filter((item) => item._id !== classId)
      );
    } catch (error) {
      console.error("Deactivate class error:", error);
      setError(error.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-8">
      <div className="mx-auto max-w-6xl">

        {/* HEADER */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Classes
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Create and manage your school's classes.
            </p>
          </div>

          <button
            onClick={() => setShowForm((prev) => !prev)}
            className="rounded-xl bg-black px-5 py-3 text-sm font-semibold text-white hover:opacity-90"
          >
            {showForm ? "Cancel" : "+ Create Class"}
          </button>
        </div>

        {/* ERROR */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* CREATE FORM */}
        {showForm && (
          <div className="mb-8 rounded-2xl border bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">
              Create New Class
            </h2>

            <form
              onSubmit={handleSubmit}
              className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2"
            >
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Class Name
                </label>

                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="e.g. SS2A"
                  required
                  className="w-full rounded-xl border px-4 py-3 outline-none focus:ring-2 focus:ring-black"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Level
                </label>

                <input
                  name="level"
                  value={form.level}
                  onChange={handleChange}
                  placeholder="e.g. SS2"
                  required
                  className="w-full rounded-xl border px-4 py-3 outline-none focus:ring-2 focus:ring-black"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Section
                </label>

                <input
                  name="section"
                  value={form.section}
                  onChange={handleChange}
                  placeholder="e.g. A"
                  className="w-full rounded-xl border px-4 py-3 outline-none focus:ring-2 focus:ring-black"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Academic Session
                </label>

                <input
                  name="academicSession"
                  value={form.academicSession}
                  onChange={handleChange}
                  placeholder="e.g. 2026/2027"
                  required
                  className="w-full rounded-xl border px-4 py-3 outline-none focus:ring-2 focus:ring-black"
                />
              </div>

              <div className="md:col-span-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-black px-6 py-3 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {submitting
                    ? "Creating..."
                    : "Create Class"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* CLASS LIST */}
        {loading ? (
          <div className="rounded-2xl border bg-white p-10 text-center">
            <p className="text-gray-500">
              Loading classes...
            </p>
          </div>
        ) : classes.length === 0 ? (
          <div className="rounded-2xl border bg-white p-10 text-center">
            <h2 className="text-lg font-semibold text-gray-900">
              No classes yet
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Create your first school class to get started.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {classes.map((schoolClass) => (
              <div
                key={schoolClass._id}
                className="rounded-2xl border bg-white p-6 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      {schoolClass.name}
                    </h2>

                    <p className="mt-1 text-sm text-gray-500">
                      {schoolClass.level}
                      {schoolClass.section
                        ? ` • Section ${schoolClass.section}`
                        : ""}
                    </p>
                  </div>

                  <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                    Active
                  </span>
                </div>

                <div className="mt-5 border-t pt-4">
                  <p className="text-xs text-gray-500">
                    Academic Session
                  </p>

                  <p className="mt-1 font-medium text-gray-800">
                    {schoolClass.academicSession}
                  </p>
                </div>

                <button
                  onClick={() =>
                    deactivateClass(schoolClass._id)
                  }
                  className="mt-5 text-sm font-medium text-red-600 hover:underline"
                >
                  Deactivate class
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SchoolClasses;