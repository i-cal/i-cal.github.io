// Imports
import {resetTickInterval} from "./tick.js";
import {updateUnitsPerSecond} from "./tick.js";
import { startTicks } from "./tick.js";

// Exports
export const constants = {
    UNITS_ABBR: "u",
    MIN_AUTOSAVE_INTERVAL : 1000,
    MAX_AUTOSAVE_INTERVAL : 30000,
    DEF_AUTOSAVE_INTERVAL : 15000,
    OP_PLS_NERF : 0.75,
    SAVEFILE_VERSION : 13,

    HOME : "home",
    SHOP : "shop",
    SETTINGS : "settings",
    
    MAX_FIRST_CLICK_DOUBLER : 10,
    MAX_TIER_1_UNIT_GENS : 10,
    COMMAS_NUMBER_FORMAT : "commas",
    PERIOD_NUMBER_FORMAT : "periods",
    SCIENTIFIC_NUMBER_FORMAT : "scientific"
}

export var save;
export var currentPage;

// Variables
var autosaveTimer;

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
    if(save.generation.firstClickDoublers < constants.MAX_FIRST_CLICK_DOUBLER) {
        buyClickUpgradeButton.prop("disabled", !(save.currencies.units >= currentFirstClickDoublerPrice));
        buyClickUpgradeButton.text(`Buy (${formatNumberString(currentFirstClickDoublerPrice)}u)`);
    } else {
        buyClickUpgradeButton.prop("disabled", true);
        buyClickUpgradeButton.text(`Maxed!`);
    }

    firstClickDoublersCountText.text(`${save.generation.firstClickDoublers}/${constants.MAX_FIRST_CLICK_DOUBLER}`);
}

function updateFirstClickDoublerPrice() {
    if(doDevPrices) {
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
    if(save.generation.tier1UnitGenerators < constants.MAX_TIER_1_UNIT_GENS) {
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
    if(doDevPrices) {
        currentTier1UnitGenPrice = devPriceScale[save.generation.tier1UnitGenerators];
    } else {
        currentTier1UnitGenPrice = tier1UnitGenPrices[save.generation.tier1UnitGenerators];
    }
}

/* Outer settings code */
// Number format
export function formatNumberString(numberToFormat) {
    var formatted;

    switch(save.settings.numberFormat) {
        case constants.COMMAS_NUMBER_FORMAT:
            formatted = numberToFormat.toLocaleString();
            break;
        case constants.PERIOD_NUMBER_FORMAT:
            formatted = numberToFormat.toLocaleString("de-DE");
            break;
        case constants.SCIENTIFIC_NUMBER_FORMAT:
            if(numberToFormat >= 1000) {
                formatted = (numberToFormat.toExponential(2)).replace("+", "");
            } else {
                formatted = numberToFormat.toLocaleString();
            }
            break;
        default:
            formatted = numberToFormat.toLocaleString();
            break;
    }

    return formatted;
}

// Window onload
$(function() {
    // Attempt to load save data
    var saveCookie = getCookie("save");

    if(saveCookie == "") {
        save = starterSave;
    } else {
        save = JSON.parse(saveCookie);
        
        // Update old save files
        if(save.version == undefined || save.version < constants.SAVEFILE_VERSION) {
            fixSaveFiles(save);

            // Save is up to date
            save.version = constants.SAVEFILE_VERSION;

            customConsoleLog('Hello, world!');
        }

        // Offline progression (75% of estimated online, based off of units per second)
        if(save.settings.OPEnabled) {
            calculateOfflineGain();
        }

        // Goto last open page
        switchToPage(save.lastOpenPage, 0);

        startTicks();
    }

    function calculateOfflineGain() {
        var now = new Date();
        var difference = (now.getTime() - new Date(save.lastSaved).getTime()) / 1000;
        var offlineGains = Math.floor((difference * save.generation.unitsPerSecond) * constants.OP_PLS_NERF);

        var offlineGainsText = $("#offlineGainsText");

        if(difference > 1) {
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
        if(saveData.version === undefined || saveData.version < constants.SAVEFILE_VERSION) {
            // Fix if save was from before currencies were separate JSON object
            if(save.currencies == undefined) {
                save.currencies = {
                    units: save.units
                }

                // Units were still called mainCurrency in the save file when this fix was relevant.
                delete save.mainCurrency;
            }

            // Fix if save was from before settings were separate JSON object
            if(save.settings == undefined) {
                save.settings = {
                    autoSaveEnabled: save.autoSaveEnabled,
                    autoSaveInterval: save.autoSaveInterval
                };

                delete save.autoSaveEnabled;
                delete save.autoSaveInterval;
            }

            // Set last open page to home
            if(save.lastOpenPage == undefined) {
                save.lastOpenPage = constants.HOME;
            }

            // Set save date
            if(save.lastSaved == undefined) {
                save.lastSaved = new Date();
            }

            // If before shop & generation update, generation attributes need to be added
            if(save.generation == undefined) {
                save.generation = starterSave.generation;
            }

            // Version < 3
            if(save.settings.tickRate == undefined) {
                save.settings.tickRate = 50;
            }

            // Version < 4
            // if(save.generation.firstMainGeneratorPower == undefined) {
            //     save.generation.firstMainGeneratorPower = 0;
            // }

            // Version < 5
            if(save.settings.customTickRateAllowed == undefined) {
                save.settings.customTickRateAllowed = false;
            }

            // Version < 6
            if(save.settings.OPEnabled == undefined) {
                save.settings.OPEnabled = false;
            }

            // Version < 7
            if(save.settings.darkModeEnabled == undefined) {
                save.settings.darkModeEnabled = false;
            }

            // Version < 8 - IC-7
            if(save.lastOpenPage == "devtodo") {
                save.lastOpenPage = "home";
            }

            // Version < 9 - IC-1
            if(save.settings.numberFormat == undefined) {
                save.settings.numberFormat = constants.COMMAS_NUMBER_FORMAT;
            }

            // Version < 10 - IC-9
            if(save.settings.numberFormat == "full") {
                save.settings.numberFormat = constants.COMMAS_NUMBER_FORMAT;
            }

            // Version < 11 - IC-15
            if(save.currencies.units == undefined) {
                save.currencies.units = save.currencies.mainCurrency;

                delete save.currencies.mainCurrency;
            }
            
            // Version < 12 - IC-15
            if(save.generation.unitsPerSecond == undefined) {
                save.generation.unitsPerSecond = save.generation.mainPerSecond;

                delete save.generation.mainPerSecond;
            }

            if(save.generation.baseProdMult == undefined) {
                save.generation.baseProdMult = save.generation.mainProdMult;

                delete save.generation.mainProdMult;
            }

            if(save.generation.tier1UnitGenerators == undefined) {
                save.generation.tier1UnitGenerators = save.generation.firstMainGenerators;

                delete save.generation.firstMainGenerators;
            }

            if(save.generation.tier1UnitGeneratorPower == undefined) {
                save.generation.tier1UnitGeneratorPower = save.generation.firstMainGeneratorPower;

                delete save.generation.firstMainGeneratorPower;
            }

            if(save.generation.tier2UnitGenerators == undefined) {
                save.generation.tier2UnitGenerators = save.generation.secondMainGenerators;

                delete save.generation.secondMainGenerators;
            }

            if(save.generation.tier3UnitGenerators == undefined) {
                save.generation.tier3UnitGenerators = save.generation.thirdMainGenerators;

                delete save.generation.thirdMainGenerators;
            }

            // Version < 13 - IC-19
            if(save.settings.consoleLogsEnabled == undefined) {
                save.settings.consoleLogsEnabled = false;
            }
        }
    }

    // Restore settings from save data
    $("#settingAutosaveEnabled").prop("checked", save.settings.autoSaveEnabled);
    
    // Auto-save
    // Autosave every 15 seconds - save to cookies
    // Set interval to 15 seconds (15000 milliseconds)
    if(save.settings.autoSaveInterval === undefined || 
        save.settings.autoSaveInterval < constants.MIN_AUTOSAVE_INTERVAL || 
        save.settings.autoSaveInterval > constants.MAX_AUTOSAVE_INTERVAL) {
        save.settings.autoSaveInterval = 15000;
    }

    if(save.settings.autoSaveEnabled) {
        // Call the function every 15 seconds
        autosaveTimer = setInterval(function() {
            saveGameData(true);
        }, save.settings.autoSaveInterval);
    }

    function saveGameData(isAutoSave) {
        if(isAutoSave === true) {
            customConsoleLog("Autosaving...");
        }
        
        save.lastSaved = new Date();
        save.lastOpenPage = currentPage;
        save.version = constants.SAVEFILE_VERSION;

        save.currencies.units = Math.floor(save.currencies.units);

        setCookie("save", JSON.stringify(save), 1);
        
        customConsoleLog("Save finished. Data:");
        customConsoleLog(save);
    }

    function setCookie(name, value, expiration) {
        var date = new Date();
        date.setTime(date.getTime() + expiration * 24 * 60 * 60 * 1000);
        var expires = "expires=" + date.toUTCString();
        document.cookie = name + "=" + value + ";" + expires + ";path=/";
    }

    function getCookie(name) {
        var name = name + "=";
        var decodedCookie = decodeURIComponent(document.cookie);
        var ca = decodedCookie.split(';');
        for(var i = 0; i <ca.length; i++) {
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

    // Navbar code
    homeLink.on("click", function() {
        // Remove active class from all li in nav
        switchToPage(constants.HOME);
        $(this).parent().addClass("active");
    });

    shopLink.on("click", function() {
        switchToPage(constants.SHOP);
        $(this).parent().addClass("active");
    });

    settingsLink.on("click", function() {
        switchToPage(constants.SETTINGS);
        $(this).parent().addClass("active");
    });

    function switchToPage(target, animLength) {
        if(!pageSwitchLocked) {
            if(currentPage != target) {
                // Lock page switch
                pageSwitchLocked = true;
                
                if(animLength === undefined) {
                    animLength = 400;
                }

                // Remove active classes from all links
                $("nav").find("li").removeClass("active");

                // Hide the current page
                switch(currentPage) {
                    case constants.HOME:
                        homeDiv.slideToggle({
                            complete: function() {
                                doTheShow(animLength);
                            },
                            duration: animLength
                        });
                        break;
                    case constants.SHOP:
                        shopDiv.slideToggle({
                            complete: function() {
                                doTheShow(animLength);
                            },
                            duration: animLength
                        });
                        break;
                    case constants.SETTINGS:
                        settingsDiv.slideToggle({
                            complete: function() {
                                doTheShow(animLength);
                            },
                            duration: animLength
                        });
                        break;
                }
    
                function doTheShow(animLength) {
                    if(animLength === undefined) {
                        animLength = 400;
                    }

                    // Show the target page
                    switch(target) {
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
                    if(save.settings.autoSaveEnabled) {
                        saveGameData();
                    }
                }
            }
        }
    }

    /* Settings code */
    // Manual Save
    var settingsSaveButton = $("#settingsSaveButton");
    var settingsManualSaveFinished = $("#settingsManualSaveFinished");
    settingsSaveButton.on("click", function() {
        saveGameData();
        settingsSaveButton.slideToggle();
        settingsManualSaveFinished.slideToggle();
        settingsSaveButton.prop("disabled", true);
        var anim = setInterval(() => {
            settingsManualSaveFinished.slideToggle();
            clearInterval(anim);
            settingsSaveButton.prop("disabled", false);
            settingsSaveButton.slideToggle();
        }, 3000);
    });

    // Dark Mode
    var settingsDarkModeToggle = $("#settingsDarkModeToggle");
    var settingsDarkModeFlavorText = $("#settingsDarkModeFlavorText");

    settingsDarkModeToggle.prop("checked", save.settings.darkModeEnabled);

    if(save.settings.darkModeEnabled) {
        $('body').toggleClass('dark-mode');
        $('nav').toggleClass('bg-light navbar-light navbar-dark bg-dark');
    }

    settingsDarkModeToggle.on('click', function() {
        $('body').toggleClass('dark-mode');
        $('nav').toggleClass('bg-light navbar-light navbar-dark bg-dark');
        save.settings.darkModeEnabled = settingsDarkModeToggle.prop("checked");
        saveGameData();

        if(!($(this).prop("checked"))) {
            settingsDarkModeFlavorText.text("FLASHBANG OUT");
            settingsDarkModeFlavorText.slideToggle();

            var settingsDarkModeFlavorTextAnim = setInterval(() => {
                settingsDarkModeFlavorText.slideToggle();
                clearInterval(settingsDarkModeFlavorTextAnim);
            }, 3000);
        }
    });
    
    // Number Format
    var settingsNumberFormat = $("#settingsNumberFormat");

    settingsNumberFormat.val(save.settings.numberFormat);

    settingsNumberFormat.on("change", function() {
        var chosen = $(this).val();
        
        switch(chosen) {
            case constants.COMMAS_NUMBER_FORMAT:
                save.settings.numberFormat = constants.COMMAS_NUMBER_FORMAT;
                break;
            case constants.PERIOD_NUMBER_FORMAT:
                save.settings.numberFormat = constants.PERIOD_NUMBER_FORMAT;
                break;
            case constants.SCIENTIFIC_NUMBER_FORMAT:
                save.settings.numberFormat = constants.SCIENTIFIC_NUMBER_FORMAT;
                break;
            default:
                save.settings.numberFormat = constants.COMMAS_NUMBER_FORMAT;
                break;
        }

        customConsoleLog(`Number format changed to ${save.settings.numberFormat}.`);

        // Update all shop texts
        if(save.generation.firstClickDoublers < constants.MAX_FIRST_CLICK_DOUBLER) {
            updateFirstClickDoublerTexts();
        }
        
        updatetier1UnitGenTexts();

        saveGameData();
    });

    // Autosave Enabled
    var settingAutosaveEnabled = $("#settingAutosaveEnabled");
    var autosaveDisabledFlavorText = $(".autosaveDisabledFlavorText");
    var settingAutosaveIntervalDiv = $("#settingAutosaveIntervalDiv");
    
    if(save.settings.autoSaveEnabled) {
        autosaveDisabledFlavorText.hide();
        settingAutosaveIntervalDiv.show();
    } else {
        autosaveDisabledFlavorText.show();
        settingAutosaveIntervalDiv.hide();
    }

    settingAutosaveEnabled.on("click", function() {
        customConsoleLog("Autosave enabled: " + settingAutosaveEnabled.prop("checked"));
        save.settings.autoSaveEnabled = settingAutosaveEnabled.prop("checked");
        settingAutosaveInterval.prop("disabled", !save.settings.autoSaveEnabled);
        settingAutosaveIntervalDiv.slideToggle();

        if(save.settings.autoSaveEnabled) {
            autosaveTimer = setInterval(() => {
                saveGameData();
            }, save.settings.autoSaveInterval);

            autosaveDisabledFlavorText.slideToggle();
        } else {
            clearInterval(autosaveTimer);
            autosaveDisabledFlavorText.slideToggle();
        }

        saveGameData(); // To save the new setting
    });

    // Autosave Interval
    var settingAutosaveInterval = $("#settingAutosaveInterval");
    var settingAutosaveIntervalCurrentValue = $("#settingAutosaveIntervalCurrentValue");

    settingAutosaveInterval.prop("disabled", !save.settings.autoSaveEnabled);
    settingAutosaveInterval.val(save.settings.autoSaveInterval / 1000);
    settingAutosaveIntervalCurrentValue.text((save.settings.autoSaveInterval / 1000) + " second" + (save.settings.autoSaveInterval / 1000 != 1 ? "s" : ""));

    settingAutosaveInterval.on("input", function() {
        var value = $(this).val();
        settingAutosaveIntervalCurrentValue.text(value + " second" + (value != 1 ? "s" : ""));
    });

    settingAutosaveInterval.on("change", function() {
        var value = $(this).val();
        
        // Update save data
        save.settings.autoSaveInterval = value * 1000;

        // Clear old interval
        clearInterval(autosaveTimer);

        // Set new interval
        autosaveTimer = setInterval(() => {
            saveGameData(true);
        }, save.settings.autoSaveInterval);

        customConsoleLog("Autosave interval has been changed to: " + value + " second" + (value != 1 ? "s" : ""));
    });

    // Custom tick rate
    var settingCustomTickRateAllowed = $("#settingCustomTickRateAllowed");
    var settingCustomTickRate = $("#settingCustomTickRate");
    var saveNewCustomTickrateButton = $("#saveNewCustomTickrateButton");
    var settingCustomTickRateFlavorText = $("#settingCustomTickRateFlavorText");

    settingCustomTickRateAllowed.prop("checked", save.settings.customTickRateAllowed);

    if(save.settings.customTickRateAllowed) {
        settingCustomTickRate.show();
        saveNewCustomTickrateButton.show();
    }

    settingCustomTickRate.prop("disabled", !save.settings.customTickRateAllowed);
    settingCustomTickRate.val(save.settings.tickRate);

    saveNewCustomTickrateButton.prop("disabled", !save.settings.customTickRateAllowed);

    settingCustomTickRateAllowed.on("click", function() {
        settingCustomTickRate.prop("disabled", false);
        settingCustomTickRate.slideToggle();
        
        saveNewCustomTickrateButton.prop("disabled", false);
        saveNewCustomTickrateButton.slideToggle();

        save.settings.customTickRateAllowed = settingCustomTickRateAllowed.prop("checked");

        if(save.settings.customTickRateAllowed == false) {
            save.settings.tickRate = 50;
            settingCustomTickRate.val(save.settings.tickRate);
            resetTickInterval();
            customConsoleLog("Custom tick rate disabled.");
        } else {
            customConsoleLog("Custom tick rate enabled.");
        }

        saveGameData();
    });

    saveNewCustomTickrateButton.on("click", function() {
        var newTickRate = settingCustomTickRate.val();

        settingCustomTickRateFlavorText.text("Tick rate updated.");
        settingCustomTickRateFlavorText.slideToggle();
        saveNewCustomTickrateButton.prop("disabled", true);

        var anim = setInterval(() => {
            settingCustomTickRateFlavorText.slideToggle();
            saveNewCustomTickrateButton.prop("disabled", false);
            clearInterval(anim);
        }, 3000);
        
        save.settings.tickRate = newTickRate;

        resetTickInterval();

        customConsoleLog(`Tick rate has been changed to ${newTickRate}ms.`);

        saveGameData();
    });

    // Offline Progression
    var settingOfflineProgressionEnabled = $("#settingOfflineProgressionEnabled");
    var settingOfflineProgressionEnabledFlavorText = $("#settingOfflineProgressionEnabledFlavorText");
    var settingOfflineProgressionDesc = $("#settingOfflineProgressionDesc");
    
    settingOfflineProgressionDesc.text(`Get ${constants.OP_PLS_NERF * 100}% of your online earnings while offline`);

    settingOfflineProgressionEnabled.prop("checked", save.settings.OPEnabled);
    
    settingOfflineProgressionEnabled.on("click", function() {
        var op = $(this).prop("checked");

        if(op) {
            settingOfflineProgressionEnabledFlavorText.text("hehe ;)");
            settingOfflineProgressionEnabledFlavorText.slideToggle();
    
            var offlineAnim = setInterval(() => {
                settingOfflineProgressionEnabledFlavorText.slideToggle();
                clearInterval(offlineAnim);
            }, 3000);
        }

        save.settings.OPEnabled = op;

        saveGameData();
    });

    // Console Logs
    var settingConsoleLogs = $("#settingConsoleLogs");
    var settingConsoleLogsFlavorText = $("#settingConsoleLogsFlavorText");

    settingConsoleLogs.prop("checked", save.settings.consoleLogsEnabled);

    settingConsoleLogs.on("click", function() {
        save.settings.consoleLogsEnabled = $(this).prop("checked");
        
        if(save.settings.consoleLogsEnabled) {
            settingConsoleLogsFlavorText.text("Console logs enabled!");
            settingConsoleLogsFlavorText.slideToggle();

            var settingConsoleLogsFlavorTextAnim = setInterval(() => {
                settingConsoleLogsFlavorText.slideToggle();
                clearInterval(settingConsoleLogsFlavorTextAnim);
            }, 3000);

            customConsoleLog("Console logs enabled.");
        }

        saveGameData();
    });

    function customConsoleLog(message) {
        if(save.settings.consoleLogsEnabled) {
            console.log(message);
        }
    }

    // Reset save code
    var settingsResetSaveInitialDiv = $("#settingsResetSaveInitialDiv");
    var settingsResetSaveButton = $("#settingsResetSaveButton");
    var settingsResetSaveConfirmDiv = $("#settingsResetSaveConfirmDiv");
    var settingsResetConfirm = $("#settingsResetConfirm");
    var settingsResetNevermind = $("#settingsResetNevermind");

    settingsResetSaveButton.on("click", function() {
        settingsResetSaveInitialDiv.slideToggle();
        settingsResetSaveConfirmDiv.slideToggle();
    });

    settingsResetNevermind.on("click", function() {
        settingsResetSaveInitialDiv.slideToggle();
        settingsResetSaveConfirmDiv.slideToggle();
    });

    settingsResetConfirm.on("click", function() {
        setCookie("save", "", -1);
        location.reload();
    });

    /* Shop code */
    

    if(doDevPrices) {
        $("body").css({
            backgroundColor: "darkred"
        });
    }

    // First Click Doubler
    updateFirstClickDoublerPrice();
    updateFirstClickDoublerTexts();

    buyClickUpgradeButton.on("click", function() {
        // Check if user can afford
        if(save.currencies.units >= currentFirstClickDoublerPrice) {
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
            if(firstClickDoublerAnimLock) {
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

    buytier1UnitGenButton.on("click", function() {
        // Check if user can afford
        if(save.currencies.units >= currentTier1UnitGenPrice) {
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
            if(tier1UnitGenAnimLock) {
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

    if(save.generation.clickPower > 1) {
        unitButtonDescription.text(`${formatNumberString(save.generation.clickPower)} units`);
    }

    updateCurrencyText();

    btnClickMe.on("click", unitsButtonClicked);

    function unitsButtonClicked() {
        save.currencies.units += save.generation.clickPower * save.generation.baseProdMult;
        updateCurrencyText();
    }
});

