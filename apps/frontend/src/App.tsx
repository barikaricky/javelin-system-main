import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import LoginPage from './pages/auth/LoginPage';
import DevOnboardingPage from './pages/dev/DevOnboardingPage';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import BottomBar from './components/BottomBar';
import DirectorDashboard from './pages/director/Dashboard';
import { OnDutyPage } from './pages/director/attendance';
import WorkersPage from './pages/director/WorkersPage';
import ExpensesPage from './pages/director/ExpensesPage';
import SettingsPage from './pages/director/SettingsPage';
import RegisterManagerPage from './pages/director/RegisterManagerPage';
import PendingApprovalsPage from './pages/director/PendingApprovalsPage';
import LoadingScreen from './components/LoadingScreen';
import MandatoryPollModal from './components/MandatoryPollModal';
import VersionAnnouncement from './components/VersionAnnouncement';
import FeatureAnnouncement from './components/FeatureAnnouncement';
import DownloadAppPage from './pages/DownloadAppPage';
import InstallPromptBanner from './components/InstallPromptBanner';

// Director Poll Pages
import { CreatePollPage, ActivePollsPage, PollResultsPage } from './pages/director/polls';

// Director Meeting Pages
import CreateMeetingPage from './pages/director/meetings/CreateMeetingPage';
import MyMeetingsPage from './pages/director/meetings/MyMeetingsPage';
import InstantMeetingPage from './pages/director/meetings/InstantMeetingPage';

// Meeting Room Page (Video Conference)
import MeetingRoomPage from './pages/meeting/MeetingRoomPage';

// Director Messaging Pages
import MessagingPage from './pages/director/messaging/MessagingPage';
import DirectorCommunicationPage from './pages/director/communication/CommunicationPage';
import DirectorBeatExpensesPage from './pages/director/BeatExpensesPage';
import DirectorNotificationsPage from './pages/director/NotificationsPage';
import { ReportsListPage, CreateReportPage, ReportDetailsPage, EditReportPage, ReportsAnalyticsPage, ReviewReportsPage as DirectorReviewReportsPage } from './pages/director/reports';
import { 
  ReportsListPage as ManagerReportsListPage, 
  CreateReportPage as ManagerCreateReportPage, 
  ReportDetailsPage as ManagerReportDetailsPage, 
  ReportsAnalyticsPage as ManagerReportsAnalyticsPage,
  ReviewReportsPage as ManagerReviewReportsPage
} from './pages/manager/reports';
import { 
  ReportsListPage as SecretaryReportsListPage, 
  CreateReportPage as SecretaryCreateReportPage, 
  ReportDetailsPage as SecretaryReportDetailsPage, 
  ReportsAnalyticsPage as SecretaryReportsAnalyticsPage 
} from './pages/secretary/reports';

// Manager Dashboard imports
import ManagerLayout from './pages/manager/ManagerLayout';
import ManagerDashboard from './pages/manager/Dashboard';
import RegisterSupervisorPage from './pages/manager/RegisterSupervisorPage';
import SupervisorsListPage from './pages/manager/SupervisorsListPage';
import SupervisorDetailPage from './pages/manager/SupervisorDetailPage';
import ManagerOperatorsListPage from './pages/manager/OperatorsListPage';
import NotificationsPage from './pages/manager/NotificationsPage';
import ManagerSettingsPage from './pages/manager/SettingsPage';
import ManagerMessagingPage from './pages/manager/messaging/MessagingPage';
import ManagerCommunicationPage from './pages/manager/communication/CommunicationPage';
import ManagerPendingApprovalsPage from './pages/manager/PendingApprovalsPage';
import OperatorApprovalsPage from './pages/manager/OperatorApprovalsPage';
import RegisterSecretaryPage from './pages/manager/secretary/RegisterSecretaryPage';
import RegisterAdminPage from './pages/director/RegisterAdminPage';
import { ManagerBeatsListPage } from './pages/manager/beats/BeatsListPage';
import { ManagerLocationsListPage } from './pages/manager/locations/LocationsListPage';
import { ManagerEditBitPage } from './pages/manager/beats/EditBitPage';
import { ManagerEditLocationPage } from './pages/manager/locations/EditLocationPage';
import { ManagerBeatDetailsPage } from './pages/manager/beats/BeatDetailsPage';
import { ManagerLocationDetailsPage } from './pages/manager/locations/LocationDetailsPage';
import ManagerMoneyInView from './pages/manager/MoneyInView';
import ManagerBeatExpensesPage from './pages/manager/BeatExpensesPage';
import { ManagerOnDutyPage } from './pages/manager/attendance';

// Supervisor imports
import SupervisorLayout from './pages/supervisor/SupervisorLayout';
import SupervisorDashboard from './pages/supervisor/Dashboard';
import RegisterOperatorPage from './pages/supervisor/operators/RegisterOperatorPage';
import OperatorsListPage from './pages/supervisor/operators/OperatorsListPage';
import MyOperatorsPage from './pages/supervisor/operators/MyOperatorsPage';
import SupervisorIDCardPage from './pages/supervisor/IDCardPage';
import SupervisorIDCardGenerator from './pages/supervisor/IDCardGenerator';
import SupervisorEnhancedSettingsPage from './pages/supervisor/EnhancedSettingsPage';

// Supervisor Reports Module
import { 
  ReportsListPage as SupervisorReportsListPage, 
  CreateReportPage as SupervisorCreateReportPage, 
  ReportDetailsPage as SupervisorReportDetailsPage, 
  ReportsAnalyticsPage as SupervisorReportsAnalyticsPage 
} from './pages/supervisor/reports';

// Director Operator Registration
import DirectorRegisterOperatorPage from './pages/director/operators/RegisterOperatorPage';
import GuardAssignmentPage from './pages/director/operators/GuardAssignmentPage';
import IncompleteOperatorsPage from './pages/director/operators/IncompleteOperatorsPage';
import EditOperatorPage from './pages/director/operators/EditOperatorPage';

// Manager Operator Registration
import ManagerRegisterOperatorPage from './pages/manager/operators/RegisterOperatorPage';

// General Supervisor imports
import {
  GSLayout,
  GSDashboard,
  SupervisorsList,
  SupervisorProfile,
  GSOperatorsList,
  GSLocationsList,
  GSAssignLocationPage,
  GSAttendancePage,
  GSIncidentsPage,
  GSActivityLogsPage,
  GSCommunicationPage,
  GSReportsPage,
  GSIDCardPage,
  GSIDCardGenerator,
  GSEnhancedSettingsPage,
  GSRegisterOperatorPage,
  GSAssignmentRequestsPage
} from './pages/general-supervisor';

// GS Supervisor Registration Page
import GSRegisterSupervisorPage from './pages/general-supervisor/supervisors/RegisterSupervisorPage';
import GSOperatorApprovalPage from './pages/general-supervisor/operators/OperatorApprovalPage';
import GSOperatorProfile from './pages/general-supervisor/operators/OperatorProfile';
import GSEnhancedCommunicationPage from './pages/general-supervisor/communication/EnhancedCommunicationPage';
import { GSOnDutyPage } from './pages/general-supervisor/attendance';

// General Supervisor Reports Module
import {
  ReportsListPage as GSReportsListPage,
  CreateReportPage as GSCreateReportPage,
  ReportDetailsPage as GSReportDetailsPage,
  ReportsAnalyticsPage as GSReportsAnalyticsPage
} from './pages/general-supervisor/reports';


// Secretary imports
import SecretaryLayout from './pages/secretary/SecretaryLayout';
import SecretaryDashboard from './pages/secretary/Dashboard';
import { LocationsListPage } from './pages/secretary/locations/LocationsListPage';
import { CreateLocationPage } from './pages/secretary/locations/CreateLocationPage';
import { EditLocationPage } from './pages/secretary/locations/EditLocationPage';
import { BeatsListPage } from './pages/secretary/beats/BeatsListPage';
import { CreateBitPage } from './pages/secretary/beats/CreateBitPage';
import { EditBitPage } from './pages/secretary/beats/EditBitPage';
import { DocumentsListPage } from './pages/secretary/documents/DocumentsListPage';
import { UploadDocumentPage } from './pages/secretary/documents/UploadDocumentPage';
import RecordMoneyIn from './pages/secretary/money-in/RecordMoneyIn';
import MoneyInList from './pages/secretary/money-in/MoneyInList';
import MoneyInDetail from './pages/secretary/money-in/MoneyInDetail';
import RecordMoneyOut from './pages/secretary/money-out/RecordMoneyOut';
import MoneyOutList from './pages/secretary/money-out/MoneyOutList';
import MoneyOutDetail from './pages/secretary/money-out/MoneyOutDetail';
import SalaryPanel from './pages/secretary/salary/SalaryPanel';
import FinancialOverview from './pages/secretary/FinancialOverview';
import DailyLogs from './pages/secretary/DailyLogs';
import MonthlyLogs from './pages/secretary/MonthlyLogs';
import ClientsListPage from './pages/secretary/clients/ClientsListPage';
import AddClientPage from './pages/secretary/clients/AddClientPage';
import ClientDetailPage from './pages/secretary/clients/ClientDetailPage';
import SecretaryMessagingPage from './pages/secretary/messaging/MessagingPage';
import SecretaryBeatExpensesPage from './pages/secretary/BeatExpensesPage';
import SecretaryRegisterOperatorPage from './pages/secretary/operators/RegisterOperatorPage';
import SecretaryOperatorsListPage from './pages/secretary/operators/OperatorsListPage';
import SecretarySupervisorsListPage from './pages/secretary/supervisors/SupervisorsListPage';
import SecretaryGeneralSupervisorsListPage from './pages/secretary/general-supervisors/GeneralSupervisorsListPage';
import SecretaryManagersListPage from './pages/secretary/managers/ManagersListPage';
import SecretaryAssignOperatorPage from './pages/secretary/assignments/AssignOperatorPage';

// Admin imports
import AdminLayout from './components/layout/AdminLayout';
import AdminDashboard from './pages/admin/Dashboard';
import AdminProfilePage from './pages/admin/ProfilePage';
import AdminBitsPage from './pages/admin/BitsPage';
import AdminOperatorsPage from './pages/admin/OperatorsPage';
import AdminSupervisorsPage from './pages/admin/SupervisorsPage';

// Director imports
import MoneyInReports from './pages/director/financial/MoneyInReports';
import MoneyOutReports from './pages/director/financial/MoneyOutReports';
import AllTransactionsPage from './pages/director/transactions/AllTransactionsPage';
import SalaryManagement from './pages/director/salary/SalaryManagement';
import SalaryView from './pages/manager/SalaryView';

// Director Beats and Locations imports
import { DirectorBeatsListPage } from './pages/director/beats/BeatsListPage';
import { DirectorLocationsListPage } from './pages/director/locations/LocationsListPage';
import { DirectorEditBitPage } from './pages/director/beats/EditBitPage';
import { DirectorEditLocationPage } from './pages/director/locations/EditLocationPage';
import { BeatDetailsPage } from './pages/director/beats/BeatDetailsPage';
import { LocationDetailsPage } from './pages/director/locations/LocationDetailsPage';
import BeatGuardsView from './pages/director/beats/BeatGuardsView';
import IDCardGenerator from './pages/director/IDCardGenerator';
import ManagerIDCardGenerator from './pages/manager/IDCardGenerator';
import SecretaryIDCardGenerator from './pages/secretary/IDCardGenerator';
import SecretarySettingsPage from './pages/secretary/SettingsPage';
import IDVerification from './pages/public/IDVerification';

// Assignment Module imports
import AssignGuardPage from './pages/manager/assignments/AssignGuardPage';
import AssignmentsListPage from './pages/manager/assignments/AssignmentsListPage';
import AssignmentDetailsPage from './pages/manager/assignments/AssignmentDetailsPage';
import AssignOperatorPage from './pages/general-supervisor/assignments/AssignOperatorPage';
import AssignmentApprovalsPage from './pages/general-supervisor/assignments/AssignmentApprovalsPage';
import RequestAssignmentPage from './pages/supervisor/assignments/RequestAssignmentPage';
import PendingAssignmentsPage from './pages/supervisor/assignments/PendingAssignmentsPage';

// Beats imports
import MyBitsPage from './pages/supervisor/beats/MyBitsPage';

// Director Layout wrapper component
function DirectorLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto bg-gray-50 pb-20 lg:pb-0">
          {children}
        </main>
        <BottomBar onMenuClick={() => setSidebarOpen(true)} />
      </div>
    </div>
  );
}

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();
  const { user } = useAuthStore();

  useEffect(() => {
    // Short delay to allow Zustand to rehydrate state from localStorage
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 200);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    console.log('📍 Current path:', location.pathname);
    console.log('👤 Current user:', user);
  }, [location.pathname, user]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  const isPublicRoute =
    location.pathname === '/login' ||
    location.pathname === '/download' ||
    location.pathname.startsWith('/dev/') ||
    location.pathname === '/dev/init-director' ||
    location.pathname.startsWith('/verify-id/');

  const routes = (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/download" element={<DownloadAppPage />} />
      <Route path="/dev/onboarding" element={<DevOnboardingPage />} />
      <Route path="/dev/init-director" element={<DevOnboardingPage />} />
      <Route path="/verify-id/:userId" element={<IDVerification />} />
      
      {/* Meeting Room */}
      <Route path="/meeting/:meetingLink" element={<MeetingRoomPage />} />
      
      {/* Secretary Routes */}
      <Route path="/secretary" element={<SecretaryLayout />}>
        <Route index element={<Navigate to="/secretary/dashboard" replace />} />
        <Route path="dashboard" element={<SecretaryDashboard />} />
        <Route path="financial-overview" element={<FinancialOverview />} />
        <Route path="daily-logs" element={<DailyLogs />} />
        <Route path="monthly-logs" element={<MonthlyLogs />} />
        <Route path="transactions" element={<SecretaryDashboard />} />
        <Route path="transactions/daily" element={<SecretaryDashboard />} />
        <Route path="transactions/monthly" element={<SecretaryDashboard />} />
        <Route path="transactions/reports" element={<SecretaryDashboard />} />
        <Route path="clients" element={<ClientsListPage />} />
        <Route path="clients/add" element={<AddClientPage />} />
        <Route path="clients/:id" element={<ClientDetailPage />} />
        <Route path="invoices" element={<SecretaryDashboard />} />
        <Route path="budgets" element={<SecretaryDashboard />} />
        <Route path="locations" element={<LocationsListPage />} />
        <Route path="locations/create" element={<CreateLocationPage />} />
        <Route path="locations/:id/edit" element={<EditLocationPage />} />
        <Route path="beats" element={<BeatsListPage />} />
        <Route path="beats/create" element={<CreateBitPage />} />
        <Route path="beats/:id/edit" element={<EditBitPage />} />
        <Route path="documents" element={<DocumentsListPage />} />
        <Route path="documents/upload" element={<UploadDocumentPage />} />
        <Route path="money-in" element={<MoneyInList />} />
        <Route path="money-in/record" element={<RecordMoneyIn />} />
        <Route path="money-in/:id" element={<MoneyInDetail />} />
        <Route path="money-in/:id/edit" element={<RecordMoneyIn />} />
        <Route path="money-out" element={<MoneyOutList />} />
        <Route path="money-out/record" element={<RecordMoneyOut />} />
        <Route path="money-out/detail/:id" element={<MoneyOutDetail />} />
        <Route path="money-out/edit/:id" element={<RecordMoneyOut />} />
        <Route path="salary" element={<SalaryPanel />} />
        <Route path="operators" element={<SecretaryOperatorsListPage />} />
        <Route path="operators/register" element={<SecretaryRegisterOperatorPage />} />
        <Route path="supervisors" element={<SecretarySupervisorsListPage />} />
        <Route path="general-supervisors" element={<SecretaryGeneralSupervisorsListPage />} />
        <Route path="managers" element={<SecretaryManagersListPage />} />
        <Route path="assignments/assign" element={<SecretaryAssignOperatorPage />} />
        <Route path="id-cards" element={<SecretaryIDCardGenerator />} />
        <Route path="messages" element={<SecretaryMessagingPage />} />
        <Route path="settings" element={<SecretarySettingsPage />} />
        <Route path="beat-expenses" element={<SecretaryBeatExpensesPage />} />
        
        {/* Secretary Reports Routes */}
        <Route path="reports" element={<SecretaryReportsListPage />} />
        <Route path="reports/create" element={<SecretaryCreateReportPage />} />
        <Route path="reports/analytics" element={<SecretaryReportsAnalyticsPage />} />
        <Route path="reports/:id" element={<SecretaryReportDetailsPage />} />
      </Route>
      
      {/* Admin Routes */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="beats" element={<AdminBitsPage />} />
        <Route path="operators" element={<AdminOperatorsPage />} />
        <Route path="supervisors" element={<AdminSupervisorsPage />} />
        <Route path="messages" element={<div className="p-8 text-center text-gray-500">Messages - Coming soon</div>} />
        <Route path="reports" element={<div className="p-8 text-center text-gray-500">Reports view - Coming soon</div>} />
        <Route path="profile" element={<AdminProfilePage />} />
        <Route path="security" element={<div className="p-8 text-center text-gray-500">Security settings - Coming soon</div>} />
        <Route path="login-history" element={<div className="p-8 text-center text-gray-500">Login history - Coming soon</div>} />
      </Route>
      
      {/* Manager Routes */}
      <Route path="/manager" element={<ManagerLayout />}>
        <Route index element={<Navigate to="/manager/dashboard" replace />} />
        <Route path="dashboard" element={<ManagerDashboard />} />
        <Route path="attendance" element={<ManagerOnDutyPage />} />
        <Route path="financial-overview" element={<FinancialOverview />} />
        <Route path="daily-logs" element={<DailyLogs />} />
        <Route path="monthly-logs" element={<MonthlyLogs />} />
        <Route path="supervisors" element={<SupervisorsListPage />} />
        <Route path="supervisors/register" element={<RegisterSupervisorPage />} />
        <Route path="supervisors/:supervisorId" element={<SupervisorDetailPage />} />
        <Route path="operators" element={<ManagerOperatorsListPage />} />
        <Route path="operators/register" element={<ManagerRegisterOperatorPage />} />
        <Route path="pending-approvals" element={<ManagerPendingApprovalsPage />} />
        <Route path="operator-approvals" element={<OperatorApprovalsPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="locations" element={<ManagerLocationsListPage />} />
        <Route path="locations/:id/details" element={<ManagerLocationDetailsPage />} />
        <Route path="locations/:id/edit" element={<ManagerEditLocationPage />} />
        <Route path="beats" element={<ManagerBeatsListPage />} />
        <Route path="beats/:id/details" element={<ManagerBeatDetailsPage />} />
        <Route path="beats/:id/edit" element={<ManagerEditBitPage />} />
        <Route path="messages" element={<ManagerMessagingPage />} />
        <Route path="communication" element={<ManagerCommunicationPage />} />
        <Route path="settings" element={<ManagerSettingsPage />} />
        <Route path="id-cards" element={<ManagerIDCardGenerator />} />
        <Route path="secretary/register" element={<RegisterSecretaryPage />} />
        <Route path="money-in" element={<ManagerMoneyInView />} />
        <Route path="salary" element={<SalaryView />} />
        <Route path="assignments" element={<AssignmentsListPage />} />
        <Route path="assignments/assign" element={<AssignGuardPage />} />
        <Route path="assignments/:id" element={<AssignmentDetailsPage />} />
        <Route path="beat-expenses" element={<ManagerBeatExpensesPage />} />
        <Route path="reports" element={<ManagerReportsListPage />} />
        <Route path="reports/analytics" element={<ManagerReportsAnalyticsPage />} />
        <Route path="reports/create" element={<ManagerCreateReportPage />} />
        <Route path="reports/review" element={<ManagerReviewReportsPage />} />
        <Route path="reports/:id" element={<ManagerReportDetailsPage />} />
      </Route>
      
      {/* Supervisor Routes */}
      <Route path="/supervisor" element={<SupervisorLayout />}>
        <Route index element={<Navigate to="/supervisor/dashboard" replace />} />
        <Route path="dashboard" element={<SupervisorDashboard />} />
        <Route path="operators" element={<OperatorsListPage />} />
        <Route path="operators/register" element={<RegisterOperatorPage />} />
        <Route path="operators/my-operators" element={<MyOperatorsPage />} />
        <Route path="id-card" element={<SupervisorIDCardPage />} />
        <Route path="id-cards" element={<SupervisorIDCardGenerator />} />
        <Route path="settings" element={<SupervisorEnhancedSettingsPage />} />
        <Route path="assignments/request" element={<RequestAssignmentPage />} />
        <Route path="assignments/pending" element={<PendingAssignmentsPage />} />
        <Route path="beats" element={<MyBitsPage />} />
        <Route path="reports" element={<SupervisorReportsListPage />} />
        <Route path="reports/create" element={<SupervisorCreateReportPage />} />
        <Route path="reports/analytics" element={<SupervisorReportsAnalyticsPage />} />
        <Route path="reports/:id" element={<SupervisorReportDetailsPage />} />
        <Route path="messaging" element={<ManagerMessagingPage />} />
      </Route>
      
      {/* General Supervisor Routes */}
      <Route path="/general-supervisor" element={<GSLayout />}>
        <Route index element={<Navigate to="/general-supervisor/dashboard" replace />} />
        <Route path="dashboard" element={<GSDashboard />} />
        <Route path="supervisors" element={<SupervisorsList />} />
        <Route path="supervisors/profiles" element={<SupervisorsList />} />
        <Route path="supervisors/register" element={<GSRegisterSupervisorPage />} />
        <Route path="supervisors/assign" element={<GSAssignLocationPage />} />
        <Route path="supervisors/activity" element={<Navigate to="/general-supervisor/activity-logs" replace />} />
        <Route path="supervisors/:id" element={<SupervisorProfile />} />
        <Route path="operators" element={<GSOperatorsList />} />
        <Route path="operators/:id" element={<GSOperatorProfile />} />
        <Route path="operators/approval" element={<GSOperatorApprovalPage />} />
        <Route path="operators/register" element={<GSRegisterOperatorPage />} />
        <Route path="locations" element={<GSLocationsList />} />
        <Route path="locations/assignments" element={<GSAssignLocationPage />} />
        <Route path="attendance" element={<GSOnDutyPage />} />
        <Route path="attendance/operators" element={<GSAttendancePage />} />
        <Route path="incidents" element={<GSIncidentsPage />} />
        <Route path="activity-logs" element={<GSActivityLogsPage />} />
        <Route path="communication" element={<GSCommunicationPage />} />
        <Route path="communication/enhanced" element={<GSEnhancedCommunicationPage />} />
        <Route path="reports" element={<GSReportsListPage />} />
        <Route path="reports/create" element={<GSCreateReportPage />} />
        <Route path="reports/analytics" element={<GSReportsAnalyticsPage />} />
        <Route path="reports/:id" element={<GSReportDetailsPage />} />
        <Route path="id-card" element={<GSIDCardPage />} />
        <Route path="id-cards" element={<GSIDCardGenerator />} />
        <Route path="settings" element={<GSEnhancedSettingsPage />} />
        <Route path="assignments/assign" element={<AssignOperatorPage />} />
        <Route path="assignments/approvals" element={<AssignmentApprovalsPage />} />
        <Route path="assignments/requests" element={<GSAssignmentRequestsPage />} />
        <Route path="messaging" element={<ManagerMessagingPage />} />
      </Route>
      
      {/* Director Routes */}
      <Route path="/director/dashboard" element={<DirectorLayout><DirectorDashboard /></DirectorLayout>} />
      <Route path="/director/attendance" element={<DirectorLayout><OnDutyPage /></DirectorLayout>} />
      <Route path="/director/reports" element={<DirectorLayout><ReportsListPage /></DirectorLayout>} />
      <Route path="/director/reports/analytics" element={<DirectorLayout><ReportsAnalyticsPage /></DirectorLayout>} />
      <Route path="/director/reports/create" element={<DirectorLayout><CreateReportPage /></DirectorLayout>} />
      <Route path="/director/reports/review" element={<DirectorLayout><DirectorReviewReportsPage /></DirectorLayout>} />
      <Route path="/director/reports/:id" element={<DirectorLayout><ReportDetailsPage /></DirectorLayout>} />
      <Route path="/director/reports/:id/edit" element={<DirectorLayout><EditReportPage /></DirectorLayout>} />
      <Route path="/director/financial-overview" element={<DirectorLayout><FinancialOverview /></DirectorLayout>} />
      <Route path="/director/daily-logs" element={<DirectorLayout><DailyLogs /></DirectorLayout>} />
      <Route path="/director/monthly-logs" element={<DirectorLayout><MonthlyLogs /></DirectorLayout>} />
      <Route path="/director/personnel/register-manager" element={<DirectorLayout><RegisterManagerPage /></DirectorLayout>} />
      <Route path="/director/personnel/pending-approvals" element={<DirectorLayout><PendingApprovalsPage /></DirectorLayout>} />
      <Route path="/director/personnel/all" element={<DirectorLayout><WorkersPage /></DirectorLayout>} />
      <Route path="/director/admin/register" element={<DirectorLayout><RegisterAdminPage /></DirectorLayout>} />
      <Route path="/director/operators/register" element={<DirectorLayout><DirectorRegisterOperatorPage /></DirectorLayout>} />
      <Route path="/director/operators/assign" element={<DirectorLayout><GuardAssignmentPage /></DirectorLayout>} />
      <Route path="/director/operators/incomplete" element={<DirectorLayout><IncompleteOperatorsPage /></DirectorLayout>} />
      <Route path="/director/operators/edit/:userId" element={<DirectorLayout><EditOperatorPage /></DirectorLayout>} />
      <Route path="/director/messaging" element={<DirectorLayout><MessagingPage /></DirectorLayout>} />
      <Route path="/director/communications/messages" element={<DirectorLayout><MessagingPage /></DirectorLayout>} />
      <Route path="/director/communications/center" element={<DirectorLayout><DirectorCommunicationPage /></DirectorLayout>} />
      <Route path="/director/meetings/instant" element={<DirectorLayout><InstantMeetingPage /></DirectorLayout>} />
      <Route path="/director/meetings/create" element={<DirectorLayout><CreateMeetingPage /></DirectorLayout>} />
      <Route path="/director/meetings/list" element={<DirectorLayout><MyMeetingsPage /></DirectorLayout>} />
      <Route path="/director/polls/create" element={<DirectorLayout><CreatePollPage /></DirectorLayout>} />
      <Route path="/director/polls/active" element={<DirectorLayout><ActivePollsPage /></DirectorLayout>} />
      <Route path="/director/polls/results" element={<DirectorLayout><PollResultsPage /></DirectorLayout>} />
      <Route path="/director/polls/results/:id" element={<DirectorLayout><PollResultsPage /></DirectorLayout>} />
      <Route path="/director/transactions/all" element={<DirectorLayout><AllTransactionsPage /></DirectorLayout>} />
      <Route path="/director/transactions/expenses" element={<DirectorLayout><ExpensesPage /></DirectorLayout>} />
      <Route path="/director/financial/money-in" element={<DirectorLayout><MoneyInReports /></DirectorLayout>} />
      <Route path="/director/financial/money-out" element={<DirectorLayout><MoneyOutReports /></DirectorLayout>} />
      <Route path="/director/salary" element={<DirectorLayout><SalaryManagement /></DirectorLayout>} />
      <Route path="/director/money-in/record" element={<DirectorLayout><RecordMoneyIn /></DirectorLayout>} />
      <Route path="/director/money-in/:id" element={<DirectorLayout><MoneyInDetail /></DirectorLayout>} />
      <Route path="/director/locations" element={<DirectorLayout><DirectorLocationsListPage /></DirectorLayout>} />
      <Route path="/director/locations/:id/details" element={<DirectorLayout><LocationDetailsPage /></DirectorLayout>} />
      <Route path="/director/locations/:id/edit" element={<DirectorLayout><DirectorEditLocationPage /></DirectorLayout>} />
      <Route path="/director/beats" element={<DirectorLayout><DirectorBeatsListPage /></DirectorLayout>} />
      <Route path="/director/beats/:id/details" element={<DirectorLayout><BeatDetailsPage /></DirectorLayout>} />
      <Route path="/director/beats/:id/edit" element={<DirectorLayout><DirectorEditBitPage /></DirectorLayout>} />
      <Route path="/director/beats/guards" element={<DirectorLayout><BeatGuardsView /></DirectorLayout>} />
      <Route path="/director/id-cards" element={<DirectorLayout><IDCardGenerator /></DirectorLayout>} />
      <Route path="/director/settings" element={<DirectorLayout><SettingsPage /></DirectorLayout>} />
      <Route path="/director/beat-expenses" element={<DirectorLayout><DirectorBeatExpensesPage /></DirectorLayout>} />
      <Route path="/director/notifications" element={<DirectorLayout><DirectorNotificationsPage /></DirectorLayout>} />
      
      {/* Root redirects */}
      <Route path="/" element={<RoleBasedRedirect />} />
      <Route path="/dashboard" element={<RoleBasedRedirect />} />
      
      {/* Catch-all */}
      <Route path="*" element={<RoleBasedRedirect />} />
    </Routes>
  );

  const content = (
    <>
      <VersionAnnouncement>
        <FeatureAnnouncement>
          {routes}
        </FeatureAnnouncement>
      </VersionAnnouncement>
      <InstallPromptBanner />
    </>
  );

  if (isPublicRoute || !user) {
    return content;
  }

  return <MandatoryPollModal>{content}</MandatoryPollModal>;
}

// Component to redirect based on user role
function RoleBasedRedirect() {
  const { user } = useAuthStore();
  
  console.log('🔄 RoleBasedRedirect - user:', user);
  
  if (!user) {
    console.log('🔄 No user, redirecting to login');
    return <Navigate to="/login" replace />;
  }
  
  switch (user.role) {
    case 'MANAGER':
      console.log('🔄 Manager detected, redirecting to /manager/dashboard');
      return <Navigate to="/manager/dashboard" replace />;
    case 'GENERAL_SUPERVISOR':
      console.log('🔄 General Supervisor detected, redirecting to /general-supervisor/dashboard');
      return <Navigate to="/general-supervisor/dashboard" replace />;
    case 'DIRECTOR':
    case 'DEVELOPER':
      console.log('🔄 Director/Developer detected, redirecting to /director/dashboard');
      return <Navigate to="/director/dashboard" replace />;
    case 'SUPERVISOR':
      return <Navigate to="/supervisor/dashboard" replace />;
    case 'OPERATOR':
      return <Navigate to="/operator/dashboard" replace />;
    case 'SECRETARY':
      return <Navigate to="/secretary/dashboard" replace />;
    case 'ADMIN':
      console.log('🔄 Admin detected, redirecting to /admin/dashboard');
      return <Navigate to="/admin/dashboard" replace />;
    default:
      console.log('🔄 Unknown role, redirecting to login');
      return <Navigate to="/login" replace />;
  }
}

export default App;
