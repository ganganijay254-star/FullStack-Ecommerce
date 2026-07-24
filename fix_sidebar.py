with open('frontend/src/components/Sidebar.jsx', 'r') as f:
    c = f.read()

old = '          <div className="flex-1 min-w-0">\n            <p className="text-sm font-semibold text-slate-800 truncate">{user?.full_name}</p>\n            <p className="text-xs text-slate-400 capitalize">{role}</p>\n          </div>\n      </div>\n      <nav'
new = '          <div className="flex-1 min-w-0">\n            <p className="text-sm font-semibold text-slate-800 truncate">{user?.full_name}</p>\n            <p className="text-xs text-slate-400 capitalize">{role}</p>\n          </div>\n        </div>\n      </div>\n      <nav'

if old in c:
    c = c.replace(old, new)
    with open('frontend/src/components/Sidebar.jsx', 'w') as f:
        f.write(c)
    print('Fixed!')
else:
    print('Pattern not found')
    # Debug: show the relevant section
    idx = c.find('<nav className=')
    print(repr(c[idx-200:idx]))
