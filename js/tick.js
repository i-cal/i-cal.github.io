// Imports
import {constants} from "./index.js";

import {save} from "./index.js";
import { currentPage } from "./index.js";

import {updateCurrencyText} from "./index.js";
import {updateFirstClickDoublerTexts} from "./index.js";
import {updatetier1UnitGenTexts} from "./index.js";

var tickInterval;

export function startTicks() {
    /* DO TICKS N SHIT */
    tickInterval = setInterval(() => {
        doTick();
    }, save.settings.tickRate);
}

function doTick() {
    // Calculate idle gain
    if(save.generation.unitsPerSecond > 0) {
        var gain = calculateIdleGain();
        save.currencies.units += gain;

        // Update currency text
        updateCurrencyText();
    }

    // Update shop buttons if page is open
    if(currentPage == constants.SHOP) {
        // If unbought first click doublers
        if(save.generation.firstClickDoublers < constants.MAX_FIRST_CLICK_DOUBLER) {
            updateFirstClickDoublerTexts();
        }
        
        // If unbought Tier 1 Main Generators
        if(save.generation.tier1UnitGenerators < constants.MAX_TIER_1_UNIT_GENS) {
            updatetier1UnitGenTexts();
        }
    }
}

export function resetTickInterval() {
    clearInterval(tickInterval);

    tickInterval = setInterval(() => {
        doTick();
    }, save.settings.tickRate);
}

export function updateUnitsPerSecond() {
    save.generation.unitsPerSecond = save.generation.tier1UnitGeneratorPower; // add future generator powers to this
}

function calculateIdleGain() {
    var gainPerMillisecond = save.generation.unitsPerSecond / 1000;
    var gainPerTick = gainPerMillisecond * save.settings.tickRate;
    return gainPerTick;
}