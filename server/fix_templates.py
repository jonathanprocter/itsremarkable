import re

# Read the file
with open('routes.ts', 'r') as f:
    content = f.read()

# Replace all template literals with string concatenation
# First, handle console.log statements
content = re.sub(r'console\.log\(\s*`([^`]*)`\s*\)', lambda m: 'console.log("' + re.sub(r'\$\{([^}]+)\}', r'" + \1 + "', m.group(1)) + '")', content)

# Handle template literals in assignments and other contexts
content = re.sub(r'`([^`]*)`', lambda m: '"' + re.sub(r'\$\{([^}]+)\}', r'" + \1 + "', m.group(1)) + '"', content)

# Clean up double quotes and concatenations
content = re.sub(r'" \+ "" \+ "', '" + "', content)
content = re.sub(r'""', '', content)
content = re.sub(r'" \+ \+ "', '" + "', content)

# Write back
with open('routes.ts', 'w') as f:
    f.write(content)

print("Fixed all template literals")
