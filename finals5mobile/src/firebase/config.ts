import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getMessaging } from 'firebase/messaging'

const firebaseConfig = {
  apiKey: "AIzaSyD1m-HY_WJQ-tTOJJsyoX3uKcPPy402ERA",
  authDomain: "mcd-mobile-web-jeu.firebaseapp.com",
  projectId: "mcd-mobile-web-jeu",
  storageBucket: "mcd-mobile-web-jeu.firebasestorage.app",
  messagingSenderId: "566668437976",
  appId: "1:566668437976:web:8e109f28fbcfe40e79aaad",
  measurementId: "G-WB5WRTBGCS"
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const db = getFirestore(app)
const messaging = getMessaging(app)

export { auth, db, messaging }

// Types pour les données selon votre schéma
export interface UserData {
  id?: string;
  nom?: string;
  email: string;
}

export interface Panne {
  id: string;
  nom: string;
}

export interface Etat {
  id: string;
  nom: string;
  ordre?: number; // Pour l'ordre des états si nécessaire
}

export interface Voiture {
  id?: string;
  modele: string;
  typeVehicule: string;  
  createdAt: string;
}

export interface UserVoiture {
  id?: string;
  voitureId: string; // Référence à la collection voitures
  etatActuelId: string; // Référence à l'état actuel
  createdAt: string;
}

export interface HistoriqueItem {
  id?: string;
  etatNom?: string;
  date: string;
  commentaire?: string;
  type: string;
}