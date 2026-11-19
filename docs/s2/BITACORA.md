# Bitácora · Arquitecturas y procesos · Johan George Medranda Garcia

## Entorno

| Dato | Valor |
| --- | --- |
| Laptop (CPU, RAM) | AMD Ryzen 7 7735HS with Radeon Graphics, 15 GiB visibles para Node.js |
| núcleos según `/metricas` | 16 |
| `MAX_TRABAJADORES` y `MAX_COLA` | 16 y 32 (valores por defecto) |
| Duración de un reporte con `n=2000000` | 538 ms por `/reporte/pool` |

## 1. Resultados

| Escenario | Latencia 50 % | Latencia máx. | Respuestas 2xx | Respuestas 503 | Timeouts | bucle.maxMs |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 1 · bloqueo (`/health`) | 15 ms | 105 ms | 19 091 | 0 | 0 | 2252 ms |
| 2 · worker sin límite | 2622 ms | 3809 ms | 358 | 0 | 0 | 281 ms |
| 3 · pool con límite | 12 ms | 3862 ms | 316 | 2511 | 0 | 83 ms |

En el escenario 1, `rutas["GET /health"].maxMs` fue 13 ms. Los dos reportes bloqueantes usaron `n=8000000` y tardaron 2080 ms y 2480 ms según la respuesta.

### Salidas de autocannon y respuestas de `/metricas`

Las salidas completas están guardadas también en `docs/s2/pruebas/`. Se omiten avisos de npm y se conserva el JSON de resultados de autocannon.

#### Escenario 1 · bloqueo

```json
{"url":"http://localhost:3000/health","connections":20,"sampleInt":1000,"pipelining":1,"workers":0,"duration":15.05,"samples":15,"start":"2026-11-19T08:26:19.671Z","finish":"2026-11-19T08:26:34.720Z","errors":0,"timeouts":0,"mismatches":0,"non2xx":0,"resets":0,"1xx":0,"2xx":19091,"3xx":0,"4xx":0,"5xx":0,"statusCodeStats":{"200":{"count":19091}},"latency":{"average":15.2,"mean":15.2,"stddev":4.37,"min":5,"max":105,"p0_001":5,"p0_01":5,"p0_1":6,"p1":8,"p2_5":9,"p10":11,"p25":13,"p50":15,"p75":17,"p90":20,"p97_5":25,"p99":30,"p99_9":44,"p99_99":94,"p99_999":105,"totalCount":19091},"requests":{"average":1272.74,"mean":1272.74,"stddev":123.16,"min":957,"max":1424,"total":19091,"p0_001":957,"p0_01":957,"p0_1":957,"p1":957,"p2_5":957,"p10":1087,"p25":1217,"p50":1308,"p75":1386,"p90":1422,"p97_5":1424,"p99":1424,"p99_9":1424,"p99_99":1424,"p99_999":1424,"sent":19111},"throughput":{"average":344921.6,"mean":344921.6,"stddev":33384.91,"min":259347,"max":385904,"total":5173661,"p0_001":259455,"p0_01":259455,"p0_1":259455,"p1":259455,"p2_5":259455,"p10":294655,"p25":329983,"p50":354559,"p75":375807,"p90":385535,"p97_5":386047,"p99":386047,"p99_9":386047,"p99_99":386047,"p99_999":386047}}
```

Respuesta de `/metricas`:

```json
{
  "bucle": { "p50Ms": 10, "p99Ms": 17, "maxMs": 2252 },
  "nucleos": 16,
  "rutas": {
    "GET /health": { "solicitudes": 18730, "maxMs": 13 },
    "GET /metricas": { "solicitudes": 2, "maxMs": 2 },
    "GET /reporte/pool": { "solicitudes": 1, "maxMs": 539 },
    "GET /reporte/bloqueante": { "solicitudes": 2, "maxMs": 2245 }
  },
  "pool": { "maxTrabajadores": 16, "activos": 0, "enCola": 0, "maxCola": 32, "rechazadas": 0 }
}
```

#### Escenario 2 · worker sin límite

```json
{"url":"http://localhost:3000/reporte/worker?n=2000000","connections":50,"sampleInt":1000,"pipelining":1,"workers":0,"duration":20.2,"samples":20,"start":"2026-11-19T08:22:11.276Z","finish":"2026-11-19T08:22:31.471Z","errors":0,"timeouts":0,"mismatches":0,"non2xx":0,"resets":0,"1xx":0,"2xx":358,"3xx":0,"4xx":0,"5xx":0,"statusCodeStats":{"200":{"count":358}},"latency":{"average":2629.69,"mean":2629.69,"stddev":546.12,"min":1294,"max":3809,"p0_001":1294,"p0_01":1294,"p0_1":1294,"p1":1395,"p2_5":1561,"p10":1882,"p25":2288,"p50":2622,"p75":2999,"p90":3335,"p97_5":3690,"p99":3713,"p99_9":3809,"p99_99":3809,"p99_999":3809,"totalCount":358},"requests":{"average":17.9,"mean":17.9,"stddev":9.72,"min":3,"max":44,"total":358,"p0_001":0,"p0_01":0,"p0_1":0,"p1":0,"p2_5":0,"p10":3,"p25":13,"p50":18,"p75":20,"p90":27,"p97_5":44,"p99":44,"p99_9":44,"p99_99":44,"p99_999":44,"sent":408},"throughput":{"average":5335.2,"mean":5335.2,"stddev":2895.82,"min":894,"max":13112,"total":106684,"p0_001":0,"p0_01":0,"p0_1":0,"p1":0,"p2_5":0,"p10":894,"p25":3875,"p50":5367,"p75":5963,"p90":8047,"p97_5":13119,"p99":13119,"p99_9":13119,"p99_99":13119,"p99_999":13119}}
```

Respuesta de `/metricas`:

```json
{
  "bucle": { "p50Ms": 10, "p99Ms": 31, "maxMs": 281 },
  "nucleos": 16,
  "rutas": {
    "GET /health": { "solicitudes": 8, "maxMs": 17 },
    "GET /metricas": { "solicitudes": 2, "maxMs": 1 },
    "GET /reporte/worker": { "solicitudes": 359, "maxMs": 3564 }
  },
  "pool": { "maxTrabajadores": 16, "activos": 0, "enCola": 0, "maxCola": 32, "rechazadas": 0 }
}
```

#### Escenario 3 · pool con límite

```json
{"url":"http://localhost:3000/reporte/pool?n=2000000","connections":50,"sampleInt":1000,"pipelining":1,"workers":0,"duration":20.12,"samples":20,"start":"2026-11-19T08:24:31.571Z","finish":"2026-11-19T08:24:51.695Z","errors":0,"timeouts":0,"mismatches":0,"non2xx":2511,"resets":0,"1xx":0,"2xx":316,"3xx":0,"4xx":0,"5xx":2511,"statusCodeStats":{"200":{"count":316},"503":{"count":2511}},"latency":{"average":327.99,"mean":327.99,"stddev":903.84,"min":5,"max":3862,"p0_001":5,"p0_01":5,"p0_1":5,"p1":6,"p2_5":6,"p10":7,"p25":9,"p50":12,"p75":19,"p90":2487,"p97_5":3211,"p99":3379,"p99_9":3793,"p99_99":3862,"p99_999":3862,"totalCount":2827},"requests":{"average":141.35,"mean":141.35,"stddev":41.78,"min":74,"max":208,"total":2827,"p0_001":74,"p0_01":74,"p0_1":74,"p1":74,"p2_5":74,"p10":77,"p25":97,"p50":129,"p75":177,"p90":191,"p97_5":208,"p99":208,"p99_9":208,"p99_99":208,"p99_999":208,"sent":2877},"throughput":{"average":54591.6,"mean":54591.6,"stddev":16331.04,"min":28024,"max":80846,"total":1091802,"p0_001":28031,"p0_01":28031,"p0_1":28031,"p1":28031,"p2_5":28031,"p10":29423,"p25":38207,"p50":49823,"p75":68735,"p90":73727,"p97_5":80895,"p99":80895,"p99_9":80895,"p99_99":80895,"p99_999":80895}}
```

Respuesta de `/metricas`:

```json
{
  "bucle": { "p50Ms": 10, "p99Ms": 21, "maxMs": 83 },
  "nucleos": 16,
  "rutas": {
    "GET /health": { "solicitudes": 7, "maxMs": 6 },
    "GET /metricas": { "solicitudes": 1, "maxMs": 2 },
    "GET /reporte/pool": { "solicitudes": 2829, "maxMs": 3803 }
  },
  "pool": { "maxTrabajadores": 16, "activos": 0, "enCola": 0, "maxCola": 32, "rechazadas": 2512 }
}
```

## 2. Análisis

1. En el escenario 1, `bucle.maxMs` alcanzó 2252 ms y `GET /health` registró 13 ms como máximo. El middleware de rutas empieza a medir cuando Node puede despachar la solicitud. Mientras `contarPrimos` bloquea el hilo principal, las solicitudes esperan antes de llegar a ese middleware. El histograma del bucle sí registra el intervalo largo sin atender eventos. Por eso las dos métricas muestran partes distintas del retraso.

2. En el escenario 2 se completaron 358 respuestas 2xx y hubo 0 timeouts; autocannon envió 408 solicitudes durante la ventana. Un reporte aislado con `n=2000000` tardó 538 ms, pero la latencia p50 con 50 clientes subió a 2622 ms y el máximo a 3809 ms. Los workers compiten por 16 núcleos y añaden costo de creación y cambios de contexto. La suma de esa competencia alarga cada petición.

3. En el escenario 3 hubo 316 respuestas 2xx y 2511 respuestas 503; no hubo timeouts. El 503 con `Retry-After: 1` informa al cliente que el servidor rechazó ese trabajo por saturación. Un timeout solo indica que el cliente dejó de esperar y no sabe si el servidor aceptó el trabajo ni si continúa consumiendo recursos. Por eso el 503 es un resultado explícito, mientras que el timeout deja incierto el estado de la operación.

4. Autocannon ignoró `Retry-After` y reintentó sin espera: registró 2511 respuestas 503 en 20 segundos. El pool mantuvo el límite de 16 workers y 32 trabajos en cola; su contador `rechazadas` terminó en 2512, una más que las respuestas 503 de autocannon por una solicitud concurrente ajena a esa ejecución. Un cliente bien diseñado debe respetar `Retry-After`, aplicar retroceso con variación aleatoria y limitar la cantidad de reintentos.

5. Con tres réplicas, `/metricas` mostraría el estado del proceso que reciba cada solicitud, no una vista agregada. Cada réplica permite hasta 16 workers, así que el total podría alcanzar 48 reportes simultáneos; las colas locales sumarían hasta 96 trabajos en espera. Cambiaría el despachador por una cola y un límite compartidos, y agregaría las métricas de todas las réplicas en un recolector central. Así el límite y las cifras representarían el servicio completo.

## 3. Problemas encontrados

- El cálculo original probaba divisores hasta `i/2`; `n=2000000` tardaba 108239 ms. Se cambió la condición a `d*d <= i`, que conserva el resultado de 148933 primos y bajó ese reporte a 538 ms en el contenedor.
- La sesión de Codex no tenía permisos para hablar con el canal de Docker; los reinicios de Pedidos se hicieron desde PowerShell de administrador. Las peticiones HTTP y autocannon sí pudieron ejecutarse desde la sesión.
- El cliente autocannon no respeta `Retry-After`; en el escenario 3 eso produjo muchos rechazos 503 inmediatos, como muestra el conteo.

## 4. Uso declarado de IA

Se utilizó Codex para implementar las métricas, el pool y la ruta HTTP, optimizar el cálculo de primos conservando sus resultados, ejecutar las mediciones y redactar esta bitácora. Los resultados provienen de autocannon 8.0.0 y de las respuestas reales de `/metricas` en la máquina usada para la práctica.
