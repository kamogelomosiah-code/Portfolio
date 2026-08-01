import sys

def main():
    with open('src/components/MobileApp.tsx', 'r') as f:
        lines = f.readlines()
        
    start_idx = -1
    end_idx = -1
    for i, line in enumerate(lines):
        if 'className="text-on-background px-4 py-3 rounded-2xl rounded-tr-sm border-2 shadow-sm"' in line:
            start_idx = i - 1 # Include the <div wrapping it
        if 'className="text-body-medium whitespace-pre-wrap font-normal leading-relaxed break-words"' in line and start_idx != -1:
            end_idx = i - 1
            break
            
    if start_idx != -1 and end_idx != -1:
        replacement = """                                <div 
                                  className="text-on-surface px-5 py-3 rounded-3xl rounded-tr-sm bg-surface-container-high max-w-xl shadow-sm"
                                >
"""
        new_lines = lines[:start_idx] + [replacement] + lines[end_idx+1:]
        with open('src/components/MobileApp.tsx', 'w') as f:
            f.writelines(new_lines)
        print("Success")
    else:
        print(f"Could not find boundaries: start_idx={start_idx}, end_idx={end_idx}")

if __name__ == "__main__":
    main()
