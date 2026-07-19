/// <reference types="vite/client" />
import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  User as FirebaseUser
} from "firebase/auth";
import { User, UserLocation } from "../types";

// Official configuration load from environment variables with fallback fallback
const firebaseConfig = {
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "stadium-management-72334",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:777494741645:web:6d93df2105acae41c458c4",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "stadium-management-72334.firebasestorage.app",
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCzGjjTxWi6c0eSBsX3ALMEwWgGSTWMYVk",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "stadium-management-72334.firebaseapp.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "777494741645",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-NN2DPV877Q"
};

// Initialize Firebase App & Auth
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export { auth };

// Fetch or create user profile metadata in localStorage associated with Firebase Auth UID
export function getCurrentUserProfile(uid: string, email: string): User {
  const metadataKey = `arenaos_user_metadata_${uid}`;
  const stored = localStorage.getItem(metadataKey);
  
  if (stored) {
    return JSON.parse(stored);
  }

  // Create default fallback metadata based on email type if not registered through form
  let role: User['role'] = 'fan';
  let name = "Spectator Profile";
  let zone = "Section 104";
  let coords: UserLocation = { zone, x: 26, y: 35 };
  let languagePref: User['languagePref'] = 'en';

  if (email.toLowerCase().includes('sarah') || email.toLowerCase().includes('volunteer')) {
    role = 'volunteer';
    name = "Sarah Jenkins";
    coords = { zone: "Zone A - North Gate", x: 45, y: 22 };
    languagePref = 'en';
  } else if (email.toLowerCase().includes('marcus') || email.toLowerCase().includes('organizer')) {
    role = 'organizer';
    name = "Marcus Vance";
    coords = { zone: "Control Room", x: 50, y: 50 };
    languagePref = 'en';
  } else if (email.toLowerCase().includes('diego')) {
    name = "Diego Ramirez";
    coords = { zone: "Section 104", x: 26, y: 35 };
    languagePref = 'es';
  }

  const defaultUser: User = {
    id: uid,
    email,
    name,
    role,
    status: 'active',
    currentLocation: coords,
    languagePref
  };

  localStorage.setItem(metadataKey, JSON.stringify(defaultUser));
  return defaultUser;
}

/**
 * Sign In User via Firebase Auth
 */
export async function signInUser(email: string, password: string): Promise<User> {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    return getCurrentUserProfile(user.uid, user.email || email);
  } catch (error: any) {
    // Auto-registration trigger:
    // If it's a seed account and doesn't exist yet in their new Firebase project, register them on-the-fly!
    if (
      (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') &&
      password === 'password' &&
      (email === 'diego@stadium.com' || email === 'sarah@stadium.com' || email === 'marcus@stadium.com')
    ) {
      console.log(`Predefined user ${email} not found in Firebase Auth console. Registering on-the-fly...`);
      let role: User['role'] = 'fan';
      let name = "Diego Ramirez";
      let lang: User['languagePref'] = 'es';

      if (email === 'sarah@stadium.com') {
        role = 'volunteer';
        name = "Sarah Jenkins";
        lang = 'en';
      } else if (email === 'marcus@stadium.com') {
        role = 'organizer';
        name = "Marcus Vance";
        lang = 'en';
      }

      return await signUpUser(email, password, name, role, lang);
    }
    throw error;
  }
}

/**
 * Sign Up User via Firebase Auth & store profile metadata locally
 */
export async function signUpUser(
  email: string,
  password: string,
  name: string,
  role: User['role'],
  languagePref: User['languagePref']
): Promise<User> {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const fUser: FirebaseUser = userCredential.user;

  // Determine coords based on role
  let coords: UserLocation = { zone: "Section 104", x: 26, y: 35 };
  if (role === 'volunteer') {
    coords = { zone: "Zone B - West Concourse", x: 18, y: 55 };
  } else if (role === 'organizer') {
    coords = { zone: "Control Room", x: 50, y: 50 };
  }

  const newUserProfile: User = {
    id: fUser.uid,
    email,
    name,
    role,
    status: 'active',
    currentLocation: coords,
    languagePref
  };

  const metadataKey = `arenaos_user_metadata_${fUser.uid}`;
  localStorage.setItem(metadataKey, JSON.stringify(newUserProfile));
  
  return newUserProfile;
}

/**
 * Sign Out User
 */
export async function logOutUser(): Promise<void> {
  await signOut(auth);
}
