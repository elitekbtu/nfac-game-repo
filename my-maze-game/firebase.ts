// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBJ4ipSdlq_SYjZQSuBy2nOgbFJbTis388",
  authDomain: "nfacoiyn.firebaseapp.com",
  projectId: "nfacoiyn",
  storageBucket: "nfacoiyn.firebasestorage.app",
  messagingSenderId: "275843226256",
  appId: "1:275843226256:web:0edf273bca9f55453a9615", 
  databaseURL: "https://nfacoiyn-default-rtdb.europe-west1.firebasedatabase.app"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export default app;
export { db }; 