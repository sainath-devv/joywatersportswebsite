import { Request, Response, NextFunction } from 'express';
import xss from 'xss';

// Input Sanitizer Middleware to prevent SQL injection and CSV command injection
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  if (req.body && typeof req.body === 'object') {
    const sensitiveKeys = new Set(['password', 'newpassword', 'oldpassword', 'currentpassword', 'confirmPassword', 'otp', 'code']);

    const sanitizeValue = (val: any, key?: string): any => {
      if (key && sensitiveKeys.has(key.toLowerCase())) {
        return val;
      }
      if (typeof val === 'string') {
        let sanitized = xss(val);
        // If the string starts with formula characters, escape it to prevent CSV command injection
        if (/^[\\=\\+\\-\\@\\t\\r\\n]/.test(sanitized)) {
          sanitized = "'" + sanitized;
        }
        return sanitized;
      } else if (Array.isArray(val)) {
        return val.map(item => sanitizeValue(item));
      } else if (val !== null && typeof val === 'object') {
        for (const k in val) {
          val[k] = sanitizeValue(val[k], k);
        }
        return val;
      }
      return val;
    };

    for (const key in req.body) {
      req.body[key] = sanitizeValue(req.body[key], key);
    }
  }
  next();
};
