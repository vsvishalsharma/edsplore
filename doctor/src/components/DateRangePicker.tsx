import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
  onSelect: (start: string, end: string) => void;
  onClose: () => void;
  startDate?: string;
  endDate?: string;
}

export default function DateRangePicker({ onSelect, onClose, startDate, endDate }: Props) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedRange, setSelectedRange] = useState({
    start: startDate ? new Date(startDate) : null,
    end: endDate ? new Date(endDate) : null
  });

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const handleDateClick = (date: Date) => {
    if (!selectedRange.start || (selectedRange.start && selectedRange.end)) {
      setSelectedRange({ start: date, end: null });
    } else {
      if (date < selectedRange.start) {
        setSelectedRange({ start: date, end: selectedRange.start });
      } else {
        setSelectedRange({ start: selectedRange.start, end: date });
      }
    }
  };

  const handleApply = () => {
    if (selectedRange.start && selectedRange.end) {
      onSelect(
        selectedRange.start.toISOString().split('T')[0],
        selectedRange.end.toISOString().split('T')[0]
      );
    }
  };

  const isDateInRange = (date: Date) => {
    if (!selectedRange.start || !selectedRange.end) return false;
    return date >= selectedRange.start && date <= selectedRange.end;
  };

  const isDateSelected = (date: Date) => {
    return (
      selectedRange.start?.toDateString() === date.toDateString() ||
      selectedRange.end?.toDateString() === date.toDateString()
    );
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-8" />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      days.push(
        <button
          key={day}
          onClick={() => handleDateClick(date)}
          className={`h-8 w-8 rounded-full flex items-center justify-center text-sm
            ${isDateSelected(date) ? 'bg-blue-600 text-white' : ''}
            ${isDateInRange(date) && !isDateSelected(date) ? 'bg-blue-100' : ''}
            hover:bg-blue-50`}
        >
          {day}
        </button>
      );
    }

    return days;
  };

  return (
    <div className="absolute top-full mt-2 bg-white rounded-lg shadow-lg z-50 p-4">
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))}
          className="p-1 hover:bg-gray-100 rounded-full"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="font-medium">
          {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
        </span>
        <button
          onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))}
          className="p-1 hover:bg-gray-100 rounded-full"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
          <div key={day} className="h-8 flex items-center justify-center text-xs text-gray-500">
            {day}
          </div>
        ))}
        {renderCalendar()}
      </div>
      <div className="flex justify-end space-x-2 mt-4">
        <button
          onClick={onClose}
          className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded"
        >
          Cancel
        </button>
        <button
          onClick={handleApply}
          disabled={!selectedRange.start || !selectedRange.end}
          className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          Apply
        </button>
      </div>
    </div>
  );
}