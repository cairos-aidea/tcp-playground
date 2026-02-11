import React, { useEffect } from 'react';
import { api } from '../api/api';
import { errorNotification } from '../components/notifications/notifications';

const Callback = () => {
  const processParams = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    const teamsUserId = urlParams.get('teamsUserId');
    const teamsUserName = urlParams.get('teamsUserName');
    const teamsUserPrincipalName = urlParams.get('teamsUserPrincipalName');

    // If Teams user info is present, skip code and use Teams info for login
    if (teamsUserId) {
      const payload = {
        type: 'teams',
        teamsUser: {
          id: teamsUserId,
          displayName: teamsUserName,
          userPrincipalName: teamsUserPrincipalName,
        },
      };
      api("msLoginValidate", null, payload)
        .then((result) => {
          localStorage.setItem("authenticated", true);
          localStorage.setItem("auth_accessToken", result.token.accessToken);
          localStorage.setItem("auth_user", JSON.stringify(result.user));
          window.location.replace("/calendar");
        })
        .catch(() => {
            errorNotification({
            title: "Login Failed",
            message: "You don't have an account.",
            });
          setTimeout(() => {
            localStorage.clear();
            sessionStorage.clear();
            window.location.replace("/");
          }, 2000);
        });
      return;
    }

    // Standard Microsoft login flow
    if (!code) {
      errorNotification({
        title: "Login Failed",
        message: "You don't have an account.",
      });
      setTimeout(() => {
        errorNotification({
          title: 'Returning to Login',
          message: 'Returning to login...',
        });
        localStorage.clear();
        sessionStorage.clear();
        window.location.replace("/");
      }, 2000);
      return;
    }

    // Prevent re-processing the same code
    const codeKey = `ms_code_${code}`;
    if (sessionStorage.getItem(codeKey)) {
      console.warn("Authorization code already processed.");
      return;
    }

    // Store the code in session to prevent re-use
    sessionStorage.setItem(codeKey, 'true');

    const payload = {
      code,
      state,
      type: 'api',
    };

    api("msLoginValidate", null, payload)
      .then((result) => {
        localStorage.setItem("authenticated", true);
        localStorage.setItem("auth_accessToken", result.token.accessToken);
        localStorage.setItem("auth_user", JSON.stringify(result.user));
        window.location.replace("/calendar");
      })
      .catch(() => {
        sessionStorage.removeItem(codeKey);

        errorNotification({
          title: "Login Failed",
          message: "You don't have an account.",
        });

        setTimeout(() => {
          localStorage.clear();
          sessionStorage.clear();
          window.location.replace("/");
        }, 2000);
      });
  };

  useEffect(() => {
    processParams();
  }, []);

  return (
    <div
      className="fixed inset-0 w-screen h-screen flex items-center justify-center"
      style={{ background: 'rgb(253,253,253)' }}
    >
      <img
        src="/assets/img/aidea-loading.gif"
        alt="Loading..."
        style={{
          objectFit: 'cover',
          pointerEvents: 'none',
          userSelect: 'none',
        }}
        draggable={false}
      />
    </div>
  );
};

export default Callback;
