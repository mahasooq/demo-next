const { createServer } = require("node:http");
const { parse } = require("node:url");
const next = require("next");
const { Server } = require("socket.io");
const { isBasicAuthValid } = require("./lib/basic-auth-shared");

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOSTNAME ?? "localhost";
const port = parseInt(process.env.PORT ?? "3000", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  let counter = 0;

  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  const io = new Server(httpServer, { path: "/socket.io" });

  io.use((socket, next) => {
    if (isBasicAuthValid(socket.handshake.headers.authorization)) {
      next();
    } else {
      next(new Error("Unauthorized"));
    }
  });

  function broadcastCounter() {
    io.emit("counter", { value: counter, sentAt: Date.now() });
  }

  io.on("connection", (socket) => {
    socket.emit("counter", { value: counter, sentAt: Date.now() });

    socket.on("increment", () => {
      counter += 1;
      broadcastCounter();
    });
  });

  httpServer.listen(port, hostname, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});
