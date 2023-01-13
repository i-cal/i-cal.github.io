// Imports
import { resetTickInterval, updateUnitsPerSecond, startTicks } from "./tick.js";

import { customConsoleLog, initSettings, formatNumberString } from "./settings.js";
import { setAutosave } from "./autosave.js";
import { initShop } from "./shop.js";

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

export function updateCurrencyText() {
    navUnitsText.text(`${formatNumberString(Math.floor(save.currencies.units))}${constants.UNITS_ABBR}${(save.generation.unitsPerSecond > 0 ? `+(${formatNumberString(save.generation.unitsPerSecond)}u/s)` : "")}+(${formatNumberString(save.generation.clickPower)}u/c)`);
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

    currentPage = constants.HOME;

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
    initShop();

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
