$(function() {
    console.log('Hello, world!');

    // Important constants/variables
    const MAIN_CURRENCY_ABBR = "u";
    const MIN_AUTOSAVE_INTERVAL = 1000;
    const MAX_AUTOSAVE_INTERVAL = 30000;
    const DEF_AUTOSAVE_INTERVAL = 15000;
    const SAVEFILE_VERSION = 3;

    const HOME = "home";
    const SHOP = "shop";
    const SETTINGS = "settings";
    const DEVTODO = "devtodo";

    const MAX_FIRST_CLICK_DOUBLER = 10;

    var tickInterval;

    var autosaveTimer;

    var pageSwitchLocked = false;

    var currentPage = HOME;
    
    var homeLink = $("#homeLink");
    var shopLink = $("#shopLink");
    var settingsLink = $("#settingsLink");
    var devToDoLink = $("#devToDoLink");

    var homeDiv = $("#mainDiv");
    var shopDiv = $("#shopDiv");
    var settingsDiv = $("#settingsDiv");
    var devToDoDiv = $("#devToDoDiv");

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
                secondMainGenerators: 0,
                thirdMainGenerators: 0
            },
            lastOpenPage: HOME,
            lastSaved: new Date(),
            settings: {
                autoSaveEnabled: true,
                autoSaveInterval: DEF_AUTOSAVE_INTERVAL,
                tickRate: 50
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

        // Goto last open page
        switchToPage(save.lastOpenPage, 0);
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

    devToDoLink.on("click", function() {
        switchToPage(DEVTODO);
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
                    case DEVTODO:
                        devToDoDiv.slideToggle({
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
                        case DEVTODO:
                            console.log('Switching to Dev To-Do page.');
                            devToDoDiv.slideToggle({
                                duration: animLength
                            });
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
    var doDevPrices = true;
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

    var animLock = false;
    var flavorAnimation;

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
            if(animLock) {
                clearInterval(flavorAnimation);
                firstClickDoublerFlavorText.hide();    
            }

            firstClickDoublerFlavorText.text(`Clicking power is now ${save.generation.clickPower}/c!`);
            firstClickDoublerFlavorText.slideToggle();
            animLock = true;
            flavorAnimation = setInterval(() => {
                firstClickDoublerFlavorText.slideToggle();
                animLock = false;
                clearInterval(flavorAnimation);
            }, 3000);
        }
    });

    function updateFirstClickDoublerTexts() {
        if(save.generation.firstClickDoublers < MAX_FIRST_CLICK_DOUBLER) {
            buyClickUpgradeButton.prop("disabled", !(save.currencies.mainCurrency >= currentFirstClickDoublerPrice));
            buyClickUpgradeButton.text(`Buy (${currentFirstClickDoublerPrice}u)`);
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
    //TODO

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
        }
    }

    function resetTickInterval() {
        clearInterval(tickInterval);

        tickInterval = setInterval(() => {
            doTick();
        }, save.settings.tickRate);
    }

    function calculateIdleGain() {
        var gainPerMillisecond = save.generation.mainPerSecond / 1000;
        var gainPerTick = gainPerMillisecond * save.settings.tickRate;
        return gainPerTick;
    }

    /* Main Currency Button Code */
    var lblMainCurrencyText = $("#navMainCurrency");
    var btnClickMe = $("#btnClickMe");

    updateCurrencyText();

    btnClickMe.on("click", mainCurrencyButtonClicked);

    function mainCurrencyButtonClicked() {
        save.currencies.mainCurrency += save.generation.clickPower * save.generation.mainProdMult;
        updateCurrencyText();
    }

    function updateCurrencyText() {
        lblMainCurrencyText.text(`${Math.floor(save.currencies.mainCurrency)}${MAIN_CURRENCY_ABBR}${(save.generation.mainPerSecond > 0 ? `+(${save.generation.mainPerSecond}/s)` : "")}+(${save.generation.clickPower}/c)`);
    }
})