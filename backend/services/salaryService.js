// ====================================================================
// PeoplePay360: Anti-Gravity HR & Payroll Platform
// /quantum-salary-structuring — Containerized Salary Structures & Rule Mapping
// /gravitational-rule-engine  — Ordered Rule Execution (Basic -> Allowance -> Gross -> Deduction -> Net)
// /warp-computation-matrix    — Fixed, Percentage & Custom Space Formulas
// ====================================================================

const quantumPool = require('../config/quantumPool');
const memoryStore = require('../config/quantumMemoryAdapter');

// Canonical category ordering for /gravitational-rule-engine
const CATEGORY_ORDER = {
  basic: 1,
  allowance: 2,
  gross: 3,
  deduction: 4,
  net: 5,
};

const DEFAULT_CATEGORY_SEQUENCES = {
  basic: 10,
  allowance: 30,
  gross: 100,
  deduction: 120,
  net: 200,
};

/**
 * /warp-computation-matrix: Safe Space Formula Evaluator
 * Safely evaluates mathematical expressions referencing prior rule codes
 * and employee context variables without arbitrary code execution.
 */
function evaluateFormula(formulaStr, scope = {}) {
  if (!formulaStr || typeof formulaStr !== 'string') return 0;

  // Trim and clean formula
  let expression = formulaStr.trim();

  // Normalize case-insensitively for variable lookups
  const scopeNormalized = {};
  for (const [k, v] of Object.entries(scope)) {
    scopeNormalized[k.toUpperCase()] = typeof v === 'number' ? v : parseFloat(v) || 0;
    scopeNormalized[k.toLowerCase()] = scopeNormalized[k.toUpperCase()];
  }

  // Replace recognized math functions with JavaScript Math equivalents
  const mathFunctions = {
    'ROUND': 'Math.round',
    'FLOOR': 'Math.floor',
    'CEIL': 'Math.ceil',
    'ABS': 'Math.abs',
    'MIN': 'Math.min',
    'MAX': 'Math.max',
  };

  // Replace variable identifiers (e.g. BASIC, GROSS, base_salary, days_worked)
  // Ensure we do not replace function names
  expression = expression.replace(/\b([a-zA-Z_][a-zA-Z0-9_]*)\b/g, (match) => {
    const upper = match.toUpperCase();
    if (mathFunctions[upper]) {
      return mathFunctions[upper];
    }
    if (match.startsWith('Math.')) {
      return match;
    }
    if (Object.prototype.hasOwnProperty.call(scopeNormalized, upper)) {
      return `(${scopeNormalized[upper]})`;
    }
    if (Object.prototype.hasOwnProperty.call(scopeNormalized, match)) {
      return `(${scopeNormalized[match]})`;
    }
    // Unknown variable defaults to 0
    return '0';
  });

  // Security gate: allow only numbers, parentheses, basic operators, Math calls, and whitespace
  const sanitized = expression.replace(/Math\.(round|floor|ceil|abs|min|max)/g, '');
  if (/[^0-9\.\+\-\*\/\%\(\)\,\s]/.test(sanitized)) {
    throw new Error(`Formula contains invalid characters or unsafe tokens: "${formulaStr}"`);
  }

  try {
    // Controlled evaluation inside Function with strict bounds
    const compute = new Function(`return (${expression});`);
    const val = compute();
    if (typeof val !== 'number' || isNaN(val) || !isFinite(val)) {
      return 0;
    }
    return Math.round((val + Number.EPSILON) * 100) / 100;
  } catch (err) {
    throw new Error(`Calculation syntax error in formula "${formulaStr}": ${err.message}`);
  }
}

/**
 * Validate formula syntax and extract referenced variables
 */
function inspectFormula(formulaStr) {
  if (!formulaStr || !formulaStr.trim()) {
    return { valid: true, variables: [] };
  }
  const reserved = new Set(['ROUND', 'FLOOR', 'CEIL', 'ABS', 'MIN', 'MAX', 'MATH']);
  const matches = formulaStr.match(/\b([a-zA-Z_][a-zA-Z0-9_]*)\b/g) || [];
  const variables = [...new Set(matches.filter(m => !reserved.has(m.toUpperCase())))];

  // Test evaluation with dummy 1s
  const dummyScope = {};
  for (const v of variables) dummyScope[v] = 100;

  try {
    evaluateFormula(formulaStr, dummyScope);
    return { valid: true, variables };
  } catch (err) {
    return { valid: false, variables, error: err.message };
  }
}

class SalaryService {
  // ──────────────────────────────────────────────────────────────────────────
  // 1. /quantum-salary-structuring: Structure Containers & Active Rule Mapping
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Get all salary structures with rule counts & assigned employee counts
   */
  async getStructures({ search, is_active, wage_type } = {}) {
    try {
      // Attempt PostgreSQL query first
      let query = `
        SELECT 
          s.*,
          COUNT(r.id)::INTEGER AS total_rules,
          COUNT(CASE WHEN r.category = 'basic' THEN 1 END)::INTEGER AS basic_rule_count,
          COUNT(CASE WHEN r.category = 'allowance' THEN 1 END)::INTEGER AS allowance_rule_count,
          COUNT(CASE WHEN r.category = 'deduction' THEN 1 END)::INTEGER AS deduction_rule_count,
          COUNT(CASE WHEN r.category = 'gross' THEN 1 END)::INTEGER AS gross_rule_count,
          COUNT(CASE WHEN r.category = 'net' THEN 1 END)::INTEGER AS net_rule_count,
          COALESCE(emp_counts.assigned_employees, 0)::INTEGER AS assigned_employees
        FROM salary_structures s
        LEFT JOIN salary_rules r ON r.salary_structure_id = s.id AND r.is_active = TRUE
        LEFT JOIN (
          SELECT salary_structure, COUNT(DISTINCT employee_id) AS assigned_employees
          FROM contracts
          WHERE status = 'active'
          GROUP BY salary_structure
        ) emp_counts ON emp_counts.salary_structure = s.name OR emp_counts.salary_structure = s.code
        WHERE 1=1
      `;
      const params = [];

      if (search) {
        params.push(`%${search}%`);
        query += ` AND (s.name ILIKE $${params.length} OR s.code ILIKE $${params.length} OR s.description ILIKE $${params.length})`;
      }
      if (is_active !== undefined) {
        params.push(is_active === 'true' || is_active === true);
        query += ` AND s.is_active = $${params.length}`;
      }
      if (wage_type) {
        params.push(wage_type);
        query += ` AND s.wage_type = $${params.length}`;
      }

      query += ` GROUP BY s.id, emp_counts.assigned_employees ORDER BY s.id ASC`;

      const result = await quantumPool.query(query, params);
      return { structures: result.rows, source: 'POSTGRESQL' };
    } catch (dbError) {
      // Resilient Quantum Memory Fallback
      let list = memoryStore.state.salary_structures.slice();

      if (search) {
        const q = search.toLowerCase();
        list = list.filter(s => 
          (s.name && s.name.toLowerCase().includes(q)) ||
          (s.code && s.code.toLowerCase().includes(q)) ||
          (s.description && s.description.toLowerCase().includes(q))
        );
      }
      if (is_active !== undefined) {
        const act = is_active === 'true' || is_active === true;
        list = list.filter(s => Boolean(s.is_active) === act);
      }
      if (wage_type) {
        list = list.filter(s => s.wage_type === wage_type);
      }

      const enhanced = list.map(s => {
        const rules = memoryStore.state.salary_rules.filter(r => r.salary_structure_id === s.id && r.is_active);
        const assignedContracts = memoryStore.state.contracts.filter(c => 
          c.status === 'active' && (c.salary_structure === s.name || c.salary_structure === s.code)
        );

        return {
          ...s,
          total_rules: rules.length,
          basic_rule_count: rules.filter(r => r.category === 'basic').length,
          allowance_rule_count: rules.filter(r => r.category === 'allowance').length,
          deduction_rule_count: rules.filter(r => r.category === 'deduction').length,
          gross_rule_count: rules.filter(r => r.category === 'gross').length,
          net_rule_count: rules.filter(r => r.category === 'net').length,
          assigned_employees: assignedContracts.length,
        };
      });

      return { structures: enhanced, source: 'QUANTUM_FAILOVER' };
    }
  }

  /**
   * Get single salary structure by ID with all rules sorted in sequence
   */
  async getStructureById(id) {
    const sId = parseInt(id, 10);
    try {
      const sQuery = `SELECT * FROM salary_structures WHERE id = $1`;
      const sRes = await quantumPool.query(sQuery, [sId]);
      if (sRes.rows.length === 0) return null;

      const structure = sRes.rows[0];

      // Fetch rules sorted by gravitational sequence
      const rQuery = `
        SELECT 
          r.*,
          b.name AS base_rule_name,
          b.code AS base_rule_code
        FROM salary_rules r
        LEFT JOIN salary_rules b ON r.base_rule_id = b.id
        WHERE r.salary_structure_id = $1
        ORDER BY r.sequence ASC, r.id ASC
      `;
      const rRes = await quantumPool.query(rQuery, [sId]);
      structure.rules = rRes.rows;

      // Count assigned active employees
      const cQuery = `
        SELECT COUNT(DISTINCT employee_id)::INTEGER AS assigned_employees
        FROM contracts
        WHERE status = 'active' AND (salary_structure = $1 OR salary_structure = $2)
      `;
      const cRes = await quantumPool.query(cQuery, [structure.name, structure.code]);
      structure.assigned_employees = cRes.rows[0]?.assigned_employees || 0;

      return structure;
    } catch (dbError) {
      // Memory fallback
      const structure = memoryStore.state.salary_structures.find(s => s.id === sId);
      if (!structure) return null;

      const rules = memoryStore.state.salary_rules
        .filter(r => r.salary_structure_id === sId)
        .sort((a, b) => a.sequence - b.sequence);

      const rulesWithBase = rules.map(r => {
        const base = r.base_rule_id ? memoryStore.state.salary_rules.find(x => x.id === r.base_rule_id) : null;
        return {
          ...r,
          base_rule_name: base ? base.name : null,
          base_rule_code: base ? base.code : null,
        };
      });

      const assignedContracts = memoryStore.state.contracts.filter(c =>
        c.status === 'active' && (c.salary_structure === structure.name || c.salary_structure === structure.code)
      );

      return {
        ...structure,
        rules: rulesWithBase,
        assigned_employees: assignedContracts.length,
      };
    }
  }

  /**
   * Create a new containerized salary structure
   */
  async createStructure(data) {
    const {
      code,
      name,
      description = '',
      wage_type = 'monthly',
      company_contribution = 0,
      is_active = true,
      currency = 'USD',
      notes = '',
    } = data;

    if (!code || !name) {
      throw new Error('Structure code and name are required parameters');
    }

    try {
      const q = `
        INSERT INTO salary_structures (code, name, description, wage_type, company_contribution, is_active, currency, version, notes)
        VALUES ($1, $2, $3, $4, $5, $6, $7, 1, $8)
        RETURNING *
      `;
      const res = await quantumPool.query(q, [
        code.trim().toUpperCase(),
        name.trim(),
        description.trim(),
        wage_type,
        parseFloat(company_contribution) || 0,
        is_active,
        currency.trim().toUpperCase(),
        notes.trim(),
      ]);
      return res.rows[0];
    } catch (dbError) {
      // Memory fallback
      const exists = memoryStore.state.salary_structures.some(
        s => s.code.toUpperCase() === code.trim().toUpperCase()
      );
      if (exists) {
        throw new Error(`Salary structure code '${code}' already exists in registry`);
      }

      const nextId = memoryStore.state.salary_structures.length > 0
        ? Math.max(...memoryStore.state.salary_structures.map(s => s.id)) + 1
        : 1;

      const newStruct = {
        id: nextId,
        code: code.trim().toUpperCase(),
        name: name.trim(),
        description: description.trim(),
        wage_type,
        company_contribution: parseFloat(company_contribution) || 0,
        is_active: Boolean(is_active),
        currency: currency.trim().toUpperCase(),
        version: 1,
        notes: notes.trim(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      memoryStore.state.salary_structures.push(newStruct);
      memoryStore.save();
      return newStruct;
    }
  }

  /**
   * Update an existing salary structure
   */
  async updateStructure(id, data) {
    const sId = parseInt(id, 10);
    const {
      code,
      name,
      description,
      wage_type,
      company_contribution,
      is_active,
      currency,
      notes,
    } = data;

    try {
      const q = `
        UPDATE salary_structures
        SET 
          code = COALESCE($1, code),
          name = COALESCE($2, name),
          description = COALESCE($3, description),
          wage_type = COALESCE($4, wage_type),
          company_contribution = COALESCE($5, company_contribution),
          is_active = COALESCE($6, is_active),
          currency = COALESCE($7, currency),
          notes = COALESCE($8, notes),
          version = version + 1,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $9
        RETURNING *
      `;
      const res = await quantumPool.query(q, [
        code ? code.trim().toUpperCase() : null,
        name ? name.trim() : null,
        description !== undefined ? description.trim() : null,
        wage_type || null,
        company_contribution !== undefined ? parseFloat(company_contribution) : null,
        is_active !== undefined ? Boolean(is_active) : null,
        currency ? currency.trim().toUpperCase() : null,
        notes !== undefined ? notes.trim() : null,
        sId,
      ]);
      return res.rows[0] || null;
    } catch (dbError) {
      const idx = memoryStore.state.salary_structures.findIndex(s => s.id === sId);
      if (idx === -1) return null;

      const current = memoryStore.state.salary_structures[idx];
      const updated = {
        ...current,
        code: code ? code.trim().toUpperCase() : current.code,
        name: name ? name.trim() : current.name,
        description: description !== undefined ? description.trim() : current.description,
        wage_type: wage_type || current.wage_type,
        company_contribution: company_contribution !== undefined ? parseFloat(company_contribution) : current.company_contribution,
        is_active: is_active !== undefined ? Boolean(is_active) : current.is_active,
        currency: currency ? currency.trim().toUpperCase() : current.currency,
        notes: notes !== undefined ? notes.trim() : current.notes,
        version: current.version + 1,
        updated_at: new Date().toISOString(),
      };

      memoryStore.state.salary_structures[idx] = updated;
      memoryStore.save();
      return updated;
    }
  }

  /**
   * Toggle structure active status
   */
  async toggleStructureStatus(id, isActive) {
    const sId = parseInt(id, 10);
    try {
      const q = `
        UPDATE salary_structures 
        SET is_active = $1, updated_at = CURRENT_TIMESTAMP 
        WHERE id = $2 RETURNING *
      `;
      const res = await quantumPool.query(q, [Boolean(isActive), sId]);
      return res.rows[0];
    } catch (dbError) {
      const s = memoryStore.state.salary_structures.find(x => x.id === sId);
      if (!s) return null;
      s.is_active = Boolean(isActive);
      s.updated_at = new Date().toISOString();
      memoryStore.save();
      return s;
    }
  }

  /**
   * Delete salary structure and cascade rules
   */
  async deleteStructure(id) {
    const sId = parseInt(id, 10);
    try {
      await quantumPool.query(`DELETE FROM salary_structures WHERE id = $1`, [sId]);
      return true;
    } catch (dbError) {
      const idx = memoryStore.state.salary_structures.findIndex(s => s.id === sId);
      if (idx === -1) return false;
      memoryStore.state.salary_structures.splice(idx, 1);
      memoryStore.state.salary_rules = memoryStore.state.salary_rules.filter(r => r.salary_structure_id !== sId);
      memoryStore.save();
      return true;
    }
  }

  /**
   * Clone/Duplicate structure with all associated rules
   */
  async duplicateStructure(id, newCode, newName) {
    const sId = parseInt(id, 10);
    const original = await this.getStructureById(sId);
    if (!original) throw new Error('Original structure not found');

    const code = newCode || `${original.code}_COPY`;
    const name = newName || `${original.name} (Clone)`;

    const created = await this.createStructure({
      code,
      name,
      description: `Cloned from ${original.name}. ${original.description || ''}`,
      wage_type: original.wage_type,
      company_contribution: original.company_contribution,
      currency: original.currency,
      notes: `Duplicated on ${new Date().toISOString()}`,
    });

    // Copy rules over to new structure
    if (original.rules && original.rules.length > 0) {
      for (const r of original.rules) {
        await this.createRule({
          salary_structure_id: created.id,
          name: r.name,
          code: r.code,
          category: r.category,
          sequence: r.sequence,
          computation_type: r.computation_type,
          amount: r.amount,
          percentage: r.percentage,
          formula: r.formula,
          is_active: r.is_active,
          is_taxable: r.is_taxable,
          notes: r.notes,
        });
      }
    }

    return await this.getStructureById(created.id);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 2. /gravitational-rule-engine: Ordered Rule Execution & Sequencing
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Get all rules with optional filters
   */
  async getRules({ salary_structure_id, category, is_active, search } = {}) {
    try {
      let query = `
        SELECT 
          r.*,
          s.name AS structure_name,
          s.code AS structure_code,
          b.name AS base_rule_name,
          b.code AS base_rule_code
        FROM salary_rules r
        JOIN salary_structures s ON r.salary_structure_id = s.id
        LEFT JOIN salary_rules b ON r.base_rule_id = b.id
        WHERE 1=1
      `;
      const params = [];

      if (salary_structure_id) {
        params.push(parseInt(salary_structure_id, 10));
        query += ` AND r.salary_structure_id = $${params.length}`;
      }
      if (category) {
        params.push(category.toLowerCase());
        query += ` AND r.category = $${params.length}`;
      }
      if (is_active !== undefined) {
        params.push(is_active === 'true' || is_active === true);
        query += ` AND r.is_active = $${params.length}`;
      }
      if (search) {
        params.push(`%${search}%`);
        query += ` AND (r.name ILIKE $${params.length} OR r.code ILIKE $${params.length} OR r.formula ILIKE $${params.length})`;
      }

      query += ` ORDER BY r.salary_structure_id ASC, r.sequence ASC, r.id ASC`;

      const result = await quantumPool.query(query, params);
      return result.rows;
    } catch (dbError) {
      let rules = memoryStore.state.salary_rules.slice();

      if (salary_structure_id) {
        const sid = parseInt(salary_structure_id, 10);
        rules = rules.filter(r => r.salary_structure_id === sid);
      }
      if (category) {
        rules = rules.filter(r => r.category.toLowerCase() === category.toLowerCase());
      }
      if (is_active !== undefined) {
        const act = is_active === 'true' || is_active === true;
        rules = rules.filter(r => Boolean(r.is_active) === act);
      }
      if (search) {
        const q = search.toLowerCase();
        rules = rules.filter(r => 
          (r.name && r.name.toLowerCase().includes(q)) ||
          (r.code && r.code.toLowerCase().includes(q)) ||
          (r.formula && r.formula.toLowerCase().includes(q))
        );
      }

      rules.sort((a, b) => {
        if (a.salary_structure_id !== b.salary_structure_id) {
          return a.salary_structure_id - b.salary_structure_id;
        }
        return a.sequence - b.sequence;
      });

      return rules.map(r => {
        const struct = memoryStore.state.salary_structures.find(s => s.id === r.salary_structure_id);
        const base = r.base_rule_id ? memoryStore.state.salary_rules.find(b => b.id === r.base_rule_id) : null;
        return {
          ...r,
          structure_name: struct ? struct.name : null,
          structure_code: struct ? struct.code : null,
          base_rule_name: base ? base.name : null,
          base_rule_code: base ? base.code : null,
        };
      });
    }
  }

  /**
   * Get single rule by ID
   */
  async getRuleById(id) {
    const rId = parseInt(id, 10);
    try {
      const q = `
        SELECT 
          r.*,
          s.name AS structure_name,
          s.code AS structure_code,
          b.name AS base_rule_name,
          b.code AS base_rule_code
        FROM salary_rules r
        JOIN salary_structures s ON r.salary_structure_id = s.id
        LEFT JOIN salary_rules b ON r.base_rule_id = b.id
        WHERE r.id = $1
      `;
      const res = await quantumPool.query(q, [rId]);
      return res.rows[0] || null;
    } catch (dbError) {
      const r = memoryStore.state.salary_rules.find(x => x.id === rId);
      if (!r) return null;
      const struct = memoryStore.state.salary_structures.find(s => s.id === r.salary_structure_id);
      const base = r.base_rule_id ? memoryStore.state.salary_rules.find(b => b.id === r.base_rule_id) : null;
      return {
        ...r,
        structure_name: struct ? struct.name : null,
        structure_code: struct ? struct.code : null,
        base_rule_name: base ? base.name : null,
        base_rule_code: base ? base.code : null,
      };
    }
  }

  /**
   * Create a new salary rule with gravitational sequence enforcement
   */
  async createRule(data) {
    const {
      salary_structure_id,
      name,
      code,
      category,
      sequence,
      computation_type = 'fixed',
      amount = 0,
      percentage = 0,
      formula = null,
      base_rule_id = null,
      is_active = true,
      is_taxable = true,
      notes = '',
    } = data;

    if (!salary_structure_id || !name || !code || !category) {
      throw new Error('salary_structure_id, name, code, and category are required parameters');
    }

    const normCategory = category.toLowerCase();
    if (!CATEGORY_ORDER[normCategory]) {
      throw new Error(`Invalid rule category '${category}'. Must be one of: basic, allowance, gross, deduction, net`);
    }

    // Default sequence based on gravitational category if not provided
    const seq = sequence !== undefined && sequence !== null && !isNaN(sequence)
      ? parseInt(sequence, 10)
      : (DEFAULT_CATEGORY_SEQUENCES[normCategory] || 50);

    // Validate formula if formula computation
    if (computation_type === 'formula' && formula) {
      const check = inspectFormula(formula);
      if (!check.valid) {
        throw new Error(`Invalid formula syntax: ${check.error}`);
      }
    }

    try {
      const q = `
        INSERT INTO salary_rules (
          salary_structure_id, name, code, category, sequence,
          computation_type, amount, percentage, formula, base_rule_id,
          is_active, is_taxable, notes
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING *
      `;
      const res = await quantumPool.query(q, [
        parseInt(salary_structure_id, 10),
        name.trim(),
        code.trim().toUpperCase(),
        normCategory,
        seq,
        computation_type.toLowerCase(),
        parseFloat(amount) || 0,
        parseFloat(percentage) || 0,
        formula ? formula.trim() : null,
        base_rule_id ? parseInt(base_rule_id, 10) : null,
        Boolean(is_active),
        Boolean(is_taxable),
        notes ? notes.trim() : '',
      ]);
      return res.rows[0];
    } catch (dbError) {
      // Memory fallback
      const sid = parseInt(salary_structure_id, 10);
      const exists = memoryStore.state.salary_rules.some(
        r => r.salary_structure_id === sid && r.code.toUpperCase() === code.trim().toUpperCase()
      );
      if (exists) {
        throw new Error(`Salary rule code '${code}' already exists in structure #${sid}`);
      }

      const nextId = memoryStore.state.salary_rules.length > 0
        ? Math.max(...memoryStore.state.salary_rules.map(r => r.id)) + 1
        : 1;

      const newRule = {
        id: nextId,
        salary_structure_id: sid,
        name: name.trim(),
        code: code.trim().toUpperCase(),
        category: normCategory,
        sequence: seq,
        computation_type: computation_type.toLowerCase(),
        amount: parseFloat(amount) || 0,
        percentage: parseFloat(percentage) || 0,
        formula: formula ? formula.trim() : null,
        base_rule_id: base_rule_id ? parseInt(base_rule_id, 10) : null,
        is_active: Boolean(is_active),
        is_taxable: Boolean(is_taxable),
        notes: notes ? notes.trim() : '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      memoryStore.state.salary_rules.push(newRule);
      memoryStore.save();
      return newRule;
    }
  }

  /**
   * Update an existing salary rule
   */
  async updateRule(id, data) {
    const rId = parseInt(id, 10);
    const {
      name,
      code,
      category,
      sequence,
      computation_type,
      amount,
      percentage,
      formula,
      base_rule_id,
      is_active,
      is_taxable,
      notes,
    } = data;

    const normCategory = category ? category.toLowerCase() : null;
    if (normCategory && !CATEGORY_ORDER[normCategory]) {
      throw new Error(`Invalid category '${category}'`);
    }

    if (computation_type === 'formula' && formula) {
      const check = inspectFormula(formula);
      if (!check.valid) {
        throw new Error(`Invalid formula syntax: ${check.error}`);
      }
    }

    try {
      const q = `
        UPDATE salary_rules
        SET
          name = COALESCE($1, name),
          code = COALESCE($2, code),
          category = COALESCE($3, category),
          sequence = COALESCE($4, sequence),
          computation_type = COALESCE($5, computation_type),
          amount = COALESCE($6, amount),
          percentage = COALESCE($7, percentage),
          formula = COALESCE($8, formula),
          base_rule_id = $9,
          is_active = COALESCE($10, is_active),
          is_taxable = COALESCE($11, is_taxable),
          notes = COALESCE($12, notes),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $13
        RETURNING *
      `;
      const res = await quantumPool.query(q, [
        name ? name.trim() : null,
        code ? code.trim().toUpperCase() : null,
        normCategory || null,
        sequence !== undefined ? parseInt(sequence, 10) : null,
        computation_type ? computation_type.toLowerCase() : null,
        amount !== undefined ? parseFloat(amount) : null,
        percentage !== undefined ? parseFloat(percentage) : null,
        formula !== undefined ? (formula ? formula.trim() : null) : null,
        base_rule_id !== undefined ? (base_rule_id ? parseInt(base_rule_id, 10) : null) : null,
        is_active !== undefined ? Boolean(is_active) : null,
        is_taxable !== undefined ? Boolean(is_taxable) : null,
        notes !== undefined ? notes.trim() : null,
        rId,
      ]);
      return res.rows[0] || null;
    } catch (dbError) {
      const idx = memoryStore.state.salary_rules.findIndex(r => r.id === rId);
      if (idx === -1) return null;

      const current = memoryStore.state.salary_rules[idx];
      const updated = {
        ...current,
        name: name ? name.trim() : current.name,
        code: code ? code.trim().toUpperCase() : current.code,
        category: normCategory || current.category,
        sequence: sequence !== undefined ? parseInt(sequence, 10) : current.sequence,
        computation_type: computation_type ? computation_type.toLowerCase() : current.computation_type,
        amount: amount !== undefined ? parseFloat(amount) : current.amount,
        percentage: percentage !== undefined ? parseFloat(percentage) : current.percentage,
        formula: formula !== undefined ? (formula ? formula.trim() : null) : current.formula,
        base_rule_id: base_rule_id !== undefined ? (base_rule_id ? parseInt(base_rule_id, 10) : null) : current.base_rule_id,
        is_active: is_active !== undefined ? Boolean(is_active) : current.is_active,
        is_taxable: is_taxable !== undefined ? Boolean(is_taxable) : current.is_taxable,
        notes: notes !== undefined ? notes.trim() : current.notes,
        updated_at: new Date().toISOString(),
      };

      memoryStore.state.salary_rules[idx] = updated;
      memoryStore.save();
      return updated;
    }
  }

  /**
   * Delete a salary rule
   */
  async deleteRule(id) {
    const rId = parseInt(id, 10);
    try {
      await quantumPool.query(`DELETE FROM salary_rules WHERE id = $1`, [rId]);
      return true;
    } catch (dbError) {
      const idx = memoryStore.state.salary_rules.findIndex(r => r.id === rId);
      if (idx === -1) return false;
      memoryStore.state.salary_rules.splice(idx, 1);
      memoryStore.save();
      return true;
    }
  }

  /**
   * Reorder salary rules inside a structure to maintain strict sequence
   * @param {number} salaryStructureId
   * @param {Array<{id: number, sequence: number}>} reorderedList
   */
  async reorderRules(salaryStructureId, reorderedList) {
    const sid = parseInt(salaryStructureId, 10);
    if (!Array.isArray(reorderedList)) throw new Error('reorderedList must be an array of {id, sequence}');

    try {
      for (const item of reorderedList) {
        await quantumPool.query(
          `UPDATE salary_rules SET sequence = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND salary_structure_id = $3`,
          [parseInt(item.sequence, 10), parseInt(item.id, 10), sid]
        );
      }
      return await this.getRules({ salary_structure_id: sid });
    } catch (dbError) {
      for (const item of reorderedList) {
        const r = memoryStore.state.salary_rules.find(x => x.id === parseInt(item.id, 10) && x.salary_structure_id === sid);
        if (r) {
          r.sequence = parseInt(item.sequence, 10);
          r.updated_at = new Date().toISOString();
        }
      }
      memoryStore.save();
      return await this.getRules({ salary_structure_id: sid });
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 3. /warp-computation-matrix: Flexible Calculation & Simulation Engine
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Dynamically calculates employee compensation using rules in strict sequence
   * @param {number} structureId - ID of salary structure
   * @param {Object} employeeContext - { base_salary, gravity_allowance, days_worked, overtime_hours, custom_inputs }
   */
  async calculateCompensation(structureId, employeeContext = {}) {
    const sid = parseInt(structureId, 10);
    const structure = await this.getStructureById(sid);
    if (!structure) throw new Error(`Salary structure #${sid} not found`);

    // Only active rules sorted by sequence
    const rules = (structure.rules || [])
      .filter(r => r.is_active)
      .sort((a, b) => a.sequence - b.sequence);

    // Context inputs normalized
    const base_salary = parseFloat(employeeContext.base_salary) || 120000.00;
    const gravity_allowance = parseFloat(employeeContext.gravity_allowance) || 12000.00;
    const days_worked = parseFloat(employeeContext.days_worked) || 22;
    const overtime_hours = parseFloat(employeeContext.overtime_hours) || 0;
    const hourly_rate = parseFloat(employeeContext.hourly_rate) || Math.round((base_salary / 2080) * 100) / 100;

    // Execution environment & variable scope
    const scope = {
      base_salary,
      annual_salary: base_salary,
      monthly_salary: Math.round((base_salary / 12) * 100) / 100,
      gravity_allowance,
      days_worked,
      overtime_hours,
      hourly_rate,
      company_contribution: structure.company_contribution || 0,
      ...employeeContext.custom_inputs,
    };

    const executionTrace = [];
    const ruleOutputs = {};

    let totalBasic = 0;
    let totalAllowances = 0;
    let grossCompensation = 0;
    let totalDeductions = 0;
    let netPayout = 0;

    // /gravitational-rule-engine: sequential pass
    for (let i = 0; i < rules.length; i++) {
      const rule = rules[i];
      let computedAmount = 0;
      let formulaUsed = '';

      switch (rule.computation_type) {
        case 'fixed':
          computedAmount = parseFloat(rule.amount) || 0;
          formulaUsed = `Fixed amount: $${computedAmount.toFixed(2)}`;
          break;

        case 'percentage': {
          const pct = parseFloat(rule.percentage) || 0;
          let baseValue = 0;

          if (rule.base_rule_id && ruleOutputs[rule.base_rule_id]) {
            baseValue = ruleOutputs[rule.base_rule_id].computedAmount;
            formulaUsed = `${pct}% of rule [${ruleOutputs[rule.base_rule_id].code}] ($${baseValue.toFixed(2)})`;
          } else if (rule.category === 'allowance' && scope['BASIC']) {
            baseValue = scope['BASIC'];
            formulaUsed = `${pct}% of BASIC ($${baseValue.toFixed(2)})`;
          } else if (rule.category === 'deduction' && scope['GROSS']) {
            baseValue = scope['GROSS'];
            formulaUsed = `${pct}% of GROSS ($${baseValue.toFixed(2)})`;
          } else if (rule.formula) {
            // Evaluates formula as base value
            baseValue = evaluateFormula(rule.formula, scope);
            formulaUsed = `${pct}% of formula [${rule.formula}] ($${baseValue.toFixed(2)})`;
          } else {
            // Default to monthly base
            baseValue = scope.monthly_salary;
            formulaUsed = `${pct}% of monthly base salary ($${baseValue.toFixed(2)})`;
          }

          computedAmount = Math.round(((pct / 100) * baseValue + Number.EPSILON) * 100) / 100;
          break;
        }

        case 'formula': {
          if (!rule.formula) {
            computedAmount = parseFloat(rule.amount) || 0;
            formulaUsed = `Fallback fixed: $${computedAmount.toFixed(2)}`;
          } else {
            computedAmount = evaluateFormula(rule.formula, scope);
            formulaUsed = rule.formula;
          }
          break;
        }

        default:
          computedAmount = parseFloat(rule.amount) || 0;
          formulaUsed = 'Default fixed';
      }

      // Store in scope and rule outputs for subsequent rules in sequence
      scope[rule.code] = computedAmount;
      ruleOutputs[rule.id] = {
        code: rule.code,
        computedAmount,
      };

      // Tally by category
      if (rule.category === 'basic') {
        totalBasic += computedAmount;
      } else if (rule.category === 'allowance') {
        totalAllowances += computedAmount;
      } else if (rule.category === 'gross') {
        grossCompensation = computedAmount;
      } else if (rule.category === 'deduction') {
        totalDeductions += computedAmount;
      } else if (rule.category === 'net') {
        netPayout = computedAmount;
      }

      // If Gross wasn't explicit rule, compute it implicitly
      if (!grossCompensation && rule.category !== 'gross') {
        grossCompensation = totalBasic + totalAllowances;
      }
      scope['GROSS'] = grossCompensation;

      // If Net wasn't explicit rule, compute it implicitly
      if (!netPayout && rule.category !== 'net') {
        netPayout = Math.max(0, grossCompensation - totalDeductions);
      }
      scope['NET'] = netPayout;

      // Add to execution trace
      executionTrace.push({
        step: i + 1,
        rule_id: rule.id,
        rule_code: rule.code,
        rule_name: rule.name,
        category: rule.category,
        sequence: rule.sequence,
        computation_type: rule.computation_type,
        formula_used: formulaUsed,
        computed_amount: computedAmount,
        running_totals: {
          basic: Math.round(totalBasic * 100) / 100,
          allowances: Math.round(totalAllowances * 100) / 100,
          gross: Math.round(grossCompensation * 100) / 100,
          deductions: Math.round(totalDeductions * 100) / 100,
          net: Math.round(netPayout * 100) / 100,
        },
      });
    }

    // Final reconciliation
    if (!grossCompensation) {
      grossCompensation = totalBasic + totalAllowances;
    }
    if (!netPayout) {
      netPayout = Math.max(0, grossCompensation - totalDeductions);
    }

    const totalCompanyCost = grossCompensation + (structure.company_contribution || 0);

    return {
      structure: {
        id: structure.id,
        code: structure.code,
        name: structure.name,
        currency: structure.currency,
        wage_type: structure.wage_type,
        company_contribution: structure.company_contribution || 0,
      },
      employee_context: {
        base_salary,
        gravity_allowance,
        days_worked,
        overtime_hours,
        hourly_rate,
      },
      summary: {
        total_basic: Math.round(totalBasic * 100) / 100,
        total_allowances: Math.round(totalAllowances * 100) / 100,
        gross_compensation: Math.round(grossCompensation * 100) / 100,
        total_deductions: Math.round(totalDeductions * 100) / 100,
        net_disbursable: Math.round(netPayout * 100) / 100,
        company_contribution: structure.company_contribution || 0,
        total_company_cost: Math.round(totalCompanyCost * 100) / 100,
      },
      execution_trace: executionTrace,
      rule_variables: scope,
      telemetry: {
        rules_executed: rules.length,
        execution_order: rules.map(r => `${r.sequence}:${r.code}`).join(' -> '),
        gravitational_status: 'STABLE_ZERO_G',
        quantum_timestamp: new Date().toISOString(),
      },
    };
  }
}

const salaryService = new SalaryService();
module.exports = {
  salaryService,
  evaluateFormula,
  inspectFormula,
  CATEGORY_ORDER,
};
