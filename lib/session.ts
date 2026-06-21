import { getIronSession, SessionOptions } from 'iron-session';
import { cookies } from 'next/headers';

export interface ClienteSession {
  id: string;
  nome: string;
  email: string;
}

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET!,
  cookieName: 'cestas-cliente',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7, // 7 dias
  },
};

export interface SessionData {
  cliente?: ClienteSession;
}

export async function getClienteSession() {
  return getIronSession<SessionData>(await cookies(), sessionOptions);
}
