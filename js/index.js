// Imports
import { resetTickInterval, updateUnitsPerSecond, startTicks } from "./tick.js";

import { customConsoleLog, initSettings, formatNumberString } from "./settings.js";
import { setAutosave } from "./autosave.js";

// Exports
export const constants = {
    UNITS_ABBR: "u",
    MIN_AUTOSAVE_INTERVAL: 1000,
    MAX_AUTOSAVE_INTERVAL: 30000,
    DEF_AUTOSAVE_INTERVAL: 15000,
    OP_PLS_NERF: 0.75,
    SAVEFILE_VERSION: 14,

    HOME: "home",
    SHOP: "shop",
    SETTINGS: "settings",

    MAX_FIRST_CLICK_DOUBLER: 10,
    MAX_TIER_1_UNIT_GENS: 10,
    COMMAS_NUMBER_FORMAT: "commas",
    PERIOD_NUMBER_FORMAT: "periods",
    SCIENTIFIC_NUMBER_FORMAT: "scientific"
}

export var save;
export var currentPage;

// Variables
var pageSwitchLocked = false;

currentPage = constants.HOME;

var homeLink = $("#homeLink");
var shopLink = $("#shopLink");
var settingsLink = $("#settingsLink");

var homeDiv = $("#mainDiv");
var shopDiv = $("#shopDiv");
var settingsDiv = $("#settingsDiv");

var navUnitsText = $("#navUnitsText");

var starterSave = {
    currencies: {
        units: 0,
    },
    generation: {
        clickPower: 1,
        firstClickDoublers: 0,
        unitsPerSecond: 0,
        baseProdMult: 1,
        tier1UnitGenerators: 0,
        tier1UnitGeneratorPower: 0,
        tier2UnitGenerators: 0,
        tier3UnitGenerators: 0
    },
    lastOpenPage: constants.HOME,
    lastSaved: new Date(),
    settings: {
        darkModeEnabled: true,
        numberFormat: constants.COMMAS_NUMBER_FORMAT,
        autoSaveEnabled: true,
        autoSaveInterval: constants.DEF_AUTOSAVE_INTERVAL,
        tickRate: 50,
        customTickRateAllowed: false,
        OPEnabled: false,
        consoleLogsEnabled: false
    },
    version: constants.SAVEFILE_VERSION
};

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

export function updateCurrencyText() {
    navUnitsText.text(`${formatNumberString(Math.floor(save.currencies.units))}${constants.UNITS_ABBR}${(save.generation.unitsPerSecond > 0 ? `+(${formatNumberString(save.generation.unitsPerSecond)}u/s)` : "")}+(${formatNumberString(save.generation.clickPower)}u/c)`);
}

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

export function saveGameData(isAutoSave) {
    if (isAutoSave === true) {
        customConsoleLog("Autosaving...");
    }

    save.lastSaved = new Date();
    save.lastOpenPage = currentPage;
    save.version = constants.SAVEFILE_VERSION;

    save.currencies.units = Math.floor(save.currencies.units);

    setCookie("save", JSON.stringify(save), 365 * 5);

    customConsoleLog("Save finished. Data:");
    customConsoleLog(save);
}

export function setCookie(name, value, expiration) {
    var date = new Date();
    date.setTime(date.getTime() + expiration * 24 * 60 * 60 * 1000);
    var expires = "expires=" + date.toUTCString();
    document.cookie = name + "=" + value + ";" + expires + ";path=/";
}

function getCookie(name) {
    var name = name + "=";
    var decodedCookie = decodeURIComponent(document.cookie);
    var ca = decodedCookie.split(';');
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}

// Window onload
$(function () {
    // Attempt to load save data
    var saveCookie = getCookie("save");

    if (saveCookie == "") {
        save = starterSave;
    } else {
        save = JSON.parse(saveCookie);

        // Update old save files
        if (save.version == undefined || save.version != constants.SAVEFILE_VERSION) {
            fixSaveFiles(save);

            // Save is up to date
            save.version = constants.SAVEFILE_VERSION;

            customConsoleLog('Hello, world!');
        }

        // Offline progression (75% of estimated online, based off of units per second)
        if (save.settings.OPEnabled) {
            calculateOfflineGain();
        }

        // Goto last open page
        switchToPage(save.lastOpenPage, 0);
    }

    startTicks();
    initSettings();

    function calculateOfflineGain() {
        var now = new Date();
        var difference = (now.getTime() - new Date(save.lastSaved).getTime()) / 1000;
        var offlineGains = Math.floor((difference * save.generation.unitsPerSecond) * constants.OP_PLS_NERF);

        var offlineGainsText = $("#offlineGainsText");

        if (difference > 1) {
            navUnitsText.hide();

            offlineGainsText.text(`You earned ${formatNumberString(offlineGains)}u while you were away`);

            offlineGainsText.slideToggle();

            var anim = setInterval(() => {
                offlineGainsText.slideToggle();
                navUnitsText.slideDown();
                offlineGainsText.text("");
                clearInterval(anim);
            }, 3000);
        }

        save.currencies.units += offlineGains;
    }

    function fixSaveFiles(saveData) {
        // fuck your save (for now)
        save = starterSave;
    }

    // Restore settings from save data
    $("#settingAutosaveEnabled").prop("checked", save.settings.autoSaveEnabled);

    // Auto-save
    // Autosave every 15 seconds - save to cookies
    // Set interval to 15 seconds (15000 milliseconds)
    if (save.settings.autoSaveInterval === undefined ||
        save.settings.autoSaveInterval < constants.MIN_AUTOSAVE_INTERVAL ||
        save.settings.autoSaveInterval > constants.MAX_AUTOSAVE_INTERVAL) {
        save.settings.autoSaveInterval = 15000;
    }

    if (save.settings.autoSaveEnabled) {
        // Turn on autosave
        setAutosave();
    }

    // Navbar code
    homeLink.on("click", function () {
        // Remove active class from all li in nav
        switchToPage(constants.HOME);
        $(this).parent().addClass("active");
    });

    shopLink.on("click", function () {
        switchToPage(constants.SHOP);
        $(this).parent().addClass("active");
    });

    settingsLink.on("click", function () {
        switchToPage(constants.SETTINGS);
        $(this).parent().addClass("active");
    });

    function switchToPage(target, animLength) {
        if (!pageSwitchLocked) {
            if (currentPage != target) {
                // Lock page switch
                pageSwitchLocked = true;

                if (animLength === undefined) {
                    animLength = 400;
                }

                // Remove active classes from all links
                $("nav").find("li").removeClass("active");

                // Hide the current page
                switch (currentPage) {
                    case constants.HOME:
                        homeDiv.slideToggle({
                            complete: function () {
                                doTheShow(animLength);
                            },
                            duration: animLength
                        });
                        break;
                    case constants.SHOP:
                        shopDiv.slideToggle({
                            complete: function () {
                                doTheShow(animLength);
                            },
                            duration: animLength
                        });
                        break;
                    case constants.SETTINGS:
                        settingsDiv.slideToggle({
                            complete: function () {
                                doTheShow(animLength);
                            },
                            duration: animLength
                        });
                        break;
                }

                function doTheShow(animLength) {
                    if (animLength === undefined) {
                        animLength = 400;
                    }

                    // Show the target page
                    switch (target) {
                        case constants.HOME:
                            customConsoleLog('Switching to Home page.');
                            homeDiv.parent
                            homeDiv.slideToggle({
                                duration: animLength
                            });
                            break;
                        case constants.SHOP:
                            customConsoleLog('Switching to Shop page.');
                            shopDiv.slideToggle({
                                duration: animLength
                            });
                            break;
                        case constants.SETTINGS:
                            customConsoleLog('Switching to Settings page.');
                            settingsDiv.slideToggle({
                                duration: animLength
                            });
                            break;
                        default:
                            customConsoleLog('Switching to Home page.');
                            homeDiv.parent
                            homeDiv.slideDown({
                                duration: 0
                            });
                            target = constants.HOME;
                            save.lastOpenPage = constants.HOME;
                            break;
                    }

                    // Update the current page variable
                    currentPage = target;

                    // Unlock page switching
                    pageSwitchLocked = false;

                    // Autosave for accurate page remembering
                    if (save.settings.autoSaveEnabled) {
                        saveGameData();
                    }
                }
            }
        }
    }

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
            unitButtonDescription.text(`${formatNumberString(save.generation.clickPower)} units`);

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

    /* Main Currency Button Code */
    var btnClickMe = $("#btnClickMe");
    var unitButtonDescription = $("#unitButtonDescription");

    if (save.generation.clickPower > 1) {
        unitButtonDescription.text(`${formatNumberString(save.generation.clickPower)} units`);
    }

    updateCurrencyText();

    btnClickMe.on("click", unitsButtonClicked);

    function unitsButtonClicked() {
        save.currencies.units += save.generation.clickPower * save.generation.baseProdMult;
        updateCurrencyText();
    }
});

