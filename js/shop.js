import { constants, save } from "./index.js";
import { updateCurrencyText } from "./index.js";
import { formatNumberString } from "./settings.js";
import { updateUnitsPerSecond } from "./tick.js";

/* Outer shop code */
var doDevPrices = false;
var devPriceScale = {
    0: 0,
    1: 1,
    2: 2,
    3: 3,
    4: 4,
    5: 5,
    6: 6,
    7: 7,
    8: 8,
    9: 9
}

// First Click Doubler Variables and Functions
var buyClickUpgradeButton = $("#buyClickUpgradeButton");
var firstClickDoublerFlavorText = $("#clickUpgradeIncreaseFlavorText");
var firstClickDoublersCountText = $("#firstClickDoublersCount");
var firstClickDoublerPrices = {
    0: 450,
    1: 1800,
    2: 5400,
    3: 14400,
    4: 36000,
    5: 86400,
    6: 201600,
    7: 460800,
    8: 1036800,
    9: 2304000
}

var currentFirstClickDoublerPrice;

var firstClickDoublerAnimLock = false;
var firstClickDoublerFlavorAnimation;

export function updateFirstClickDoublerTexts() {
    if (save.generation.firstClickDoublers < constants.MAX_FIRST_CLICK_DOUBLER) {
        buyClickUpgradeButton.prop("disabled", !(save.currencies.units >= currentFirstClickDoublerPrice));
        buyClickUpgradeButton.text(`Buy (${formatNumberString(currentFirstClickDoublerPrice)}u)`);
    } else {
        buyClickUpgradeButton.prop("disabled", true);
        buyClickUpgradeButton.text(`Maxed!`);
    }

    firstClickDoublersCountText.text(`${save.generation.firstClickDoublers}/${constants.MAX_FIRST_CLICK_DOUBLER}`);
}


function updateFirstClickDoublerPrice() {
    if (doDevPrices) {
        currentFirstClickDoublerPrice = devPriceScale[save.generation.firstClickDoublers];
    } else {
        currentFirstClickDoublerPrice = firstClickDoublerPrices[save.generation.firstClickDoublers];
    }
}

// Tier 1 Unit Generator variables and functions
var buytier1UnitGenButton = $("#buyTier1UnitGenButton");
var tier1UnitGenCountText = $("#tier1UnitGenCountText");
var tier1UnitGenDescriptionText = $("#tier1UnitGenDescriptionText");
var tier1UnitGenIncreaseFlavorText = $("#tier1UnitGenIncreaseFlavorText");

var tier1UnitGenPrices = {
    0: 57600,
    1: 175200,
    2: 352800,
    3: 710400,
    4: 1488000,
    5: 3225600,
    6: 7123200,
    7: 15820800,
    8: 35078400,
    9: 77376000
}

var currentTier1UnitGenPrice;

var tier1UnitGenAnimLock = false;
var tier1UnitGenFlavorAnimation;

export function updatetier1UnitGenTexts() {
    if (save.generation.tier1UnitGenerators < constants.MAX_TIER_1_UNIT_GENS) {
        buytier1UnitGenButton.prop("disabled", !(save.currencies.units >= currentTier1UnitGenPrice));
        buytier1UnitGenButton.text(`Buy (${formatNumberString(currentTier1UnitGenPrice)}u)`);
        tier1UnitGenDescriptionText.text(`Increases idle production to ${formatNumberString(save.generation.tier1UnitGeneratorPower == 0 ? 1000 : save.generation.tier1UnitGeneratorPower * 2)}u/s`);
    } else {
        buytier1UnitGenButton.prop("disabled", true);
        buytier1UnitGenButton.text(`Maxed!`);
        tier1UnitGenDescriptionText.text(`Tier 1 idle production is maxed at ${formatNumberString(save.generation.tier1UnitGeneratorPower)}u/s.`);
    }

    tier1UnitGenCountText.text(`${save.generation.tier1UnitGenerators}/${constants.MAX_TIER_1_UNIT_GENS}`);
}

function updatetier1UnitGenPrice() {
    if (doDevPrices) {
        currentTier1UnitGenPrice = devPriceScale[save.generation.tier1UnitGenerators];
    } else {
        currentTier1UnitGenPrice = tier1UnitGenPrices[save.generation.tier1UnitGenerators];
    }
}

export function initShop() {
    /* Shop code */
    if (doDevPrices) {
        $("body").css({
            backgroundColor: "darkred"
        });
    }

    // First Click Doubler
    updateFirstClickDoublerPrice();
    updateFirstClickDoublerTexts();

    buyClickUpgradeButton.on("click", function () {
        // Check if user can afford
        if (save.currencies.units >= currentFirstClickDoublerPrice) {
            // Subtract cost from units
            save.currencies.units -= currentFirstClickDoublerPrice;

            // Update doubler count
            save.generation.firstClickDoublers += 1;

            // Update current price
            updateFirstClickDoublerPrice();

            // Update texts
            updateFirstClickDoublerTexts();

            // Double user click power
            save.generation.clickPower *= 2;

            // Update currency text
            updateCurrencyText();

            // Update main page button description
            $("#unitButtonDescription").text(`${formatNumberString(save.generation.clickPower)} units`);

            // Show flavor text
            if (firstClickDoublerAnimLock) {
                clearInterval(firstClickDoublerFlavorAnimation);
                firstClickDoublerFlavorText.hide();
            }

            firstClickDoublerFlavorText.text(`Clicking power is now ${formatNumberString(save.generation.clickPower)}u/c!`);
            firstClickDoublerFlavorText.slideDown();

            firstClickDoublerAnimLock = true;

            firstClickDoublerFlavorAnimation = setInterval(() => {
                firstClickDoublerFlavorText.slideUp();
                firstClickDoublerAnimLock = false;
                clearInterval(firstClickDoublerFlavorAnimation);
            }, 3000);
        }
    });

    // Tier 1 Main Generator
    updatetier1UnitGenPrice();
    updatetier1UnitGenTexts();

    buytier1UnitGenButton.on("click", function () {
        // Check if user can afford
        if (save.currencies.units >= currentTier1UnitGenPrice) {
            // Subtract cost from units
            save.currencies.units -= currentTier1UnitGenPrice;

            // Update gen count
            save.generation.tier1UnitGenerators += 1;

            // Update gain per second
            save.generation.tier1UnitGeneratorPower = save.generation.tier1UnitGeneratorPower == 0 ? 1000 : save.generation.tier1UnitGeneratorPower * 2;
            updateUnitsPerSecond();

            // Update current price
            updatetier1UnitGenPrice();

            // Update texts
            updatetier1UnitGenTexts();

            // Update currency text
            updateCurrencyText();

            // Show flavor text
            if (tier1UnitGenAnimLock) {
                clearInterval(tier1UnitGenFlavorAnimation);
                tier1UnitGenIncreaseFlavorText.hide();
            }

            tier1UnitGenIncreaseFlavorText.text(`Tier 1 Unit Generator power is now ${formatNumberString(save.generation.tier1UnitGeneratorPower)}u/s!`);
            tier1UnitGenIncreaseFlavorText.slideDown();

            tier1UnitGenAnimLock = true;

            tier1UnitGenFlavorAnimation = setInterval(() => {
                tier1UnitGenIncreaseFlavorText.slideUp();
                tier1UnitGenAnimLock = false;
                clearInterval(tier1UnitGenFlavorAnimation);
            }, 3000);
        }
    });
}