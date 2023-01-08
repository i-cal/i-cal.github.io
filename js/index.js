$(function() {
    console.log('Hello, world!');

    // Important constants/variables
    const MAIN_CURRENCY_ABBR = "u";
    const MIN_AUTOSAVE_INTERVAL = 1000;
    const MAX_AUTOSAVE_INTERVAL = 30000;
    const DEF_AUTOSAVE_INTERVAL = 15000;

    var autosaveTimer;

    // Attempt to load save data
    saveCookie = getCookie("save");

    if(saveCookie == "") {
        save = {
            mainCurrency: 0,
            autoSaveEnabled: true,
            autoSaveInterval: DEF_AUTOSAVE_INTERVAL
        };
    } else {
        save = JSON.parse(saveCookie);
    }

    // Restore settings from save data
    $("#settingAutosaveEnabled").prop("checked", save.autoSaveEnabled);
    
    // Auto-save
    // Autosave every 15 seconds - save to cookies
    // Set interval to 15 seconds (15000 milliseconds)
    if(save.autoSaveInterval === undefined || 
        save.autoSaveInterval < MIN_AUTOSAVE_INTERVAL || 
        save.autoSaveInterval > MAX_AUTOSAVE_INTERVAL) {
        save.autoSaveInterval = 15000;
    }

    if(save.autoSaveEnabled) {
        // Call the function every 15 seconds
        autosaveTimer = setInterval(function() {
            saveGameData(true);
        }, save.autoSaveInterval);
    }

    function saveGameData(isAutoSave) {
        if(isAutoSave) {
            console.log("Autosaving...");
        }
        
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
    const HOME = "home";
    const SHOP = "shop";
    const SETTINGS = "settings";
    const DEVTODO = "devtodo";

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

    function switchToPage(target) {
        if(!pageSwitchLocked) {
            if(currentPage != target) {
                // Lock page switch
                pageSwitchLocked = true;

                // Remove active classes from all links
                $("nav").find("li").removeClass("active");

                // Hide the current page
                switch(currentPage) {
                    case HOME:
                        homeDiv.slideToggle({
                            complete: function() {
                                doTheShow();
                            }
                        });
                        break;
                    case SHOP:
                        shopDiv.slideToggle({
                            complete: function() {
                                doTheShow();
                            }
                        });
                        break;
                    case SETTINGS:
                        settingsDiv.slideToggle({
                            complete: function() {
                                doTheShow();
                            }
                        });
                        break;
                    case DEVTODO:
                        devToDoDiv.slideToggle({
                            complete: function() {
                                doTheShow();
                            }
                        });
                        break;
                }
    
                function doTheShow() {
                    // Show the target page
                    switch(target) {
                        case HOME:
                            console.log('Switching to Home page.');
                            homeDiv.parent
                            homeDiv.slideToggle();
                            break;
                        case SHOP:
                            console.log('Switching to Shop page.');
                            shopDiv.slideToggle();
                            break;
                        case SETTINGS:
                            console.log('Switching to Settings page.');
                            settingsDiv.slideToggle();
                            break;
                        case DEVTODO:
                            console.log('Switching to Dev To-Do page.');
                            devToDoDiv.slideToggle();
                            break;
                    }
    
                    // Update the current page variable
                    currentPage = target;

                    // Unlock page switching
                    pageSwitchLocked = false;
                }
            }
        }
    }

    /* Settings code */
    // Autosave Enabled
    var settingAutosaveEnabled = $("#settingAutosaveEnabled");
    settingAutosaveEnabled.on("click", function() {
        console.log("Autosave enabled: " + settingAutosaveEnabled.prop("checked"));
        save.autoSaveEnabled = settingAutosaveEnabled.prop("checked");
        settingAutosaveInterval.prop("disabled", !save.autoSaveEnabled);
        
        if(save.autoSaveEnabled) {
            autosaveTimer = setInterval(() => {
                saveGameData();
            }, save.autoSaveInterval);
        } else {
            clearInterval(autosaveTimer);
        }

        saveGameData(); // To save the new setting
    });

    // Autosave Interval
    var settingAutosaveInterval = $("#settingAutosaveInterval");
    var settingAutosaveIntervalCurrentValue = $("#settingAutosaveIntervalCurrentValue");

    settingAutosaveInterval.prop("disabled", !save.autoSaveEnabled);
    settingAutosaveInterval.val(save.autoSaveInterval / 1000);
    settingAutosaveIntervalCurrentValue.text((save.autoSaveInterval / 1000) + " second" + (save.autoSaveInterval / 1000 != 1 ? "s" : ""));

    settingAutosaveInterval.on("input", function() {
        var value = $(this).val();
        settingAutosaveIntervalCurrentValue.text(value + " second" + (value != 1 ? "s" : ""));
    });

    settingAutosaveInterval.on("change", function() {
        var value = $(this).val();
        
        // Update save data
        save.autoSaveInterval = value * 1000;

        // Clear old interval
        clearInterval(autosaveTimer);

        // Set new interval
        autosaveTimer = setInterval(() => {
            saveGameData(true);
        }, save.autoSaveInterval);

        console.log("Autosave interval has been changed to: " + value + " second" + (value != 1 ? "s" : ""));
    });

    /* Main Currency Button Code */
    var lblMainCurrencyText = $("#navMainCurrency");
    var btnClickMe = $("#btnClickMe");

    lblMainCurrencyText.text(save.mainCurrency + MAIN_CURRENCY_ABBR);

    btnClickMe.on("click", addMainCurrency);

    function addMainCurrency() {
        save.mainCurrency += 1;
        lblMainCurrencyText.text(save.mainCurrency + MAIN_CURRENCY_ABBR);
    }
})