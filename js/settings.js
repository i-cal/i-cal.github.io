import { save, constants, saveGameData, updatetier1UnitGenTexts, updateFirstClickDoublerTexts, setCookie } from "./index.js";
import { resetTickInterval } from "./tick.js";
import { setAutosave, stopAutosave } from "./autosave.js";

export function customConsoleLog(message) {
    if (save.settings.consoleLogsEnabled) {
        console.log(message);
    }
}

export function formatNumberString(numberToFormat) {
    var formatted;

    switch (save.settings.numberFormat) {
        case constants.COMMAS_NUMBER_FORMAT:
            formatted = numberToFormat.toLocaleString();
            break;
        case constants.PERIOD_NUMBER_FORMAT:
            formatted = numberToFormat.toLocaleString("de-DE");
            break;
        case constants.SCIENTIFIC_NUMBER_FORMAT:
            if (numberToFormat >= 1000) {
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

/* Settings code */
export function initSettings() {
    // Manual Save
    var settingsSaveButton = $("#settingsSaveButton");
    var settingsManualSaveFinished = $("#settingsManualSaveFinished");
    settingsSaveButton.on("click", function () {
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

    if (save.settings.darkModeEnabled) {
        $('body').toggleClass('dark-mode');
        $('nav').toggleClass('bg-light navbar-light navbar-dark bg-dark');
    }

    settingsDarkModeToggle.on('click', function () {
        $('body').toggleClass('dark-mode');
        $('nav').toggleClass('bg-light navbar-light navbar-dark bg-dark');
        save.settings.darkModeEnabled = settingsDarkModeToggle.prop("checked");
        saveGameData();

        if (!($(this).prop("checked"))) {
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

    settingsNumberFormat.on("change", function () {
        var chosen = $(this).val();

        switch (chosen) {
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
        if (save.generation.firstClickDoublers < constants.MAX_FIRST_CLICK_DOUBLER) {
            updateFirstClickDoublerTexts();
        }

        updatetier1UnitGenTexts();

        saveGameData();
    });

    // Autosave Enabled
    var settingAutosaveEnabled = $("#settingAutosaveEnabled");
    var autosaveDisabledFlavorText = $(".autosaveDisabledFlavorText");
    var settingAutosaveIntervalDiv = $("#settingAutosaveIntervalDiv");

    if (save.settings.autoSaveEnabled) {
        autosaveDisabledFlavorText.hide();
        settingAutosaveIntervalDiv.show();
    } else {
        autosaveDisabledFlavorText.show();
        settingAutosaveIntervalDiv.hide();
    }

    settingAutosaveEnabled.on("click", function () {
        customConsoleLog("Autosave enabled: " + settingAutosaveEnabled.prop("checked"));
        save.settings.autoSaveEnabled = settingAutosaveEnabled.prop("checked");
        settingAutosaveInterval.prop("disabled", !save.settings.autoSaveEnabled);
        settingAutosaveIntervalDiv.slideToggle();

        if (save.settings.autoSaveEnabled) {
            setAutosave();
            autosaveDisabledFlavorText.slideToggle();
        } else {
            stopAutosave()
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

    settingAutosaveInterval.on("input", function () {
        var value = $(this).val();
        settingAutosaveIntervalCurrentValue.text(value + " second" + (value != 1 ? "s" : ""));
    });

    settingAutosaveInterval.on("change", function () {
        var value = $(this).val();

        // Update save data
        save.settings.autoSaveInterval = value * 1000;

        // Clear old interval
        stopAutosave()

        // Set new interval
        setAutosave()

        customConsoleLog("Autosave interval has been changed to: " + value + " second" + (value != 1 ? "s" : ""));
    });

    // Custom tick rate
    var settingCustomTickRateAllowed = $("#settingCustomTickRateAllowed");
    var settingCustomTickRate = $("#settingCustomTickRate");
    var saveNewCustomTickrateButton = $("#saveNewCustomTickrateButton");
    var settingCustomTickRateFlavorText = $("#settingCustomTickRateFlavorText");

    settingCustomTickRateAllowed.prop("checked", save.settings.customTickRateAllowed);

    if (save.settings.customTickRateAllowed) {
        settingCustomTickRate.show();
        saveNewCustomTickrateButton.show();
    }

    settingCustomTickRate.prop("disabled", !save.settings.customTickRateAllowed);
    settingCustomTickRate.val(save.settings.tickRate);

    saveNewCustomTickrateButton.prop("disabled", !save.settings.customTickRateAllowed);

    settingCustomTickRateAllowed.on("click", function () {
        settingCustomTickRate.prop("disabled", false);
        settingCustomTickRate.slideToggle();

        saveNewCustomTickrateButton.prop("disabled", false);
        saveNewCustomTickrateButton.slideToggle();

        save.settings.customTickRateAllowed = settingCustomTickRateAllowed.prop("checked");

        if (save.settings.customTickRateAllowed == false) {
            save.settings.tickRate = 50;
            settingCustomTickRate.val(save.settings.tickRate);
            resetTickInterval();
            customConsoleLog("Custom tick rate disabled.");
        } else {
            customConsoleLog("Custom tick rate enabled.");
        }

        saveGameData();
    });

    saveNewCustomTickrateButton.on("click", function () {
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

    settingOfflineProgressionEnabled.on("click", function () {
        var op = $(this).prop("checked");

        if (op) {
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

    settingConsoleLogs.on("click", function () {
        save.settings.consoleLogsEnabled = $(this).prop("checked");

        if (save.settings.consoleLogsEnabled) {
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

    // Reset save code
    var settingsResetSaveInitialDiv = $("#settingsResetSaveInitialDiv");
    var settingsResetSaveButton = $("#settingsResetSaveButton");
    var settingsResetSaveConfirmDiv = $("#settingsResetSaveConfirmDiv");
    var settingsResetConfirm = $("#settingsResetConfirm");
    var settingsResetNevermind = $("#settingsResetNevermind");

    settingsResetSaveButton.on("click", function () {
        settingsResetSaveInitialDiv.slideToggle();
        settingsResetSaveConfirmDiv.slideToggle();
    });

    settingsResetNevermind.on("click", function () {
        settingsResetSaveInitialDiv.slideToggle();
        settingsResetSaveConfirmDiv.slideToggle();
    });

    settingsResetConfirm.on("click", function () {
        setCookie("save", "", -1);
        location.reload();
    });
}