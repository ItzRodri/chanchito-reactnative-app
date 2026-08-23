# Por qué Chanchito necesita gasless

## El problema que teníamos, y no era el precio del gas

Chanchito apunta a alguien que nunca usó cripto: quiere ahorrar con sus amigos
para un viaje, no aprender qué es una blockchain.

Esa persona abre la app, se le crea una wallet, y ahí choca contra una pared que
no tiene nada que ver con nuestro producto:

> Para depositar $50 en USD₮ primero necesitás comprar ETH.

No es que el gas sea caro. Es que **hay que tener un segundo activo que no
usás para nada**, que hay que ir a comprar a otro lado, entendiendo un concepto
—el gas— que no existe en ninguna app que esa persona haya usado antes.

Ahí se termina el recorrido. La app queda instalada y sin usar.

Y no se arregla "explicándolo mejor". Se arregla sacando el requisito.

## Los tres casos donde esto duele de verdad

Vale aclararlo porque el contraargumento razonable es: *"si consiguió USD₮,
también podía conseguir ETH"*. En estos tres no:

1. **Un amigo te manda USD₮.** No te manda ETH. Y ese es el caso más común en
   Chanchito, que es una app para usar entre conocidos.
2. **Comprás con tarjeta.** Los on-ramps entregan el stablecoin, no gas.
3. **Ya tenías USD₮ de antes.** Tener que mantener un saldo separado en otro
   activo, solo para poder mover el primero, es fricción pura.

## Qué cambia con el módulo gasless de WDK

Con `@tetherto/wdk-wallet-evm-7702-gasless`, la comisión de red se paga en el
**mismo USD₮ que la persona está ahorrando**. Nunca necesita ETH.

Además, EIP-7702 permite agrupar operaciones: depositar en un chanchito son dos
pasos (autorizar el token y depositar) que antes eran dos transacciones con dos
firmas. Ahora es **una sola**.

Verificado en Sepolia: después de un depósito, el saldo de ETH de la cuenta
quedó **exactamente igual**. La comisión salió del USD₮.

## El modelo: la primera la pagamos nosotros

La primera operación de cada wallet va patrocinada — el usuario ve **$0,00**.
De ahí en más paga su comisión en USD₮.

Ese patrocinio es nuestro **costo de adquisición**: entre $1 y $2 en Ethereum
L1, y menos de un centavo en una L2. Para fintech, donde adquirir un usuario
cuesta entre $10 y $100, es regalado. Y compra algo concreto: un usuario que
sin eso no habría podido dar el primer paso.

**Chanchito pertenece a una L2.** En L1 el costo por operación supera lo que el
producto genera por usuario. Es una decisión de infraestructura, no de producto.

## A dónde va esto: el caso boliviano

Acá el gasless deja de ser una comodidad y pasa a ser la base de algo más
grande.

En Bolivia conseguir dólares es difícil, y el stablecoin ya funciona como
refugio de valor en la práctica. Una app de ahorro grupal en USD₮ resuelve un
problema real, no uno inventado.

El paso siguiente natural es cerrar el círculo entre el boliviano y el USD₮, y
WDK tiene los módulos para eso:

| Módulo | Para qué |
| --- | --- |
| `@tetherto/wdk-protocol-fiat-moonpay` | Entrar y salir a moneda local |
| `@tetherto/wdk-protocol-swap-velora-evm` | Cambiar entre tokens |
| `@tetherto/wdk-protocol-bridge-usdt0-evm` | Mover USD₮ entre redes |

Nada de eso tiene sentido si el usuario necesita ETH para empezar. **El gasless
es lo que hace que el resto sea posible.**

> **A verificar antes de prometerlo:** falta confirmar si MoonPay opera en
> Bolivia y con qué métodos de pago. Si no cubre BOB, la entrada a moneda local
> necesita otro camino. No está probado y no debería afirmarse en un pitch.
