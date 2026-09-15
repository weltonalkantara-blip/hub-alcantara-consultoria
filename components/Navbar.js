"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/firebase";
import { useAuth } from "@/lib/useAuth";

export default function Navbar() {
  const { user, isAdmin } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await signOut(auth);
    router.push("/login");
  }

  const linkClasses = (href) =>
    `rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors ${
      pathname === href
        ? "bg-white/10 text-gold-300"
        : "text-white/80 hover:bg-white/10 hover:text-white"
    }`;

  return (
    <header className="border-b border-navy-950 bg-navy-900">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-2.5">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Image
            src="/logo-alcantara.png"
            alt="Alcântara Consultoria Farma 360"
            width={140}
            height={43}
            priority
            className="h-8 w-auto sm:h-9"
          />
        </Link>

        {user && (
          <nav className="flex items-center gap-1">
            <Link href="/dashboard" className={linkClasses("/dashboard")}>
              Projetos
            </Link>
            {isAdmin && (
              <Link href="/usuarios" className={linkClasses("/usuarios")}>
                Usuários
              </Link>
            )}
          </nav>
        )}

        {user && (
          <div className="flex items-center gap-3 text-sm text-white/70">
            <span className="hidden sm:inline">{user.email}</span>
            <button
              onClick={handleLogout}
              className="rounded-md border border-gold-500/60 px-3 py-1.5 text-gold-300 hover:bg-gold-500/10"
            >
              Sair
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
