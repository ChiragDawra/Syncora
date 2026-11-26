/* Demo data for Syncora. Drops the database first; refuses to run in production.
 * Logins (password Password123): owner@, admin@, member@, outsider@syncora.dev
 */
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const env = require('../src/config/env');
const { User, Team, Board, Task, Comment, Activity } = require('../src/models');
const { uploadRoot } = require('../src/utils/files');

const DAY = 24 * 60 * 60 * 1000;
const daysFromNow = (n) => new Date(Date.now() + n * DAY);
const PASSWORD = 'Password123';

// A real (tiny) one-page PDF, so the seeded attachment opens in the browser
const SAMPLE_PDF = `%PDF-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj
3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 300 144]/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>endobj
4 0 obj<</Length 55>>stream
BT /F1 18 Tf 30 70 Td (Syncora ER diagram draft) Tj ET
endstream
endobj
5 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj
trailer<</Root 1 0 R>>
%%EOF
`;

async function seed({ log = console.log } = {}) {
  if (env.isProd) throw new Error('Refusing to seed: NODE_ENV is production');

  await mongoose.connection.dropDatabase();
  await Promise.all([User, Team, Board, Task, Comment, Activity].map((m) => m.syncIndexes()));

  // users: create() runs the pre('save') hook that hashes the password
  const [owner, admin, member, outsider] = await Promise.all([
    User.create({ name: 'Chirag Dawra', email: 'owner@syncora.dev', password: PASSWORD, role: 'admin' }),
    User.create({ name: 'Bhumika', email: 'admin@syncora.dev', password: PASSWORD }),
    User.create({ name: 'Chahat', email: 'member@syncora.dev', password: PASSWORD }),
    User.create({ name: 'Outsider Olu', email: 'outsider@syncora.dev', password: PASSWORD }),
  ]);
  const extra = await User.create({ name: 'Chirag Bansal', email: 'bansal@syncora.dev', password: PASSWORD });

  const core = await Team.create({
    name: 'Syncora Core',
    description: 'BEE-II project team: API, client, report and viva',
    owner: owner._id,
    members: [
      { user: owner._id, role: 'owner' },
      { user: admin._id, role: 'admin' },
      { user: member._id, role: 'member' },
      { user: extra._id, role: 'member' },
    ],
  });
  const other = await Team.create({
    name: 'Outsider Team',
    description: 'Used to show that teams cannot see each other',
    owner: outsider._id,
    members: [{ user: outsider._id, role: 'owner' }],
  });

  const sprint = await Board.create({ team: core._id, name: 'Sprint 1', description: 'API and client for CE-2', color: '#6366f1', createdBy: owner._id });
  const report = await Board.create({ team: core._id, name: 'Report and Viva', description: 'Report chapters, deck and demo', color: '#10b981', createdBy: admin._id });
  await Board.create({ team: other._id, name: 'Private board', createdBy: outsider._id });

  // 12 tasks on Sprint 1: 3 overdue, 2 unassigned, 1 with a PDF
  const sprintTasks = [
    ['Set up Express app and middleware chain', 'done', 'high', owner, -6, ['backend']],
    ['User model with bcrypt pre-save hook', 'done', 'high', extra, -5, ['backend', 'auth']],
    ['JWT login and protect middleware', 'done', 'urgent', extra, -4, ['backend', 'auth']],
    ['Team roles: requireTeamRole middleware', 'done', 'high', owner, -2, ['backend']],
    ['Task filters, search and pagination', 'in_progress', 'high', owner, 2, ['backend']],
    ['Fix login bug: token not cleared on 401', 'in_progress', 'urgent', admin, -1, ['frontend', 'bug']],
    ['Board page with three columns', 'in_progress', 'medium', admin, 3, ['frontend']],
    ['Board stats aggregation ($facet)', 'todo', 'medium', member, -3, ['backend', 'db']],
    ['Multer upload with size and type limits', 'todo', 'high', member, -2, ['backend']],
    ['Postman collection with negative cases', 'todo', 'medium', null, 5, ['testing']],
    ['Seed script for the demo', 'todo', 'low', null, 6, ['tooling']],
    ['Explain() screenshot of the compound index', 'todo', 'low', member, 9, ['db', 'report']],
  ];
  const reportTasks = [
    ['Draw ER diagram', 'done', 'high', member, -3, ['report']],
    ['Write chapter 4: database design', 'in_progress', 'medium', admin, 2, ['report']],
    ['Deck: 12 slides on the course template', 'todo', 'medium', extra, 4, ['deck']],
    ['Rehearse the demo twice', 'todo', 'urgent', owner, 6, ['demo']],
  ];

  const positions = {};
  const build = (board, [title, status, priority, who, due, labels]) => {
    const key = `${board._id}:${status}`;
    positions[key] = (positions[key] ?? -1) + 1;
    return {
      board: board._id,
      team: core._id,
      title,
      description: `${title}. See the docs folder for the acceptance criteria.`,
      status,
      priority,
      assignee: who ? who._id : null,
      dueDate: daysFromNow(due),
      labels,
      position: positions[key], // dense 0..n-1 per column
      createdBy: [owner, admin, member][title.length % 3]._id,
    };
  };

  const created = [];
  for (const row of sprintTasks) created.push(await Task.create(build(sprint, row)));  
  for (const row of reportTasks) created.push(await Task.create(build(report, row)));  
  await Task.create({ board: (await Board.findOne({ team: other._id }))._id, team: other._id, title: 'Secret outsider task', createdBy: outsider._id });

  // backdate completedAt so the "completed per day" chart has a history
  const done = created.filter((t) => t.status === 'done');
  await Promise.all(done.map((t, i) => Task.updateOne({ _id: t._id }, { $set: { completedAt: daysFromNow(-(i * 2 + 1)) } })));

  // one PDF attachment
  const rel = 'seed/er-diagram-draft.pdf';
  fs.mkdirSync(path.join(uploadRoot, 'seed'), { recursive: true });
  fs.writeFileSync(path.join(uploadRoot, rel), SAMPLE_PDF);
  const erTask = created.find((t) => t.title === 'Board stats aggregation ($facet)');
  erTask.attachments.push({ originalName: 'er-diagram-draft.pdf', fileName: rel, url: `/uploads/${rel}`, mimeType: 'application/pdf', size: Buffer.byteLength(SAMPLE_PDF), uploadedBy: member._id });
  await erTask.save();

  const byTitle = (t) => created.find((x) => x.title === t);
  const comments = [
    ['JWT login and protect middleware', extra, 'Pushed the auth middleware, tests are green.'],
    ['JWT login and protect middleware', owner, 'Nice. Remember the generic error message on login.'],
    ['Fix login bug: token not cleared on 401', admin, 'The Axios interceptor now dispatches auth:logout.'],
    ['Board stats aggregation ($facet)', member, 'Attached the ER diagram draft for reference.'],
    ['Draw ER diagram', owner, 'Looks good, export a PNG for the report.'],
  ];
  await Comment.insertMany(comments.map(([title, who, text]) => ({ task: byTitle(title)._id, team: core._id, author: who._id, text })));

  const ago = (h) => new Date(Date.now() - h * 3600 * 1000);
  await Activity.insertMany([
    { team: core._id, actor: owner._id, action: 'team.created', meta: { name: core.name }, createdAt: ago(200) },
    { team: core._id, actor: owner._id, action: 'member.added', meta: { name: admin.name, role: 'admin' }, createdAt: ago(199) },
    { team: core._id, actor: owner._id, action: 'member.added', meta: { name: member.name, role: 'member' }, createdAt: ago(198) },
    { team: core._id, actor: owner._id, action: 'member.added', meta: { name: extra.name, role: 'member' }, createdAt: ago(198) },
    { team: core._id, board: sprint._id, actor: owner._id, action: 'board.created', meta: { name: sprint.name }, createdAt: ago(197) },
    { team: core._id, board: report._id, actor: admin._id, action: 'board.created', meta: { name: report.name }, createdAt: ago(150) },
    ...created.map((t, i) => ({ team: core._id, board: t.board, task: t._id, actor: t.createdBy, action: 'task.created', meta: { title: t.title }, createdAt: ago(190 - i * 6) })),
    ...done.map((t, i) => ({ team: core._id, board: t.board, task: t._id, actor: t.assignee || owner._id, action: 'task.moved', meta: { title: t.title, from: 'in_progress', to: 'done' }, createdAt: ago(i * 48 + 20) })),
    ...comments.map(([title, who, text], i) => ({ team: core._id, board: byTitle(title).board, task: byTitle(title)._id, actor: who._id, action: 'comment.added', meta: { title, excerpt: text.slice(0, 80) }, createdAt: ago(10 - i) })),
    { team: core._id, board: sprint._id, task: erTask._id, actor: member._id, action: 'attachment.added', meta: { title: erTask.title, files: ['er-diagram-draft.pdf'] }, createdAt: ago(4) },
  ]);

  log(`Seeded: 5 users, 2 teams, 3 boards, ${created.length + 1} tasks, ${comments.length} comments.`);
  log(`Log in with owner@syncora.dev / ${PASSWORD} (also admin@, member@, outsider@)`);
}

module.exports = seed;

if (require.main === module) {
  mongoose
    .connect(env.mongoUri, { serverSelectionTimeoutMS: 10000 })
    .then(() => seed())
    .then(() => mongoose.disconnect())
    .catch(async (err) => {
      console.error('Seed failed:', err.message);
      await mongoose.disconnect();
      process.exit(1);
    });
}
