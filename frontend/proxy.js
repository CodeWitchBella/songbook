const httpProxy = require("http-proxy");
const devcert = require("devcert");

const port = 5512;
const target = "https://zpevnik.skorepova.info";
(async () => {
  const ssl = await devcert.certificateFor("localhost");

  httpProxy
    .createProxyServer({
      ssl,
      target,
      changeOrigin: true,
      secure: true,
    })
    .on("proxyReq", (proxyReq, req, res, _) => {
      const origin = req.headers["origin"];
      proxyReq.setHeader("Origin", target);

      const oldWriteHead = res.writeHead;
      res.writeHead = function (statusCode, headers) {
        res.removeHeader("strict-transport-security");
        oldWriteHead.call(this, statusCode, headers);
      };

      if (
        origin &&
        (origin.startsWith("https://localhost:") ||
          origin.startsWith("http://localhost:") ||
          origin.startsWith("https://127.0.0.1:") ||
          origin.startsWith("http://127.0.0.1:"))
      ) {
        res.setHeader("Access-Control-Allow-Origin", origin);
        res.setHeader("Vary", "Origin");
        const headers = req.headers["access-control-request-headers"];
        if (headers) res.setHeader("Access-Control-Allow-Headers", headers);
        res.setHeader("Access-Control-Allow-Methods", "*");
        res.setHeader("Access-Control-Max-Age", "86400");
        res.setHeader("Access-Control-Allow-Credentials", "true");
        if (req.method === "OPTIONS") {
          res.statusCode = 200;
          res.end();
        }
      }
    })
    .listen(port);
})();
