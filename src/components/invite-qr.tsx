import { useMemo } from 'react';
import { View } from 'react-native';
import Svg, { Rect } from 'react-native-svg';

import { QR_SIZE, qrRows } from '@/lib/qr';
import { colors } from '@/theme/tokens';

/** QR decorativo del mockup, dibujado celda por celda. */
export function InviteQr({ code, size = 172 }: { code: string; size?: number }) {
  const rows = useMemo(() => qrRows(code), [code]);
  const inner = size - 18; // padding de 9px como en el HTML
  const cell = inner / QR_SIZE;

  return (
    <View
      className="items-center justify-center self-center rounded-[14px] border-[3px] border-ink bg-paper p-[9px]"
      style={{ width: size, height: size }}
    >
      <Svg width={inner} height={inner}>
        {rows.map((cells, r) =>
          cells.map((on, c) =>
            on ? (
              <Rect
                key={`${r}-${c}`}
                x={c * cell}
                y={r * cell}
                width={cell}
                height={cell}
                fill={colors.ink}
              />
            ) : null,
          ),
        )}
      </Svg>
    </View>
  );
}
