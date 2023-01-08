$(function() {
    console.log('Hello, world!');

    // Important constants
    const MAINCURRENCYABBR = "u";

    // Attempt to load save data
    saveCookie = getCookie("save");

    if(saveCookie == "") {
        save = {
            mainCurrency: 0,
            autoSaveEnabled: true
        };
    } else {
        save = JSON.parse(saveCookie);
    }

    // Restore settings from save data
    $("#settingAutosaveEnabled").prop("checked", save.autoSaveEnabled);
    
    // Auto-save
    // Autosave every 15 seconds - save to cookies
    // Set interval to 15 seconds (15000 milliseconds)
    var interval = 15000;

    // Call the function every 15 seconds
    setInterval(function() {
        if(save.autoSaveEnabled) {
            console.log("Autosaving...");

            setCookie("save", JSON.stringify(save), 1);
    
            console.log("Autosaved finished. Data:");
            console.log(save);
        }
        else {
            console.log("Autosave is not enabled.");
        }
    }, interval);

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
        switchToPage(HOME);
    });

    shopLink.on("click", function() {
        switchToPage(SHOP);
    });

    settingsLink.on("click", function() {
        switchToPage(SETTINGS);
    });

    devToDoLink.on("click", function() {
        switchToPage(DEVTODO);
    });

    function switchToPage(target) {
        if(!pageSwitchLocked) {
            if(currentPage != target) {
                // Lock page switch
                pageSwitchLocked = true;

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

    // Settings page code
    var settingAutosaveEnabled = $("#settingAutosaveEnabled");
    settingAutosaveEnabled.on("click", function() {
        console.log("Autosave enabled: " + settingAutosaveEnabled.prop("checked"));
        save.autoSaveEnabled = settingAutosaveEnabled.prop("checked");
    });

    // Main currency button code
    var lblMainCurrencyText = $("#navMainCurrency");
    var btnClickMe = $("#btnClickMe");

    lblMainCurrencyText.text(save.mainCurrency + MAINCURRENCYABBR);

    btnClickMe.on("click", addMainCurrency);

    function addMainCurrency() {
        save.mainCurrency += 1;
        lblMainCurrencyText.text(save.mainCurrency + MAINCURRENCYABBR);
    }
})