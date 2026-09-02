import { useState } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = "https://xcelacad.onrender.com/api";

const CreateSchool = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    code: "",
    email: "",
    phone: "",
    address: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: name === "code" ? value.toUpperCase() : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const token = localStorage.getItem("xcelToken");

      if (!token) {
        throw new Error("You must be logged in to create a school.");
      }

      const response = await fetch(`${API_URL}/schools`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to create school."
        );
      }

      setSuccess(
        "School registration submitted successfully. Your school is awaiting verification."
      );

      // The school has now been created, so we can use its ID.
     setTimeout(() => {
  navigate("/school/my");
}, 1500);
    } catch (error) {
      console.error("Create school error:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="mx-auto max-w-2xl">

        {/* HEADER */}
        <div className="mb-8">
          <p className="text-sm font-medium text-gray-500">
            Xcel for Schools
          </p>

          <h1 className="mt-2 text-3xl font-bold text-gray-900">
            Create Your School
          </h1>

          <p className="mt-2 text-gray-600">
            Register your school to start managing students,
            teachers, classes and academic performance.
          </p>
        </div>

        {/* FORM CARD */}
        <div className="rounded-2xl border bg-white p-6 shadow-sm sm:p-8">

          {error && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-6 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">

            {/* SCHOOL NAME */}
            <div>
              <label
                htmlFor="name"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                School Name
              </label>

              <input
                id="name"
                name="name"
                type="text"
                value={form.name}
                onChange={handleChange}
                placeholder="e.g. Test Secondary School"
                required
                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-black focus:ring-2 focus:ring-black/10"
              />
            </div>

            {/* SCHOOL CODE */}
            <div>
              <label
                htmlFor="code"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                School Code
              </label>

              <input
                id="code"
                name="code"
                type="text"
                value={form.code}
                onChange={handleChange}
                placeholder="e.g. TEST001"
                required
                maxLength={20}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 uppercase outline-none transition focus:border-black focus:ring-2 focus:ring-black/10"
              />

              <p className="mt-2 text-xs text-gray-500">
                Students and teachers will eventually use this
                code to identify your school.
              </p>
            </div>

            {/* EMAIL */}
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                School Email
              </label>

              <input
                id="email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="school@example.com"
                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-black focus:ring-2 focus:ring-black/10"
              />
            </div>

            {/* PHONE */}
            <div>
              <label
                htmlFor="phone"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                School Phone
              </label>

              <input
                id="phone"
                name="phone"
                type="tel"
                value={form.phone}
                onChange={handleChange}
                placeholder="08000000000"
                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-black focus:ring-2 focus:ring-black/10"
              />
            </div>

            {/* ADDRESS */}
            <div>
              <label
                htmlFor="address"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                School Address
              </label>

              <textarea
                id="address"
                name="address"
                value={form.address}
                onChange={handleChange}
                placeholder="Enter the school's address"
                rows={4}
                className="w-full resize-none rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-black focus:ring-2 focus:ring-black/10"
              />
            </div>

            {/* SUBMIT */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-black px-5 py-3.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Submitting..." : "Create School"}
            </button>

          </form>
        </div>

        {/* VERIFICATION NOTE */}
        <div className="mt-5 rounded-xl bg-gray-100 p-4">
          <p className="text-sm text-gray-600">
            <span className="font-semibold text-gray-800">
              Note:
            </span>{" "}
            New schools are reviewed and verified by Xcel before
            school management features become available.
          </p>
        </div>

      </div>
    </div>
  );
};

export default CreateSchool;
