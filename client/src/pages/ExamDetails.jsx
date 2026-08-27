import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ExamDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { token, loading: authLoading } = useAuth();

  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (authLoading) return;

    if (!token) {
      setError("You are not logged in.");
      setLoading(false);
      return;
    }

    fetchExam();
  }, [id, token, authLoading]);

  const fetchExam = async () => {
    try {
      setLoading(true);
      setError("");

      console.log("ExamDetails token:", token);

      const response = await fetch(
        `https://xcelacad.onrender.com/api/exams/${id}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      console.log("Exam response:", data);

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to load exam"
        );
      }

      setExam(data.exam);
    } catch (error) {
      console.error(
        "Fetch exam error:",
        error
      );

      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div style={{ padding: "40px" }}>
        <h2>Loading exam...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "40px" }}>
        <h2>Unable to load exam</h2>

        <p>{error}</p>

        <button
          onClick={() => navigate("/dashboard")}
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  if (!exam) {
    return (
      <div style={{ padding: "40px" }}>
        <h2>Exam not found</h2>

        <button
          onClick={() => navigate("/dashboard")}
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f5f7fb",
        padding: "40px 20px",
      }}
    >
      <div
        style={{
          maxWidth: "800px",
          margin: "0 auto",
          background: "#fff",
          padding: "35px",
          borderRadius: "12px",
          border: "1px solid #e5e7eb",
        }}
      >
        <h1>{exam.title}</h1>

        <p>
          {exam.description ||
            "Xcel Academy practice examination."}
        </p>

        <hr />

        <h2>Exam Information</h2>

        <p>
          <strong>Exam Type:</strong>{" "}
          {exam.examType}
        </p>

        <p>
          <strong>Duration:</strong>{" "}
          {exam.duration} minutes
        </p>

        <p>
          <strong>Questions:</strong>{" "}
          {exam.questions?.length || 0}
        </p>

        <p>
          <strong>Total Marks:</strong>{" "}
          {exam.totalMarks}
        </p>

        <h2>Instructions</h2>

        <div
          style={{
            background: "#f5f7fb",
            padding: "20px",
            borderRadius: "8px",
            whiteSpace: "pre-line",
            lineHeight: "1.6",
          }}
        >
          {exam.instructions ||
            "Answer all questions carefully."}
        </div>

        <div
          style={{
            display: "flex",
            gap: "12px",
            marginTop: "30px",
          }}
        >
          <button
            onClick={() => navigate("/dashboard")}
            style={{
              padding: "12px 20px",
              cursor: "pointer",
            }}
          >
            Back
          </button>

          <button
            onClick={() =>
              navigate(`/cbt/${exam._id}`)
            }
            style={{
              padding: "12px 20px",
              cursor: "pointer",
            }}
          >
            Start Exam
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExamDetails;