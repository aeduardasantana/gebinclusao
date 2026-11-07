from pathlib import Path
root=Path(".")
tag='<script defer src="/assets/ga4-consent.js?v=20261107"></script>'
count=0
for page in root.rglob("*.html"):
    if page.name=="404.html" or any(part in (".git",".github","node_modules") for part in page.parts): continue
    body=page.read_text(encoding="utf-8")
    if "</head>" not in body or "ga4-consent.js" in body: continue
    if "googletagmanager.com/gtag/js?id=" in body or "googletagmanager.com/gtm.js" in body: continue
    page.write_text(body.replace("</head>",tag+"</head>",1),encoding="utf-8")
    count+=1
print(f"GA4 consent script injected into {count} pages")
