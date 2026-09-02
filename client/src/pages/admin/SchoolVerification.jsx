import { useEffect, useState } from "react";

const API_URL = "https://xcelacad.onrender.com/api";

const SchoolVerification = () => {
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [verifyingId, setVerifyingId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchPendingSchools = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("xcelToken");

      if (!token) {
        throw new Error("You must be logged in as an admin.");
      }

      const response = await fetch(
        `${API_URL}/admin/schools/pending`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to load pending schools."
        );
      }

      setSchools(data.schools || []);
    } catch (error) {
      console.error("Pending schools error:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingSchools();
  }, []);

  const handleVerify = async (schoolId) => {
    try {
      setVerifyingId(schoolId);
      setError("");
      setSuccess("");

      const token = localStorage.getItem("xcelToken");

      if (!token) {
        throw new Error("You must be logged in as an admin.");
      }

      const response = await fetch(
        `${API_URL}/admin/schools/${schoolId}/verify`,
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
          data.message || "Failed to verify school."
        );
      }

      setSuccess(
        `${data.school?.name || "School"} has been verified successfully.`
      );

      // Remove the verified school from the pending list.
      setSchools((prev) =>
        prev.filter((school) => school._id !== schoolId)
      );
    } catch (error) {
      console.error("Verify school error:", error);
      setError(error.message);
    } finally {
      setVerifyingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-black" />

          <p className="text-sm text-gray-500">
            Loading pending schools...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="mx-auto max-w-6xl">

        {/* HEADER */}
        <div className="mb-8">
          <p className="text-sm font-medium text-gray-500">
            Xcel Administration
          </p>

          <h1 className="mt-2 text-3xl font-bold text-gray-900">
            School Verification
          </h1>

          <p className="mt-2 max-w-2xl text-gray-600">
            Review schools that have registered on Xcel and
            approve them before they can access school management
            features.
          </p>
        </div>

        {/* ERROR */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4">
            <p className="text-sm font-medium text-red-700">
              {error}
            </p>
          </div>
        )}

        {/* SUCCESS */}
        {success && (
          <div className="mb-6 rounded-xl border border-green-200 bg-green-50 p-4">
            <p className="text-sm font-medium text-green-700">
              {success}
            </p>
          </div>
        )}

        {/* SUMMARY */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-gray-500">
              Pending Schools
            </p>

            <p className="mt-2 text-3xl font-bold text-gray-900">
              {schools.length}
            </p>
          </div>

          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-gray-500">
              Verification Status
            </p>

            <p className="mt-2 text-lg font-semibold text-yellow-600">
              Awaiting Review
            </p>
          </div>

          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-gray-500">
              Admin Action
            </p>

            <p className="mt-2 text-lg font-semibold text-gray-900">
              Review & Verify
            </p>
          </div>
        </div>

        {/* EMPTY STATE */}
        {schools.length === 0 ? (
          <div className="rounded-2xl border bg-white p-10 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl">
              ✓
            </div>

            <h2 className="mt-5 text-xl font-semibold text-gray-900">
              No pending schools
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
              There are currently no schools waiting for
              verification.
            </p>

            <button
              onClick={fetchPendingSchools}
              className="mt-6 rounded-xl bg-black px-5 py-3 text-sm font-semibold text-white hover:opacity-90"
            >
              Refresh
            </button>
          </div>
        ) : (
          /* SCHOOL LIST */
          <div className="space-y-5">
            {schools.map((school) => (
              <div
                key={school._id}
                className="rounded-2xl border bg-white p-6 shadow-sm"
              >
                <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">

                  {/* SCHOOL DETAILS */}
                  <div className="flex gap-4">

                    <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gray-100">
                      {school.logo ? (
                        <img
                          src={school.logo}
                          alt={school.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-2xl">
                          🏫
                        </span>
                      )}
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <h2 className="text-xl font-bold text-gray-900">
                          {school.name}
                        </h2>

                        <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-700">
                          Pending
                        </span>
                      </div>

                      <p className="mt-2 text-sm text-gray-500">
                        School Code:{" "}
                        <span className="font-semibold text-gray-700">
                          {school.code}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* VERIFY BUTTON */}
                  <button
                    onClick={() => handleVerify(school._id)}
                    disabled={verifyingId === school._id}
                    className="w-full rounded-xl bg-green-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50 lg:w-auto"
                  >
                    {verifyingId === school._id
                      ? "Verifying..."
                      : "✓ Verify School"}
                  </button>
                </div>

                {/* INFORMATION */}
                <div className="mt-6 grid grid-cols-1 gap-4 border-t pt-6 sm:grid-cols-2 lg:grid-cols-4">

                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                      Registered By
                    </p>

                    <p className="mt-1 font-medium text-gray-900">
                      {school.createdBy?.name || "Unknown"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                      Email
                    </p>

                    <p className="mt-1 break-all text-sm text-gray-700">
                      {school.createdBy?.email || "No email"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                      School Email
                    </p>

                    <p className="mt-1 text-sm text-gray-700">
                      {school.email || "Not provided"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                      Registered
                    </p>

                    <p className="mt-1 text-sm text-gray-700">
                      {school.createdAt
                        ? new Date(
                            school.createdAt
                          ).toLocaleDateString()
                        : "Unknown"}
                    </p>
                  </div>
                </div>

                {/* CONTACT INFORMATION */}
                {(school.phone || school.address) && (
                  <div className="mt-5 rounded-xl bg-gray-50 p-4">
                    <p className="text-sm font-semibold text-gray-800">
                      School Information
                    </p>

                    <div className="mt-2 space-y-1 text-sm text-gray-600">
                      {school.phone && (
                        <p>
                          <span className="font-medium">
                            Phone:
                          </span>{" "}
                          {school.phone}
                        </p>
                      )}

                      {school.address && (
                        <p>
                          <span className="font-medium">
                            Address:
                          </span>{" "}
                          {school.address}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SchoolVerification;