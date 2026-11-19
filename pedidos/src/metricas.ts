import os from "node:os";
import { monitorEventLoopDelay } from "node:perf_hooks";
import type { Request, Response, NextFunction } from "express";

const retardoBucle = monitorEventLoopDelay({ resolution: 10 });
retardoBucle.enable();

interface MetricaRuta {
  solicitudes: number;
  maxMs: number;
}

const rutas: Record<string, MetricaRuta> = {};

export function medirRutas(req: Request, res: Response, next: NextFunction): void {
  const inicio = performance.now();
  res.once("finish", () => {
    const clave = `${req.method} ${req.path}`;
    const metrica = rutas[clave] ??= { solicitudes: 0, maxMs: 0 };
    metrica.solicitudes += 1;
    metrica.maxMs = Math.max(metrica.maxMs, Math.round(performance.now() - inicio));
  });
  next();
}

export function estadoMetricas() {
  return {
    bucle: {
      p50Ms: Math.round(retardoBucle.percentile(50) / 1e6),
      p99Ms: Math.round(retardoBucle.percentile(99) / 1e6),
      maxMs: Math.round(retardoBucle.max / 1e6),
    },
    nucleos: os.availableParallelism(),
    rutas,
  };
}
