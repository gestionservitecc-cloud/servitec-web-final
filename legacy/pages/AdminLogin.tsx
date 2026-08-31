import { useState } from "react";
import type { FormEvent } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../lib/firebase";

interface Props {
  onLogin: () => void;
}

const AdminLogin = ({ onLogin }: Props) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      await signInWithEmailAndPassword(auth, email, password);
      onLogin();
    } catch {
      setError("Credenciales incorrectas");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-zinc-900">
      <form
        onSubmit={handleLogin}
        className="bg-white dark:bg-zinc-800 p-8 rounded-2xl shadow w-80 space-y-4"
      >
        <h2 className="text-xl font-bold text-center">
          Admin Login
        </h2>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border p-2 rounded w-full"
          required
        />

        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border p-2 rounded w-full"
          required
        />

        {error && (
          <p className="text-red-500 text-sm text-center">
            {error}
          </p>
        )}

        <button
          type="submit"
          className="bg-primary text-white w-full py-2 rounded-lg"
        >
          Ingresar
        </button>
      </form>
    </div>
  );
};

export default AdminLogin;
