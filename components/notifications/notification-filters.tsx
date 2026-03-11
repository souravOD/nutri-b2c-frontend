"use client";

interface NotificationFiltersProps {
    activeFilter: string;
    onFilterChange: (filter: string) => void;
}

const FILTERS = [
    { key: "", label: "All" },
    { key: "meal", label: "Meals" },
    { key: "nutrition", label: "Nutrition" },
    { key: "grocery", label: "Grocery" },
    { key: "budget", label: "Budget" },
    { key: "family", label: "Family" },
    { key: "system", label: "System" },
];

export function NotificationFilters({
    activeFilter,
    onFilterChange,
}: NotificationFiltersProps) {
    return (
        <div className="notification-filters">
            {FILTERS.map((f) => (
                <button
                    key={f.key}
                    className={`filter-chip ${activeFilter === f.key ? "active" : ""}`}
                    onClick={() => onFilterChange(f.key)}
                >
                    {f.label}
                </button>
            ))}

            <style jsx>{`
        .notification-filters {
          display: flex;
          gap: 8px;
          overflow-x: auto;
          padding: 4px 0;
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .notification-filters::-webkit-scrollbar {
          display: none;
        }
        .filter-chip {
          flex-shrink: 0;
          padding: 8px 16px;
          border-radius: 20px;
          border: 1px solid #E0E0E0;
          background: white;
          color: #666;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          font-family: inherit;
        }
        .filter-chip:hover {
          border-color: #99CC33;
          color: #99CC33;
        }
        .filter-chip.active {
          background: #99CC33;
          border-color: #99CC33;
          color: white;
        }
      `}</style>
        </div>
    );
}
