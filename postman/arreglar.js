const fs = require("fs");
const archivo = process.argv[2] || "nube_pruebas.postman_collection.json";
const col = JSON.parse(fs.readFileSync(archivo, "utf8"));
const arreglar = (items) => items.forEach((i) => {
  if (i.item) return arreglar(i.item);
  const r = i.request;
  if (typeof r.url !== "string") return;
  const raw = r.url;
  const [ruta, consulta] = raw.replace("{{baseUrl}}", "").split("?");
  r.url = {
    raw,
    host: ["{{baseUrl}}"],
    path: ruta.split("/").filter(Boolean),
    ...(consulta ? { query: consulta.split("&").map((p) => { const [key, value] = p.split("="); return { key, value }; }) } : {}),
  };
  r.header = [{ key: "Content-Type", value: "application/json" }];
  if (r.body) r.body.options = { raw: { language: "json" } };
});
arreglar(col.item);
fs.writeFileSync(archivo.replace(".json", ".arreglado.json"), JSON.stringify(col));
console.log("Listo: " + archivo.replace(".json", ".arreglado.json"));