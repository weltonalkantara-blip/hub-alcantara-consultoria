// Configuração e inicialização do Firebase para o Hub Alcântara Consultoria Farma 360.
// A apiKey abaixo é a chave pública do app Web (não é um segredo — a segurança
// real é garantida pelas regras do Firestore/Storage, não por esconder esta chave).
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCDsxRwY2N0yXIVYu0AHGnd1-N83k5rma8",
  authDomain: "consultoria-farm.firebaseapp.com",
  projectId: "consultoria-farm",
  storageBucket: "consultoria-farm.firebasestorage.app",
  messagingSenderId: "341860005640",
  appId: "1:341860005640:web:7f826d5b5ec75330e7debd",
  measurementId: "G-86GSL7JVBQ",
};

// Evita reinicializar o app em hot-reload / renderização no servidor.
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
