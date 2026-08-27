import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";

const API_URL = "https://xcelacad.onrender.com/api";

const AdminMaterials = () => {
  const { token } = useAuth();

  const [materials, setMaterials] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    content: "",
    subject: "",
    topic: "",
    isPublished: false,
  });

  // ==========================================
  // FETCH MATERIALS
  // ==========================================

  const fetchMaterials = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_URL}/materials`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to load materials."
        );
      }

      setMaterials(data.materials || []);
    } catch (error) {
      console.error(
        "Fetch materials error:",
        error
      );

      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMaterials();
  }, []);

  // ==========================================
  // FORM CHANGE
  // ==========================================

  const handleChange = (event) => {
    const { name, value, type, checked } =
      event.target;

    setForm((previous) => ({
      ...previous,
      [name]:
        type === "checkbox"
          ? checked
          : value,
    }));
  };

  // ==========================================
  // CREATE / UPDATE
  // ==========================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!token) {
      setError(
        "You are not authenticated."
      );
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const isEditing =
        Boolean(editingId);

      const url = isEditing
        ? `${API_URL}/materials/${editingId}`
        : `${API_URL}/materials`;

      const method = isEditing
        ? "PUT"
        : "POST";

      const response = await fetch(url, {
        method,

        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },

        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to save material."
        );
      }

      setSuccess(
        isEditing
          ? "Study material updated successfully."
          : "Study material created successfully."
      );

      resetForm();

      await fetchMaterials();
    } catch (error) {
      console.error(
        "Save material error:",
        error
      );

      setError(error.message);
    } finally {
      setSaving(false);
    }
  };

  // ==========================================
  // EDIT
  // ==========================================

  const handleEdit = (material) => {
    setEditingId(material._id);

    setForm({
      title: material.title || "",
      description:
        material.description || "",
      content: material.content || "",
      subject:
        material.subject?._id ||
        material.subject ||
        "",
      topic:
        material.topic?._id ||
        material.topic ||
        "",
      isPublished:
        Boolean(material.isPublished),
    });

    setError("");
    setSuccess("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // ==========================================
  // DELETE
  // ==========================================

  const handleDelete = async (id) => {
    if (!token) {
      setError(
        "You are not authenticated."
      );
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to delete this study material?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");
      setSuccess("");

      const response = await fetch(
        `${API_URL}/materials/${id}`,
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
          data.message ||
            "Failed to delete material."
        );
      }

      setSuccess(
        "Study material deleted successfully."
      );

      await fetchMaterials();
    } catch (error) {
      console.error(
        "Delete material error:",
        error
      );

      setError(error.message);
    }
  };

  // ==========================================
  // RESET
  // ==========================================

  const resetForm = () => {
    setEditingId(null);

    setForm({
      title: "",
      description: "",
      content: "",
      subject: "",
      topic: "",
      isPublished: false,
    });
  };

  // ==========================================
  // TOGGLE PUBLISHED
  // ==========================================

  const handleTogglePublished = async (
    material
  ) => {
    if (!token) {
      setError(
        "You are not authenticated."
      );
      return;
    }

    try {
      setError("");
      setSuccess("");

      const response = await fetch(
        `${API_URL}/materials/${material._id}`,
        {
          method: "PUT",

          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            ...material,
            subject:
              material.subject?._id ||
              material.subject ||
              "",
            topic:
              material.topic?._id ||
              material.topic ||
              "",
            isPublished:
              !material.isPublished,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to update publication status."
        );
      }

      setSuccess(
        material.isPublished
          ? "Material unpublished."
          : "Material published."
      );

      await fetchMaterials();
    } catch (error) {
      console.error(
        "Toggle published error:",
        error
      );

      setError(error.message);
    }
  };

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <div className="shell py-8">
        <div className="card card-pad">
          <p className="text-sm text-muted">
            Loading study materials...
          </p>
        </div>
      </div>
    );
  }

  // ==========================================
  // UI
  // ==========================================

  return (
    <div className="shell py-6 lg:py-8">
      {/* HEADER */}

      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-ink sm:text-3xl">
            Study Materials
          </h1>

          <p className="mt-2 text-sm text-muted sm:text-base">
            Create and manage study notes for
            Xcel Academy students.
          </p>
        </div>

        <div className="badge badge-brand">
          {materials.length} Materials
        </div>
      </div>

      {/* ALERTS */}

      {error && (
        <div className="mb-6 rounded-md bg-danger-soft px-4 py-3 text-sm font-medium text-danger">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-6 rounded-md bg-success-soft px-4 py-3 text-sm font-medium text-success">
          {success}
        </div>
      )}

      {/* ========================================
          FORM
      ========================================= */}

      <div className="card card-pad mb-6">
        <div className="mb-6">
          <h2 className="text-lg font-bold text-ink">
            {editingId
              ? "Edit Study Material"
              : "Create Study Material"}
          </h2>

          <p className="mt-1 text-sm text-muted">
            {editingId
              ? "Update the information below."
              : "Add a new study note to the platform."}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* TITLE */}

          <div className="mb-5">
            <label
              htmlFor="title"
              className="label"
            >
              Title
            </label>

            <input
              id="title"
              name="title"
              type="text"
              value={form.title}
              onChange={handleChange}
              placeholder="e.g. Theory of Demand"
              className="input mt-2 w-full"
              required
              disabled={saving}
            />
          </div>

          {/* DESCRIPTION */}

          <div className="mb-5">
            <label
              htmlFor="description"
              className="label"
            >
              Description
            </label>

            <textarea
              id="description"
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Write a short description..."
              rows={3}
              className="input mt-2 w-full resize-y"
              disabled={saving}
            />
          </div>

          {/* SUBJECT + TOPIC */}

          <div className="mb-5 grid gap-5 sm:grid-cols-2">
            <div>
              <label
                htmlFor="subject"
                className="label"
              >
                Subject
              </label>

              <input
                id="subject"
                name="subject"
                type="text"
                value={form.subject}
                onChange={handleChange}
                placeholder="Subject ID"
                className="input mt-2 w-full"
                disabled={saving}
              />
            </div>

            <div>
              <label
                htmlFor="topic"
                className="label"
              >
                Topic
              </label>

              <input
                id="topic"
                name="topic"
                type="text"
                value={form.topic}
                onChange={handleChange}
                placeholder="Topic ID"
                className="input mt-2 w-full"
                disabled={saving}
              />
            </div>
          </div>

          {/* CONTENT */}

          <div className="mb-5">
            <label
              htmlFor="content"
              className="label"
            >
              Study Note Content
            </label>

            <textarea
              id="content"
              name="content"
              value={form.content}
              onChange={handleChange}
              placeholder="Write the study material here..."
              rows={14}
              className="input mt-2 min-h-[300px] w-full resize-y font-mono text-sm"
              required
              disabled={saving}
            />
          </div>

          {/* PUBLISHED */}

          <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-line bg-surface-2 p-4">
            <input
              type="checkbox"
              name="isPublished"
              checked={form.isPublished}
              onChange={handleChange}
              disabled={saving}
              className="mt-1 size-4"
            />

            <span>
              <span className="block font-semibold text-ink">
                Publish this material
              </span>

              <span className="mt-1 block text-sm text-muted">
                Published materials can be made
                available to students.
              </span>
            </span>
          </label>

          {/* BUTTONS */}

          <div className="mt-6 flex flex-col justify-end gap-3 sm:flex-row">
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
                ? "Update Material"
                : "Create Material"}
            </button>
          </div>
        </form>
      </div>

      {/* ========================================
          MATERIAL LIST
      ========================================= */}

      <div className="card">
        <div className="border-b border-line p-5 sm:p-6">
          <h2 className="text-lg font-bold text-ink">
            All Study Materials
          </h2>

          <p className="mt-1 text-sm text-muted">
            Manage your existing study notes.
          </p>
        </div>

        {materials.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <h3 className="font-semibold text-ink">
              No study materials yet
            </h3>

            <p className="mt-2 text-sm text-muted">
              Create your first study material
              using the form above.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="border-b border-line bg-surface-2">
                  <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wide text-muted">
                    Title
                  </th>

                  <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wide text-muted">
                    Subject
                  </th>

                  <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wide text-muted">
                    Topic
                  </th>

                  <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wide text-muted">
                    Status
                  </th>

                  <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wide text-muted">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {materials.map((material) => (
                  <tr
                    key={material._id}
                    className="border-b border-line last:border-0"
                  >
                    {/* TITLE */}

                    <td className="px-5 py-4">
                      <div>
                        <p className="font-semibold text-ink">
                          {material.title}
                        </p>

                        {material.description && (
                          <p className="mt-1 max-w-xs truncate text-sm text-muted">
                            {material.description}
                          </p>
                        )}
                      </div>
                    </td>

                    {/* SUBJECT */}

                    <td className="px-5 py-4 text-sm text-muted">
                      {material.subject?.name ||
                        material.subject ||
                        "—"}
                    </td>

                    {/* TOPIC */}

                    <td className="px-5 py-4 text-sm text-muted">
                      {material.topic?.title ||
                        material.topic?.name ||
                        material.topic ||
                        "—"}
                    </td>

                    {/* STATUS */}

                    <td className="px-5 py-4">
                      <button
                        type="button"
                        onClick={() =>
                          handleTogglePublished(
                            material
                          )
                        }
                        disabled={saving}
                        className={`badge ${
                          material.isPublished
                            ? "badge-success"
                            : "badge-muted"
                        }`}
                      >
                        {material.isPublished
                          ? "Published"
                          : "Draft"}
                      </button>
                    </td>

                    {/* ACTIONS */}

                    <td className="px-5 py-4">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            handleEdit(material)
                          }
                          className="btn btn-outline btn-sm"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleDelete(
                              material._id
                            )
                          }
                          className="btn btn-sm bg-danger-soft text-danger hover:opacity-80"
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
  );
};

export default AdminMaterials;