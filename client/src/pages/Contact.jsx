import { useState } from "react";
import { Link } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { useSettings } from "../context/SettingsContext";
import { useDocumentTitle } from "../hooks/useApi";
import {
  Alert,
  SectionHeader,
} from "../components/ui";
import {
  ArrowRightIcon,
  CheckCircleIcon,
  InfoIcon,
} from "../components/ui/Icons";

// ==========================================================
// CONTACT
// ==========================================================
// There is no message-storing endpoint on the server, and a form
// that silently posts nowhere is worse than no form. So this one
// composes a mailto: from what the visitor typed — the message
// genuinely leaves, and nothing pretends to have been received.
// The address comes from navigation.contactEmail in the CMS.
// ==========================================================

const TOPICS = [
  "General question",
  "A question or answer looks wrong",
  "Problem with my account",
  "Report a bug",
  "Partnership or schools",
];

const ContactForm = ({ email, defaultName, defaultEmail }) => {
  const [name, setName] = useState(defaultName || "");
  const [from, setFrom] = useState(defaultEmail || "");
  const [topic, setTopic] = useState(TOPICS[0]);
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = (event) => {
    event.preventDefault();

    const body = [
      `From: ${name || "(not given)"}`,
      `Reply to: ${from || "(not given)"}`,
      "",
      message,
    ].join("\n");

    // encodeURIComponent, not encodeURI: the body contains
    // newlines and & characters that would otherwise break the
    // query string apart.
    const href = `mailto:${email}?subject=${encodeURIComponent(
      `[Support] ${topic}`
    )}&body=${encodeURIComponent(body)}`;

    window.location.href = href;

    setSent(true);
  };

  return (
    <form onSubmit={handleSubmit} className="card card-pad">
      {sent && (
        <Alert tone="success" className="mb-5">
          Your mail app should have opened with the message
          ready. Send it from there and we'll pick it up.
        </Alert>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="contact-name" className="label">
            Your name
          </label>

          <input
            id="contact-name"
            type="text"
            value={name}
            onChange={(event) =>
              setName(event.target.value)
            }
            className="input"
            autoComplete="name"
            required
          />
        </div>

        <div>
          <label htmlFor="contact-email" className="label">
            Your email
          </label>

          <input
            id="contact-email"
            type="email"
            value={from}
            onChange={(event) =>
              setFrom(event.target.value)
            }
            className="input"
            autoComplete="email"
            required
          />
        </div>
      </div>

      <div className="mt-4">
        <label htmlFor="contact-topic" className="label">
          What is it about?
        </label>

        <select
          id="contact-topic"
          value={topic}
          onChange={(event) => setTopic(event.target.value)}
          className="input"
        >
          {TOPICS.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-4">
        <label htmlFor="contact-message" className="label">
          Message
        </label>

        <textarea
          id="contact-message"
          value={message}
          onChange={(event) =>
            setMessage(event.target.value)
          }
          rows={6}
          className="input resize-y"
          placeholder="Tell us what happened, and include the subject and question number if it's about a specific question."
          required
        />

        <p className="hint">
          Opens in your mail app so you keep a copy of what you
          sent.
        </p>
      </div>

      <button
        type="submit"
        className="btn btn-primary mt-5 w-full sm:w-auto"
      >
        Compose message
        <ArrowRightIcon className="size-4" />
      </button>
    </form>
  );
};

const Contact = () => {
  const { navigation, siteName } = useSettings();
  const { user } = useAuth();

  useDocumentTitle("Contact us", siteName);

  const email = navigation?.contactEmail?.trim();
  const phone = navigation?.contactPhone?.trim();

  const socials = (navigation?.socialLinks || []).filter(
    (link) => link.href?.trim()
  );

  return (
    <div className="shell py-10 sm:py-14">
      <SectionHeader
        eyebrow="Contact"
        title="Get in touch"
        description={`Questions, corrections to a past question, or a problem with your account — tell the ${siteName} team and we'll sort it.`}
        className="sm:flex-col sm:items-start"
      />

      <div className="mt-8 grid gap-6 lg:grid-cols-5">
        {/* ---------- Details ---------- */}
        <aside className="space-y-4 lg:col-span-2">
          {email && (
            <div className="card card-pad">
              <p className="text-xs font-bold tracking-wide text-subtle uppercase">
                Email
              </p>

              <a
                href={`mailto:${email}`}
                className="mt-1 block font-semibold break-words text-brand-600 hover:underline"
              >
                {email}
              </a>
            </div>
          )}

          {phone && (
            <div className="card card-pad">
              <p className="text-xs font-bold tracking-wide text-subtle uppercase">
                Phone
              </p>

              <a
                href={`tel:${phone.replace(/\s+/g, "")}`}
                className="mt-1 block font-semibold text-brand-600 hover:underline"
              >
                {phone}
              </a>
            </div>
          )}

          {socials.length > 0 && (
            <div className="card card-pad">
              <p className="text-xs font-bold tracking-wide text-subtle uppercase">
                Social
              </p>

              <ul className="mt-2 space-y-1.5">
                {socials.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="text-sm font-semibold text-muted hover:text-brand-600"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="card card-pad bg-surface-2">
            <p className="text-sm font-semibold text-ink">
              Reporting a wrong answer?
            </p>

            <p className="mt-1.5 text-sm text-muted">
              Include the subject, the year and the question
              number. That's usually enough for us to find and
              fix it the same day.
            </p>
          </div>

          <div className="card card-pad">
            <p className="text-sm font-semibold text-ink">
              Looking for a quick answer?
            </p>

            <Link
              to="/faq"
              className="btn btn-outline btn-sm mt-3"
            >
              Read the FAQ
            </Link>
          </div>
        </aside>

        {/* ---------- Form ---------- */}
        <div className="lg:col-span-3">
          {email ? (
            <ContactForm
              email={email}
              defaultName={user?.name}
              defaultEmail={user?.email}
            />
          ) : (
            <div className="card card-pad">
              <Alert tone="info" title="No contact address set">
                A support email hasn't been added in the
                dashboard yet, so there's nowhere for this form
                to send to. An admin can add one under{" "}
                <strong>
                  Site settings → Navigation &amp; Footer
                </strong>
                .
              </Alert>

              <ul className="mt-5 space-y-3 text-sm text-muted">
                <li className="flex items-start gap-3">
                  <CheckCircleIcon className="mt-0.5 size-5 shrink-0 text-success" />
                  In the meantime, the FAQ covers most common
                  questions.
                </li>

                <li className="flex items-start gap-3">
                  <InfoIcon className="mt-0.5 size-5 shrink-0 text-info" />
                  Signed-in students can also reach us through
                  their profile page.
                </li>
              </ul>

              <Link
                to="/faq"
                className="btn btn-primary mt-5"
              >
                Go to the FAQ
                <ArrowRightIcon className="size-4" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Contact;
