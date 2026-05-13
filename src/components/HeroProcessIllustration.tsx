export default function HeroProcessIllustration() {
  return (
    <svg
      className="hero-process"
      viewBox="0 0 960 520"
      role="img"
      aria-label="Proceso de emisión: factura en papel, sistema, ARCA y comprobante aprobado"
    >
      <defs>
        <marker id="hero-arrow" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto">
          <path d="M1 1 L9 5 L1 9 Z" fill="#F97316" />
        </marker>
        <marker id="hero-arrow-green" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto">
          <path d="M1 1 L9 5 L1 9 Z" fill="#22C55E" />
        </marker>
      </defs>

      <g className="hero-process__scene hero-process__scene--invoice">
      <g className="hero-process__paper">
        <rect x="66" y="118" width="188" height="250" rx="20" fill="#fff" stroke="#CBD5E1" strokeWidth="3" />
        <path d="M205 118 L254 167 L212 167 C208 167 205 164 205 160 Z" fill="#FFE8D5" stroke="#FDBA74" strokeWidth="3" />
        <rect x="102" y="158" width="78" height="12" rx="6" fill="#F97316" />
        <rect x="102" y="188" width="118" height="8" rx="4" fill="#CBD5E1" />
        <rect x="102" y="209" width="96" height="8" rx="4" fill="#CBD5E1" />
        <rect x="102" y="230" width="128" height="8" rx="4" fill="#E2E8F0" />
        <rect x="96" y="262" width="126" height="72" rx="8" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="2" />
        <path d="M138 262 V334 M180 262 V334 M96 286 H222 M96 310 H222" stroke="#CBD5E1" strokeWidth="2" />
        <rect x="108" y="274" width="18" height="5" rx="2.5" fill="#94A3B8" />
        <rect x="150" y="274" width="18" height="5" rx="2.5" fill="#94A3B8" />
        <rect x="192" y="274" width="18" height="5" rx="2.5" fill="#94A3B8" />
        <rect x="108" y="298" width="22" height="5" rx="2.5" fill="#CBD5E1" />
        <rect x="150" y="298" width="28" height="5" rx="2.5" fill="#CBD5E1" />
        <rect x="192" y="298" width="16" height="5" rx="2.5" fill="#CBD5E1" />
        <rect x="142" y="345" width="80" height="8" rx="4" fill="#F97316" />
      </g>

      <path className="hero-process__path hero-process__path--one" d="M278 244 C336 244 350 244 405 244" fill="none" stroke="#F97316" strokeWidth="5" strokeLinecap="round" markerEnd="url(#hero-arrow)" />
      <circle className="hero-process__packet hero-process__packet--one" r="12" fill="#F97316" />

      <g className="hero-process__computer">
        <rect x="406" y="114" width="300" height="210" rx="22" fill="#1F2937" />
        <rect x="424" y="134" width="264" height="166" rx="14" fill="#fff" />
        <rect x="438" y="150" width="36" height="136" rx="10" fill="#F8FAFC" />
        <circle cx="456" cy="172" r="8" fill="#F97316" />
        <circle cx="456" cy="204" r="8" fill="#CBD5E1" />
        <circle cx="456" cy="236" r="8" fill="#CBD5E1" />
        <rect x="494" y="154" width="136" height="12" rx="6" fill="#F97316" />
        <rect x="494" y="181" width="76" height="8" rx="4" fill="#CBD5E1" />
        <rect x="588" y="181" width="70" height="8" rx="4" fill="#CBD5E1" />
        <rect x="494" y="208" width="164" height="72" rx="9" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="2" />
        <path d="M535 208 V280 M590 208 V280 M494 232 H658 M494 256 H658" stroke="#CBD5E1" strokeWidth="2" />
        <rect x="506" y="220" width="18" height="5" rx="2.5" fill="#94A3B8" />
        <rect x="548" y="220" width="26" height="5" rx="2.5" fill="#94A3B8" />
        <rect x="604" y="220" width="28" height="5" rx="2.5" fill="#94A3B8" />
        <rect x="506" y="244" width="24" height="5" rx="2.5" fill="#CBD5E1" />
        <rect x="548" y="244" width="30" height="5" rx="2.5" fill="#CBD5E1" />
        <rect x="604" y="244" width="22" height="5" rx="2.5" fill="#CBD5E1" />
        <rect x="598" y="290" width="58" height="8" rx="4" fill="#F97316" />
        <path d="M464 362 H648 L686 405 H424 Z" fill="#334155" />
        <rect x="470" y="381" width="170" height="12" rx="6" fill="#1F2937" opacity="0.55" />
      </g>

      <path className="hero-process__path hero-process__path--two" d="M714 218 C760 196 786 178 824 151" fill="none" stroke="#F97316" strokeWidth="5" strokeLinecap="round" markerEnd="url(#hero-arrow)" />
      <circle className="hero-process__packet hero-process__packet--two" r="12" fill="#F97316" />

      <g className="hero-process__arca">
        <rect x="740" y="54" width="154" height="124" rx="18" fill="#fff" stroke="#CBD5E1" strokeWidth="3" />
        <image href="/illustrations/features/arca-logo.png" x="762" y="84" width="110" height="62" preserveAspectRatio="xMidYMid meet" />
        <g className="hero-process__arca-check">
          <circle cx="868" cy="70" r="18" fill="#F97316" />
          <path d="M859 70 L866 77 L878 63" fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      </g>

      <path className="hero-process__path hero-process__path--three" d="M816 188 C798 260 754 308 684 346" fill="none" stroke="#22C55E" strokeWidth="5" strokeLinecap="round" markerEnd="url(#hero-arrow-green)" />
      <circle className="hero-process__packet hero-process__packet--three" r="12" fill="#22C55E" />

      <g className="hero-process__approved">
        <rect x="648" y="324" width="202" height="118" rx="20" fill="#fff" stroke="#CBD5E1" strokeWidth="3" />
        <circle cx="704" cy="383" r="34" fill="#22C55E" />
        <path d="M687 382 L699 394 L724 367" fill="none" stroke="#fff" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
        <text x="754" y="394" className="hero-process__small-label">Listo</text>
      </g>
      </g>

      <rect className="hero-process__wash" x="0" y="0" width="960" height="520" fill="#fff" />

      <g className="hero-process__scene hero-process__scene--whatsapp">
        <g className="hero-process__phone">
          <rect x="96" y="76" width="190" height="340" rx="34" fill="#1F2937" />
          <rect x="112" y="104" width="158" height="280" rx="22" fill="#F8FAFC" />
          <rect x="142" y="91" width="72" height="8" rx="4" fill="#475569" />
          <circle cx="191" cy="400" r="8" fill="#475569" />
          <rect x="132" y="130" width="118" height="34" rx="17" fill="#22C55E" />
          <circle cx="151" cy="147" r="10" fill="#fff" />
          <path d="M146 147 C148 142 154 142 156 147 C154 152 148 152 146 147 Z" fill="#22C55E" />
          <rect x="132" y="190" width="100" height="30" rx="15" fill="#DCFCE7" />
          <rect x="146" y="203" width="58" height="5" rx="2.5" fill="#22C55E" opacity="0.75" />
          <rect x="150" y="238" width="88" height="30" rx="15" fill="#fff" stroke="#CBD5E1" strokeWidth="2" />
          <rect x="164" y="251" width="46" height="5" rx="2.5" fill="#94A3B8" />
          <rect x="132" y="286" width="106" height="44" rx="16" fill="#DCFCE7" />
          <rect x="148" y="300" width="64" height="6" rx="3" fill="#22C55E" opacity="0.75" />
          <rect x="148" y="314" width="42" height="6" rx="3" fill="#22C55E" opacity="0.5" />
        </g>

        <path className="hero-process__path hero-process__path--whatsapp-one" d="M300 244 C382 216 446 204 520 190" fill="none" stroke="#22C55E" strokeWidth="5" strokeLinecap="round" markerEnd="url(#hero-arrow-green)" />
        <circle className="hero-process__packet hero-process__packet--whatsapp-one" r="12" fill="#22C55E" />

        <g className="hero-process__whatsapp-arca">
          <rect x="520" y="104" width="178" height="134" rx="20" fill="#fff" stroke="#CBD5E1" strokeWidth="3" />
          <image href="/illustrations/features/arca-logo.png" x="548" y="142" width="122" height="68" preserveAspectRatio="xMidYMid meet" />
          <g className="hero-process__whatsapp-arca-check">
            <circle cx="676" cy="121" r="19" fill="#F97316" />
            <path d="M667 121 L674 128 L687 113" fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
          </g>
        </g>

        <path className="hero-process__path hero-process__path--whatsapp-two" d="M618 250 C634 312 676 352 740 378" fill="none" stroke="#22C55E" strokeWidth="5" strokeLinecap="round" markerEnd="url(#hero-arrow-green)" />
        <circle className="hero-process__packet hero-process__packet--whatsapp-two" r="12" fill="#22C55E" />

        <g className="hero-process__whatsapp-approved">
          <rect x="700" y="330" width="176" height="104" rx="20" fill="#fff" stroke="#CBD5E1" strokeWidth="3" />
          <circle cx="750" cy="382" r="32" fill="#22C55E" />
          <path d="M734 381 L746 393 L770 366" fill="none" stroke="#fff" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
          <text x="798" y="391" className="hero-process__small-label">Listo</text>
        </g>
      </g>
    </svg>
  )
}
