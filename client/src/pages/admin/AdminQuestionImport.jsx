import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { useToast } from "../../context/ToastContext";
import { useAsyncAction, useDocumentTitle } from "../../hooks/useApi";
import { api, endpoints } from "../../lib/api";
import {
  PageHeader,
  EmptyState,
} from "../../components/ui";
import { UploadIcon } from "../../components/ui/Icons";

const formatImportError = (item) => {
  if (typeof item === "string") {
    return item;
  }

  if (!item || typeof item !== "object") {
    return String(item ?? "");
  }

  if (item.message) {
    return typeof item.message === "string"
      ? item.message
      : JSON.stringify(item.message);
  }

  if (item.reason) {
    return `${item.questionText || "Question"}: ${item.reason}`;
  }

  return JSON.stringify(item);
};

const AdminQuestionImport = () => {
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();
  const { run, pending } = useAsyncAction();

  useDocumentTitle("Import Questions", "Xcel Academy");

  const [jsonText, setJsonText] = useState("");
  const [result, setResult] = useState(null);

  const handleImport = async (event) => {
  event.preventDefault();

  if (!jsonText.trim()) {
    toastError("Paste your question data before importing.");
    return;
  }

  let questions;

  try {
    const parsed = JSON.parse(jsonText);

    questions = Array.isArray(parsed)
      ? parsed
      : parsed.questions;

    if (!Array.isArray(questions)) {
      throw new Error(
        "The JSON must be an array or contain a questions array."
      );
    }

    if (questions.length === 0) {
      throw new Error("No questions were found.");
    }
  } catch (parseError) {
    toastError(
      parseError.message || "Invalid JSON format."
    );
    return;
  }

  const response = await run(() =>
    api.post(endpoints.admin.questionsBulk, {
      questions,
    })
  );

  if (!response.ok) {
    const errorMessage =
  typeof response.error?.message === "string"
    ? response.error.message
    : "Failed to import questions.";

toastError(errorMessage);
    return;
  }

  // use response.data/result depending on your useAsyncAction shape
  const importResult = response.data ?? response.result ?? response;

  setResult(importResult);

  setResult({
  imported: 1,
  failed: 0,
  total: 1,
  errors: [],
});

  setJsonText("");

  const successMessage =
  typeof response.result?.message === "string"
    ? response.result.message
    : "Questions imported successfully.";

success(successMessage);
};

  return (
    <div className="shell py-6 lg:py-8">
      <PageHeader
        title="Import Questions"
        description="Import multiple questions into the Xcel Academy question bank at once."
        action={
          <button
            type="button"
            onClick={() => navigate("/admin/questions")}
            className="btn btn-outline"
          >
            Back to Questions
          </button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        {/* IMPORT FORM */}
        <form
          onSubmit={handleImport}
          className="card card-pad"
        >
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-md bg-brand-50 text-brand-600">
              <UploadIcon className="size-5" />
            </span>

            <div>
              <h2 className="font-bold text-ink">
                Bulk Question Import
              </h2>

              <p className="text-sm text-muted">
                Paste your questions as JSON.
              </p>
            </div>
          </div>

          <label
            htmlFor="question-json"
            className="label mt-6 block"
          >
            Question JSON
          </label>

          <textarea
            id="question-json"
            value={jsonText}
            onChange={(event) =>
              setJsonText(event.target.value)
            }
            placeholder={`[
  {
    "questionText": "What is the capital of Nigeria?",
    "options": {
      "A": "Lagos",
      "B": "Abuja",
      "C": "Kano",
      "D": "Ibadan"
    },
    "correctAnswer": "B",
    "marks": 1
  }
]`}
            rows={20}
            className="input mt-2 min-h-[400px] w-full resize-y font-mono text-sm"
            disabled={pending}
          />

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <button
              type="submit"
              disabled={pending || !jsonText.trim()}
              className="btn btn-primary"
            >
              {pending
                ? "Importing..."
                : "Import Questions"}
            </button>

            <button
              type="button"
              disabled={pending}
              onClick={() => setJsonText("")}
              className="btn btn-outline"
            >
              Clear
            </button>
          </div>
        </form>

        {/* INSTRUCTIONS */}
        <aside className="card card-pad h-fit lg:sticky lg:top-6">
          <h2 className="font-bold text-ink">
            JSON Format
          </h2>

          <p className="mt-2 text-sm leading-6 text-muted">
            Each question should contain the question text,
            four answer options, the correct answer and its
            marks.
          </p>

          <div className="mt-4 overflow-x-auto rounded-md bg-surface-2 p-4">
            <pre className="text-xs leading-5 text-ink">
{`{
  "questionText": "...",
  "options": {
    "A": "...",
    "B": "...",
    "C": "...",
    "D": "..."
  },
  "correctAnswer": "B",
  "marks": 1
}`}
            </pre>
          </div>

          <div className="mt-5 rounded-md bg-info-soft p-4 text-sm leading-6 text-info">
            Make sure every question follows the format
            expected by the server before importing.
          </div>
        </aside>
      </div>

      {/* IMPORT RESULT */}
            {/* IMPORT RESULT */}
{result && (
  <div className="card card-pad mt-6">
    <h2 className="font-bold text-ink">
      Import Result
    </h2>

    <div className="mt-4 grid gap-3 sm:grid-cols-3">
      <ResultItem
        label="Imported"
        value={
          result.imported ??
          result.created ??
          result.count ??
          0
        }
      />

      <ResultItem
        label="Failed"
        value={
          result.failed ??
          (Array.isArray(result.errors)
            ? result.errors.length
            : 0)
        }
      />

      <ResultItem
        label="Total"
        value={
          result.total ??
          result.processed ??
          0
        }
      />
    </div>

    {Array.isArray(result.errors) &&
      result.errors.length > 0 && (
        <div className="mt-5">
          <h3 className="font-semibold text-danger">
            Import Errors
          </h3>

          <div className="mt-3 space-y-2">
            {result.errors.map((item, index) => (
  <div
    key={index}
    className="rounded-md bg-danger-soft px-4 py-3 text-sm text-danger"
  >
    {formatImportError(item)}
  </div>
))}
          </div>
        </div>
      )}
  </div>
)}

      {!result && (
        <div className="mt-6">
          <div className="card">
            <EmptyState
              icon={UploadIcon}
              title="Ready to import"
              description="Paste your question JSON above and import it into the question bank."
            />
          </div>
        </div>
      )}
    </div>
  );
};

const ResultItem = ({ label, value }) => {
  return (
    <div className="rounded-md bg-surface-2 p-4">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-1 text-2xl font-bold text-ink">
        {value}
      </p>
    </div>
  );
};

export default AdminQuestionImport;