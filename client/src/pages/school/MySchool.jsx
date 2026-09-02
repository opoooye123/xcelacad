import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = "https://xcelacad.onrender.com/api";

const MySchool = () => {
  const navigate = useNavigate();

  const [memberships, setMemberships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchMySchools = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("xcelToken");

      if (!token) {
        throw new Error("You must be logged in to view your schools.");
      }

      const response = await fetch(`${API_URL}/schools/my`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to load your schools."
        );
      }

      setMemberships(data.memberships || []);
    } catch (error) {
      console.error("My schools error:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMySchools();
  }, []);

  const getSchoolStatus = (membership) => {
    const school = membership.school;

    if (!school) {
      return {
        label: "School unavailable",
        description: "This school could not be found.",
        className: "bg-gray-100 text-gray-700",
      };
    }

    if (!school.isActive) {
      return {
        label: "School inactive",
        description: "This school is currently inactive.",
        className: "bg-red-100 text-red-700",
      };
    }

    if (!school.isVerified) {
      return {
        label: "Awaiting verification",
        description:
          "Xcel is reviewing this school. You will be able to access the school dashboard after verification.",
        className: "bg-yellow-100 text-yellow-700",
      };
    }

    if (!membership.isActive) {
      return {
        label: "Membership inactive",
        description:
          "Your membership is currently inactive. Contact your school administrator.",
        className: "bg-gray-100 text-gray-700",
      };
    }

    return {
      label: "Verified",
      description: "You have access to this school.",
      className: "bg-green-100 text-green-700",
    };
  };

  const canOpenSchool = (membership) => {
    const school = membership.school;

    return (
      school &&
      school.isActive &&
      school.isVerified &&
      membership.isActive
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-black" />
          <p className="text-sm text-gray-500">
            Loading your schools...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 px-6 py-10">
        <div className="mx-auto max-w-3xl">
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
            <h2 className="text-lg font-semibold text-red-700">
              Unable to load your schools
            </h2>

            <p className="mt-2 text-sm text-red-600">
              {error}
            </p>

            <button
              onClick={fetchMySchools}
              className="mt-5 rounded-xl bg-black px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="mx-auto max-w-5xl">

        {/* HEADER */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">
              Xcel for Schools
            </p>

            <h1 className="mt-2 text-3xl font-bold text-gray-900">
              My Schools
            </h1>

            <p className="mt-2 max-w-2xl text-gray-600">
              View the schools you belong to and access your school
              dashboard when your membership is active.
            </p>
          </div>

          <button
            onClick={() => navigate("/school/create")}
            className="w-full rounded-xl bg-black px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 sm:w-auto"
          >
            + Create School
          </button>
        </div>

        {/* EMPTY STATE */}
        {memberships.length === 0 ? (
          <div className="rounded-2xl border bg-white p-10 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-2xl">
              🏫
            </div>

            <h2 className="mt-5 text-xl font-semibold text-gray-900">
              You don't belong to any school yet
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
              Create your school to start using Xcel for Schools,
              or join a school when your school administrator invites
              you.
            </p>

            <button
              onClick={() => navigate("/school/create")}
              className="mt-6 rounded-xl bg-black px-5 py-3 text-sm font-semibold text-white hover:opacity-90"
            >
              Create Your School
            </button>
          </div>
        ) : (
          /* SCHOOL LIST */
          <div className="space-y-5">
            {memberships.map((membership) => {
              const school = membership.school;
              const status = getSchoolStatus(membership);
              const canOpen = canOpenSchool(membership);

              return (
                <div
                  key={membership._id}
                  className="rounded-2xl border bg-white p-6 shadow-sm transition hover:shadow-md"
                >
                  <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">

                    {/* SCHOOL INFO */}
                    <div className="flex gap-4">

                      <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gray-100">
                        {school?.logo ? (
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
                        <h2 className="text-xl font-bold text-gray-900">
                          {school?.name || "Unknown School"}
                        </h2>

                        <p className="mt-1 text-sm text-gray-500">
                          School Code:{" "}
                          <span className="font-semibold text-gray-700">
                            {school?.code || "N/A"}
                          </span>
                        </p>

                        <div className="mt-3 flex flex-wrap gap-2">
                          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium capitalize text-gray-700">
                            {membership.role?.replace("_", " ") ||
                              "Member"}
                          </span>

                          {membership.class && (
                            <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
                              {membership.class.name}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* STATUS */}
                    <div className="sm:text-right">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${status.className}`}
                      >
                        {status.label}
                      </span>
                    </div>
                  </div>

                  {/* DESCRIPTION */}
                  <div className="mt-6 rounded-xl bg-gray-50 p-4">
                    <p className="text-sm text-gray-600">
                      {status.description}
                    </p>
                  </div>

                  {/* ACTIONS */}
                  <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end">
                    {canOpen ? (
                      <button
                        onClick={() =>
                          navigate(`/school/${school._id}`)
                        }
                        className="rounded-xl bg-black px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
                      >
                        Open School
                      </button>
                    ) : (
                      <button
                        disabled
                        className="cursor-not-allowed rounded-xl bg-gray-100 px-5 py-3 text-sm font-semibold text-gray-400"
                      >
                        {school?.isVerified
                          ? "Access Unavailable"
                          : "Awaiting Verification"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* INFORMATION */}
        <div className="mt-8 rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">
            How school access works
          </h2>

          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <div>
              <div className="text-2xl">🏫</div>
              <h3 className="mt-2 font-semibold text-gray-900">
                Create or join
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Create your school or become a member of an existing
                school.
              </p>
            </div>

            <div>
              <div className="text-2xl">🔍</div>
              <h3 className="mt-2 font-semibold text-gray-900">
                Verification
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                New schools are reviewed and verified by Xcel.
              </p>
            </div>

            <div>
              <div className="text-2xl">📊</div>
              <h3 className="mt-2 font-semibold text-gray-900">
                Manage & learn
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Once approved, access your school's academic
                management tools.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default MySchool;