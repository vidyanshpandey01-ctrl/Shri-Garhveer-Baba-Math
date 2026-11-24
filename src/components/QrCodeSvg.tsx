import { useMemo } from 'react';
import { generateQrMatrix } from '../utils/mathLogic';

interface QrCodeSvgProps {
  value: string;
  size?: number;
  label?: string;
}

export function QrCodeSvg({ value, size = 160, label = 'QR Code' }: QrCodeSvgProps) {
  const matrix = useMemo(() => generateQrMatrix(value, 25), [value]);
  const cells = matrix.length;
  const quietZone = 2;
  const totalView = cells + quietZone * 2;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${totalView} ${totalView}`}
      role="img"
      aria-label={label}
      className="bg-white rounded-lg border border-[#E6E2DA]"
    >
      <rect x={0} y={0} width={totalView} height={totalView} fill="#FFFFFF" />
      {matrix.map((row, rIdx) =>
        row.map((filled, cIdx) =>
          filled ? (
            <rect
              key={`${rIdx}-${cIdx}`}
              x={cIdx + quietZone}
              y={rIdx + quietZone}
              width={0.92}
              height={0.92}
              rx={0.14}
              fill="#1E1B18"
            />
          ) : null,
        ),
      )}
    </svg>
  );
}
