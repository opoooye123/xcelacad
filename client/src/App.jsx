import { lazy, Suspense } from "react";
import {
  Navigate,
  Route,
  Routes,
  useParams,
} from "react-router-dom";

import AdminRoute from "./components/AdminRoute";
import ProtectedRoute from "./components/ProtectedRoute";
import PublicOnlyRoute from "./components/PublicOnlyRoute";
import { PageLoader } from "./components/ui";
import AdaptiveLayout from "./layouts/AdaptiveLayout";
import AdminLayout from "./layouts/AdminLayout";
import PublicLayout from "./layouts/PublicLayout";
import StudentLayout from "./layouts/StudentLayout";
import MaintenanceGate from "./components/MaintenanceGate";
import Review from "./pages/Review";
import SchoolDashboard from "./pages/school/SchoolDashboard";
import SchoolClasses from "./pages/school/SchoolClasses";
import CreateSchool from "./pages/school/CreateSchool";
import MySchool from "./pages/school/MySchool";
import SchoolVerification from "./pages/admin/SchoolVerification";
import SchoolTeachers from "./pages/school/SchoolTeachers";
import SchoolAssignments from "./pages/school/SchoolAssignments";
import SchoolStudents from "./pages/school/SchoolStudents";
import TeacherDashboard from "./pages/school/TeacherDashboard";
import CreateSchoolExam from "./pages/school/CreateSchoolExam";


// ==========================================================
// ROUTES
// ==========================================================
// Four groups:
//   public    — marketing pages, no auth
//   adaptive  — one URL, public chrome for visitors and student
//               chrome for signed-in users (catalogue, notes,
//               leaderboard)
//   student   — signed in
//   admin     — signed in AND role === "admin"
//
// Everything is lazily loaded so a visitor landing on / does not
// download the admin dashboard. The CBT screen is deliberately
// eager (see below).
// ==========================================================

// Public
const Home = lazy(() => import("./pages/Home"));
const Subjects = lazy(() => import("./pages/Subjects"));
const SubjectDetail = lazy(() => import("./pages/SubjectDetail"));
const Faq = lazy(() => import("./pages/Faq"));
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));
const Login = lazy(() => import("./pages/Login"));
const AuthSuccess = lazy(() => import("./pages/AuthSuccess"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Adaptive
const Leaderboard = lazy(() => import("./pages/Leaderboard"));
const Materials = lazy(() => import("./pages/Materials"));
const MaterialDetail = lazy(
  () => import("./pages/MaterialDetail")
);

// Student
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Practice = lazy(() => import("./pages/Practice"));
const ExamsBrowse = lazy(() => import("./pages/ExamsBrowse"));
const ExamDetails = lazy(() => import("./pages/ExamDetails"));
const ExamResult = lazy(() => import("./pages/ExamResult"));
const ExamHistory = lazy(() => import("./pages/ExamHistory"));
const Analytics = lazy(() => import("./pages/Analytics"));
const Profile = lazy(() => import("./pages/Profile"));

// CBT is not lazy: it is the one screen where a chunk request
// failing mid-exam would cost the student their attempt.
import CBT from "./pages/CBT";

// Admin
const AdminOverview = lazy(
  () => import("./pages/admin/AdminOverview")
);
const AdminSubjects = lazy(
  () => import("./pages/admin/AdminSubjects")
);
const AdminTopics = lazy(
  () => import("./pages/admin/AdminTopics")
);
 const AdminQuestions = lazy(
  () => import("./pages/admin/AdminQuestions")
);
const AdminQuestionImport = lazy(
  () => import("./pages/admin/AdminQuestionImport")
); 
 const AdminExams = lazy(
  () => import("./pages/admin/AdminExams")
);
const AdminMaterials = lazy(
  () => import("./pages/admin/AdminMaterials")
);
const AdminUsers = lazy(
  () => import("./pages/admin/AdminUsers")
);
const AdminSettings = lazy(
  () => import("./pages/admin/AdminSettings")
); 

// Carries the :id across a renamed route so old bookmarks and
// shared links still land on the right record.
const KeepId = ({ to }) => {
  const { id } = useParams();

  return <Navigate to={`${to}/${id}`} replace />;
};

const App = () => (
  <MaintenanceGate>
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* ---------- Public ---------- */}
        <Route element={<PublicLayout />}>
          <Route index element={<Home />} />
          <Route path="/faq" element={<Faq />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
        </Route>

        {/* ---------- Adaptive ---------- */}
        <Route element={<AdaptiveLayout />}>
          <Route path="/subjects" element={<Subjects />} />
          <Route
            path="/subjects/:slug"
            element={<SubjectDetail />}
          />
          <Route
            path="/leaderboard"
            element={<Leaderboard />}
          />
          <Route path="/materials" element={<Materials />} />
          <Route
            path="/materials/:id"
            element={<MaterialDetail />}
          />
        </Route>
        <Route
  path="/review"
  element={
    <ProtectedRoute>
      <Review />
    </ProtectedRoute>
  }
/>

        {/* ---------- Auth ---------- */}
        <Route
          path="/login"
          element={
            <PublicOnlyRoute>
              <Login />
            </PublicOnlyRoute>
          }
        />

        {/* Google redirects here with ?token=… — it must stay
            reachable while the session is still being read, so it
            is not wrapped in PublicOnlyRoute. */}
        <Route path="/auth-success" element={<AuthSuccess />} />

        {/* ---------- Student ---------- */}
        <Route
          element={
            <ProtectedRoute>
              <StudentLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/practice" element={<Practice />} />
          <Route path="/exams" element={<ExamsBrowse />} />
          <Route path="/exams/:id" element={<ExamDetails />} />
          <Route path="/history" element={<ExamHistory />} />
          <Route
            path="/results/:id"
            element={<ExamResult />}
          />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/profile" element={<Profile />} />
        </Route>

        {/* The CBT screen runs full-bleed with its own header —
            no sidebar or bottom nav to compete with the timer. */}
        <Route
          path="/cbt/:id"
          element={
            <ProtectedRoute>
              <CBT />
            </ProtectedRoute>
          }
        />

        {/* ---------- Admin ---------- */}
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          }
        >
          <Route index element={<AdminOverview />} />
          <Route path="subjects" element={<AdminSubjects />} />
          <Route path="topics" element={<AdminTopics />} />
          <Route
            path="questions"
            element={<AdminQuestions />}
          />
          <Route
            path="questions/import"
            element={<AdminQuestionImport />}
          />
          <Route path="exams" element={<AdminExams />} />
          <Route
            path="materials"
            element={<AdminMaterials />}
          />
          <Route path="users" element={<AdminUsers />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>

        {/* ---------- Legacy redirects ---------- */}
        {/* Old links and bookmarks from before the restructure. */}
        <Route
          path="/exam/:id"
          element={<KeepId to="/exams" />}
        />
        <Route
          path="/exam-result/:id"
          element={<KeepId to="/results" />}
        />
        <Route
          path="/exam-history"
          element={<Navigate to="/history" replace />}
        />

        <Route path="*" element={<NotFound />} />

        {/* --------------- School ---------- */}

        <Route
  path="/school/:schoolId"
  element={<SchoolDashboard />}
/>

<Route
  path="/school/:schoolId/classes"
  element={<SchoolClasses />}
/>

<Route
  path="/school/create"
  element={<CreateSchool />}
/>

<Route
  path="/school/my"
  element={<MySchool />}
/>

<Route
  path="/admin/schools/verification"
  element={<SchoolVerification />}
/>

<Route
  path="/school/:schoolId/teachers"
  element={<SchoolTeachers />}
/>

<Route
  path="/school/:schoolId/assignments"
  element={<SchoolAssignments />}
/>

<Route
  path="/school/:schoolId/students"
  element={<SchoolStudents />}
/>

<Route
  path="/school/:schoolId/teacher-dashboard"
  element={<TeacherDashboard />}
/>

<Route
  path="/school/:schoolId/exams/create"
  element={
    <ProtectedRoute>
      <CreateSchoolExam />
    </ProtectedRoute>
  }
/>
      </Routes>
    </Suspense>
  </MaintenanceGate>
);

export default App;
