const admin = require('firebase-admin');

function getAdmin() {
  if (!admin.apps.length) {
    const cred = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (!cred) throw new Error('Missing FIREBASE_SERVICE_ACCOUNT');
    admin.initializeApp({ credential: admin.credential.cert(JSON.parse(cred)) });
  }
  return admin;
}

// Public: increment like count for a shared memory. No auth.
exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }
  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON' }) };
  }
  const memoryId = body.memoryId;
  if (!memoryId || typeof memoryId !== 'string') {
    return { statusCode: 400, body: JSON.stringify({ error: 'memoryId required' }) };
  }
  try {
    const app = getAdmin();
    const db = app.firestore();
    const ref = db.collection('sharedMemories').doc(memoryId);
    const snap = await ref.get();
    if (!snap.exists) {
      return { statusCode: 404, body: JSON.stringify({ error: 'Memory not found' }) };
    }
    const current = snap.data().likes ?? 0;
    const next = current + 1;
    await ref.update({ likes: next });
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ likes: next }),
    };
  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message || 'Like failed' }),
    };
  }
};
