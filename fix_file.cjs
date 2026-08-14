const fs = require('fs');
let code = fs.readFileSync('src/components/ActionPlanner/ActionPlanner.tsx', 'utf8');

// The easiest way is to use a regex to replace </div> with </button> if it follows a specific pattern, 
// but even easier is to just reset to the version from git... but no git!

// Let's replace manually by searching for the strings before it:
code = code.replace('<MaterialIcon name="menu" className="text-xl" />\n            </div>', '<MaterialIcon name="menu" className="text-xl" />\n            </button>');
code = code.replace('Today\n          </div>', 'Today\n          </button>');
code = code.replace('<MaterialIcon name="chat" className="text-xl" />\n            </div>', '<MaterialIcon name="chat" className="text-xl" />\n            </button>');
code = code.replace('className="p-2 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors"\n              >\n                <MaterialIcon name="chevron_left" className="text-xl" />\n              </div>', 'className="p-2 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors"\n              >\n                <MaterialIcon name="chevron_left" className="text-xl" />\n              </button>');
code = code.replace('className="p-2 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors"\n              >\n                <MaterialIcon name="chevron_right" className="text-xl" />\n              </div>', 'className="p-2 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors"\n              >\n                <MaterialIcon name="chevron_right" className="text-xl" />\n              </button>');

// Wait, doing this might be error-prone due to spacing.
// Let's just fix it properly by parsing it.

let lines = code.split('\n');
for (let i = 0; i < lines.length; i++) {
   if (lines[i].includes('            </div>          )}')) lines[i] = lines[i].replace('</div>', '</button>');
   if (lines[i].includes('            Today          </div>')) lines[i] = lines[i].replace('</div>', '</button>');
}
