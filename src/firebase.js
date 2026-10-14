import { initializeApp } from 'firebase/app'
import { getDatabase } from 'firebase/database'

const firebaseConfig = {
  apiKey: "AIzaSyAaEeWaTt5O6DICp26LsxvUOZpm8e4MYhQ",
  authDomain: "setz-18b61.firebaseapp.com",
  databaseURL: "https://setz-18b61-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "setz-18b61",
  storageBucket: "setz-18b61.firebasestorage.app",
  messagingSenderId: "740668737093",
  appId: "1:740668737093:web:702bdd111bf5c4ba8b052c",
}

const app = initializeApp(firebaseConfig)
export const db = getDatabase(app)
