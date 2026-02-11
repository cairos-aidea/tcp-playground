import { config } from "../config.js";
import { endpoints } from "./endpoints.js";

let isUnauthorized = (status) => {
  if (status == 401) {
    localStorage.clear();
    window.location.href = "/?expired=1";
  }
};

let api = async (target_module, request, formData) => {
  let url = endpoints(request)[target_module].url;
  let headers = endpoints(request)[target_module].headers;
  let method = endpoints(request)[target_module].method;
  let isFileUpload = endpoints(request)[target_module].isFileUpload;
  let result = {};
  let data = null;
  let SERVICE_URL = config.SERVER_URL;

  const token = localStorage.getItem("auth_accessToken");
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  if (isFileUpload) {
    data = formData;
  } else {
    data = JSON.stringify(formData);
  }

  return new Promise(function (resolve, reject) {
    if (data === null || data === "") {
      fetch(SERVICE_URL + url, {
        method: method,
        crossDomain: true,
        headers: headers,
      })
        .then(function (response) {
          return response.json();
        })
        .then(function (data) {
          resolve(data);
        })
        .catch(function (err) {
          isUnauthorized(err.status);
          reject(err);
        });
    } else {
      /* ----------------------------------------------------- NON FILE UPLOAD ----------------------------------------------------- */

      if (method == "GET") {
        fetch(SERVICE_URL + url, {
          method: method,
          headers: headers,
          crossDomain: true,
        })
          .then(function (response) {
            if (response.status == 200) {
              let application_data = response.headers;
              let application_type =
                response.headers.get("Content-Type");

              if (application_type.indexOf("json") >= 0) {
                //console.log("resolve json");
                resolve(response.json());
              } else {
                //console.log("resolve auth stuffs here");
                if (response.auth_state) {
                  localStorage.clear();
                }

                resolve(response);
              }
            } else {
              //console.log("reject API");
              isUnauthorized(response.status);
              reject(response);
            }
          })
          .catch(function (err) {
            //console.log(err);
            reject(err);
          });
      } else {
        fetch(SERVICE_URL + url, {
          method: method,
          headers: headers,
          crossDomain: true,
          body: data,
        })
          .then(function (response) {
            for (var pair of response.headers.entries()) {
              //console.log(pair[0] + ": " + pair[1]);
            }

            if (response.status == 200) {
              let application_data = response.headers;
              let application_type =
                response.headers.get("Content-Type");

              resolve(response.json());
            } else {
              isUnauthorized(response.status);
              reject(response);
            }
          })
          .catch(function (err) {
            //console.log(err);
            reject(err);
          });
      }

      /* ----------------------------------------------------- NON FILE UPLOAD ----------------------------------------------------- */
    }
  });
};

let customApi = async (url, method, formData, token) => {
  let headers = {
    Authorization: `Bearer ${token || localStorage.getItem("token")}`,
    "Content-Type": "application/json",
  };

  return new Promise(function (resolve, reject) {
    if (method == "POST") {
      fetch(url, {
        method: method,
        crossDomain: true,
        headers: headers,
        body: formData,
      })
        .then(function (response) {
          //console.log(response);
          return response.json();
        })
        .then(function (data) {
          //console.log(data);
          resolve(data);
        })
        .catch(function (err) {
          //console.log(err);
          reject(err);
        });
    } else if (method == "GET") {
      fetch(url, {
        method: method,
        crossDomain: true,
        headers: headers,
      })
        .then(function (response) {
          // //console.log(response);
          return response.json();
        })
        .then(function (data) {
          // //console.log(data);
          resolve(data);
        })
        .catch(function (err) {
          //console.log(err);
          reject(err);
        });
    }
  });
};

export { api, customApi };
