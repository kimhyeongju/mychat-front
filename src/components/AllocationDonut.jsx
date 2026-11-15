import { useState } from 'react';

const SIZE = 140;
const RADIUS = 52;
const STROKE = 22;
const CIRC = 2 * Math.PI * RADIUS;
const GAP = 2; // 조각 사이 간격(px)

/**
 * 비중 도넛 차트.
 * @param {{key:string,label:string,weight:number,color:string}[]} slices weight 는 0~1 비율
 */
export default function AllocationDonut({ slices, centerLabel, centerValue }) {
  const [hover, setHover] = useState(null);

  let offset = 0;
  const arcs = slices
    .filter((s) => s.weight > 0)
    .map((s) => {
      const len = s.weight * CIRC;
      const arc = {
        ...s,
        dash: `${Math.max(len - GAP, 0.5)} ${CIRC - Math.max(len - GAP, 0.5)}`,
        dashOffset: -offset,
      };
      offset += len;
      return arc;
    });

  return (
    <svg
      className='alloc-donut'
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      role='img'
      aria-label='보유 비중 도넛 차트'
    >
      <g transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}>
        {arcs.map((a) => (
          <circle
            key={a.key}
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill='none'
            stroke={a.color}
            strokeWidth={hover === a.key ? STROKE + 4 : STROKE}
            strokeDasharray={a.dash}
            strokeDashoffset={a.dashOffset}
            onMouseEnter={() => setHover(a.key)}
            onMouseLeave={() => setHover(null)}
          >
            <title>{`${a.label} ${(a.weight * 100).toFixed(1)}%`}</title>
          </circle>
        ))}
      </g>
      <text
        x='50%'
        y='47%'
        textAnchor='middle'
        className='alloc-donut__label'
      >
        {hover != null
          ? arcs.find((a) => a.key === hover)?.label
          : centerLabel}
      </text>
      <text
        x='50%'
        y='60%'
        textAnchor='middle'
        className='alloc-donut__value'
      >
        {hover != null
          ? `${((arcs.find((a) => a.key === hover)?.weight ?? 0) * 100).toFixed(1)}%`
          : centerValue}
      </text>
    </svg>
  );
}
