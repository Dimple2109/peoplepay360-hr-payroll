// ====================================================================
// /zero-gravity-state-management
// Floating, weightless UI state management and reactive telemetry pipeline
// for PeoplePay360 Anti-Gravity HR & Payroll Operating System
// ====================================================================

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

const ZeroGravityContext = createContext(null);

export function ZeroGravityProvider({ children }) {
  // Master Data
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [roles, setRoles] = useState([]);
  const [stats, setStats] = useState(null);
  const [telemetry, setTelemetry] = useState(null);

  // Loading & Error States
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);

  // View & Filter State
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'kanban'
  const [activeNav, setActiveNav] = useState('employees'); // 'employees' | 'contracts' | 'schedules'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [sortBy, setSortBy] = useState('id');
  const [sortOrder, setSortOrder] = useState('ASC');

  // Levitation Clearance State (/levitation-auth-middleware integration)
  const [clearanceLevel, setClearanceLevelState] = useState('Level-5 Fleet Admiral');

  // Floating Overlays & Modals (Zero-Gravity Overlays)
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null); // null = create new
  const [isDossierOpen, setIsDossierOpen] = useState(false);
  const [viewingEmployee, setViewingEmployee] = useState(null);
  const [isHudExpanded, setIsHudExpanded] = useState(true);

  // Cosmic Toast Notifications
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Set clearance level and update api service
  const setClearanceLevel = useCallback((tier) => {
    setClearanceLevelState(tier);
    api.setClearanceLevel(tier);
    addToast(`Security Clearance shifted to: ${tier}`, 'warning');
  }, [addToast]);

  // Fetch all core data
  const fetchData = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    try {
      const [empRes, deptRes, roleRes, statsRes, telRes] = await Promise.all([
        api.getEmployees({
          search: searchQuery,
          department: selectedDept,
          status: selectedStatus,
          sortBy,
          order: sortOrder,
        }),
        api.getDepartments(),
        api.getRoles(),
        api.getEmployeeStats(),
        api.getTelemetry(),
      ]);

      if (empRes.success) setEmployees(empRes.data);
      if (deptRes.success) setDepartments(deptRes.data);
      if (roleRes.success) setRoles(roleRes.data);
      if (statsRes.success) setStats(statsRes.data);
      if (telRes.success) setTelemetry(telRes.data);
      setError(null);
    } catch (err) {
      console.error('Failed to sync with orbital core:', err);
      setError(err.message);
      addToast(`Orbital Sync Error: ${err.message}`, 'error');
    } finally {
      if (!quiet) setLoading(false);
    }
  }, [searchQuery, selectedDept, selectedStatus, sortBy, sortOrder, addToast]);

  // Initial load
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Live Propulsion Telemetry Pulse (polling every 4 seconds)
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const telRes = await api.getTelemetry();
        if (telRes.success) {
          setTelemetry(telRes.data);
        }
      } catch (e) {
        // quiet failure for background pulse
      }
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Quick Status Transition (Zero-G Kanban Drag / Quick Action)
  const transitionEmployeeStatus = async (employeeId, newStatus) => {
    setActionLoading(true);
    try {
      // Optimistic update for weightless instantaneous feel
      setEmployees((prev) =>
        prev.map((emp) =>
          emp.id === employeeId ? { ...emp, status: newStatus } : emp
        )
      );

      const res = await api.updateEmployeeStatus(employeeId, newStatus);
      if (res.success) {
        addToast(`Astronaut #${employeeId} calibrated to ${newStatus}`, 'success');
        // Refresh telemetry and stats
        const [statsRes, telRes] = await Promise.all([
          api.getEmployeeStats(),
          api.getTelemetry(),
        ]);
        if (statsRes.success) setStats(statsRes.data);
        if (telRes.success) setTelemetry(telRes.data);
      }
    } catch (err) {
      addToast(`Gravitational status transition failed: ${err.message}`, 'error');
      fetchData(true); // rollback on error
    } finally {
      setActionLoading(false);
    }
  };

  // Create or Update Employee
  const saveEmployee = async (formData) => {
    setActionLoading(true);
    try {
      if (editingEmployee) {
        // Update
        const res = await api.updateEmployee(editingEmployee.id, formData);
        if (res.success) {
          addToast(`Astronaut ${res.data.first_name} ${res.data.last_name} record recalibrated`, 'success');
          setIsFormModalOpen(false);
          setEditingEmployee(null);
          await fetchData(true);
        }
      } else {
        // Create
        const res = await api.createEmployee(formData);
        if (res.success) {
          addToast(`New Astronaut ${res.data.first_name} ${res.data.last_name} enrolled successfully`, 'success');
          setIsFormModalOpen(false);
          await fetchData(true);
        }
      }
    } catch (err) {
      addToast(err.message, 'error');
      throw err;
    } finally {
      setActionLoading(false);
    }
  };

  // Delete Employee
  const deleteEmployee = async (employeeId, name) => {
    if (!window.confirm(`Disengage astronaut ${name || `#${employeeId}`} from orbital service?`)) {
      return;
    }

    setActionLoading(true);
    try {
      const res = await api.deleteEmployee(employeeId);
      if (res.success) {
        addToast(`Astronaut disengaged from roster`, 'info');
        setEmployees((prev) => prev.filter((e) => e.id !== employeeId));
        if (viewingEmployee?.id === employeeId) {
          setIsDossierOpen(false);
          setViewingEmployee(null);
        }
        await fetchData(true);
      }
    } catch (err) {
      addToast(`Disengagement error: ${err.message}`, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Modal helpers
  const openCreateModal = () => {
    setEditingEmployee(null);
    setIsFormModalOpen(true);
  };

  const openEditModal = (emp) => {
    setEditingEmployee(emp);
    setIsFormModalOpen(true);
  };

  const closeFormModal = () => {
    setIsFormModalOpen(false);
    setEditingEmployee(null);
  };

  const openDossier = async (emp) => {
    try {
      const res = await api.getEmployeeById(emp.id);
      if (res.success) {
        setViewingEmployee(res.data);
      } else {
        setViewingEmployee(emp);
      }
    } catch (e) {
      setViewingEmployee(emp);
    }
    setIsDossierOpen(true);
  };

  const closeDossier = () => {
    setIsDossierOpen(false);
    setViewingEmployee(null);
  };

  const reseedDatabase = async () => {
    setActionLoading(true);
    try {
      await api.reseedData();
      addToast('Orbital Database reset to factory nominal state', 'success');
      await fetchData(true);
    } catch (err) {
      addToast(`Reseed error: ${err.message}`, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <ZeroGravityContext.Provider
      value={{
        // Data
        employees,
        departments,
        roles,
        stats,
        telemetry,
        loading,
        actionLoading,
        error,

        // Filters & Views
        viewMode,
        setViewMode,
        activeNav,
        setActiveNav,
        searchQuery,
        setSearchQuery,
        selectedDept,
        setSelectedDept,
        selectedStatus,
        setSelectedStatus,
        sortBy,
        setSortBy,
        sortOrder,
        setSortOrder,

        // Clearance
        clearanceLevel,
        setClearanceLevel,

        // Overlays & Actions
        isFormModalOpen,
        editingEmployee,
        openCreateModal,
        openEditModal,
        closeFormModal,
        saveEmployee,
        deleteEmployee,
        transitionEmployeeStatus,

        // Dossier
        isDossierOpen,
        viewingEmployee,
        openDossier,
        closeDossier,

        // HUD
        isHudExpanded,
        setIsHudExpanded,

        // Misc
        toasts,
        addToast,
        removeToast,
        refreshData: fetchData,
        reseedDatabase,
      }}
    >
      {children}
    </ZeroGravityContext.Provider>
  );
}

export function useZeroGravity() {
  const context = useContext(ZeroGravityContext);
  if (!context) {
    throw new Error('useZeroGravity must be used within a ZeroGravityProvider');
  }
  return context;
}
