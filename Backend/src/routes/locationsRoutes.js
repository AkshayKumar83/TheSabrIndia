import express from "express";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from 'dotenv';

dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = process.cwd();
const DATA_DIR = path.join(__dirname, "thesabrstorelocationstore");
const OUTPUT_FILE = path.join(DATA_DIR, "india-locations.json");
const BASE_URL = "https://aniket-thapa.github.io/india-pincode-api";
// Fetch JSON helper
async function fetchJson(url) {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed: ${url} - ${response.status}`);
    }
    return response.json();
}

// Generate India location JSON
async function generateLocationData() {
    console.log("Fetching states...");
    const states = await fetchJson(`${BASE_URL}/states.json`);
    const result = {};
    for (const state of states) {
        console.log(`Fetching: ${state.name}`);
        try {
            const stateData = await fetchJson(
                `${BASE_URL}/states/${state.slug}.json`
            );
            result[state.slug] = {
                name: state.name,
                slug: state.slug,
                districts: stateData
            };
        } catch (error) {
            console.error(
                `Failed to fetch ${state.name}:`,
                error.message
            );
            result[state.slug] = {
                name: state.name,
                slug: state.slug,
                districts: []
            };
        }
    }
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(
        OUTPUT_FILE,
        JSON.stringify(result, null, 2)
    );
    console.log("\n✅ Location JSON generated!");
    console.log(`📁 ${OUTPUT_FILE}`);
}

const LocationRouter = express.Router();

LocationRouter.get("/", async (req, res) => {
    try {
        const data = await fs.readFile(
            OUTPUT_FILE,
            "utf-8"
        );
        res.json(JSON.parse(data));

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Location data not available",
        });
    }
});

LocationRouter.get("/generate", async (req, res) => {
    const {gen, pass} = req.query;
    if(!process.env.GEN  || !process.env.PASS) {
        return res.status(500).json({
            success: false,
            message: "Check Route not found//"
        });
    }
    if(!gen || !pass) {
        return res.status(500).json({
            success: false,
            message: "Route not found//"
        });
    }
    if(gen!==process.env.GEN || pass!==process.env.PASS){
        return res.status(500).json({
            success: false,
            message: "Route not found please check//"
        });
    }
    try {

        await generateLocationData();
        const data = await fs.readFile(
            OUTPUT_FILE,
            "utf-8"
        );
        return res.json({
            success:true,
            message:"Success fully generated Inida Locations",
            locations:data
            
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Something went wrong",
            error
        });
    }
});

LocationRouter.get("/:state", async (req, res) => {
    try {
        const data = JSON.parse(
            await fs.readFile(OUTPUT_FILE, "utf-8")
        );
        const state = data[req.params.state];
        if (!state) {
            return res.status(404).json({
                success: false,
                message: "State not found"
            });
        }
        res.json(state);
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Unable to read location data"
        });
    }
});

export default LocationRouter;