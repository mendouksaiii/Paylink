const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'app', 'page.tsx');
let content = fs.readFileSync(filePath, 'utf-8');

// 1. Imports
content = content.replace(
  "import { motion, useScroll, useTransform } from 'framer-motion';",
  "import { motion, useScroll, useTransform, useMotionValue } from 'framer-motion';\nimport { useRef } from 'react';"
);

// 2. Add TiltCard component definition right after STAGGER
const tiltCardCode = `
function TiltCard({ children, style, className }: { children: React.ReactNode, style?: React.CSSProperties, className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useTransform(y, [-100, 100], [10, -10]);
  const rotateY = useTransform(x, [-100, 100], [-10, 10]);

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = ref.current?.getBoundingClientRect();
    if (rect) {
      x.set(event.clientX - rect.left - rect.width / 2);
      y.set(event.clientY - rect.top - rect.height / 2);
    }
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={className}
      style={{
        ...style,
        perspective: 1000,
        transformStyle: 'preserve-3d',
      }}
      whileHover={{ scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
    >
      <motion.div style={{ rotateX, rotateY, transformStyle: 'preserve-3d', width: '100%', height: '100%' }}>
        <div style={{ transform: 'translateZ(30px)', height: '100%' }}>
          {children}
        </div>
      </motion.div>
    </motion.div>
  );
}
`;
content = content.replace(
  /const STAGGER = \{[\s\S]*?\};\n/,
  match => match + "\n" + tiltCardCode + "\n"
);

// 3. Replace How It Works cards with TiltCard
content = content.replace(
  /<motion\.div \n                variants=\{FADE_IN\} \n                whileHover=\{\{ y: -8, transition: \{ duration: 0\.2 \} \}\}\n                key=\{item\.step\} \n                style=\{\{ padding: '40px 32px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', background: 'rgba\(255,255,255,0\.04\)', border: '1px solid rgba\(255,255,255,0\.08\)', borderRadius: '24px', transition: 'all 0\.3s ease' \}\}\n              >/g,
  '<motion.div variants={FADE_IN} key={item.step} style={{ width: "100%" }}><TiltCard style={{ padding: "40px 32px", display: "flex", flexDirection: "column", alignItems: "flex-start", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "24px" }}>'
);

content = content.replace(
  /<\/motion\.div>\n            \)\)}/g,
  '</TiltCard></motion.div>\n            ))}'
);

// Replace the technical cards with TiltCard
content = content.replace(
  /<motion\.div variants=\{FADE_IN\} key=\{i\} style=\{\{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', background: 'rgba\(255,255,255,0\.04\)', border: '1px solid rgba\(255,255,255,0\.08\)', borderRadius: '16px' \}\}>/g,
  '<motion.div variants={FADE_IN} key={i} style={{ width: "100%" }}><TiltCard style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "16px" }}>'
);

content = content.replace(
  /<\/motion\.div>\n            \)\)}\n          <\/div>/g,
  '</TiltCard></motion.div>\n            ))}\n          </div>'
);

// Replace Who it's for cards
content = content.replace(
  /<motion\.div variants=\{FADE_IN\} key=\{i\} style=\{\{ display: 'flex', gap: '16px', alignItems: 'flex-start', background: 'rgba\(255,255,255,0\.04\)', border: '1px solid rgba\(255,255,255,0\.08\)', borderRadius: '20px', padding: '24px' \}\}>/g,
  '<motion.div variants={FADE_IN} key={i} style={{ width: "100%" }}><TiltCard style={{ display: "flex", gap: "16px", alignItems: "flex-start", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "20px", padding: "24px" }}>'
);

content = content.replace(
  /<\/motion\.div>\n            \)\)}\n          <\/div>\n        <\/motion\.section>/g,
  '</TiltCard></motion.div>\n            ))}\n          </div>\n        </motion.section>'
);

// 4. Color Replacements
content = content.replace(/#00C853/g, 'var(--accent)');
content = content.replace(/rgba\(0, 200, 83, 0\.1\)/g, 'var(--accent-glow)');
content = content.replace(/rgba\(0, 200, 83, 0\.2\)/g, 'var(--accent-glow-strong)');
content = content.replace(/#10b981/g, 'var(--success)');
content = content.replace(/#69F0AE/g, 'var(--accent-hover)');

// 5. Background gradient replacement
content = content.replace(
  /background: 'linear-gradient\(to bottom, rgba\(0,0,0,0\.45\) 0%, rgba\(0,0,0,0\.3\) 50%, rgba\(10,15,30,0\.95\) 85%, rgba\(10,15,30,1\) 100%\)',/g,
  "background: 'linear-gradient(to bottom, rgba(15,23,42,0.45) 0%, rgba(15,23,42,0.3) 50%, rgba(15,23,42,0.95) 85%, rgba(15,23,42,1) 100%)',"
);
content = content.replace(
  /background: 'linear-gradient\(to bottom, rgb\(10,15,30\), #0f172a\)',/g,
  "background: 'linear-gradient(to bottom, var(--bg-primary), var(--bg-secondary))',"
);

// 6. Font Family Additions to Headings
// Hero Title
content = content.replace(
  "fontSize: '3.75rem', color: 'white', textShadow: '0 2px 20px rgba(0,0,0,0.4)', letterSpacing: '-0.02em'",
  "fontSize: '3.75rem', color: 'white', textShadow: '0 2px 20px rgba(0,0,0,0.4)', letterSpacing: '-0.02em', fontFamily: 'var(--font-orbitron)'"
);
// General Headers
content = content.replace(
  /color: 'white', marginBottom: '16px'/g,
  "color: 'white', marginBottom: '16px', fontFamily: 'var(--font-orbitron)'"
);
content = content.replace(
  /fontSize: '1\.5rem', fontWeight: 700, color: 'white'/g,
  "fontSize: '1.5rem', fontWeight: 700, color: 'white', fontFamily: 'var(--font-orbitron)'"
);
content = content.replace(
  /marginBottom: '8px', color: 'white'/g,
  "marginBottom: '8px', color: 'white', fontFamily: 'var(--font-orbitron)'"
);

// 7. Add floating coin animation element to Hero (Replace SVG Logo)
const heroCoinCode = `
          <motion.div 
            animate={{ 
              y: [0, -20, 0],
              rotateY: [0, 180, 360],
              rotateX: [10, -10, 10]
            }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            style={{
              width: '120px', height: '120px', background: 'linear-gradient(135deg, var(--accent), #D97706)',
              borderRadius: '50%', margin: '0 auto 32px auto',
              boxShadow: '0 0 30px var(--accent-glow-strong), inset 0 0 20px rgba(255,255,255,0.5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--font-orbitron)', fontWeight: 900, fontSize: '2rem', color: 'var(--bg-primary)',
              transformStyle: 'preserve-3d'
            }}
          >
            USDC
          </motion.div>
`;
content = content.replace(
  /<motion\.div variants=\{FADE_IN\} style=\{\{ display: 'flex', justifyContent: 'center', marginBottom: '24px' \}\}>[\s\S]*?<\/motion\.div>/,
  heroCoinCode
);

fs.writeFileSync(filePath, content, 'utf-8');
console.log('Refactor complete.');
