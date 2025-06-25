declare global {
  namespace Express {
    interface Request {
      user?: any;
      userId?: string;
    }
  }
}

export interface JWTPayload {
  userId: string;
  email: string;
  subscriptionTier: string;
  iat?: number;
  exp?: number;
}

export interface AuthenticatedRequest extends Express.Request {
  user: any;
  userId: string;
}