import React, { useEffect, useState } from 'react';
import { config } from '../config';
import { api } from '../api/api';
import * as microsoftTeams from "@microsoft/teams-js";
import { errorNotification } from '../components/notifications/notifications';

const Login = () => {
  // const [clientSideToken, setClientSideToken] = useState('');
  const currentYear = new Date().getFullYear();
  const isTeams = window.self !== window.top;

  useEffect(() => {
    // Check if inside Microsoft Teams
    if (isTeams) {
      microsoftTeams.app.initialize().then(() => {
        refreshAuthTokens();
      });
    }
  }, []);

  const refreshAuthTokens = () => {
    getClientSideToken()
      .then((token) => {
        // setClientSideToken(token); // Save token to state
        return getServerSideToken(token);
      })
      .then((profile) => {
        handleServerSideToken(profile);
      })
      .catch((error) => {
        errorNotification({
          title: "Login Failed",
          message: "You don't have an account.",
        });
        localStorage.clear();
        sessionStorage.clear();
        window.location.replace("/");
      });
  };

  const getClientSideToken = () => {
    return microsoftTeams.authentication.getAuthToken();
  };

  const getServerSideToken = (clientSideToken) => {
    // Always get a fresh server-side token using client-side token
    return api("msTeamsToken", null, { token: clientSideToken });
  };

  const handleServerSideToken = (profile) => {
    localStorage.setItem("authenticated", "true");
    localStorage.setItem("auth_accessToken", profile.token.accessToken);
    localStorage.setItem("auth_user", JSON.stringify(profile.user));
    window.location.replace("/calendar");
  };

  const msLogin = async () => {
    if (window.self !== window.top) return; // Disable button in Teams
    let postData = { type: "api", base_url: config.APP_URL };
    api("mslogin", null, postData)
      .then((result) => {
        window.location.href = result.url;
      })
      .catch((err) => { console.error("Login failed:", err); });
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-white via-gray-50 to-gray-100 text-gray-800">
      {/* Main Section */}
      <main className="flex-grow flex items-center justify-center px-4">
        <div className="bg-white shadow-md border border-gray-200 rounded-xl p-6 sm:p-8 w-full max-w-md text-center flex flex-col justify-between">
          {/* Top Logo */}
          <img
            src="/assets/img/logo.png"
            alt="Aidea Logo"
            className="w-36 sm:w-48 object-contain mx-auto mb-3"
          />

          {/* Teams Client Label */}
          {/* {isTeams && (
            <div className="mb-2 p-2 bg-blue-50 border border-blue-200 rounded text-blue-700 text-sm font-medium">
              You are using this app inside Microsoft Teams
            </div>
          )}

          <div className="my-4 p-2 bg-gray-100 rounded text-xs break-all">
            <strong>Client Side Token:</strong>
            <div>{clientSideToken}</div>
          </div> */}

          {/* Sign in message and button */}
          {!isTeams && (
            <div className="space-y-4 mt-4">
              <button
                onClick={msLogin}
                className="w-full flex items-center justify-center gap-3 border border-gray-700 text-gray-950 font-semibold py-2 px-6 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all duration-200"
              >
                <img
                  src="/assets/img/icons/microsoft.svg"
                  alt="Microsoft Logo"
                  className="h-5 w-5"
                />
                <span className="truncate">Sign in with Microsoft</span>
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="text-sm text-gray-500 text-center py-6">
        &copy; {currentYear} Aidea. All Rights Reserved.
      </footer>
    </div>
  );
};

export default Login;
