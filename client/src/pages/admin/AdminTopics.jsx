import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";

const API_URL = "http://localhost:5000/api";

const AdminTopics = () => {
  const { token } = useAuth();

  const [topics, setTopics] = useState([]);
  const [subjects, setSubjects] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    subject: "",
    title: "",
    slug: "",
    description: "",
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");

      const [subjectsResponse, topicsResponse] =
        await Promise.all([
          fetch(`${API_URL}/subjects`),
          fetch(`${API_URL}/topics`),
        ]);

      const subjectsData = await subjectsResponse.json();
      const topicsData = await topicsResponse.json();

      if (!subjectsResponse.ok) {
        throw new Error(
          subjectsData.message ||
            "Failed to load subjects."
        );
      }

      if (!topicsResponse.ok) {
        throw new Error(
          topicsData.message ||
            "Failed to load topics."
        );
      }

      setSubjects(subjectsData.subjects || []);
      setTopics(topicsData.topics || []);
    } catch (err) {
      console.error("Fetch topics error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const generateSlug = () => {
    const slug = form.title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");

    setForm((previous) => ({
      ...previous,
      slug,
    }));
  };

  const resetForm = () => {
    setEditingId(null);

    setForm({
      subject: "",
      title: "",
      slug: "",
      description: "",
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!token) {
      setError("You are not authenticated.");
      return;
    }

    if (!form.subject) {
      setError("Please select a subject.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const isEditing = Boolean(editingId);

      const url = isEditing
        ? `${API_URL}/topics/${editingId}`
        : `${API_URL}/topics`;

      const response = await fetch(url, {
        method: isEditing ? "PUT" : "POST",

        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },

        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to save topic."
        );
      }

      setSuccess(
        isEditing
          ? "Topic updated successfully."
          : "Topic created successfully."
      );

      resetForm();
      await fetchData();
    } catch (err) {
      console.error("Save topic error:", err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (topic) => {
    setEditingId(topic._id);

    setForm({
      subject:
        topic.subject?._id ||
        topic.subject ||
        "",
      title: topic.title || "",
      slug: topic.slug || "",
      description: topic.description || "",
    });

    setError("");
    setSuccess("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleDelete = async (id) => {
    if (!token) {
      setError("You are not authenticated.");
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to delete this topic?"
    );

    if (!confirmed) return;

    try {
      setError("");
      setSuccess("");

      const response = await fetch(
        `${API_URL}/topics/${id}`,
        {
          method: "DELETE",

          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to delete topic."
        );
      }

      setSuccess("Topic deleted successfully.");

      await fetchData();
    } catch (err) {
      console.error("Delete topic error:", err);
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="shell py-8">
        <h1 className="text-2xl font-bold text-ink">
          Topics
        </h1>

        <p className="mt-2 text-muted">
          Loading topics...
        </p>
      </div>
    );
  }

  return (
    <div className="shell py-6 lg:py-8">
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-ink">
            Topic Management
          </h1>

          <p className="mt-2 text-muted">
            Create and manage topics for each subject.
          </p>
        </div>

        <div className="badge badge-brand">
          {topics.length} Topics
        </div>
      </div>

      {error && (
        <div className="mb-5 rounded-md bg-danger-soft px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-5 rounded-md bg-success-soft px-4 py-3 text-sm text-success">
          {success}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[380px_minmax(0,1fr)]">
        {/* FORM */}
        <div className="card card-pad h-fit">
          <h2 className="font-bold text-ink">
            {editingId
              ? "Edit Topic"
              : "Create Topic"}
          </h2>

          <p className="mt-1 text-sm text-muted">
            {editingId
              ? "Update the topic information."
              : "Add a new topic to a subject."}
          </p>

          <form
            onSubmit={handleSubmit}
            className="mt-6 space-y-5"
          >
            <div>
              <label className="label">
                Subject
              </label>

              <select
                name="subject"
                value={form.subject}
                onChange={handleChange}
                required
                className="input mt-2 w-full"
              >
                <option value="">
                  Select subject
                </option>

                {subjects.map((subject) => (
                  <option
                    key={subject._id}
                    value={subject._id}
                  >
                    {subject.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">
                Topic Title
              </label>

              <input
                type="text"
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="e.g. Theory of Demand"
                required
                className="input mt-2 w-full"
              />
            </div>

            <div>
              <label className="label">
                Slug
              </label>

              <div className="mt-2 flex gap-2">
                <input
                  type="text"
                  name="slug"
                  value={form.slug}
                  onChange={handleChange}
                  placeholder="theory-of-demand"
                  required
                  className="input w-full"
                />

                <button
                  type="button"
                  onClick={generateSlug}
                  className="btn btn-outline shrink-0"
                >
                  Generate
                </button>
              </div>
            </div>

            <div>
              <label className="label">
                Description
              </label>

              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Short topic description..."
                rows={4}
                className="input mt-2 w-full resize-y"
              />
            </div>

            <div className="flex justify-end gap-2">
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  disabled={saving}
                  className="btn btn-outline"
                >
                  Cancel
                </button>
              )}

              <button
                type="submit"
                disabled={saving}
                className="btn btn-primary"
              >
                {saving
                  ? "Saving..."
                  : editingId
                  ? "Update Topic"
                  : "Create Topic"}
              </button>
            </div>
          </form>
        </div>

        {/* LIST */}
        <div className="card overflow-hidden">
          <div className="border-b border-line px-5 py-4">
            <h2 className="font-bold text-ink">
              All Topics
            </h2>

            <p className="mt-1 text-sm text-muted">
              Topics currently available in the question bank.
            </p>
          </div>

          {topics.length === 0 ? (
            <div className="px-5 py-12 text-center text-muted">
              <p className="font-semibold">
                No topics yet
              </p>

              <p className="mt-1 text-sm">
                Create your first topic using the form.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-line">
                    <th className="px-5 py-3 text-xs font-bold uppercase tracking-wide text-subtle">
                      Topic
                    </th>

                    <th className="px-5 py-3 text-xs font-bold uppercase tracking-wide text-subtle">
                      Subject
                    </th>

                    <th className="px-5 py-3 text-xs font-bold uppercase tracking-wide text-subtle">
                      Status
                    </th>

                    <th className="px-5 py-3 text-xs font-bold uppercase tracking-wide text-subtle">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {topics.map((topic) => (
                    <tr
                      key={topic._id}
                      className="border-b border-line last:border-0"
                    >
                      <td className="px-5 py-4">
                        <p className="font-semibold text-ink">
                          {topic.title}
                        </p>

                        <code className="text-xs text-muted">
                          {topic.slug}
                        </code>
                      </td>

                      <td className="px-5 py-4 text-sm text-muted">
                        {topic.subject?.name ||
                          "—"}
                      </td>

                      <td className="px-5 py-4">
                        <span className="badge">
                          {topic.isActive
                            ? "Active"
                            : "Inactive"}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              handleEdit(topic)
                            }
                            className="btn btn-outline btn-sm"
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleDelete(
                                topic._id
                              )
                            }
                            className="btn btn-sm"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminTopics;