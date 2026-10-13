<!--
Material de estudio original de Biblioteca Educativa.
Formato: "# " inicia un capítulo, "> " justo después es su subtítulo, "## " es un subtítulo de sección,
las líneas en blanco separan párrafos y las listas (- , 1. , →) conservan sus saltos de línea.
-->

# Cómo estudiar con este libro
> Teoría breve, ejemplos resueltos y práctica al final de cada unidad

Este libro reúne los contenidos de Matemática del plan común de 4° medio: matemática financiera, probabilidades con los modelos binomial y normal, funciones potencia y funciones trigonométricas. Cada unidad parte de una situación real, explica la idea con palabras simples, la formaliza y termina con ejemplos resueltos paso a paso.

La matemática se aprende haciendo. Te recomendamos leer cada ejemplo con lápiz en mano: tapa la solución, intenta resolverlo y solo después compara. Al terminar cada unidad encontrarás una práctica de 10 ejercicios con corrección inmediata y explicación.

## Herramientas que necesitas

- Una calculadora científica (la del celular sirve si tiene potencias y funciones trigonométricas).
- Un cuaderno para anotar fórmulas y errores frecuentes.
- Paciencia: equivocarse en un ejercicio es parte de aprenderlo.

## Notación

En este libro usamos coma decimal (2,5) y punto para separar miles (1.000.000), como se escribe en Chile. En la práctica puedes escribir tus respuestas con coma o con punto decimal: ambas se aceptan.

# Unidad 1. Matemática financiera
> Porcentajes, interés simple y compuesto, créditos e inflación

Cada vez que alguien pide un crédito, ahorra en una cuenta, compra en cuotas o compara precios en el supermercado está usando matemática financiera. Entenderla permite tomar decisiones informadas y no depender solo de lo que dice la publicidad.

## Porcentajes y variaciones

Un porcentaje es una razón con denominador 100: el 15% de una cantidad es 15/100 = 0,15 veces esa cantidad.

Para aumentar una cantidad en un p%, se multiplica por (1 + p/100). Para disminuirla en un p%, se multiplica por (1 − p/100). A ese número se le llama factor de variación.

Ejemplo: un polerón cuesta $20.000 y tiene un 25% de descuento. El factor es 1 − 0,25 = 0,75, así que el precio final es 20.000 · 0,75 = $15.000.

## Descuentos y alzas sucesivas

Los porcentajes sucesivos no se suman: se multiplican sus factores. Un descuento de 20% seguido de otro de 10% equivale a multiplicar por 0,80 · 0,90 = 0,72, es decir, un descuento total de 28% y no de 30%.

Del mismo modo, si un precio sube 10% y luego baja 10%, no vuelve al valor inicial: 1,10 · 0,90 = 0,99, o sea, queda 1% más barato que al comienzo.

## Interés simple

En el interés simple, los intereses se calculan siempre sobre el capital inicial C. Si la tasa por período es i (en decimal) y pasan n períodos:

- Interés: I = C · i · n
- Monto final: M = C · (1 + i · n)

Ejemplo resuelto. Se prestan $500.000 al 2% mensual de interés simple durante 6 meses.

→ I = 500.000 · 0,02 · 6 = $60.000
→ M = 500.000 + 60.000 = $560.000

## Interés compuesto

En el interés compuesto, al final de cada período los intereses se suman al capital y empiezan a generar nuevos intereses: es «interés sobre interés». El monto final es:

M = C · (1 + i)ⁿ

Ejemplo resuelto. Los mismos $500.000 al 2% mensual, pero con interés compuesto durante 6 meses:

→ M = 500.000 · 1,02⁶ = 500.000 · 1,126162… ≈ $563.081

La diferencia con el interés simple ($3.081) parece pequeña, pero crece muy rápido con el tiempo. Por eso el interés compuesto favorece a quien ahorra durante muchos años y perjudica a quien mantiene una deuda impaga.

## Tasas equivalentes

Una tasa mensual y una anual son equivalentes si producen el mismo monto en un año. Como un año tiene 12 meses:

(1 + i_anual) = (1 + i_mensual)¹²

Ejemplo: una tasa de 1% mensual equivale a 1,01¹² − 1 ≈ 0,1268, es decir, 12,68% anual, y no 12%. Esta diferencia explica por qué conviene comparar créditos usando siempre la tasa anual.

## Créditos en cuotas iguales

Cuando un crédito de capital C se paga en n cuotas iguales con tasa i por período, cada cuota es:

cuota = C · i / (1 − (1 + i)⁻ⁿ)

Ejemplo resuelto. Un crédito de $1.000.000 al 1,5% mensual en 12 cuotas:

→ (1,015)⁻¹² ≈ 0,836387
→ 1 − 0,836387 = 0,163613
→ cuota = 1.000.000 · 0,015 / 0,163613 ≈ $91.680

En total se pagan 12 · 91.680 ≈ $1.100.160, así que el costo del crédito es cerca de $100.160. En Chile, la ley obliga a informar la Carga Anual Equivalente (CAE), un indicador que incluye intereses, comisiones y seguros. Para comparar dos créditos, conviene mirar el CAE y el costo total, no solo el valor de la cuota.

## Inflación y poder adquisitivo

La inflación es el aumento generalizado de los precios. En Chile se mide con el Índice de Precios al Consumidor (IPC), que calcula el Instituto Nacional de Estadísticas. Si la inflación anual fue 4%, una canasta que costaba $100.000 ahora cuesta $104.000.

Por eso, una ganancia nominal no siempre es una ganancia real. Si un ahorro rinde 6% en un año con inflación de 4%, la tasa real es:

→ (1,06 / 1,04) − 1 ≈ 0,0192, es decir, cerca de 1,92%

La Unidad de Fomento (UF) es una unidad de cuenta que se reajusta diariamente según la inflación. Muchos créditos hipotecarios y arriendos se expresan en UF para que su valor real se mantenga en el tiempo.

## Ideas clave de la unidad

- Los porcentajes sucesivos se multiplican, no se suman.
- El interés compuesto crece de forma exponencial: M = C(1 + i)ⁿ.
- Para comparar créditos se usa el costo total y la tasa anual (CAE), no solo la cuota.
- La rentabilidad real descuenta la inflación.

# Unidad 2. Probabilidad: modelos binomial y normal
> Tomar decisiones con datos cuando hay incerteza

¿Conviene responder al azar en una prueba? ¿Es confiable un examen médico? ¿Qué tan raro es un resultado? Los modelos de probabilidad permiten responder preguntas así con números, en lugar de intuiciones.

## Variable aleatoria

Una variable aleatoria asigna un número a cada resultado de un experimento aleatorio. Por ejemplo, X = «número de caras al lanzar 3 monedas» puede tomar los valores 0, 1, 2 o 3.

El valor esperado E(X) es el promedio que se obtendría si el experimento se repitiera muchísimas veces. La desviación estándar σ mide cuánto se alejan normalmente los resultados de ese promedio.

## Experimentos de Bernoulli

Un experimento de Bernoulli tiene solo dos resultados: éxito (con probabilidad p) o fracaso (con probabilidad 1 − p). Ejemplos: acertar o no una pregunta, que una pieza salga defectuosa o no, que un paciente responda o no a un tratamiento.

## Distribución binomial

Si se repite un experimento de Bernoulli n veces, de forma independiente y con la misma probabilidad p, el número de éxitos X sigue una distribución binomial B(n, p). La probabilidad de obtener exactamente k éxitos es:

P(X = k) = C(n, k) · pᵏ · (1 − p)ⁿ⁻ᵏ

donde C(n, k) = n! / (k! · (n − k)!) cuenta de cuántas formas se pueden ubicar los k éxitos entre los n intentos.

Su valor esperado y su desviación estándar son:

- E(X) = n · p
- σ = √(n · p · (1 − p))

## Ejemplo resuelto: responder al azar

Una prueba tiene 10 preguntas de verdadero o falso y un estudiante responde todas al azar. ¿Cuál es la probabilidad de que acierte exactamente 7?

→ n = 10, p = 0,5, k = 7
→ C(10, 7) = 120
→ P(X = 7) = 120 · 0,5⁷ · 0,5³ = 120 / 1024 ≈ 0,1172

Es decir, cerca de 11,7%. La probabilidad de aprobar con 8 o más aciertos es P(8) + P(9) + P(10) = (45 + 10 + 1) / 1024 ≈ 0,0547: algo más de 5%. Responder al azar es una mala estrategia.

## Ejemplo resuelto: «al menos uno»

Una máquina produce piezas con 10% de defectos. Si se revisan 4 piezas, ¿cuál es la probabilidad de encontrar al menos una defectuosa?

Es más fácil calcular el complemento: P(ninguna defectuosa) = 0,9⁴ = 0,6561. Entonces:

→ P(al menos una) = 1 − 0,6561 = 0,3439

## Distribución normal

Muchas variables continuas —la estatura, el error de una medición, los puntajes de una prueba masiva— se distribuyen en forma de campana alrededor de su promedio μ, con desviación estándar σ. Ese modelo es la distribución normal N(μ, σ).

La regla empírica 68–95–99,7 dice que, en una distribución normal:

- Cerca del 68% de los datos está entre μ − σ y μ + σ.
- Cerca del 95% está entre μ − 2σ y μ + 2σ.
- Cerca del 99,7% está entre μ − 3σ y μ + 3σ.

## Estandarizar: el valor z

Para comparar datos de distribuciones distintas se calcula cuántas desviaciones estándar se aleja un valor x de su promedio:

z = (x − μ) / σ

Ejemplo: en una prueba con μ = 500 y σ = 100, un puntaje de 650 tiene z = (650 − 500) / 100 = 1,5. En otra prueba con μ = 60 y σ = 8, un puntaje de 76 tiene z = 2. El segundo resultado es relativamente mejor, aunque el número sea menor.

## La binomial se parece a la normal

Cuando n es grande, la distribución binomial tiene forma de campana y se aproxima por una normal con μ = n·p y σ = √(n·p·(1 − p)). Por ejemplo, al lanzar 400 monedas, μ = 200 y σ = √(400 · 0,5 · 0,5) = 10. Obtener 230 caras (z = 3) sería muy improbable con una moneda equilibrada: un buen motivo para sospechar.

## Ideas clave de la unidad

- Binomial: n intentos independientes, dos resultados, p constante.
- P(X = k) = C(n, k) pᵏ (1 − p)ⁿ⁻ᵏ; E(X) = np.
- «Al menos uno» se calcula con el complemento.
- En la normal, z mide cuán inusual es un valor; |z| > 2 ocurre menos del 5% de las veces.

# Unidad 3. Funciones potencia
> Modelar fenómenos con f(x) = a · xⁿ

El área de un cuadrado crece con el cuadrado de su lado; el volumen de un cubo, con el cubo de su arista; la intensidad de la luz disminuye con el cuadrado de la distancia. Todas son funciones potencia.

## Definición

Una función potencia tiene la forma f(x) = a · xⁿ, con a ≠ 0 y n un número entero. El coeficiente a estira, comprime o refleja la gráfica; el exponente n determina su forma.

## Exponente par positivo (n = 2, 4, …)

- La gráfica es simétrica respecto del eje Y: f(−x) = f(x). Se dice que la función es par.
- Si a > 0, la función nunca es negativa y tiene un mínimo en x = 0.
- Mientras mayor es n, más «plana» es cerca de 0 y más rápido crece lejos de 0.

## Exponente impar positivo (n = 1, 3, 5, …)

- La gráfica es simétrica respecto del origen: f(−x) = −f(x). La función es impar.
- Si a > 0, es creciente en todo su dominio.
- Ejemplo: f(x) = 2x³ da f(2) = 16 y f(−2) = −16.

## Exponente negativo (n = −1, −2, …)

Si n es negativo, f(x) = a · xⁿ = a / x⁻ⁿ. La función no está definida en x = 0 y su gráfica tiene asíntotas en los ejes.

- f(x) = 1/x (n = −1) es impar: hipérbola en el primer y tercer cuadrante.
- f(x) = 1/x² (n = −2) es par y siempre positiva: f(0,5) = 1 / 0,25 = 4.

## Cómo cambia la salida al cambiar la entrada

Esta es la propiedad más útil para modelar: si x se multiplica por k, entonces f(x) = a·xⁿ se multiplica por kⁿ.

- Si el lado de un cuadrado se triplica, su área se multiplica por 3² = 9.
- Si la arista de un cubo se duplica, su volumen se multiplica por 2³ = 8.
- Si te alejas al doble de distancia de una ampolleta, la intensidad que recibes se multiplica por 2⁻² = 1/4.

## Ejemplo resuelto: la ley del cuadrado inverso

La intensidad de un sonido a 2 metros de un parlante es 80 unidades. ¿Cuál es a 4 metros si I(d) = a / d²?

→ 80 = a / 2², entonces a = 320
→ I(4) = 320 / 16 = 20 unidades

También podíamos razonar con la propiedad: la distancia se duplica, así que la intensidad se divide por 2² = 4: 80 / 4 = 20.

## Ejemplo resuelto: encontrar el modelo

El volumen de una esfera es proporcional al cubo de su radio: V = a · r³. Si una esfera de radio 3 cm tiene volumen 113,1 cm³, entonces a = 113,1 / 27 ≈ 4,19, que es aproximadamente 4π/3. El modelo es V = (4/3)·π·r³.

## Ideas clave de la unidad

- f(x) = a·xⁿ: exponente par → simetría con el eje Y; impar → simetría con el origen.
- Exponentes negativos: la función decrece al alejarse de 0 y no existe en 0.
- Multiplicar x por k multiplica f(x) por kⁿ.

# Unidad 4. Funciones trigonométricas
> Seno y coseno para modelar fenómenos periódicos

Las mareas, el giro de una rueda, el sonido, la duración del día a lo largo del año y la corriente eléctrica alterna se repiten en ciclos. Las funciones seno y coseno son el modelo matemático de lo que se repite.

## Radianes

Además de grados, los ángulos se miden en radianes. Un radián es el ángulo que abarca un arco igual al radio. Una vuelta completa mide 2π radianes, por lo que:

- 180° = π radianes
- 90° = π/2 radianes
- Para pasar de grados a radianes se multiplica por π/180.

## La circunferencia unitaria

Imagina un punto que recorre una circunferencia de radio 1 centrada en el origen. Si el radio forma un ángulo t con el eje X positivo, el punto tiene coordenadas (cos t, sen t). Por eso:

- cos t es la coordenada horizontal y sen t la vertical.
- Ambas toman valores entre −1 y 1.
- Por el teorema de Pitágoras, sen² t + cos² t = 1.

Valores que conviene recordar: sen 0 = 0, sen 30° = 0,5, sen 90° = 1; cos 0 = 1, cos 60° = 0,5, cos 90° = 0.

## Las funciones seno y coseno

Al graficar sen t en función de t se obtiene una onda que se repite cada 2π: ese es su periodo. La función coseno tiene la misma forma, desplazada en π/2.

## El modelo general

Un fenómeno periódico se modela con:

f(t) = A · sen(B·t) + D o f(t) = A · cos(B·t) + D

- |A| es la amplitud: la mitad de la distancia entre el máximo y el mínimo.
- D es la línea media: el promedio entre el máximo y el mínimo.
- El periodo es T = 2π / B, el tiempo que tarda en repetirse.
- Máximo = D + |A| y mínimo = D − |A|.

## Ejemplo resuelto: una rueda de la fortuna

Una rueda tiene 20 m de diámetro, su centro está a 12 m del suelo y da una vuelta cada 4 minutos. Una persona sube en el punto más bajo. Su altura en metros después de t minutos es:

h(t) = 12 − 10 · cos(2π · t / 4)

→ Amplitud: 10 m (el radio). Línea media: 12 m. Periodo: 4 min.
→ h(0) = 12 − 10 · 1 = 2 m (el punto más bajo)
→ h(2) = 12 − 10 · cos(π) = 12 + 10 = 22 m (el punto más alto, a media vuelta)
→ h(1) = 12 − 10 · cos(π/2) = 12 m (a la altura del centro)

## Ejemplo resuelto: mareas

En un puerto, la altura del agua varía entre 1,5 m y 4,5 m con un periodo de unas 12,4 horas. La línea media es D = (4,5 + 1,5) / 2 = 3 m y la amplitud es A = (4,5 − 1,5) / 2 = 1,5 m. Un modelo es:

h(t) = 3 + 1,5 · sen(2π · t / 12,4)

Con él se puede estimar a qué hora un barco tendrá suficiente profundidad para entrar al puerto.

## Ideas clave de la unidad

- 2π radianes = 360°.
- (cos t, sen t) es un punto de la circunferencia unitaria; sen² t + cos² t = 1.
- En A·sen(Bt) + D: amplitud |A|, periodo 2π/B, línea media D.
