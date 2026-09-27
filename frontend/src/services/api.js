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
}

export const api = new ApiService();
