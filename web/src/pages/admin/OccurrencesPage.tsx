import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useReactTable, getCoreRowModel, getSortedRowModel, getFilteredRowModel, getPaginationRowModel, flexRender, type ColumnDef, type SortingState } from '@tanstack/react-table'
import { ChevronUp, ChevronDown, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { useOccurrencesStore } from '@/stores/occurrencesStore'
import { RISK_LABELS, RISK_COLORS, type Occurrence, timeAgo, type RiskScore } from '@/lib/utils'

export default function OccurrencesPage() {
  const { occurrences } = useOccurrencesStore()
  const [sorting, setSorting] = useState<SortingState>([])
  const [minScore, setMinScore] = useState<number>(0)
  const [brFilter, setBrFilter] = useState('')
  const [selected, setSelected] = useState<Occurrence | null>(null)

  const filtered = useMemo(() =>
    occurrences.filter((o: Occurrence) =>
      o.risk_score >= minScore &&
      (!brFilter || String(o.br).includes(brFilter))
    ),
    [occurrences, minScore, brFilter]
  )

  const columns = useMemo<ColumnDef<Occurrence>[]>(() => [
    { accessorKey: 'id', header: 'ID', size: 100, cell: (c) => <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.8rem', color: '#64748b' }}>{c.getValue<string>()}</span> },
    { accessorKey: 'br', header: 'BR', size: 70, cell: (c) => <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 600 }}>BR-{c.getValue<number>()}</span> },
    { accessorKey: 'km', header: 'KM', size: 70, cell: (c) => <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.85rem' }}>{c.getValue<number>()}</span> },
    { accessorKey: 'municipio', header: 'Município', cell: (c) => `${c.getValue<string>()}/${c.row.original.uf}` },
    { accessorKey: 'tipo', header: 'Tipo', cell: (c) => <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{c.getValue<string>()}</span> },
    {
      accessorKey: 'interdicao',
      header: 'Interdição',
      size: 90,
      cell: (c) => (
        <span style={{ fontSize: '0.75rem', color: c.getValue<boolean>() ? '#ef4444' : '#64748b' }}>
          {c.getValue<boolean>() ? 'Sim' : 'Não'}
        </span>
      ),
    },
    {
      accessorKey: 'risk_score',
      header: 'Score',
      size: 100,
      cell: (c) => {
        const s = c.getValue<RiskScore>()
        return (
          <span
            style={{
              display: 'inline-block',
              padding: '0.15rem 0.6rem',
              borderRadius: '4px',
              fontSize: '0.75rem',
              fontWeight: 700,
              fontFamily: 'JetBrains Mono, monospace',
              background: RISK_COLORS[s] + '22',
              color: RISK_COLORS[s],
              border: `1px solid ${RISK_COLORS[s]}44`,
            }}
          >
            {RISK_LABELS[s]}
          </span>
        )
      },
    },
    {
      accessorKey: 'nlp_sentiment',
      header: 'Sentimento',
      size: 100,
      cell: (c) => <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{(c.getValue<string>() ?? '—')}</span>,
    },
    {
      accessorKey: 'detectado_em',
      header: 'Detectado',
      cell: (c) => <span style={{ fontSize: '0.75rem', color: '#475569', fontFamily: 'JetBrains Mono, monospace' }}>{timeAgo(c.getValue<string>())}</span>,
    },
  ], [])

  const table = useReactTable({
    data: filtered,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 20 } },
  })

  return (
    <div style={{ position: 'relative' }}>
      {/* Filters */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div>
          <label style={{ fontSize: '0.7rem', color: '#64748b', marginRight: '0.5rem', fontFamily: 'JetBrains Mono, monospace' }}>Score mínimo:</label>
          {([0, 1, 2, 3] as RiskScore[]).map((s) => (
            <button
              key={s}
              onClick={() => setMinScore(s)}
              style={{
                marginRight: '0.3rem',
                padding: '0.2rem 0.6rem',
                borderRadius: '5px',
                border: `1px solid ${RISK_COLORS[s]}${minScore === s ? '99' : '33'}`,
                background: minScore === s ? RISK_COLORS[s] + '22' : 'transparent',
                color: RISK_COLORS[s],
                fontSize: '0.75rem',
                cursor: 'pointer',
                fontFamily: 'JetBrains Mono, monospace',
                fontWeight: 600,
              }}
            >
              {RISK_LABELS[s]}
            </button>
          ))}
        </div>
        <input
          type="text"
          value={brFilter}
          onChange={(e) => setBrFilter(e.target.value)}
          placeholder="BR-..."
          style={{
            padding: '0.35rem 0.75rem',
            background: 'rgba(0,212,255,0.04)',
            border: '1px solid rgba(0,212,255,0.15)',
            borderRadius: '6px',
            color: '#e2e8f0',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '0.85rem',
            outline: 'none',
            width: '120px',
          }}
        />
        <span style={{ fontSize: '0.75rem', color: '#475569', fontFamily: 'JetBrains Mono, monospace', marginLeft: 'auto' }}>
          {filtered.length} registros
        </span>
      </div>

      {/* Table */}
      <div className="glass-card" style={{ borderRadius: '12px', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              {table.getHeaderGroups().map((hg) => (
                <tr key={hg.id} style={{ borderBottom: '1px solid rgba(0,212,255,0.06)' }}>
                  {hg.headers.map((header) => (
                    <th
                      key={header.id}
                      onClick={header.column.getToggleSortingHandler()}
                      style={{
                        padding: '0.75rem 1rem',
                        textAlign: 'left',
                        fontSize: '0.7rem',
                        color: '#64748b',
                        fontFamily: 'JetBrains Mono, monospace',
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        cursor: header.column.getCanSort() ? 'pointer' : 'default',
                        whiteSpace: 'nowrap',
                        userSelect: 'none',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getIsSorted() === 'asc' && <ChevronUp size={12} />}
                        {header.column.getIsSorted() === 'desc' && <ChevronDown size={12} />}
                      </div>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  onClick={() => setSelected(row.original)}
                  style={{
                    borderBottom: '1px solid rgba(255,255,255,0.02)',
                    cursor: 'pointer',
                    background: row.original.risk_score === 3
                      ? 'rgba(239,68,68,0.03)'
                      : row.original.risk_score === 2
                      ? 'rgba(249,115,22,0.02)'
                      : 'transparent',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(0,212,255,0.04)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} style={{ padding: '0.7rem 1rem', fontSize: '0.85rem', color: '#e2e8f0', whiteSpace: 'nowrap' }}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', borderTop: '1px solid rgba(0,212,255,0.06)' }}>
          <span style={{ fontSize: '0.75rem', color: '#475569', fontFamily: 'JetBrains Mono, monospace' }}>
            Pág. {table.getState().pagination.pageIndex + 1} / {table.getPageCount()}
          </span>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()} style={{ background: 'none', border: '1px solid rgba(0,212,255,0.15)', borderRadius: '6px', padding: '0.3rem 0.6rem', color: '#64748b', cursor: table.getCanPreviousPage() ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center' }}>
              <ChevronLeft size={14} />
            </button>
            <button onClick={() => table.nextPage()} disabled={!table.getCanNextPage()} style={{ background: 'none', border: '1px solid rgba(0,212,255,0.15)', borderRadius: '6px', padding: '0.3rem 0.6rem', color: '#64748b', cursor: table.getCanNextPage() ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center' }}>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Detail panel */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 280, damping: 28 }}
            className="glass-card-strong"
            style={{
              position: 'fixed',
              right: 0,
              top: 64,
              bottom: 0,
              width: '360px',
              zIndex: 100,
              padding: '1.5rem',
              overflowY: 'auto',
              borderLeft: '1px solid rgba(0,212,255,0.1)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
              <div>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.7rem', color: '#64748b', marginBottom: '0.25rem' }}>{selected.id}</div>
                <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '1.2rem', margin: 0 }}>
                  BR-{selected.br} · km {selected.km}
                </h3>
              </div>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '4px' }}>
                <X size={18} />
              </button>
            </div>

            <span style={{ display: 'inline-block', padding: '0.3rem 0.9rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', background: RISK_COLORS[selected.risk_score] + '22', color: RISK_COLORS[selected.risk_score], border: `1px solid ${RISK_COLORS[selected.risk_score]}44`, marginBottom: '1.25rem' }}>
              {RISK_LABELS[selected.risk_score].toUpperCase()} · Score {selected.risk_score}
            </span>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {[
                ['Município', `${selected.municipio}/${selected.uf}`],
                ['Tipo de acidente', selected.tipo],
                ['Interdição', selected.interdicao ? 'Sim' : 'Não'],
                ['Sentimento NLP', selected.nlp_sentiment ?? 'N/A'],
                ['Boost NLP', selected.nlp_boost !== undefined ? `+${selected.nlp_boost}` : 'N/A'],
                ['Detectado', timeAgo(selected.detectado_em)],
              ].map(([label, value]) => (
                <div key={label}>
                  <div style={{ fontSize: '0.65rem', color: '#475569', fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.2rem' }}>{label}</div>
                  <div style={{ fontSize: '0.875rem', color: '#e2e8f0' }}>{value}</div>
                </div>
              ))}
            </div>

            {selected.narrativa && (
              <div style={{ marginTop: '1.25rem', padding: '1rem', background: 'rgba(0,212,255,0.04)', border: '1px solid rgba(0,212,255,0.08)', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.65rem', color: '#475569', fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>Narrativa</div>
                <p style={{ fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.7, margin: 0, fontStyle: 'italic' }}>{selected.narrativa}</p>
              </div>
            )}

            {/* Timeline */}
            <div style={{ marginTop: '1.25rem' }}>
              <div style={{ fontSize: '0.65rem', color: '#475569', fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.75rem' }}>Timeline</div>
              {[
                { label: 'Detectado', time: selected.detectado_em, color: '#f59e0b' },
                { label: 'Atualizado', time: selected.detectado_em, color: '#00d4ff' },
              ].map((step) => (
                <div key={step.label} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: step.color, flexShrink: 0, marginTop: '4px' }} />
                  <div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#e2e8f0' }}>{step.label}</div>
                    <div style={{ fontSize: '0.7rem', color: '#475569', fontFamily: 'JetBrains Mono, monospace' }}>{timeAgo(step.time)}</div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
