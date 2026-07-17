import enJson from "./en.json";
import { LEGAL_SECTIONS } from "../content/legal.js";

const legalEntries = {};
for (const section of LEGAL_SECTIONS) {
  legalEntries[`legal.${section.id}.title`] = section.title;
  legalEntries[`legal.${section.id}.body`] = section.body;
}

/** Full English catalog sent to Gemini for translation. */
export const EN_STRINGS = { ...enJson, ...legalEntries };

export default EN_STRINGS;
