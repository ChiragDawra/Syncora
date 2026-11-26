const fs = require('fs');
const path = require('path');
const { api, auth, createTeamWithMembers, createTask } = require('./helpers');

const PDF = Buffer.from('%PDF-1.4\n%test\n');

describe('Attachments', () => {
  test('TC-31 / US-11 upload a PDF: 201, file stored, metadata listed', async () => {
    const { member, board } = await createTeamWithMembers();
    const t = await createTask(member.token, board._id);
    const res = await api()
      .post(`/api/tasks/${t._id}/attachments`)
      .set(auth(member.token))
      .attach('files', PDF, { filename: 'report.pdf', contentType: 'application/pdf' })
      .attach('files', Buffer.from('hello'), { filename: 'notes.txt', contentType: 'text/plain' });
    expect(res.status).toBe(201);
    expect(res.body.data.attachments).toHaveLength(2);
    const [pdf] = res.body.data.attachments;
    expect(pdf).toMatchObject({ originalName: 'report.pdf', mimeType: 'application/pdf', size: PDF.length });
    expect(pdf.url).toMatch(/^\/uploads\/\d{4}\/\d{2}\/[\w-]+\.pdf$/);
    expect(fs.existsSync(path.join(process.env.UPLOAD_DIR, pdf.fileName))).toBe(true);

    const download = await api().get(pdf.url);
    expect(download.status).toBe(200);
  });

  test('TC-32 file over 5 MB: 413 FILE_TOO_LARGE', async () => {
    const { member, board } = await createTeamWithMembers();
    const t = await createTask(member.token, board._id);
    const big = Buffer.alloc(6 * 1024 * 1024, 1);
    const res = await api()
      .post(`/api/tasks/${t._id}/attachments`)
      .set(auth(member.token))
      .attach('files', big, { filename: 'big.png', contentType: 'image/png' });
    expect(res.status).toBe(413);
    expect(res.body.error.code).toBe('FILE_TOO_LARGE');
  });

  test('TC-33 .exe: 400 UNSUPPORTED_FILE_TYPE', async () => {
    const { member, board } = await createTeamWithMembers();
    const t = await createTask(member.token, board._id);
    const res = await api()
      .post(`/api/tasks/${t._id}/attachments`)
      .set(auth(member.token))
      .attach('files', Buffer.from('MZ'), { filename: 'virus.exe', contentType: 'application/octet-stream' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('UNSUPPORTED_FILE_TYPE');
  });

  test('a PDF renamed to .png is rejected (MIME and extension must match)', async () => {
    const { member, board } = await createTeamWithMembers();
    const t = await createTask(member.token, board._id);
    const res = await api()
      .post(`/api/tasks/${t._id}/attachments`)
      .set(auth(member.token))
      .attach('files', PDF, { filename: 'trick.png', contentType: 'application/pdf' });
    expect(res.status).toBe(400);
  });

  test('delete: other member 403, uploader 200 and file removed', async () => {
    const { owner, member, board } = await createTeamWithMembers();
    const t = await createTask(member.token, board._id);
    const up = await api()
      .post(`/api/tasks/${t._id}/attachments`)
      .set(auth(owner.token))
      .attach('files', PDF, { filename: 'a.pdf', contentType: 'application/pdf' });
    const att = up.body.data.attachments[0];
    const denied = await api().delete(`/api/tasks/${t._id}/attachments/${att._id}`).set(auth(member.token));
    expect(denied.status).toBe(403);
    const res = await api().delete(`/api/tasks/${t._id}/attachments/${att._id}`).set(auth(owner.token));
    expect(res.status).toBe(200);
    expect(fs.existsSync(path.join(process.env.UPLOAD_DIR, att.fileName))).toBe(false);
  });
});
