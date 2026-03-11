"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useEffect, useState, useCallback } from "react";
import { deleteRecipe, fetchMyRecipes, type UserRecipe } from "@/lib/api";
import { useUser } from "@/hooks/use-user";
import {
  Plus,
  Pencil,
  Trash2,
  Clock,
  Users,
  ChefHat,
  ArrowLeft,
  Loader2,
  Search,
} from "lucide-react";

/* ─── design tokens (matching recipe-wizard) ───────────────────────── */

const t = {
  bg: "#F7F8F6",
  primary: "#99CC33",
  primaryDark: "#538100",
  primaryGlow: "rgba(153,204,51,0.5)",
  primaryTrack: "rgba(153,204,51,0.15)",
  white: "#FFFFFF",
  border: "#E2E8F0",
  label: "#334155",
  placeholder: "#94A3B8",
  heading: "#0F172A",
  muted: "#475569",
  mutedBg: "#F1F5F9",
  danger: "#EF4444",
  dangerBg: "rgba(239,68,68,0.08)",
  amber: "#F59E0B",
};

/* ─── component ────────────────────────────────────────────────────── */

export default function MyRecipesPage() {
  const router = useRouter();
  const { user } = useUser();
  const uid = user?.$id;
  const [items, setItems] = useState<UserRecipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("");

  const load = useCallback(async () => {
    if (!uid) return;
    setLoading(true);
    try {
      const res = await fetchMyRecipes(uid);
      setItems(res.items ?? []);
    } finally {
      setLoading(false);
    }
  }, [uid]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onDelete(id: string) {
    if (!uid || !confirm("Delete this recipe? This cannot be undone.")) return;
    setItems((prev) => prev.filter((x) => x.id !== id));
    try {
      await deleteRecipe(uid, id);
    } catch (e) {
      await load();
      console.error("Delete failed", e);
    }
  }

  const visible = filter
    ? items.filter((r) =>
      (r.title ?? "").toLowerCase().includes(filter.toLowerCase())
    )
    : items;

  return (
    <>
      <style>{pageCSS}</style>
      <div className="mr-page">
        {/* ── Header ── */}
        <header className="mr-header">
          <button className="mr-back-btn" onClick={() => router.back()}>
            <ArrowLeft size={20} />
          </button>
          <h1 className="mr-title">My Recipes</h1>
          {items.length > 0 && (
            <span className="mr-count">{items.length}</span>
          )}
          <div style={{ flex: 1 }} />
          <Link href="/create" className="mr-create-btn">
            <Plus size={18} />
            Create Recipe
          </Link>
        </header>

        {/* ── Search bar (only when recipes exist) ── */}
        {items.length > 0 && (
          <div className="mr-search-wrap">
            <Search size={18} className="mr-search-icon" />
            <input
              className="mr-search"
              placeholder="Search your recipes…"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </div>
        )}

        {/* ── Content ── */}
        {loading ? (
          <div className="mr-loading">
            <Loader2 size={32} className="mr-spinner" />
            <span>Loading your recipes…</span>
          </div>
        ) : visible.length ? (
          <div className="mr-grid">
            {visible.map((r) => {
              const prep = r.prep_time_minutes ?? 0;
              const cook = r.cook_time_minutes ?? 0;
              const total = (r.total_time_minutes ?? (prep + cook)) || null;
              const img = r.image_url;

              return (
                <Link
                  key={r.id}
                  href={`/my-recipes/${r.id}`}
                  className="mr-card"
                >
                  {/* Image */}
                  <div className="mr-card-img-wrap">
                    {img ? (
                      <Image
                        src={img}
                        alt={r.title ?? "Recipe"}
                        fill
                        sizes="(max-width: 640px) 100vw, 320px"
                        className="mr-card-img"
                      />
                    ) : (
                      <div className="mr-card-img-placeholder">
                        <ChefHat size={36} />
                      </div>
                    )}
                    {/* Difficulty badge */}
                    {r.difficulty && (
                      <span className="mr-badge-diff">
                        {r.difficulty}
                      </span>
                    )}
                  </div>

                  {/* Body */}
                  <div className="mr-card-body">
                    <h3 className="mr-card-title">{r.title ?? "Untitled"}</h3>

                    {/* Meta row */}
                    <div className="mr-card-meta">
                      {total != null && total > 0 && (
                        <span className="mr-card-meta-item">
                          <Clock size={14} /> {total} min
                        </span>
                      )}
                      {(r.servings ?? 0) > 0 && (
                        <span className="mr-card-meta-item">
                          <Users size={14} /> {r.servings} servings
                        </span>
                      )}
                    </div>

                    {/* Tags */}
                    {(r.cuisines ?? (r.cuisine ? [r.cuisine] : [])).length > 0 && (
                      <div className="mr-card-tags">
                        {(r.cuisines ?? (r.cuisine ? [r.cuisine] : []))
                          .slice(0, 3)
                          .map((c) => (
                            <span key={c} className="mr-tag">
                              {c}
                            </span>
                          ))}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="mr-card-actions">
                    <Link
                      href={`/recipes/${r.id}/edit`}
                      className="mr-action-edit"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Pencil size={14} /> Edit
                    </Link>
                    <button
                      className="mr-action-delete"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onDelete(r.id);
                      }}
                    >
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : items.length > 0 && filter ? (
          /* no matches for search */
          <div className="mr-empty">
            <Search size={40} className="mr-empty-icon" />
            <p className="mr-empty-title">No recipes match &ldquo;{filter}&rdquo;</p>
            <p className="mr-empty-sub">Try a different search term</p>
          </div>
        ) : (
          /* truly empty */
          <div className="mr-empty">
            <div className="mr-empty-circle">
              <ChefHat size={48} className="mr-empty-icon" />
            </div>
            <p className="mr-empty-title">No recipes yet</p>
            <p className="mr-empty-sub">
              Create your first recipe and it will appear here
            </p>
            <Link href="/create" className="mr-create-btn mr-create-btn-lg">
              <Plus size={20} />
              Create your first recipe
            </Link>
          </div>
        )}
      </div>
    </>
  );
}

/* ─── CSS ──────────────────────────────────────────────────────────── */

const pageCSS = `
  .mr-page {
    font-family: 'Inter', 'Public Sans', sans-serif;
    background: ${t.bg};
    min-height: 100vh;
    max-width: 720px;
    margin: 0 auto;
    padding: 0 16px 100px;
  }
  @media (min-width: 1024px) {
    .mr-page { max-width: 960px; padding-bottom: 32px; }
  }

  /* ── Header ── */
  .mr-header {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 20px 0 16px;
    position: sticky; top: 0; z-index: 5;
    background: ${t.bg};
  }
  .mr-back-btn {
    width: 36px; height: 36px; border-radius: 10px;
    border: 1px solid ${t.border}; background: ${t.white};
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; color: ${t.heading};
    transition: background 0.15s;
    flex-shrink: 0;
  }
  .mr-back-btn:hover { background: ${t.mutedBg}; }
  .mr-title {
    font-size: 22px; font-weight: 700; color: ${t.heading};
    margin: 0; line-height: 1;
  }
  .mr-count {
    display: inline-flex; align-items: center; justify-content: center;
    background: ${t.primaryTrack}; color: ${t.primaryDark};
    font-size: 13px; font-weight: 700; min-width: 26px; height: 26px;
    border-radius: 9999px; padding: 0 8px;
  }

  /* ── Create button ── */
  .mr-create-btn {
    display: inline-flex; align-items: center; gap: 8px;
    background: ${t.primary}; color: ${t.heading};
    border: none; border-radius: 12px;
    padding: 10px 20px; font-size: 15px; font-weight: 700;
    cursor: pointer; text-decoration: none;
    font-family: 'Inter', sans-serif;
    box-shadow: 0 2px 8px ${t.primaryGlow};
    transition: transform 0.15s, box-shadow 0.15s;
  }
  .mr-create-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 16px ${t.primaryGlow};
  }
  .mr-create-btn-lg {
    padding: 14px 28px; font-size: 17px; margin-top: 8px;
  }

  /* ── Search ── */
  .mr-search-wrap {
    position: relative; margin-bottom: 20px;
  }
  .mr-search-icon {
    position: absolute; left: 16px; top: 50%; transform: translateY(-50%);
    color: ${t.placeholder}; pointer-events: none;
  }
  .mr-search {
    width: 100%; height: 48px; border-radius: 9999px;
    border: 1px solid ${t.border}; background: ${t.white};
    padding: 0 16px 0 44px; font-size: 15px; color: ${t.heading};
    outline: none; font-family: 'Inter', sans-serif;
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  .mr-search:focus {
    border-color: ${t.primary};
    box-shadow: 0 0 0 3px ${t.primaryTrack};
  }
  .mr-search::placeholder { color: ${t.placeholder}; }

  /* ── Loading ── */
  .mr-loading {
    display: flex; flex-direction: column; align-items: center;
    justify-content: center; gap: 12px; padding: 80px 16px;
    color: ${t.muted}; font-size: 15px;
  }
  .mr-spinner { animation: mr-spin 1s linear infinite; color: ${t.primary}; }
  @keyframes mr-spin { to { transform: rotate(360deg); } }

  /* ── Grid ── */
  .mr-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 16px;
  }
  @media (min-width: 640px) {
    .mr-grid { grid-template-columns: 1fr 1fr; }
  }
  @media (min-width: 1024px) {
    .mr-grid { grid-template-columns: 1fr 1fr 1fr; }
  }

  /* ── Card ── */
  .mr-card {
    display: flex; flex-direction: column;
    background: ${t.white}; border-radius: 20px;
    border: 1px solid ${t.border};
    overflow: hidden; text-decoration: none; color: inherit;
    transition: transform 0.2s, box-shadow 0.2s;
  }
  .mr-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 24px rgba(0,0,0,0.08);
  }

  /* Card image */
  .mr-card-img-wrap {
    position: relative; width: 100%; aspect-ratio: 16/10;
    background: ${t.mutedBg}; overflow: hidden;
  }
  .mr-card-img { object-fit: cover; }
  .mr-card-img-placeholder {
    display: flex; align-items: center; justify-content: center;
    width: 100%; height: 100%; color: ${t.placeholder};
  }
  .mr-badge-diff {
    position: absolute; top: 10px; right: 10px;
    background: ${t.white}; color: ${t.heading};
    font-size: 11px; font-weight: 700; text-transform: capitalize;
    padding: 4px 10px; border-radius: 9999px;
    box-shadow: 0 2px 6px rgba(0,0,0,0.1);
  }

  /* Card body */
  .mr-card-body { padding: 14px 16px 8px; flex: 1; }
  .mr-card-title {
    font-size: 17px; font-weight: 700; color: ${t.heading};
    margin: 0 0 8px; line-height: 1.3;
    display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
  }
  .mr-card-meta {
    display: flex; align-items: center; gap: 14px;
    color: ${t.muted}; font-size: 13px; margin-bottom: 8px;
  }
  .mr-card-meta-item {
    display: inline-flex; align-items: center; gap: 4px;
  }
  .mr-card-tags { display: flex; flex-wrap: wrap; gap: 6px; }
  .mr-tag {
    display: inline-block; padding: 3px 10px; border-radius: 9999px;
    background: ${t.primaryTrack}; color: ${t.primaryDark};
    font-size: 12px; font-weight: 600; text-transform: capitalize;
  }

  /* Card actions */
  .mr-card-actions {
    display: flex; align-items: center; gap: 8px;
    padding: 10px 16px 14px; border-top: 1px solid ${t.border};
  }
  .mr-action-edit {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 7px 14px; border-radius: 10px;
    border: 1px solid ${t.border}; background: ${t.white};
    color: ${t.label}; font-size: 13px; font-weight: 600;
    cursor: pointer; text-decoration: none;
    font-family: 'Inter', sans-serif;
    transition: background 0.15s, border-color 0.15s;
  }
  .mr-action-edit:hover {
    background: ${t.primaryTrack}; border-color: ${t.primary};
    color: ${t.primaryDark};
  }
  .mr-action-delete {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 7px 14px; border-radius: 10px;
    border: 1px solid ${t.border}; background: ${t.white};
    color: ${t.danger}; font-size: 13px; font-weight: 600;
    cursor: pointer; font-family: 'Inter', sans-serif;
    transition: background 0.15s, border-color 0.15s;
  }
  .mr-action-delete:hover {
    background: ${t.dangerBg}; border-color: ${t.danger};
  }

  /* ── Empty state ── */
  .mr-empty {
    display: flex; flex-direction: column; align-items: center;
    text-align: center; padding: 60px 24px 80px; gap: 12px;
  }
  .mr-empty-circle {
    width: 100px; height: 100px; border-radius: 50%;
    background: ${t.primaryTrack};
    display: flex; align-items: center; justify-content: center;
    margin-bottom: 8px;
  }
  .mr-empty-icon { color: ${t.primaryDark}; }
  .mr-empty-title {
    font-size: 20px; font-weight: 700; color: ${t.heading}; margin: 0;
  }
  .mr-empty-sub {
    font-size: 15px; color: ${t.muted}; margin: 0;
    max-width: 280px; line-height: 1.5;
  }
`;
