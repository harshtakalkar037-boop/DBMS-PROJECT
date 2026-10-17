import express from 'express';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { env } from '../config/env';
import { enforceDemoReadOnly } from './demoReadOnly';

function appForTests() {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use('/api/v1', enforceDemoReadOnly);
  app.get('/api/v1/students', (_req, res) => res.status(200).json({ ok: true }));
  app.post('/api/v1/students', (_req, res) => res.status(201).json({ created: true }));
  app.post('/api/v1/auth/logout', (_req, res) => res.status(200).json({ loggedOut: true }));
  app.use((err: { status?: number; message?: string }, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    res.status(err.status ?? 500).json({ message: err.message });
  });
  return app;
}

function token(email: string, isDemo: boolean) {
  return jwt.sign({ sub: 1, role: 'ADMIN', email, isDemo }, env.jwt.secret, { expiresIn: '5m' });
}

describe('enforceDemoReadOnly', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('allows reads for demo sessions', async () => {
    await request(appForTests())
      .get('/api/v1/students')
      .set('Authorization', `Bearer ${token('admin@pict.edu', true)}`)
      .expect(200);
  });

  it('blocks writes for an allowlisted demo identity', async () => {
    const response = await request(appForTests())
      .post('/api/v1/students')
      .set('Authorization', `Bearer ${token('admin@pict.edu', true)}`)
      .send({ name: 'should not be created' })
      .expect(403);
    expect(response.body.message).toMatch(/read-only/i);
  });

  it('also blocks writes when the demo token is supplied in the accessToken cookie', async () => {
    await request(appForTests())
      .post('/api/v1/students')
      .set('Cookie', `accessToken=${token('admin@pict.edu', true)}`)
      .send({ name: 'should not be created' })
      .expect(403);
  });

  it('allows demo logout', async () => {
    await request(appForTests())
      .post('/api/v1/auth/logout')
      .set('Authorization', `Bearer ${token('admin@pict.edu', true)}`)
      .expect(200);
  });

  it('does not block non-demo sessions', async () => {
    await request(appForTests())
      .post('/api/v1/students')
      .set('Authorization', `Bearer ${token('real.user@example.com', false)}`)
      .send({ name: 'normal user' })
      .expect(201);
  });


  it.each([
    'admin@pict.edu',
    '2024etc1001@pict.edu',
    'karan.shinde@pict.edu',
    'examcell@pict.edu',
    'accountant@pict.edu',
    'hostel.admin@pict.edu',
    'hr@pict.edu',
  ])('blocks mutation methods for seeded demo account %s', async (email) => {
    const app = appForTests();
    app.put('/api/v1/students/:id', (_req, res) => res.status(200).json({ updated: true }));
    app.patch('/api/v1/students/:id', (_req, res) => res.status(200).json({ updated: true }));
    app.delete('/api/v1/students/:id', (_req, res) => res.status(200).json({ deleted: true }));
    const auth = { Authorization: `Bearer ${token(email, true)}` };

    await request(app).post('/api/v1/students').set(auth).send({}).expect(403);
    await request(app).put('/api/v1/students/1').set(auth).send({}).expect(403);
    await request(app).patch('/api/v1/students/1').set(auth).send({}).expect(403);
    await request(app).delete('/api/v1/students/1').set(auth).expect(403);
  });

  it('allows HEAD and OPTIONS without treating them as mutations', async () => {
    await request(appForTests()).head('/api/v1/students').expect(200);
    await request(appForTests()).options('/api/v1/students').expect(200);
  });

  it('does not treat an unlisted email with a demo claim as a seeded demo', async () => {
    await request(appForTests())
      .post('/api/v1/students')
      .set('Authorization', `Bearer ${token('someone@example.com', true)}`)
      .send({ name: 'other user' })
      .expect(201);
  });
});
