export let endpoints = (request = {}) => {
  let request_headers = null;
  let request_headers_json = null;
  let user_id = null;
  let client_params = null;

  if (request != null) {
    if (request.token) {
      request_headers_json = {
        Authorization: "Bearer " + request.token,
        "Content-Type": "application/json",
      };
    } else {
      request.token = null;
    }

    if (request.user_id) {
      user_id = request.user_id;
    }

    if (request.params) {
      client_params = request.params;
    }
  } else {
    request = {};
  }

  return {
    /* ################################ AUTHENTICATION ENDPOINTS ################################ */

    authentication_login: {
      url: "/api/v1/authenticate-admin",
      method: "POST",
      headers: { "Content-Type": "application/json" },
      isFileUpload: false,
    },

    mslogin: {
      url: "/api/ms/login",
      method: "POST",
      headers: { "Content-Type": "application/json" },
      isFileUpload: false,
    },

    msLoginValidate: {
      url: "/api/ms/login/validate",
      method: "POST",
      headers: { "Content-Type": "application/json" },
      isFileUpload: false,
    },

    msTeamsToken: {
      url: "/api/ms/validate-teams-token",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    },

    /* ################################ AUTHENTICATION ENDPOINTS ################################ */





    /* ################################ TIME CHARGES ENDPOINTS ################################ */

    time_charges: {
      url: "/api/time-charges?year=" + request.year + "&month=" + request.month + "&user_id=" + user_id,
      method: "GET",
      headers: request_headers_json,
      isFileUpload: false,
    },

    time_charge_create: {
      url: "/api/time-charges",
      method: "POST",
      headers: request_headers_json,
      isFileUpload: false,
    },

    time_charge_update: {
      url: "/api/time-charges/" + request.id,
      method: "PUT",
      headers: request_headers_json,
      isFileUpload: false,
    },

    time_charge_delete: {
      url: "/api/time-charges/" + request.id,
      method: "DELETE",
      headers: request_headers_json,
      isFileUpload: false,
    },

    approve: {
      url: "/api/time-charges/approve",
      method: "POST",
      headers: request_headers_json,
      isFileUpload: false,
    },

    decline: {
      url: "/api/time-charges/decline",
      method: "POST",
      headers: request_headers_json,
      isFileUpload: false,
    },

    reopen: {
      url: "/api/time-charges/re-open",
      method: "POST",
      headers: request_headers_json,
      isFileUpload: false,
    },

    /* ################################ TIME CHARGES ENDPOINTS ################################ */


    /* ################################ PROJECT AND STAGES ENDPOINTS ################################ */

    projects: {
      url: "/api/projects",
      method: "GET",
      headers: request_headers_json,
      isFileUpload: false,
    },

    projects_owned: {
      url: "/api/projects/owned/" + request.id,
      method: "GET",
      headers: request_headers_json,
      isFileUpload: false,
    },

    project_etf_versions: {
      url: "/api/projects/external/" + request.id + "/etf-versions",
      method: "GET",
      headers: request_headers_json,
      isFileUpload: false,
    },

    project_etfs: {
      url: "/api/projects/external/" + request.id + "/version/" + request.version + "/etfs" + (request.phase ? "?phase=" + request.phase : ""),
      method: "GET",
      headers: request_headers_json,
      isFileUpload: false,
    },

    // project_etf_create: {

    // }

    project_create: {
      url: "/api/projects",
      method: "POST",
      headers: request_headers_json,
      isFileUpload: false,
    },

    project_update: {
      url: "/api/projects/" + request.id,
      method: "PUT",
      headers: request_headers_json,
      isFileUpload: false,
    },

    project_delete: {
      url: "/api/projects/" + request.id,
      method: "DELETE",
      headers: request_headers_json,
      isFileUpload: false,
    },

    project_stages: {
      url: "/api/project-stages",
      method: "GET",
      headers: request_headers_json,
      isFileUpload: false,
    },

    project_stage_create: {
      url: "/api/project-stages",
      method: "POST",
      headers: request_headers_json,
      isFileUpload: false,
    },

    project_stage_update: {
      url: "/api/project-stages/" + request.id,
      method: "PUT",
      headers: request_headers_json,
      isFileUpload: false,
    },

    project_stage_delete: {
      url: "/api/project-stages/" + request.id,
      method: "DELETE",
      headers: request_headers_json,
      isFileUpload: false,
    },

    /* ################################ PROJECT AND STAGES ENDPOINTS ################################ */

    /* ################################ BUDGET ENDPOINTS ################################ */
    project_budget: {
      url: "/api/projects/" + request.id + "/budget",
      method: "GET",
      headers: request_headers_json,
      isFileUpload: false,
    },

    budget_versions: {
      url: "/api/projects/" + request.id + "/budget-versions",
      method: "GET",
      headers: request_headers_json,
      isFileUpload: false,
    },

    project_budget_create: { //change name to project budget
      url: "/api/budget-versions",
      method: "POST",
      headers: request_headers_json,
      isFileUpload: false,
    },

    other_expenses: {
      url: "/api/projects/budget/other-expenses",
      method: "GET",
      headers: request_headers_json,
      isFileUpload: false,
    },

    budget_other_expense_create: {
      url: "/api/budget-other-expenses",
      method: "POST",
      headers: request_headers_json,
      isFileUpload: false,
    },

    budget_other_expense_update: {
      url: "/api/budget-other-expenses/" + request.id,
      method: "PUT",
      headers: request_headers_json,
      isFileUpload: false,
    },

    budget_other_expense_delete: {
      url: "/api/budget-other-expenses/" + request.id,
      method: "DELETE",
      headers: request_headers_json,
      isFileUpload: false,
    },

    /* ################################ BUDGET ENDPOINTS ################################ */

    /* ################################ ETF ENDPOINTS ################################ */
    etf_stage_date_update: {
      url: "/api/etf-stages/update-dates",
      method: "POST",
      headers: request_headers_json,
      isFileUpload: false,
    },

    etf_time_charges: {
      url: "/api/etfs/time-charges/project/" + request.id,
      method: "GET",
      headers: request_headers_json,
      isFileUpload: false,
    },

    etf_create: {
      url: "/api/etfs/create",
      method: "POST",
      headers: request_headers_json,
      isFileUpload: false,
    },

    etf_update: {
      url: "/api/etfs/update",
      method: "POST",
      headers: request_headers_json,
      isFileUpload: false,
    },

    etf_save: {
      url: "/api/etfs/save",
      method: "POST",
      headers: request_headers_json,
      isFileUpload: false,
    },

    etf_delete: {
      url: "/api/etfs/delete",
      method: "POST",
      headers: request_headers_json,
      isFileUpload: false,
    },

    /* ################################ ETF ENDPOINTS ################################ */

    /* ################################ PROJECTS EXTERNAL, INTERNAL AND DEPARTMENTAL ENDPOINTS ################################ */
    /* projects exteral is still in the projects endpoint, it is for future planning */

    project_internals: {
      url: "/api/project-internals",
      method: "GET",
      headers: request_headers_json,
      isFileUpload: false,
    },

    project_internal_create: {
      url: "/api/project-internals",
      method: "POST",
      headers: request_headers_json,
      isFileUpload: false,
    },

    project_internal_update: {
      url: "/api/project-internals/" + request.id,
      method: "PUT",
      headers: request_headers_json,
      isFileUpload: false,
    },

    project_internal_delete: {
      url: "/api/project-internals/" + request.id,
      method: "DELETE",
      headers: request_headers_json,
      isFileUpload: false,
    },

    departmental_tasks: {
      url: "/api/departmental-tasks",
      method: "GET",
      headers: request_headers_json,
      isFileUpload: false,
    },

    departmental_task_create: {
      url: "/api/departmental-tasks",
      method: "POST",
      headers: request_headers_json,
      isFileUpload: false,
    },

    departmental_task_update: {
      url: "/api/departmental-tasks/" + request.id,
      method: "PUT",
      headers: request_headers_json,
      isFileUpload: false,
    },

    departmental_task_delete: {
      url: "/api/departmental-tasks/" + request.id,
      method: "DELETE",
      headers: request_headers_json,
      isFileUpload: false,
    },

    subsidiaries: {
      url: "/api/subsidiaries",
      method: "GET",
      headers: request_headers_json,
      isFileUpload: false,
    },

    /* ################################ PROJECTS EXTERNAL, INTERNAL AND DEPARTMENTAL ENDPOINTS ################################ */


    /* ################################ ADMIN ENDPOINTS ################################ */
    approvers_list: {
      url: "/api/approvers-list?page=" + request.page + "&per_page=" + request.per_page,
      method: "POST",
      headers: request_headers_json,
      isFileUpload: false,
    },

    export_data: {
      url: "/api/export-data",
      method: "POST",
      headers: request_headers_json,
      isFileUpload: false,
    },

    send_message: {
      url: "/api/send-reminders",
      method: "POST",
      headers: request_headers_json,
      isFileUpload: false,
    },

    /* ################################ STAFF ENDPOINTS ################################ */

    staffs_list: {
      url: "/api/staffs",
      method: "GET",
      headers: request_headers_json,
      isFileUpload: false,
    },

    staff_create: {
      url: "/api/staffs",
      method: "POST",
      headers: request_headers_json,
      isFileUpload: false,
    },

    staff_update: {
      url: "/api/staffs/" + request.id,
      method: "PUT",
      headers: request_headers_json,
      isFileUpload: false,
    },

    staff_delete: {
      url: "/api/staffs/" + request.id,
      method: "DELETE",
      headers: request_headers_json,
      isFileUpload: false,
    },

    /* ################################ STAFF ENDPOINTS ################################ */

    /* ################################ DEPARTMENTS ENDPOINTS ################################ */

    departments_list: {
      url: "/api/departments",
      method: "GET",
      headers: request_headers_json,
      isFileUpload: false,
    },

    department_create: {
      url: "/api/departments",
      method: "POST",
      headers: request_headers_json,
      isFileUpload: false,
    },

    department_update: {
      url: "/api/departments/" + request.id,
      method: "PUT",
      headers: request_headers_json,
      isFileUpload: false,
    },

    department_delete: {
      url: "/api/departments/" + request.id,
      method: "DELETE",
      headers: request_headers_json,
      isFileUpload: false,
    },

    /* ################################ DEPARTMENTS ENDPOINTS ################################ */

    /* ############################ SUBSIDIARIES ENDPOINTS ################################ */

    subsidiary_create: {
      url: "/api/subsidiaries",
      method: "POST",
      headers: request_headers_json,
      isFileUpload: false,
    },

    subsidiary_update: {
      url: "/api/subsidiaries/" + request.id,
      method: "PUT",
      headers: request_headers_json,
      isFileUpload: false,
    },

    subsidiary_delete: {
      url: "/api/subsidiaries/" + request.id,
      method: "DELETE",
      headers: request_headers_json,
      isFileUpload: false,
    },

    /* ############################ SUBSIDIARIES ENDPOINTS ################################ */

    /* ################################ HOLIDAYS ENDPOINTS ################################ */

    holiday_calendar: {
      url: "/api/holidays/calendar?year=" + request.year,
      method: "GET",
      headers: request_headers_json,
      isFileUpload: false,
    },

    holiday_list: {
      url: "/api/holidays",
      method: "GET",
      headers: request_headers_json,
      isFileUpload: false,
    },

    holiday_create: {
      url: "/api/holidays",
      method: "POST",
      headers: request_headers_json,
      isFileUpload: false,
    },

    holiday_update: {
      url: "/api/holidays/" + request.id,
      method: "PUT",
      headers: request_headers_json,
      isFileUpload: false,
    },

    holiday_delete: {
      url: "/api/holidays/" + request.id,
      method: "DELETE",
      headers: request_headers_json,
      isFileUpload: false,
    },

    /* ################################ HOLIDAYS ENDPOINTS ################################ */

    /* ################################ LEAVES ENDPOINTS ################################ */

    leave_list: {
      url: "/api/leaves?year=" + request.year,
      method: "GET",
      headers: request_headers_json,
      isFileUpload: false,
    },

    leave_credits: {
      url: "/api/leaves/credits/" + request.id,
      method: "GET",
      headers: request_headers_json,
      isFileUpload: false,
    },


    /* ################################ LEAVES ENDPOINTS ################################ */


    /* ################################ ADMIN ENDPOINTS ################################ *


    /* ################################ COMMON ENDPOINTS ################################ */


    billable_non_billable_list: {
      url: "/api/billable_non_billable",
      method: "GET",
      headers: request_headers_json,
      isFileUpload: false,
    },

    meeting_list: {
      url: "/api/meetings?start_date=" + request.start_date + "&end_date=" + request.end_date,
      method: "GET",
      headers: request_headers_json,
      isFileUpload: false,
    },

    /* ################################ COMMON ENDPOINTS ################################ */
  };
};
