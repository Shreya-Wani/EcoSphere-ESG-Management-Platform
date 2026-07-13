'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  Leaf,
  Users,
  ShieldCheck,
  Trophy,
  Unlink,
  Clock,
  Calculator,
  Target,
  Bell,
  FileText,
  SlidersHorizontal,
  Zap,
  Bike,
  Award,
  Check,
  Play,
  ArrowRight,
  Quote,
} from 'lucide-react'
import { ThemeToggle } from '@/components/app-shell/theme-toggle'

// =============================================================
// EcoSphere — Marketing landing page (root route `/`)
// Ported from the approved design mockup. Signed-out visitors land
// here; the CTAs route to /sign-in. Uses the moss-green palette and
// Fraunces/Inter fonts already wired into the root layout.
// =============================================================

const serif = { fontFamily: 'var(--font-fraunces), Fraunces, serif' }

const heroBars = [
  { name: 'Environmental', pct: 82, color: '#4F7A5A' },
  { name: 'Social', pct: 74, color: '#8FAE97' },
  { name: 'Governance', pct: 88, color: '#4F7A5A' },
]

const trustStats = [
  { value: '482.6t', label: 'CO₂e tracked / year' },
  { value: '78/100', label: 'Composite ESG score' },
  { value: '340', label: 'Employees engaged' },
  { value: '86%', label: 'Issue closure rate' },
]

const problems = [
  { icon: Unlink, title: 'Data in silos', desc: 'Emissions, HR and compliance live in disconnected spreadsheets no one reconciles.' },
  { icon: Clock, title: 'Reported too late', desc: 'ESG numbers surface once a year — long after you could have changed the outcome.' },
  { icon: Users, title: 'No one participates', desc: 'Sustainability feels like someone else’s job, so behavior never actually shifts.' },
]

const pillars = [
  { icon: Leaf, iconBg: '#EEF3EF', iconColor: '#4F7A5A', title: 'Environmental', desc: 'Carbon accounting wired to real operations.', items: ['Emission factors', 'Auto carbon calc', 'Goals & targets'] },
  { icon: Users, iconBg: '#EEF3EF', iconColor: '#4F7A5A', title: 'Social', desc: 'CSR, participation and diversity in view.', items: ['CSR activities', 'Participation', 'Diversity metrics'] },
  { icon: ShieldCheck, iconBg: '#E4EDF8', iconColor: '#2D5C9E', title: 'Governance', desc: 'Policies, audits and compliance tracked.', items: ['Policies & acks', 'Audits', 'Compliance issues'] },
  { icon: Trophy, iconBg: '#FBF0DB', iconColor: '#96660C', title: 'Gamification', desc: 'The engine that drives real behavior.', items: ['Challenges & XP', 'Badges', 'Leaderboards'] },
]

const steps = [
  { n: '1', title: 'Configure', desc: 'Set up departments, emission factors, categories, policies and challenges once — your ESG operating model.' },
  { n: '2', title: 'Operate', desc: 'Daily work auto-generates carbon transactions; employees join challenges and log CSR from the same system.' },
  { n: '3', title: 'Improve', desc: 'Scores roll up per department into one weighted ESG number, surfaced live on dashboards and board-ready reports.' },
]

const leaders = [
  { rank: '1', name: 'Manufacturing', xp: '18,420', bg: 'rgba(255,255,255,.13)', chipBg: '#E7C15A', chipColor: '#4A3A0E' },
  { rank: '2', name: 'Engineering', xp: '17,960', bg: 'rgba(255,255,255,.08)', chipBg: '#CBD2D6', chipColor: '#2A3134' },
  { rank: '3', name: 'Operations', xp: '16,240', bg: 'rgba(255,255,255,.05)', chipBg: '#CE9B6E', chipColor: '#3E2A16' },
  { rank: '4', name: 'Logistics', xp: '12,180', bg: 'rgba(255,255,255,.03)', chipBg: 'rgba(255,255,255,.14)', chipColor: '#FFFFFF' },
]

const features = [
  { icon: Calculator, title: 'Automatic carbon calc', desc: 'Quantity × emission factor computed on save from Purchase, Fleet and Energy records.' },
  { icon: Target, title: 'Sustainability goals', desc: 'Track reduction targets against live progress with status and deadlines.' },
  { icon: Bell, title: 'Smart notifications', desc: 'Alerts for overdue compliance issues, approvals, acknowledgements and badge unlocks.' },
  { icon: FileText, title: 'Standard reports', desc: 'Environmental, Social, Governance and ESG Summary reports, board-ready.' },
  { icon: SlidersHorizontal, title: 'Configurable weights', desc: 'Tune the Env / Social / Gov weighting and rules to your organization.' },
  { icon: Zap, title: 'XP & reward engine', desc: 'Points, badges and a redeemable rewards catalog to sustain engagement.' },
]

const impactStats = [
  { value: '−4.2%', label: 'emissions YoY' },
  { value: '+14pt', label: 'participation' },
  { value: '86%', label: 'issues closed' },
  { value: '1 day', label: 'to first dashboard' },
]

/**
 * Progressive-enhancement scroll reveal. Content is ALWAYS visible — the
 * `.eh-reveal`/`.eh-stagger` classes only add a subtle upward fade the first
 * time each block enters the viewport, and only once JS confirms it can
 * observe. Nothing is ever hidden waiting on JS, so no-JS visitors, slow
 * hydration and anchor jumps all render the full page. As a belt-and-braces
 * fallback, everything is force-revealed after 1.2s.
 */
function useReveal() {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.classList.add('eh-js') // opt into the animated (briefly-hidden) state
    const nodes = Array.from(el.querySelectorAll<HTMLElement>('.eh-reveal, .eh-stagger'))
    const reveal = (n: Element) => n.classList.add('eh-show')

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            reveal(e.target)
            io.unobserve(e.target)
          }
        })
      },
      { threshold: 0.1, rootMargin: '0px 0px -4% 0px' },
    )
    nodes.forEach((n) => {
      if (n.getBoundingClientRect().top < window.innerHeight) reveal(n)
      else io.observe(n)
    })
    // Safety net: never leave content hidden if the observer misses.
    const t = setTimeout(() => nodes.forEach(reveal), 1200)
    return () => {
      io.disconnect()
      clearTimeout(t)
    }
  }, [])
  return ref
}

export function LandingPage() {
  const router = useRouter()
  const go = () => router.push('/sign-in')
  const root = useReveal()

  return (
    <div ref={root} className="min-h-screen bg-canvas text-ink" style={{ fontFamily: 'var(--font-inter), Inter, system-ui, sans-serif' }}>
      <style>{`
        /* Hidden/animated state applies only once JS adds .eh-js — so the
           content is always visible without JS or before hydration. */
        .eh-js .eh-reveal{opacity:0;transform:translateY(22px);transition:opacity .7s cubic-bezier(.2,.7,.2,1),transform .7s cubic-bezier(.2,.7,.2,1)}
        .eh-js .eh-reveal.eh-show{opacity:1;transform:none}
        .eh-js .eh-stagger>*{opacity:0;transform:translateY(22px);transition:opacity .6s cubic-bezier(.2,.7,.2,1),transform .6s cubic-bezier(.2,.7,.2,1)}
        .eh-js .eh-stagger.eh-show>*{opacity:1;transform:none}
        .eh-stagger.eh-show>*:nth-child(2){transition-delay:.08s}
        .eh-stagger.eh-show>*:nth-child(3){transition-delay:.16s}
        .eh-stagger.eh-show>*:nth-child(4){transition-delay:.24s}
        .eh-stagger.eh-show>*:nth-child(5){transition-delay:.32s}
        .eh-stagger.eh-show>*:nth-child(6){transition-delay:.4s}
        .eh-lift{transition:transform .28s cubic-bezier(.2,.7,.2,1),box-shadow .28s ease,border-color .28s ease}
        .eh-lift:hover{transform:translateY(-4px);box-shadow:0 20px 44px var(--shadow, rgba(31,41,55,.1))}
        @keyframes eh-pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.4;transform:scale(.82)}}
        .eh-pulse-dot{animation:eh-pulse 2.4s ease-in-out infinite}
        @keyframes eh-up{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        .eh-in{opacity:0;animation:eh-up .7s cubic-bezier(.2,.7,.2,1) forwards}
        @media (prefers-reduced-motion:reduce){.eh-js .eh-reveal,.eh-js .eh-stagger>*,.eh-in{transition:none!important;animation:none!important;opacity:1!important;transform:none!important}}
      `}</style>

      {/* NAV */}
      <div className="sticky top-0 z-50 border-b border-line bg-canvas/80 backdrop-blur-md">
        <div className="mx-auto flex h-[68px] max-w-[1200px] items-center gap-8 px-6 sm:px-8">
          <div className="flex items-center gap-[11px]">
            <BrandMark size={30} />
            <div className="text-[18px] font-bold tracking-[-.3px]">EcoSphere</div>
          </div>
          <div className="hidden flex-1 items-center gap-7 pl-4 lg:flex">
            <a href="#eh-problem" className="text-[14px] font-medium text-ink-2 hover:text-ink">Why EcoSphere</a>
            <a href="#eh-pillars" className="text-[14px] font-medium text-ink-2 hover:text-ink">Platform</a>
            <a href="#eh-how" className="text-[14px] font-medium text-ink-2 hover:text-ink">How it works</a>
            <a href="#eh-impact" className="text-[14px] font-medium text-ink-2 hover:text-ink">Impact</a>
          </div>
          <div className="ml-auto flex items-center gap-3 lg:ml-0">
            <ThemeToggle />
            <button onClick={go} className="hidden h-[38px] rounded-lg px-4 text-[14px] font-semibold text-ink hover:bg-hover sm:block">Sign in</button>
            <button onClick={go} className="h-[38px] rounded-lg bg-brand-primary px-[18px] text-[14px] font-semibold text-white shadow-sm hover:bg-brand-primary-dark">Get started</button>
          </div>
        </div>
      </div>

      {/* HERO */}
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute -right-60 -top-80 h-[560px] w-[560px] rounded-full opacity-70 blur-[40px]" style={{ background: 'radial-gradient(circle, var(--glow, rgba(79,122,90,.14)), transparent 62%)' }} />
        <div className="relative mx-auto max-w-[1200px] px-6 pb-16 pt-[76px] sm:px-8">
          <div className="eh-in inline-flex items-center gap-2 rounded-full border border-line bg-surface px-[14px] py-[6px] text-[12.5px] font-semibold text-brand-primary" style={{ animationDelay: '.02s' }}>
            <span className="eh-pulse-dot h-[7px] w-[7px] rounded-full bg-brand-primary" />
            ESG · Engagement · Governance — one system of record
          </div>
          <div className="mt-7 grid items-center gap-14 lg:grid-cols-[1.15fr_.85fr]">
            <div>
              <h1 className="eh-in m-0 text-[clamp(34px,5.4vw,56px)] font-semibold leading-[1.06] tracking-[-1px] text-ink" style={{ ...serif, animationDelay: '.06s', textWrap: 'balance' }}>
                Make ESG a <span className="italic text-brand-primary">daily habit</span>, not a year-end scramble.
              </h1>
              <p className="eh-in mt-[22px] max-w-[520px] text-[17px] leading-[1.6] text-ink-2" style={{ animationDelay: '.12s' }}>
                EcoSphere turns everyday operations into measured sustainability. Auto-calculate carbon, run CSR and governance in one place, and get employees genuinely involved through challenges, XP and rewards.
              </p>
              <div className="eh-in mt-8 flex flex-wrap gap-[14px]" style={{ animationDelay: '.18s' }}>
                <button onClick={go} className="flex h-12 items-center rounded-[10px] bg-brand-primary px-6 text-[15px] font-semibold text-white shadow-[0_4px_14px_rgba(79,122,90,.28)] hover:bg-brand-primary-dark">
                  Start free trial
                </button>
                <button onClick={go} className="flex h-12 items-center gap-[9px] rounded-[10px] border border-input-line bg-surface px-[22px] text-[15px] font-semibold text-ink hover:bg-hover">
                  <Play className="h-[17px] w-[17px] fill-brand-primary text-brand-primary" /> Watch tour
                </button>
              </div>
              <div className="eh-in mt-[26px] flex items-center gap-[10px] text-[13px] text-faint" style={{ animationDelay: '.24s' }}>
                <Check className="h-4 w-4 text-brand-primary" strokeWidth={2.4} />
                No setup fees · Aligns with GHG Protocol &amp; GRI
              </div>
            </div>

            {/* hero card */}
            <div className="eh-in relative" style={{ animationDelay: '.16s' }}>
              <div className="relative rounded-[18px] border border-line bg-surface p-5 shadow-[0_30px_70px_var(--shadow,rgba(31,41,55,.1))]">
                <div className="flex items-center justify-between px-1 pb-[14px] pt-[2px]">
                  <div className="text-[12.5px] font-bold text-ink">Company ESG Score</div>
                  <div className="flex items-center gap-[6px] rounded-full bg-[#E5F0E8] px-[10px] py-[3px] text-[11px] font-semibold text-[#3D6B4A]">
                    <span className="eh-pulse-dot h-[6px] w-[6px] rounded-full bg-brand-primary" />FY26 · Live
                  </div>
                </div>
                <div className="flex items-end gap-[14px] px-1 pb-4">
                  <div className="text-[52px] font-semibold leading-none text-ink" style={serif}>78</div>
                  <div className="pb-[9px]">
                    <div className="text-[13px] text-faint">/ 100</div>
                    <div className="text-[12px] font-semibold text-[#3D6B4A]">▲ +5 vs FY25</div>
                  </div>
                </div>
                <div className="flex flex-col gap-3">
                  {heroBars.map((b) => (
                    <div key={b.name} className="flex items-center gap-3">
                      <div className="w-24 text-[12.5px] font-medium text-ink">{b.name}</div>
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#EDECE7]">
                        <div className="h-full rounded-full" style={{ width: `${b.pct}%`, background: b.color }} />
                      </div>
                      <div className="w-[30px] text-right text-[12.5px] font-semibold tabular-nums text-ink">{b.pct}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex items-center gap-[11px] rounded-xl border border-line bg-surface-2 px-[14px] py-3">
                  <div className="flex h-[34px] w-[34px] items-center justify-center rounded-[9px] bg-brand-primary text-white">
                    <Bike className="h-[19px] w-[19px]" />
                  </div>
                  <div className="flex-1">
                    <div className="text-[12.5px] font-semibold text-ink">Bike-to-Work Month</div>
                    <div className="mt-[5px] h-[5px] overflow-hidden rounded-full bg-line">
                      <div className="h-full rounded-full bg-brand-primary" style={{ width: '62%' }} />
                    </div>
                  </div>
                  <div className="text-[11.5px] font-bold text-brand-primary">+300 XP</div>
                </div>
              </div>
            </div>
          </div>

          {/* trust band */}
          <div className="eh-in mt-14 grid grid-cols-2 overflow-hidden rounded-2xl border border-line bg-surface sm:grid-cols-4" style={{ animationDelay: '.3s' }}>
            {trustStats.map((t) => (
              <div key={t.label} className="flex flex-col gap-1 border-r border-line-soft px-6 py-[22px]">
                <div className="text-[28px] font-semibold text-ink" style={serif}>{t.value}</div>
                <div className="text-[12.5px] text-faint">{t.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* PROBLEM */}
      <div id="eh-problem" className="mx-auto max-w-[1200px] scroll-mt-20 px-6 py-[72px] sm:px-8">
        <div className="eh-reveal max-w-[640px]">
          <div className="text-[13px] font-bold uppercase tracking-[.08em] text-brand-primary">The problem</div>
          <h2 className="mt-3 text-[clamp(27px,4.6vw,36px)] font-semibold leading-[1.15] tracking-[-.5px] text-ink" style={serif}>
            ESG reporting is manual, disconnected, and impossible to trust.
          </h2>
          <p className="mt-4 text-[16px] leading-[1.6] text-ink-2">
            Data lives in spreadsheets, participation is an afterthought, and the numbers only surface once a year — when it&apos;s far too late to act.
          </p>
        </div>
        <div className="eh-stagger mt-10 grid gap-5 md:grid-cols-3">
          {problems.map((p) => (
            <div key={p.title} className="eh-lift rounded-[14px] border border-line bg-surface p-6">
              <div className="mb-4 flex h-[42px] w-[42px] items-center justify-center rounded-[11px] bg-[#FBF0DB]">
                <p.icon className="h-[22px] w-[22px] text-[#96660C]" strokeWidth={1.9} />
              </div>
              <div className="text-[16px] font-semibold text-ink">{p.title}</div>
              <div className="mt-[7px] text-[14px] leading-[1.55] text-ink-2">{p.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* PILLARS */}
      <div id="eh-pillars" className="scroll-mt-16 border-y border-line bg-surface-2">
        <div className="mx-auto max-w-[1200px] px-6 py-[72px] sm:px-8">
          <div className="eh-reveal mx-auto max-w-[620px] text-center">
            <div className="text-[13px] font-bold uppercase tracking-[.08em] text-brand-primary">One platform</div>
            <h2 className="mt-3 text-[clamp(27px,4.6vw,36px)] font-semibold leading-[1.15] tracking-[-.5px] text-ink" style={serif}>
              Every ESG pillar, plus the engagement to move it.
            </h2>
          </div>
          <div className="eh-stagger mt-11 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {pillars.map((p) => (
              <div key={p.title} className="eh-lift flex flex-col gap-[14px] rounded-2xl border border-line bg-surface p-[26px_22px] shadow-sm">
                <div className="flex h-[46px] w-[46px] items-center justify-center rounded-xl" style={{ background: p.iconBg }}>
                  <p.icon className="h-[22px] w-[22px]" style={{ color: p.iconColor }} strokeWidth={1.9} />
                </div>
                <div className="text-[17px] font-bold text-ink">{p.title}</div>
                <div className="flex-1 text-[13.5px] leading-[1.55] text-ink-2">{p.desc}</div>
                <div className="flex flex-col gap-[7px] border-t border-line-soft pt-[14px]">
                  {p.items.map((it) => (
                    <div key={it} className="flex items-center gap-2 text-[13px] text-ink">
                      <Check className="h-[15px] w-[15px] text-brand-primary" strokeWidth={2.4} />
                      {it}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* HOW IT WORKS */}
      <div id="eh-how" className="mx-auto max-w-[1100px] scroll-mt-16 px-6 py-[76px] sm:px-8">
        <div className="eh-reveal mx-auto mb-12 max-w-[620px] text-center">
          <div className="text-[13px] font-bold uppercase tracking-[.08em] text-brand-primary">How it works</div>
          <h2 className="mt-3 text-[clamp(27px,4.6vw,36px)] font-semibold leading-[1.15] tracking-[-.5px] text-ink" style={serif}>
            From raw operations to board-ready score.
          </h2>
        </div>
        <div className="eh-stagger grid gap-6 md:grid-cols-3">
          {steps.map((s) => (
            <div key={s.n} className="flex flex-col gap-[14px]">
              <div className="flex items-center gap-3">
                <div className="flex h-[38px] w-[38px] items-center justify-center rounded-full bg-brand-primary text-[15px] font-bold text-white" style={serif}>{s.n}</div>
                <div className="h-px flex-1" style={{ background: 'linear-gradient(90deg,#CFDCD3,transparent)' }} />
              </div>
              <div className="text-[18px] font-bold text-ink">{s.title}</div>
              <div className="text-[14px] leading-[1.6] text-ink-2">{s.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* GAMIFICATION SPOTLIGHT */}
      <div className="relative overflow-hidden bg-[#33503C] text-white">
        <div className="absolute -bottom-36 -left-24 h-[400px] w-[400px] rounded-full bg-white/[.04]" />
        <div className="relative mx-auto grid max-w-[1200px] items-center gap-14 px-6 py-[72px] sm:px-8 lg:grid-cols-[.9fr_1.1fr]">
          <div>
            <div className="text-[13px] font-bold uppercase tracking-[.08em] text-[#A9C6B2]">Engagement engine</div>
            <h2 className="mt-[14px] text-[clamp(28px,4.6vw,38px)] font-semibold leading-[1.12] tracking-[-.5px]" style={serif}>
              Sustainability people actually want to join.
            </h2>
            <p className="mt-[18px] text-[16px] leading-[1.65] text-white/75">
              Challenges, XP, badges, rewards and leaderboards turn policy into participation. When 71% of your workforce is engaged, your scores move — and stay moved.
            </p>
            <div className="mt-[30px] flex gap-7">
              {[['340', 'employees engaged'], ['71%', 'participation rate'], ['12k', 'XP awarded / mo']].map(([n, l]) => (
                <div key={l}>
                  <div className="text-[34px] font-semibold" style={serif}>{n}</div>
                  <div className="text-[13px] text-white/60">{l}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-[18px] border border-white/[.14] bg-white/[.06] p-[22px] backdrop-blur-[4px]">
            <div className="mb-[14px] flex items-center justify-between">
              <div className="text-[13px] font-bold">Leaderboard · July</div>
              <div className="text-[11px] text-white/60">Departments</div>
            </div>
            {leaders.map((l) => (
              <div key={l.rank} className="mb-2 flex items-center gap-[13px] rounded-[11px] px-[13px] py-[11px]" style={{ background: l.bg }}>
                <div className="flex h-[26px] w-[26px] flex-none items-center justify-center rounded-[8px] text-[12.5px] font-bold tabular-nums" style={{ background: l.chipBg, color: l.chipColor }}>{l.rank}</div>
                <div className="flex-1 text-[13.5px] font-semibold">{l.name}</div>
                <div className="text-[13.5px] font-bold tabular-nums">{l.xp}</div>
              </div>
            ))}
            <div className="mt-[14px] flex gap-2">
              <div className="flex flex-1 items-center gap-2 rounded-[11px] bg-white/[.08] px-[11px] py-[9px]">
                <Leaf className="h-4 w-4 text-[#A9C6B2]" /><span className="text-[12px] font-medium">First Commute</span>
              </div>
              <div className="flex flex-1 items-center gap-2 rounded-[11px] bg-white/[.08] px-[11px] py-[9px]">
                <Award className="h-4 w-4 text-[#A9C6B2]" /><span className="text-[12px] font-medium">Streak ×4</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FEATURES */}
      <div className="mx-auto max-w-[1200px] px-6 py-[76px] sm:px-8">
        <div className="eh-reveal max-w-[620px]">
          <div className="text-[13px] font-bold uppercase tracking-[.08em] text-brand-primary">Built for operators</div>
          <h2 className="mt-3 text-[clamp(27px,4.6vw,36px)] font-semibold leading-[1.15] tracking-[-.5px] text-ink" style={serif}>
            Everything a compliance and sustainability team needs.
          </h2>
        </div>
        <div className="eh-stagger mt-10 grid gap-x-7 gap-y-[22px] md:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="flex gap-[14px]">
              <div className="flex h-[42px] w-[42px] flex-none items-center justify-center rounded-[11px] bg-[#EEF3EF]">
                <f.icon className="h-[22px] w-[22px] text-brand-primary" strokeWidth={1.9} />
              </div>
              <div>
                <div className="text-[15.5px] font-semibold text-ink">{f.title}</div>
                <div className="mt-[5px] text-[13.5px] leading-[1.55] text-ink-2">{f.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* IMPACT */}
      <div id="eh-impact" className="scroll-mt-16 border-t border-line bg-surface-2">
        <div className="mx-auto max-w-[1000px] px-6 py-[72px] text-center sm:px-8">
          <Quote className="mx-auto mb-2 h-[34px] w-[34px] text-[#CFDCD3]" fill="#CFDCD3" />
          <div className="mx-auto max-w-[820px] text-[clamp(24px,3.4vw,30px)] font-medium leading-[1.35] tracking-[-.3px] text-ink" style={{ ...serif, textWrap: 'balance' }}>
            &ldquo;For the first time our ESG number is something we manage weekly — not a report we dread. Participation did what audits never could.&rdquo;
          </div>
          <div className="mt-[26px] flex items-center justify-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-primary text-[13px] font-bold text-white">SR</div>
            <div className="text-left">
              <div className="text-[14px] font-semibold text-ink">Sneha Rao</div>
              <div className="text-[12.5px] text-faint">Head of Sustainability, Meridian Group</div>
            </div>
          </div>
          <div className="eh-stagger mt-12 flex flex-wrap justify-center gap-11">
            {impactStats.map((s) => (
              <div key={s.label}>
                <div className="text-[38px] font-semibold text-ink" style={serif}>{s.value}</div>
                <div className="text-[13px] text-faint">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FINAL CTA */}
      <div className="mx-auto max-w-[1000px] px-6 py-20 sm:px-8">
        <div className="relative overflow-hidden rounded-[22px] px-6 py-14 text-center shadow-[0_24px_60px_rgba(79,122,90,.28)] sm:px-12" style={{ background: 'linear-gradient(135deg,#557F60,#3D5F46)' }}>
          <div className="absolute -right-16 -top-24 h-[280px] w-[280px] rounded-full bg-white/[.08]" />
          <h2 className="relative m-0 text-[clamp(28px,4.6vw,38px)] font-semibold tracking-[-.5px] text-white" style={serif}>
            Ready to operationalize ESG?
          </h2>
          <p className="relative mx-auto mt-[14px] max-w-[480px] text-[16px] text-white/[.82]">
            Stand up your first dashboard in a day. No credit card required.
          </p>
          <div className="relative mt-[30px] flex flex-wrap justify-center gap-[14px]">
            <button onClick={go} className="h-12 rounded-[10px] bg-white px-[26px] text-[15px] font-bold text-[#33503C] hover:bg-line-soft">Get started free</button>
            <button onClick={go} className="h-12 rounded-[10px] border border-white/40 bg-transparent px-6 text-[15px] font-semibold text-white hover:bg-white/10">Sign in</button>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <div className="border-t border-line bg-canvas">
        <div className="mx-auto grid max-w-[1200px] gap-8 px-6 py-12 sm:px-8 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-[10px]">
              <BrandMark size={26} />
              <div className="text-[16px] font-bold">EcoSphere</div>
            </div>
            <div className="mt-3 max-w-[260px] text-[13px] leading-[1.55] text-faint">
              ESG data, employee action and gamified engagement — in one system of record.
            </div>
          </div>
          <FooterCol title="Platform" links={['Environmental', 'Social', 'Governance', 'Gamification']} href="#eh-pillars" />
          <FooterCol title="Company" links={['Why EcoSphere', 'How it works', 'Impact']} href="#eh-problem" />
          <div className="flex flex-col gap-[10px]">
            <div className="text-[12px] font-bold uppercase tracking-[.05em] text-faint">Get started</div>
            <button onClick={go} className="w-fit text-[13.5px] text-ink-2 hover:text-ink">Sign in</button>
            <button onClick={go} className="w-fit text-[13.5px] text-ink-2 hover:text-ink">Create account</button>
          </div>
        </div>
        <div className="border-t border-line">
          <div className="mx-auto flex max-w-[1200px] items-center justify-between px-6 py-5 text-[12.5px] text-faint sm:px-8">
            <div>© 2026 EcoSphere · ESG Management Platform</div>
            <div className="hidden sm:block">Privacy · Terms · Security</div>
          </div>
        </div>
      </div>
    </div>
  )
}

function BrandMark({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <rect width="32" height="32" rx="9" fill="#4F7A5A" />
      <circle cx="16" cy="16" r="5.5" fill="#FFFFFF" />
      <ellipse cx="16" cy="16" rx="10" ry="3.6" fill="none" stroke="#FFFFFF" strokeWidth="1.4" transform="rotate(-28 16 16)" />
    </svg>
  )
}

function FooterCol({ title, links, href }: { title: string; links: string[]; href: string }) {
  return (
    <div className="flex flex-col gap-[10px]">
      <div className="text-[12px] font-bold uppercase tracking-[.05em] text-faint">{title}</div>
      {links.map((l) => (
        <a key={l} href={href} className="text-[13.5px] text-ink-2 hover:text-ink">{l}</a>
      ))}
    </div>
  )
}
