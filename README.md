# Chanchito

Ahorro grupal en USD₮. Un grupo de amigos pone plata para una meta común, el
ahorro genera rendimiento mientras esperan, y al cumplirse cada uno retira su
parte más la ganancia.

**Nadie necesita tener ETH.** La comisión de red se paga en el mismo USD₮ que
se está ahorrando, con el módulo gasless de WDK.

---

## Por qué usamos WDK gasless

No es una optimización de costos: **es la diferencia entre tener producto y no
tenerlo.**

Chanchito apunta a alguien que nunca usó cripto. Esa persona abre la app, se le
crea una wallet, recibe USD₮ de un amigo… y no puede depositar, porque le falta
un segundo activo que no entiende y que tiene que ir a comprar a otro lado. Ahí
se termina el recorrido.

Con `@tetherto/wdk-wallet-evm-7702-gasless`:

- La comisión se paga en **USD₮**, no en ETH.
- `approve` + `join` viajan como **una sola operación** (EIP-7702), así que se
  firma una vez en vez de dos.
- La dirección **no cambia**: 7702 delega una cuenta existente en vez de crear
  una nueva.

Verificado en Sepolia: después de depositar, el saldo de ETH de la cuenta quedó
**idéntico**. Ver [POR-QUE-GASLESS.md](./POR-QUE-GASLESS.md) para el análisis
completo, incluida la economía real (qué cuesta, quién lo paga, y por qué esto
pertenece a una L2).

## Dónde está la integración de WDK

| Qué | Archivo |
| --- | --- |
| **Capa de firma sobre WDK** | [`src/api/wdk.ts`](src/api/wdk.ts) |
| Depósito gasless batcheado (`approve` + `join` en una operación) | [`src/api/contracts.ts`](src/api/contracts.ts) → `depositToPool` |
| Crear, salir, cerrar y enviar, todo por WDK | [`src/api/contracts.ts`](src/api/contracts.ts) |
| Registro social (nombre, amigos) por WDK | [`src/api/social.ts`](src/api/social.ts) → `write` |
| Cotización de la comisión en USD₮ antes de firmar | [`src/api/use-gas-quote.ts`](src/api/use-gas-quote.ts) |
| Resolución de `sodium-native` → `sodium-javascript` para React Native | [`metro.config.js`](metro.config.js) |

**WDK reemplazó la capa de firma, no se sumó al lado.** El firmante anterior
(viem `WalletClient`) fue eliminado del proyecto: no quedó código muerto ni un
camino paralelo. Todas las escrituras de la app pasan por `sendGasless`.

### Paquetes de WDK instalados

```
@tetherto/wdk-wallet-evm-7702-gasless   1.0.0-beta.4
```

Arrastra `@tetherto/wdk-wallet`, `@tetherto/wdk-wallet-evm` y
`@tetherto/wdk-failover-provider` como dependencias.

### Un detalle que costó encontrar

WDK usa `sodium-universal` para el manejo seguro de claves en memoria, que en
Node resuelve a `sodium-native` — una extensión en C++ que no existe en React
Native. El propio paquete ya declara la alternativa en JavaScript puro en su
campo `browser`, pero Metro no lo lee para paquetes anidados. Se resuelve con
cinco líneas en [`metro.config.js`](metro.config.js).

---

## Red y contratos

Todo corre en **Ethereum Sepolia** (chain ID `11155111`).

| | Dirección |
| --- | --- |
| USD₮ (el que acepta el paymaster de Candide) | `0xd077a400968890eacc75cdc901f0356c943e4fdb` |
| PoolFactory | `0x6057180c135760421085621d24c4ef53d4eb65be` |
| SocialRegistry | `0xaaac417114ff2429fb722da93179702f64417fcd` |
| Delegación EIP-7702 | `0xe6Cae83BdE06E4c305530e199D7217f42808555B` |
| Bundler + paymaster | Candide, `api.candide.dev/api/v3/11155111` |

El USD₮ se consigue en el faucet del dashboard de Candide. **Es un token
distinto del USDT de Aave**: tiene que ser el mismo con el que el paymaster
cobra el gas, o el usuario necesitaría dos saldos.

Los contratos están en [`../chanchito-contracts`](../chanchito-contracts), con
46 tests.

## Cómo correrlo desde cero

```bash
npm install
cp .env.example .env     # completar RPC y project id de WalletConnect
npm run android          # o `npm run android:usb` si el teléfono está por cable
```

Necesitás:

- Node 22.18+
- Un RPC de Sepolia (Alchemy o Infura, gratis)
- Una API key de [Candide](https://dashboard.candide.dev) para el paymaster
- USD₮ del faucet de Candide en la wallet que genera la app

Sin las direcciones de contrato en el `.env`, la app arranca igual contra un
backend simulado — útil para desarrollar sin red.

## Cómo está armado

```
src/
  api/
    wdk.ts          ← la capa de firma, sobre WDK
    contracts.ts    lecturas y escrituras de los chanchitos
    social.ts       nombres de usuario y amistades
    source.ts       decide entre cadena y mock
  app/              27 pantallas (expo-router)
  lib/money.ts      la plata, en enteros (26 pruebas)
  lib/pool.ts       todo el texto derivado del estado
```

Dos decisiones que sostienen el resto:

**La plata nunca es un `number`.** En punto flotante `0,1 + 0,2` no da `0,3`, y
con saldos de usuarios eso termina en descuadres imposibles de rastrear. Todo
va en enteros de USD₮.

**Los datos no guardan texto ya armado.** Del contrato llegan números y
timestamps; frases como "quedan 6 días" se calculan al dibujar, así no
envejecen.

## Las reglas del producto

- Todos ponen entre el mínimo y el máximo del chanchito.
- **El chanchito no genera nada hasta llenarse.** La plata queda quieta y el
  plazo recién arranca cuando entra el último participante.
- Si salís antes: **recuperás tu capital completo** y resignás la ganancia.
- El rendimiento normal se reparte **proporcional** a lo puesto.
- Lo que resigna quien se va se reparte **en partes iguales** entre los que
  quedan, menos un **10%** para la plataforma.
- Si nunca se llena, cada uno retira todo **sin comisión**.

Cada una de esas reglas tiene su test en `../chanchito-contracts/test`.
