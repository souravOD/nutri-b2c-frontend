"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface MonthlyCalendarProps {
    selectedDate: Date;
    onSelectDate: (date: Date) => void;
    mealStatusByDate?: Map<string, "complete" | "partial" | "empty">;
}

function toDateStr(d: Date) {
    return d.toISOString().slice(0, 10);
}

function getDaysInMonth(year: number, month: number) {
    return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
    return new Date(year, month, 1).getDay(); // 0=Sun
}

const DOT_COLORS: Record<string, string> = {
    complete: "bg-[#9C3]",
    partial: "bg-yellow-400",
    empty: "",
};

export function MonthlyCalendar({ selectedDate, onSelectDate, mealStatusByDate }: MonthlyCalendarProps) {
    const [viewYear, setViewYear] = useState(selectedDate.getFullYear());
    const [viewMonth, setViewMonth] = useState(selectedDate.getMonth());

    const daysInMonth = getDaysInMonth(viewYear, viewMonth);
    const firstDay = getFirstDayOfMonth(viewYear, viewMonth);

    // Previous month trailing days
    const prevMonthDays = getDaysInMonth(viewYear, viewMonth - 1);

    const monthLabel = new Date(viewYear, viewMonth).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
    });

    const goToPrevMonth = () => {
        if (viewMonth === 0) {
            setViewYear(viewYear - 1);
            setViewMonth(11);
        } else {
            setViewMonth(viewMonth - 1);
        }
    };

    const goToNextMonth = () => {
        if (viewMonth === 11) {
            setViewYear(viewYear + 1);
            setViewMonth(0);
        } else {
            setViewMonth(viewMonth + 1);
        }
    };

    const today = new Date();
    const todayStr = toDateStr(today);
    const selectedStr = toDateStr(selectedDate);

    // Build calendar grid
    const cells: Array<{ day: number; isCurrentMonth: boolean; dateStr: string }> = [];

    // Previous month days
    for (let i = firstDay - 1; i >= 0; i--) {
        const d = prevMonthDays - i;
        const dt = new Date(viewYear, viewMonth - 1, d);
        cells.push({ day: d, isCurrentMonth: false, dateStr: toDateStr(dt) });
    }
    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
        const dt = new Date(viewYear, viewMonth, d);
        cells.push({ day: d, isCurrentMonth: true, dateStr: toDateStr(dt) });
    }
    // Next month days (fill to 42 or at least complete the row)
    const remaining = cells.length % 7 === 0 ? 0 : 7 - (cells.length % 7);
    for (let d = 1; d <= remaining; d++) {
        const dt = new Date(viewYear, viewMonth + 1, d);
        cells.push({ day: d, isCurrentMonth: false, dateStr: toDateStr(dt) });
    }

    return (
        <div className="flex flex-col gap-4">
            {/* Month Navigation */}
            <div className="flex items-center justify-between px-2">
                <button onClick={goToPrevMonth} className="p-2 rounded-full hover:bg-slate-100">
                    <ChevronLeft className="w-5 h-5 text-slate-600" />
                </button>
                <h3 className="text-lg font-bold text-slate-900">{monthLabel}</h3>
                <button onClick={goToNextMonth} className="p-2 rounded-full hover:bg-slate-100">
                    <ChevronRight className="w-5 h-5 text-slate-600" />
                </button>
            </div>

            {/* Day Headers */}
            <div className="grid grid-cols-7 gap-1 text-center">
                {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map((d) => (
                    <div key={d} className="text-xs font-bold text-[#94A3B8] py-1 uppercase tracking-[0.6px]">
                        {d.slice(0, 3)}
                    </div>
                ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
                {cells.map((cell, idx) => {
                    const isSelected = cell.dateStr === selectedStr;
                    const isToday = cell.dateStr === todayStr;
                    const status = mealStatusByDate?.get(cell.dateStr);
                    const dotColor = status ? DOT_COLORS[status] : "";

                    return (
                        <button
                            key={idx}
                            onClick={() => {
                                const dt = new Date(cell.dateStr + "T00:00:00");
                                onSelectDate(dt);
                            }}
                            className={`
                flex flex-col items-center justify-center py-2 rounded-full relative transition-colors
                ${!cell.isCurrentMonth ? "text-[#CBD5E1]" : "text-[#0F172A]"}
                ${isSelected ? "bg-[#9C3] text-white shadow-[0px_10px_15px_-3px_rgba(153,204,51,0.3),0px_4px_6px_-4px_rgba(153,204,51,0.3)]" : ""}
                ${isToday && !isSelected ? "font-bold" : "font-medium"}
                hover:bg-slate-100
                ${isSelected ? "hover:bg-[#9C3]" : ""}
              `}
                            style={{ fontFamily: "Inter, sans-serif", fontSize: 14 }}
                        >
                            <span>{cell.day}</span>
                            {dotColor && (
                                <span className={`absolute bottom-0.5 w-2 h-2 rounded-full ${dotColor} ${isSelected ? "bg-white w-1 h-1" : ""}`} />
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
