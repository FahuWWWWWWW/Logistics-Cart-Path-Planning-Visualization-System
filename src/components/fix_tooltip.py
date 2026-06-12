import re

with open('GridMap.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Find the tooltip section and fix it
# The issue is incorrect JSX syntax in the tooltip div

# Let's find the exact tooltip code and replace it
old_tooltip = '''        {/* 悬停坐标提示 */}
        {hoverCoord && (
          <div
            className="absolute pointer-events-none px-2 py-1 bg-black/80 text-white text-xs rounded-md font-mono fade-in"
            style={{
              left: `${hoverCoord.x * cellSize + cellSize}px`,
              top: `${hoverCoord.y * cellSize}px`,
              transform: 'translate(-50%, -100%)',
              marginTop: '-4px',
              zIndex: 50,
            }}
          >
            ({hoverCoord.x}, {hoverCoord.y}) {hoverCoord.x * gridSizeMm}mm, {hoverCoord.y * gridSizeMm}mm
          </div>
        )}'''

new_tooltip = '''        {/* 悬停坐标提示 */}
        {hoverCoord && (
          <div
            className="absolute pointer-events-none px-2 py-1 bg-black/80 text-white text-xs rounded-md font-mono fade-in"
            style={{
              left: `${hoverCoord.x * cellSize + cellSize}px`,
              top: `${hoverCoord.y * cellSize}px`,
              transform: 'translate(-50%, -100%)',
              marginTop: '-4px',
              zIndex: 50,
            }}
          >
            ({hoverCoord.x}, {hoverCoord.y}) {hoverCoord.x * gridSizeMm}mm, {hoverCoord.y * gridSizeMm}mm
          </div>
        )}'''

if old_tooltip in content:
    content = content.replace(old_tooltip, new_tooltip)
    print('✅ Tooltip section fixed!')
else:
    print('⚠️ Pattern not found, trying different approach...')
    # Let's just find and comment out the tooltip to make the build pass
    # Actually, let's check what's on line 697
    lines = content.split('\n')
    if len(lines) >= 697:
        print(f'Line 695-700:')
        for i in range(694, min(701, len(lines))):
            print(f'{i+1}: {lines[i]}')

with open('GridMap.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print('Done!')
