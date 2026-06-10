import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  ChevronLeft, ChevronRight, Brain, Route, Globe,
  Cloud, BarChart3, GitBranch,
  Cpu, Warehouse, Zap, Bell, Satellite, Map,
} from 'lucide-react'

const COLORS = {
  bg: '#020408',
  card: '#060d16',
  border: '#0d1f2d',
  cyan: '#00d4ff',
  amber: '#f59e0b',
  green: '#22c55e',
  red: '#ef4444',
  text: '#e2e8f0',
  muted: '#64748b',
}

const slideVariants = {
  enter: (dir: number) => ({
    x: dir > 0 ? 600 : -600,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (dir: number) => ({
    x: dir > 0 ? -600 : 600,
    opacity: 0,
  }),
}

interface SlideProps {
  children: React.ReactNode
}

function Slide({ children }: SlideProps) {
  return (
    <div className="w-full h-full flex items-center justify-center px-8 md:px-16 lg:px-24">
      <div className="w-full max-w-5xl">
        {children}
      </div>
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2
      className="font-display font-bold mb-3"
      style={{ fontSize: 'clamp(1.5rem, 3vw, 2.5rem)', color: COLORS.cyan }}
    >
      {children}
    </h2>
  )
}

function SectionSubtitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-sm font-mono tracking-widest uppercase mb-6" style={{ color: COLORS.muted }}>
      {children}
    </p>
  )
}

function BulletList({ items, color = COLORS.cyan }: { items: string[]; color?: string }) {
  return (
    <ul className="flex flex-col gap-3">
      {items.map((item, i) => (
        <motion.li
          key={i}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 * i, duration: 0.4 }}
          className="flex items-start gap-3 text-sm md:text-base"
          style={{ color: COLORS.text }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full mt-[7px] flex-shrink-0"
            style={{ background: color }}
          />
          <span dangerouslySetInnerHTML={{ __html: item }} />
        </motion.li>
      ))}
    </ul>
  )
}

function Tag({ label, color = COLORS.cyan }: { label: string; color?: string }) {
  return (
    <span
      className="px-2.5 py-0.5 rounded-full font-mono text-[0.65rem] tracking-wide"
      style={{
        border: `1px solid ${color}30`,
        color,
        background: `${color}08`,
      }}
    >
      {label}
    </span>
  )
}

const slides = [
  // ── Slide 1: Capa ──────────────────────────────────────────────
  {
    id: 'capa',
    content: (
      <Slide>
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div
              className="w-30 h-30 rounded-2xl flex items-center justify-center p-1"
              // style={{ background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.25)' }}
            >
              <img
                src="/streetsat-logo.png"
                alt="StreetSat"
                className="w-full h-full object-contain"
              />
            </div>
            {/* <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.25)' }}
            >
              <Satellite size={32} style={{ color: COLORS.cyan }} />
            </div> */}
          </div>

          <div className="overflow-hidden mb-3">
            <motion.h1
              className="font-display font-bold"
              style={{ fontSize: 'clamp(2rem, 5vw, 4rem)', lineHeight: 1.1 }}
              initial={{ y: '100%' }}
              animate={{ y: '0%' }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            >
              <span className="text-gradient-animated">StreetSat</span>
            </motion.h1>
          </div>

          <motion.p
            className="font-display font-semibold mb-4"
            style={{ fontSize: 'clamp(1rem, 2.5vw, 1.75rem)', color: COLORS.text }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            Monitoramento Inteligente de Rodovias
            <br />
            <span style={{ color: COLORS.cyan }}>via Satélite e Inteligência Artificial</span>
          </motion.p>

          <motion.div
            className="flex gap-3 justify-center flex-wrap"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
          >
            <Tag label="FIAP Global Solution 2 · 2026" color={COLORS.cyan} />
            <Tag label="ODS 8 · 9 · 11" color={COLORS.amber} />
          </motion.div>

          <motion.div
            className="mt-8 font-mono text-xs"
            style={{ color: COLORS.muted }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9, duration: 0.5 }}
          >
            <span className="flex items-center justify-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: COLORS.green }} />
              Grupo: Gabriel Oliveira, Roberson Pedrosa, Samuel Nicolas, Arthur Bruttel e Jonatan Viotti
            </span>
          </motion.div>
        </div>
      </Slide>
    ),
  },

  // ── Slide 2: O Problema ─────────────────────────────────────────
  {
    id: 'problema',
    content: (
      <Slide>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div>
            <SectionSubtitle>O Problema</SectionSubtitle>
            <SectionTitle>Por que StreetSat?</SectionTitle>
            <p className="text-sm md:text-base leading-relaxed mb-6" style={{ color: COLORS.muted }}>
              O Brasil possui a <strong style={{ color: COLORS.text }}>5ª maior malha rodoviária do mundo</strong>, 
              com mais de 1,7 milhão de km de estradas. As rodovias paulistas concentram 
              cerca de <strong style={{ color: COLORS.text }}>30% dos acidentes</strong> do país.
            </p>
            <BulletList
              items={[
                'Mais de <strong>37 mil mortes</strong> por ano em acidentes de trânsito no Brasil',
                'Dados de risco <strong>espalhados</strong> entre múltiplas fontes (ARTESP, PRF, INPE)',
                'Sem integração entre <strong>clima, trânsito e histórico</strong> de acidentes',
                'Motoristas e transportadoras <strong>sem ferramentas</strong> de roteamento seguro',
              ]}
              color={COLORS.red}
            />
          </div>
          <div
            className="rounded-2xl p-8"
            style={{ background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.15)' }}
          >
            <div className="text-center mb-6">
              <div style={{ fontSize: 'clamp(3rem, 5vw, 4.5rem)', fontWeight: 700, color: COLORS.red }}>
                37k+
              </div>
              <div className="font-mono text-xs" style={{ color: COLORS.muted }}>
                mortes por ano no trânsito brasileiro
              </div>
            </div>
            <div className="flex gap-3 justify-center flex-wrap">
              <Tag label="ODS 8: Trabalho Decente" color={COLORS.green} />
              <Tag label="ODS 9: Indústria" color={COLORS.amber} />
              <Tag label="ODS 11: Cidades" color={COLORS.cyan} />
            </div>
          </div>
        </div>
      </Slide>
    ),
  },

  // ── Slide 3: Proposta de Valor ──────────────────────────────────
  {
    id: 'proposta',
    content: (
      <Slide>
        <div className="text-center mb-10">
          <SectionSubtitle>Proposta de Valor</SectionSubtitle>
          <SectionTitle>O que o StreetSat entrega?</SectionTitle>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            {
              Icon: BarChart3,
              title: 'Score de Risco',
              desc: 'Classifica cada km de rodovia em 4 níveis (Livre, Atenção, Alto, Crítico) usando Random Forest treinado com 18k+ ocorrências.',
              color: COLORS.green,
            },
            {
              Icon: Brain,
              title: 'NLP Semântico',
              desc: 'AWS Comprehend + fallback local analisam narrativas de acidentes e aplicam boost de severidade (+1/+2) ao score.',
              color: COLORS.cyan,
            },
            {
              Icon: Route,
              title: 'Rota Segura',
              desc: 'Algoritmo de Dijkstra em grafo com pesos de risco encontra a trajeto mais seguro entre dois pontos, comparando com a rota direta.',
              color: COLORS.amber,
            },
          ].map((item, i) => (
            <motion.div
              key={item.title}
              className="rounded-2xl p-7 text-center flex flex-col items-center gap-4"
              style={{
                background: `${item.color}06`,
                border: `1px solid ${item.color}18`,
              }}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 * i, duration: 0.5 }}
            >
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center"
                style={{ background: `${item.color}10`, border: `1px solid ${item.color}25` }}
              >
                <item.Icon size={26} style={{ color: item.color }} />
              </div>
              <h3 className="font-display font-bold text-lg" style={{ color: item.color }}>
                {item.title}
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: COLORS.muted }}>
                {item.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </Slide>
    ),
  },

  // ── Slide 4: Regras de Negócio ──────────────────────────────────
  {
    id: 'regras',
    content: (
      <Slide>
        <div className="mb-10">
          <SectionSubtitle>Regras de Negócio</SectionSubtitle>
          <SectionTitle>Níveis de Risco e Critérios</SectionTitle>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <p className="text-sm leading-relaxed mb-5" style={{ color: COLORS.muted }}>
              Cada segmento de rodovia recebe um score de 0 a 3 baseado na <strong style={{ color: COLORS.text }}>gravidade dos acidentes históricos</strong> e contexto atual:
            </p>

            <div className="flex flex-col gap-3">
              {[
                { score: 0, label: 'Livre', color: COLORS.green, desc: 'Sem acidentes ou sem vítimas no trecho', penalty: '0%' },
                { score: 1, label: 'Atenção', color: COLORS.amber, desc: 'Feridos leves registrados', penalty: '+50%' },
                { score: 2, label: 'Alto', color: '#f97316', desc: 'Feridos graves no histórico', penalty: '+200%' },
                { score: 3, label: 'Crítico', color: COLORS.red, desc: 'Óbitos no trecho', penalty: '+500%' },
              ].map((item) => (
                <div
                  key={item.score}
                  className="flex items-center gap-4 rounded-xl p-4"
                  style={{ background: `${item.color}06`, border: `1px solid ${item.color}15` }}
                >
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center font-mono font-bold text-sm flex-shrink-0"
                    style={{ background: `${item.color}15`, color: item.color }}
                  >
                    {item.score}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-display font-semibold text-sm" style={{ color: item.color }}>
                        {item.label}
                      </span>
                    </div>
                    <div className="text-xs" style={{ color: COLORS.muted }}>
                      {item.desc}
                    </div>
                  </div>
                  <div className="font-mono text-xs flex-shrink-0" style={{ color: item.color }}>
                    {item.penalty}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div
              className="rounded-2xl p-7"
              style={{ background: `${COLORS.cyan}04`, border: `1px solid ${COLORS.cyan}12` }}
            >
              <h4 className="font-display font-semibold text-sm mb-4 flex items-center gap-2" style={{ color: COLORS.cyan }}>
                <Zap size={16} />
                Regras de Pontuação
              </h4>
              <BulletList
                items={[
                  'Score final = <strong>min(3, score_ml + boost_nlp)</strong> — nunca ultrapassa 3',
                  'NLP aplica <strong>+2</strong> para termos críticos (morto, fatal, óbito)',
                  'NLP aplica <strong>+1</strong> para feridos graves, UTI, resgate',
                  'Alertas disparados apenas se score ≥ <strong>2</strong> (Alto)',
                  'Deduplicação de alertas em janela de <strong>30 min</strong>',
                ]}
                color={COLORS.cyan}
              />
            </div>
          </div>
        </div>
      </Slide>
    ),
  },

  // ── Slide 5: Arquitetura ────────────────────────────────────────
  {
    id: 'arquitetura',
    content: (
      <Slide>
        <div className="mb-10 text-center">
          <SectionSubtitle>Arquitetura</SectionSubtitle>
          <SectionTitle>Pipeline em 3 Camadas</SectionTitle>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            {
              num: '01',
              title: 'ML Scoring',
              tech: 'Random Forest · scikit-learn',
              desc: '21 features combinando dados ARTESP com eventos naturais NASA EONET e clima em tempo real. Classifica 0-3.',
              items: ['21 features (ARTESP + NASA + clima)', '4 classes de severidade', 'StandardScaler + RF'],
              color: COLORS.green,
            },
            {
              num: '02',
              title: 'NLP Semântico',
              tech: 'AWS Comprehend · LocalNLP',
              desc: 'Análise de narrativas de acidentes em português. Boost de +1/+2 no score baseado em severidade textual.',
              items: ['Sentimento + entidades', 'Fallback keyword PT-BR', 'Boost max +2'],
              color: COLORS.cyan,
            },
            {
              num: '03',
              title: 'Roteamento',
              tech: 'NetworkX · Dijkstra',
              desc: 'Grafo de rodovias com peso = distância × (1 + penalidade_risco). Rota segura vs rota direta.',
              items: ['Pesos de risco dinâmicos', 'Comparação safe × direct', 'Alertas via SNS'],
              color: COLORS.amber,
            },
          ].map((layer, i) => (
            <motion.div
              key={layer.num}
              className="rounded-2xl p-7"
              style={{
                background: `${layer.color}06`,
                border: `1px solid ${layer.color}18`,
              }}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 * i, duration: 0.5 }}
            >
              <div
                className="font-mono font-bold text-6xl mb-5 select-none"
                style={{ color: layer.color, opacity: 0.1 }}
              >
                {layer.num}
              </div>
              <h3 className="font-display font-bold text-xl mb-1" style={{ color: layer.color }}>
                {layer.title}
              </h3>
              <div className="font-mono text-[0.6rem] mb-4" style={{ color: COLORS.muted }}>
                {layer.tech}
              </div>
              <p className="text-sm leading-relaxed mb-6" style={{ color: COLORS.muted }}>
                {layer.desc}
              </p>
              <div className="flex flex-col gap-2">
                {layer.items.map((item) => (
                  <div key={item} className="flex items-center gap-2 text-xs" style={{ color: COLORS.text }}>
                    <span className="w-1 h-1 rounded-full flex-shrink-0" style={{ background: layer.color }} />
                    {item}
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </Slide>
    ),
  },

  // ── Slide 6: Algoritmos ML ──────────────────────────────────────
  {
    id: 'ml',
    content: (
      <Slide>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
          <div>
            <SectionSubtitle>Algoritmo</SectionSubtitle>
            <SectionTitle>Random Forest Classifier</SectionTitle>

            <div className="flex gap-2 flex-wrap mb-5">
              <Tag label="n_estimators: 200" color={COLORS.cyan} />
              <Tag label="max_depth: 15" color={COLORS.cyan} />
              <Tag label="class_weight: balanced" color={COLORS.cyan} />
              <Tag label="StratifiedKFold (5)" color={COLORS.amber} />
            </div>

            <p className="text-sm leading-relaxed mb-5" style={{ color: COLORS.muted }}>
              Conjunto de 200 árvores de decisão treinadas com <strong style={{ color: COLORS.text }}>18.514 registros</strong> 
              de ocorrências CCM-ARTESP. Cada árvore vota, e a classe mais votada é o score final.
            </p>

            <h4 className="font-display font-semibold text-sm mb-3" style={{ color: COLORS.cyan }}>
              21 Features de Entrada
            </h4>
            <div className="flex flex-wrap gap-2">
              {['hour', 'day_of_week', 'is_weekend', 'month', 'km_mid', 'has_blockage',
                'feridos_leves', 'feridos_graves', 'mortos',
                'road_id_encoded', 'class_encoded', 'subclass_encoded',
                'accident_type_encoded', 'concessionaire_encoded', 'municipio_encoded',
                'nearest_eonet_distance_km', 'has_nearby_eonet',
                'precipitation_mm', 'wind_speed_ms', 'temperature_c', 'humidity',
              ].map((f) => (
                <span
                  key={f}
                  className="font-mono text-[0.6rem] px-2 py-1 rounded-md"
                  style={{ background: `${COLORS.cyan}08`, border: `1px solid ${COLORS.cyan}12`, color: COLORS.muted }}
                >
                  {f}
                </span>
              ))}
            </div>
          </div>

          <div
            className="rounded-2xl p-7"
            style={{ background: `${COLORS.amber}04`, border: `1px solid ${COLORS.amber}12` }}
          >
            <h4 className="font-display font-semibold text-sm mb-4 flex items-center gap-2" style={{ color: COLORS.amber }}>
              <Cpu size={16} />
              Treinamento
            </h4>
            <BulletList
              items={[
                'Split 80/20 com <strong>estratificação</strong> por classe',
                'Pipeline: <strong>StandardScaler</strong> → RandomForest',
                'Validação cruzada <strong>5-fold</strong> com F1-macro',
                'Extração de <strong>feature importance</strong> pós-treino',
                'Feature <strong>class_encoded</strong> com 94,3% de importância',
              ]}
              color={COLORS.amber}
            />
          </div>
        </div>
      </Slide>
    ),
  },

  // ── Slide 7: Algoritmos NLP + Routing ───────────────────────────
  {
    id: 'nlp-routing',
    content: (
      <Slide>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* NLP */}
          <div
            className="rounded-2xl p-7"
            style={{ background: `${COLORS.cyan}04`, border: `1px solid ${COLORS.cyan}12` }}
          >
            <div className="flex items-center gap-3 mb-5">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ background: `${COLORS.cyan}10`, border: `1px solid ${COLORS.cyan}25` }}
              >
                <Brain size={20} style={{ color: COLORS.cyan }} />
              </div>
              <div>
                <h3 className="font-display font-semibold text-base" style={{ color: COLORS.cyan }}>
                  NLP Semântico
                </h3>
                <div className="font-mono text-[0.55rem]" style={{ color: COLORS.muted }}>
                  AWS Comprehend · LocalNLP PT-BR
                </div>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <div
                className="rounded-xl p-4"
                style={{ background: `${COLORS.red}06`, border: `1px solid ${COLORS.red}15` }}
              >
                <div className="font-mono text-[0.6rem] font-semibold mb-1" style={{ color: COLORS.red }}>
                  CRÍTICO (+2)
                </div>
                <div className="font-mono text-[0.55rem]" style={{ color: COLORS.muted }}>
                  morto, óbito, vítima fatal, faleceu, morte, fatal
                </div>
              </div>
              <div
                className="rounded-xl p-4"
                style={{ background: `${COLORS.amber}06`, border: `1px solid ${COLORS.amber}15` }}
              >
                <div className="font-mono text-[0.6rem] font-semibold mb-1" style={{ color: COLORS.amber }}>
                  ALTO (+1)
                </div>
                <div className="font-mono text-[0.55rem]" style={{ color: COLORS.muted }}>
                  ferido grave, UTI, internado, presos às ferragens, resgate, bombeiros
                </div>
              </div>
              <div
                className="rounded-xl p-4"
                style={{ background: `${COLORS.cyan}06`, border: `1px solid ${COLORS.cyan}15` }}
              >
                <div className="font-mono text-[0.6rem] font-semibold mb-1" style={{ color: COLORS.cyan }}>
                  BLOQUEIO (+1)
                </div>
                <div className="font-mono text-[0.55rem]" style={{ color: COLORS.muted }}>
                  bloqueio total, interditado, fechado, sem passagem
                </div>
              </div>
            </div>

            <p className="text-xs leading-relaxed" style={{ color: COLORS.muted }}>
              Score final = <strong style={{ color: COLORS.text }}>min(3, score_base + max_boost)</strong>
            </p>
          </div>

          {/* Routing */}
          <div
            className="rounded-2xl p-7"
            style={{ background: `${COLORS.amber}04`, border: `1px solid ${COLORS.amber}12` }}
          >
            <div className="flex items-center gap-3 mb-5">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ background: `${COLORS.amber}10`, border: `1px solid ${COLORS.amber}25` }}
              >
                <Route size={20} style={{ color: COLORS.amber }} />
              </div>
              <div>
                <h3 className="font-display font-semibold text-base" style={{ color: COLORS.amber }}>
                  Roteamento Dijkstra
                </h3>
                <div className="font-mono text-[0.55rem]" style={{ color: COLORS.muted }}>
                  NetworkX · Grafo com pesos de risco
                </div>
              </div>
            </div>

            <div className="space-y-4 mb-5">
              <div
                className="rounded-xl p-4"
                style={{ background: `${COLORS.cyan}06`, border: `1px solid ${COLORS.cyan}15` }}
              >
                <div className="font-mono text-[0.6rem] font-semibold mb-2" style={{ color: COLORS.cyan }}>
                  Função de Peso
                </div>
                <code className="font-mono text-xs block leading-relaxed" style={{ color: COLORS.text }}>
                  weight = dist_km × (1 + RISK_PENALTY[score])
                </code>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { score: 0, penalty: '0%', color: COLORS.green },
                  { score: 1, penalty: '+50%', color: COLORS.amber },
                  { score: 2, penalty: '+200%', color: '#f97316' },
                  { score: 3, penalty: '+500%', color: COLORS.red },
                ].map((item) => (
                  <div
                    key={item.score}
                    className="rounded-lg p-3 text-center"
                    style={{ background: `${item.color}06`, border: `1px solid ${item.color}15` }}
                  >
                    <div className="font-mono text-xs font-bold" style={{ color: item.color }}>
                      Score {item.score}
                    </div>
                    <div className="font-mono text-[0.55rem]" style={{ color: COLORS.muted }}>
                      +{item.penalty}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <p className="text-xs leading-relaxed" style={{ color: COLORS.muted }}>
              Retorna <strong style={{ color: COLORS.text }}>2 rotas</strong>: a mais segura (menor risco acumulado) e a mais curta (distância pura), com comparação de overhead.
            </p>
          </div>
        </div>
      </Slide>
    ),
  },

  // ── Slide 8: Infraestrutura AWS ─────────────────────────────────
  {
    id: 'infra',
    content: (
      <Slide>
        <div className="mb-10 text-center">
          <SectionSubtitle>Infraestrutura</SectionSubtitle>
          <SectionTitle>Pipeline Serverless AWS</SectionTitle>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { Icon: Cloud, title: 'Scraper', desc: 'Lambda (cron */5min) coleta ARTESP + NASA EONET + clima', color: COLORS.cyan },
            { Icon: Brain, title: 'Inference', desc: 'Lambda SQS carrega modelo e prediz risco', color: COLORS.green },
            { Icon: Bell, title: 'Alerter', desc: 'Lambda SQS → SNS com dedup 30min', color: COLORS.amber },
            { Icon: Globe, title: 'API', desc: 'FastAPI + API Gateway HTTP', color: COLORS.cyan },
          ].map((item, i) => (
            <motion.div
              key={item.title}
              className="rounded-xl p-5 text-center"
              style={{ background: `${item.color}06`, border: `1px solid ${item.color}15` }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * i, duration: 0.4 }}
            >
              <item.Icon size={22} style={{ color: item.color }} className="mb-3" />
              <div className="font-display font-semibold text-sm mb-1" style={{ color: item.color }}>
                {item.title}
              </div>
              <div className="text-[0.65rem] leading-relaxed" style={{ color: COLORS.muted }}>
                {item.desc}
              </div>
            </motion.div>
          ))}
        </div>

        <div
          className="rounded-2xl p-6"
          style={{ background: `${COLORS.cyan}03`, border: `1px solid ${COLORS.cyan}10` }}
        >
          <h4 className="font-display font-semibold text-sm mb-4 flex items-center gap-2" style={{ color: COLORS.cyan }}>
            <Warehouse size={16} />
            Tech Stack
          </h4>
          <div className="flex flex-wrap gap-2">
            {[
              'Python 3.11', 'FastAPI', 'scikit-learn', 'pandas', 'PostgreSQL',
              'Redis', 'MongoDB', 'AWS Lambda', 'SQS', 'SNS', 'S3',
              'NetworkX', 'GeoPandas', 'Docker', 'Serverless Framework',
              'React 19', 'TypeScript', 'Vite', 'Tailwind CSS', 'Motion',
            ].map((t) => (
              <span
                key={t}
                className="px-2.5 py-0.5 rounded-full font-mono text-[0.55rem] tracking-wide"
                style={{
                  border: '1px solid rgba(0,212,255,0.15)',
                  color: COLORS.cyan,
                  background: 'rgba(0,212,255,0.04)',
                }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      </Slide>
    ),
  },

  // ── Slide 9: Pipeline ───────────────────────────────────────────
  {
    id: 'pipeline',
    content: (
      <Slide>
        <div className="mb-10 text-center">
          <SectionSubtitle>Fluxo de Dados</SectionSubtitle>
          <SectionTitle>Pipeline de Ponta a Ponta</SectionTitle>
        </div>

        <div className="flex flex-col gap-3 max-w-3xl mx-auto">
          {[
            { Icon: Satellite, title: 'Coleta', desc: 'ARTESP (scraping) + NASA EONET (eventos naturais) + clima (Open-Meteo) a cada 5 min', color: COLORS.cyan },
            { Icon: Cloud, title: 'Armazenamento', desc: 'S3 (raw) → PostgreSQL (estruturado) → Redis (cache TTL 120s)', color: COLORS.cyan },
            { Icon: Cpu, title: 'Inferência', desc: 'SQS → Lambda carrega modelo RF (275MB) → prediz score → atualiza cache + DB', color: COLORS.green },
            { Icon: Brain, title: 'NLP Boost', desc: 'AWS Comprehend ou LocalNLP analisa narrativa → boost +1/+2', color: COLORS.cyan },
            { Icon: Route, title: 'Roteamento', desc: 'POST /route/optimize → Dijkstra no grafo → safe route vs direct route', color: COLORS.amber },
            { Icon: Bell, title: 'Alerta', desc: 'Score ≥ 2 → SQS → Lambda → SNS → notificação com dedup 30min', color: COLORS.red },
          ].map((step, i) => (
            <motion.div
              key={step.title}
              className="flex items-center gap-4 rounded-xl p-4"
              style={{ background: `${step.color}04`, border: `1px solid ${step.color}12` }}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 * i, duration: 0.4 }}
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: `${step.color}10`, border: `1px solid ${step.color}20` }}
              >
                <step.Icon size={18} style={{ color: step.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-display font-semibold text-sm" style={{ color: step.color }}>
                  {step.title}
                </div>
                <div className="text-xs mt-0.5" style={{ color: COLORS.muted }}>
                  {step.desc}
                </div>
              </div>
              <div
                className="font-mono text-[0.55rem] flex-shrink-0 px-2 py-1 rounded"
                style={{ background: `${step.color}08`, color: step.color }}
              >
                {String(i + 1).padStart(2, '0')}
              </div>
            </motion.div>
          ))}
        </div>
      </Slide>
    ),
  },

  // ── Slide 10: Demonstração ──────────────────────────────────────
  {
    id: 'demo',
    content: (
      <Slide>
        <div className="text-center mb-10">
          <SectionSubtitle>Demonstração</SectionSubtitle>
          <SectionTitle>Funcionalidades Implementadas</SectionTitle>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
          {[
            { Icon: Map, title: 'Dashboard', desc: 'KPIs em tempo real com mapa de calor de risco', color: COLORS.cyan },
            { Icon: Map, title: 'Mapa Interativo', desc: 'Leaflet com marcadores de ocorrências e nível de risco', color: COLORS.green },
            { Icon: Route, title: 'Comparador de Rotas', desc: 'Rota segura vs rota direta com km overhead', color: COLORS.amber },
            { Icon: Bell, title: 'Central de Alertas', desc: 'Feed de alertas críticos com filtros', color: COLORS.red },
            { Icon: BarChart3, title: 'Painel Admin', desc: 'Gráficos, tabelas e métricas do modelo', color: COLORS.cyan },
            { Icon: GitBranch, title: 'Pipeline Monitor', desc: 'Status das Lambdas, filas SQS e logs CloudWatch', color: COLORS.amber },
          ].map((item, i) => (
            <motion.div
              key={item.title}
              className="flex items-center gap-4 rounded-xl p-5"
              style={{ background: `${item.color}04`, border: `1px solid ${item.color}12` }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 * i, duration: 0.4 }}
            >
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: `${item.color}10`, border: `1px solid ${item.color}20` }}
              >
                <item.Icon size={22} style={{ color: item.color }} />
              </div>
              <div>
                <div className="font-display font-semibold text-sm" style={{ color: item.color }}>
                  {item.title}
                </div>
                <div className="text-xs mt-0.5" style={{ color: COLORS.muted }}>
                  {item.desc}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </Slide>
    ),
  },

  // ── Slide 11: Obrigado ───────────────────────────────────────────
  {
    id: 'fim',
    content: (
      <Slide>
        <div className="text-center">
          <motion.div
            className="flex justify-center mb-8"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          >
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center"
              style={{ background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.25)' }}
            >
              <Satellite size={40} style={{ color: COLORS.cyan }} />
            </div>
          </motion.div>

          <SectionTitle>Obrigado!</SectionTitle>
          <p className="text-sm md:text-base mb-6" style={{ color: COLORS.muted }}>
            Dúvidas?
          </p>

          <div className="flex justify-center gap-4 flex-wrap">
            <Tag label="Gabriel Oliveira" color={COLORS.cyan} />
            <Tag label="Roberson Pedrosa" color={COLORS.cyan} />
            <Tag label="Samuel Nicolas" color={COLORS.cyan} />
            <Tag label="Arthur Bruttel" color={COLORS.cyan} />
            <Tag label="Jonatan Viotti" color={COLORS.cyan} />
            <Tag label="Vinicius S." color={COLORS.cyan} />
          </div>

          <motion.div
            className="mt-10 font-mono text-[0.6rem]"
            style={{ color: COLORS.muted }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            FIAP Global Solution 2 · 2026 · Campus Paulista
          </motion.div>
        </div>
      </Slide>
    ),
  },
]

export default function PresentationPage() {
  const [current, setCurrent] = useState(0)
  const [direction, setDirection] = useState(0)
  const [fullscreen, setFullscreen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const total = slides.length

  const goTo = useCallback((next: number, dir: number) => {
    if (next < 0 || next >= total) return
    setDirection(dir)
    setCurrent(next)
  }, [total])

  const next = useCallback(() => goTo(current + 1, 1), [current, goTo])
  const prev = useCallback(() => goTo(current - 1, -1), [current, goTo])

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === ' ') {
        e.preventDefault()
        next()
      }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault()
        prev()
      }
      if (e.key === 'f') {
        setFullscreen(prev => !prev)
        if (fullscreen) document.exitFullscreen?.()
        else containerRef.current?.requestFullscreen?.()
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [next, prev, fullscreen])

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 overflow-hidden"
      style={{ background: COLORS.bg }}
    >
      {/* Slide area */}
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={current}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="absolute inset-0 flex items-center justify-center"
        >
          {slides[current].content}
        </motion.div>
      </AnimatePresence>

      {/* Bottom bar */}
      <div
        className="absolute bottom-0 left-0 right-0 px-6 py-4 flex items-center justify-between"
        style={{
          background: 'linear-gradient(transparent, rgba(2,4,8,0.95))',
        }}
      >
        {/* Slide counter */}
        <div className="flex items-center gap-3">
          <button
            onClick={prev}
            disabled={current === 0}
            className="p-1.5 rounded-lg transition-opacity disabled:opacity-20 hover:opacity-80"
            style={{ color: COLORS.cyan }}
          >
            <ChevronLeft size={18} />
          </button>

          <span className="font-mono text-xs" style={{ color: COLORS.muted }}>
            {String(current + 1).padStart(2, '0')}
            <span style={{ color: 'rgba(100,116,139,0.4)' }}> / {String(total).padStart(2, '0')}</span>
          </span>

          <button
            onClick={next}
            disabled={current === total - 1}
            className="p-1.5 rounded-lg transition-opacity disabled:opacity-20 hover:opacity-80"
            style={{ color: COLORS.cyan }}
          >
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Progress dots */}
        <div className="flex gap-1.5">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i, i > current ? 1 : -1)}
              className="rounded-full transition-all"
              style={{
                width: i === current ? 20 : 6,
                height: 6,
                background: i === current ? COLORS.cyan : 'rgba(100,116,139,0.25)',
              }}
            />
          ))}
        </div>

        {/* Fullscreen hint */}
        <div className="font-mono text-[0.55rem] flex items-center gap-2" style={{ color: COLORS.muted }}>
          <span>← →</span>
          <span className="px-1.5 py-0.5 rounded" style={{ background: 'rgba(100,116,139,0.1)', border: '1px solid rgba(100,116,139,0.15)' }}>
            F
          </span>
          <span>fullscreen</span>
        </div>
      </div>
    </div>
  )
}
