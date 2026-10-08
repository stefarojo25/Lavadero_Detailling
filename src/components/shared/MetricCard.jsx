import { Link } from 'react-router-dom'

function MetricCard({ label, value, detail, icon: Icon, tone = 'brand', to }) {
  const tones = {
    brand: 'bg-brand/10 text-brand',
    green: 'bg-emerald-500/10 text-emerald-400',
    amber: 'bg-amber-500/10 text-amber-300',
    red: 'bg-red-500/10 text-red-300',
  }

  const className = 'group min-w-0 rounded-xl border border-outline bg-surface p-4 shadow-sm transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-brand/35 hover:shadow-[0_12px_32px_rgba(0,140,255,0.09)] sm:p-5'
  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-muted">{label}</p>
        {Icon && <span className={`grid size-9 shrink-0 place-items-center rounded-lg transition duration-200 group-hover:scale-105 group-hover:brightness-125 ${tones[tone] ?? tones.brand}`}><Icon size={18} aria-hidden="true" /></span>}
      </div>
      <p className="mt-4 wrap-break-word text-2xl font-semibold text-foreground transition-colors group-hover:text-white">{value}</p>
      {detail && <p className="mt-1 text-xs text-muted">{detail}</p>}
    </>
  )

  if (to) return <Link to={to} className={`${className} cursor-pointer focus-visible:outline-offset-4`} aria-label={`${label}: ${value}`}>{content}</Link>
  return <article className={className}>{content}</article>
}

export default MetricCard