// ====================================================================
// PeoplePay360: Anti-Gravity HR & Payroll Platform
// /quantum-salary-structuring — Containerized Salary Structures & Rule Mapping
// /gravitational-rule-engine  — Ordered Sequential Rule Execution
// /warp-computation-matrix    — Fixed, Percentage & Custom Space Formulas
// ====================================================================

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Layers,
  Calculator,
  Workflow,
  Plus,
  Play,
  Copy,
  Edit2,
  Trash2,
  Check,
  X,
  Search,
  Filter,
  RefreshCw,
  Sparkles,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  Info,
  Sliders,
  DollarSign,
  TrendingUp,
  Users,
  Shield,
  Clock,
  Orbit,
  CheckCircle2,
  AlertTriangle,
  FileCode,
  Zap,
} from 'lucide-react';
import { api } from '../services/api';
import { useZeroGravity } from '../context/ZeroGravityContext';

const CATEGORY_COLORS = {
  basic: {
    bg: 'bg-blue-950/70',
    border: 'border-blue-500/40',
    text: 'text-blue-400',
    badge: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    label: 'Basic Pay',
    glow: 'rgba(59, 130, 246, 0.2)',
  },
  allowance: {
    bg: 'bg-emerald-950/70',
    border: 'border-emerald-500/40',
    text: 'text-emerald-400',
    badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    label: 'Allowance',
    glow: 'rgba(16, 185, 129, 0.2)',
  },
  gross: {
    bg: 'bg-purple-950/70',
    border: 'border-purple-500/40',
    text: 'text-purple-400',
    badge: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    label: 'Gross',
    glow: 'rgba(168, 85, 247, 0.2)',
  },
  deduction: {
    bg: 'bg-rose-950/70',
    border: 'border-rose-500/40',
    text: 'text-rose-400',
    badge: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    label: 'Deduction',
    glow: 'rgba(244, 63, 94, 0.2)',
  },
  net: {
    bg: 'bg-cyan-950/70',
    border: 'border-cyan-500/40',
    text: 'text-quantum-cyan',
    badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    label: 'Net Payout',
    glow: 'rgba(0, 240, 255, 0.2)',
  },
};

const DEFAULT_CATEGORY_SEQS = {
  basic: 10,
  allowance: 20,
  gross: 100,
  deduction: 110,
  net: 200,
};

export default function SalaryStructureManagement() {
  const { addToast, activeNav, setActiveNav } = useZeroGravity();

  // Active view tab: 'structures' | 'rules' | 'simulator'
  const [activeTab, setActiveTab] = useState(
    activeNav === 'salary-rules' ? 'rules' : 'structures'
  );

  // Core Data
  const [structures, setStructures] = useState([]);
  const [selectedStructureId, setSelectedStructureId] = useState(null);
  const [selectedStructure, setSelectedStructure] = useState(null);
  const [rules, setRules] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filters & Display
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'ACTIVE' | 'INACTIVE'
  const [wageTypeFilter, setWageTypeFilter] = useState('ALL');
  const [viewMode, setViewMode] = useState('cards'); // 'cards' | 'table'
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // Modals
  const [isStructureModalOpen, setIsStructureModalOpen] = useState(false);
  const [editingStructure, setEditingStructure] = useState(null);
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [isSimModalOpen, setIsSimModalOpen] = useState(false);

  // Structure Form State
  const [structForm, setStructForm] = useState({
    code: '',
    name: '',
    description: '',
    wage_type: 'monthly',
    company_contribution: 0,
    currency: 'USD',
    is_active: true,
    notes: '',
  });

  // Rule Form State
  const [ruleForm, setRuleForm] = useState({
    salary_structure_id: '',
    name: '',
    code: '',
    category: 'allowance',
    sequence: 20,
    computation_type: 'fixed',
    amount: 0,
    percentage: 0,
    formula: '',
    base_rule_id: '',
    is_active: true,
    is_taxable: true,
    notes: '',
  });

  // Formula Validation State
  const [formulaStatus, setFormulaStatus] = useState({ valid: true, message: '', variables: [] });
  const [isCheckingFormula, setIsCheckingFormula] = useState(false);

  // Simulator Context State (/warp-computation-matrix)
  const [simContext, setSimContext] = useState({
    base_salary: 120000,
    gravity_allowance: 12000,
    days_worked: 22,
    overtime_hours: 0,
  });
  const [simResult, setSimResult] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);

  // Synchronize activeNav changes
  useEffect(() => {
    if (activeNav === 'salary-rules') {
      setActiveTab('rules');
    } else if (activeNav === 'salary-structures') {
      setActiveTab('structures');
    }
  }, [activeNav]);

  // Load structures and stats
  const fetchStructures = useCallback(async () => {
    try {
      setLoading(true);
      const [structRes, statsRes] = await Promise.all([
        api.getSalaryStructures({
          search: searchQuery,
          is_active: statusFilter === 'ALL' ? undefined : statusFilter === 'ACTIVE',
          wage_type: wageTypeFilter === 'ALL' ? undefined : wageTypeFilter,
        }),
        api.getSalaryStructureStats(),
      ]);

      if (structRes.success) {
        setStructures(structRes.data);
        if (!selectedStructureId && structRes.data.length > 0) {
          setSelectedStructureId(structRes.data[0].id);
        }
      }
      if (statsRes.success) {
        setStats(statsRes.data);
      }
    } catch (err) {
      console.error('Error fetching structures:', err);
      addToast(`Error loading structures: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, statusFilter, wageTypeFilter, selectedStructureId, addToast]);

  // Load rules for selected structure
  const fetchSelectedStructureRules = useCallback(async (structureId) => {
    if (!structureId) return;
    try {
      const res = await api.getSalaryStructureById(structureId);
      if (res.success) {
        setSelectedStructure(res.data);
        setRules(res.data.rules || []);
      }
    } catch (err) {
      console.error('Error fetching structure rules:', err);
    }
  }, []);

  useEffect(() => {
    fetchStructures();
  }, [fetchStructures]);

  useEffect(() => {
    if (selectedStructureId) {
      fetchSelectedStructureRules(selectedStructureId);
    }
  }, [selectedStructureId, fetchSelectedStructureRules]);

  // Handle Structure Form Open
  const handleOpenStructureModal = (struct = null) => {
    if (struct) {
      setEditingStructure(struct);
      setStructForm({
        code: struct.code,
        name: struct.name,
        description: struct.description || '',
        wage_type: struct.wage_type || 'monthly',
        company_contribution: struct.company_contribution || 0,
        currency: struct.currency || 'USD',
        is_active: struct.is_active,
        notes: struct.notes || '',
      });
    } else {
      setEditingStructure(null);
      const randomSuffix = Math.floor(100 + Math.random() * 900);
      setStructForm({
        code: `STRUCT-ORB-${randomSuffix}`,
        name: '',
        description: '',
        wage_type: 'monthly',
        company_contribution: 500,
        currency: 'USD',
        is_active: true,
        notes: '',
      });
    }
    setIsStructureModalOpen(true);
  };

  // Submit Structure Form
  const handleSubmitStructure = async (e) => {
    e.preventDefault();
    if (!structForm.code || !structForm.name) {
      addToast('Structure code and name are required', 'warning');
      return;
    }

    try {
      if (editingStructure) {
        const res = await api.updateSalaryStructure(editingStructure.id, structForm);
        if (res.success) {
          addToast(`Structure '${res.data.name}' successfully updated`, 'success');
        }
      } else {
        const res = await api.createSalaryStructure(structForm);
        if (res.success) {
          addToast(`New structure container '${res.data.name}' initialized`, 'success');
          setSelectedStructureId(res.data.id);
        }
      }
      setIsStructureModalOpen(false);
      fetchStructures();
    } catch (err) {
      addToast(err.message || 'Operation failed', 'error');
    }
  };

  // Toggle Structure Active
  const handleToggleStructureStatus = async (struct) => {
    try {
      const res = await api.toggleSalaryStructureStatus(struct.id, !struct.is_active);
      if (res.success) {
        addToast(
          `Structure '${struct.name}' ${res.data.is_active ? 'Activated' : 'Decommissioned'}`,
          'info'
        );
        fetchStructures();
      }
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  // Delete Structure
  const handleDeleteStructure = async (struct) => {
    if (
      !window.confirm(
        `Decommission salary structure "${struct.name}" and delete all its rules?`
      )
    ) {
      return;
    }
    try {
      const res = await api.deleteSalaryStructure(struct.id);
      if (res.success) {
        addToast(`Structure "${struct.name}" decommissioned`, 'success');
        if (selectedStructureId === struct.id) {
          setSelectedStructureId(null);
        }
        fetchStructures();
      }
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  // Duplicate Structure
  const handleDuplicateStructure = async (struct) => {
    try {
      const res = await api.duplicateSalaryStructure(struct.id);
      if (res.success) {
        addToast(`Cloned structure: "${res.data.name}"`, 'success');
        setSelectedStructureId(res.data.id);
        fetchStructures();
      }
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  // Handle Rule Form Open
  const handleOpenRuleModal = (rule = null) => {
    if (rule) {
      setEditingRule(rule);
      setRuleForm({
        salary_structure_id: rule.salary_structure_id,
        name: rule.name,
        code: rule.code,
        category: rule.category,
        sequence: rule.sequence,
        computation_type: rule.computation_type,
        amount: rule.amount || 0,
        percentage: rule.percentage || 0,
        formula: rule.formula || '',
        base_rule_id: rule.base_rule_id || '',
        is_active: rule.is_active,
        is_taxable: rule.is_taxable,
        notes: rule.notes || '',
      });
      if (rule.formula) {
        checkFormulaSyntax(rule.formula);
      } else {
        setFormulaStatus({ valid: true, message: '', variables: [] });
      }
    } else {
      setEditingRule(null);
      const defaultCategory = 'allowance';
      const existingRules = selectedStructure?.rules || [];
      const highestSeq = existingRules.length > 0
        ? Math.max(...existingRules.map(r => r.sequence)) + 10
        : 20;

      setRuleForm({
        salary_structure_id: selectedStructureId || '',
        name: '',
        code: '',
        category: defaultCategory,
        sequence: highestSeq,
        computation_type: 'fixed',
        amount: 500,
        percentage: 0,
        formula: '',
        base_rule_id: '',
        is_active: true,
        is_taxable: true,
        notes: '',
      });
      setFormulaStatus({ valid: true, message: '', variables: [] });
    }
    setIsRuleModalOpen(true);
  };

  // Live Formula Syntax Inspection
  const checkFormulaSyntax = async (formulaText) => {
    if (!formulaText) {
      setFormulaStatus({ valid: true, message: '', variables: [] });
      return;
    }
    setIsCheckingFormula(true);
    try {
      const res = await api.validateFormula(formulaText);
      setFormulaStatus({
        valid: res.valid,
        message: res.message,
        variables: res.variables || [],
        error: res.error,
      });
    } catch (err) {
      setFormulaStatus({ valid: false, message: err.message, variables: [] });
    } finally {
      setIsCheckingFormula(false);
    }
  };

  // Submit Rule Form
  const handleSubmitRule = async (e) => {
    e.preventDefault();
    if (!ruleForm.name || !ruleForm.code || !ruleForm.category) {
      addToast('Name, code, and category are required', 'warning');
      return;
    }

    try {
      const payload = {
        ...ruleForm,
        salary_structure_id: parseInt(ruleForm.salary_structure_id, 10),
        sequence: parseInt(ruleForm.sequence, 10),
        amount: parseFloat(ruleForm.amount) || 0,
        percentage: parseFloat(ruleForm.percentage) || 0,
        base_rule_id: ruleForm.base_rule_id ? parseInt(ruleForm.base_rule_id, 10) : null,
      };

      if (editingRule) {
        const res = await api.updateSalaryRule(editingRule.id, payload);
        if (res.success) {
          addToast(`Rule [${res.data.code}] updated`, 'success');
        }
      } else {
        const res = await api.createSalaryRule(payload);
        if (res.success) {
          addToast(`Rule [${res.data.code}] linked to structure`, 'success');
        }
      }

      setIsRuleModalOpen(false);
      fetchSelectedStructureRules(selectedStructureId);
      fetchStructures();
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  // Delete Rule
  const handleDeleteRule = async (rule) => {
    if (!window.confirm(`Delete rule "${rule.name}" [${rule.code}]?`)) return;
    try {
      const res = await api.deleteSalaryRule(rule.id);
      if (res.success) {
        addToast(`Rule [${rule.code}] removed`, 'info');
        fetchSelectedStructureRules(selectedStructureId);
        fetchStructures();
      }
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  // Reorder Sequence Step (Move Up / Down)
  const handleMoveRule = async (ruleIndex, direction) => {
    const targetIndex = direction === 'up' ? ruleIndex - 1 : ruleIndex + 1;
    if (targetIndex < 0 || targetIndex >= rules.length) return;

    const cloned = [...rules];
    const currentRule = cloned[ruleIndex];
    const targetRule = cloned[targetIndex];

    // Swap sequence numbers
    const tempSeq = currentRule.sequence;
    currentRule.sequence = targetRule.sequence;
    targetRule.sequence = tempSeq;

    // Ensure distinct sequence if they collided
    if (currentRule.sequence === targetRule.sequence) {
      if (direction === 'up') {
        currentRule.sequence = Math.max(1, currentRule.sequence - 5);
      } else {
        currentRule.sequence = currentRule.sequence + 5;
      }
    }

    cloned.sort((a, b) => a.sequence - b.sequence);
    setRules(cloned);

    // Save to backend
    try {
      const payload = cloned.map((r, idx) => ({ id: r.id, sequence: (idx + 1) * 10 }));
      await api.reorderSalaryRules(selectedStructureId, payload);
      addToast('Gravitational sequence re-calibrated', 'success');
      fetchSelectedStructureRules(selectedStructureId);
    } catch (err) {
      addToast(`Reorder failed: ${err.message}`, 'error');
    }
  };

  // Open Simulator
  const handleOpenSimulator = (struct = null) => {
    const target = struct || selectedStructure || structures[0];
    if (target) {
      setSelectedStructureId(target.id);
      fetchSelectedStructureRules(target.id);
      setIsSimModalOpen(true);
      runSimulation(target.id);
    }
  };

  // Run Compensation Simulation
  const runSimulation = async (structureId = selectedStructureId) => {
    if (!structureId) return;
    setIsCalculating(true);
    try {
      const res = await api.calculateSalaryStructure(structureId, simContext);
      if (res.success) {
        setSimResult(res.data);
      }
    } catch (err) {
      addToast(`Calculation fault: ${err.message}`, 'error');
    } finally {
      setIsCalculating(false);
    }
  };

  // Filtered Rules for Rules View
  const filteredRules = useMemo(() => {
    return rules.filter((r) => {
      if (categoryFilter !== 'ALL' && r.category !== categoryFilter) return false;
      return true;
    });
  }, [rules, categoryFilter]);

  return (
    <div className="space-y-6">
      {/* ─── Hero / Header ────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl glass-panel p-6 border border-cyan-500/20 bg-gradient-to-r from-cosmic-900/90 via-cosmic-950/90 to-cyan-950/40">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-cyan-950 text-quantum-cyan border border-cyan-500/30 flex items-center gap-1.5 shadow-sm">
                <Sparkles className="w-3 h-3 text-quantum-cyan animate-pulse" />
                /quantum-salary-structuring
              </span>
              <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-purple-950/80 text-purple-300 border border-purple-500/30">
                /gravitational-rule-engine
              </span>
              <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-amber-950/80 text-amber-300 border border-amber-500/30">
                /warp-computation-matrix
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
              <span>Salary Structure & Rule Configuration</span>
              <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                Turn 2 Module
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-3xl">
              Containerized salary structure modeling with strict gravitational rule sequencing
              (Basic ➔ Allowances ➔ Gross ➔ Deductions ➔ Net) and dynamic space formula calculus.
            </p>
          </div>

          {/* Quick Header Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => handleOpenStructureModal()}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-semibold text-xs flex items-center gap-2 shadow-[0_0_20px_rgba(0,240,255,0.3)] transition-all hover:scale-[1.02]"
            >
              <Plus className="w-4 h-4" />
              <span>New Structure</span>
            </button>
            <button
              onClick={() => handleOpenSimulator()}
              className="px-3.5 py-2 rounded-xl bg-cosmic-800 hover:bg-cosmic-700 border border-cyan-500/30 text-quantum-cyan text-xs font-mono flex items-center gap-1.5 transition-all"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Simulate Calculus</span>
            </button>
            <button
              onClick={fetchStructures}
              disabled={loading}
              className="p-2 rounded-xl bg-cosmic-800 hover:bg-cosmic-700 border border-slate-700 text-slate-400 hover:text-slate-200 transition-all"
              title="Refresh Orbital Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-quantum-cyan' : ''}`} />
            </button>
          </div>
        </div>

        {/* View Tabs */}
        <div className="flex items-center gap-2 mt-6 pt-4 border-t border-slate-800/80">
          <button
            onClick={() => setActiveTab('structures')}
            className={`px-4 py-2 rounded-xl text-xs font-medium font-sans flex items-center gap-2 transition-all ${
              activeTab === 'structures'
                ? 'bg-quantum-cyan text-slate-950 font-bold shadow-[0_0_15px_rgba(0,240,255,0.3)]'
                : 'bg-cosmic-900/80 hover:bg-cosmic-800 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Salary Structures ({structures.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('rules')}
            className={`px-4 py-2 rounded-xl text-xs font-medium font-sans flex items-center gap-2 transition-all ${
              activeTab === 'rules'
                ? 'bg-purple-500 text-white font-bold shadow-[0_0_15px_rgba(168,85,247,0.3)]'
                : 'bg-cosmic-900/80 hover:bg-cosmic-800 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <Workflow className="w-3.5 h-3.5" />
            <span>Gravitational Rule Engine ({rules.length} rules)</span>
          </button>
          <button
            onClick={() => setActiveTab('simulator')}
            className={`px-4 py-2 rounded-xl text-xs font-medium font-sans flex items-center gap-2 transition-all ${
              activeTab === 'simulator'
                ? 'bg-amber-400 text-slate-950 font-bold shadow-[0_0_15px_rgba(251,191,36,0.3)]'
                : 'bg-cosmic-900/80 hover:bg-cosmic-800 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <Calculator className="w-3.5 h-3.5" />
            <span>Warp Computation Matrix</span>
          </button>
        </div>
      </div>

      {/* ─── KPI Stats Ribbon ──────────────────────────────────────── */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="glass-panel p-4 rounded-xl border border-cyan-500/20 bg-cosmic-900/50">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1 font-mono">
              <span>STRUCTURES</span>
              <Layers className="w-4 h-4 text-quantum-cyan" />
            </div>
            <div className="text-2xl font-bold text-white font-mono">
              {stats.total_structures}
            </div>
            <div className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              {stats.active_structures} active containers
            </div>
          </div>

          <div className="glass-panel p-4 rounded-xl border border-purple-500/20 bg-cosmic-900/50">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1 font-mono">
              <span>SALARY RULES</span>
              <Workflow className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl font-bold text-white font-mono">
              {stats.total_rules}
            </div>
            <div className="text-[11px] text-purple-300 mt-1 font-mono">
              Ordered sequence bands
            </div>
          </div>

          <div className="glass-panel p-4 rounded-xl border border-emerald-500/20 bg-cosmic-900/50">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1 font-mono">
              <span>CREW ASSIGNED</span>
              <Users className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-white font-mono">
              {stats.assigned_employees}
            </div>
            <div className="text-[11px] text-emerald-400 mt-1 font-mono">
              Active astronaut contracts
            </div>
          </div>

          <div className="glass-panel p-4 rounded-xl border border-amber-500/20 bg-cosmic-900/50">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1 font-mono">
              <span>EXECUTION MATRIX</span>
              <Zap className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-bold text-white font-mono">
              100% Zero-G
            </div>
            <div className="text-[11px] text-amber-400 mt-1 font-mono">
              Warp formula resolution
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 1: SALARY STRUCTURE CONTAINERS ───────────────────────── */}
      {activeTab === 'structures' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 glass-panel p-3 rounded-xl border border-slate-800">
            <div className="flex flex-1 items-center gap-2 bg-cosmic-950/80 px-3 py-2 rounded-lg border border-slate-700/60">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search structures by name, code, or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent text-xs text-slate-200 placeholder-slate-500 focus:outline-none w-full font-sans"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="text-slate-500 hover:text-slate-300">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Wage Type Filter */}
              <select
                value={wageTypeFilter}
                onChange={(e) => setWageTypeFilter(e.target.value)}
                className="bg-cosmic-900 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-cyan-500/50 font-mono"
              >
                <option value="ALL">All Wage Types</option>
                <option value="monthly">Monthly</option>
                <option value="hourly">Hourly</option>
                <option value="mission">Mission Pay</option>
              </select>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-cosmic-900 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-cyan-500/50 font-mono"
              >
                <option value="ALL">All Status</option>
                <option value="ACTIVE">Active Only</option>
                <option value="INACTIVE">Decommissioned</option>
              </select>

              {/* View Switcher */}
              <div className="flex items-center bg-cosmic-900 p-0.5 rounded-lg border border-slate-700/80">
                <button
                  onClick={() => setViewMode('cards')}
                  className={`px-2.5 py-1 rounded text-xs font-mono transition-all ${
                    viewMode === 'cards'
                      ? 'bg-cyan-500/20 text-quantum-cyan border border-cyan-500/30 font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Cards
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`px-2.5 py-1 rounded text-xs font-mono transition-all ${
                    viewMode === 'table'
                      ? 'bg-cyan-500/20 text-quantum-cyan border border-cyan-500/30 font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Matrix
                </button>
              </div>
            </div>
          </div>

          {/* Structures List Display */}
          {loading ? (
            <div className="text-center py-16 glass-panel rounded-2xl border border-slate-800">
              <RefreshCw className="w-8 h-8 animate-spin text-quantum-cyan mx-auto mb-3" />
              <p className="text-xs text-slate-400 font-mono">Synchronizing quantum salary structures...</p>
            </div>
          ) : structures.length === 0 ? (
            <div className="text-center py-16 glass-panel rounded-2xl border border-slate-800">
              <Layers className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-slate-300">No salary structures found</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                No compensation containers match your filter. Create a new structure or clear search criteria.
              </p>
              <button
                onClick={() => handleOpenStructureModal()}
                className="mt-4 px-4 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-quantum-cyan text-xs font-mono inline-flex items-center gap-2"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Salary Structure</span>
              </button>
            </div>
          ) : viewMode === 'cards' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {structures.map((struct) => {
                const isSelected = selectedStructureId === struct.id;
                return (
                  <div
                    key={struct.id}
                    className={`rounded-2xl glass-panel p-5 border transition-all duration-200 flex flex-col justify-between group ${
                      isSelected
                        ? 'border-quantum-cyan/50 shadow-[0_0_20px_rgba(0,240,255,0.15)] bg-cosmic-900/80'
                        : 'border-slate-800/80 hover:border-cyan-500/30 bg-cosmic-900/50 hover:bg-cosmic-900/70'
                    }`}
                  >
                    <div>
                      {/* Top Bar: Code + Wage + Active Switch */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-cosmic-950 text-cyan-300 border border-cyan-500/30 font-bold">
                            {struct.code}
                          </span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800/60 text-slate-400 capitalize">
                            {struct.wage_type}
                          </span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800/60 text-slate-400">
                            v{struct.version || 1}
                          </span>
                        </div>

                        {/* Active Toggle */}
                        <button
                          onClick={() => handleToggleStructureStatus(struct)}
                          className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono transition-colors ${
                            struct.is_active
                              ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/30'
                              : 'bg-slate-900 text-slate-500 border border-slate-800'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${struct.is_active ? 'bg-emerald-400' : 'bg-slate-600'}`}></span>
                          <span>{struct.is_active ? 'Active' : 'Inactive'}</span>
                        </button>
                      </div>

                      {/* Title & Description */}
                      <h3 className="text-base font-bold text-white group-hover:text-quantum-cyan transition-colors">
                        {struct.name}
                      </h3>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                        {struct.description || 'No container description configured.'}
                      </p>

                      {/* Rule Breakdown Pills */}
                      <div className="mt-4 pt-3 border-t border-slate-800/80">
                        <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-2">
                          Gravitational Rule Sequence ({struct.total_rules || 0} Rules)
                        </div>
                        <div className="flex flex-wrap gap-1.5 text-[10px] font-mono">
                          <span className="px-2 py-0.5 rounded bg-blue-950/80 text-blue-300 border border-blue-500/30">
                            Basic: {struct.basic_rule_count || 0}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-500/30">
                            Allowances: {struct.allowance_rule_count || 0}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-rose-950/80 text-rose-300 border border-rose-500/30">
                            Deductions: {struct.deduction_rule_count || 0}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-500/30">
                            Net Disbursal
                          </span>
                        </div>
                      </div>

                      {/* Metadata Row: Crew + Contribution */}
                      <div className="mt-3 flex items-center justify-between text-xs text-slate-400 font-mono pt-2 border-t border-slate-800/60">
                        <span className="flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-cyan-400" />
                          <span>{struct.assigned_employees || 0} crew assigned</span>
                        </span>
                        {struct.company_contribution > 0 && (
                          <span className="text-emerald-400">
                            +${parseFloat(struct.company_contribution).toLocaleString()}/mo co-contrib
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Bottom Actions */}
                    <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setSelectedStructureId(struct.id);
                            setActiveTab('rules');
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-purple-950/80 hover:bg-purple-900/80 border border-purple-500/30 text-purple-300 text-xs font-mono flex items-center gap-1 transition-all"
                          title="Configure gravitational rule sequence"
                        >
                          <Workflow className="w-3 h-3" />
                          <span>Rules ({struct.total_rules || 0})</span>
                        </button>
                        <button
                          onClick={() => handleOpenSimulator(struct)}
                          className="p-1.5 rounded-lg bg-cosmic-800 hover:bg-cosmic-700 text-slate-300 hover:text-quantum-cyan border border-slate-700 transition-colors"
                          title="Simulate compensation calculus"
                        >
                          <Play className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleDuplicateStructure(struct)}
                          className="p-1.5 rounded-lg bg-cosmic-800 hover:bg-cosmic-700 text-slate-400 hover:text-slate-200 border border-slate-700 transition-colors"
                          title="Duplicate structure container"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenStructureModal(struct)}
                          className="p-1.5 rounded-lg bg-cosmic-800 hover:bg-cosmic-700 text-slate-400 hover:text-slate-200 border border-slate-700 transition-colors"
                          title="Edit structure container"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteStructure(struct)}
                          className="p-1.5 rounded-lg bg-rose-950/50 hover:bg-rose-900/60 text-rose-400 border border-rose-500/30 transition-colors"
                          title="Decommission structure"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Table View */
            <div className="overflow-x-auto glass-panel rounded-2xl border border-slate-800 shadow-xl">
              <table className="w-full text-left text-xs font-sans">
                <thead className="bg-cosmic-950 text-slate-400 uppercase text-[10px] font-mono tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-3.5 px-4">Code</th>
                    <th className="py-3.5 px-4">Container Name</th>
                    <th className="py-3.5 px-4">Wage Type</th>
                    <th className="py-3.5 px-4">Rules Breakdown</th>
                    <th className="py-3.5 px-4">Assigned Crew</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {structures.map((struct) => (
                    <tr
                      key={struct.id}
                      className="hover:bg-cosmic-800/40 transition-colors group"
                    >
                      <td className="py-3 px-4 font-mono font-bold text-quantum-cyan">
                        {struct.code}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-200 group-hover:text-white">
                          {struct.name}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate max-w-xs font-mono">
                          {struct.description}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-300 capitalize">
                        {struct.wage_type}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 text-[10px] font-mono">
                          <span className="px-1.5 py-0.5 rounded bg-blue-950/80 text-blue-300 border border-blue-500/30">
                            B:{struct.basic_rule_count || 0}
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-500/30">
                            A:{struct.allowance_rule_count || 0}
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-rose-950/80 text-rose-300 border border-rose-500/30">
                            D:{struct.deduction_rule_count || 0}
                          </span>
                          <span className="text-slate-400">({struct.total_rules || 0} total)</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-300">
                        {struct.assigned_employees || 0} crew
                      </td>
                      <td className="py-3 px-4 font-mono">
                        <button
                          onClick={() => handleToggleStructureStatus(struct)}
                          className={`px-2 py-0.5 rounded-full text-[10px] ${
                            struct.is_active
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30'
                              : 'bg-slate-900 text-slate-500 border border-slate-800'
                          }`}
                        >
                          {struct.is_active ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedStructureId(struct.id);
                              setActiveTab('rules');
                            }}
                            className="px-2 py-1 rounded bg-purple-950 text-purple-300 border border-purple-500/30 text-[11px] font-mono hover:bg-purple-900"
                          >
                            Rules
                          </button>
                          <button
                            onClick={() => handleOpenSimulator(struct)}
                            className="p-1 rounded bg-cosmic-800 hover:bg-cosmic-700 text-quantum-cyan"
                            title="Simulate"
                          >
                            <Play className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenStructureModal(struct)}
                            className="p-1 rounded bg-cosmic-800 hover:bg-cosmic-700 text-slate-300"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteStructure(struct)}
                            className="p-1 rounded bg-rose-950/60 hover:bg-rose-900 text-rose-400"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 2: GRAVITATIONAL RULE ENGINE CONFIGURATION ──────────── */}
      {activeTab === 'rules' && (
        <div className="space-y-4">
          {/* Structure Selector & Trajectory Flow Banner */}
          <div className="glass-panel p-4 rounded-2xl border border-purple-500/20 bg-cosmic-900/60">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <Workflow className="w-5 h-5 text-purple-400" />
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Gravitational Execution Sequence Configuration
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    Rules evaluate in ascending sequence order: Basic ➔ Allowance ➔ Gross ➔ Deduction ➔ Net
                  </p>
                </div>
              </div>

              {/* Structure Switcher */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-slate-400">Target Container:</span>
                <select
                  value={selectedStructureId || ''}
                  onChange={(e) => setSelectedStructureId(parseInt(e.target.value, 10))}
                  className="bg-cosmic-950 border border-purple-500/40 rounded-xl px-3 py-1.5 text-xs text-purple-200 focus:outline-none font-mono font-semibold"
                >
                  {structures.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code})
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => handleOpenRuleModal()}
                  className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs font-mono flex items-center gap-1.5 shadow-[0_0_15px_rgba(168,85,247,0.3)] transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Rule</span>
                </button>
              </div>
            </div>

            {/* Visual Gravitational Sequence Flow Pipeline */}
            <div className="grid grid-cols-5 gap-2 pt-3 border-t border-slate-800 text-center">
              <div className="p-2 rounded-lg bg-blue-950/40 border border-blue-500/30">
                <span className="text-[10px] font-mono text-blue-400 block font-bold">1. BASIC</span>
                <span className="text-[11px] text-slate-300 font-mono">Seq 10..40</span>
              </div>
              <div className="p-2 rounded-lg bg-emerald-950/40 border border-emerald-500/30">
                <span className="text-[10px] font-mono text-emerald-400 block font-bold">2. ALLOWANCES</span>
                <span className="text-[11px] text-slate-300 font-mono">Seq 20..90</span>
              </div>
              <div className="p-2 rounded-lg bg-purple-950/40 border border-purple-500/30">
                <span className="text-[10px] font-mono text-purple-400 block font-bold">3. GROSS</span>
                <span className="text-[11px] text-slate-300 font-mono">Seq 100</span>
              </div>
              <div className="p-2 rounded-lg bg-rose-950/40 border border-rose-500/30">
                <span className="text-[10px] font-mono text-rose-400 block font-bold">4. DEDUCTIONS</span>
                <span className="text-[11px] text-slate-300 font-mono">Seq 110..190</span>
              </div>
              <div className="p-2 rounded-lg bg-cyan-950/40 border border-cyan-500/30">
                <span className="text-[10px] font-mono text-quantum-cyan block font-bold">5. NET PAY</span>
                <span className="text-[11px] text-slate-300 font-mono">Seq 200</span>
              </div>
            </div>
          </div>

          {/* Rules Filter Bar */}
          <div className="flex items-center justify-between glass-panel p-3 rounded-xl border border-slate-800">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-mono text-slate-400 mr-1">Category Filter:</span>
              {['ALL', 'basic', 'allowance', 'gross', 'deduction', 'net'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-mono uppercase transition-all ${
                    categoryFilter === cat
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 font-bold'
                      : 'text-slate-400 hover:text-slate-200 border border-transparent'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <button
              onClick={() => handleOpenSimulator()}
              className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-mono flex items-center gap-1.5"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Simulate Output</span>
            </button>
          </div>

          {/* Rules Table with Gravitational Sequencing Controls */}
          {rules.length === 0 ? (
            <div className="text-center py-16 glass-panel rounded-2xl border border-slate-800">
              <Workflow className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-slate-300">No salary rules configured</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                This container has no sequential compensation rules. Add your first Basic or Allowance rule.
              </p>
              <button
                onClick={() => handleOpenRuleModal()}
                className="mt-4 px-4 py-2 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-purple-300 text-xs font-mono inline-flex items-center gap-2"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add First Rule</span>
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto glass-panel rounded-2xl border border-slate-800 shadow-xl">
              <table className="w-full text-left text-xs font-sans">
                <thead className="bg-cosmic-950 text-slate-400 uppercase text-[10px] font-mono tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-3.5 px-3 w-16 text-center">Seq</th>
                    <th className="py-3.5 px-3">Category</th>
                    <th className="py-3.5 px-4">Code & Rule Name</th>
                    <th className="py-3.5 px-4">Computation Matrix</th>
                    <th className="py-3.5 px-3">Formula / Value</th>
                    <th className="py-3.5 px-3">Taxable</th>
                    <th className="py-3.5 px-3">Status</th>
                    <th className="py-3.5 px-3 text-right">Order & Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {filteredRules.map((rule, idx) => {
                    const catStyle = CATEGORY_COLORS[rule.category] || CATEGORY_COLORS.allowance;
                    return (
                      <tr
                        key={rule.id}
                        className="hover:bg-cosmic-800/40 transition-colors group"
                      >
                        {/* Sequence Number */}
                        <td className="py-3 px-3 text-center">
                          <span className="font-mono text-xs font-bold px-2 py-1 rounded bg-cosmic-950 text-purple-300 border border-purple-500/30 shadow-inner">
                            {rule.sequence}
                          </span>
                        </td>

                        {/* Category Badge */}
                        <td className="py-3 px-3">
                          <span
                            className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase font-semibold ${catStyle.badge}`}
                          >
                            {rule.category}
                          </span>
                        </td>

                        {/* Code & Name */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-white text-xs">
                              {rule.code}
                            </span>
                            <span className="text-slate-300 font-medium">
                              {rule.name}
                            </span>
                          </div>
                          {rule.notes && (
                            <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                              {rule.notes}
                            </div>
                          )}
                        </td>

                        {/* Computation Type */}
                        <td className="py-3 px-4 font-mono">
                          <span className="text-[11px] px-2 py-0.5 rounded bg-cosmic-950 text-slate-300 border border-slate-800 capitalize">
                            {rule.computation_type}
                          </span>
                        </td>

                        {/* Formula or Value */}
                        <td className="py-3 px-3 font-mono">
                          {rule.computation_type === 'fixed' && (
                            <span className="text-emerald-400 font-bold">
                              ${parseFloat(rule.amount).toFixed(2)}
                            </span>
                          )}
                          {rule.computation_type === 'percentage' && (
                            <div className="text-purple-300">
                              <span className="font-bold">{rule.percentage}%</span>
                              <span className="text-slate-500 text-[10px] block">
                                {rule.formula ? rule.formula : rule.base_rule_code ? `of [${rule.base_rule_code}]` : 'of base'}
                              </span>
                            </div>
                          )}
                          {rule.computation_type === 'formula' && (
                            <span className="text-cyan-300 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-500/30 text-[11px]">
                              {rule.formula}
                            </span>
                          )}
                        </td>

                        {/* Taxable */}
                        <td className="py-3 px-3 font-mono text-[11px]">
                          {rule.is_taxable ? (
                            <span className="text-amber-400">Taxable</span>
                          ) : (
                            <span className="text-slate-500">Exempt</span>
                          )}
                        </td>

                        {/* Active */}
                        <td className="py-3 px-3 font-mono text-[11px]">
                          <span
                            className={rule.is_active ? 'text-emerald-400' : 'text-slate-600'}
                          >
                            {rule.is_active ? 'Active' : 'Disabled'}
                          </span>
                        </td>

                        {/* Reorder and Actions */}
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleMoveRule(idx, 'up')}
                              disabled={idx === 0}
                              className="p-1 rounded bg-cosmic-800 hover:bg-cosmic-700 text-slate-400 hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                              title="Move sequence up"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleMoveRule(idx, 'down')}
                              disabled={idx === rules.length - 1}
                              className="p-1 rounded bg-cosmic-800 hover:bg-cosmic-700 text-slate-400 hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                              title="Move sequence down"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleOpenRuleModal(rule)}
                              className="p-1 rounded bg-cosmic-800 hover:bg-cosmic-700 text-slate-300 hover:text-quantum-cyan transition-colors"
                              title="Edit rule"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteRule(rule)}
                              className="p-1 rounded bg-rose-950/60 hover:bg-rose-900 text-rose-400 transition-colors"
                              title="Delete rule"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 3: WARP COMPUTATION MATRIX SIMULATOR ────────────────── */}
      {activeTab === 'simulator' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Panel: Simulation Input Controls */}
          <div className="lg:col-span-4 glass-panel p-5 rounded-2xl border border-amber-500/20 bg-cosmic-900/60 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Calculator className="w-5 h-5 text-amber-400" />
              <div>
                <h3 className="text-sm font-bold text-white">Simulation Parameters</h3>
                <p className="text-xs text-slate-400 font-mono">Dynamic warp calculus input sandbox</p>
              </div>
            </div>

            {/* Target Structure */}
            <div>
              <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1">
                Target Salary Structure
              </label>
              <select
                value={selectedStructureId || ''}
                onChange={(e) => {
                  const id = parseInt(e.target.value, 10);
                  setSelectedStructureId(id);
                  runSimulation(id);
                }}
                className="w-full bg-cosmic-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 font-mono font-semibold focus:outline-none focus:border-amber-400"
              >
                {structures.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Annual Base Salary */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-[11px] font-mono uppercase text-slate-400">Annual Base Contract Salary</span>
                <span className="font-mono text-quantum-cyan font-bold">
                  ${simContext.base_salary.toLocaleString()}
                </span>
              </div>
              <input
                type="range"
                min="40000"
                max="300000"
                step="5000"
                value={simContext.base_salary}
                onChange={(e) => setSimContext({ ...simContext, base_salary: parseFloat(e.target.value) })}
                className="w-full accent-cyan-400 cursor-pointer"
              />
              <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                Monthly derived: ${(simContext.base_salary / 12).toFixed(2)}/mo
              </div>
            </div>

            {/* Gravity Allowance */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-[11px] font-mono uppercase text-slate-400">Gravity Allowance (Annual)</span>
                <span className="font-mono text-emerald-400 font-bold">
                  ${simContext.gravity_allowance.toLocaleString()}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="50000"
                step="1000"
                value={simContext.gravity_allowance}
                onChange={(e) => setSimContext({ ...simContext, gravity_allowance: parseFloat(e.target.value) })}
                className="w-full accent-emerald-400 cursor-pointer"
              />
            </div>

            {/* Days Worked */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-[11px] font-mono uppercase text-slate-400">Orbital Days Worked</span>
                <span className="font-mono text-purple-300 font-bold">
                  {simContext.days_worked} days
                </span>
              </div>
              <input
                type="number"
                min="1"
                max="31"
                value={simContext.days_worked}
                onChange={(e) => setSimContext({ ...simContext, days_worked: parseFloat(e.target.value) || 0 })}
                className="w-full bg-cosmic-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200 font-mono focus:outline-none"
              />
            </div>

            {/* Overtime Hours */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-[11px] font-mono uppercase text-slate-400">Overtime Hours</span>
                <span className="font-mono text-amber-300 font-bold">
                  {simContext.overtime_hours} hrs
                </span>
              </div>
              <input
                type="number"
                min="0"
                max="80"
                value={simContext.overtime_hours}
                onChange={(e) => setSimContext({ ...simContext, overtime_hours: parseFloat(e.target.value) || 0 })}
                className="w-full bg-cosmic-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200 font-mono focus:outline-none"
              />
            </div>

            <button
              onClick={() => runSimulation()}
              disabled={isCalculating}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs font-mono flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(251,191,36,0.3)] transition-all"
            >
              <Zap className={`w-4 h-4 ${isCalculating ? 'animate-spin' : ''}`} />
              <span>Engage Warp Calculus</span>
            </button>
          </div>

          {/* Right Panel: Step-by-Step Resolution Trace & Summary */}
          <div className="lg:col-span-8 space-y-4">
            {simResult ? (
              <>
                {/* Summary Output Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="glass-panel p-3.5 rounded-xl border border-blue-500/20 bg-blue-950/20">
                    <span className="text-[10px] font-mono text-blue-400 block uppercase">Total Basic</span>
                    <span className="text-xl font-bold font-mono text-white mt-1 block">
                      ${simResult.summary.total_basic.toFixed(2)}
                    </span>
                  </div>
                  <div className="glass-panel p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-950/20">
                    <span className="text-[10px] font-mono text-emerald-400 block uppercase">Total Allowances</span>
                    <span className="text-xl font-bold font-mono text-emerald-300 mt-1 block">
                      +${simResult.summary.total_allowances.toFixed(2)}
                    </span>
                  </div>
                  <div className="glass-panel p-3.5 rounded-xl border border-rose-500/20 bg-rose-950/20">
                    <span className="text-[10px] font-mono text-rose-400 block uppercase">Total Deductions</span>
                    <span className="text-xl font-bold font-mono text-rose-300 mt-1 block">
                      -${simResult.summary.total_deductions.toFixed(2)}
                    </span>
                  </div>
                  <div className="glass-panel p-3.5 rounded-xl border border-cyan-500/40 bg-cyan-950/40 shadow-[0_0_15px_rgba(0,240,255,0.15)]">
                    <span className="text-[10px] font-mono text-quantum-cyan block uppercase font-bold">Net Disbursable</span>
                    <span className="text-xl font-bold font-mono text-quantum-cyan mt-1 block">
                      ${simResult.summary.net_disbursable.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Execution Trace Timeline */}
                <div className="glass-panel p-5 rounded-2xl border border-slate-800">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-xs font-bold font-mono uppercase text-slate-300 flex items-center gap-2">
                      <Workflow className="w-4 h-4 text-purple-400" />
                      <span>Sequential Gravitational Execution Trace</span>
                    </h4>
                    <span className="text-[10px] font-mono text-slate-500">
                      {simResult.execution_trace.length} rules evaluated in monotonic sequence
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {simResult.execution_trace.map((step) => {
                      const catStyle = CATEGORY_COLORS[step.category] || CATEGORY_COLORS.allowance;
                      return (
                        <div
                          key={step.step}
                          className="flex items-center justify-between p-3 rounded-xl bg-cosmic-950/70 border border-slate-800 hover:border-slate-700 transition-colors text-xs font-mono"
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-6 h-6 rounded-full bg-cosmic-900 border border-slate-700 flex items-center justify-center text-[11px] font-bold text-slate-400">
                              {step.step}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-semibold ${catStyle.badge}`}>
                              {step.category}
                            </span>
                            <div>
                              <div className="text-white font-bold flex items-center gap-2">
                                <span>[{step.rule_code}]</span>
                                <span className="text-slate-300 font-normal">{step.rule_name}</span>
                              </div>
                              <div className="text-[10px] text-slate-500 mt-0.5">
                                {step.formula_used}
                              </div>
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="text-sm font-bold text-white">
                              ${step.computed_amount.toFixed(2)}
                            </div>
                            <div className="text-[10px] text-slate-500">
                              Running Gross: ${step.running_totals.gross.toFixed(2)}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-20 glass-panel rounded-2xl border border-slate-800">
                <Calculator className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                <p className="text-xs text-slate-400 font-mono">
                  Select a salary structure and click &quot;Engage Warp Calculus&quot; to inspect output.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── MODAL 1: SALARY STRUCTURE CREATE / EDIT ─────────────────── */}
      {isStructureModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="glass-panel w-full max-w-lg rounded-2xl border border-cyan-500/30 p-6 shadow-2xl bg-cosmic-950 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-quantum-cyan" />
                <h3 className="text-base font-bold text-white">
                  {editingStructure ? 'Recalibrate Salary Structure' : 'Initialize Salary Structure Container'}
                </h3>
              </div>
              <button
                onClick={() => setIsStructureModalOpen(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitStructure} className="space-y-3.5 text-xs font-sans">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono text-slate-400 uppercase mb-1">
                    Structure Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={structForm.code}
                    onChange={(e) => setStructForm({ ...structForm, code: e.target.value.toUpperCase() })}
                    placeholder="e.g. STRUCT-ORB-REG"
                    className="w-full bg-cosmic-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 font-mono focus:outline-none focus:border-cyan-500 uppercase"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono text-slate-400 uppercase mb-1">
                    Wage Type *
                  </label>
                  <select
                    value={structForm.wage_type}
                    onChange={(e) => setStructForm({ ...structForm, wage_type: e.target.value })}
                    className="w-full bg-cosmic-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 font-mono focus:outline-none focus:border-cyan-500 capitalize"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="hourly">Hourly</option>
                    <option value="mission">Mission Pay</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-slate-400 uppercase mb-1">
                  Structure Name *
                </label>
                <input
                  type="text"
                  required
                  value={structForm.name}
                  onChange={(e) => setStructForm({ ...structForm, name: e.target.value })}
                  placeholder="e.g. Regular Orbital Salary"
                  className="w-full bg-cosmic-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500 font-semibold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-slate-400 uppercase mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={structForm.description}
                  onChange={(e) => setStructForm({ ...structForm, description: e.target.value })}
                  placeholder="Operational notes, target crew grade, gravity allowance integration..."
                  className="w-full bg-cosmic-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-300 focus:outline-none focus:border-cyan-500 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono text-slate-400 uppercase mb-1">
                    Company Contribution ($)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={structForm.company_contribution}
                    onChange={(e) => setStructForm({ ...structForm, company_contribution: e.target.value })}
                    className="w-full bg-cosmic-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono text-slate-400 uppercase mb-1">
                    Currency
                  </label>
                  <input
                    type="text"
                    value={structForm.currency}
                    onChange={(e) => setStructForm({ ...structForm, currency: e.target.value.toUpperCase() })}
                    className="w-full bg-cosmic-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 font-mono focus:outline-none focus:border-cyan-500 uppercase"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="struct_active"
                  checked={structForm.is_active}
                  onChange={(e) => setStructForm({ ...structForm, is_active: e.target.checked })}
                  className="rounded accent-cyan-400 w-4 h-4 cursor-pointer"
                />
                <label htmlFor="struct_active" className="text-xs font-mono text-slate-300 cursor-pointer">
                  Activate Container for Crew Compensation Mapping
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsStructureModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-cosmic-800 hover:bg-cosmic-700 text-slate-400 hover:text-slate-200 text-xs font-mono"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-quantum-cyan hover:bg-cyan-400 text-slate-950 font-bold text-xs font-mono shadow-[0_0_15px_rgba(0,240,255,0.3)] transition-all"
                >
                  {editingStructure ? 'Save Recalibration' : 'Initialize Structure'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL 2: SALARY RULE CREATE / EDIT ───────────────────────── */}
      {isRuleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="glass-panel w-full max-w-xl rounded-2xl border border-purple-500/30 p-6 shadow-2xl bg-cosmic-950 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Workflow className="w-5 h-5 text-purple-400" />
                <h3 className="text-base font-bold text-white">
                  {editingRule ? `Recalibrate Rule [${editingRule.code}]` : 'Configure New Salary Rule'}
                </h3>
              </div>
              <button
                onClick={() => setIsRuleModalOpen(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitRule} className="space-y-3.5 text-xs font-sans">
              {/* Structure Selection */}
              <div>
                <label className="block text-[11px] font-mono text-slate-400 uppercase mb-1">
                  Salary Structure Container *
                </label>
                <select
                  required
                  value={ruleForm.salary_structure_id}
                  onChange={(e) => setRuleForm({ ...ruleForm, salary_structure_id: e.target.value })}
                  className="w-full bg-cosmic-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 font-mono focus:outline-none focus:border-purple-500"
                >
                  {structures.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Code & Name */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono text-slate-400 uppercase mb-1">
                    Rule Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={ruleForm.code}
                    onChange={(e) => setRuleForm({ ...ruleForm, code: e.target.value.toUpperCase().replace(/\s+/g, '_') })}
                    placeholder="e.g. ORB_HAZARD"
                    className="w-full bg-cosmic-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 font-mono focus:outline-none focus:border-purple-500 uppercase font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono text-slate-400 uppercase mb-1">
                    Rule Display Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={ruleForm.name}
                    onChange={(e) => setRuleForm({ ...ruleForm, name: e.target.value })}
                    placeholder="e.g. Orbital Hazard Differential"
                    className="w-full bg-cosmic-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-purple-500 font-medium"
                  />
                </div>
              </div>

              {/* Category & Sequence */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono text-slate-400 uppercase mb-1">
                    Category (Execution Band) *
                  </label>
                  <select
                    value={ruleForm.category}
                    onChange={(e) => {
                      const cat = e.target.value;
                      const seq = DEFAULT_CATEGORY_SEQS[cat] || 20;
                      setRuleForm({ ...ruleForm, category: cat, sequence: seq });
                    }}
                    className="w-full bg-cosmic-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 font-mono focus:outline-none focus:border-purple-500 uppercase"
                  >
                    <option value="basic">Basic (Sequence 10..40)</option>
                    <option value="allowance">Allowance (Sequence 20..90)</option>
                    <option value="gross">Gross (Sequence 100)</option>
                    <option value="deduction">Deduction (Sequence 110..190)</option>
                    <option value="net">Net (Sequence 200)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-mono text-slate-400 uppercase mb-1">
                    Execution Sequence Number *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    max="999"
                    value={ruleForm.sequence}
                    onChange={(e) => setRuleForm({ ...ruleForm, sequence: e.target.value })}
                    className="w-full bg-cosmic-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 font-mono focus:outline-none focus:border-purple-500 font-bold"
                  />
                  <span className="text-[10px] text-slate-500 font-mono">
                    Lower sequence evaluates first
                  </span>
                </div>
              </div>

              {/* Computation Type */}
              <div>
                <label className="block text-[11px] font-mono text-slate-400 uppercase mb-1">
                  Computation Method (/warp-computation-matrix) *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['fixed', 'percentage', 'formula'].map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setRuleForm({ ...ruleForm, computation_type: type })}
                      className={`py-2 px-3 rounded-xl text-xs font-mono uppercase transition-all ${
                        ruleForm.computation_type === type
                          ? 'bg-purple-600 text-white font-bold border border-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.3)]'
                          : 'bg-cosmic-900 text-slate-400 hover:text-slate-200 border border-slate-700'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Conditional Inputs based on computation type */}
              {ruleForm.computation_type === 'fixed' && (
                <div>
                  <label className="block text-[11px] font-mono text-slate-400 uppercase mb-1">
                    Fixed Amount ($) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={ruleForm.amount}
                    onChange={(e) => setRuleForm({ ...ruleForm, amount: e.target.value })}
                    placeholder="e.g. 1000.00"
                    className="w-full bg-cosmic-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 font-mono focus:outline-none focus:border-purple-500 font-bold text-sm"
                  />
                </div>
              )}

              {ruleForm.computation_type === 'percentage' && (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-mono text-slate-400 uppercase mb-1">
                        Percentage (%) *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={ruleForm.percentage}
                        onChange={(e) => setRuleForm({ ...ruleForm, percentage: e.target.value })}
                        placeholder="e.g. 12.00"
                        className="w-full bg-cosmic-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 font-mono focus:outline-none focus:border-purple-500 font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-mono text-slate-400 uppercase mb-1">
                        Base Rule Target
                      </label>
                      <select
                        value={ruleForm.base_rule_id || ''}
                        onChange={(e) => setRuleForm({ ...ruleForm, base_rule_id: e.target.value })}
                        className="w-full bg-cosmic-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 font-mono focus:outline-none focus:border-purple-500"
                      >
                        <option value="">Default (Monthly Base / Gross)</option>
                        {rules
                          .filter((r) => r.sequence < ruleForm.sequence)
                          .map((r) => (
                            <option key={r.id} value={r.id}>
                              [{r.code}] {r.name} (Seq {r.sequence})
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono text-slate-400 mb-0.5">
                      Or Custom Percentage Base Formula
                    </label>
                    <input
                      type="text"
                      value={ruleForm.formula || ''}
                      onChange={(e) => setRuleForm({ ...ruleForm, formula: e.target.value })}
                      placeholder="e.g. BASIC * 0.12 or base_salary / 12"
                      className="w-full bg-cosmic-900 border border-slate-700 rounded-xl px-3 py-1.5 text-slate-300 font-mono text-xs focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {ruleForm.computation_type === 'formula' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-[11px] font-mono text-slate-400 uppercase">
                      Space Calculation Formula *
                    </label>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                        formulaStatus.valid
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30'
                          : 'bg-rose-950 text-rose-400 border border-rose-500/30'
                      }`}
                    >
                      {formulaStatus.valid ? '✓ Syntax Nominal' : '⚠ Syntax Fault'}
                    </span>
                  </div>

                  <textarea
                    rows={2}
                    required
                    value={ruleForm.formula || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setRuleForm({ ...ruleForm, formula: val });
                      checkFormulaSyntax(val);
                    }}
                    placeholder="e.g. BASIC + GRAV_ALLOW + ORB_HAZARD"
                    className="w-full bg-cosmic-900 border border-slate-700 rounded-xl px-3 py-2 text-cyan-300 font-mono text-xs focus:outline-none focus:border-purple-500"
                  />

                  {/* Clickable Variable Chips */}
                  <div>
                    <span className="text-[10px] font-mono text-slate-500 block mb-1">
                      Available Rule & Context Variables (Click to insert):
                    </span>
                    <div className="flex flex-wrap gap-1 text-[10px] font-mono">
                      {['base_salary', 'gravity_allowance', 'days_worked', 'overtime_hours', 'BASIC', 'GROSS'].map(
                        (v) => (
                          <button
                            key={v}
                            type="button"
                            onClick={() => {
                              const updated = ruleForm.formula ? `${ruleForm.formula} + ${v}` : v;
                              setRuleForm({ ...ruleForm, formula: updated });
                              checkFormulaSyntax(updated);
                            }}
                            className="px-2 py-0.5 rounded bg-cosmic-900 hover:bg-cosmic-800 text-slate-300 border border-slate-700 hover:border-cyan-500"
                          >
                            +{v}
                          </button>
                        )
                      )}
                    </div>
                  </div>

                  {formulaStatus.message && (
                    <div
                      className={`text-[11px] font-mono p-2 rounded-lg border ${
                        formulaStatus.valid
                          ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/30'
                          : 'bg-rose-950/40 text-rose-300 border-rose-500/30'
                      }`}
                    >
                      {formulaStatus.message}
                    </div>
                  )}
                </div>
              )}

              {/* Toggles */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="rule_taxable"
                    checked={ruleForm.is_taxable}
                    onChange={(e) => setRuleForm({ ...ruleForm, is_taxable: e.target.checked })}
                    className="rounded accent-purple-400 w-4 h-4 cursor-pointer"
                  />
                  <label htmlFor="rule_taxable" className="text-xs font-mono text-slate-300 cursor-pointer">
                    Taxable Compensation
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="rule_active"
                    checked={ruleForm.is_active}
                    onChange={(e) => setRuleForm({ ...ruleForm, is_active: e.target.checked })}
                    className="rounded accent-purple-400 w-4 h-4 cursor-pointer"
                  />
                  <label htmlFor="rule_active" className="text-xs font-mono text-slate-300 cursor-pointer">
                    Rule Active in Sequence
                  </label>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-[11px] font-mono text-slate-400 uppercase mb-1">
                  Rule Description & Space Documentation
                </label>
                <input
                  type="text"
                  value={ruleForm.notes || ''}
                  onChange={(e) => setRuleForm({ ...ruleForm, notes: e.target.value })}
                  placeholder="Rationale or statutory policy reference..."
                  className="w-full bg-cosmic-900 border border-slate-700 rounded-xl px-3 py-1.5 text-slate-300 text-xs focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsRuleModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-cosmic-800 hover:bg-cosmic-700 text-slate-400 hover:text-slate-200 text-xs font-mono"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs font-mono shadow-[0_0_15px_rgba(168,85,247,0.3)] transition-all"
                >
                  {editingRule ? 'Save Recalibration' : 'Commit Rule to Sequence'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
