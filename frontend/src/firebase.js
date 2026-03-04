import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
    apiKey: "AIzaSyD51pJaj5UPsDx8TqJ0iH4rRmTPxPPtAks",
    authDomain: "temos-81ec5.firebaseapp.com",
    projectId: "temos-81ec5",
    storageBucket: "temos-81ec5.firebasestorage.app",
    messagingSenderId: "195093199190",
    appId: "1:195093199190:web:e26ea0bf359a0bcea3bef7",
    measurementId: "G-EZM1H5VKP0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
