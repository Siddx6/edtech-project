/**
 * App Context for managing global state
 * Stores: userRole, currentStudent, currentPaper, etc.
 */

import React, { createContext, useContext, useState } from "react";

const AppContext = createContext();

export function AppProvider({ children }) {
  const [userRole, setUserRole] = useState("teacher"); // "teacher" or "student"
  const [currentStudent, setCurrentStudent] = useState(null);
  const [allPapers, setAllPapers] = useState([]);
  const [currentPaper, setCurrentPaper] = useState(null);
  const [userToken, setUserToken] = useState(null);

  const value = {
    // User Role
    userRole,
    setUserRole,

    // Student Data
    currentStudent,
    setCurrentStudent,

    // Paper Data
    allPapers,
    setAllPapers,
    currentPaper,
    setCurrentPaper,

    // Auth
    userToken,
    setUserToken,

    // Helper methods
    isTeacher: () => userRole === "teacher",
    isStudent: () => userRole === "student",
    hasStudent: () => currentStudent !== null,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

// Hook to use context
export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used within AppProvider");
  }
  return context;
}

export default AppContext;
