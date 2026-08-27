import { Link } from "react-router-dom";

const AdminOverview = () => {
  return (
    <div className="shell py-6 lg:py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-ink">
          Admin Dashboard
        </h1>

        <p className="mt-2 text-muted">
          Manage Xcel Academy content, questions, exams,
          students, and platform settings.
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <AdminCard
          title="Subjects"
          description="Create and manage subjects."
          to="/admin/subjects"
        />

        <AdminCard
          title="Topics"
          description="Manage topics under each subject."
          to="/admin/topics"
        />

        <AdminCard
          title="Questions"
          description="Manage questions in the question bank."
          to="/admin/questions"
        />

        <AdminCard
          title="Exams"
          description="Create and manage examinations."
          to="/admin/exams"
        />

        <AdminCard
          title="Study Notes"
          description="Manage learning materials."
          to="/admin/materials"
        />

        <AdminCard
          title="Users"
          description="View and manage students."
          to="/admin/users"
        />

        <AdminCard
          title="Import Questions"
          description="Bulk import questions using JSON."
          to="/admin/questions/import"
        />

        <AdminCard
          title="Settings"
          description="Configure Xcel Academy."
          to="/admin/settings"
        />
      </div>
    </div>
  );
};

const AdminCard = ({
  title,
  description,
  to,
}) => {
  return (
    <Link
      to={to}
      className="card card-pad block transition-shadow hover:shadow-md"
    >
      <h2 className="font-bold text-ink">
        {title}
      </h2>

      <p className="mt-2 text-sm leading-6 text-muted">
        {description}
      </p>

      <span className="mt-4 inline-block text-sm font-semibold text-brand-600">
        Manage →
      </span>
    </Link>
  );
};

export default AdminOverview;