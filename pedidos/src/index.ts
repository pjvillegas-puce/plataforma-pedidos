import express, {Request, Response} from "express";
import {randomUUID} from "node:crypto"; // ES PARA GENERAR VALORES ALEATOREOS
import {contarPrimos} from "./calculo"; ///
import {Worker} from "node:worker_threads"; // importar el uso de lworker 
import path from "node:path"
import { contarPrimosEnPool, estadoPool, PoolLleno } from "./pool";
import { estadoMetricas, medirRutas } from "./metricas";

const PORT= Number(process.env.PORT?? 3000);
const INVENTARIO_URL= process.env.INVENTARIO_URL ?? "http://localhost:3001";
const TIMEOUT_MS = Number(process.env.TIMEOUT_MS ?? 2000);
const REPORTE_N =Number(process.env.REPORTE_N?? 8_000_000)


interface Pedido {
    id: string;
    sku: string;
    cantidad: number;
    creadoEn: string;
}

const pedidos: Pedido []=[];
const app= express();
app.use(express.json());
app.use(medirRutas);

app.get("/metricas", (_req: Request, res: Response) => {
    res.json({ ...estadoMetricas(), pool: estadoPool() });
});

// consulta salud del servicio
app.get ("/health",(_req: Request, res: Response) =>{

    res.json({status:"ok",servicio: "pedidos"});
});

/// listado de pedidos
app.get("/pedidos",(_req: Request, res: Response) =>{

    res.json(pedidos);

});
// saervicio de ingreso de pedidos

app.post("/pedidos",async(req: Request, res: Response )=>{
const {sku, cantidad}= req.body??{};
if (typeof sku !== "string" || typeof cantidad !== "number" || cantidad <=0){
     res.status(400).json ({error: " tipos de datos incorrectos o cantidad negativa"});
     return;

}
const inicio = performance.now(); // tomar el tiempo de inicio

try{
 const r= await fetch( `${INVENTARIO_URL}/stock/${encodeURIComponent(sku)}`,{
    signal: AbortSignal.timeout(TIMEOUT_MS),
       
        } );
        if(r.status===404){
                 res.status(404).json({error: "sku no existe en inventario"});   
                return;
        };
        const stock= ( await r.json()) as { disponible: number};
        if(stock.disponible < cantidad){
            res.status(409).json ({error: "stock insuficiente "+ " disponible: "+stock.disponible});
            return;     
        }
        const pedido: Pedido = {id : randomUUID(), sku, cantidad, creadoEn: new Date().toISOString()};
        pedidos.push(pedido);
        res.status(201).json(pedido);

    } catch (error) {
            const duracionMs= Math.round( performance.now() - inicio);
            const e = error as Error & { cause ?: {code?: string}};
            const motivo= e.name=== "TimeoutError" ? "Inventario no constetó en "+ TIMEOUT_MS+"ms" : " NOSE PUDO COENTAR CON iNVENTARIO "+ (e.cause?.code ?? e.message) ;
            console.error (pedidos + " "+motivo);
            res.status(503).json({error: "invnetario no disponible "+motivo, duracionMs});      
}
});


/////
    function leerN(req: Request):number{
        const n = Number(req.query.n ?? REPORTE_N);
        return Number.isInteger(n) && n>0 && n<=50_000_000 ? n : REPORTE_N;
    };

app.get("/reporte/bloqueante",(req: Request, res: Response )=>{
    const n= leerN(req);
    const inicio= performance.now();
    const primos= contarPrimos(n);
    const duracionMs=Math.round(performance.now()-inicio);
    res.json({modo:"bloqueando",n, primos, duracionMs});
});

/// con el hilo del worker
// importar libreria de path y worker
//import {Worker} from "node:worker_threads"; // importar el uso de lworker 
//import path from "node:path"

function contarPrimosenWorker(n:number): Promise<number>{

    return new Promise (( resolve,reject)=>{
            const archivo = path.join (__dirname, "worker-reporte.js");
            const w= new Worker(archivo, {workerData:{n}});
        w.once("message",(primos: number) => resolve(primos) );
        w.once("error",reject);

        });

};

app.get("/reporte/worker", async (req: Request, res: Response )=>{
 const n= leerN(req);
    const inicio= performance.now();
    const primos= await contarPrimosenWorker(n);
    const duracionMs=Math.round(performance.now()-inicio);
    res.json({modo:"worker",n, primos, duracionMs});

});

app.get("/reporte/pool", async (req: Request, res: Response) => {
    const n = leerN(req);
    const inicio = performance.now();
    try {
        const primos = await contarPrimosEnPool(n);
        const duracionMs = Math.round(performance.now() - inicio);
        res.json({ modo: "pool", n, primos, duracionMs });
    } catch (error) {
        if (error instanceof PoolLleno) {
            res.setHeader("Retry-After", "1");
            res.status(503).json({ error: error.message, pool: estadoPool() });
            return;
        }
        res.status(500).json({ error: "No se pudo completar el reporte" });
    }
});

// puerto en el que escucha
app.listen(PORT,()=>{

console.log("servivio de pedidos escuchando en el puerto: "+PORT+ " inventario: "+INVENTARIO_URL+ " timeout: "+TIMEOUT_MS+"ms");        


});







