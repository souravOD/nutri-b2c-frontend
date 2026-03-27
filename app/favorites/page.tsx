"use client"

import { useEffect, useState, useMemo } from "react"
import { useFavorites } from "@/hooks/use-favorites"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Heart,
  BookOpen,
  Search,
  Clock,
  Users as UsersIcon,
  ArrowLeft,
  Loader2,
  ChefHat,
  Flame,
  Dumbbell,
} from "lucide-react"

/* ─── design tokens (matching my-recipes / home) ──────────────────── */

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
}

/* ─── component ───────────────────────────────────────────────────── */

export default function FavoritesPage() {
  const { savedRecipes, toggleFavorite, isFavorite, loadSavedRecipes } = useFavorites()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("")
  const [imgErrors, setImgErrors] = useState<Set<string>>(new Set())

  useEffect(() => {
    setLoading(true)
    loadSavedRecipes().finally(() => setLoading(false))
  }, [loadSavedRecipes])

  const visible = useMemo(() => {
    if (!filter) return savedRecipes
    const q = filter.toLowerCase()
    return savedRecipes.filter((r) =>
      (r.title ?? "").toLowerCase().includes(q)
    )
  }, [savedRecipes, filter])

  const handleImgError = (id: string) => {
    setImgErrors((prev) => new Set(prev).add(id))
  }

  return (
    <>
      <style>{pageCSS}</style>
      <div className="fav-page">
        {/* ── Header ── */}
        <header className="fav-header">
          <button className="fav-back-btn" onClick={() => router.back()}>
            <ArrowLeft size={20} />
          </button>
          <h1 className="fav-title">Saved Recipes</h1>
          {savedRecipes.length > 0 && (
            <span className="fav-count">{savedRecipes.length}</span>
          )}
        </header>

        {/* ── Subtitle ── */}
        <p className="fav-subtitle">
          {savedRecipes.length > 0
            ? `${savedRecipes.length} recipe${savedRecipes.length !== 1 ? "s" : ""} saved`
            : "Your favorite recipes in one place"}
        </p>

        {/* ── Search (desktop only, when recipes exist) ── */}
        {savedRecipes.length > 0 && (
          <div className="fav-search-wrap">
            <Search size={18} className="fav-search-icon" />
            <input
              className="fav-search"
              placeholder="Search saved recipes…"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </div>
        )}

        {/* ── Loading ── */}
        {loading ? (
          <div className="fav-loading">
            <Loader2 size={32} className="fav-spinner" />
            <span>Loading saved recipes…</span>
          </div>
        ) : visible.length > 0 ? (
          /* ── Grid ── */
          <div className="fav-grid">
            {visible.map((recipe) => {
              const imgSrc = String(recipe.imageUrl || recipe.image_url || "")
              const hasImage = imgSrc.length > 0 && !imgErrors.has(recipe.id)
              const calories = recipe.calories ?? recipe.nutrition?.calories ?? 0
              const protein = recipe.protein_g ?? recipe.nutrition?.protein_g ?? 0
              const prep = recipe.prepTime ?? 0
              const cook = recipe.cookTime ?? 0
              const total = (recipe.totalTimeMinutes ?? (prep + cook)) || null
              const tags = (recipe.tags ?? []).slice(0, 3)

              return (
                <Link key={recipe.id} href={`/recipes/${recipe.id}`} className="fav-card">
                  {/* Image */}
                  <div className="fav-card-img-wrap">
                    {hasImage ? (
                      <Image
                        src={imgSrc}
                        alt={recipe.title ?? "Recipe"}
                        fill
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 320px"
                        className="fav-card-img"
                        onError={() => handleImgError(recipe.id)}
                      />
                    ) : (
                      <div className="fav-card-img-placeholder">
                        <ChefHat size={36} />
                      </div>
                    )}
                    {/* Difficulty badge */}
                    {recipe.difficulty && (
                      <span className="fav-badge-diff">{recipe.difficulty}</span>
                    )}
                    {/* Heart button */}
                    <button
                      className="fav-card-heart"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        toggleFavorite(recipe.id)
                      }}
                      aria-label="Unsave recipe"
                    >
                      <Heart
                        size={16}
                        fill={isFavorite(recipe.id) ? "#EF4444" : "none"}
                        color={isFavorite(recipe.id) ? "#EF4444" : "#999"}
                      />
                    </button>
                  </div>

                  {/* Body */}
                  <div className="fav-card-body">
                    <h3 className="fav-card-title">{recipe.title ?? "Untitled"}</h3>

                    {/* Meta: kcal + protein */}
                    <div className="fav-card-meta">
                      {Number(calories) > 0 && (
                        <span className="fav-card-meta-item">
                          <Flame size={14} color="#F97316" /> {Math.round(Number(calories))} kcal
                        </span>
                      )}
                      {Number(protein) > 0 && (
                        <span className="fav-card-meta-item">
                          <Dumbbell size={14} color="#60A5FA" /> {Math.round(Number(protein))}g Protein
                        </span>
                      )}
                      {total != null && total > 0 && !Number(calories) && (
                        <span className="fav-card-meta-item">
                          <Clock size={14} /> {total} min
                        </span>
                      )}
                      {(recipe.servings ?? 0) > 0 && !Number(protein) && (
                        <span className="fav-card-meta-item">
                          <UsersIcon size={14} /> {recipe.servings} serv
                        </span>
                      )}
                    </div>

                    {/* Time + servings secondary row */}
                    {(Number(calories) > 0 || Number(protein) > 0) && (total != null && total > 0 || (recipe.servings ?? 0) > 0) && (
                      <div className="fav-card-meta fav-card-meta-secondary">
                        {total != null && total > 0 && (
                          <span className="fav-card-meta-item">
                            <Clock size={13} /> {total} min
                          </span>
                        )}
                        {(recipe.servings ?? 0) > 0 && (
                          <span className="fav-card-meta-item">
                            <UsersIcon size={13} /> {recipe.servings} servings
                          </span>
                        )}
                      </div>
                    )}

                    {/* Tags */}
                    {tags.length > 0 && (
                      <div className="fav-card-tags">
                        {tags.map((tag) => (
                          <span key={tag} className="fav-tag">{tag}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        ) : savedRecipes.length > 0 && filter ? (
          /* No matches for search */
          <div className="fav-empty">
            <Search size={40} className="fav-empty-icon-search" />
            <p className="fav-empty-title">No recipes match &ldquo;{filter}&rdquo;</p>
            <p className="fav-empty-sub">Try a different search term</p>
          </div>
        ) : (
          /* ── Empty state ── */
          <div className="fav-empty">
            <div className="fav-empty-circle">
              <Heart size={48} strokeWidth={1.5} className="fav-empty-icon" />
            </div>
            <p className="fav-empty-title">No saved recipes yet</p>
            <p className="fav-empty-sub">
              Start exploring recipes and save your favorites by clicking the
              heart icon on any recipe card.
            </p>
            <div className="fav-empty-actions">
              <Link href="/" className="fav-btn-primary">
                <BookOpen size={18} /> Browse Recipes
              </Link>
              <Link href="/search" className="fav-btn-secondary">
                <Search size={18} /> Search Recipes
              </Link>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

/* ─── CSS ──────────────────────────────────────────────────────────── */

const pageCSS = `
  .fav-page {
    font-family: 'Inter', 'Public Sans', sans-serif;
    background: ${t.bg};
    min-height: 100vh;
    max-width: 720px;
    margin: 0 auto;
    padding: 0 16px 100px;
  }
  @media (min-width: 1024px) {
    .fav-page { max-width: 960px; padding-bottom: 32px; }
  }

  /* ── Header ── */
  .fav-header {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 20px 0 4px;
    position: sticky; top: 0; z-index: 5;
    background: ${t.bg};
  }
  .fav-back-btn {
    width: 36px; height: 36px; border-radius: 10px;
    border: 1px solid ${t.border}; background: ${t.white};
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; color: ${t.heading};
    transition: background 0.15s;
    flex-shrink: 0;
  }
  .fav-back-btn:hover { background: ${t.mutedBg}; }
  @media (min-width: 1024px) {
    .fav-back-btn { display: none; }
  }
  .fav-title {
    font-size: 22px; font-weight: 700; color: ${t.heading};
    margin: 0; line-height: 1;
  }
  .fav-count {
    display: inline-flex; align-items: center; justify-content: center;
    background: ${t.primaryTrack}; color: ${t.primaryDark};
    font-size: 13px; font-weight: 700; min-width: 26px; height: 26px;
    border-radius: 9999px; padding: 0 8px;
  }
  .fav-subtitle {
    margin: 4px 0 16px;
    font-size: 14px; color: ${t.muted};
    font-family: 'Inter', sans-serif;
  }

  /* ── Search (desktop only) ── */
  .fav-search-wrap {
    position: relative; margin-bottom: 20px;
    display: none;
  }
  @media (min-width: 1024px) {
    .fav-search-wrap { display: block; }
  }
  .fav-search-icon {
    position: absolute; left: 16px; top: 50%; transform: translateY(-50%);
    color: ${t.placeholder}; pointer-events: none;
  }
  .fav-search {
    width: 100%; height: 48px; border-radius: 9999px;
    border: 1px solid ${t.border}; background: ${t.white};
    padding: 0 16px 0 44px; font-size: 15px; color: ${t.heading};
    outline: none; font-family: 'Inter', sans-serif;
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  .fav-search:focus {
    border-color: ${t.primary};
    box-shadow: 0 0 0 3px ${t.primaryTrack};
  }
  .fav-search::placeholder { color: ${t.placeholder}; }

  /* ── Loading ── */
  .fav-loading {
    display: flex; flex-direction: column; align-items: center;
    justify-content: center; gap: 12px; padding: 80px 16px;
    color: ${t.muted}; font-size: 15px;
  }
  .fav-spinner { animation: fav-spin 1s linear infinite; color: ${t.primary}; }
  @keyframes fav-spin { to { transform: rotate(360deg); } }

  /* ── Grid ── */
  .fav-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }
  @media (min-width: 640px) {
    .fav-grid { grid-template-columns: 1fr 1fr; gap: 16px; }
  }
  @media (min-width: 1024px) {
    .fav-grid { grid-template-columns: 1fr 1fr 1fr; }
  }

  /* ── Card ── */
  .fav-card {
    display: flex; flex-direction: column;
    background: ${t.white}; border-radius: 20px;
    border: 1px solid ${t.border};
    overflow: hidden; text-decoration: none; color: inherit;
    transition: transform 0.2s, box-shadow 0.2s;
  }
  .fav-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 24px rgba(0,0,0,0.08);
  }

  /* Card image */
  .fav-card-img-wrap {
    position: relative; width: 100%; aspect-ratio: 16/10;
    background: ${t.mutedBg}; overflow: hidden;
  }
  .fav-card-img { object-fit: cover; }
  .fav-card-img-placeholder {
    display: flex; align-items: center; justify-content: center;
    width: 100%; height: 100%; color: ${t.placeholder};
  }
  .fav-badge-diff {
    position: absolute; top: 10px; left: 10px;
    background: ${t.white}; color: ${t.heading};
    font-size: 11px; font-weight: 700; text-transform: capitalize;
    padding: 4px 10px; border-radius: 9999px;
    box-shadow: 0 2px 6px rgba(0,0,0,0.1);
  }
  .fav-card-heart {
    position: absolute; top: 10px; right: 10px;
    width: 32px; height: 32px; border-radius: 50%;
    background: rgba(255,255,255,0.9); border: none;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; transition: transform 0.2s;
    backdrop-filter: blur(4px);
  }
  .fav-card-heart:hover { transform: scale(1.15); }

  /* Card body */
  .fav-card-body { padding: 14px 14px 16px; flex: 1; }
  .fav-card-title {
    font-size: 15px; font-weight: 700; color: ${t.heading};
    margin: 0 0 8px; line-height: 1.35;
    display: -webkit-box; -webkit-line-clamp: 2;
    -webkit-box-orient: vertical; overflow: hidden;
  }
  @media (min-width: 1024px) {
    .fav-card-title { font-size: 17px; }
  }
  .fav-card-meta {
    display: flex; align-items: center; gap: 12px;
    color: ${t.muted}; font-size: 12px; margin-bottom: 6px;
  }
  .fav-card-meta-secondary {
    font-size: 11px; color: ${t.placeholder};
  }
  .fav-card-meta-item {
    display: inline-flex; align-items: center; gap: 4px;
  }
  .fav-card-tags { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 4px; }
  .fav-tag {
    display: inline-block; padding: 3px 10px; border-radius: 9999px;
    background: ${t.primaryTrack}; color: ${t.primaryDark};
    font-size: 11px; font-weight: 600; text-transform: capitalize;
  }

  /* ── Empty state ── */
  .fav-empty {
    display: flex; flex-direction: column; align-items: center;
    text-align: center; padding: 60px 24px 80px; gap: 12px;
  }
  .fav-empty-circle {
    width: 100px; height: 100px; border-radius: 50%;
    background: ${t.primaryTrack};
    display: flex; align-items: center; justify-content: center;
    margin-bottom: 8px;
  }
  .fav-empty-icon { color: ${t.primaryDark}; }
  .fav-empty-icon-search { color: ${t.placeholder}; }
  .fav-empty-title {
    font-size: 20px; font-weight: 700; color: ${t.heading}; margin: 0;
  }
  .fav-empty-sub {
    font-size: 15px; color: ${t.muted}; margin: 0;
    max-width: 320px; line-height: 1.5;
  }
  .fav-empty-actions {
    display: flex; gap: 12px; justify-content: center;
    margin-top: 12px; flex-wrap: wrap;
  }
  .fav-btn-primary {
    display: inline-flex; align-items: center; gap: 8px;
    background: ${t.primary}; color: ${t.heading};
    border: none; border-radius: 12px;
    padding: 12px 24px; font-size: 15px; font-weight: 700;
    cursor: pointer; text-decoration: none;
    font-family: 'Inter', sans-serif;
    box-shadow: 0 2px 8px ${t.primaryGlow};
    transition: transform 0.15s, box-shadow 0.15s;
  }
  .fav-btn-primary:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 16px ${t.primaryGlow};
  }
  .fav-btn-secondary {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 12px 24px; border-radius: 12px;
    border: 1.5px solid ${t.border}; background: ${t.white};
    color: ${t.label}; font-size: 15px; font-weight: 600;
    cursor: pointer; text-decoration: none;
    font-family: 'Inter', sans-serif;
    transition: background 0.15s, border-color 0.15s;
  }
  .fav-btn-secondary:hover {
    background: ${t.mutedBg}; border-color: ${t.primary};
    color: ${t.primaryDark};
  }

  @media (max-width: 480px) {
    .fav-grid { gap: 10px; }
    .fav-card { border-radius: 16px; }
    .fav-card-body { padding: 10px 12px 14px; }
    .fav-card-title { font-size: 14px; }
  }
`
