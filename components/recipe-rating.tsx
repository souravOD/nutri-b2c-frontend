"use client";

import { useState, useEffect } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGetMyRating, apiRateRecipe } from "@/lib/api";
import type { RecipeRatingResponse } from "@/lib/types";

interface RecipeRatingProps {
  recipeId: string;
  compact?: boolean;
}

export function RecipeRating({ recipeId, compact = false }: RecipeRatingProps) {
  const qc = useQueryClient();
  const [hoverRating, setHoverRating] = useState(0);
  const [selectedRating, setSelectedRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [showFeedback, setShowFeedback] = useState(false);

  const { data, isLoading } = useQuery<RecipeRatingResponse>({
    queryKey: ["recipe-rating", recipeId],
    queryFn: () => apiGetMyRating(recipeId),
    staleTime: 60_000,
    enabled: !!recipeId,
  });

  useEffect(() => {
    if (data?.myRating) {
      setSelectedRating(data.myRating.rating);
      setFeedback(data.myRating.feedbackText || "");
    }
  }, [data?.myRating]);

  const rateMutation = useMutation({
    mutationFn: (rating: number) =>
      apiRateRecipe(recipeId, {
        rating,
        feedbackText: feedback.trim() || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["recipe-rating", recipeId] });
      setShowFeedback(false);
    },
  });

  const handleRate = (rating: number) => {
    setSelectedRating(rating);
    if (compact) {
      rateMutation.mutate(rating);
    } else {
      setShowFeedback(true);
    }
  };

  const handleSubmitFeedback = () => {
    rateMutation.mutate(selectedRating);
  };

  if (isLoading) return null;

  const displayRating = hoverRating || selectedRating;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className="flex gap-0.5">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              onClick={() => handleRate(star)}
              className="p-0.5 focus:outline-none"
              disabled={rateMutation.isPending}
            >
              <Star
                className={`h-5 w-5 transition-colors ${
                  star <= displayRating
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-muted-foreground/30"
                }`}
              />
            </button>
          ))}
        </div>

        {data?.averageRating != null && (
          <span className="text-xs text-muted-foreground">
            {data.averageRating} avg ({data.ratingCount})
          </span>
        )}
      </div>

      {showFeedback && !compact && (
        <div className="space-y-2">
          <Textarea
            placeholder="What did you think? (optional)"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            rows={2}
            className="text-sm"
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleSubmitFeedback}
              disabled={rateMutation.isPending}
            >
              Submit Rating
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowFeedback(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
