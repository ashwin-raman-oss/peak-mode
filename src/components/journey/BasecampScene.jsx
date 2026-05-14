// Layered SVG illustration for the Basecamp chapter.
// Renders safely with journey === null (defaults to day 0, no deterioration).
export default function BasecampScene({ sceneDay = 0, deteriorationLevel = 0 }) {
  const fireActive = deteriorationLevel === 0
  const desat = deteriorationLevel === 3

  const skyTop = desat ? '#0d1b2a' : '#1a365d'
  const skyBot = desat ? '#1a2a3a' : '#2b6cb0'

  const tentTransform = deteriorationLevel === 2 ? 'skewX(8)' : undefined
  const collapsed = deteriorationLevel === 3

  return (
    <svg
      viewBox="0 0 600 400"
      className="w-full"
      style={desat ? { filter: 'grayscale(60%)' } : undefined}
      aria-label="Basecamp journey scene"
    >
      <defs>
        <linearGradient id="bcSkyGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={skyTop} />
          <stop offset="100%" stopColor={skyBot} />
        </linearGradient>
        <style>{`
          @keyframes bcFlicker {
            0%   { opacity: 0.9; transform: scaleY(1)   scaleX(1); }
            50%  { opacity: 1;   transform: scaleY(1.1) scaleX(0.9); }
            100% { opacity: 0.8; transform: scaleY(0.95) scaleX(1.05); }
          }
          @keyframes bcFlicker2 {
            0%   { opacity: 0.7; transform: scaleY(0.9); }
            60%  { opacity: 1;   transform: scaleY(1.15); }
            100% { opacity: 0.6; transform: scaleY(1); }
          }
          @keyframes bcTwinkle {
            0%, 100% { opacity: 0.9; r: 2.5; }
            50%       { opacity: 0.3; r: 1.5; }
          }
          @keyframes bcGlow {
            0%, 100% { opacity: 0.15; }
            50%       { opacity: 0.28; }
          }
          @keyframes bcSpark {
            0%   { opacity: 1;   transform: translate(0, 0) scale(1); }
            100% { opacity: 0;   transform: translate(var(--tx), var(--ty)) scale(0.3); }
          }
          .bc-fire      { transform-origin: 268px 302px; }
          .bc-fire-anim { animation: bcFlicker  0.35s ease-in-out infinite alternate; }
          .bc-fire2-anim{ animation: bcFlicker2 0.45s ease-in-out infinite alternate; }
          .bc-star      { animation: bcTwinkle 2.5s ease-in-out infinite; }
          .bc-star-2    { animation: bcTwinkle 3.1s ease-in-out infinite 0.4s; }
          .bc-star-3    { animation: bcTwinkle 2.0s ease-in-out infinite 1.1s; }
          .bc-glow      { animation: bcGlow    2.5s ease-in-out infinite; }
        `}</style>
        {/* Summit glow (layer 8) */}
        <radialGradient id="bcTentGlow1" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#F6AD55" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#F6AD55" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="bcTentGlow2" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#F6AD55" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#F6AD55" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* ── LAYER 0: Sky + mountains + ground + stars + moon ─────────────── */}
      <rect width="600" height="400" fill="url(#bcSkyGrad)" />

      {/* Large mountain (center) */}
      <polygon points="290,45 530,285 50,285" fill="#4A5568" />
      {/* Snow cap */}
      <polygon points="290,45 320,110 260,110" fill="#E2E8F0" opacity="0.7" />
      {/* Left mountain */}
      <polygon points="95,115 200,285 -20,285" fill="#718096" />
      {/* Right mountain */}
      <polygon points="490,125 590,285 380,285" fill="#718096" />

      {/* Rolling hills */}
      <ellipse cx="100" cy="295" rx="160" ry="40" fill="#276749" />
      <ellipse cx="320" cy="305" rx="200" ry="45" fill="#2F7A54" />
      <ellipse cx="540" cy="295" rx="140" ry="38" fill="#276749" />
      <rect x="0" y="305" width="600" height="95" fill="#276749" />
      {/* Ground detail */}
      <ellipse cx="300" cy="340" rx="280" ry="30" fill="#22543D" opacity="0.4" />

      {/* Stars */}
      <circle cx="45"  cy="38"  r="2.5" fill="#FEF3C7" className="bc-star"   />
      <circle cx="120" cy="22"  r="2"   fill="#FEF3C7" className="bc-star-2" />
      <circle cx="180" cy="55"  r="2.5" fill="#FEF3C7" className="bc-star"   style={{ animationDelay: '0.7s' }} />
      <circle cx="240" cy="30"  r="2"   fill="#FEF3C7" className="bc-star-3" />
      <circle cx="350" cy="18"  r="2.5" fill="#FEF3C7" className="bc-star-2" style={{ animationDelay: '1.3s' }} />
      <circle cx="420" cy="42"  r="2"   fill="#FEF3C7" className="bc-star"   style={{ animationDelay: '0.3s' }} />
      <circle cx="480" cy="25"  r="2.5" fill="#FEF3C7" className="bc-star-3" style={{ animationDelay: '0.9s' }} />
      <circle cx="555" cy="55"  r="2"   fill="#FEF3C7" className="bc-star-2" style={{ animationDelay: '1.8s' }} />
      <circle cx="75"  cy="80"  r="1.5" fill="#FEF3C7" className="bc-star-3" style={{ animationDelay: '0.5s' }} />
      <circle cx="310" cy="65"  r="1.5" fill="#FEF3C7" className="bc-star"   style={{ animationDelay: '2.0s' }} />

      {/* Crescent moon */}
      <circle cx="548" cy="52" r="18" fill="#FEF3C7" opacity="0.9" />
      <circle cx="558" cy="46" r="15" fill={skyTop} />

      {/* Deterioration: cloud overlays */}
      {deteriorationLevel >= 1 && (
        <g opacity="0.25">
          <ellipse cx="150" cy="80"  rx="90"  ry="30" fill="#718096" />
          <ellipse cx="100" cy="75"  rx="60"  ry="22" fill="#A0AEC0" />
          <ellipse cx="390" cy="65"  rx="110" ry="28" fill="#718096" />
          <ellipse cx="450" cy="60"  rx="70"  ry="20" fill="#A0AEC0" />
        </g>
      )}
      {deteriorationLevel >= 2 && (
        <g opacity="0.3">
          <ellipse cx="200" cy="110" rx="120" ry="35" fill="#4A5568" />
          <ellipse cx="350" cy="95"  rx="130" ry="30" fill="#4A5568" />
          <ellipse cx="520" cy="100" rx="80"  ry="25" fill="#4A5568" />
        </g>
      )}

      {/* ── LAYER 1: Tent + campfire (Day 1+) ───────────────────────────── */}
      {sceneDay >= 1 && (
        <g>
          {/* Cleared ground patch */}
          <ellipse cx="230" cy="318" rx="85" ry="18" fill="#1D4731" opacity="0.6" />

          {/* Tent 1 */}
          <g transform={tentTransform} style={{ transformOrigin: '200px 310px' }}>
            {collapsed ? (
              // Level 3: collapsed tent
              <polygon points="145,318 255,318 250,308 150,308" fill="#C05621" opacity="0.7" />
            ) : (
              <>
                <polygon points="200,248 258,310 142,310" fill="#DD6B20" />
                <polygon points="200,248 225,310 175,310" fill="#C05621" opacity="0.6" />
                {/* Door */}
                <polygon points="200,278 218,310 182,310" fill="#92400E" opacity="0.8" />
                {/* Tent ridge line */}
                <line x1="200" y1="248" x2="258" y2="310" stroke="#9C4221" strokeWidth="1.5" opacity="0.5" />
                {/* Tent pole top */}
                <circle cx="200" cy="248" r="3" fill="#9C4221" />
              </>
            )}
          </g>

          {/* Campfire */}
          <g className="bc-fire">
            {/* Logs */}
            <line x1="255" y1="310" x2="283" y2="306" stroke="#92400E" strokeWidth="4" strokeLinecap="round" />
            <line x1="257" y1="312" x2="281" y2="308" stroke="#78350F" strokeWidth="3" strokeLinecap="round" />
            {/* Ember base */}
            <ellipse cx="268" cy="310" rx="10" ry="4" fill="#F6AD55" opacity="0.9" />
            {/* Flames */}
            {fireActive ? (
              <>
                <path d="M263,310 Q260,295 268,285 Q276,295 273,310 Z"
                  fill="#FC8181" className="bc-fire-anim" />
                <path d="M265,310 Q263,298 268,290 Q273,298 271,310 Z"
                  fill="#FED7AA" className="bc-fire2-anim" />
                <path d="M261,310 Q259,300 265,294 Q268,300 267,310 Z"
                  fill="#F6AD55" className="bc-fire-anim" style={{ animationDelay: '0.15s' }} />
              </>
            ) : (
              // Fire out — just grey smoke wisps
              <>
                <path d="M263,310 Q260,295 268,285 Q276,295 273,310 Z" fill="#718096" opacity="0.4" />
                <path d="M266,284 Q264,272 268,266 Q272,272 270,284" fill="none" stroke="#A0AEC0" strokeWidth="1.5" opacity="0.5" />
              </>
            )}
          </g>
        </g>
      )}

      {/* ── LAYER 2: Backpack, lantern, firewood (Day 3+) ───────────────── */}
      {sceneDay >= 3 && (
        <g>
          {/* Backpack leaning on tent left side */}
          <rect x="142" y="285" width="16" height="22" rx="3" fill="#2D3748" />
          <rect x="144" y="284" width="12" height="6"  rx="2" fill="#4A5568" />
          {/* Shoulder straps */}
          <line x1="145" y1="290" x2="143" y2="307" stroke="#4A5568" strokeWidth="2" />
          <line x1="156" y1="290" x2="158" y2="307" stroke="#4A5568" strokeWidth="2" />

          {/* Lantern hanging from tent pole */}
          <line x1="200" y1="248" x2="215" y2="256" stroke="#9C4221" strokeWidth="1.5" />
          <rect x="211" y="256" width="8" height="10" rx="2" fill="#F6AD55" opacity="0.9" />
          <rect x="212" y="254" width="6" height="3"  rx="1" fill="#D69E2E" />
          <circle cx="215" cy="261" r="5" fill="#FEF08A" opacity="0.35" />

          {/* Firewood pile */}
          <g opacity="0.9">
            <line x1="282" y1="313" x2="300" y2="309" stroke="#92400E" strokeWidth="5" strokeLinecap="round" />
            <line x1="283" y1="316" x2="299" y2="312" stroke="#78350F" strokeWidth="4" strokeLinecap="round" />
            <line x1="285" y1="319" x2="298" y2="315" stroke="#92400E" strokeWidth="3.5" strokeLinecap="round" />
          </g>
        </g>
      )}

      {/* ── LAYER 3: Second tent, map board, boot prints (Day 7+) ─────────── */}
      {sceneDay >= 7 && (
        <g>
          {/* Boot prints */}
          <ellipse cx="305" cy="322" rx="5" ry="3" fill="#1D4731" opacity="0.5" transform="rotate(-15, 305, 322)" />
          <ellipse cx="315" cy="316" rx="5" ry="3" fill="#1D4731" opacity="0.5" transform="rotate(10, 315, 316)" />
          <ellipse cx="326" cy="320" rx="5" ry="3" fill="#1D4731" opacity="0.5" transform="rotate(-10, 326, 320)" />

          {/* Second tent */}
          <g transform={tentTransform} style={{ transformOrigin: '345px 310px' }}>
            {collapsed ? (
              <polygon points="308,318 388,318 384,310 312,310" fill="#C05621" opacity="0.65" />
            ) : (
              <>
                <polygon points="345,258 395,310 295,310" fill="#C05621" />
                <polygon points="345,258 365,310 325,310" fill="#9C4221" opacity="0.5" />
                <polygon points="345,282 360,310 330,310" fill="#7B341E" opacity="0.75" />
                <circle cx="345" cy="258" r="2.5" fill="#9C4221" />
              </>
            )}
          </g>

          {/* Map board sign */}
          <line x1="420" y1="280" x2="420" y2="320" stroke="#92400E" strokeWidth="3" />
          <rect x="403" y="264" width="34" height="24" rx="2" fill="#F5DEB3" />
          <rect x="405" y="266" width="30" height="20" rx="1" fill="#FFF8DC" />
          {/* Map lines on board */}
          <path d="M408,272 Q415,268 422,273 Q427,276 430,271" fill="none" stroke="#A0AEC0" strokeWidth="1" />
          <circle cx="418" cy="273" r="2" fill="#FC8181" />
          <line x1="407" y1="279" x2="432" y2="279" stroke="#CBD5E0" strokeWidth="0.8" />
          <line x1="407" y1="283" x2="425" y2="283" stroke="#CBD5E0" strokeWidth="0.8" />
        </g>
      )}

      {/* ── LAYER 4: Crates, rope, flag (Day 10+) ────────────────────────── */}
      {sceneDay >= 10 && (
        <g>
          {/* Equipment crates */}
          <rect x="155" y="295" width="28" height="22" rx="2" fill="#D69E2E" />
          <line x1="155" y1="306" x2="183" y2="306" stroke="#B7791F" strokeWidth="1.5" />
          <line x1="169" y1="295" x2="169" y2="317" stroke="#B7791F" strokeWidth="1.5" />
          <rect x="163" y="300" width="24" height="18" rx="2" fill="#ECC94B" />
          <line x1="163" y1="309" x2="187" y2="309" stroke="#D69E2E" strokeWidth="1.5" />
          <line x1="175" y1="300" x2="175" y2="318" stroke="#D69E2E" strokeWidth="1.5" />
          {/* X marks on crates */}
          <line x1="157" y1="297" x2="167" y2="304" stroke="#B7791F" strokeWidth="1" opacity="0.6" />
          <line x1="167" y1="297" x2="157" y2="304" stroke="#B7791F" strokeWidth="1" opacity="0.6" />

          {/* Rope coil on top of crate */}
          <circle cx="171" cy="295" r="6" fill="none" stroke="#D69E2E" strokeWidth="3" />
          <circle cx="171" cy="295" r="3" fill="none" stroke="#D69E2E" strokeWidth="2" />

          {/* Flag on pole between tents */}
          <line x1="292" y1="255" x2="292" y2="310" stroke="#718096" strokeWidth="2.5" />
          <polygon points="292,257 318,267 292,277" fill="#3182CE" />
          <polygon points="292,257 318,267 292,277" fill="#2B6CB0" opacity="0.3" />
        </g>
      )}

      {/* ── LAYER 5: Weather station, third tent, clothesline (Day 14+) ───── */}
      {sceneDay >= 14 && (
        <g>
          {/* Weather station pole */}
          <line x1="455" y1="255" x2="455" y2="310" stroke="#718096" strokeWidth="2.5" />
          {/* Anemometer */}
          <circle cx="455" cy="255" r="4" fill="#A0AEC0" />
          <line x1="455" y1="251" x2="455" y2="259" stroke="#718096" strokeWidth="1.5" />
          <line x1="451" y1="255" x2="459" y2="255" stroke="#718096" strokeWidth="1.5" />
          <circle cx="455" cy="251" r="3" fill="#E2E8F0" />
          <circle cx="459" cy="255" r="3" fill="#E2E8F0" />
          {/* Thermometer on pole */}
          <rect x="460" y="268" width="5" height="18" rx="2" fill="#FC8181" opacity="0.8" />
          <rect x="461" y="275" width="3" height="10" rx="1" fill="#FEB2B2" />

          {/* Third tent (smaller, further back — depth) */}
          {!collapsed && (
            <>
              <polygon points="500,270 530,300 470,300" fill="#9C4221" opacity="0.85" />
              <polygon points="500,270 514,300 486,300" fill="#7B341E" opacity="0.45" />
            </>
          )}

          {/* Clothesline between tent 1 and tent 2 poles */}
          <line x1="200" y1="252" x2="345" y2="260" stroke="#CBD5E0" strokeWidth="1.5" opacity="0.7" />
          {/* Hanging gear items */}
          <rect x="225" y="253" width="10" height="12" rx="2" fill="#4A5568" opacity="0.8" />
          <line x1="230" y1="253" x2="230" y2="250" stroke="#CBD5E0" strokeWidth="1" />
          <rect x="255" y="255" width="8"  height="10" rx="2" fill="#DD6B20" opacity="0.8" />
          <line x1="259" y1="255" x2="259" y2="252" stroke="#CBD5E0" strokeWidth="1" />
          <rect x="298" y="257" width="10" height="8"  rx="2" fill="#2D3748" opacity="0.8" />
          <line x1="303" y1="257" x2="303" y2="254" stroke="#CBD5E0" strokeWidth="1" />
          <rect x="320" y="258" width="7"  height="9"  rx="2" fill="#DD6B20" opacity="0.8" />
          <line x1="323" y1="258" x2="323" y2="255" stroke="#CBD5E0" strokeWidth="1" />
        </g>
      )}

      {/* ── LAYER 6: BASE CAMP sign, path up mountain, telescope (Day 18+) ── */}
      {sceneDay >= 18 && (
        <g>
          {/* BASE CAMP wooden sign */}
          <rect x="240" y="326" width="100" height="22" rx="3" fill="#92400E" />
          <rect x="242" y="328" width="96"  height="18" rx="2" fill="#B45309" />
          <text x="290" y="342" textAnchor="middle" fontSize="9" fontWeight="bold" fontFamily="monospace" fill="#FEF3C7" letterSpacing="1">BASE CAMP</text>
          {/* Sign posts */}
          <rect x="260" y="346" width="5"  height="12" fill="#92400E" />
          <rect x="320" y="346" width="5"  height="12" fill="#92400E" />

          {/* Path up mountain (visible track) */}
          <path d="M290,316 Q280,280 285,250 Q288,225 290,200 Q292,175 292,140"
            fill="none" stroke="#D69E2E" strokeWidth="3" strokeDasharray="6,4" opacity="0.6" />

          {/* Telescope on tripod */}
          <line x1="425" y1="290" x2="418" y2="310" stroke="#718096" strokeWidth="2" />
          <line x1="425" y1="290" x2="432" y2="310" stroke="#718096" strokeWidth="2" />
          <line x1="425" y1="290" x2="425" y2="310" stroke="#718096" strokeWidth="2" />
          <line x1="418" y1="310" x2="432" y2="310" stroke="#718096" strokeWidth="1.5" />
          <rect x="418" y="283" width="24" height="8" rx="3" fill="#4A5568" transform="rotate(-20, 430, 287)" />
          <circle cx="419" cy="281" r="3" fill="#2D3748" transform="rotate(-20, 430, 287)" />
        </g>
      )}

      {/* ── LAYER 7: Team board, summit flag, dotted path (Day 22+) ─────── */}
      {sceneDay >= 22 && (
        <g>
          {/* Team corkboard */}
          <rect x="130" y="258" width="32" height="28" rx="2" fill="#92400E" />
          <rect x="132" y="260" width="28" height="24" rx="1" fill="#F5CBA7" />
          {/* Papers pinned */}
          <rect x="134" y="262" width="11" height="8" rx="1" fill="white" opacity="0.9" />
          <circle cx="139" cy="262" r="2" fill="#FC8181" />
          <rect x="147" y="262" width="11" height="8" rx="1" fill="white" opacity="0.9" />
          <circle cx="152" cy="262" r="2" fill="#68D391" />
          <rect x="134" y="272" width="24" height="8" rx="1" fill="white" opacity="0.9" />
          <circle cx="146" cy="272" r="2" fill="#63B3ED" />

          {/* Summit flag on mountain top */}
          <line x1="290" y1="45" x2="290" y2="28" stroke="#718096" strokeWidth="2" />
          <polygon points="290,28 310,35 290,42" fill="#FC8181" />

          {/* Dotted path (more prominent) */}
          <path d="M290,316 Q282,275 286,245 Q289,215 290,185 Q291,160 291,130 Q290,100 290,75"
            fill="none" stroke="#FEF3C7" strokeWidth="2" strokeDasharray="5,5" opacity="0.45" />
        </g>
      )}

      {/* ── LAYER 8: Tent glow, SUMMIT arrow, figure silhouette (Day 27+) ── */}
      {sceneDay >= 27 && (
        <g>
          {/* Warm glow around tent 1 */}
          <ellipse cx="205" cy="295" rx="55" ry="35" fill="url(#bcTentGlow1)" className="bc-glow" />
          {/* Warm glow around tent 2 */}
          <ellipse cx="345" cy="295" rx="50" ry="32" fill="url(#bcTentGlow2)" className="bc-glow" style={{ animationDelay: '0.8s' }} />

          {/* SUMMIT → sign */}
          <rect x="360" y="320" width="90" height="20" rx="3" fill="#2D3748" />
          <text x="405" y="334" textAnchor="middle" fontSize="8" fontWeight="bold" fontFamily="monospace" fill="#FEF3C7" letterSpacing="0.5">SUMMIT →</text>

          {/* Figure silhouette at edge of camp looking at summit */}
          <g transform="translate(390, 295)">
            {/* Body */}
            <rect x="-4" y="-12" width="8" height="18" rx="2" fill="#1A202C" />
            {/* Head */}
            <circle cx="0" cy="-16" r="5" fill="#1A202C" />
            {/* Arm raised */}
            <line x1="4" y1="-8" x2="12" y2="-16" stroke="#1A202C" strokeWidth="2.5" strokeLinecap="round" />
            {/* Other arm */}
            <line x1="-4" y1="-8" x2="-8" y2="-4" stroke="#1A202C" strokeWidth="2.5" strokeLinecap="round" />
            {/* Legs */}
            <line x1="-2" y1="6"  x2="-4" y2="16" stroke="#1A202C" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="2"  y1="6"  x2="4"  y2="16" stroke="#1A202C" strokeWidth="2.5" strokeLinecap="round" />
          </g>
        </g>
      )}

      {/* ── LAYER 9: Chapter complete — golden hour + confetti (Day 30) ──── */}
      {sceneDay >= 30 && (
        <g>
          {/* Golden hour wash */}
          <rect width="600" height="400" fill="#F6AD55" opacity="0.12" />

          {/* Confetti sparkles */}
          {[
            { cx: 80,  cy: 120, r: 5,   fill: '#FC8181' },
            { cx: 150, cy: 80,  r: 4,   fill: '#68D391' },
            { cx: 220, cy: 100, r: 6,   fill: '#63B3ED' },
            { cx: 380, cy: 90,  r: 4.5, fill: '#F6AD55' },
            { cx: 450, cy: 110, r: 5,   fill: '#FC8181' },
            { cx: 520, cy: 75,  r: 4,   fill: '#68D391' },
            { cx: 320, cy: 85,  r: 5,   fill: '#FEF08A' },
          ].map((s, i) => (
            <circle key={i} cx={s.cx} cy={s.cy} r={s.r} fill={s.fill} opacity="0.85"
              style={{
                animation: `bcSpark 1.5s ease-out ${i * 0.18}s infinite`,
                '--tx': `${(i % 2 === 0 ? 1 : -1) * (10 + i * 4)}px`,
                '--ty': `-${20 + i * 5}px`,
              }}
            />
          ))}

          {/* Chapter Complete banner */}
          <rect x="150" y="155" width="300" height="45" rx="6" fill="#1A202C" opacity="0.88" />
          <rect x="153" y="158" width="294" height="39" rx="5" fill="#2D3748" />
          <text x="300" y="181" textAnchor="middle" fontSize="14" fontWeight="bold" fontFamily="sans-serif" fill="#F6AD55" letterSpacing="1">
            ✦ CHAPTER COMPLETE ✦
          </text>
        </g>
      )}
    </svg>
  )
}
