import { useState } from 'react';
import { RefreshControl } from 'react-native';
import type { UseQueryResult } from '@tanstack/react-query';

import { colors } from '@/theme/tokens';

/**
 * Deslizar hacia abajo para recargar.
 *
 * @dev Espera a que TODAS las consultas terminen antes de soltar el indicador.
 *      Si se soltara al primer `refetch`, el gesto se sentiría instantáneo y el
 *      usuario no sabría si los datos se actualizaron o no — con una cadena de
 *      por medio, esa duda importa.
 */
export function useRefresh(...queries: Pick<UseQueryResult, 'refetch'>[]) {
  const [refreshing, setRefreshing] = useState(false);

  async function onRefresh() {
    setRefreshing(true);
    try {
      await Promise.all(queries.map((q) => q.refetch()));
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <RefreshControl
      refreshing={refreshing}
      onRefresh={onRefresh}
      tintColor={colors.pink}
      colors={[colors.pink]}
      progressBackgroundColor={colors.paper}
    />
  );
}
