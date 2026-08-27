import { Link } from "react-router-dom";

const AdminExams = () => {
  return (
    <div className="shell py-6 lg:py-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink">
            Exam Management
          </h1>

          <p className="mt-2 text-muted">
            Create and manage JAMB, Post-UTME and practice exams.
          </p>
        </div>

        <Link
          to="/admin"
          className="btn btn-outline"
        >
          Back to Dashboard
        </Link>
      </div>

      <div className="card card-pad mt-6">
        <h2 className="text-lg font-bold text-ink">
          Exams
        </h2>

        <p className="mt-2 text-sm text-muted">
          The exam management interface will appear here.
        </p>
      </div>
    </div>
  );
};

export default AdminExams;