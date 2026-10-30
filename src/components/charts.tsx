import { Area, AreaChart, Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { AXIS_PROPS, GRID_PROPS, tooltipStyle } from './shared'

/** Single-series trend over time. */
export function TrendArea({ data, name, color = 'var(--brand)' }: { data: { month: string; value: number }[]; name: string; color?: string }) {
  const id = `g-${name.replace(/\W/g, '')}`
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.18} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid {...GRID_PROPS} />
        <XAxis dataKey="month" {...AXIS_PROPS} />
        <YAxis allowDecimals={false} {...AXIS_PROPS} />
        <Tooltip {...tooltipStyle} cursor={{ stroke: '#d4d4d8' }} />
        <Area type="monotone" dataKey="value" name={name} stroke={color} strokeWidth={2} fill={`url(#${id})`} activeDot={{ r: 4, strokeWidth: 2, stroke: '#fff' }} />
      </AreaChart>
    </ResponsiveContainer>
  )
}

/** Single-series bars; horizontal layout suits long category names. */
export function CountBars({
  data,
  dataKey = 'name',
  name,
  horizontal,
  color = 'var(--brand)',
}: {
  data: Record<string, string | number>[]
  dataKey?: string
  name: string
  horizontal?: boolean
  color?: string
}) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      {horizontal ? (
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 28, left: 4, bottom: 0 }} barCategoryGap={6}>
          <CartesianGrid stroke="#f0f0f2" horizontal={false} />
          <XAxis type="number" allowDecimals={false} {...AXIS_PROPS} />
          <YAxis type="category" dataKey={dataKey} width={92} {...AXIS_PROPS} />
          <Tooltip {...tooltipStyle} cursor={{ fill: '#f4f4f5' }} />
          <Bar dataKey="value" name={name} fill={color} radius={[0, 4, 4, 0]} maxBarSize={22}>
            <LabelList dataKey="value" position="right" style={{ fontSize: 12, fill: '#52525b' }} />
          </Bar>
        </BarChart>
      ) : (
        <BarChart data={data} margin={{ top: 16, right: 8, left: -18, bottom: 0 }}>
          <CartesianGrid {...GRID_PROPS} />
          <XAxis dataKey={dataKey} {...AXIS_PROPS} interval={0} />
          <YAxis allowDecimals={false} {...AXIS_PROPS} />
          <Tooltip {...tooltipStyle} cursor={{ fill: '#f4f4f5' }} />
          <Bar dataKey="value" name={name} fill={color} radius={[4, 4, 0, 0]} maxBarSize={36} />
        </BarChart>
      )}
    </ResponsiveContainer>
  )
}
