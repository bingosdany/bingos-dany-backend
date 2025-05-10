const express = require("express");
const mongoose = require("mongoose");
const nodemailer = require("nodemailer");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");
require("dotenv").config(); // Importar variables de entorno

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public"))); // Servir archivos del frontend

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  proof: String,
  assigned: Boolean,
});

const User = mongoose.model("User", userSchema);

// Obtener todos los usuarios
app.get("/api/users", async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    res.status(500).send("Error al obtener usuarios");
  }
});

// Asignar cartones manualmente
app.post("/api/assign", async (req, res) => {
  const { id, count } = req.body;

  try {
    const user = await User.findById(id);
    if (!user) return res.status(404).send("Usuario no encontrado");

    const cartones = [];
    for (let i = 0; i < count; i++) {
      cartones.push(`Cartón #${i + 1}: ${Math.random().toString(36).substr(2, 10).toUpperCase()}`);
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "tartaraexpressalvajadas@gmail.com",
        pass: "Mercedes2585@",
      },
    });

    await transporter.sendMail({
      from: "Bingos Dany <tartaraexpressalvajadas@gmail.com>",
      to: user.email,
      subject: "Tus cartones de bingo",
      text: `Hola ${user.name}, aquí tienes tus ${count} cartones:

${cartones.join("\n")}

¡Buena suerte!`,
    });

    user.assigned = true;
    await user.save();

    res.send("Cartones enviados");
  } catch (err) {
    res.status(500).send("Error al asignar cartones");
  }
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});