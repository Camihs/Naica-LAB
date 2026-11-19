const MODELS = {
  "gaming-pc": "gaming-pc.glb",
  "graphics-card": "graphics-card.glb",
  "motherboard": "motherboard.glb",
  "cpu": "cpu.glb",
  "circuit-board": "circuit-board.glb",
  "pc-case": "pc-case.glb",
  "cpu-cooler": "cpu-cooler.glb",
  "ram-stick": "ram-stick.glb",
  "power-supply-unit": "power-supply-unit.glb",
  "ethernet-cable": "ethernet-cable.glb"
};

module.exports = async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.setHeader("Allow", "GET, HEAD");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { slug, file } = req.query || {};
  if (!slug || !file || MODELS[slug] !== file) {
    return res.status(400).json({ error: "Modelo no válido" });
  }

  try {
    const upstream = await fetch(
      "https://grab3d.com/dl/" + slug + "/" + file,
      {
        headers: { "User-Agent": "Naica-LAB/1.0 (3D educational viewer)" },
        signal: AbortSignal.timeout(25000)
      }
    );

    if (!upstream.ok) {
      return res.status(502).json({ error: "El proveedor del modelo respondió " + upstream.status });
    }

    const bytes = Buffer.from(await upstream.arrayBuffer());
    if (bytes.length < 4 || bytes.toString("ascii", 0, 4) !== "glTF") {
      return res.status(502).json({ error: "El proveedor no devolvió un archivo GLB válido" });
    }

    res.setHeader("Content-Type", "model/gltf-binary");
    res.setHeader("Content-Length", String(bytes.length));
    res.setHeader("Cache-Control", "public, s-maxage=86400, stale-while-revalidate=604800");
    res.setHeader("Access-Control-Allow-Origin", "*");
    return res.status(200).send(req.method === "HEAD" ? undefined : bytes);
  } catch (error) {
    console.error("Naica model proxy:", error);
    return res.status(502).json({ error: "No se pudo obtener el modelo 3D del proveedor" });
  }
};
