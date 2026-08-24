import { Link } from "react-router-dom";

import { useSettings } from "../context/SettingsContext";
import { useDocumentTitle } from "../hooks/useApi";
import {
  Accordion,
  EmptyState,
  SectionHeader,
} from "../components/ui";
import {
  ArrowRightIcon,
  InfoIcon,
} from "../components/ui/Icons";

// ==========================================================
// FAQ
// ==========================================================
// Same `landing.faq` array the home page shows a slice of — this
// page shows all of it, so the admin only maintains one list.
// ==========================================================

const Faq = () => {
  const { landing, navigation, siteName } = useSettings();

  useDocumentTitle("Frequently asked questions", siteName);

  const faq = landing?.faq || [];

  return (
    <div className="shell-narrow py-10 sm:py-14">
      <SectionHeader
        eyebrow="Help"
        title="Frequently asked questions"
        description={`Everything students usually want to know about ${siteName}. If your question isn't here, get in touch.`}
        className="sm:flex-col sm:items-start"
      />

      {faq.length === 0 ? (
        <div className="card mt-8">
          <EmptyState
            icon={InfoIcon}
            title="No questions published yet"
            description="This page is managed from the dashboard and hasn't been filled in yet."
            action={
              <Link
                to="/contact"
                className="btn btn-primary"
              >
                Ask us directly
              </Link>
            }
          />
        </div>
      ) : (
        <Accordion items={faq} className="mt-8" />
      )}

      <div className="card card-pad mt-8 text-center">
        <h2 className="text-base font-bold text-ink">
          Still stuck?
        </h2>

        <p className="mx-auto mt-1.5 max-w-md text-sm text-muted">
          Send us the details and we'll come back to you.
          {navigation?.contactEmail
            ? " We usually reply within a day."
            : ""}
        </p>

        <div className="mt-5 flex flex-col justify-center gap-2 sm:flex-row">
          <Link to="/contact" className="btn btn-primary">
            Contact support
            <ArrowRightIcon className="size-4" />
          </Link>

          <Link to="/subjects" className="btn btn-outline">
            Browse subjects
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Faq;
