"use strict";

require("core-js/modules/es.typed-array.set.js");

require("core-js/modules/es.typed-array.sort.js");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.signCompactJws = exports.importKey = exports.generateKey = exports.generatePKCEChallenge = exports.digestSha256 = exports.randomBytes = exports.base64urldecode = exports.base64urlencode = void 0;

const js_base64_1 = require("js-base64");

const crypto = require("isomorphic-webcrypto").default;

const subtle = crypto.subtle;
const ALGS = {
  ES384: {
    name: "ECDSA",
    namedCurve: "P-384"
  },
  RS384: {
    name: "RSASSA-PKCS1-v1_5",
    modulusLength: 4096,
    publicExponent: new Uint8Array([1, 0, 1]),
    hash: {
      name: 'SHA-384'
    }
  }
};

const base64urlencode = input => {
  if (typeof input == "string") {
    return (0, js_base64_1.encodeURL)(input);
  }

  return (0, js_base64_1.fromUint8Array)(input, true);
};

exports.base64urlencode = base64urlencode;
exports.base64urldecode = js_base64_1.decode;

function randomBytes(count) {
  return crypto.getRandomValues(new Uint8Array(count));
}

exports.randomBytes = randomBytes;

async function digestSha256(payload) {
  const prepared = new Uint8Array(s2b(payload));
  const hash = await subtle.digest('SHA-256', prepared);
  return new Uint8Array(hash);
}

exports.digestSha256 = digestSha256;

const generatePKCEChallenge = async (entropy = 96) => {
  const inputBytes = randomBytes(entropy);
  const codeVerifier = (0, exports.base64urlencode)(inputBytes);
  const codeChallenge = (0, exports.base64urlencode)(await digestSha256(codeVerifier));
  return {
    codeChallenge,
    codeVerifier
  };
};

exports.generatePKCEChallenge = generatePKCEChallenge;

async function generateKey(jwsAlg) {
  try {
    return await subtle.generateKey(ALGS[jwsAlg], true, ["sign"]);
  } catch (e) {
    throw new Error(`The ${jwsAlg} is not supported by this browser: ${e}`);
  }
}

exports.generateKey = generateKey;

async function importKey(jwk) {
  try {
    return await subtle.importKey("jwk", jwk, ALGS[jwk.alg], true, ['sign']);
  } catch (e) {
    throw new Error(`The ${jwk.alg} is not supported by this browser: ${e}`);
  }
}

exports.importKey = importKey;

async function signCompactJws(privateKey, header, payload) {
  const jwsAlgs = Object.entries(ALGS).filter(([, v]) => v.name === privateKey.algorithm.name).map(([k]) => k);

  if (jwsAlgs.length !== 1) {
    throw "No JWS alg for " + privateKey.algorithm.name;
  }

  const jwtHeader = JSON.stringify(Object.assign(Object.assign({}, header), {
    alg: jwsAlgs[0]
  }));
  const jwtPayload = JSON.stringify(payload);
  const jwtAuthenticatedContent = `${(0, exports.base64urlencode)(jwtHeader)}.${(0, exports.base64urlencode)(jwtPayload)}`;
  const signature = await subtle.sign(Object.assign(Object.assign({}, privateKey.algorithm), {
    hash: 'SHA-384'
  }), privateKey, s2b(jwtAuthenticatedContent));
  return `${jwtAuthenticatedContent}.${(0, exports.base64urlencode)(signature)}`;
}

exports.signCompactJws = signCompactJws;

function s2b(s) {
  var b = new Uint8Array(s.length);

  for (var i = 0; i < s.length; i++) b[i] = s.charCodeAt(i);

  return b;
}

async function test() {
  // generateKey('ES384')
  // .then(esk => {
  //     console.log("ES384 privateKey:", esk.privateKey);
  // })
  //     // const eskSigned = await signCompactJws(esk.privateKey!, {'jwku': 'sure'}, {iss: "issuer"});
  //     // console.log("Signed ES384", eskSigned);
  //     // const publicJwk = await subtle.exportKey("jwk", esk.publicKey!);
  //     // console.log(JSON.stringify(publicJwk))
  // .catch(ex => {
  //     // debugger;
  //     console.error(ex)
  // })
  // const rsk = await generateKey('RS384');
  // console.log("RS384 privateKey:", rsk.privateKey);
  // const rskSigned = await new SignJWT({ iss: "issuer" }).setProtectedHeader({ alg: 'RS384', jwku: "test" }).sign(rsk.privateKey);
  // console.log("Signed RS384", rskSigned);
  // console.log(JSON.stringify(await exportJWK(rsk.publicKey)))
  // const esk = await generateKey('ES384');
  // console.log(await signCompactJws(esk.privateKey!, {'jwku': 'sure'}, {iss: "issuer"}))
  // const publicJwk = await subtle.exportKey("jwk", esk.publicKey!);
  // console.log(JSON.stringify(publicJwk))
  // const rsk = await generateKey('RS384');
  // console.log("RS384 privateKey:", rsk.privateKey);
  // console.log(await signCompactJws(rsk.privateKey!, {'jwku': 'sure'}, {iss: "issuer"}))
  // const publicJwkR = await subtle.exportKey("jwk", rsk.publicKey!);
  // console.log(JSON.stringify(publicJwkR))
  console.log("generatePKCEChallenge: ", await (0, exports.generatePKCEChallenge)());
  const clientPrivateKeyRS384 = await importKey({
    "kty": "RSA",
    "alg": "RS384",
    "n": "1blEEASdKpdpTVP_WMqDwWLx7NXDch5SDNeCSBcq7exEfITtGC9IuJ7hKvVa786f0Zuf00Lhn1qcxYkV1jzzs61wU6X59zU_ApFDSKfrT3zi5YBnUh-ugOJ-Y0dTNc9NjuA624dMlqWtPRRoJdCAcXcseVla3EioYsYFPy2popLhhtO1o4tYelHCvp7n5k_mGDVPNLZA5zHh0XoY2BuSjp3OJXkbjOkZpGJSubLXRYnB9NzCPmfxjs_B2I_C9hlXqCXDju_Iwm5cygRcJJq1L5pvQGAKyrREH8lm8FLf4JneC2xeyTsu2Tl-NDE4cekLDjvfKqc3yVoij7vp8gDauw",
    "e": "AQAB",
    "d": "MFvsT6eLnHCILiwccg3YxDBMR2eTAsZjkG5PF1rOpuk4EejN8RP543RnxJ2hxvM87GPHRTkz7ifFo1jCbSh7iCNtcC_1IH-W01DlJZKBRwoeGQn11vo-NQGK0ZH4_Qr8JKEOEFBL_yZbzZ9JdYz5EzOBB7A1Q_TYzQi7dTEy2grx9Cr8X3sN4-PcdoiA3B2CVLngU6n3TqW0vXWeyN-Za9TvGKLhy64K9dM9-3S27DQ72-eCUENBfdmqfELP_PIsd1jX7bayoHrIt2_sgKa0bJtRMxnErCbienhnTJdrzxT3uESKgC-0BTe2H2SxS9r9fc6As3YX1dFq7bGy1QY5cQ",
    "p": "_YkYFO422d-m9RBJNIzLQMD_uGMZkJJy__tMq5bg2sg-ITIhWA28NEgM4jymn9yQ1pDReYsPNBVqzyGrMWW0V9z-9am1LHmnjY-Lq1CzM9n9xc1Rfxifl3zIlFSWZgI7IFn8igViNjHWdHhAozM6n3v71dXeFjXnhC9mO4nHlFk",
    "q": "180aTv4E507eGriXAGLIQlkNjeJerczLqu-ZrolmvBDpSLEWBFQj7NaJ0fIrGCFKrZ6lr0i3tfILxse4NuaE6YguZTwSFlV-IHvWT8M5Zt04klf8_h6JmzHKmiO-IF25_8YLf_RNdi2LwbWJyM0m3IeZQzda4asK4wf8l7pLFTM",
    "dp": "xwjuH9hWtTnvvulXHur80UvyNNWPh0CBCVZF_VrIENksdTD-njrCKiT6AE1u3YbxKZCs8gbqG5BItm0PEQtvxZ5XhZICCfVDRU2QbyA-XpFeuP8TYHx7JRiv-kphe5l6w04BhHTvge4kFnElBTm9ZuCVdmycGcGdi9cOIeVrCZk",
    "dq": "hYAl2V497FaXAlLVX3C80IbE4tR6m-xIxsuI-DeaLZgMqWKb6zueKeMiyZWV4UyfJT8y4ngK5m0BqgxdwuDispIDma8KxXRIHZJep2NvfFo4qBf0s8RyfmbUHn0kHmO9MCT1ckfRL93HSqOixG1dsCnWv4VcHKUyi_ah5b9iuY8",
    "qi": "_OMRvREu62VD6pC5fT9qs_4AJD9qsX2qKyFxP4Vz5TGPf45_YN3NzsgnqOAGc8oM8NSbX_nu1zeOx5n7BRap1XfXRmUFa365pufzqgdJbXgJeDXCy7bNMM1KfBaplLaBDKfH7qSBbvvBDhKNm1KsJP7ZzyZdldMpQL9JUuC1LE4",
    "key_ops": ["sign"],
    "ext": true,
    "kid": "ca8f54d25e1a8909851d16d89c8c0a87"
  });
  console.log("Imported RS384 private key:", JSON.stringify(clientPrivateKeyRS384));
  const clientPrivateKeyES384 = await importKey({
    "kty": "EC",
    "crv": "P-384",
    "d": "WcrTiYk8jbI-Sd1sKNpqGmELWGG08bf_y9SSlnC4cpAl5GRdHHN9gKYlPvMFqiJ5",
    "x": "wcE8O55ro6aOuTf5Ty1k_IG4mTcuLiVercHouge1G5Ri-leevhev4uJzlHpi3U8r",
    "y": "mLRgz8Giu6XA_AqG8bywqbygShmd8jowflrdx0KQtM5X4s4aqDeCRfcpexykp3aI",
    "kid": "afb27c284f2d93959c18fa0320e32060",
    "alg": "ES384"
  });
  console.log("Imported ES384 private key:", JSON.stringify(clientPrivateKeyES384));
} // test()