import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { authorizeAdmin, authorizeManage } from "./utilities/authorization";
import Login from './pages/Login';
import Callback from './pages/Callback';
import Layout from './components/layouts/Layout';
import Dashboard from './pages/Dashboard';
import './index.css';
import { api } from './api/api';
import { errorNotification } from './components/notifications/notifications';

import { useEffect } from 'react';
import * as microsoftTeams from "@microsoft/teams-js";

import ApprovalList from './pages/approval/ApprovalList';
import Projects from './pages/projects/projectExternal/Projects';
import Calendar from './pages/calendar/Calendar';

import ETF from './pages/projects/projectEtf/ETF'
import ProjectBudget from './pages/projects/projectBudget/ProjectBudget';

import Users from './pages/admin/users/Users';
import Departments from './pages/admin/departments/Departments';
import Export from './pages/admin/export/Export';
import Holidays from './pages/admin/holidays/Holidays';

import { AppDataProvider } from './context/AppDataContext';
import ProjectsInternal from './pages/projects/projectInternal/ProjectsInternal';
import DepartmentalTasks from './pages/projects/departmentalTask/DepartmentalTasks';
import Subsidiaries from './pages/admin/subsidiaries/Subsidiaries';
import NotFound from './components/layouts/NotFound';

const PrivateRoute = ({ children }) => {
  const isAuthenticated = localStorage.getItem('authenticated');
  return isAuthenticated ? children : <Navigate to="/" />;
};

const getUser = () => {
  try {
    return JSON.parse(localStorage.getItem('auth_user'));
  } catch {
    return null;
  }
};

const App = () => {
  const user = getUser();

  // 🔁 Run on app load to refresh token if inside Microsoft Teams
  useEffect(() => {
    if (window.self !== window.top) {
      // Attempt to clear localStorage and sessionStorage (browser cache for this app)
      microsoftTeams.app.initialize().then(() => {
        refreshAuthTokens();
      });
    }
  }, []);

  const refreshAuthTokens = () => {
    getClientSideToken()
      .then((clientSideToken) => {
        return getServerSideToken(clientSideToken);
      })
      .then((profile) => {
        handleServerSideToken(profile);
      })
      .catch((error) => {
        // errorNotification({
        //   title: "Login Failed",
        //   message: "You don't have an account.",
        // });
        localStorage.clear();
        sessionStorage.clear();
        window.location.replace("/");
      });
  };

  const getClientSideToken = () => {
    return microsoftTeams.authentication.getAuthToken();
  };

  const getServerSideToken = (clientSideToken) => {
    return api("msTeamsToken", null, { token: clientSideToken });
  };

  const handleServerSideToken = (profile) => {
    localStorage.setItem("authenticated", "true");
    localStorage.setItem("auth_accessToken", profile.token.accessToken);
    localStorage.setItem("auth_user", JSON.stringify(profile.user));
    // ✅ Optional: Remove redirect if you don't want a reload
    // window.location.replace("/calendar");
  };

  return (
    <AppDataProvider>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          {/* Public Routes */}
          <Route
            path="/"
            element={
              localStorage.getItem('authenticated') ? (<Navigate to="/calendar" />)
                :
                <Login />
            }
          />
          <Route path="/ms/login/callback" element={<Callback />} />

          {/* Calendar: any authenticated user */}
          <Route
            path="/calendar"
            element={
              <PrivateRoute>
                <Layout title="Time Charging">
                  <Calendar />
                </Layout>
              </PrivateRoute>
            }
          />

          <Route
            path="/projects/budget"
            element={
              <PrivateRoute>
                <Layout title="Project Details & Budget">
                  <ProjectBudget />
                </Layout>
              </PrivateRoute>
            }
          />

          <Route
            path="/projects/etf"
            element={
              <PrivateRoute>
                <Layout title="ETF">
                  <ETF />
                </Layout>
              </PrivateRoute>
            }
          />

          {/* Approval List: manager or admin only */}
          <Route
            path="/approval-list"
            element={
              <PrivateRoute>
                {
                  authorizeManage(user) === true
                    ? <Layout title="Approval List"><ApprovalList /></Layout>
                    : authorizeManage(user)
                }
              </PrivateRoute>
            }
          />

          {/* Projects: manager or admin only */}
          <Route
            path="/projects/external"
            element={
              <PrivateRoute>
                {
                  authorizeManage(user) === true
                    ? <Layout title="Projects External"><Projects /></Layout>
                    : authorizeManage(user)
                }
              </PrivateRoute>
            }
          />

          <Route
            path="projects/internal"
            element={
              <PrivateRoute>
                {
                  authorizeManage(user) === true
                    ? <Layout title="Projects Internal"><ProjectsInternal /></Layout>
                    : authorizeManage(user)
                }
              </PrivateRoute>
            }
          />

          <Route
            path="tasks/departmental"
            element={
              <PrivateRoute>
                {
                  authorizeManage(user) === true
                    ? <Layout title="Departmental Tasks"><DepartmentalTasks /></Layout>
                    : authorizeManage(user)
                }
              </PrivateRoute>
            }
          />

          <Route
            path="/users"
            element={
              <PrivateRoute>
                {
                  authorizeAdmin(user) === true
                    ? <Layout title="Users"><Users /></Layout>
                    : authorizeAdmin(user)
                }
              </PrivateRoute>
            }
          />

          <Route
            path="/departments"
            element={
              <PrivateRoute>
                {
                  authorizeAdmin(user) === true
                    ? <Layout title="Departments"><Departments /></Layout>
                    : authorizeAdmin(user)
                }
              </PrivateRoute>
            }
          />

          <Route
            path="/subsidiaries"
            element={
              <PrivateRoute>
                {
                  authorizeAdmin(user) === true
                    ? <Layout title="Subsidiaries"><Subsidiaries /></Layout>
                    : authorizeAdmin(user)
                }
              </PrivateRoute>
            }
          />

          <Route
            path="/holidays"
            element={
              <PrivateRoute>
                {
                  authorizeAdmin(user) === true
                    ? <Layout title="Holidays"><Holidays /></Layout>
                    : authorizeAdmin(user)
                }
              </PrivateRoute>
            }
          />

          {/* Catch-all route for not found endpoints */}
          <Route
            path="*"
            element={
              <NotFound />
            }
          />
        </Routes>
      </Router>
    </AppDataProvider>
  );
};

export default App;
