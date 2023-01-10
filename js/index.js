$(function() {
    console.log('Hello, world!');

    // Important constants/variables
    const MAIN_CURRENCY_ABBR = "u";
    const MIN_AUTOSAVE_INTERVAL = 1000;
    const MAX_AUTOSAVE_INTERVAL = 30000;
    const DEF_AUTOSAVE_INTERVAL = 15000;
    const OP_PLS_NERF = 0.75;
    const SAVEFILE_VERSION = 10;

    const HOME = "home";
    const SHOP = "shop";
    const SETTINGS = "settings";

    const MAX_FIRST_CLICK_DOUBLER = 10;
    const MAX_TIER_1_GENS = 10;

    const COMMAS_NUMBER_FORMAT = "commas";
    const PERIOD_NUMBER_FORMAT = "periods";
    const SCIENTIFIC_NUMBER_FORMAT = "scientific";

    var tickInterval;

    var autosaveTimer;

    var pageSwitchLocked = false;

    var currentPage = HOME;
    
    var homeLink = $("#homeLink");
    var shopLink = $("#shopLink");
    var settingsLink = $("#settingsLink");

    var homeDiv = $("#mainDiv");
    var shopDiv = $("#shopDiv");
    var settingsDiv = $("#settingsDiv");

    var navMainCurrencyText = $("#navMainCurrency");

    // Attempt to load save data
    saveCookie = getCookie("save");

    if(saveCookie == "") {
        save = {
            currencies: {
                mainCurrency: 0,
            },
            generation: {
                clickPower: 1,
                firstClickDoublers: 0,
                mainPerSecond: 0,
                mainProdMult: 1,
                firstMainGenerators: 0,
                firstMainGeneratorPower: 0,
                secondMainGenerators: 0,
                thirdMainGenerators: 0
            },
            lastOpenPage: HOME,
            lastSaved: new Date(),
            settings: {
                darkModeEnabled: false,
                numberFormat: COMMAS_NUMBER_FORMAT,
                autoSaveEnabled: true,
                autoSaveInterval: DEF_AUTOSAVE_INTERVAL,
                tickRate: 50,
                customTickRateAllowed: false,
                OPEnabled: false
            },
            version: SAVEFILE_VERSION
        };
    } else {
        save = JSON.parse(saveCookie);
        
        // Update old save files
        if(save.version == undefined || save.version < SAVEFILE_VERSION) {
            fixSaveFiles(save);

            // Save is up to date
            save.version = SAVEFILE_VERSION;
        }

        // Offline progression (75% of estimated online, based off of units per second)
        if(save.settings.OPEnabled) {
            calculateOfflineGain();
        }

        // Goto last open page
        switchToPage(save.lastOpenPage, 0);
    }

    function calculateOfflineGain() {
        var now = new Date();
        var difference = (now.getTime() - new Date(save.lastSaved).getTime()) / 1000;
        var offlineGains = Math.floor((difference * save.generation.mainPerSecond) * OP_PLS_NERF);

        var offlineGainsText = $("#offlineGainsText");

        if(difference > 1) {
            navMainCurrencyText.hide();

            offlineGainsText.text(`You earned ${formatNumberString(offlineGains)}u while you were away`);

            offlineGainsText.slideToggle();

            var anim = setInterval(() => {
                offlineGainsText.slideToggle();
                navMainCurrencyText.slideDown();
                offlineGainsText.text("");
                clearInterval(anim);
            }, 3000);
        }

        save.currencies.mainCurrency += offlineGains;
    }

    function fixSaveFiles(saveData) {
        if(saveData.version === undefined || saveData.version < SAVEFILE_VERSION) {
            // Fix if save was from before currencies were separate JSON object
            if(save.currencies == undefined) {
                save.currencies = {
                    mainCurrency: save.mainCurrency
                }

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
                save.lastOpenPage = HOME;
            }

            // Set save date
            if(save.lastSaved == undefined) {
                save.lastSaved = new Date();
            }

            // If before shop & generation update, generation attributes need to be added
            if(save.generation == undefined) {
                save.generation = {
                    clickPower: 1,
                    firstClickDoublers: 0,
                    mainPerSecond: 0,
                    mainProdMult: 1,
                    firstMainGenerators: 0,
                    secondMainGenerators: 0,
                    thirdMainGenerators: 0
                };
            }

            // Version < 3
            if(save.settings.tickRate == undefined) {
                save.settings.tickRate = 50;
            }

            // Version < 4
            if(save.generation.firstMainGeneratorPower == undefined) {
                save.generation.firstMainGeneratorPower = 0;
            }

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
                save.settings.numberFormat = COMMAS_NUMBER_FORMAT;
            }

            // Version < 10 - IC-9
            if(save.settings.numberFormat == "full") {
                save.settings.numberFormat = COMMAS_NUMBER_FORMAT;
            }
        }
    }

    // Restore settings from save data
    $("#settingAutosaveEnabled").prop("checked", save.settings.autoSaveEnabled);
    
    // Auto-save
    // Autosave every 15 seconds - save to cookies
    // Set interval to 15 seconds (15000 milliseconds)
    if(save.settings.autoSaveInterval === undefined || 
        save.settings.autoSaveInterval < MIN_AUTOSAVE_INTERVAL || 
        save.settings.autoSaveInterval > MAX_AUTOSAVE_INTERVAL) {
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
            console.log("Autosaving...");
        }
        
        save.lastSaved = new Date();
        save.lastOpenPage = currentPage;
        save.version = SAVEFILE_VERSION;

        save.currencies.mainCurrency = Math.floor(save.currencies.mainCurrency);

        setCookie("save", JSON.stringify(save), 1);
        
        console.log("Save finished. Data:");
        console.log(save);
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
        switchToPage(HOME);
        $(this).parent().addClass("active");
    });

    shopLink.on("click", function() {
        switchToPage(SHOP);
        $(this).parent().addClass("active");
    });

    settingsLink.on("click", function() {
        switchToPage(SETTINGS);
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
                    case HOME:
                        homeDiv.slideToggle({
                            complete: function() {
                                doTheShow(animLength);
                            },
                            duration: animLength
                        });
                        break;
                    case SHOP:
                        shopDiv.slideToggle({
                            complete: function() {
                                doTheShow(animLength);
                            },
                            duration: animLength
                        });
                        break;
                    case SETTINGS:
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
                        case HOME:
                            console.log('Switching to Home page.');
                            homeDiv.parent
                            homeDiv.slideToggle({
                                duration: animLength
                            });
                            break;
                        case SHOP:
                            console.log('Switching to Shop page.');
                            shopDiv.slideToggle({
                                duration: animLength
                            });
                            break;
                        case SETTINGS:
                            console.log('Switching to Settings page.');
                            settingsDiv.slideToggle({
                                duration: animLength
                            });
                            break;
                        default:
                            console.log('Switching to Home page.');
                            homeDiv.parent
                            homeDiv.slideDown({
                                duration: 0
                            });
                            target = HOME;
                            save.lastOpenPage = HOME;
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
    });
    
    // Number Format
    var settingsNumberFormat = $("#settingsNumberFormat");

    settingsNumberFormat.val(save.settings.numberFormat);

    settingsNumberFormat.on("change", function() {
        var chosen = $(this).val();
        
        switch(chosen) {
            case COMMAS_NUMBER_FORMAT:
                save.settings.numberFormat = COMMAS_NUMBER_FORMAT;
                break;
            case PERIOD_NUMBER_FORMAT:
                save.settings.numberFormat = PERIOD_NUMBER_FORMAT;
                break;
            case SCIENTIFIC_NUMBER_FORMAT:
                save.settings.numberFormat = SCIENTIFIC_NUMBER_FORMAT;
                break;
            default:
                save.settings.numberFormat = COMMAS_NUMBER_FORMAT;
                break;
        }

        console.log(`Number format changed to ${save.settings.numberFormat}.`);

        // Update all shop texts
        if(save.generation.firstClickDoublers < MAX_FIRST_CLICK_DOUBLER) {
            updateFirstClickDoublerTexts();
        }
        
        updatetier1MainGenTexts();

        saveGameData();
    });

    function formatNumberString(numberToFormat) {
        var formatted;

        switch(save.settings.numberFormat) {
            case COMMAS_NUMBER_FORMAT:
                formatted = numberToFormat.toLocaleString();
                break;
            case PERIOD_NUMBER_FORMAT:
                formatted = numberToFormat.toLocaleString("de-DE");
                break;
            case SCIENTIFIC_NUMBER_FORMAT:
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
        console.log("Autosave enabled: " + settingAutosaveEnabled.prop("checked"));
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

        console.log("Autosave interval has been changed to: " + value + " second" + (value != 1 ? "s" : ""));
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
            console.log("Custom tick rate disabled.");
        } else {
            console.log("Custom tick rate enabled.");
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

        console.log(`Tick rate has been changed to ${newTickRate}ms.`);

        saveGameData();
    });

    // Offline Progression
    var settingOfflineProgressionEnabled = $("#settingOfflineProgressionEnabled");
    var settingOfflineProgressionEnabledFlavorText = $("#settingOfflineProgressionEnabledFlavorText");
    var settingOfflineProgressionDesc = $("#settingOfflineProgressionDesc");
    
    settingOfflineProgressionDesc.text(`Get ${OP_PLS_NERF * 100}% of your online earnings while offline`);

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

    if(doDevPrices) {
        shopLink.css({
            color: "red",
            fontWeight: "bolder"
        });
    }

    // First Click Doubler
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

    updateFirstClickDoublerPrice();
    updateFirstClickDoublerTexts();

    var firstClickDoublerAnimLock = false;
    var firstClickDoublerFlavorAnimation;

    buyClickUpgradeButton.on("click", function() {
        // Check if user can afford
        if(save.currencies.mainCurrency >= currentFirstClickDoublerPrice) {
            // Subtract cost from units
            save.currencies.mainCurrency -= currentFirstClickDoublerPrice;
            
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

    function updateFirstClickDoublerTexts() {
        if(save.generation.firstClickDoublers < MAX_FIRST_CLICK_DOUBLER) {
            buyClickUpgradeButton.prop("disabled", !(save.currencies.mainCurrency >= currentFirstClickDoublerPrice));
            buyClickUpgradeButton.text(`Buy (${formatNumberString(currentFirstClickDoublerPrice)}u)`);
        } else {
            buyClickUpgradeButton.prop("disabled", true);
            buyClickUpgradeButton.text(`Maxed!`);
        }

        firstClickDoublersCountText.text(`${save.generation.firstClickDoublers}/${MAX_FIRST_CLICK_DOUBLER}`);
    }

    function updateFirstClickDoublerPrice() {
        if(doDevPrices) {
            currentFirstClickDoublerPrice = devPriceScale[save.generation.firstClickDoublers];
        } else {
            currentFirstClickDoublerPrice = firstClickDoublerPrices[save.generation.firstClickDoublers];
        }
    }

    // Tier 1 Main Generator
    var buytier1MainGenButton = $("#buyTier1MainGenButton");
    var tier1MainGenCountText = $("#tier1MainGenCountText");
    var tier1MainGenDescriptionText = $("#tier1MainGenDescriptionText");
    var tier1MainGenIncreaseFlavorText = $("#tier1MainGenIncreaseFlavorText");

    var tier1MainGenPrices = {
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

    var currentTier1MainGenPrice;

    updatetier1MainGenPrice();
    updatetier1MainGenTexts();

    var tier1MainGenAnimLock = false;
    var tier1MainGenFlavorAnimation;

    buytier1MainGenButton.on("click", function() {
        // Check if user can afford
        if(save.currencies.mainCurrency >= currentTier1MainGenPrice) {
            // Subtract cost from units
            save.currencies.mainCurrency -= currentTier1MainGenPrice;
            
            // Update gen count
            save.generation.firstMainGenerators += 1;
            
            // Update gain per second
            save.generation.firstMainGeneratorPower = save.generation.firstMainGeneratorPower == 0 ? 1000 : save.generation.firstMainGeneratorPower * 2;
            updateMainPerSecond();

            // Update current price
            updatetier1MainGenPrice();

            // Update texts
            updatetier1MainGenTexts();

            // Update currency text
            updateCurrencyText();

            // Show flavor text
            if(tier1MainGenAnimLock) {
                clearInterval(tier1MainGenFlavorAnimation);
                tier1MainGenIncreaseFlavorText.hide();    
            }

            tier1MainGenIncreaseFlavorText.text(`Tier 1 Generator power is now ${formatNumberString(save.generation.firstMainGeneratorPower)}u/s!`);
            tier1MainGenIncreaseFlavorText.slideDown();

            tier1MainGenAnimLock = true;
            
            tier1MainGenFlavorAnimation = setInterval(() => {
                tier1MainGenIncreaseFlavorText.slideUp();
                tier1MainGenAnimLock = false;
                clearInterval(tier1MainGenFlavorAnimation);
            }, 3000);
        }
    });

    function updatetier1MainGenTexts() {
        if(save.generation.firstMainGenerators < MAX_TIER_1_GENS) {
            buytier1MainGenButton.prop("disabled", !(save.currencies.mainCurrency >= currentTier1MainGenPrice));
            buytier1MainGenButton.text(`Buy (${formatNumberString(currentTier1MainGenPrice)}u)`);
            tier1MainGenDescriptionText.text(`Increases idle production to ${formatNumberString(save.generation.firstMainGeneratorPower == 0 ? 1000 : save.generation.firstMainGeneratorPower * 2)}u/s`);
        } else {
            buytier1MainGenButton.prop("disabled", true);
            buytier1MainGenButton.text(`Maxed!`);
            tier1MainGenDescriptionText.text(`Tier 1 idle production is maxed at ${formatNumberString(save.generation.firstMainGeneratorPower)}u/s.`);
        }

        tier1MainGenCountText.text(`${save.generation.firstMainGenerators}/${MAX_TIER_1_GENS}`);
    }

    function updatetier1MainGenPrice() {
        if(doDevPrices) {
            currentTier1MainGenPrice = devPriceScale[save.generation.firstMainGenerators];
        } else {
            currentTier1MainGenPrice = tier1MainGenPrices[save.generation.firstMainGenerators];
        }
    }

    /* DO TICKS N SHIT */
    tickInterval = setInterval(() => {
        doTick();
    }, save.settings.tickRate);

    function doTick() {
        // Calculate idle gain
        if(save.generation.mainPerSecond > 0) {
            var gain = calculateIdleGain();
            save.currencies.mainCurrency += gain;

            // Update currency text
            updateCurrencyText();
        }

        // Update shop buttons if page is open
        if(currentPage == SHOP) {
            // If unbought first click doublers
            if(save.generation.firstClickDoublers < MAX_FIRST_CLICK_DOUBLER) {
                updateFirstClickDoublerTexts();
            }
            
            // If unbought Tier 1 Main Generators
            if(save.generation.firstMainGenerators < MAX_TIER_1_GENS) {
                updatetier1MainGenTexts();
            }
        }
    }

    function resetTickInterval() {
        clearInterval(tickInterval);

        tickInterval = setInterval(() => {
            doTick();
        }, save.settings.tickRate);
    }

    function updateMainPerSecond() {
        save.generation.mainPerSecond = save.generation.firstMainGeneratorPower; // add future generator powers to this
    }

    function calculateIdleGain() {
        var gainPerMillisecond = save.generation.mainPerSecond / 1000;
        var gainPerTick = gainPerMillisecond * save.settings.tickRate;
        return gainPerTick;
    }

    /* Main Currency Button Code */
    var btnClickMe = $("#btnClickMe");

    updateCurrencyText();

    btnClickMe.on("click", mainCurrencyButtonClicked);

    function mainCurrencyButtonClicked() {
        save.currencies.mainCurrency += save.generation.clickPower * save.generation.mainProdMult;
        updateCurrencyText();
    }

    function updateCurrencyText() {
        navMainCurrencyText.text(`${formatNumberString(Math.floor(save.currencies.mainCurrency))}${MAIN_CURRENCY_ABBR}${(save.generation.mainPerSecond > 0 ? `+(${formatNumberString(save.generation.mainPerSecond)}u/s)` : "")}+(${formatNumberString(save.generation.clickPower)}u/c)`);
    }
})