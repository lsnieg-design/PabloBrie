
const crypto = require("crypto");

const API_VERSION = "2022-11-28";
const FILE_PATH = "data/funciones.json";

function send(res, status, payload) {
    return res.status(status).json(payload); 
}

function passwordMatches(candidate, expected) {
    if (typeof candidate !== "string" || typeof expected !== "string" || !expected) {
        return false;
    }

    const a = Buffer.from(candidate);
    const b = Buffer.from(expected);

    return a.length === b.length &&
        crypto.timingSafeEqual(a, b);
}

function githubHeaders(token) {
    return {
        "Accept": "application/vnd.github+json",
        "Authorization": `Bearer ${token}`,
        "X-GitHub-Api-Version": API_VERSION,
        "User-Agent": "PabloBrie-Agenda-Manager"
    };
}

async function getAgendaFile({ owner, repo, branch, token }) {
    const url = `https://api.github.com/repos/${owner}/${repo}/contents/${FILE_PATH}?ref=${encodeURIComponent(branch)}`;

    const response = await fetch(url, {
        headers: githubHeaders(token)
    });

    if (!response.ok) {
        const details = await response.text();
        throw new Error(
            `GitHub no pudo leer la agenda (${response.status}): ${details.slice(0, 300)}`
        );
    }

    const file = await response.json();

    const decoded = Buffer.from(
        file.content.replace(/\n/g, ""),
        "base64"
    ).toString("utf8");

    return {
        sha: file.sha,
        functions: JSON.parse(decoded)
    };
}

function normalizeFunctions(input) {
    if (!Array.isArray(input)) {
        throw new Error("La agenda debe ser una lista de funciones.");
    }

    if (input.length > 100) {
        throw new Error("Podés cargar hasta 100 funciones.");
    }

    return input.map((item, index) => {
        const date = String(item.date || "").trim();
        const time = String(item.time || "").trim();
        const city = String(item.city || "").trim();
        const venue = String(item.venue || "").trim();
        const ticketUrl = String(item.ticketUrl || "").trim();

        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            throw new Error(`Revisá la fecha de la función ${index + 1}.`);
        }

        if (!city || !venue) {
            throw new Error(`Completá ciudad y lugar en la función ${index + 1}.`);
        }

        if (ticketUrl && !/^https?:\/\/\S+$/i.test(ticketUrl)) {
            throw new Error(`El enlace de entradas de la función ${index + 1} no es válido.`);
        }

        return {
            date,
            time,
            city,
            venue,
            ticketUrl,
            visible: item.visible !== false
        };
    }).sort((a, b) => a.date.localeCompare(b.date));
}

module.exports = async function handler(req, res) {
        if (req.method === "GET") {
        return res.status(200).json({
            diagnostic: "Agenda API",
            variables: {
                AGENDA_ADMIN_PASSWORD: !!process.env.AGENDA_ADMIN_PASSWORD,
                GITHUB_TOKEN: !!process.env.GITHUB_TOKEN,
                GITHUB_OWNER: !!process.env.GITHUB_OWNER,
                GITHUB_REPO: !!process.env.GITHUB_REPO,
                GITHUB_BRANCH: !!process.env.GITHUB_BRANCH
            }
        });
    }

    if (req.method !== "POST") {
        res.setHeader("Allow", "POST");
        return send(res, 405, {
            error: "Método no permitido."
        });
    }

    const {
        AGENDA_ADMIN_PASSWORD,
        GITHUB_TOKEN,
        GITHUB_OWNER,
        GITHUB_REPO,
        GITHUB_BRANCH = "main"
    } = process.env;

    // DIAGNÓSTICO DE VARIABLES
    const missing = [];

    if (!AGENDA_ADMIN_PASSWORD) missing.push("AGENDA_ADMIN_PASSWORD");
    if (!GITHUB_TOKEN) missing.push("GITHUB_TOKEN");
    if (!GITHUB_OWNER) missing.push("GITHUB_OWNER");
    if (!GITHUB_REPO) missing.push("GITHUB_REPO");

    if (missing.length > 0) {
        console.error("Variables faltantes:", missing);

        return send(res, 500, {
            error: "Variables no disponibles: " + missing.join(", ")
        });
    }

    const body = req.body || {};

    if (!passwordMatches(body.password, AGENDA_ADMIN_PASSWORD)) {
        return send(res, 401, {
            error: "Contraseña incorrecta."
        });
    }

    const github = {
        owner: GITHUB_OWNER,
        repo: GITHUB_REPO,
        branch: GITHUB_BRANCH,
        token: GITHUB_TOKEN
    };

    try {

        if (body.action === "login") {
            const file = await getAgendaFile(github);

            return send(res, 200, {
                ok: true,
                functions: file.functions
            });
        }

        if (body.action === "save") {

            const functions = normalizeFunctions(body.functions);

            const current = await getAgendaFile(github);

            const content = Buffer.from(
                `${JSON.stringify(functions, null, 2)}\n`,
                "utf8"
            ).toString("base64");

            const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${FILE_PATH}`;

            const response = await fetch(url, {
                method: "PUT",
                headers: {
                    ...githubHeaders(GITHUB_TOKEN),
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    message: "Actualizar agenda de próximas funciones",
                    content,
                    sha: current.sha,
                    branch: GITHUB_BRANCH
                })
            });

            if (!response.ok) {
                const details = await response.text();

                throw new Error(
                    `GitHub no pudo guardar los cambios (${response.status}): ${details.slice(0, 300)}`
                );
            }

            return send(res, 200, {
                ok: true,
                message: "Agenda guardada. Vercel comenzará a publicar los cambios."
            });
        }

        return send(res, 400, {
            error: "Acción no reconocida."
        });

    } catch (error) {

        console.error("Error en API de agenda:", error);

        return send(res, 500, {
            error: error.message || "No se pudo procesar la agenda."
        });
    }
};
