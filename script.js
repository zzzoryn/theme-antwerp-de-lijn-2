/**
 * This script uses the utils object "$$"
 *
 * $$.jqueryPlugin(pluginName, options);
 *      Creates a jQuery plugin and call this after the "page:loaded" event
 *
 *      options:
 *          api?: [] => jquery plugin api to the call as $(element).plugin('apiMethod', ...options);
 *          defaultOptions?: {} => jquery plugin default options
 *          methods: {} => jquery plugin methods. The "init" method is required
 *
 * $$.initPlugins($container?);
 *      Initializes all plugins in the container
 *
 * $$.Request(options?).fetch(url, data?);
 *      Fetches a data from the sessionStorage or makes request to the server
 *      Returns the <Promise>
 *
 *      options:
 *          ssPrefix: 'request' => SessionStorage prefix
 *          type: 'GET' => type of the request
 *
 * $$.getDuration($element);
 *      Fetches and returns a transition duration of the element
 */

/**
 * jQuery special event for detecting single enter key press
 *
 * @example:
 *
 * $('.btn').on('tap enterkey', ...);
 */
$.event.special.enterkey = {
  delegateType: 'keydown',
  bindType: 'keydown',
  handle: function(event) {
    var handleObj = event.handleObj;
    var ret = null;

    if (event.which === 13) {
      event.type = handleObj.origType;
      ret = handleObj.handler.apply(this, arguments);
      event.type = handleObj.type;
      return ret;
    }
  }
};

/**
 * jQuery special event for detecting single escape key press
 *
 * @example:
 *
 * $('.btn').on('tap escapekey', ...);
 */
$.event.special.escapekey = {
  delegateType: 'keydown',
  bindType: 'keydown',
  handle: function(event) {
    var handleObj = event.handleObj;
    var ret = null;

    if (event.which === 27) {
      event.type = handleObj.origType;
      ret = handleObj.handler.apply(this, arguments);
      event.type = handleObj.type;
      return ret;
    }
  }
};

/**
 * Dropdown plugin
 * This plugin use the "nanopop" package for setting dropdown positions.
 * More information https://github.com/Simonwep/nanopop
 *
 * @example:
 *
 * <div class="dropdown" data-plugin-dropdown>
 *     <a class="js-dropdown-open" tabindex="0" role="button" aria-label="Open">
 *         Open dropdown
 *     </a>
 *     <div class="dropdown__content js-dropdown" role="menu" aria-hidden="true">
 *         <a href="#" class="dropdown__menuitem" rel="nofollow" role="menuitem">One</a>
 *         <a href="#" class="dropdown__menuitem" rel="nofollow" role="menuitem">Two</a>
 *         <a href="#" class="dropdown__menuitem" rel="nofollow" role="menuitem">Three</a>
 *     </div>
 * </div>
 */
$$.jqueryPlugin('dropdown', {
  api: ['open', 'close'],
  defaultOptions: {
    // Open link selector.
    openLinkSelector: '.js-dropdown-open',

    // Close button selector. By default - all links with a "href" attribute in the dropdown container
    closeLinkSelector: '.js-dropdown a[href]',

    // Dropdown container selector
    dropdownSelector: '.js-dropdown',

    // Preferred position, any combination of [top|right|bottom|left]-[start|middle|end] is valid.
    // 'middle' is used as default-variant if you leave it out.
    position: 'bottom',

    // Margin between the dropdown and the trigger button
    margin: 12,

    // Add dropdown chevron
    addChevron: true,

    // jQuery event name which is triggered when dropdown is about to be opened
    eventOpen: 'dropdown:open',

    // jQuery event name which is triggered when dropdown is about to be closed
    eventClose: 'dropdown:close'
  },
  methods: {
    init: function(uid, options, $container) {
      this.uid = uid;
      this.options = options;
      this.lastPosition = '';
      this.popper = null;
      this.isOpened = false;

      this.$container = $container;
      this.$dropdown = this.$container.find(this.options.dropdownSelector);
      this.$trigger = this.$container.find(this.options.openLinkSelector).first();
      this.$document = $(document);
      this.$window = $(window);
      this.chevron = $();

      if (this.options.addChevron) {
        this.chevron = $('<div class="dropdown__chevron"></div>');
        this.$dropdown.append(this.chevron[0]);
      }

      this.bindEvents();
    },

    bindEvents: function() {
      var click = 'click.' + this.uid + ' enterkey.' + this.uid;

      this.$container.on(click, this.options.openLinkSelector, this.handleDropdownToggle.bind(this));
      this.$container.on(click, this.options.closeLinkSelector, this.close.bind(this));
      this.$document.on(click, this.handleDropdownClose.bind(this));
      this.$document.on('escapekey.' + this.uid, this.close.bind(this));
    },

    handleDropdownToggle: function(event) {
      event.preventDefault();
      if (!this.isOpened) {
        this.open($(event.currentTarget));
      }
      else {
        this.close();
      }
    },

    handleDropdownClose: function(event) {
      if (this.isOpened &&
        event.target !== this.$container[0] &&
        !$(event.target).closest(this.$container[0]).length
      ) {
        this.close();
      }
    },

    open: function($trigger) {
      if (!this.isOpened) {
        this.isOpened = true;

        if ($trigger) {
          this.$trigger = $trigger;
          this.$trigger.addClass('is-active');
        }

        this.update();
        this.$window.on('resize.' + this.uid, this.update.bind(this));
        this.$container.trigger(this.options.eventOpen, this);
      }
    },

    close: function() {
      if (this.isOpened) {
        this.isOpened = false;
        this.$dropdown.removeClass('is-active');
        this.$trigger.removeClass('is-active');
        this.$window.off('resize.' + this.uid);
        this.$container.trigger(this.options.eventClose, this);
      }
    },

    update: function() {
      this.popper = NanoPop.createPopper(this.$trigger[0], this.$dropdown[0], Object.assign({}, this.options, {
        container: document.documentElement.getBoundingClientRect()
      }));
      this.$dropdown.removeClass('dropdown__content--' + this.lastPosition);
      this.lastPosition = this.popper.update();
      this.$dropdown.addClass('is-active dropdown__content--' + this.lastPosition);

      if (this.options.addChevron) {
        this.setChevronPosition();
      }
    },

    setChevronPosition: function() {
      this.chevron
        .removeAttr('class style')
        .addClass('dropdown__chevron dropdown__chevron--' + this.lastPosition);

      var triggerRect = this.$trigger[0].getBoundingClientRect();
      var chevronRect = this.chevron[0].getBoundingClientRect();

      if (/^[tb]/i.test(this.lastPosition)) {
        this.chevron.offset({left: triggerRect.x + triggerRect.width / 2 - chevronRect.width / 2});
      }
      else {
        this.chevron.offset({top: triggerRect.y + triggerRect.height / 2 - chevronRect.height / 2});
      }
    }
  }
});

/**
 * Tabs plugin
 *
 * @example:
 *
 * <div class="tabs tabs--type-1 tabs--style-1" data-plugin-tabs>
 *     <div class="tabs__links js-tabs-links">
 *         <a href="#one" tabindex="0">One</a>
 *         <a href="#two" tabindex="0">Two</a>
 *         <a href="#three" tabindex="0">Three</a>
 *     </div>
 *     <div class="tabs__containers js-tabs-containers">
 *         <div id="one" class="tabs__container" aria-hidden="true">Content 1</div>
 *         <div id="two" class="tabs__container" aria-hidden="true">Content 2</div>
 *         <div id="three" class="tabs__container" aria-hidden="true">Content 3</div>
 *     </div>
 * </div>
 */
$$.jqueryPlugin('tabs', {
  api: ['toggle', 'destroy'],
  defaultOptions: {
    // Index of the Default active tab
    activeIndex: 0,

    // Selector of the container with links
    linksSelector: '.js-tabs-links',

    // Selector of the container with tabs
    containersSelector: '.js-tabs-containers',

    // jQuery event name which is triggered when tab is about to be opened
    eventOpen: 'tabs:open',

    // jQuery event name which is triggered after tab is opened
    eventOpened: 'tabs:opened'
  },
  methods: {
    init: function(uid, options, $container) {
      this.uid = uid;
      this.options = options;
      this.tabsContainerDelay = 10;
      this.triggerDuration = 400;
      this.tabDuration = 400;
      this.duration = 400;

      this.$container = $container;
      this.$links = this.$container.find(this.options.linksSelector).first();
      this.$containers = this.$container.find(this.options.containersSelector).first();
      this.$trigger = $();
      this.$tab = $();
      this.$lastTrigger = $();
      this.$lastTab = $();

      if (this.options.activeIndex !== -1) {
        this.toggle(0);
      }

      this.bindEvents();
    },

    bindEvents: function() {
      var click = 'click.' + this.uid + ' enterkey.' + this.uid;

      this.$links.on(click, 'a', this.handleTabsToggle.bind(this));
    },

    handleTabsToggle: function(event) {
      event.preventDefault();
      this.toggle($(event.currentTarget));
    },

    toggle: function($triggerOrIndex) {
      var $links = this.$links.children('a');
      var $containers = this.$containers.children('div');

      this.$lastTrigger = $links.filter('.is-active');
      this.$lastTab = $containers.filter('.is-active');

      this.$trigger = typeof $triggerOrIndex === 'number'
        ? $links.eq($triggerOrIndex)
        : $triggerOrIndex;

      if (!this.$trigger.length) {
        return;
      }

      var activeTabId = this.$trigger.attr('href').replace('#', '');
      this.$tab = $containers.filter('[id="' + activeTabId + '"]');

      this.$container.trigger(this.options.eventOpen, this);

      this.triggerDuration = $$.getDuration(this.$trigger);
      this.tabDuration = $$.getDuration(this.$tab);
      this.duration = this.triggerDuration > this.tabDuration ? this.triggerDuration : this.tabDuration;

      this.$containers.css('height', this.$containers.height());

      setTimeout(function() {
        this.$containers.css('height', this.$tab.outerHeight());
      }.bind(this), this.tabsContainerDelay);

      setTimeout(function() {
        this.$containers.css('height', '');
        this.$container.trigger(this.options.eventOpened, this);
      }.bind(this), this.tabsContainerDelay + this.duration);

      this.$lastTrigger.add(this.$lastTab).removeClass('is-active');
      this.$lastTab.attr('aria-hidden', 'true');
      this.$trigger.add(this.$tab).addClass('is-active');
      this.$tab.attr('aria-hidden', 'false');
    },

    destroy: function() {
      this.$links.off('.' + this.uid);
    }
  }
});

/**
 * Spoiler plugin
 *
 * @example
 * <div class="spoiler" data-plugin-spoiler>
 *     <a class="spoiler__title js-spoiler-toggle" role="button" tabindex="0">Spoiler title</a>
 *     <div class="spoiler__text js-spoiler" aria-hidden="true">
 *         Spoiler content
 *     </div>
 * </div>
 */
$$.jqueryPlugin('spoiler', {
  api: ['toggle', 'open', 'close', 'destroy'],
  defaultOptions: {
    // Spoiler is open
    open: false,

    // Selector of the toggle link
    linkSelector: '.js-spoiler-toggle',

    // Selector of the spoiler box
    spoilerSelector: '.js-spoiler',

    // Animation duration
    duration: 400,

    // jQuery event name which is triggered when spoiler is about to be opened
    eventOpen: 'spoiler:open',

    // jQuery event name which is triggered after spoiler is opened
    eventOpened: 'spoiler:opened',

    // jQuery event name which is triggered when spoiler is about to be closed
    eventClose: 'spoiler:close',

    // jQuery event name which is triggered after spoiler is closed
    eventClosed: 'spoiler:closed'
  },
  methods: {
    init: function(uid, options, $container) {
      this.uid = uid;
      this.options = options;

      this.$container = $container;
      this.$link = this.$container.find(this.options.linkSelector).first();
      this.$spoiler = this.$container.find(this.options.spoilerSelector).first();

      if (this.options.open) {
        this.isOpen = false;
        this.open(true);
      }
      else {
        this.isOpen = true;
        this.close(true);
      }

      this.bindEvents();
    },

    bindEvents: function() {
      var click = 'click.' + this.uid + ' enterkey.' + this.uid;

      this.$link.on(click, this.handleSpoilerToggle.bind(this));
    },

    handleSpoilerToggle: function(event) {
      event.preventDefault();
      this.toggle();
    },

    toggle: function() {
      if (this.isOpen) {
        this.close();
      }
      else {
        this.open();
      }
    },

    open: function(withoutAnimation) {
      if (!this.isOpen) {
        this.isOpen = true;
        this.$container.addClass('is-open');
        this.$link.add(this.$spoiler).addClass('is-active');
        this.$container.trigger(this.options.eventOpen, this);

        var duration = withoutAnimation && withoutAnimation !== 'open' ? 0 : this.options.duration;
        this.$spoiler.attr('aria-hidden', 'false').slideDown(duration, function() {
          this.$container.trigger(this.options.eventOpened, this);
        }.bind(this));
      }
    },

    close: function(withoutAnimation) {
      if (this.isOpen) {
        this.isOpen = false;
        this.$container.removeClass('is-open');
        this.$link.add(this.$spoiler).removeClass('is-active');
        this.$container.trigger(this.options.eventClose, this);

        var duration = withoutAnimation && withoutAnimation !== 'close' ? 0 : this.options.duration;
        this.$spoiler.attr('aria-hidden', 'true').slideUp(duration, function() {
          this.$container.trigger(this.options.eventClosed, this);
        }.bind(this));
      }
    },

    destroy: function() {
      this.$link.off('.' + this.uid);
    }
  }
});

/**
 * Accordion plugin
 * Groups spoilers into an accordion
 *
 * @example:
 * <div class="accordion accordion--type-1 accordion--style-2" data-plugin-accordion>
 *     <div class="spoiler" data-plugin-spoiler>...</div>
 *     <div class="spoiler" data-plugin-spoiler>...</div>
 *     <div class="spoiler" data-plugin-spoiler>...</div>
 * </div>
 */
$$.jqueryPlugin('accordion', {
  api: ['open', 'destroy'],
  defaultOptions: {
    // Index of the Default active spoiler
    activeIndex: -1,

    // Only one active spoiler in the accordion
    oneActive: true
  },
  methods: {
    init: function(uid, options, $container) {
      this.uid = uid;
      this.options = options;

      this.$container = $container;
      this.$spoilers = this.$container.children('[data-plugin-spoiler]');

      this.open(this.options.activeIndex, true);
      this.bindEvents();
    },

    bindEvents: function() {
      if (this.options.oneActive) {
        this.$spoilers.on('spoiler:open.' + this.uid, this.handleSpoilerOpen.bind(this));
      }
    },

    handleSpoilerOpen: function(event, spoiler) {
      this.$spoilers.each(function(i, element) {
        if (element !== spoiler.$container[0]) {
          $(element).spoiler('close');
        }
      });
    },

    open: function(index, withoutAnimation) {
      this.$spoilers.each(function(i, element) {
        var method = i === index ? 'open' : 'close';
        $(element).spoiler(method, withoutAnimation);
      });
    },

    destroy: function() {
      this.$spoilers.off('.' + this.uid);
    }
  }
});

/**
 * Styles elements from the article body
 */
$$.jqueryPlugin('articleBody', {
  methods: {
    init: function(uid, options, $container) {
      this.$container = $container;
      this.createIframe();
      this.createTable();
    },

    createIframe: function() {
      var $iframeContainer = $('<div class="iframe"></div>');
      var $iframe = this.$container.find('iframe');
      var height = $iframe.height() / $iframe.width() * 100;
      $iframe.after($iframeContainer);
      $iframeContainer.append($iframe).css('padding-bottom', height + '%');
    },

    createTable: function() {
      this.$container.find('table').each(function(i, element) {
        var $table = $(element);
        var $tableContainer = $('<div class="table-container"></div>');
        $table.after($tableContainer);
        $tableContainer.append($table);
      });
    }
  }
});

/**
 * Auto submit filtering form
 */
$$.jqueryPlugin('autosubmit', {
  methods: {
    init: function(uid, options, $container) {
      $container.find('input, select').on('change', function(event) {
        $(event.currentTarget).closest('form').submit();
      });
    }
  }
});

/**
 * List limit plugin
 * Truncates the list to the specified limit.
 * After clicking on the button, it expands the full list
 *
 * @example:
 * <ul data-plugin-list-limit='{"limit": 2}'>
 *     <li>One</li>
 *     <li>Two</li>
 *     <li>Three</li>
 *     <li class="js-ignore-item">Four</li>
 *     <li class="js-ignore-item">
 *         <button class="is-hidden js-show-more">Show more</button>
 *     </li>
 * </ul>
 */
$$.jqueryPlugin('listLimit', {
  defaultOptions: {
    // Limit
    limit: 3,

    // Selector to be ignored
    ignoreItemSelector: '.js-ignore-item',

    // "Show more" button selector
    showMoreSelector: '.js-show-more'
  },
  methods: {
    init: function(uid, options, $container) {
      this.uid = uid;
      this.options = options;

      this.$container = $container;
      this.$showMore = this.$container.find(this.options.showMoreSelector);
      this.$list = this.$container.find('li').not(this.options.ignoreItemSelector);

      if (this.$list.length <= this.options.limit) return;

      this.$showMore.removeClass('is-hidden');
      for (var i = this.options.limit; i < this.$list.length; i++) {
        this.$list.eq(i).addClass('is-hidden');
      }

      this.bindEvents();
    },

    bindEvents: function() {
      var click = 'click.' + this.uid + ' enterkey.' + this.uid;
      this.$container.one(click, this.options.showMoreSelector, this.handleShowMore.bind(this));
    },

    handleShowMore: function(event) {
      event.preventDefault();
      this.destroy();
    },

    destroy: function() {
      this.$showMore.addClass('is-hidden');
      this.$list.removeClass('is-hidden');
      this.$container.off('.' + this.uid);
    }
  }
});

/**
 * Theme color switcher
 * @example:
 *  <a href="#" class="header__color-mode-switcher" data-plugin-color-switcher>
 *    <span>
 *      <i class="fas fa-sun is-hidden--dark-mode"></i>
 *      <i class="fas fa-moon is-hidden--light-mode"></i>
 *    </span>
 *  </a>
 */
var UI_DARK = 'ui-dark';
var UI_LIGHT = 'ui-light';
var LS_COLOR_SCHEME = 'upi-color-scheme';

$$.jqueryPlugin('color-switcher', {
  methods: {
    init: function(uid, options, $container) {
      $container.on('click', function(event) {
        event.preventDefault();

        var className = window.theme.darkMode ? UI_LIGHT : UI_DARK;
        localStorage.setItem(LS_COLOR_SCHEME, className);

        document.documentElement.classList.remove(UI_DARK, UI_LIGHT);
        document.documentElement.classList.add(className);
        window.theme.darkMode = className === UI_DARK;
      });
    }
  }
});

$$.jqueryPlugin('header-menu', {
  defaultOptions: {
    activeButtonText: ''
  },
  methods: {
    init: function(uid, options, $container) {
      this.options = options;
      this.$button = $container.find('.js-toggle');
      this.$menu = $container.find('.js-menu');
      this.buttonText = this.$button.text();

      this.bindEvents();
    },

    bindEvents: function() {
      this.$button.on('click', this.handleMenuToggle.bind(this));
      $('body').on('click', this.handleBodyClick.bind(this));
    },

    handleMenuToggle: function(event) {
      event.preventDefault();
      this.$button.add(this.$menu).toggleClass('is-active');
      this.toggleButtonText();
    },

    handleBodyClick: function(event) {
      if (
        this.$menu[0] !== event.target &&
        !this.$menu.find(event.target).length &&
        this.$button[0] !== event.target &&
        !this.$button.find(event.target).length
      ) {
        this.$button.add(this.$menu).removeClass('is-active');
        this.toggleButtonText();
      }
    },

    toggleButtonText: function() {
      if (this.options.activeButtonText) {
        if (this.$button.hasClass('is-active')) {
          this.$button.find('.js-button-text').text(this.options.activeButtonText);
        }
        else {
          this.$button.find('.js-button-text').text(this.buttonText);
        }
      }
    }
  }
});

$$.jqueryPlugin('mobile-nav', {
  methods: {
    init: function(uid, options, $container) {
      this.$mobileButton = $container.find('.js-mobile-toggle');
      this.$mobileMenu = $container.find('.js-mobile-menu');
      this.$searchButton = $container.find('.js-search');
      this.$body = $('body');

      this.bindEvents();
    },

    bindEvents: function() {
      this.$mobileButton.on('click', this.handleMobileMenuToggle.bind(this));
      this.$searchButton.on('click', this.handleSearchClick.bind(this));
    },

    handleMobileMenuToggle: function(event) {
      event.preventDefault();
      this.$mobileMenu.add(this.$mobileButton).toggleClass('is-active');
      this.$body.toggleClass('mobile-menu-is-active');
    },

    handleSearchClick: function(event) {
      event.preventDefault();
      $('html, body').animate({scrollTop: 0}, 400);
      $('[type="search"]').focus();
    }
  }
});

$$.jqueryPlugin('sticky', {
  methods: {
    init: function(uid, options, $container) {
      $(window).on('scroll', function() {
        $container.toggleClass('sticky', window.scrollY > 0);
      });
    }
  }
});

$$.jqueryPlugin('article-list', {
  defaultOptions: {
    labelName: '',
    moreText: 'More'
  },
  methods: {
    init: function(uid, options, $container) {
      this.options = options;
      this.$container = $container;
      this.template = $$.template('#article-list');

      this.bindEvents();
    },

    bindEvents: function() {
      new $$.Request()
        .fetch('/api/v2/help_center/' + window.theme.locale + '/articles?label_names=' + this.options.labelName)
        .then(this.handleRequestSuccess.bind(this))
        .catch(this.handleRequestError.bind(this));

      this.$container.on('click', '.js-more', this.handleLoadMoreArticles.bind(this));
    },

    handleRequestSuccess: function(data) {
      var html = this.template({articles: data.articles, moreText: this.options.moreText});
      this.$container.html(html);
    },

    handleRequestError: function(err) {
      console.error(err.message);
    },

    handleLoadMoreArticles: function(event) {
      event.preventDefault();

      var $hiddenArticles = this.$container.find('.is-hidden');

      if ($hiddenArticles.length <= 4) {
        $hiddenArticles.removeClass('is-hidden');
        this.$container.find('.js-more-container').remove();
      }
      else {
        $hiddenArticles.each(function(i, element) {
          if (i < 4) {
            $(element).removeClass('is-hidden');
          }
        });
      }
    }
  }
});

$$.jqueryPlugin('section-list', {
  methods: {
    init: function(uid, options, $container) {
      this.$container = $container;
      this.template = $$.template($container.find('.template')[0]);

      this.bindEvents();
    },

    bindEvents: function() {
      new $$.Request()
        .fetch('/api/v2/help_center/' + window.theme.locale + '/sections?per_page=100')
        .then(this.handleRequestSuccess.bind(this))
        .catch(this.handleRequestError.bind(this));

      this.$container.on('change', 'select', this.handleOptionClick.bind(this));
    },

    handleRequestSuccess: function(data) {
      var sections = data.sections.filter(function(section) {
        return !section.parent_section_id;
      });

      var html = this.template({sections: sections, activeSection: $$.page.getFirstSectionId()});
      this.$container.html(html);
    },

    handleRequestError: function(err) {
      console.error(err.message);
    },

    handleOptionClick: function(event) {
      var $element = $(event.currentTarget);
      var url = $element.val();
      if (url) {
        window.location.replace(url);
      }
    }
  }
});

$(window).trigger('script:loaded');
