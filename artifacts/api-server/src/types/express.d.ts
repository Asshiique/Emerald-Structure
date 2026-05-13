import "express";

declare global {
  namespace Express {
    interface Request {
      auth?: {
        uid: string;
        email?: string;
        role?: string;
      };
    }
  }
}

export {};
