import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  User,
  updateProfile // Ajoutez cette importation
} from 'firebase/auth';
import { auth, db } from '@/firebase/config'; // Assurez-vous que db est exporté depuis config
import { doc, setDoc } from 'firebase/firestore'; // Ajoutez ces importations

// Types pour les réponses
interface AuthResponse {
  success: boolean;
  user?: User;
  error?: string;
}

interface LogoutResponse {
  success: boolean;
  error?: string;
}

// Fonction pour traduire les codes d'erreur Firebase
const getErrorMessage = (errorCode: string): string => {
  const errorMessages: Record<string, string> = {
    'auth/email-already-in-use': 'Cet email est déjà utilisé',
    'auth/invalid-email': 'Email invalide',
    'auth/operation-not-allowed': 'Opération non autorisée',
    'auth/weak-password': 'Mot de passe trop faible (min 6 caractères)',
    'auth/user-disabled': 'Compte désactivé',
    'auth/user-not-found': 'Utilisateur non trouvé',
    'auth/wrong-password': 'Mot de passe incorrect',
    'auth/popup-closed-by-user': 'Connexion Google annulée',
    'auth/popup-blocked': 'Popup bloquée par le navigateur',
    'auth/network-request-failed': 'Erreur réseau',
    'auth/too-many-requests': 'Trop de tentatives, réessayez plus tard'
  };
  
  return errorMessages[errorCode] || 'Une erreur est survenue';
};

// Fonction pour créer un document utilisateur dans Firestore
const createUserDocument = async (userId: string, userData: any) => {
  try {
    const userRef = doc(db, 'Users', userId);
    await setDoc(userRef, {
      ...userData,
      uid: userId,
      updatedAt: new Date().toISOString()
    }, { merge: true });
    console.log('✅ Document utilisateur créé avec ID:', userId);
  } catch (error) {
    console.error('❌ Erreur création document utilisateur:', error);
    throw error;
  }
};

// Fonction pour vérifier si un utilisateur existe dans Firestore
const checkIfUserExists = async (userId: string): Promise<boolean> => {
  try {
    const { doc, getDoc } = await import('firebase/firestore');
    const userRef = doc(db, 'Users', userId);
    const userSnap = await getDoc(userRef);
    return userSnap.exists();
  } catch (error) {
    console.error('Erreur vérification utilisateur:', error);
    return false;
  }
};

// Inscription avec email/mot de passe
export const signUp = async (
  email: string, 
  password: string, 
  displayName?: string
): Promise<AuthResponse> => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Mettre à jour le displayName dans Firebase Auth si fourni
    if (displayName) {
      await updateProfile(user, {
        displayName: displayName
      });
    }
    
    // Créer le document utilisateur dans Firestore
    await createUserDocument(user.uid, {
      email: user.email,
      displayName: displayName || '',
      createdAt: new Date().toISOString(),
      role: 'user',
      phoneNumber: '',
    });
    
    return { 
      success: true, 
      user 
    };
  } catch (error: any) {
    console.error('Erreur inscription:', error);
    return { 
      success: false, 
      error: getErrorMessage(error.code) 
    };
  }
};

// Connexion avec email/mot de passe
export const signIn = async (email: string, password: string): Promise<AuthResponse> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { 
      success: true, 
      user: userCredential.user 
    };
  } catch (error: any) {
    console.error('Erreur connexion:', error);
    return { 
      success: false, 
      error: getErrorMessage(error.code) 
    };
  }
};

// Connexion avec Google
export const signInWithGoogle = async (): Promise<AuthResponse> => {
  try {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    
    // Vérifier si l'utilisateur existe déjà dans Firestore
    const userExists = await checkIfUserExists(user.uid);
    
    if (!userExists) {
      // Créer le document utilisateur dans Firestore si c'est une première connexion
      await createUserDocument(user.uid, {
        email: user.email,
        displayName: user.displayName || '',
        photoURL: user.photoURL || '',
        createdAt: new Date().toISOString(),
        role: 'user',
        phoneNumber: user.phoneNumber || '',
      });
    }
    
    return { 
      success: true, 
      user 
    };
  } catch (error: any) {
    console.error('Erreur connexion Google:', error);
    return { 
      success: false, 
      error: getErrorMessage(error.code) 
    };
  }
};

// Déconnexion
export const logout = async (): Promise<LogoutResponse> => {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error: any) {
    console.error('Erreur déconnexion:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
};

// Observer l'état de l'utilisateur
export const observeAuthState = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

// Récupérer l'utilisateur actuel
export const getCurrentUser = (): User | null => {
  return auth.currentUser;
};

// Optionnel: Vérifier si l'utilisateur est connecté
export const isUserLoggedIn = (): boolean => {
  return auth.currentUser !== null;
};

// Fonction pour obtenir les données utilisateur depuis Firestore
export const getUserData = async (userId: string) => {
  try {
    const { doc, getDoc } = await import('firebase/firestore');
    const userRef = doc(db, 'Users', userId);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      return userSnap.data();
    }
    return null;
  } catch (error) {
    console.error('Erreur récupération données utilisateur:', error);
    return null;
  }
};