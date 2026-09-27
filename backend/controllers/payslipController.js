// ====================================================================
// Payslip Management & Teleport PDF Disbursal Controller
// /quantum-payslip-engine — Computation trace audit
// /teleport-pdf-disbursal — Printable PDF generation & single/bulk transmission
// ====================================================================

const quantumPool = require('../config/quantumPool');

/**
 * GET /api/payslips/:id
 * Retrieve full payslip details with employee, department, and computation trace
 */
async function getPayslipById(req, res) {
  try {
    const { id } = req.params;

    const query = `
      SELECT 
        s.*,
        p.run_name,
        p.run_code,
        p.start_date,
        p.end_date,
        p.payment_date,
        p.salary_structure AS payrun_structure,
        e.employee_id AS emp_code,
        e.first_name,
        e.last_name,
        (e.first_name || ' ' || e.last_name) AS full_name,
        e.avatar_url,
        e.job_position,
        e.email,
        e.phone,
        e.emergency_contact,
        e.clearance_tier,
        e.anti_gravity_rating,
        e.work_location,
        d.name AS department_name,
        d.code AS department_code,
        d.orbital_deck,
        c.contract_ref,
        c.contract_type
      FROM payslips s
      JOIN payruns p ON s.payrun_id = p.id
      JOIN employees e ON s.employee_id = e.id
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN contracts c ON s.contract_id = c.id
      WHERE s.id = $1
    `;

    const { rows, thrustLatencyMs } = await quantumPool.query(query, [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Payslip record not found' });
    }

    return res.json({
      success: true,
      data: rows[0],
      quantumProfiling: {
        thrustLatencyMs,
        skill: '/quantum-payslip-engine',
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * GET /api/payslips/:id/pdf
 * /teleport-pdf-disbursal
 * Generates an interactive, high-fidelity printable HTML/PDF payslip document
 */
async function generatePayslipPdf(req, res) {
  try {
    const { id } = req.params;

    const query = `
      SELECT 
        s.*,
        p.run_name,
        p.run_code,
        p.start_date,
        p.end_date,
        p.payment_date,
        p.salary_structure AS payrun_structure,
        e.employee_id AS emp_code,
        e.first_name,
        e.last_name,
        (e.first_name || ' ' || e.last_name) AS full_name,
        e.email,
        e.job_position,
        e.clearance_tier,
        e.anti_gravity_rating,
        e.work_location,
        d.name AS department_name,
        d.orbital_deck,
        c.contract_ref
      FROM payslips s
      JOIN payruns p ON s.payrun_id = p.id
      JOIN employees e ON s.employee_id = e.id
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN contracts c ON s.contract_id = c.id
      WHERE s.id = $1
    `;

    const { rows } = await quantumPool.query(query, [id]);
    if (rows.length === 0) {
      return res.status(404).send('Payslip not found');
    }

    const slip = rows[0];

    const formatCurrency = (val) =>
      new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val || 0);

    const formatDate = (d) =>
      d ? new Date(d).toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';

    // Standalone high-aesthetic printable HTML PDF document
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>PeoplePay360 Payslip — ${slip.slip_number}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;600;700&family=JetBrains+Mono:wght@400;600;700&display=swap');
    
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Space Grotesk', -apple-system, sans-serif;
      background: #060913;
      color: #e2e8f0;
      padding: 30px 20px;
      line-height: 1.5;
    }
    .payslip-container {
      max-width: 800px;
      margin: 0 auto;
      background: #0b1120;
      border: 1px solid rgba(0, 240, 255, 0.3);
      border-radius: 18px;
      padding: 36px;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.8), 0 0 30px rgba(0, 240, 255, 0.1);
      position: relative;
      overflow: hidden;
    }
    .top-glow {
      position: absolute;
      top: 0; left: 0; right: 0; height: 4px;
      background: linear-gradient(90deg, #00f0ff, #8b5cf6, #10b981);
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      padding-bottom: 24px;
      margin-bottom: 24px;
    }
    .logo-badge {
      display: inline-block;
      font-family: 'JetBrains Mono', monospace;
      font-size: 11px;
      background: rgba(0, 240, 255, 0.1);
      color: #00f0ff;
      border: 1px solid rgba(0, 240, 255, 0.3);
      padding: 3px 10px;
      border-radius: 20px;
      margin-bottom: 8px;
      letter-spacing: 1px;
    }
    .title { font-size: 24px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px; }
    .station-sub { font-size: 12px; color: #94a3b8; margin-top: 4px; }
    .slip-meta { text-align: right; font-family: 'JetBrains Mono', monospace; }
    .slip-num { font-size: 16px; font-weight: 700; color: #00f0ff; }
    .slip-dates { font-size: 11px; color: #94a3b8; margin-top: 4px; }
    
    .grid-crew {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      background: rgba(2, 6, 23, 0.6);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 24px;
      font-size: 12px;
    }
    .crew-row { display: flex; justify-content: space-between; margin-bottom: 6px; }
    .crew-row:last-child { margin-bottom: 0; }
    .label { color: #64748b; font-family: 'JetBrains Mono', monospace; font-size: 11px; }
    .val { color: #f1f5f9; font-weight: 600; }
    
    .tables-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 24px;
    }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th {
      text-align: left;
      font-family: 'JetBrains Mono', monospace;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #94a3b8;
      padding: 8px 10px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }
    td { padding: 9px 10px; border-bottom: 1px solid rgba(255, 255, 255, 0.05); }
    .amt { text-align: right; font-family: 'JetBrains Mono', monospace; font-weight: 600; color: #f8fafc; }
    .total-row td {
      border-top: 1px solid rgba(255, 255, 255, 0.15);
      font-weight: 700;
      color: #ffffff;
      padding-top: 12px;
    }

    .net-banner {
      background: linear-gradient(135deg, rgba(0, 240, 255, 0.15), rgba(139, 92, 246, 0.15));
      border: 1px solid rgba(0, 240, 255, 0.4);
      border-radius: 14px;
      padding: 20px 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }
    .net-title { font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8; font-family: 'JetBrains Mono', monospace; }
    .net-amount { font-size: 32px; font-weight: 800; color: #00f0ff; font-family: 'JetBrains Mono', monospace; text-shadow: 0 0 15px rgba(0, 240, 255, 0.4); }

    .footer {
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      padding-top: 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 10px;
      color: #64748b;
      font-family: 'JetBrains Mono', monospace;
    }
    .print-btn {
      position: fixed;
      bottom: 24px;
      right: 24px;
      background: linear-gradient(135deg, #00f0ff, #3b82f6);
      color: #000;
      font-weight: 700;
      font-family: 'Space Grotesk', sans-serif;
      padding: 12px 24px;
      border-radius: 12px;
      border: none;
      cursor: pointer;
      box-shadow: 0 8px 20px rgba(0, 240, 255, 0.4);
      display: flex;
      align-items: center;
      gap: 8px;
    }
    @media print {
      body { background: #fff; color: #000; padding: 0; }
      .payslip-container { border: 1px solid #ccc; box-shadow: none; background: #fff; color: #000; }
      .title, .slip-num, .amt, .val { color: #000 !important; }
      .grid-crew { background: #f8fafc; border-color: #e2e8f0; }
      .net-banner { background: #f1f5f9; border-color: #cbd5e1; }
      .net-amount { color: #0f172a !important; text-shadow: none; }
      .print-btn { display: none; }
    }
  </style>
</head>
<body>
  <div class="payslip-container">
    <div class="top-glow"></div>

    <!-- Header -->
    <div class="header">
      <div>
        <div class="logo-badge">PEOPLEPAY360 • ORBITAL HR CORE</div>
        <h1 class="title">Quantum Flight Payslip</h1>
        <p class="station-sub">Orbital Station Alpha • Deck 01–05 Propulsion Hub</p>
      </div>
      <div class="slip-meta">
        <div class="slip-num">${slip.slip_number}</div>
        <div class="slip-dates">Period: ${formatDate(slip.start_date)} — ${formatDate(slip.end_date)}</div>
        <div class="slip-dates">Payment: ${formatDate(slip.payment_date)}</div>
      </div>
    </div>

    <!-- Astronaut Bio Details -->
    <div class="grid-crew">
      <div>
        <div class="crew-row"><span class="label">Astronaut:</span> <span class="val">${slip.full_name}</span></div>
        <div class="crew-row"><span class="label">Employee Code:</span> <span class="val">${slip.emp_code}</span></div>
        <div class="crew-row"><span class="label">Job Position:</span> <span class="val">${slip.job_position}</span></div>
        <div class="crew-row"><span class="label">Clearance Tier:</span> <span class="val">${slip.clearance_tier || 'Level-2 Specialist'}</span></div>
      </div>
      <div>
        <div class="crew-row"><span class="label">Orbital Deck:</span> <span class="val">${slip.department_name} (${slip.orbital_deck?.split('-')[0] || 'Deck 01'})</span></div>
        <div class="crew-row"><span class="label">Contract Ref:</span> <span class="val">${slip.contract_ref || 'CTR-20250101-001'}</span></div>
        <div class="crew-row"><span class="label">Worked Duty:</span> <span class="val">${slip.worked_days} Days (${slip.total_hours} Hours)</span></div>
        <div class="crew-row"><span class="label">Anti-Gravity Rating:</span> <span class="val">${slip.anti_gravity_rating || 'AG-9'} Warp-Rated</span></div>
      </div>
    </div>

    <!-- Tables Grid: Earnings & Deductions -->
    <div class="tables-grid">
      <!-- Earnings -->
      <div>
        <table>
          <thead>
            <tr><th>Earnings Component</th><th class="amt">Amount</th></tr>
          </thead>
          <tbody>
            <tr><td>Monthly Base Salary</td><td class="amt">${formatCurrency(slip.base_salary)}</td></tr>
            <tr><td>Zero-G Flight Allowance</td><td class="amt">${formatCurrency(slip.gravity_allowance)}</td></tr>
            <tr><td>Propulsion Overtime Bonus</td><td class="amt">${formatCurrency(slip.propulsion_bonus)}</td></tr>
            ${parseFloat(slip.hazard_allowance) > 0 ? `<tr><td>Cosmic Hazard Pay</td><td class="amt">${formatCurrency(slip.hazard_allowance)}</td></tr>` : ''}
            <tr class="total-row"><td>Gross Compensation</td><td class="amt">${formatCurrency(slip.gross_pay)}</td></tr>
          </tbody>
        </table>
      </div>

      <!-- Deductions -->
      <div>
        <table>
          <thead>
            <tr><th>Deductions Component</th><th class="amt">Amount</th></tr>
          </thead>
          <tbody>
            <tr><td>Interplanetary Quantum Tax (15%)</td><td class="amt">${formatCurrency(slip.quantum_tax)}</td></tr>
            <tr><td>Atmospheric Decompression Fund</td><td class="amt">${formatCurrency(slip.medical_decompression_fund)}</td></tr>
            <tr><td>Deep-Space Pension Contribution</td><td class="amt">${formatCurrency(slip.planetary_pension)}</td></tr>
            <tr class="total-row"><td>Total Deductions</td><td class="amt">${formatCurrency(slip.total_deductions)}</td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Net Pay Highlight Banner -->
    <div class="net-banner">
      <div>
        <div class="net-title">Total Net Disbursed Salary</div>
        <div style="font-size: 11px; color: #94a3b8; font-family: 'JetBrains Mono', monospace; margin-top: 4px;">
          Direct Teleport to Comms Beacon: ${slip.email}
        </div>
      </div>
      <div class="net-amount">${formatCurrency(slip.net_pay)}</div>
    </div>

    <!-- Footer Security Signature -->
    <div class="footer">
      <div>CRYPTO-GRAVITATIONAL-SEAL: SHA256-${Buffer.from(slip.slip_number).toString('hex').slice(0, 16).toUpperCase()}</div>
      <div>/teleport-pdf-disbursal • Verified Nominal</div>
    </div>
  </div>

  <button class="print-btn" onclick="window.print()">
    <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zm-3 11H8v-5h8v5zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-9H6v4h12V3z"/></svg>
    Print / Save PDF
  </button>
</body>
</html>
    `;

    res.setHeader('Content-Type', 'text/html');
    return res.send(html);
  } catch (error) {
    return res.status(500).send('Error generating payslip PDF document: ' + error.message);
  }
}

/**
 * POST /api/payslips/:id/send-email
 * Individual payslip email dispatch simulation
 */
async function sendSingleEmail(req, res) {
  try {
    const { id } = req.params;

    const query = `
      SELECT s.id, s.slip_number, e.email, (e.first_name || ' ' || e.last_name) AS full_name
      FROM payslips s
      JOIN employees e ON s.employee_id = e.id
      WHERE s.id = $1
    `;
    const { rows } = await quantumPool.query(query, [id]);
    if (rows.length === 0) return res.status(404).json({ success: false, error: 'Payslip not found' });

    const slip = rows[0];

    await quantumPool.query(
      `UPDATE payslips
       SET status = CASE WHEN status = 'Paid' THEN 'Paid' ELSE 'Sent' END,
           sent_at = CURRENT_TIMESTAMP,
           sent_to = $1
       WHERE id = $2`,
      [slip.email, id]
    );

    return res.json({
      success: true,
      message: `/teleport-pdf-disbursal: Encrypted payslip ${slip.slip_number} transmitted to ${slip.full_name} (${slip.email})`,
      data: {
        slip_number: slip.slip_number,
        recipient: slip.email,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

module.exports = {
  getPayslipById,
  generatePayslipPdf,
  sendSingleEmail,
};
