import { Link } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { useSettings } from "../context/SettingsContext";
import { useApiData, useDocumentTitle } from "../hooks/useApi";
import { endpoints } from "../lib/api";
import { compactNumber, pluralize } from "../lib/format";
import {
  Accordion,
  Badge,
  SectionHeader,
  SkeletonBlock,
  cx,
} from "../components/ui";
import {
  ArrowRightIcon,
  BookIcon,
  ChartIcon,
  CheckCircleIcon,
  ClockIcon,
  GoogleIcon,
  SparkIcon,
  TargetIcon,
  TrophyIcon,
} from "../components/ui/Icons";

// ==========================================================
// LANDING PAGE
// ==========================================================
// Every string on this page comes from SiteSettings.landing, so
// the admin can rewrite the pitch without a deploy. The subject
// grid prefers the admin's curated picks and falls back to the
// live catalogue when nothing has been curated yet.
// ==========================================================

// ----------------------------------------------------------
// HERO
// ----------------------------------------------------------

const HeroPreview = () => (
  // A mock question card rather than a stock photo: it shows what
  // the product actually looks like and costs no network request.
  <div className="relative mx-auto w-full max-w-md lg:max-w-none">
    <div
      className="absolute -inset-4 -z-10 rounded-3xl bg-gradient-to-br from-brand-200/50 to-accent-100/60 blur-2xl"
      aria-hidden="true"
    />

    <div
      className="card overflow-hidden shadow-pop"
      aria-hidden="true"
    >
      <div className="flex items-center justify-between gap-3 border-b border-line bg-surface-2 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="badge badge-brand">
            Mathematics
          </span>
          <span className="text-xs font-semibold text-subtle">
            2019
          </span>
        </div>

        <span className="flex items-center gap-1.5 rounded-full bg-danger-soft px-2.5 py-1 text-xs font-bold text-danger">
          <ClockIcon className="size-3.5" />
          24:15
        </span>
      </div>

      <div className="p-4 sm:p-5">
        <p className="text-xs font-bold tracking-wide text-subtle uppercase">
          Question 7 of 40
        </p>

        <p className="mt-2 text-sm font-semibold text-ink sm:text-base">
          If 2x + 3y = 12 and x − y = 1, what is the value
          of x?
        </p>

        <ul className="mt-4 space-y-2">
          {[
            { key: "A", text: "1", state: "idle" },
            { key: "B", text: "3", state: "chosen" },
            { key: "C", text: "4", state: "idle" },
            { key: "D", text: "5", state: "idle" },
          ].map((option) => (
            <li
              key={option.key}
              className={cx(
                "flex items-center gap-3 rounded-md border px-3 py-2.5 text-sm",
                option.state === "chosen"
                  ? "border-brand-500 bg-brand-50 font-semibold text-brand-700"
                  : "border-line text-muted"
              )}
            >
              <span
                className={cx(
                  "grid size-6 shrink-0 place-items-center rounded-full text-xs font-bold",
                  option.state === "chosen"
                    ? "bg-brand-500 text-white"
                    : "bg-surface-2 text-subtle"
                )}
              >
                {option.key}
              </span>

              {option.text}
            </li>
          ))}
        </ul>

        <div className="mt-4 flex items-center justify-between gap-3 border-t border-line pt-4">
          <div className="flex gap-1">
            {[
              true,
              true,
              true,
              true,
              true,
              true,
              false,
              false,
            ].map((answered, index) => (
              <span
                key={index}
                className={cx(
                  "size-2 rounded-full",
                  answered
                    ? "bg-brand-500"
                    : "bg-surface-2 ring-1 ring-line"
                )}
              />
            ))}
          </div>

          <span className="text-xs font-semibold text-success">
            Autosaved
          </span>
        </div>
      </div>
    </div>
  </div>
);

const Hero = ({ hero, isAuthenticated }) => {
  // A signed-in visitor doesn't need "start practising free" —
  // send them where the product actually is.
  const primary = isAuthenticated
    ? { label: "Go to my dashboard", href: "/dashboard" }
    : hero?.primaryCta;

  const secondary = hero?.secondaryCta;

  return (
    <section className="relative overflow-hidden border-b border-line bg-surface">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(60rem_30rem_at_15%_-10%,var(--color-brand-100),transparent)] opacity-70"
        aria-hidden="true"
      />

      <div className="shell relative py-12 sm:py-16 lg:py-24">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
          <div className="min-w-0">
            {hero?.eyebrow && (
              <p className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-bold tracking-wide text-brand-700">
                <SparkIcon className="size-3.5" />
                {hero.eyebrow}
              </p>
            )}

            <h1 className="mt-5 text-3xl leading-tight font-bold text-ink sm:text-4xl lg:text-5xl">
              {hero?.headline}
            </h1>

            {hero?.subheadline && (
              <p className="mt-4 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
                {hero.subheadline}
              </p>
            )}

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              {primary?.label && (
                <Link
                  to={primary.href || "/login"}
                  className="btn btn-primary btn-lg"
                >
                  {!isAuthenticated && (
                    <GoogleIcon className="size-5" />
                  )}
                  {primary.label}
                </Link>
              )}

              {secondary?.label && (
                <Link
                  to={secondary.href || "/subjects"}
                  className="btn btn-outline btn-lg"
                >
                  {secondary.label}
                  <ArrowRightIcon className="size-4" />
                </Link>
              )}
            </div>

            <ul className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted">
              {[
                "Free to start",
                "No card required",
                "Works on any phone",
              ].map((item) => (
                <li
                  key={item}
                  className="flex items-center gap-1.5"
                >
                  <CheckCircleIcon className="size-4 text-success" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {hero?.imageUrl ? (
            <img
              src={hero.imageUrl}
              alt=""
              className="mx-auto w-full max-w-md rounded-xl border border-line object-cover shadow-pop lg:max-w-none"
              loading="lazy"
            />
          ) : (
            <HeroPreview />
          )}
        </div>
      </div>
    </section>
  );
};

// ----------------------------------------------------------
// STATS
// ----------------------------------------------------------

const Stats = ({ stats }) => {
  if (!stats?.length) return null;

  return (
    <section className="border-b border-line bg-bg">
      <div className="shell py-8 sm:py-10">
        <dl className="grid grid-cols-2 gap-x-4 gap-y-7 sm:gap-6 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <div
              key={`${stat.label}-${index}`}
              className="text-center sm:text-left"
            >
              <dd className="text-2xl font-bold text-brand-600 sm:text-3xl">
                {stat.value}
              </dd>
              <dt className="mt-1 text-xs font-semibold tracking-wide text-muted uppercase sm:text-sm sm:normal-case sm:tracking-normal">
                {stat.label}
              </dt>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
};

// ----------------------------------------------------------
// SUBJECT GRID
// ----------------------------------------------------------

const SubjectCard = ({ subject }) => (
  <Link
    to={`/subjects/${subject.slug}`}
    className="card group flex h-full flex-col p-5 transition-all hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-pop"
  >
    <div className="flex items-start justify-between gap-3">
      <span className="grid size-10 shrink-0 place-items-center rounded-md bg-brand-50 text-brand-600">
        <BookIcon className="size-5" />
      </span>

      <ArrowRightIcon className="size-4 shrink-0 text-subtle transition-transform group-hover:translate-x-0.5 group-hover:text-brand-600" />
    </div>

    <h3 className="mt-4 text-base font-bold text-ink">
      {subject.name}
    </h3>

    {subject.description && (
      <p className="mt-1.5 line-clamp-2 flex-1 text-sm text-muted">
        {subject.description}
      </p>
    )}

    <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold text-subtle">
      {subject.questionCount > 0 && (
        <span>
          {compactNumber(subject.questionCount)}{" "}
          {pluralize(subject.questionCount, "question")}
        </span>
      )}

      {subject.topicCount > 0 && (
        <span>
          {subject.topicCount}{" "}
          {pluralize(subject.topicCount, "topic")}
        </span>
      )}

      {subject.years?.length > 0 && (
        <span>
          {subject.years.length}{" "}
          {pluralize(subject.years.length, "year")}
        </span>
      )}
    </div>
  </Link>
);

const SubjectGrid = ({ curated }) => {
  // Skip the catalogue request entirely when the admin has
  // curated a set — the populated documents are already here.
  const hasCurated = curated?.length > 0;

  const { data, loading, error } = useApiData(
    endpoints.catalog.subjects,
    { auth: false, enabled: !hasCurated }
  );

  const subjects = hasCurated
    ? curated
    : (data?.subjects || []).slice(0, 8);

  // Nothing seeded yet and nothing curated: hide the section
  // rather than show an empty grid on the marketing page.
  if (!hasCurated && !loading && (error || !subjects.length)) {
    return null;
  }

  return (
    <section className="bg-bg">
      <div className="shell py-12 sm:py-16">
        <SectionHeader
          eyebrow="Subjects"
          title="Pick a subject and start practising"
          description="Real past questions grouped by subject, topic and year, with worked explanations on every answer."
          action={
            <Link to="/subjects" className="btn btn-outline">
              View all subjects
              <ArrowRightIcon className="size-4" />
            </Link>
          }
        />

        <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {loading && !hasCurated
            ? Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="card card-pad space-y-3"
                >
                  <SkeletonBlock className="size-10 rounded-md" />
                  <SkeletonBlock className="h-4 w-3/5" />
                  <SkeletonBlock className="h-3 w-full" />
                  <SkeletonBlock className="h-3 w-2/5" />
                </div>
              ))
            : subjects.map((subject) => (
                <SubjectCard
                  key={subject._id || subject.slug}
                  subject={subject}
                />
              ))}
        </div>
      </div>
    </section>
  );
};

// ----------------------------------------------------------
// HOW IT WORKS
// ----------------------------------------------------------

const HowItWorks = ({ steps }) => {
  if (!steps?.length) return null;

  return (
    <section className="border-y border-line bg-surface">
      <div className="shell py-12 sm:py-16">
        <SectionHeader
          eyebrow="How it works"
          title="Three steps to a better score"
          className="sm:flex-col sm:items-start"
        />

        <ol className="relative mt-8 grid gap-6 md:grid-cols-3 md:gap-8">
          {/* The connecting line only makes sense once the steps
              sit side by side. */}
          <span
            className="absolute top-6 right-8 left-8 hidden h-px bg-line md:block"
            aria-hidden="true"
          />

          {steps.map((step, index) => (
            <li
              key={`${step.title}-${index}`}
              className="relative"
            >
              <span className="relative grid size-12 place-items-center rounded-full border border-line bg-surface text-xl shadow-soft">
                {step.icon || index + 1}
              </span>

              <h3 className="mt-4 text-base font-bold text-ink">
                <span className="mr-1.5 text-brand-500">
                  {index + 1}.
                </span>
                {step.title}
              </h3>

              {step.description && (
                <p className="mt-1.5 text-sm leading-relaxed text-muted">
                  {step.description}
                </p>
              )}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
};

// ----------------------------------------------------------
// FEATURE STRIP
// ----------------------------------------------------------

const FEATURES = [
  {
    icon: ClockIcon,
    title: "Exam-day conditions",
    description:
      "A real countdown, a question navigator and autosave, so nothing about the interface surprises you.",
    feature: "exams",
  },
  {
    icon: ChartIcon,
    title: "Topic-level analytics",
    description:
      "See accuracy per subject and per topic, so revision goes where the marks actually are.",
    feature: "analytics",
  },
  {
    icon: TrophyIcon,
    title: "Leaderboards",
    description:
      "Compare your average against everyone practising the same subject.",
    feature: "leaderboard",
  },
  {
    icon: BookIcon,
    title: "Study notes",
    description:
      "Concise notes and worked examples written to sit alongside the question bank.",
    feature: "studyMaterials",
  },
  {
    icon: TargetIcon,
    title: "Practice by year",
    description:
      "Build a set from any single past paper, or mix years to drill a weak topic.",
    feature: "practice",
  },
  {
    icon: CheckCircleIcon,
    title: "Explanations included",
    description:
      "Every answer can carry a worked explanation, revealed the moment you submit.",
  },
];

const Features = ({ isFeatureOn }) => {
  // A feature turned off in the CMS shouldn't still be advertised.
  const visible = FEATURES.filter(
    (item) => !item.feature || isFeatureOn(item.feature)
  );

  if (!visible.length) return null;

  return (
    <section className="bg-bg">
      <div className="shell py-12 sm:py-16">
        <SectionHeader
          eyebrow="Why it works"
          title="Built for the exam you're actually sitting"
          description="Not a quiz app with a syllabus bolted on — every screen is shaped around Nigerian CBT exams."
          className="sm:flex-col sm:items-start"
        />

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((item) => (
            <div key={item.title} className="card card-pad">
              <span className="grid size-10 place-items-center rounded-md bg-accent-100 text-accent-700">
                <item.icon className="size-5" />
              </span>

              <h3 className="mt-4 text-base font-bold text-ink">
                {item.title}
              </h3>

              <p className="mt-1.5 text-sm leading-relaxed text-muted">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ----------------------------------------------------------
// TESTIMONIALS
// ----------------------------------------------------------

const Testimonials = ({ testimonials }) => {
  if (!testimonials?.length) return null;

  return (
    <section className="border-y border-line bg-surface">
      <div className="shell py-12 sm:py-16">
        <SectionHeader
          eyebrow="Students"
          title="What they say"
          className="sm:flex-col sm:items-start"
        />

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((item, index) => (
            <figure
              key={`${item.name}-${index}`}
              className="card card-pad flex h-full flex-col"
            >
              <blockquote className="flex-1 text-sm leading-relaxed text-muted">
                “{item.quote}”
              </blockquote>

              <figcaption className="mt-4 flex items-center gap-3 border-t border-line pt-4">
                {item.avatarUrl ? (
                  <img
                    src={item.avatarUrl}
                    alt=""
                    className="size-9 shrink-0 rounded-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <span
                    className="grid size-9 shrink-0 place-items-center rounded-full bg-brand-100 text-xs font-bold text-brand-700"
                    aria-hidden="true"
                  >
                    {(item.name || "?").charAt(0)}
                  </span>
                )}

                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink">
                    {item.name}
                  </p>

                  {item.role && (
                    <p className="truncate text-xs text-subtle">
                      {item.role}
                    </p>
                  )}
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
};

// ----------------------------------------------------------
// FAQ + CLOSING CTA
// ----------------------------------------------------------

const Faqs = ({ faq }) => {
  if (!faq?.length) return null;

  return (
    <section className="bg-bg">
      <div className="shell-narrow py-12 sm:py-16">
        <SectionHeader
          eyebrow="FAQ"
          title="Questions, answered"
          className="sm:flex-col sm:items-start"
        />

        <Accordion items={faq.slice(0, 6)} className="mt-7" />

        {faq.length > 6 && (
          <div className="mt-6 text-center">
            <Link to="/faq" className="btn btn-ghost">
              See all questions
              <ArrowRightIcon className="size-4" />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
};

const ClosingCta = ({ isAuthenticated, registrationOpen }) => (
  <section className="border-t border-line bg-surface">
    <div className="shell py-12 sm:py-16">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-brand-600 to-brand-800 px-6 py-10 text-center sm:px-10 sm:py-14">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(30rem_20rem_at_80%_120%,rgba(255,255,255,0.18),transparent)]"
          aria-hidden="true"
        />

        <div className="relative">
          <h2 className="text-2xl font-bold text-white sm:text-3xl">
            Your next practice paper is one tap away
          </h2>

          <p className="mx-auto mt-3 max-w-xl text-sm text-white/80 sm:text-base">
            Sit a timed paper, get your score with worked
            explanations, and know exactly what to revise
            tonight.
          </p>

          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            {isAuthenticated ? (
              <Link
                to="/practice"
                className="btn btn-lg bg-white text-brand-700 hover:bg-white/90"
              >
                Start a practice session
                <ArrowRightIcon className="size-4" />
              </Link>
            ) : (
              registrationOpen && (
                <Link
                  to="/login"
                  className="btn btn-lg bg-white text-brand-700 hover:bg-white/90"
                >
                  <GoogleIcon className="size-5" />
                  Continue with Google
                </Link>
              )
            )}

            <Link
              to="/subjects"
              className="btn btn-lg border border-white/40 text-white hover:bg-white/10"
            >
              Browse subjects
            </Link>
          </div>

          {!isAuthenticated && !registrationOpen && (
            <Badge tone="warning" className="mt-6">
              Registration is temporarily closed
            </Badge>
          )}
        </div>
      </div>
    </div>
  </section>
);

// ----------------------------------------------------------
// PAGE
// ----------------------------------------------------------

const Home = () => {
  const { landing, curation, isFeatureOn, siteName } =
    useSettings();

  const { isAuthenticated } = useAuth();

  useDocumentTitle(
    landing?.seo?.title || `${siteName} — CBT practice`,
    null
  );

  return (
    <>
      <Hero
        hero={landing?.hero}
        isAuthenticated={isAuthenticated}
      />

      <Stats stats={landing?.stats} />

      <SubjectGrid curated={curation?.featuredSubjects} />

      <HowItWorks steps={landing?.howItWorks} />

      <Features isFeatureOn={isFeatureOn} />

      <Testimonials testimonials={landing?.testimonials} />

      <Faqs faq={landing?.faq} />

      <ClosingCta
        isAuthenticated={isAuthenticated}
        registrationOpen={isFeatureOn("registrationOpen")}
      />
    </>
  );
};

export default Home;
