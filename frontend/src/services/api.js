// ====================================================================
// PeoplePay360: API Service Layer
// Integrates with Express backend and injects clearance headers
// for /levitation-auth-middleware
// ====================================================================

const BASE_URL = import.meta.env.VITE_API_URL || '';

class ApiService {
  constructor() {
    this.clearanceLevel = 'Level-5 Fleet Admiral';
  }

  setClearanceLevel(tier) {
    this.clearanceLevel = tier;
  }

  async _request(endpoint, options = {}) {
    const url = `${BASE_URL}/api${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      'X-Clearance-Level': this.clearanceLevel,
      ...options.headers,
    };

    const config = {
      ...options,
      headers,
    };

    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `HTTP error ${response.status}`);
    }

    return data;
  }

  // Employee Master Endpoints
  async getEmployees(params = {}) {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.department && params.department !== 'ALL') query.append('department', params.department);
    if (params.status && params.status !== 'ALL') query.append('status', params.status);
    if (params.sortBy) query.append('sortBy', params.sortBy);
    if (params.order) query.append('order', params.order);

    const qs = query.toString() ? `?${query.toString()}` : '';
    return await this._request(`/employees${qs}`);
  }

  async getEmployeeById(id) {
    return await this._request(`/employees/${id}`);
  }

  async createEmployee(payload) {
    return await this._request('/employees', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async updateEmployee(id, payload) {
    return await this._request(`/employees/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  async updateEmployeeStatus(id, status) {
    return await this._request(`/employees/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  async deleteEmployee(id) {
    return await this._request(`/employees/${id}`, {
      method: 'DELETE',
    });
  }

  async getEmployeeStats() {
    return await this._request('/employees/stats');
  }

  // Departments & Roles
  async getDepartments() {
    return await this._request('/departments');
  }

  async getRoles() {
    return await this._request('/roles');
  }

  // Telemetry & Propulsion HUD
  async getTelemetry() {
    return await this._request('/telemetry');
  }

  async getTelemetryHistory(limit = 20) {
    return await this._request(`/telemetry/history?limit=${limit}`);
  }

  async reseedData() {
    return await this._request('/telemetry/reseed', { method: 'POST' });
  }

  // ─── Contracts (/temporal-contract-sync) ────────────────────────
  async getContracts(params = {}) {
    const query = new URLSearchParams();
    if (params.employee_id) query.append('employee_id', params.employee_id);
    if (params.status)      query.append('status', params.status);
    if (params.payroll_period) query.append('payroll_period', params.payroll_period);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return await this._request(`/contracts${qs}`);
  }

  async getContractById(id) {
    return await this._request(`/contracts/${id}`);
  }

  async getActiveContract(employeeId, payrollPeriod) {
    const qs = payrollPeriod ? `?payroll_period=${payrollPeriod}` : '';
    return await this._request(`/contracts/active/${employeeId}${qs}`);
  }

  async getEmployeeContractHistory(employeeId) {
    return await this._request(`/contracts/employee/${employeeId}/history`);
  }

  async createContract(payload) {
    return await this._request('/contracts', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async updateContract(id, payload) {
    return await this._request(`/contracts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  async activateContract(id) {
    return await this._request(`/contracts/${id}/activate`, { method: 'PATCH' });
  }

  async deleteContract(id) {
    return await this._request(`/contracts/${id}`, { method: 'DELETE' });
  }

  // ─── Working Schedules (/orbital-schedule-engine) ────────────────
  async getSchedules(params = {}) {
    const query = new URLSearchParams();
    if (params.employee_id) query.append('employee_id', params.employee_id);
    if (params.is_active !== undefined) query.append('is_active', params.is_active);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return await this._request(`/working-schedules${qs}`);
  }

  async getScheduleById(id) {
    return await this._request(`/working-schedules/${id}`);
  }

  async getActiveSchedule(employeeId) {
    return await this._request(`/working-schedules/active/${employeeId}`);
  }

  async getEmployeeScheduleHistory(employeeId) {
    return await this._request(`/working-schedules/employee/${employeeId}/history`);
  }

  async createSchedule(payload) {
    return await this._request('/working-schedules', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async updateSchedule(id, payload) {
    return await this._request(`/working-schedules/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  async deleteSchedule(id) {
    return await this._request(`/working-schedules/${id}`, { method: 'DELETE' });
  }

  // ─── Attendance (/orbital-attendance-sync & /gravity-exception-detector) ───
  async getAttendance(params = {}) {
    const query = new URLSearchParams();
    if (params.employee_id) query.append('employee_id', params.employee_id);
    if (params.date) query.append('date', params.date);
    if (params.start_date) query.append('start_date', params.start_date);
    if (params.end_date) query.append('end_date', params.end_date);
    if (params.status && params.status !== 'ALL') query.append('status', params.status);
    if (params.exceptions_only) query.append('exceptions_only', 'true');
    if (params.department_id && params.department_id !== 'ALL') query.append('department_id', params.department_id);
    if (params.sortBy) query.append('sortBy', params.sortBy);
    if (params.order) query.append('order', params.order);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return await this._request(`/attendance${qs}`);
  }

  async getAttendanceById(id) {
    return await this._request(`/attendance/${id}`);
  }

  async checkInAttendance(payload) {
    return await this._request('/attendance/check-in', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async checkOutAttendance(payload) {
    return await this._request('/attendance/check-out', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async createAttendance(payload) {
    return await this._request('/attendance', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async updateAttendance(id, payload) {
    return await this._request(`/attendance/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  async deleteAttendance(id) {
    return await this._request(`/attendance/${id}`, {
      method: 'DELETE',
    });
  }

  async getAttendanceExceptions() {
    return await this._request('/attendance/exceptions');
  }

  async getAttendanceStats() {
    return await this._request('/attendance/stats');
  }

  // ─── Time Off (/zero-g-timeoff-allocator) ─────────────────────────
  async getTimeOffTypes() {
    return await this._request('/time-off/types');
  }

  async createTimeOffType(payload) {
    return await this._request('/time-off/types', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getTimeOffAllocations(params = {}) {
    const query = new URLSearchParams();
    if (params.employee_id) query.append('employee_id', params.employee_id);
    if (params.year) query.append('year', params.year);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return await this._request(`/time-off/allocations${qs}`);
  }

  async getEmployeeTimeOffSummary(employeeId, year = 2026) {
    return await this._request(`/time-off/allocations/${employeeId}/summary?year=${year}`);
  }

  async setTimeOffAllocation(payload) {
    return await this._request('/time-off/allocations', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getTimeOffRequests(params = {}) {
    const query = new URLSearchParams();
    if (params.employee_id) query.append('employee_id', params.employee_id);
    if (params.status && params.status !== 'ALL') query.append('status', params.status);
    if (params.year) query.append('year', params.year);
    if (params.department_id && params.department_id !== 'ALL') query.append('department_id', params.department_id);
    if (params.sortBy) query.append('sortBy', params.sortBy);
    if (params.order) query.append('order', params.order);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return await this._request(`/time-off/requests${qs}`);
  }

  async createTimeOffRequest(payload) {
    return await this._request('/time-off/requests', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async approveTimeOffRequest(id) {
    return await this._request(`/time-off/requests/${id}/approve`, {
      method: 'PATCH',
    });
  }

  async refuseTimeOffRequest(id, rejection_reason) {
    return await this._request(`/time-off/requests/${id}/refuse`, {
      method: 'PATCH',
      body: JSON.stringify({ rejection_reason }),
    });
  }

  async deleteTimeOffRequest(id) {
    return await this._request(`/time-off/requests/${id}`, {
      method: 'DELETE',
    });
  }

  async getTimeOffStats() {
    return await this._request('/time-off/stats');
  }

  // ─── Salary Structures (/quantum-salary-structuring) ─────────────
  async getSalaryStructures(params = {}) {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.is_active !== undefined) query.append('is_active', params.is_active);
    if (params.wage_type) query.append('wage_type', params.wage_type);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return await this._request(`/salary-structures${qs}`);
  }

  async getSalaryStructureStats() {
    return await this._request('/salary-structures/stats');
  }

  async getSalaryStructureById(id) {
    return await this._request(`/salary-structures/${id}`);
  }

  async createSalaryStructure(payload) {
    return await this._request('/salary-structures', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async updateSalaryStructure(id, payload) {
    return await this._request(`/salary-structures/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  async toggleSalaryStructureStatus(id, is_active) {
    return await this._request(`/salary-structures/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ is_active }),
    });
  }

  async deleteSalaryStructure(id) {
    return await this._request(`/salary-structures/${id}`, {
      method: 'DELETE',
    });
  }

  async duplicateSalaryStructure(id, payload = {}) {
    return await this._request(`/salary-structures/${id}/duplicate`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // /warp-computation-matrix: Dynamic calculation simulation
  async calculateSalaryStructure(id, context = {}) {
    return await this._request(`/salary-structures/${id}/calculate`, {
      method: 'POST',
      body: JSON.stringify(context),
    });
  }

  // ─── Salary Rules (/gravitational-rule-engine) ───────────────────
  async getSalaryRules(params = {}) {
    const query = new URLSearchParams();
    if (params.salary_structure_id) query.append('salary_structure_id', params.salary_structure_id);
    if (params.category) query.append('category', params.category);
    if (params.is_active !== undefined) query.append('is_active', params.is_active);
    if (params.search) query.append('search', params.search);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return await this._request(`/salary-rules${qs}`);
  }

  async getSalaryRuleById(id) {
    return await this._request(`/salary-rules/${id}`);
  }

  async createSalaryRule(payload) {
    return await this._request('/salary-rules', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async updateSalaryRule(id, payload) {
    return await this._request(`/salary-rules/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  async deleteSalaryRule(id) {
    return await this._request(`/salary-rules/${id}`, {
      method: 'DELETE',
    });
  }

  async reorderSalaryRules(salaryStructureId, reorderedRules) {
    return await this._request('/salary-rules/reorder', {
      method: 'PATCH',
      body: JSON.stringify({
        salary_structure_id: salaryStructureId,
        reordered_rules: reorderedRules,
      }),
    });
  }

  async validateFormula(formula) {
    return await this._request('/salary-rules/validate-formula', {
      method: 'POST',
      body: JSON.stringify({ formula }),
    });
  }
}

export const api = new ApiService();

