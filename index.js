const { TezosWalletUtil, TezosNodeWriter } = require("conseiljs");
const base58check = require("bs58check");
const { blake2b } = require("blakejs");
const libsodium = require("libsodium-wrappers");
const baseN = require("base-n");
const bigInt = require('big-integer');

const tezosNode = "https://tezos-dev.cryptonomic-infra.tech/";

const alphanetFaucetAccount = {
  mnemonic: [
    "fiction",
    "legend",
    "milk",
    "various",
    "fatigue",
    "width",
    "mad",
    "suit",
    "prepare",
    "shrimp",
    "attack",
    "junk",
    "story",
    "radio",
    "hammer"
  ],
  secret: "8223e169a1a1ed5dc689c51a64d2e983ce071626",
  amount: "28333240349",
  pkh: "tz1YaB6TgSRg9YWNHKQYZFZs8XhBxm9akpvn",
  password: "8bSEZmJXBO",
  email: "mniaobrj.ygdsayoq@tezos.example.org"
};

const generateKeystore = () =>
  TezosWalletUtil.unlockFundraiserIdentity(
    alphanetFaucetAccount.mnemonic.join(" "),
    alphanetFaucetAccount.email,
    alphanetFaucetAccount.password,
    alphanetFaucetAccount.pkh
  );

const signMessageNum = async num => {
  const keystore = await generateKeystore();

  const privateKeyBytes = base58check.decode(keystore.privateKey).slice(4); // Remove the preceeding "edsk"

  const messagePrefixHex = "0500";

  const prefixedMessage = Buffer.from(
    messagePrefixHex + writeSignedInt(num),
    "hex"
  ); // Buffer is empty if prefixed with 0x!?

  const hashedMessage = Buffer.from(blake2b(prefixedMessage, null, 32)); // Replace with libsodium.crypto_generichash?

  await libsodium.ready;

  const signature = libsodium.crypto_sign_detached(
    hashedMessage,
    privateKeyBytes
  );

  // Prefix so after base58 encoding, the sig is prefixed with "edsig"
  const prefixedSig = Buffer.concat([
    Buffer.from("09f5cd8612", "hex"),
    signature
  ]);

  return base58check.encode(prefixedSig);
};

const signMessageStr = async message => {
  const keystore = await generateKeystore();

  const privateKeyBytes = base58check.decode(keystore.privateKey).slice(4); // Remove the preceeding "edsk"

  const messagePrefixHex = "0501";

  const messageHex = Buffer.from(message, "ascii").toString("hex");

  const buf = Buffer.allocUnsafe(4);
  buf.writeUInt32BE(message.length, 0);
  const messageLengthHex = buf.toString("hex");

  const prefixedMessage = Buffer.from(
    messagePrefixHex + messageLengthHex + messageHex,
    "hex"
  ); // Buffer is empty if prefixed with 0x!?

  const hashedMessage = Buffer.from(blake2b(prefixedMessage, null, 32)); // Replace with libsodium.crypto_generichash?

  await libsodium.ready;

  const signature = libsodium.crypto_sign_detached(
    hashedMessage,
    privateKeyBytes
  );

  // Prefix so after base58 encoding, the sig is prefixed with "edsig"
  const prefixedSig = Buffer.concat([
    Buffer.from("09f5cd8612", "hex"),
    signature
  ]);

  return base58check.encode(prefixedSig);
};

const closeChannel = async (contractAddress, message, signature) => {
  const keystore = await generateKeystore();
  return TezosNodeWriter.sendContractInvocationOperation(
    tezosNode,
    keystore,
    contractAddress,
    10000,
    100000,
    "",
    1000,
    100000,
    `(Pair "${message}" "${signature}")`
  );
};

/**
 * Utility functions copied from:
 * https://github.com/Cryptonomic/ConseilJS/blob/master/src/chain/tezos/TezosMessageUtil.ts
 */

const base128 = baseN.create({
  characters: [...Array(128).keys()].map(k => ("0" + k.toString(16)).slice(-2))
});

function writeInt(value) {
  if (value < 0) {
    throw new Error("Use writeSignedInt to encode negative numbers");
  }
  return Buffer.from(
    Buffer.from(base128.encode(value), "hex")
      .map((v, i) => {
        return i === 0 ? v : v ^ 0x80;
      })
      .reverse()
  ).toString("hex");
}

/**
 * Encodes a signed integer into hex.
 * @param {number} value Number to be obfuscated.
 */
function writeSignedInt(value) {
  if (value === 0) {
    return "00";
  }

  const n = bigInt(value).abs();
  const l = n.bitLength().toJSNumber();
  let arr = [];
  let v = n;
  for (let i = 0; i < l; i += 7) {
    let byte = bigInt.zero;

    if (i === 0) {
      byte = v.and(0x3f); // first byte makes room for sign flag
      v = v.shiftRight(6);
    } else {
      byte = v.and(0x7f); // NOT base128 encoded
      v = v.shiftRight(7);
    }

    if (value < 0 && i === 0) {
      byte = byte.or(0x40);
    } // set sign flag

    if (i + 7 < l) {
      byte = byte.or(0x80);
    } // set next byte flag
    arr.push(byte.toJSNumber());
  }

  if (l % 7 === 0) {
    arr[arr.length - 1] = arr[arr.length - 1] | 0x80;
    arr.push(1);
  }

  return arr.map(v => ("0" + v.toString(16)).slice(-2)).join("");
}

async function run(amount) {
  console.log(`Public key: ${(await generateKeystore()).publicKey}`);

  const signature = await signMessageNum(amount);
  console.log(`Signature: ${signature}`);

  // TODO Interact with the contract to execute the channel close
  // const response = await closeChannel(
  //   "KT1Rgr9zMhPvHA1nJ4xPbQAMwHwBKiErVowh", // Address of deployed contract
  //   message,
  //   signature
  // );
}

run(100000).catch(err => console.error(err));
