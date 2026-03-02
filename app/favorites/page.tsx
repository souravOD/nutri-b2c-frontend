"use client"

import { useEffect } from "react"
import { useFavorites } from "@/hooks/use-favorites"
import { Heart, BookOpen, Search, Clock, Users as UsersIcon, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function FavoritesPage() {
  const { savedRecipes, toggleFavorite, isFavorite, loadSavedRecipes } = useFavorites()
  const router = useRouter()

  useEffect(() => {
    loadSavedRecipes()
  }, [loadSavedRecipes])

  return (
    <div className="favorites-page">
      {/* Header */}
      <div className="fav-header">
        <button className="fav-back-btn" onClick={() => router.back()}>
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1>Saved Recipes</h1>
          <p className="fav-subtitle">
            {savedRecipes.length > 0
              ? `${savedRecipes.length} recipe${savedRecipes.length !== 1 ? "s" : ""} saved`
              : "Your favorite recipes in one place"}
          </p>
        </div>
      </div>

      {savedRecipes.length === 0 ? (
        <div className="fav-empty">
          <div className="fav-empty-icon">
            <Heart size={40} strokeWidth={1.5} color="#CCC" />
          </div>
          <h2>No saved recipes yet</h2>
          <p>
            Start exploring recipes and save your favorites by clicking the
            heart icon on any recipe card.
          </p>
          <div className="fav-empty-actions">
            <Link href="/" className="fav-btn-primary">
              <BookOpen size={16} /> Browse Recipes
            </Link>
            <Link href="/search" className="fav-btn-secondary">
              <Search size={16} /> Search Recipes
            </Link>
          </div>
        </div>
      ) : (
        <div className="fav-grid">
          {savedRecipes.map((recipe) => (
            <Link key={recipe.id} href={`/recipes/${recipe.id}`} className="fav-card">
              <div className="fav-card-img-wrap">
                <img
                  src={recipe.imageUrl || "/placeholder-recipe.jpg"}
                  alt={recipe.title}
                  className="fav-card-img"
                />
                <button
                  className="fav-card-heart"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    toggleFavorite(recipe.id)
                  }}
                >
                  <Heart
                    size={16}
                    fill={isFavorite(recipe.id) ? "#E74C3C" : "none"}
                    color={isFavorite(recipe.id) ? "#E74C3C" : "#999"}
                  />
                </button>
              </div>
              <div className="fav-card-body">
                <h3 className="fav-card-title">{recipe.title}</h3>
                <div className="fav-card-meta">
                  {recipe.prepTime != null && (
                    <span><Clock size={12} /> {(recipe.prepTime || 0) + (recipe.cookTime || 0)} min</span>
                  )}
                  {recipe.servings != null && (
                    <span><UsersIcon size={12} /> {recipe.servings} serv</span>
                  )}
                </div>
                {recipe.tags && recipe.tags.length > 0 && (
                  <div className="fav-card-tags">
                    {recipe.tags.slice(0, 3).map((tag) => (
                      <span key={tag} className="fav-tag">{tag}</span>
                    ))}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      <style jsx>{`
        .favorites-page {
          max-width: 780px;
          margin: 0 auto;
          padding: 0 16px 100px;
          font-family: Inter, system-ui, sans-serif;
        }
        .favorites-page a {
          text-decoration: none;
          color: inherit;
        }
        .fav-header {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 20px 0 20px;
        }
        .fav-back-btn {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          border: 1px solid #E0E0E0;
          background: white;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: #333;
          flex-shrink: 0;
          transition: background 0.2s;
        }
        .fav-back-btn:hover {
          background: #F5F5F5;
        }
        @media (min-width: 1024px) {
          .fav-back-btn { display: none; }
        }
        .fav-header h1 {
          margin: 0;
          font-size: 26px;
          font-weight: 700;
          color: #1A1A2E;
        }
        .fav-subtitle {
          margin: 4px 0 0;
          font-size: 14px;
          color: #64748B;
        }

        /* Empty State */
        .fav-empty {
          text-align: center;
          padding: 60px 20px;
          background: white;
          border-radius: 20px;
          border: 1px solid #F0F0F0;
          box-shadow: 0 1px 3px rgba(0,0,0,0.04);
        }
        .fav-empty-icon {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: #F8F8F8;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 20px;
        }
        .fav-empty h2 {
          margin: 0 0 8px;
          font-size: 18px;
          font-weight: 600;
          color: #333;
        }
        .fav-empty p {
          margin: 0 0 24px;
          font-size: 14px;
          color: #999;
          max-width: 340px;
          margin-left: auto;
          margin-right: auto;
        }
        .fav-empty-actions {
          display: flex;
          gap: 12px;
          justify-content: center;
        }
        .fav-btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 10px 20px;
          border-radius: 12px;
          background: linear-gradient(135deg, #99CC33, #7AB820);
          color: white !important;
          font-size: 14px;
          font-weight: 600;
          transition: all 0.2s;
        }
        .fav-btn-primary:hover {
          background: linear-gradient(135deg, #88BB22, #6BA710);
          box-shadow: 0 2px 8px rgba(153,204,51,0.3);
        }
        .fav-btn-secondary {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 10px 20px;
          border-radius: 12px;
          border: 1.5px solid #E0E0E0;
          color: #666 !important;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.2s;
        }
        .fav-btn-secondary:hover {
          border-color: #CCC;
          background: #F8F8F8;
        }

        /* Recipe Grid */
        .fav-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 16px;
        }
        .fav-card {
          background: white;
          border-radius: 16px;
          overflow: hidden;
          border: 1px solid #F0F0F0;
          box-shadow: 0 1px 3px rgba(0,0,0,0.04);
          transition: box-shadow 0.2s, transform 0.2s;
          display: block;
        }
        .fav-card:hover {
          box-shadow: 0 4px 16px rgba(0,0,0,0.08);
          transform: translateY(-2px);
        }
        .fav-card-img-wrap {
          position: relative;
          width: 100%;
          aspect-ratio: 3 / 2;
        }
        .fav-card-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .fav-card-heart {
          position: absolute;
          top: 10px;
          right: 10px;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: rgba(255,255,255,0.9);
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: transform 0.2s;
        }
        .fav-card-heart:hover {
          transform: scale(1.15);
        }
        .fav-card-body {
          padding: 12px 14px 14px;
        }
        .fav-card-title {
          margin: 0 0 6px;
          font-size: 14px;
          font-weight: 600;
          color: #1A1A2E;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          line-height: 1.4;
        }
        .fav-card-meta {
          display: flex;
          gap: 12px;
          font-size: 12px;
          color: #999;
          margin-bottom: 8px;
        }
        .fav-card-meta span {
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .fav-card-tags {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }
        .fav-tag {
          font-size: 11px;
          padding: 2px 8px;
          border-radius: 6px;
          background: #F0F9E8;
          color: #538100;
          font-weight: 500;
        }

        @media (max-width: 480px) {
          .fav-grid {
            grid-template-columns: 1fr 1fr;
            gap: 10px;
          }
          .fav-header h1 {
            font-size: 22px;
          }
        }
      `}</style>
    </div>
  )
}
