import { useMemo } from "react";
import { useNavigate } from "react-router-dom";

import { useSettings } from "../context/SettingsContext";
import { useApiData, useDocumentTitle } from "../hooks/useApi";
import { endpoints } from "../lib/api";
import {
  EmptyState,
  ErrorState,
  PageHeader,
  SkeletonCard,
} from "../components/ui";
import { TargetIcon } from "../components/ui/Icons";

const Analytics = () => {
  const navigate = useNavigate();
  const { siteName } = useSettings();

  useDocumentTitle("My Analytics", siteName);

  const { data, loading, error, refetch } = useApiData(
    endpoints.analytics.me
  );

  const analytics = useMemo(() => {
    return data?.analytics || data || null;
  }, [data]);

  if (loading) {
    return (
      <div className="shell py-6 lg:py-8">
        <PageHeader
          title="My Analytics"
          description="Track your examination performance and progress."
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <SkeletonCard key={index} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="shell py-6 lg:py-8">
        <PageHeader
          title="My Analytics"
          description="Track your examination performance and progress."
        />

        <ErrorState error={error} onRetry={refetch} />
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="shell py-6 lg:py-8">
        <PageHeader
          title="My Analytics"
          description="Track your examination performance and progress."
        />

        <div className="card">
          <EmptyState
            icon={TargetIcon}
            title="No analytics available yet"
            description="Complete an examination to start building your performance history."
            action={
              <button
                type="button"
                onClick={() => navigate("/exams")}
                className="btn btn-primary"
              >
                Browse Exams
              </button>
            }
          />
        </div>
      </div>
    );
  }

  const totalAttempts =
    analytics.totalAttempts ??
    analytics.attempts ??
    analytics.totalExams ??
    0;

  const averageScore =
    analytics.averageScore ??
    analytics.average ??
    0;

  const highestScore =
    analytics.highestScore ??
    analytics.bestScore ??
    0;

  const totalQuestions =
    analytics.totalQuestions ??
    0;

  return (
    <div className="shell py-6 lg:py-8">
      <PageHeader
        title="My Analytics"
        description="Track your examination performance and progress."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Exams Completed"
          value={totalAttempts}
        />

        <StatCard
          label="Average Score"
          value={
            typeof averageScore === "number"
              ? `${averageScore.toFixed(1)}%`
              : averageScore
          }
        />

        <StatCard
          label="Best Score"
          value={
            typeof highestScore === "number"
              ? `${highestScore}%`
              : highestScore
          }
        />

        <StatCard
          label="Questions Answered"
          value={totalQuestions}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="card card-pad">
          <h2 className="text-lg font-bold text-ink">
            Performance Overview
          </h2>

          <p className="mt-2 text-sm text-muted">
            Your analytics will become more detailed as you
            complete more examinations.
          </p>

          {analytics.correct !== undefined && (
            <div className="mt-6 space-y-3">
              <MetricRow
                label="Correct Answers"
                value={analytics.correct}
              />

              <MetricRow
                label="Wrong Answers"
                value={analytics.wrong ?? 0}
              />

              <MetricRow
                label="Unanswered"
                value={analytics.unanswered ?? 0}
              />
            </div>
          )}
        </div>

        <div className="card card-pad">
          <h2 className="text-lg font-bold text-ink">
            Continue Practising
          </h2>

          <p className="mt-2 text-sm text-muted">
            Keep practising to improve your score and build
            stronger exam confidence.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => navigate("/exams")}
              className="btn btn-primary"
            >
              Browse Exams
            </button>

            <button
              type="button"
              onClick={() => navigate("/practice")}
              className="btn btn-outline"
            >
              Quick Practice
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ label, value }) => {
  return (
    <div className="card card-pad">
      <p className="text-sm font-medium text-muted">
        {label}
      </p>

      <p className="mt-2 text-3xl font-bold text-ink">
        {value}
      </p>
    </div>
  );
};

const MetricRow = ({ label, value }) => {
  return (
    <div className="flex items-center justify-between rounded-md bg-surface-2 px-4 py-3">
      <span className="text-sm text-muted">{label}</span>

      <strong className="text-ink">{value}</strong>
    </div>
  );
};

export default Analytics;