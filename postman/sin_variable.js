const fs = require("fs");
const archivo = process.argv[2] || "nube_pruebas.postman_collection.arreglado.json";
const texto = fs.readFileSync(archivo, "utf8").split("{{baseUrl}}").join("http://localhost:3000");
JSON.parse(texto);
fs.writeFileSync("nube_final.postman_collection.json", texto);
console.log("Listo: nube_final.postman_collection.json");
