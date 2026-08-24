import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ExamList = () => {
  const navigate = useNavigate();

  const { token } = useAuth();

  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setError("You are not authenticated.");
      return;
    }

    fetchExams();
  }, [token]);

  const fetchExams = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "http://localhost:5000/api/exams",
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
          data.message || "Failed to load exams"
        );
      }

      setExams(data.exams || []);
    } catch (error) {
      console.error(
        "Fetch exams error:",
        error
      );

      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <div>
        <p>Loading available exams...</p>
      </div>
    );
  }

  // ==========================================
  // ERROR
  // ==========================================

  if (error) {
    return (
      <div>
        <p>{error}</p>

        <button onClick={fetchExams}>
          Try Again
        </button>
      </div>
    );
  }

  // ==========================================
  // NO EXAMS
  // ==========================================

  if (exams.length === 0) {
    return (
      <div>
        <h3>No exams available</h3>

        <p>
          There are currently no published exams.
        </p>
      </div>
    );
  }

  // ==========================================
  // EXAM LIST
  // ==========================================

  return (
    <div>
      <h2>Available Exams</h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "20px",
          marginTop: "20px",
        }}
      >
        {exams.map((exam) => (
          <div
            key={exam._id}
            style={{
              border: "1px solid #ddd",
              borderRadius: "10px",
              padding: "20px",
              background: "#fff",
            }}
          >
            <h3>{exam.title}</h3>

            <p>
              {exam.description ||
                "Practice examination"}
            </p>

            <p>
              <strong>Type:</strong>{" "}
              {exam.examType}
            </p>

            <p>
              <strong>Duration:</strong>{" "}
              {exam.duration} minutes
            </p>

            <p>
              <strong>Total Marks:</strong>{" "}
              {exam.totalMarks}
            </p>

            <button
              onClick={() =>
                navigate(
                  `/exam/${exam._id}`
                )
              }
              style={{
                padding: "10px 16px",
                cursor: "pointer",
              }}
            >
              View Exam
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ExamList;