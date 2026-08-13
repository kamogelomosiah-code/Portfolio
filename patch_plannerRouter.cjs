const fs = require('fs');
let code = fs.readFileSync('plannerRouter.ts', 'utf8');

const smartAddCode = `
router.post('/smart-add', async (req, res) => {
  try {
    const { prompt } = req.body;
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "Missing OpenRouter API key" });
    }

    const today = new Date().toISOString().split('T')[0];
    const systemPrompt = \`You are an intelligent calendar assistant. 
Today's date is \${today}. 
Extract the task description and the target date from the user's prompt.
Target date MUST be in YYYY-MM-DD format.
Return a strict JSON object with EXACTLY this structure:
{
  "date": "YYYY-MM-DD",
  "task": "Cleaned up task description"
}\`;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": \`Bearer \${apiKey}\`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: process.env.DEFAULT_MODEL || "meta-llama/llama-3.3-70b-instruct",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.1
      })
    });

    if (!response.ok) {
      throw new Error("OpenRouter API error");
    }

    const data = await response.json();
    let result;
    try {
      result = JSON.parse(data.choices[0].message.content);
    } catch(e) {
      // fallback regex if model ignores json_object
      const dateMatch = data.choices[0].message.content.match(/"date":\\s*"(\\d{4}-\\d{2}-\\d{2})"/);
      const taskMatch = data.choices[0].message.content.match(/"task":\\s*"([^"]+)"/);
      if (dateMatch && taskMatch) {
         result = { date: dateMatch[1], task: taskMatch[1] };
      } else {
         throw new Error("Failed to parse JSON response");
      }
    }

    if (!result.date || !result.task) {
       throw new Error("Incomplete JSON parsed");
    }

    // Now load existing notes, add it, and save.
    const NOTES_FILE_PATH = path.join(process.cwd(), 'planner_notes.json');
    let notes = {};
    if (fs.existsSync(NOTES_FILE_PATH)) {
      notes = JSON.parse(fs.readFileSync(NOTES_FILE_PATH, 'utf-8') || '{}');
    }

    if (!notes[result.date]) {
      notes[result.date] = [];
    }

    const newNote = {
      id: require('crypto').randomUUID(),
      text: result.task,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    notes[result.date].push(newNote);
    fs.writeFileSync(NOTES_FILE_PATH, JSON.stringify(notes, null, 2));

    res.json({ success: true, date: result.date, task: result.task, notes });
  } catch (error) {
    console.error("Smart Add Error:", error);
    res.status(500).json({ error: "Failed to smartly add todo" });
  }
});
`;

code = code.replace("export default router;", smartAddCode + "\nexport default router;");
fs.writeFileSync('plannerRouter.ts', code);
console.log("Patched plannerRouter.ts");
