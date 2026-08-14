const fs = require('fs');
let code = fs.readFileSync('src/components/ActionPlanner/ActionPlanner.tsx', 'utf8');

const buttonOpeners = [
  'onClick={onToggleDrawer}', // lines 234-239
  'onClick={handleToday}', // lines 257-262
  'onClick={onBackToChat}', // lines 264-271
  'onClick={handlePrevMonth}', // lines 301-305
  'onClick={handleNextMonth}', // lines 308-312
  'onClick={() => setSelectedDate(day)}', // lines 353-402
  'type="submit"', // line 437
  'onClick={() => setEditingNoteId(note.id)}', // 480-485
  'onClick={() => handleDeleteNote(note.id)}', // 487-492
  'onClick={handleAddNote}', // 510-515
  'onClick={() => setIsAdding(false)}'
];

// Wait, I can just use a proper find-and-replace using a stack!
let tokens = code.split(/(<button[\s\S]*?>|<\/div>)/g);
// This split is tricky.
