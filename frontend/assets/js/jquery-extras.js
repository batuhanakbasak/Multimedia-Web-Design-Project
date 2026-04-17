/**
 * jQuery UX helpers (non-invasive; works alongside ES modules / fetch).
 * Login polish, table row hover, button feedback, smooth anchors, optional stagger.
 */
(function () {
  var $ = window.jQuery;
  if (!$ || !$.fn) return;

  function injectStyles() {
    if (document.getElementById('jquery-extras-styles')) return;
    var css =
      '.jq-tr-hover td{background-color:rgba(99,102,241,.07)!important;transition:background-color .15s ease}' +
      '.jq-btn-press{opacity:.88!important;transition:opacity .1s ease}' +
      '.jq-fade-in{opacity:0}';
    $('<style id="jquery-extras-styles">').text(css).appendTo('head');
  }

  function shakeCard($card) {
    if (!$card || !$card.length) return;
    var d = 6;
    var start = $card.css('margin-left') || '0px';
    $card
      .css('position', 'relative')
      .animate({ marginLeft: '-=' + d }, 45)
      .animate({ marginLeft: '+=' + d * 2 }, 45)
      .animate({ marginLeft: '-=' + d * 2 }, 45)
      .animate({ marginLeft: '+=' + d }, 45, function () {
        $card.css('margin-left', start);
      });
  }

  function wireAuthForm($form, messageSelector) {
    var $card = $form.closest('section');
    if ($card.length) {
      $card.addClass('jq-fade-in');
      $card.animate({ opacity: 1 }, 300, function () {
        $card.removeClass('jq-fade-in');
      });
    }

    $form.find('input:not([type="hidden"])').filter(function () {
      return $(this).is(':visible');
    }).first().trigger('focus');

    var $msg = messageSelector ? $form.closest('section').find(messageSelector) : $();
    if (!$msg.length && messageSelector) {
      $msg = $(messageSelector);
    }
    if ($msg.length && $msg[0]) {
      var lastText = '';
      var obs = new MutationObserver(function () {
        var el = $msg[0];
        var visible = !el.hidden && (($msg.text() || '').trim().length > 0);
        var text = ($msg.text() || '').trim();
        if (visible && text && text !== lastText) {
          lastText = text;
          shakeCard($card);
        }
      });
      obs.observe($msg[0], {
        attributes: true,
        attributeFilter: ['hidden'],
        childList: true,
        subtree: true,
        characterData: true,
      });
    }

    $form.on('submit', function () {
      $form.find('button[type="submit"], input[type="submit"]').addClass('jq-btn-press');
    });
  }

  function initEscapeClearsPassword() {
    $(document).on('keydown.jqueryExtras', function (e) {
      if (e.key !== 'Escape') return;
      var el = document.activeElement;
      if (!el || !el.closest) return;
      var form = el.closest('[data-login-form], [data-register-form]');
      if (!form) return;
      $(form).find('input[type="password"], input[name="password"]').val('');
    });
  }

  function initAuthForms() {
    $('[data-login-form]').each(function () {
      wireAuthForm($(this), '[data-login-message]');
    });
    $('[data-register-form]').each(function () {
      wireAuthForm($(this), '[data-register-message]');
    });
    initEscapeClearsPassword();
  }

  function initTableHover() {
    $(document)
      .on('mouseenter', '.table-wrap tbody tr', function () {
        $(this).addClass('jq-tr-hover');
      })
      .on('mouseleave', '.table-wrap tbody tr', function () {
        $(this).removeClass('jq-tr-hover');
      });
  }

  function initButtonPress() {
    $(document).on('mousedown', '.button, .auth-submit, .button-secondary, button[type="submit"]', function () {
      var $b = $(this);
      $b.addClass('jq-btn-press');
      setTimeout(function () {
        $b.removeClass('jq-btn-press');
      }, 140);
    });
  }

  function initSmoothAnchors() {
    $(document).on('click', 'a[href^="#"]', function (e) {
      var id = this.getAttribute('href');
      if (!id || id === '#' || id.length < 2) return;
      var target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      $('html, body').animate({ scrollTop: $(target).offset().top - 24 }, 420);
    });
  }

  function initHeroBannerFade() {
    var $hero = $('.page-banner, .student-hero').first();
    if (!$hero.length) return;
    $hero.css('opacity', 0).animate({ opacity: 1 }, 380);
  }

  function initStudentShell() {
    var $shell = $('.student-shell');
    if (!$shell.length) return;
    $shell.css('opacity', 0).animate({ opacity: 1 }, 260);
  }

  function initAdminShell() {
    var $shell = $('.admin-shell');
    if (!$shell.length) return;
    $shell.css('opacity', 0).animate({ opacity: 1 }, 240);
  }

  $(function () {
    injectStyles();
    initAuthForms();
    initTableHover();
    initButtonPress();
    initSmoothAnchors();
    initStudentShell();
    initAdminShell();
    initHeroBannerFade();
  });
})();
