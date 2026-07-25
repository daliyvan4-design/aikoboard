"use client";

import { useEffect, useState } from "react";
import { Topbar } from "@/components/admin/topbar";
import { useToast } from "@/components/admin/toast";
import { useSession } from "next-auth/react";
import { Trash2, Plus, Shield, ShieldCheck, User, UserCog, ToggleLeft, ToggleRight } from "lucide-react";

const ROLE_OPTIONS = [
  { value: "SCANNER", label: "Scanner", icon: User, color: "bg-green-100 text-green-700" },
  { value: "CONCIERGE", label: "Concierge", icon: User, color: "bg-blue-100 text-blue-700" },
  { value: "AGENT_INSTITUTIONNEL", label: "Agent Institutionnel", icon: UserCog, color: "bg-purple-100 text-purple-700" },
  { value: "SUPERVISEUR", label: "Superviseur", icon: Shield, color: "bg-amber-100 text-amber-700" },
  { value: "ADMIN", label: "Admin", icon: ShieldCheck, color: "bg-red-100 text-red-700" },
];

function RoleBadge({ role }: { role: string }) {
  const opt = ROLE_OPTIONS.find((r) => r.value === role);
  if (!opt) return <span className="text-[10px] text-mute">{role}</span>;
  return (
    <span className={`text-[10px] uppercase tracking-wider font-medium rounded-full px-2.5 py-0.5 ${opt.color}`}>
      {opt.label}
    </span>
  );
}

export default function ParametresPage() {
  const { data: session } = useSession();
  const { show } = useToast();
  const isAdmin = session?.user?.role === "ADMIN";

  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwError, setPwError] = useState("");
  const [users, setUsers] = useState<any[]>([]);
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserNom, setNewUserNom] = useState("");
  const [newUserPw, setNewUserPw] = useState("");
  const [newUserRole, setNewUserRole] = useState("CONCIERGE");
  const [showAddUser, setShowAddUser] = useState(false);

  const fetchUsers = () => {
    fetch("/api/admin/users").then((r) => r.json()).then(setUsers);
  };

  useEffect(() => {
    if (session?.user) {
      setNom(session.user.name || "");
      setEmail(session.user.email || "");
    }
    fetchUsers();
  }, [session]);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/admin/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nom, email }),
    });
    show("Profil mis a jour");
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwError("");
    if (newPw !== confirmPw) { setPwError("Les mots de passe ne correspondent pas"); return; }
    if (newPw.length < 6) { setPwError("Le mot de passe doit faire au moins 6 caracteres"); return; }

    const res = await fetch("/api/admin/password", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw }),
    });

    if (!res.ok) {
      const data = await res.json();
      setPwError(data.error);
    } else {
      show("Mot de passe modifie");
      setCurrentPw(""); setNewPw(""); setConfirmPw("");
    }
  }

  async function addUser(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: newUserEmail, nom: newUserNom, password: newUserPw, role: newUserRole }),
    });
    if (res.ok) {
      show("Compte cree");
      setShowAddUser(false);
      setNewUserEmail(""); setNewUserNom(""); setNewUserPw(""); setNewUserRole("CONCIERGE");
      fetchUsers();
    } else {
      const data = await res.json();
      show(data.error || "Erreur");
    }
  }

  async function toggleActive(id: string, actif: boolean) {
    await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ actif: !actif }),
    });
    fetchUsers();
  }

  async function deleteUser(id: string) {
    if (!confirm("Supprimer ce compte ?")) return;
    await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
    show("Compte supprime");
    fetchUsers();
  }

  const isSuperviseur = session?.user?.role === "SUPERVISEUR";
  const availableRoles = ROLE_OPTIONS.filter((r) => {
    if (isAdmin) return true;
    if (isSuperviseur) return r.value === "CONCIERGE" || r.value === "AGENT_INSTITUTIONNEL" || r.value === "SCANNER";
    return false;
  });

  return (
    <>
      <Topbar title="Parametres" />
      <div className="p-6 lg:p-10 max-w-2xl space-y-8">
        <form onSubmit={saveProfile} className="bg-white rounded-2xl border border-line p-6">
          <h3 className="font-serif text-[18px] text-ink mb-4">Profil</h3>
          <div className="space-y-3">
            <div>
              <label className="text-[10px] uppercase tracking-[0.22em] text-mute mb-1 block">Nom</label>
              <input value={nom} onChange={(e) => setNom(e.target.value)}
                className="w-full bg-cream border border-line rounded-xl px-4 py-2.5 text-[13px]" />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-[0.22em] text-mute mb-1 block">Email</label>
              <input value={email} onChange={(e) => setEmail(e.target.value)} type="email"
                className="w-full bg-cream border border-line rounded-xl px-4 py-2.5 text-[13px]" />
            </div>
          </div>
          <button type="submit" className="mt-4 bg-ink text-cream rounded-full px-6 py-2.5 text-[13px] font-medium hover:bg-ink2 btn-press">
            Sauvegarder
          </button>
        </form>

        <form onSubmit={changePassword} className="bg-white rounded-2xl border border-line p-6">
          <h3 className="font-serif text-[18px] text-ink mb-4">Mot de passe</h3>
          {pwError && <p className="text-err text-[13px] mb-3">{pwError}</p>}
          <div className="space-y-3">
            <div>
              <label className="text-[10px] uppercase tracking-[0.22em] text-mute mb-1 block">Mot de passe actuel</label>
              <input type="password" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)}
                className="w-full bg-cream border border-line rounded-xl px-4 py-2.5 text-[13px]" />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-[0.22em] text-mute mb-1 block">Nouveau mot de passe</label>
              <input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)}
                className="w-full bg-cream border border-line rounded-xl px-4 py-2.5 text-[13px]" />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-[0.22em] text-mute mb-1 block">Confirmer</label>
              <input type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)}
                className="w-full bg-cream border border-line rounded-xl px-4 py-2.5 text-[13px]" />
            </div>
          </div>
          <button type="submit" className="mt-4 bg-ink text-cream rounded-full px-6 py-2.5 text-[13px] font-medium hover:bg-ink2 btn-press">
            Changer le mot de passe
          </button>
        </form>

        <div className="bg-white rounded-2xl border border-line p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-serif text-[18px] text-ink">Comptes</h3>
            <button onClick={() => setShowAddUser(true)} className="text-[12px] flex items-center gap-1 text-gold hover:text-gold2 font-medium">
              <Plus size={14} /> Ajouter un compte
            </button>
          </div>

          <div className="divide-y divide-line">
            {users.map((u) => (
              <div key={u.id} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold ${u.actif ? "bg-gold text-ink" : "bg-line text-mute"}`}>
                    {u.nom?.split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className={`text-[13px] font-medium ${u.actif ? "text-ink" : "text-mute line-through"}`}>{u.nom}</p>
                      <RoleBadge role={u.role} />
                    </div>
                    <p className="text-[12px] text-mute">{u.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleActive(u.id, u.actif)}
                    className={`p-1.5 rounded-lg transition-colors ${u.actif ? "text-ok hover:bg-ok/10" : "text-mute hover:bg-line"}`}
                    title={u.actif ? "Desactiver" : "Activer"}
                  >
                    {u.actif ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                  </button>
                  <button onClick={() => deleteUser(u.id)} className="text-mute hover:text-err p-1.5 rounded-lg hover:bg-err/10">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {showAddUser && (
            <form onSubmit={addUser} className="mt-4 pt-4 border-t border-line space-y-3">
              <p className="text-[12px] font-medium text-ink uppercase tracking-wider">Nouveau compte</p>
              <input value={newUserNom} onChange={(e) => setNewUserNom(e.target.value)} placeholder="Nom complet"
                className="w-full bg-cream border border-line rounded-xl px-4 py-2.5 text-[13px]" required />
              <input value={newUserEmail} onChange={(e) => setNewUserEmail(e.target.value)} placeholder="Email" type="email"
                className="w-full bg-cream border border-line rounded-xl px-4 py-2.5 text-[13px]" required />
              <input value={newUserPw} onChange={(e) => setNewUserPw(e.target.value)} placeholder="Mot de passe" type="password"
                className="w-full bg-cream border border-line rounded-xl px-4 py-2.5 text-[13px]" required />
              <div>
                <label className="text-[10px] uppercase tracking-[0.22em] text-mute mb-1.5 block">Role</label>
                <div className="grid grid-cols-2 gap-2">
                  {availableRoles.map((r) => (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => setNewUserRole(r.value)}
                      className={`flex items-center gap-2 p-3 rounded-xl border text-[12px] font-medium transition-all ${
                        newUserRole === r.value
                          ? "border-gold bg-gold/10 text-ink"
                          : "border-line bg-cream text-mute hover:border-gold/30"
                      }`}
                    >
                      <r.icon className="w-4 h-4" />
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowAddUser(false)} className="text-[13px] text-mute hover:text-ink">
                  Annuler
                </button>
                <button type="submit" className="bg-gold text-ink rounded-full px-5 py-2.5 text-[13px] font-semibold btn-press hover:bg-gold2">
                  Creer le compte
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </>
  );
}
