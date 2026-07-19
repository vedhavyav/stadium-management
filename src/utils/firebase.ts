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

// Official configuration load from environment variables
const firebaseConfig = {
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "",
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || ""
};

if (!firebaseConfig.apiKey) {
  console.warn("Firebase VITE_FIREBASE_API_KEY is missing from environment. Using local client auth mockups.");
}

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
    // No auto-registration fallback; propagate the error
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
