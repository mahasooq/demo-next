const AUTH_USER = "mahasooq";
const AUTH_PASS = "mahasooq";

function parseBasicAuth(authHeader) {
  if (!authHeader || !authHeader.startsWith("Basic ")) {
    return null;
  }

  try {
    const decoded = Buffer.from(authHeader.slice(6), "base64").toString("utf8");
    const colon = decoded.indexOf(":");
    if (colon === -1) {
      return null;
    }
    return {
      user: decoded.slice(0, colon),
      pass: decoded.slice(colon + 1),
    };
  } catch {
    return null;
  }
}

function isBasicAuthValid(authHeader) {
  const creds = parseBasicAuth(authHeader);
  return creds?.user === AUTH_USER && creds?.pass === AUTH_PASS;
}

const UNAUTHORIZED_HEADERS = {
  "WWW-Authenticate": 'Basic realm="Demo", charset="UTF-8"',
};

module.exports = { isBasicAuthValid, UNAUTHORIZED_HEADERS };
