// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-analytics.js";
import { 
    getFirestore, 
    getDocs, 
    collection,
    addDoc,
    query, 
    where, 
    orderBy
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js"; //need Firestore to read/write data
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
apiKey: "AIzaSyCexe_k1nRmdwmAGOM7-a5Wo3S-zxQ-dSA",
authDomain: "novaeatz-187ef.firebaseapp.com",
projectId: "novaeatz-187ef",
storageBucket: "novaeatz-187ef.firebasestorage.app",
messagingSenderId: "240606168006",
appId: "1:240606168006:web:a3fdddc7a0c403b72028c7",
measurementId: "G-Y1K99JZ0XH"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app); //connects the database connection.

export {
     db,
     analytics, 
     getDocs, 
     collection, 
     addDoc, 
     query, 
     where, 
     orderBy
};

