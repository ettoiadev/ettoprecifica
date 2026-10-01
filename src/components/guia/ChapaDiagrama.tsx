import React from 'react';

// Desenho vetorial (SVG) de uma chapa e do aproveitamento dela em peças.
// O SVG é GERADO AQUI a partir de números — o conteúdo do guia nunca é
// interpretado como HTML/SVG, então não há risco de injeção pelo texto que o
// usuário digita (ver docs/GUIA.md).
export interface ChapaSpec {
  larguraCm: number;
  alturaCm: number;
  pecaLarguraCm?: number;
  pecaAlturaCm?: number;
  legenda?: string;
}

const LARGURA_MAX = 520;
// Chapa sem peças desenhadas não precisa de área grande — seria um retângulo
// oco ocupando meia tela. Com peças, vale a altura maior para elas caberem.
const ALTURA_MAX_COM_PECAS = 260;
const ALTURA_MAX_VAZIA = 150;

const fmtCm = (v: number): string =>
  Number.isInteger(v) ? String(v) : v.toFixed(1).replace('.', ',');

const fmtM2 = (v: number): string => v.toFixed(2).replace('.', ',');

/** Quantas peças cabem, testando as duas orientações simples (sem girar peça a peça). */
const melhorAproveitamento = (W: number, H: number, w: number, h: number) => {
  const a = { cols: Math.floor(W / w), linhas: Math.floor(H / h), pw: w, ph: h };
  const b = { cols: Math.floor(W / h), linhas: Math.floor(H / w), pw: h, ph: w };
  const totalA = a.cols * a.linhas;
  const totalB = b.cols * b.linhas;
  return totalB > totalA ? { ...b, total: totalB } : { ...a, total: totalA };
};

const ChapaDiagrama: React.FC<{ spec: ChapaSpec }> = ({ spec }) => {
  // Desenha sempre com o lado maior na horizontal (como a chapa ficaria na bancada).
  const comprido = Math.max(spec.larguraCm, spec.alturaCm);
  const curto = Math.min(spec.larguraCm, spec.alturaCm);
  if (!(comprido > 0) || !(curto > 0)) return null;

  const temPeca = !!spec.pecaLarguraCm && !!spec.pecaAlturaCm;
  const fit = temPeca
    ? melhorAproveitamento(comprido, curto, spec.pecaLarguraCm!, spec.pecaAlturaCm!)
    : null;

  const alturaMax = fit && fit.total > 0 ? ALTURA_MAX_COM_PECAS : ALTURA_MAX_VAZIA;
  const escala = Math.min(LARGURA_MAX / comprido, alturaMax / curto);
  const W = comprido * escala;
  const H = curto * escala;

  const margemEsq = 46;
  const margemTopo = 28;
  const svgW = W + margemEsq + 16;
  const svgH = H + margemTopo + 16;

  const areaChapaM2 = (comprido / 100) * (curto / 100);
  const areaPecasM2 = fit
    ? (fit.total * (spec.pecaLarguraCm! / 100) * (spec.pecaAlturaCm! / 100))
    : 0;

  const pecas: React.ReactNode[] = [];
  if (fit && fit.total > 0) {
    for (let linha = 0; linha < fit.linhas; linha++) {
      for (let col = 0; col < fit.cols; col++) {
        pecas.push(
          <rect
            key={`${linha}-${col}`}
            x={margemEsq + col * fit.pw * escala + 1}
            y={margemTopo + linha * fit.ph * escala + 1}
            width={fit.pw * escala - 2}
            height={fit.ph * escala - 2}
            fill="#eef2ff"
            stroke="#818cf8"
            strokeWidth={1}
            rx={2}
          />
        );
      }
    }
  }

  const rotulo = `${fmtCm(comprido)} × ${fmtCm(curto)} cm`;

  return (
    <figure className="my-4 bg-gray-50 border border-gray-200 rounded-md p-4 overflow-x-auto">
      <svg
        viewBox={`0 0 ${svgW} ${svgH}`}
        // Chapa sem corte não precisa de desenho grande: como o SVG estica até
        // o limite mantendo a proporção, limitar a largura é o que encolhe a
        // altura sem distorcer as cotas.
        className={fit && fit.total > 0 ? 'w-full max-w-[560px] h-auto' : 'w-full max-w-[380px] h-auto'}
        role="img"
        aria-label={`Chapa de ${rotulo}${
          fit ? `, ${fit.total} peças de ${fmtCm(spec.pecaLarguraCm!)} por ${fmtCm(spec.pecaAlturaCm!)} cm` : ''
        }`}
      >
        {/* chapa */}
        <rect
          x={margemEsq}
          y={margemTopo}
          width={W}
          height={H}
          fill={fit && fit.total > 0 ? '#ffffff' : '#f8fafc'}
          stroke="#94a3b8"
          strokeWidth={1.5}
          rx={2}
        />
        {pecas}

        {/* chapa sem corte: mostra a área no meio, em vez de um retângulo vazio */}
        {!fit && (
          <text
            x={margemEsq + W / 2}
            y={margemTopo + H / 2 + 4}
            textAnchor="middle"
            fontSize={12}
            fill="#64748b"
          >
            {fmtM2((comprido / 100) * (curto / 100))} m²
          </text>
        )}

        {/* cota horizontal (em cima) */}
        <line x1={margemEsq} y1={margemTopo - 12} x2={margemEsq + W} y2={margemTopo - 12} stroke="#64748b" strokeWidth={1} />
        <line x1={margemEsq} y1={margemTopo - 16} x2={margemEsq} y2={margemTopo - 8} stroke="#64748b" strokeWidth={1} />
        <line x1={margemEsq + W} y1={margemTopo - 16} x2={margemEsq + W} y2={margemTopo - 8} stroke="#64748b" strokeWidth={1} />
        <text x={margemEsq + W / 2} y={margemTopo - 17} textAnchor="middle" fontSize={11} fill="#475569">
          {fmtCm(comprido)} cm
        </text>

        {/* cota vertical (à esquerda) */}
        <line x1={margemEsq - 14} y1={margemTopo} x2={margemEsq - 14} y2={margemTopo + H} stroke="#64748b" strokeWidth={1} />
        <line x1={margemEsq - 18} y1={margemTopo} x2={margemEsq - 10} y2={margemTopo} stroke="#64748b" strokeWidth={1} />
        <line x1={margemEsq - 18} y1={margemTopo + H} x2={margemEsq - 10} y2={margemTopo + H} stroke="#64748b" strokeWidth={1} />
        <text
          x={margemEsq - 20}
          y={margemTopo + H / 2}
          textAnchor="middle"
          fontSize={11}
          fill="#475569"
          transform={`rotate(-90 ${margemEsq - 20} ${margemTopo + H / 2})`}
        >
          {fmtCm(curto)} cm
        </text>

        {/* medida da peça, dentro da primeira peça */}
        {fit && fit.total > 0 && (
          <text
            x={margemEsq + (fit.pw * escala) / 2}
            y={margemTopo + (fit.ph * escala) / 2 + 4}
            textAnchor="middle"
            fontSize={11}
            fill="#3730a3"
          >
            {fmtCm(spec.pecaLarguraCm!)}×{fmtCm(spec.pecaAlturaCm!)}
          </text>
        )}
      </svg>

      <figcaption className="text-xs text-gray-600 mt-2 pt-2 border-t border-gray-200">
        {spec.legenda ? <span className="font-medium text-gray-800">{spec.legenda} · </span> : null}
        Chapa {rotulo} ({fmtM2(areaChapaM2)} m²)
        {fit && fit.total > 0 && (
          <>
            {' '}· cabem <strong>{fit.total}</strong> peças de {fmtCm(spec.pecaLarguraCm!)}×
            {fmtCm(spec.pecaAlturaCm!)} cm ({fit.cols}×{fit.linhas}) · sobra{' '}
            {fmtM2(areaChapaM2 - areaPecasM2)} m²
          </>
        )}
        {fit && fit.total === 0 && <> · a peça informada não cabe nesta chapa</>}
      </figcaption>
    </figure>
  );
};

export default ChapaDiagrama;
