import { Link } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { useSettings } from "../context/SettingsContext";
import { useDocumentTitle } from "../hooks/useApi";
import { SectionHeader } from "../components/ui";
import {
  ArrowRightIcon,
  BookIcon,
  ChartIcon,
  CheckCircleIcon,
  ClockIcon,
  TargetIcon,
} from "../components/ui/Icons";

// ==========================================================
// ABOUT
// ==========================================================
// Deliberately not CMS-driven end to end: the narrative reads
// better as prose than as a dozen editable fields, so it pulls
// the brand name, tagline and stats from settings and keeps the
// story in code where it can be written properly.
// ==========================================================

const PRINCIPLES = [
  {
    icon: TargetIcon,
    title: "Past questions, not lookalikes",
    description:
      "Practice only helps when the questions match the paper. The bank is built from real past questions, tagged by exam body, year and topic.",
  },
  {
    icon: ClockIcon,
    title: "Practise the conditions too",
    description:
      "Knowing the content isn't the same as finishing on time. Every session runs on a real clock with the same navigator you'll use on the day.",
  },
  {
    icon: ChartIcon,
    title: "Feedback you can act on",
    description:
      "A score alone doesn't tell you what to revise. Accuracy is broken down per subject and per topic so the next study session has a target.",
  },
  {
    icon: BookIcon,
    title: "Free where it matters",
    description:
      "Exam prep shouldn't depend on what a family can afford. The core question bank and CBT practice are free to use.",
  },
];

const About = () => {
  const { landing, siteName, branding } = useSettings();
  const { isAuthenticated } = useAuth();

  useDocumentTitle(`About ${siteName}`, null);

  const stats = landing?.stats || [];

  return (
    <>
      {/* ---------- Intro ---------- */}
      <section className="border-b border-line bg-surface">
        <div className="shell-narrow py-12 sm:py-16">
          <p className="text-xs font-bold tracking-widest text-brand-600 uppercase">
            About us
          </p>

          <h1 className="mt-3 text-3xl font-bold text-ink sm:text-4xl">
            {branding?.tagline ||
              "Practice smarter. Score higher."}
          </h1>

          <div className="mt-6 space-y-4 text-base leading-relaxed text-muted">
            <p>
              {siteName} exists for a simple reason: most
              students walking into JAMB, WAEC, NECO or a
              Post-UTME have read the syllabus but have never
              sat the paper under real conditions. They know
              the material and still lose marks to the clock,
              to the interface, and to topics nobody told them
              they were weak in.
            </p>

            <p>
              So we built the practice, not another textbook.
              You pick a subject, a topic or a past-paper year;
              we assemble the set and start the timer. Answers
              save as you go, the way the real CBT does. When
              you submit you get a worked explanation for every
              question — and a breakdown of exactly which
              topics cost you marks.
            </p>

            <p>
              Everything is built mobile-first, because for
              most Nigerian students the phone{" "}
              <em>is</em> the computer. The same platform runs
              on a 5-inch screen and a lab desktop, with no
              features held back on either.
            </p>
          </div>
        </div>
      </section>

      {/* ---------- Stats ---------- */}
      {stats.length > 0 && (
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
                  <dt className="mt-1 text-sm text-muted">
                    {stat.label}
                  </dt>
                </div>
              ))}
            </dl>
          </div>
        </section>
      )}

      {/* ---------- Principles ---------- */}
      <section className="bg-bg">
        <div className="shell py-12 sm:py-16">
          <SectionHeader
            eyebrow="What we believe"
            title="Four things we won't compromise on"
            className="sm:flex-col sm:items-start"
          />

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {PRINCIPLES.map((item) => (
              <div key={item.title} className="card card-pad">
                <span className="grid size-10 place-items-center rounded-md bg-brand-50 text-brand-600">
                  <item.icon className="size-5" />
                </span>

                <h2 className="mt-4 text-base font-bold text-ink">
                  {item.title}
                </h2>

                <p className="mt-1.5 text-sm leading-relaxed text-muted">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Who it's for ---------- */}
      <section className="border-y border-line bg-surface">
        <div className="shell-narrow py-12 sm:py-16">
          <SectionHeader
            eyebrow="Who it's for"
            title="Built for the student sitting the paper next"
            className="sm:flex-col sm:items-start"
          />

          <ul className="mt-6 space-y-3">
            {[
              "SS3 students preparing for WAEC or NECO alongside school work.",
              "Candidates writing JAMB who want to drill by subject and year.",
              "Post-UTME candidates practising under a real countdown before screening.",
              "Anyone retaking a paper who needs to find the topics that went wrong last time.",
            ].map((item) => (
              <li
                key={item}
                className="flex items-start gap-3 text-sm leading-relaxed text-muted"
              >
                <CheckCircleIcon className="mt-0.5 size-5 shrink-0 text-success" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ---------- CTA ---------- */}
      <section className="bg-bg">
        <div className="shell-narrow py-12 sm:py-16 text-center">
          <h2 className="text-2xl font-bold text-ink">
            Start where you are weakest
          </h2>

          <p className="mx-auto mt-3 max-w-lg text-sm text-muted">
            Pick a subject, sit one timed paper, and let the
            analytics tell you what to revise tonight.
          </p>

          <div className="mt-7 flex flex-col justify-center gap-2 sm:flex-row">
            <Link
              to={isAuthenticated ? "/practice" : "/login"}
              className="btn btn-primary btn-lg"
            >
              {isAuthenticated
                ? "Start a practice session"
                : "Create a free account"}
              <ArrowRightIcon className="size-4" />
            </Link>

            <Link
              to="/subjects"
              className="btn btn-outline btn-lg"
            >
              Browse subjects
            </Link>
          </div>
        </div>
      </section>
    </>
  );
};

export default About;
