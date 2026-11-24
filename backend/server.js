const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const client = require("prom-client");
require("dotenv").config();

const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const taskRoutes = require("./routes/taskRoutes");
const categoryRoutes = require("./routes/categoryRoutes");

const app = express();

// Mesures pour Prometheus (CPU, mémoire, durée des requêtes)
client.collectDefaultMetrics();
const httpDuration = new client.Histogram({
    name: "http_request_duration_seconds",
    help: "Durée des requêtes HTTP",
    labelNames: ["method", "status"],
});

// Chaque requête est mesurée et écrite dans les logs
app.use((req, res, next) => {
    if (["/health", "/ready", "/metrics"].includes(req.path)) return next();
    const end = httpDuration.startTimer({ method: req.method });
    res.on("finish", () => {
        end({ status: res.statusCode });
        const level = res.statusCode >= 500 ? "ERROR" : "INFO";
        console.log(`level=${level} method=${req.method} path=${req.path} status=${res.statusCode}`);
    });
    next();
});

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// Routes techniques pour Docker, Kubernetes et Prometheus
app.get("/health", (req, res) => {
    res.json({ status: "ok", version: process.env.APP_VERSION || "dev" });
});
app.get("/ready", (req, res) => {
    if (mongoose.connection.readyState === 1) return res.json({ status: "ready" });
    res.status(503).json({ status: "mongodb-indisponible" });
});
app.get("/metrics", async (req, res) => {
    res.set("Content-Type", client.register.contentType);
    res.end(await client.register.metrics());
});

app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/categories", categoryRoutes);

if (require.main === module) {
    connectDB().catch((err) => {
        console.error(`level=ERROR msg="MongoDB injoignable: ${err.message}"`);
        process.exit(1);
    });
    const port = process.env.PORT || 3000;
    app.listen(port, () => console.log(`level=INFO msg="Serveur sur le port ${port}"`));
}

module.exports = app;
