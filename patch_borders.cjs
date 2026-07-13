const fs = require('fs');

function patchFile(file) {
  let content = fs.readFileSync(file, 'utf-8');

  // Input Box: change border border-outline-variant rounded-[32px] to border-t border-outline-variant rounded-none
  content = content.replace(
    /className="w-full bg-surface border border-outline-variant shadow-sm rounded-\[32px\] (.*?) flex flex-col(.*?)">/g,
    'className="w-full bg-surface border-t border-outline-variant flex flex-col$2">'
  );
  // User bubble: border -> border-0
  content = content.replace(
    /className="text-on-background px-4\.?5? py-3(\.5)? sm:px-5 sm:py-3\.5 rounded-\[20px\] rounded-tr-\[4px\] border shadow-sm"/g,
    'className="text-on-primary bg-primary px-4.5 py-3 sm:px-5 sm:py-3.5 rounded-[20px] rounded-tr-[4px] shadow-sm"'
  );
  content = content.replace(
    /className="text-on-background px-4 py-3 rounded-\[20px\] rounded-tr-\[4px\] border shadow-sm"/g,
    'className="text-on-primary bg-primary px-4 py-3 rounded-[20px] rounded-tr-[4px] shadow-sm"'
  );

  // Prompt suggestions cards
  content = content.replace(
    /border border-outline-variant hover:bg-surface-container-highest transition-all duration-200 active:scale-\[0\.98\] cursor-pointer text-left min-h-\[64px\] rounded-none shadow-sm/g,
    'bg-surface-container hover:bg-surface-container-highest transition-all duration-200 active:scale-[0.98] cursor-pointer text-left min-h-[64px] rounded-2xl'
  );
  content = content.replace(
    /border border-outline-variant hover:bg-surface-container-highest transition-all duration-200 active:scale-\[0\.98\] cursor-pointer text-left min-h-\[54px\] rounded-none shadow-sm/g,
    'bg-surface-container hover:bg-surface-container-highest transition-all duration-200 active:scale-[0.98] cursor-pointer text-left min-h-[54px] rounded-2xl'
  );

  // Active Clarifications
  content = content.replace(
    /bg-surface-container-low hover:bg-primary-container hover:text-primary border border-outline-variant(\/80)? hover:border-primary\/30 (transition-all )?rounded-none/g,
    'bg-surface-container-low hover:bg-primary-container hover:text-primary rounded-xl mb-1'
  );

  // View projects, check skills, download cv buttons
  content = content.replace(
    /bg-surface-container hover:bg-surface-container-highest text-on-surface hover:text-primary border border-outline-variant transition-all duration-150 cursor-pointer shadow-sm/g,
    'bg-surface-container hover:bg-surface-container-highest text-on-surface hover:text-primary transition-all duration-150 cursor-pointer rounded-full'
  );

  // Header bottom border is typically border-b border-outline-variant
  fs.writeFileSync(file, content);
}

patchFile('src/components/ChatInterface.tsx');
patchFile('src/components/MobileApp.tsx');
