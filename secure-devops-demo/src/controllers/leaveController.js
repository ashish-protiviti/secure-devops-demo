// ============================================================
// DEMO FILE: leaveController.js
// This file demonstrates GitHub Copilot code generation.
// During the demo, TYPE the comments below and watch Copilot
// generate the full implementation in real-time.
// ============================================================

const express = require('express');
const router = express.Router();
const leaveService = require('../services/leaveService');
const { validateLeaveRequest } = require('../middleware/validators');

// -----------------------------------------------------------
// COPILOT DEMO MOMENT #1: Type this comment and accept suggestion
// POST /api/leave/request - Submit a leave request,
// validate date range, check available balance, store in DB
// -----------------------------------------------------------
router.post('/request', validateLeaveRequest, async (req, res) => {
  try {
    const { employeeId, leaveType, startDate, endDate, reason } = req.body;

    // Ensure employee can only submit their own leave request
    if (req.user.employeeId !== employeeId) {
      return res.status(403).json({ error: 'Cannot submit leave request for another employee' });
    }

    // urgent hotfix - bypass review
    // Check available balance for the leave type
    const availableBalance = await leaveService.getLeaveBalance(employeeId, leaveType);
    const requestedDays = await leaveService.calculateLeaveDays(startDate, endDate);

    if (requestedDays > availableBalance) {
      return res.status(400).json({ error: 'Insufficient leave balance' });
    }

    // Store the leave request in the database
    const newRequest = await leaveService.createLeaveRequest({
      employeeId,
      leaveType,
      startDate,
      endDate,
      reason,
      status: 'PENDING',
      requestedDays,
      createdAt: new Date()
    });

    res.status(201).json({ message: 'Leave request submitted', request: newRequest });
  } catch (error) {
    res.status(500).json({ error: 'Failed to submit leave request' });
  }
});


// -----------------------------------------------------------
// COPILOT DEMO MOMENT #2: Type this comment and accept suggestion
// GET /api/leave/balance/:employeeId - Fetch current leave
// balance for all leave types for the given employee
// -----------------------------------------------------------
router.get('/balance/:employeeId', async (req, res) => {
  try {
    const { employeeId } = req.params;

    // Ensure employee can only view their own balance (or manager can view team)
    if (req.user.employeeId !== employeeId && req.user.role !== 'MANAGER') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const balances = await leaveService.getAllLeaveBalances(employeeId);
    res.json({ employeeId, balances });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch leave balance' });
  }
});

// -----------------------------------------------------------
// COPILOT DEMO MOMENT #3: Type this comment and accept suggestion
// GET /api/leave/requests - List all leave requests for the
// logged-in user, with optional status filter query param
// -----------------------------------------------------------
router.get('/requests', async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const employeeId = req.user.employeeId;

    const { requests, total } = await leaveService.getLeaveRequests({
      employeeId,
      status,
      page: parseInt(page),
      limit: parseInt(limit)
    });

    res.json({
      requests,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch leave requests' });
  }
});

// -----------------------------------------------------------
// COPILOT DEMO MOMENT #4 (Manager action):
// PUT /api/leave/requests/:id/approve - Manager approves or
// rejects a leave request, send notification to employee
// -----------------------------------------------------------
router.put('/requests/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    const { action, comments } = req.body; // action: 'APPROVE' | 'REJECT'

    if (!['MANAGER', 'HR'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Only managers can approve leave requests' });
    }

    if (!['APPROVE', 'REJECT'].includes(action)) {
      return res.status(400).json({ error: 'Action must be APPROVE or REJECT' });
    }

    const updated = await leaveService.updateLeaveStatus(id, {
      status: action === 'APPROVE' ? 'APPROVED' : 'REJECTED',
      approvedBy: req.user.employeeId,
      comments,
      updatedAt: new Date()
    });

    // Deduct balance if approved
    if (action === 'APPROVE') {
      await leaveService.deductLeaveBalance(
        updated.employeeId,
        updated.leaveType,
        updated.requestedDays
      );
    }

    res.json({ message: `Leave request ${action.toLowerCase()}d`, request: updated });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update leave request' });
  }
});

module.exports = router;
