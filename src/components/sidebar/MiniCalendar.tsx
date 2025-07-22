import { getDaysInMonth, getMonthName, isToday, isInCurrentWeek } from '../../utils/dateUtils';
import { cn } from '@/lib/utils';

interface MiniCalendarProps {
  currentDate: Date;
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
}

export const MiniCalendar = ({ currentDate, selectedDate, onDateSelect }: MiniCalendarProps) => {
  const monthName = getMonthName(currentDate);
  const days = getDaysInMonth(currentDate);
  const dayHeaders = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  return (
    <div className="sidebar-section">
      <h3 className="text-lg font-semibold mb-4 text-gray-900">{monthName}</h3>
      
      <div className="grid grid-cols-7 gap-1 text-xs text-gray-600 mb-2">
        {dayHeaders.map((day, index) => (
          <div key={index} className="text-center font-medium">{day}</div>
        ))}
      </div>
      
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, index) => {
          const isCurrentMonth = day.getMonth() === currentDate.getMonth();
          const isTodayDate = isToday(day);
          const isInWeek = isInCurrentWeek(day, currentDate);
          
          return (
            <div
              key={index}
              className={cn(
                "calendar-day",
                !isCurrentMonth && "text-gray-400",
                isTodayDate && "today",
                isInWeek && "current-week"
              )}
              onClick={() => onDateSelect(day)}
            >
              {day.getDate()}
            </div>
          );
        })}
      </div>
    </div>
  );
};
