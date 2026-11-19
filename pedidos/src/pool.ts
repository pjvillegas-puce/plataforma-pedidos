import os from "node:os";
import path from "node:path";
import { Worker } from "node:worker_threads";

function leerLimite(nombre: string, predeterminado: number, permitirCero = false): number {
  const valor = process.env[nombre];
  if (valor === undefined || valor.trim() === "") return predeterminado;
  const limite = Number(valor);
  if (!Number.isSafeInteger(limite) || limite < (permitirCero ? 0 : 1)) {
    throw new Error(`${nombre} debe ser un entero ${permitirCero ? "no negativo" : "positivo"}`);
  }
  return limite;
}

const maxTrabajadores = leerLimite("MAX_TRABAJADORES", os.availableParallelism());
const maxCola = leerLimite("MAX_COLA", maxTrabajadores * 2, true);

interface Trabajo {
  n: number;
  resolve: (primos: number) => void;
  reject: (error: Error) => void;
}

export class PoolLleno extends Error {
  constructor() {
    super("El pool de reportes está lleno");
    this.name = "PoolLleno";
  }
}

const cola: Trabajo[] = [];
let activos = 0;
let rechazadas = 0;

function despachar(): void {
  while (activos < maxTrabajadores && cola.length > 0) {
    const trabajo = cola.shift()!;
    activos += 1;
    ejecutar(trabajo);
  }
}

function ejecutar(trabajo: Trabajo): void {
  let worker: Worker;
  try {
    worker = new Worker(path.join(__dirname, "worker-reporte.js"), {
      workerData: { n: trabajo.n },
    });
  } catch (error) {
    activos -= 1;
    trabajo.reject(error instanceof Error ? error : new Error(String(error)));
    despachar();
    return;
  }

  let resultado: number | undefined;
  let fallo: Error | undefined;
  worker.once("message", (primos: number) => { resultado = primos; });
  worker.once("error", (error) => {
    fallo = error instanceof Error ? error : new Error(String(error));
  });
  worker.once("exit", (codigo) => {
    activos -= 1;
    if (fallo) trabajo.reject(fallo);
    else if (codigo !== 0) trabajo.reject(new Error(`El worker terminó con código ${codigo}`));
    else if (resultado === undefined) trabajo.reject(new Error("El worker terminó sin devolver un resultado"));
    else trabajo.resolve(resultado);
    despachar();
  });
}

export function contarPrimosEnPool(n: number): Promise<number> {
  return new Promise((resolve, reject) => {
    if (activos >= maxTrabajadores && cola.length >= maxCola) {
      rechazadas += 1;
      reject(new PoolLleno());
      return;
    }
    cola.push({ n, resolve, reject });
    despachar();
  });
}

export function estadoPool() {
  return { maxTrabajadores, activos, enCola: cola.length, maxCola, rechazadas };
}
