import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import LoginPage from './pages/auth/LoginPage';
import DevOnboardingPage from './pages/dev/DevOnboardingPage';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import BottomBar from './components/BottomBar';
import DirectorDashboard from './pages/director/Dashboard';
import WorkersPage from './pages/director/WorkersPage';
import ExpensesPage from './pages/director/ExpensesPage';
import SettingsPage from './pages/director/SettingsPage';
import RegisterManagerPage from './pages/director/RegisterManagerPage';
import PendingApprovalsPage from './pages/director/PendingApprovalsPage';
import LoadingScreen from './components/LoadingScreen';
import MandatoryPollModal from './components/MandatoryPollModal';

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
import { ManagerBitsListPage } from './pages/manager/bits/BitsListPage';
import { ManagerLocationsListPage } from './pages/manager/locations/LocationsListPage';
import { ManagerEditBitPage } from './pages/manager/bits/EditBitPage';
import { ManagerEditLocationPage } from './pages/manager/locations/EditLocationPage';
import ManagerMoneyInView from './pages/manager/MoneyInView';

// Supervisor imports
import SupervisorLayout from './pages/supervisor/SupervisorLayout';
import SupervisorDashboard from './pages/supervisor/Dashboard';
import RegisterOperatorPage from './pages/supervisor/operators/RegisterOperatorPage';
import OperatorsListPage from './pages/supervisor/operators/OperatorsListPage';
import MyOperatorsPage from './pages/supervisor/operators/MyOperatorsPage';
import SupervisorIDCardPage from './pages/supervisor/IDCardPage';
import SupervisorIDCardGenerator from './pages/supervisor/IDCardGenerator';
import SupervisorEnhancedSettingsPage from './pages/supervisor/EnhancedSettingsPage';

// Director Operator Registration
import DirectorRegisterOperatorPage from './pages/director/operators/RegisterOperatorPage';

// General Supervisor imports
import {
  GSLayout,
  GSDashboard,
  SupervisorsList,
  SupervisorProfile,
  GSOperatorsList,
  GSLocationsList,
  GSAttendancePage,
  GSIncidentsPage,
  GSActivityLogsPage,
  GSCommunicationPage,
  GSReportsPage,
  GSIDCardPage,
  GSIDCardGenerator,
  GSEnhancedSettingsPage
} from './pages/general-supervisor';

// GS Supervisor Registration Page
import GSRegisterSupervisorPage from './pages/general-supervisor/supervisors/RegisterSupervisorPage';
import GSOperatorApprovalPage from './pages/general-supervisor/operators/OperatorApprovalPage';
import GSEnhancedCommunicationPage from './pages/general-supervisor/communication/EnhancedCommunicationPage';

// Secretary imports
import SecretaryLayout from './pages/secretary/SecretaryLayout';
import SecretaryDashboard from './pages/secretary/Dashboard';
import { LocationsListPage } from './pages/secretary/locations/LocationsListPage';
import { CreateLocationPage } from './pages/secretary/locations/CreateLocationPage';
import { BitsListPage } from './pages/secretary/bits/BitsListPage';
import { CreateBitPage } from './pages/secretary/bits/CreateBitPage';
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

// Director imports
import MoneyInReports from './pages/director/financial/MoneyInReports';
import MoneyOutReports from './pages/director/financial/MoneyOutReports';
import SalaryManagement from './pages/director/salary/SalaryManagement';
import SalaryView from './pages/manager/SalaryView';

// Director Bits and Locations imports
import { DirectorBitsListPage } from './pages/director/bits/BitsListPage';
import { DirectorLocationsListPage } from './pages/director/locations/LocationsListPage';
import { DirectorEditBitPage } from './pages/director/bits/EditBitPage';
import { DirectorEditLocationPage } from './pages/director/locations/EditLocationPage';
import BitGuardsView from './pages/director/bits/BitGuardsView';
import IDCardGenerator from './pages/director/IDCardGenerator';
import ManagerIDCardGenerator from './pages/manager/IDCardGenerator';
import SecretaryIDCardGenerator from './pages/secretary/IDCardGenerator';
import SecretarySettingsPage from './pages/secretary/SettingsPage';
import IDVerification from './pages/public/IDVerification';

// Assignment Module imports
import AssignGuardPage from './pages/manager/assignments/AssignGuardPage';
import AssignmentsListPage from './pages/manager/assignments/AssignmentsListPage';
import AssignOperatorPage from './pages/general-supervisor/assignments/AssignOperatorPage';
import AssignmentApprovalsPage from './pages/general-supervisor/assignments/AssignmentApprovalsPage';
import RequestAssignmentPage from './pages/supervisor/assignments/RequestAssignmentPage';

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
    location.pathname.startsWith('/dev/') ||
    location.pathname === '/dev/init-director' ||
    location.pathname.startsWith('/verify-id/');

  const content = (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />
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
        <Route path="bits" element={<BitsListPage />} />
        <Route path="bits/create" element={<CreateBitPage />} />
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
        <Route path="id-cards" element={<SecretaryIDCardGenerator />} />
        <Route path="messages" element={<SecretaryDashboard />} />
        <Route path="settings" element={<SecretarySettingsPage />} />
      </Route>
      
      {/* Manager Routes */}
      <Route path="/manager" element={<ManagerLayout />}>
        <Route index element={<Navigate to="/manager/dashboard" replace />} />
        <Route path="dashboard" element={<ManagerDashboard />} />
        <Route path="financial-overview" element={<FinancialOverview />} />
        <Route path="daily-logs" element={<DailyLogs />} />
        <Route path="monthly-logs" element={<MonthlyLogs />} />
        <Route path="supervisors" element={<SupervisorsListPage />} />
        <Route path="supervisors/register" element={<RegisterSupervisorPage />} />
        <Route path="supervisors/:supervisorId" element={<SupervisorDetailPage />} />
        <Route path="operators" element={<ManagerOperatorsListPage />} />
        <Route path="pending-approvals" element={<ManagerPendingApprovalsPage />} />
        <Route path="operator-approvals" element={<OperatorApprovalsPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="locations" element={<ManagerLocationsListPage />} />
        <Route path="locations/:id/edit" element={<ManagerEditLocationPage />} />
        <Route path="bits" element={<ManagerBitsListPage />} />
        <Route path="bits/:id/edit" element={<ManagerEditBitPage />} />
        <Route path="messages" element={<ManagerMessagingPage />} />
        <Route path="communication" element={<ManagerCommunicationPage />} />
        <Route path="settings" element={<ManagerSettingsPage />} />
        <Route path="id-cards" element={<ManagerIDCardGenerator />} />
        <Route path="secretary/register" element={<RegisterSecretaryPage />} />
        <Route path="money-in" element={<ManagerMoneyInView />} />
        <Route path="salary" element={<SalaryView />} />
        <Route path="assignments" element={<AssignmentsListPage />} />
        <Route path="assignments/assign" element={<AssignGuardPage />} />
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
        <Route path="messaging" element={<ManagerMessagingPage />} />
      </Route>
      
      {/* General Supervisor Routes */}
      <Route path="/general-supervisor" element={<GSLayout />}>
        <Route index element={<Navigate to="/general-supervisor/dashboard" replace />} />
        <Route path="dashboard" element={<GSDashboard />} />
        <Route path="supervisors" element={<SupervisorsList />} />
        <Route path="supervisors/register" element={<GSRegisterSupervisorPage />} />
        <Route path="supervisors/:id" element={<SupervisorProfile />} />
        <Route path="operators" element={<GSOperatorsList />} />
        <Route path="operators/approval" element={<GSOperatorApprovalPage />} />
        <Route path="locations" element={<GSLocationsList />} />
        <Route path="attendance" element={<GSAttendancePage />} />
        <Route path="incidents" element={<GSIncidentsPage />} />
        <Route path="activity-logs" element={<GSActivityLogsPage />} />
        <Route path="communication" element={<GSCommunicationPage />} />
        <Route path="communication/enhanced" element={<GSEnhancedCommunicationPage />} />
        <Route path="reports" element={<GSReportsPage />} />
        <Route path="id-card" element={<GSIDCardPage />} />
        <Route path="id-cards" element={<GSIDCardGenerator />} />
        <Route path="settings" element={<GSEnhancedSettingsPage />} />
        <Route path="assignments/assign" element={<AssignOperatorPage />} />
        <Route path="assignments/approvals" element={<AssignmentApprovalsPage />} />
        <Route path="messaging" element={<ManagerMessagingPage />} />
      </Route>
      
      {/* Director Routes */}
      <Route path="/director/dashboard" element={<DirectorLayout><DirectorDashboard /></DirectorLayout>} />
      <Route path="/director/financial-overview" element={<DirectorLayout><FinancialOverview /></DirectorLayout>} />
      <Route path="/director/daily-logs" element={<DirectorLayout><DailyLogs /></DirectorLayout>} />
      <Route path="/director/monthly-logs" element={<DirectorLayout><MonthlyLogs /></DirectorLayout>} />
      <Route path="/director/personnel/register-manager" element={<DirectorLayout><RegisterManagerPage /></DirectorLayout>} />
      <Route path="/director/personnel/pending-approvals" element={<DirectorLayout><PendingApprovalsPage /></DirectorLayout>} />
      <Route path="/director/personnel/all" element={<DirectorLayout><WorkersPage /></DirectorLayout>} />
      <Route path="/director/operators/register" element={<DirectorLayout><DirectorRegisterOperatorPage /></DirectorLayout>} />
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
      <Route path="/director/transactions/expenses" element={<DirectorLayout><ExpensesPage /></DirectorLayout>} />
      <Route path="/director/financial/money-in" element={<DirectorLayout><MoneyInReports /></DirectorLayout>} />
      <Route path="/director/financial/money-out" element={<DirectorLayout><MoneyOutReports /></DirectorLayout>} />
      <Route path="/director/salary" element={<DirectorLayout><SalaryManagement /></DirectorLayout>} />
      <Route path="/director/money-in/record" element={<DirectorLayout><RecordMoneyIn /></DirectorLayout>} />
      <Route path="/director/money-in/:id" element={<DirectorLayout><MoneyInDetail /></DirectorLayout>} />
      <Route path="/director/locations" element={<DirectorLayout><DirectorLocationsListPage /></DirectorLayout>} />
      <Route path="/director/locations/:id/edit" element={<DirectorLayout><DirectorEditLocationPage /></DirectorLayout>} />
      <Route path="/director/bits" element={<DirectorLayout><DirectorBitsListPage /></DirectorLayout>} />
      <Route path="/director/bits/:id/edit" element={<DirectorLayout><DirectorEditBitPage /></DirectorLayout>} />
      <Route path="/director/bits/guards" element={<DirectorLayout><BitGuardsView /></DirectorLayout>} />
      <Route path="/director/id-cards" element={<DirectorLayout><IDCardGenerator /></DirectorLayout>} />
      <Route path="/director/settings" element={<DirectorLayout><SettingsPage /></DirectorLayout>} />
      
      {/* Root redirects */}
      <Route path="/" element={<RoleBasedRedirect />} />
      <Route path="/dashboard" element={<RoleBasedRedirect />} />
      
      {/* Catch-all */}
      <Route path="*" element={<RoleBasedRedirect />} />
    </Routes>
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
    default:
      console.log('🔄 Unknown role, redirecting to login');
      return <Navigate to="/login" replace />;
  }
}

export default App;
