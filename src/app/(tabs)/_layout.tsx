import { Tabs } from 'expo-router';
import type { ComponentProps } from 'react';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ChanchitoMascot } from '@/components/chanchito-mascot';
import { HomeIcon, ProfileIcon, SearchIcon } from '@/components/tab-icons';
import { HardPressable } from '@/components/ui';
import { colors } from '@/theme/tokens';

const ACTIVE = colors.pink;
const IDLE = colors.tabIdle;

/** El tipo de la tab bar sale del propio `Tabs` de expo-router. */
type TabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];

function TabBar({ state, navigation }: TabBarProps) {
  const insets = useSafeAreaInsets();

  const items = [
    { name: 'index', label: 'Home', render: (c: string) => <HomeIcon color={c} /> },
    { name: 'search', label: 'Buscar', render: (c: string) => <SearchIcon color={c} /> },
    {
      name: 'mine',
      label: 'Mis chanchitos',
      render: (c: string) => (
        <View style={{ opacity: c === ACTIVE ? 1 : 0.6 }}>
          <ChanchitoMascot mood="normal" size={24} />
        </View>
      ),
    },
    { name: 'profile', label: 'Perfil', render: (c: string) => <ProfileIcon color={c} /> },
  ];

  return (
    <View
      className="flex-row items-center justify-around bg-ink px-2.5 pt-3"
      style={{ paddingBottom: Math.max(insets.bottom, 14) }}
    >
      {items.map((item) => {
        const routeIndex = state.routes.findIndex((r: { name: string }) => r.name === item.name);
        const focused = state.index === routeIndex;
        const color = focused ? ACTIVE : IDLE;

        return (
          <HardPressable
            key={item.name}
            flat
            haptic
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={item.label}
            onPress={() => navigation.navigate(state.routes[routeIndex].name)}
            container="flex-1"
            className="items-center gap-[3px]"
          >
            <View className="h-[22px] w-[22px] items-center justify-center">
              {item.render(color)}
            </View>
            <Text className="font-body-bold text-[9px]" style={{ color }}>
              {item.label}
            </Text>
          </HardPressable>
        );
      })}
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        // Sin esto, el hueco entre escenas al cambiar de tab se ve blanco.
        sceneStyle: { backgroundColor: colors.cream },
        freezeOnBlur: true,
        animation: 'shift',
      }}
      tabBar={(props) => <TabBar {...props} />}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="search" />
      <Tabs.Screen name="mine" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
