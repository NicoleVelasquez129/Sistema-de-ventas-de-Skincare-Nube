require("dotenv").config();
const readline = require("readline");
const bcrypt = require("bcryptjs");
const sequelize = require("../config/database");
const { Usuario } = require("../models");

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const preguntar = (texto) => new Promise((resolve) => rl.question(texto, resolve));

(async () => {
    try {
        const correo = (await preguntar("Correo del vendedor: ")).trim().toLowerCase();
        const contrasena = await preguntar("Contraseña (mínimo 8 caracteres, con letra y número): ");
        if (!correo || contrasena.length < 8 || !/[A-Za-z]/.test(contrasena) || !/\d/.test(contrasena)) {
            throw new Error("Correo obligatorio y contraseña de al menos 8 caracteres con letra y número.");
        }

        const hash = await bcrypt.hash(contrasena, 10);
        const existente = await Usuario.findOne({ where: { correo } });

        if (existente) {
            if (existente.rol !== "vendedor") {
                throw new Error(`Ese correo ya pertenece a un usuario con rol ${existente.rol}.`);
            }
            await existente.update({ contrasena_cifrada: hash, activo: true });
            console.log("Vendedor existente: contraseña actualizada.");
        } else {
            const nombre = (await preguntar("Nombre completo: ")).trim();
            if (!nombre) throw new Error("El nombre es obligatorio.");
            await Usuario.create({ nombre, correo, contrasena_cifrada: hash, rol: "vendedor" });
            console.log("Vendedor creado.");
        }
    } catch (error) {
        console.error("Error:", error.message);
    } finally {
        rl.close();
        await sequelize.close();
    }
})();