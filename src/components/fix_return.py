import re

with open('GridMap.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Find the return JSX and fix it
# The issue is invalid JSX after the canvas tag

# Let's find the return statement and rewrite it
return_match = re.search(r'return\s*\(\s*<div', content)
if return_match:
    start = return_match.start()
    # Find the closing );
    close_idx = content.find(');\n}', start)
    if close_idx > 0:
        # Extract the return JSX
        return_jsx = content[start:close_idx + 3]
        print("Found return JSX, length:", len(return_jsx))
        
        # Rewrite it with correct syntax
        new_return = '''return (
    <div className="flex flex-col items-center w-full" ref={containerRef}>
      <div className="relative rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 border-2 border-gray-200 dark:border-gray-700 map-container">
        <canvas
          ref={canvasRef}
          width={canvasSize.width * dpr}
          height={canvasSize.height * dpr}
          onClick={handleClick}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          style={{
            cursor: getCursorStyle(),
            backgroundColor: colors.bg,
            width: canvasSize.width,
            height: canvasSize.height,
            maxWidth: '100%',
            maxHeight: '100%',
            transition: 'transform 0.2s ease',
          }}
        />
      </div>
    </div>
  );'''

        content = content[:start] + new_return + content[close_idx + 3:]
        print("✅ Return JSX rewritten!")

with open('GridMap.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Done!")
