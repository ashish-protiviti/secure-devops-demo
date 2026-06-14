// ============================================================
// DEMO FILE: leaveController.test.js
// COPILOT DEMO MOMENT #5: Test Generation
//
// HOW TO DEMO:
// 1. Open leaveController.js side by side
// 2. Type: "// Write tests for the POST /request endpoint"
// 3. Watch Copilot generate the full describe/it block
// 4. Show coverage improvement without manual effort
// ============================================================

const request = require('supertest');
const app = require('../src/app');
const leaveService = require('../src/services/leaveService');
const jwt = require('jsonwebtoken');

// Mock the service layer
jest.mock('../src/services/leaveService');

// Helper: generate a valid test JWT
const generateToken = (payload = {}) => {
  return jwt.sign(
    { employeeId: 'EMP001', role: 'EMPLOYEE', ...payload },
    process.env.JWT_SECRET || 'test-secret',
    { expiresIn: '1h' }
  );
};

describe('POST /api/leave/request', () => {
  const validPayload = {
    employeeId: 'EMP001',
    leaveType: 'ANNUAL',
    startDate: '2025-03-01',
    endDate: '2025-03-05',
    reason: 'Family vacation'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should submit a leave request successfully when balance is sufficient', async () => {
    leaveService.getLeaveBalance.mockResolvedValue(10);
    leaveService.calculateWorkingDays.mockReturnValue(5);
    leaveService.createLeaveRequest.mockResolvedValue({
      id: 'REQ-001',
      status: 'PENDING'
    });

    const res = await request(app)
      .post('/api/leave/request')
      .set('Authorization', `Bearer ${generateToken()}`)
      .send(validPayload);

    expect(res.status).toBe(201);
    expect(res.body.requestId).toBe('REQ-001');
    expect(res.body.status).toBe('PENDING');
  });

  it('should return 400 when leave balance is insufficient', async () => {
    leaveService.getLeaveBalance.mockResolvedValue(3);
    leaveService.calculateWorkingDays.mockReturnValue(5);

    const res = await request(app)
      .post('/api/leave/request')
      .set('Authorization', `Bearer ${generateToken()}`)
      .send(validPayload);

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Insufficient leave balance');
    expect(res.body.available).toBe(3);
    expect(res.body.requested).toBe(5);
  });

  it('should return 401 when no authorization token is provided', async () => {
    const res = await request(app)
      .post('/api/leave/request')
      .send(validPayload);

    expect(res.status).toBe(401);
  });

  it('should return 400 when required fields are missing', async () => {
    const res = await request(app)
      .post('/api/leave/request')
      .set('Authorization', `Bearer ${generateToken()}`)
      .send({ leaveType: 'ANNUAL' }); // Missing required fields

    expect(res.status).toBe(400);
  });
});

describe('PUT /api/leave/requests/:id/approve', () => {
  it('should allow manager to approve a leave request', async () => {
    leaveService.updateLeaveStatus.mockResolvedValue({
      id: 'REQ-001',
      employeeId: 'EMP002',
      leaveType: 'ANNUAL',
      requestedDays: 3,
      status: 'APPROVED'
    });
    leaveService.deductLeaveBalance.mockResolvedValue(true);

    const res = await request(app)
      .put('/api/leave/requests/REQ-001/approve')
      .set('Authorization', `Bearer ${generateToken({ role: 'MANAGER' })}`)
      .send({ action: 'APPROVE', comments: 'Approved for vacation' });

    expect(res.status).toBe(200);
    expect(leaveService.deductLeaveBalance).toHaveBeenCalled();
  });

  it('should deny approval for non-manager employees', async () => {
    const res = await request(app)
      .put('/api/leave/requests/REQ-001/approve')
      .set('Authorization', `Bearer ${generateToken({ role: 'EMPLOYEE' })}`)
      .send({ action: 'APPROVE' });

    expect(res.status).toBe(403);
    expect(leaveService.deductLeaveBalance).not.toHaveBeenCalled();
  });
});
