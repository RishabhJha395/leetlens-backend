export interface IJWTPayload {
  id: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: any; // Will be typed to IUser later
    }
  }
}
