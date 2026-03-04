const admin = require('firebase-admin');
require('dotenv').config({ path: './backend/.env' });

console.log('Project ID:', process.env.FIREBASE_PROJECT_ID);

try {
    admin.initializeApp({
        projectId: process.env.FIREBASE_PROJECT_ID
    });
    const db = admin.firestore();
    db.collection('test').get()
        .then(() => console.log('Successfully connected to Firestore'))
        .catch(err => console.error('Firestore Error:', err.message));
} catch (e) {
    console.error('Initialization Error:', e.message);
}
