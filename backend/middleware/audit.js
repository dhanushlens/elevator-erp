import AuditLog from '../models/AuditLog.js';
import ActivityLog from '../models/ActivityLog.js';

const WRITE_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'];

export const auditTrail = (req, res, next) => {
  if (!WRITE_METHODS.includes(req.method)) return next();
  res.on('finish', () => {
    if (!req.user) return;
    AuditLog.create({
      user: req.user._id,
      method: req.method,
      path: req.originalUrl,
      entity: req.baseUrl.split('/').pop(),
      after: req.method === 'DELETE' ? undefined : sanitizeBody(req.body),
      ip: req.ip,
      userAgent: req.get('user-agent'),
      statusCode: res.statusCode,
    }).catch(() => {});
  });
  next();
};

export const logActivity = (user, action, entity, entityId, description, ip) => {
  ActivityLog.create({ user, action, entity, entityId, description, ip }).catch(() => {});
};

function sanitizeBody(body) {
  if (!body || typeof body !== 'object') return body;
  const clone = { ...body };
  ['password', 'passwordConfirm', 'currentPassword', 'newPassword', 'refreshToken'].forEach((k) => delete clone[k]);
  return clone;
}
