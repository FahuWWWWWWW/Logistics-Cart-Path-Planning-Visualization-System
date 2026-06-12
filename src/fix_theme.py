import re
import os

def fix_border(text, num, light_num):
    """Replace border-gray-N (not dark: prefixed) with border-gray-lightN dark:border-gray-N"""
    result = ''
    i = 0
    target = f'border-gray-{num}'
    dark_prefix = 'dark:'
    while i < len(text):
        pos = text.find(target, i)
        if pos == -1:
            result += text[i:]
            break
        # Check if preceded by dark:
        pre_start = max(0, pos - len(dark_prefix))
        if text[pre_start:pos] == dark_prefix:
            result += text[i:pos + len(target)]
            i = pos + len(target)
        else:
            result += text[i:pos] + f'border-gray-{light_num} dark:{target}'
            i = pos + len(target)
    return result


def fix_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    original = content

    # 1. Fix border colors
    content = fix_border(content, 700, 200)
    content = fix_border(content, 600, 300)

    # 2. Remove duplicate dark: classes
    content = re.sub(r'(dark:bg-gray-\d+)\s+dark:bg-gray-\d+\b', r'\g<1>', content)
    content = re.sub(r'(dark:text-gray-\d+)\s+dark:text-gray-\d+\b', r'\g<1>', content)
    content = re.sub(r'(dark:hover:bg-gray-\d+)\s+dark:hover:bg-gray-\d+\b', r'\g<1>', content)
    content = re.sub(r'(dark:border-gray-\d+)\s+dark:border-gray-\d+\b', r'\g<1>', content)
    # Also remove duplicate non-dark versions
    content = re.sub(r'(bg-gray-\d+)\s+bg-gray-\d+\b(?!\s*dark)', r'\g<1>', content)

    # 3. Fix LogPanel hardcoded dark areas
    content = content.replace(
        'className="h-64 overflow-y-auto bg-gray-900 rounded-lg p-2 font-mono text-xs"',
        'className="h-64 overflow-y-auto bg-gray-100 dark:bg-gray-900 rounded-lg p-2 font-mono text-xs"'
    )
    content = content.replace(
        'className="flex-1 overflow-y-auto bg-gray-900 rounded-lg p-2 font-mono text-xs"',
        'className="flex-1 overflow-y-auto bg-gray-100 dark:bg-gray-900 rounded-lg p-2 font-mono text-xs"'
    )

    # 4. Fix ProtocolPanel code block
    content = content.replace(
        '<pre className="p-2 bg-gray-900 rounded text-xs text-green-300',
        '<pre className="p-2 bg-gray-900 dark:bg-gray-950 rounded text-xs text-green-700 dark:text-green-300'
    )

    # 5. Fix SerialPanel active tab: bg-gray-800 text-white (correct for dark, need light version)
    content = content.replace(
        "? 'bg-gray-800 dark:bg-gray-900 text-gray-800 dark:text-gray-200 shadow-sm'",
        "? 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 shadow-sm'"
    )

    # 6. Fix SerialPanel select input
    content = content.replace(
        'className="w-full px-2 py-1.5 rounded text-xs bg-gray-800 dark:bg-gray-900 border border-gray-200 dark:border-gray-700',
        'className="w-full px-2 py-1.5 rounded text-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
    )

    # 7. Fix VideoPanel dark hardcodes
    content = content.replace(
        '<div className="px-4 py-2 bg-gray-800 border-b border-gray-700">',
        '<div className="px-4 py-2 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">'
    )
    content = content.replace(
        'className="w-full px-3 py-1.5 bg-gray-700 text-gray-200 rounded-lg text-sm border border-gray-600',
        'className="w-full px-3 py-1.5 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg text-sm border border-gray-300 dark:border-gray-600'
    )
    content = content.replace(
        '<div className="relative bg-black flex-1"',
        '<div className="relative bg-gray-900 dark:bg-black flex-1"'
    )
    content = content.replace(
        '<div className="flex gap-2 p-3 bg-gray-800 border-t border-gray-700 flex-shrink-0">',
        '<div className="flex gap-2 p-3 bg-gray-100 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">'
    )

    # 8. Fix App.tsx bottom log button border
    content = content.replace(
        'border border-gray-200 dark:border-gray-700',
        'border border-gray-200 dark:border-gray-700'
    )
    content = content.replace(
        'hover:bg-gray-50 dark:hover:bg-gray-900 dark:bg-gray-900 dark:hover:bg-gray-800/50',
        'hover:bg-gray-50 dark:hover:bg-gray-800/50'
    )

    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    return False


files = [
    'App.tsx',
    'components/ControlPanel.tsx',
    'components/SerialPanel.tsx',
    'components/ProtocolPanel.tsx',
    'components/LogPanel.tsx',
    'components/VideoPanel.tsx',
    'components/FloatingPanel.tsx',
]

for f in files:
    if os.path.exists(f):
        changed = fix_file(f)
        print(('✓ changed' if changed else '  no change') + ': ' + f)

print('\nDone!')
