import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface DailyNotesProps {
  notes: string;
  onSaveNotes: (notes: string) => void;
}

export const DailyNotes = ({ notes, onSaveNotes }: DailyNotesProps) => {
  const [currentNotes, setCurrentNotes] = useState(notes);

  const handleSave = () => {
    onSaveNotes(currentNotes);
  };

  return (
    <div className="sidebar-section">
      <h3 className="text-sm font-semibold mb-3 text-gray-900">Daily Notes</h3>
      <Textarea
        value={currentNotes}
        onChange={(e) => setCurrentNotes(e.target.value)}
        placeholder="Daily reflections, goals, and notes..."
        className="w-full h-20 resize-none"
      />
      <Button 
        onClick={handleSave}
        className="w-full mt-2 bg-blue-600 hover:bg-blue-700"
        size="sm"
      >
        Save Notes
      </Button>
    </div>
  );
};
