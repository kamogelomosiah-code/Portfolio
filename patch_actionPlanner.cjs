const fs = require('fs');
let code = fs.readFileSync('src/components/ActionPlanner/ActionPlanner.tsx', 'utf8');

// 1. Add state variables
code = code.replace(
  "const [editingText, setEditingText] = useState<string>('');",
  "const [editingText, setEditingText] = useState<string>('');\n  const [smartAddInput, setSmartAddInput] = useState<string>('');\n  const [isSmartAdding, setIsSmartAdding] = useState<boolean>(false);"
);

// 2. Add handleSmartAdd function
const handleSmartAddStr = `
  const handleSmartAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!smartAddInput.trim()) return;
    
    setIsSmartAdding(true);
    try {
      const res = await fetch('/api/planner/smart-add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: smartAddInput.trim() })
      });
      if (res.ok) {
        const data = await res.json();
        setNotes(data.notes || {});
        setSmartAddInput('');
        setSaveStatus('Smart task added!');
        setTimeout(() => setSaveStatus(null), 2500);
        
        if (data.date) {
            const parsedDate = parseISO(data.date);
            setSelectedDate(parsedDate);
            setCurrentMonth(parsedDate);
        }
      } else {
        setSaveStatus('Failed to smart add');
        setTimeout(() => setSaveStatus(null), 2500);
      }
    } catch (err) {
      console.error(err);
      setSaveStatus('Error in smart add');
      setTimeout(() => setSaveStatus(null), 2500);
    } finally {
      setIsSmartAdding(false);
    }
  };
`;

code = code.replace(
  "// Add note for selected date",
  handleSmartAddStr + "\n  // Add note for selected date"
);

// 3. Add UI above calendar header
const smartAddUI = `
          {/* Smart Add Bar */}
          <div className="bg-gradient-to-r from-primary-container/40 to-secondary-container/40 p-4 rounded-2xl border border-primary/20 shadow-sm flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <MaterialIcon name="auto_awesome" className="text-primary text-xl" />
              <h3 className="text-label-large font-bold text-on-surface">AI Smart Add</h3>
            </div>
            <form onSubmit={handleSmartAdd} className="flex gap-2 w-full">
              <input
                type="text"
                value={smartAddInput}
                onChange={e => setSmartAddInput(e.target.value)}
                placeholder="e.g., 'Remind me to call John next Tuesday'"
                disabled={isSmartAdding}
                className="flex-1 bg-surface border border-outline-variant rounded-xl px-4 py-2.5 text-body-medium focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={isSmartAdding || !smartAddInput.trim()}
                className="bg-primary text-on-primary px-4 py-2.5 rounded-xl text-label-large font-medium hover:bg-primary/90 transition-all shadow-sm disabled:opacity-50 flex items-center justify-center min-w-[80px]"
              >
                {isSmartAdding ? (
                  <div className="w-5 h-5 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin"></div>
                ) : (
                  "Add"
                )}
              </button>
            </form>
          </div>
`;

code = code.replace(
  "{/* Calendar Header / Controls */}",
  smartAddUI + "\n          {/* Calendar Header / Controls */}"
);

fs.writeFileSync('src/components/ActionPlanner/ActionPlanner.tsx', code);
console.log("Patched ActionPlanner.tsx");
