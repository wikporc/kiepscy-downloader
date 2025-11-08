import { spawn as spwn } from "child_process";
import fs from "fs";

const spawn = (cmd, args) =>
  new Promise((resolve, reject) => {
    const cp = spwn(cmd, args, { stdio: "inherit" });
    cp.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error("Exit code: " + code));
    });
  });

function readFile() {
  return fs.readFileSync("./links.txt", "utf8");
}

async function stateMachine(textContent) {
  const lines = textContent.split("\n");

  let seasonNumber;
  let episodeNumber;
  let episodeName;

  for (let line of lines) {
    const cleaned = line.trim();
    const lc = cleaned.toLowerCase();

    if (lc.startsWith("sezon")) {
      seasonNumber = lc.split(" ")[1];
      console.log("\n=== SEZON", seasonNumber, "===\n");
      continue;
    }

    if (/^\d+\./.test(cleaned)) {
      const parts = cleaned.split(". ");
      episodeNumber = parts[0];
      episodeName = parts[1];
      continue;
    }

    if (cleaned.startsWith("http")) {
      const episodeUrl = cleaned;

      const directoryName = `Świat.Według.Kiepskich.S${seasonNumber.padStart(2, "0")}`;
      let sanitized = episodeName.replace(/[^A-Za-z0-9À-ž]/g, ".");
      if (sanitized.endsWith(".")) sanitized = sanitized.slice(0, -1);
      const fileName =
        `Świat.Według.Kiepskich.S${seasonNumber.padStart(2, "0")}E${episodeNumber.padStart(3, "0")}.${sanitized}`;

      console.log(`Pobieranie: ${fileName}`);

      await spawn("python", [
        "-m",
        "yt_dlp",
        "-f", "bestvideo+bestaudio/best",
        "--concurrent-fragments", "8",  // odcinki są na jakiejś ruskiej stronie więc pobieranie jest powolne, dlatego ustawiłem pobieranie 8 fragmentów jednocześnie. Pewnie można podnieść to jeszcze trochę
        episodeUrl,
        "-o",
        `./downloads/${directoryName}/${fileName}.%(ext)s`,
      ]);

      console.log("OK\n");
    }
  }
}

stateMachine(readFile());
