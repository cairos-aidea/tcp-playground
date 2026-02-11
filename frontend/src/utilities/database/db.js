import Dexie from "dexie";

export const db = new Dexie("AppCacheDB");

db.version(1).stores({
  projects: "id",
  projectStages: "id",
  projectsInternal: "id",
  departmentalTasks: "id",
  staffs: "id",
  subsidiaries: "id",
  departments: "id"
});
