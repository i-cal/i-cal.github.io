// Imports

// Index
// Variables from index
import { constants, currentPage, save } from "./index.js";
// Functions from index
import { updateCurrencyText } from "./index.js";

// Settings
// Functions from settings
import { customConsoleLog } from "./settings.js";

// Shop
// Functions from shop
import { updateFirstClickDoublerTexts, updatetier1UnitGenTexts, checkForAffordablePurchase, updateIdleRecyclerTexts } from "./shop.js";

var tickInterval;

export function startTicks() {
    /* DO TICKS N SHIT */
    tickInterval = setInterval(() => {
        doTick();
    }, save.settings.tickRate);
}

function doTick() {
    // Calculate idle gain
    if (save.generation.unitsPerSecond > 0) {
        var gain = calculateIdleGain();
        save.currencies.units += gain;

        // Update currency text
        updateCurrencyText();
    }

    // Update shop buttons if page is open
    if (currentPage == constants.SHOP) {
        // If unbought first click doublers
        if (save.generation.firstClickDoublers < constants.MAX_FIRST_CLICK_DOUBLER) {
            updateFirstClickDoublerTexts();
        }

        // If unbought Tier 1 Main Generators
        if (save.generation.tier1UnitGenerators < constants.MAX_TIER_1_UNIT_GENS) {
            updatetier1UnitGenTexts();
        }

        // If unbought idle recyclers and max tier 1 gens
        if (save.generation.idleRecyclers < constants.MAX_IDLE_RECYCLERS && save.generation.tier1UnitGenerators == constants.MAX_TIER_1_UNIT_GENS) {
            updateIdleRecyclerTexts();
        }
    }

    // Check for available shop purchase
    checkForAffordablePurchase();
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