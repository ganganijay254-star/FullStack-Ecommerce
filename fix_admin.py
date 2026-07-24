with open('frontend/src/pages/AdminDashboard.jsx', 'r') as f:
    content = f.read()

# The StatCard has: icon div closes, then linkTo conditional, then outer div closes
# But the flex div from line 28 is never closed
# Find: "          {icon}\n        </div>\n      {linkTo && ("
# Replace with: "          {icon}\n        </div>\n      </div>\n      {linkTo && ("

old = '          {icon}\n        </div>\n      {linkTo && ('
new = '          {icon}\n        </div>\n      </div>\n      {linkTo && ('

if old in content:
    content = content.replace(old, new)
    with open('frontend/src/pages/AdminDashboard.jsx', 'w') as f:
        f.write(content)
    print('Fixed!')
else:
    print('Pattern not found')
    idx = content.find('{icon}')
    print(repr(content[idx-50:idx+100]))
