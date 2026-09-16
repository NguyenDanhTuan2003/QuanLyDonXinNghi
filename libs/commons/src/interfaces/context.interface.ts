import { Request } from 'express';

export interface RequestWithUser extends Request {
  user?: {
    _id?: string;
    role?: string;
    [key: string]: unknown;
  };
}
