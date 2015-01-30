$(document).ready(function(){

	// for Background Colors
	var panelCount = $('.panel').length
	var panelHeight;
	var panelColor = [];
	var panelColorShifted = [];

	// for Panel Size
	var marginHeight = .3; // set to the sum percentage of the space above and below content
	var separationHeight = 0; // set the amount to extra space desired between panels
	var contentIdealWidth = 500; // set to ideal or default content size
	var contentIdealHeight = 305; // set to ideal or default content size
	var panelSpacing = .15 // percentage of space between panels
	var proportionalWidth = contentIdealWidth / contentIdealHeight;
	var proportionalHeight = contentIdealHeight / contentIdealWidth;
	var slideMaxWidth = $('.slide-content-wrapper').css('max-width');
	var marginWidth = (1-(parseFloat(slideMaxWidth) / 100));

	var showContact; // toggle for Contact button function
	var slideStart = 0; // starting slide

	// target Firefox for different cursor method
	// i know this is a bad way of doing things, but so is making a browser that can't properly render alpha transparency
	var isFirefox = typeof InstallTrigger !== 'undefined';


	setContentSize();
	
	getColors();

	prepVideoPlayers();

	prepProjectLinks();

	// setup lazy-loading and load first project's images
	$('.lazy-load img').unveil();
	$('#panel_0 img').trigger('unveil');

	// create and initialize Carousel
    var carousel = new Carousel(".carousel");
    carousel.init();
    $('.panel:eq('+slideStart+'), .panel:eq('+(slideStart-1)+'), .panel:eq('+(slideStart+1)+')').addClass('visible-panel');

    // create and initialize slider
    createSliderElements();
	initSlider($('#panel_0 .slider'));

	createPanelNav();

	// check if panel has dark bg
	if ( $('#panel_0').hasClass('dark') ) {
		$('body').addClass('invert');
	} else {
		$('body').removeClass('invert');
	}

	/* ==========================================================================
	Hammer.js Carousel - adapted from Hammer.js example
	========================================================================== */

	// requestAnimationFrame and cancel polyfill
    (function() {
        var lastTime = 0;
        var vendors = ['ms', 'moz', 'webkit', 'o'];
        for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
            window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
            window.cancelAnimationFrame = window[vendors[x]+'CancelAnimationFrame'] || window[vendors[x]+'CancelRequestAnimationFrame'];
        }

        if (!window.requestAnimationFrame)
            window.requestAnimationFrame = function(callback, element) {
                var currTime = new Date().getTime();
                var timeToCall = Math.max(0, 16 - (currTime - lastTime));
                var id = window.setTimeout(function() { callback(currTime + timeToCall); },
                        timeToCall);
                lastTime = currTime + timeToCall;
                return id;
            };

        if (!window.cancelAnimationFrame)
            window.cancelAnimationFrame = function(id) {
                clearTimeout(id);
            };
    }());

    function Carousel(element) {
        var self = this;
        element = $(element);
        var container = $(".panel-wrap", element);
        var panels = $(".panel-wrap .panel", element);
        var panel_height = 0;
        var panel_count = panels.length;
        var current_panel = 0;

        // make this available outside
        this.panel_count = panel_count;

        this.init = function() {
            setPanelDimensions();
            $(window).on("load resize orientationchange", function() {
                setPanelDimensions();
            })
            $('.panel:eq(0)').addClass('current-panel');
        };

        function setPanelDimensions() {
            panel_height = element.height();
            panels.each(function() {
                $(this).height(panel_height);
            });
            container.height(panel_height*panel_count);
        };

        this.showPanel = function( index ) {
            var original_panel = current_panel; // for checking if panel changed
            // between the bounds
            index = Math.max(0, Math.min(index, panel_count-1));
            current_panel = index;
            var offset = -((100/panel_count)*current_panel);
            setContainerOffset(offset, true);
            // make this available outside
            this.current_panel = current_panel;
            // callback for panel change
            if (original_panel != current_panel) {
                panelChanged(current_panel);
            }
        };

        function setContainerOffset(percent, animate) {
            container.removeClass("animate");
            if(animate) {
            	if (Modernizr.csstransitions) {
                	container.addClass("animate");
                } else {
                	var px = ((panel_height*panel_count) / 100) * percent;
                	container.animate({top: px+"px"}, 300, 'easeInOutSine');
                	return;
                }
            }
            if(Modernizr.csstransforms3d) {
                container.css("transform", "translate3d(0,"+ percent +"%,0) scale3d(1,1,1)");
            }
            else if(Modernizr.csstransforms) {
                container.css("transform", "translate(0,"+ percent +"%)");
            }
            else {
                var px = ((panel_height*panel_count) / 100) * percent;
                container.css("top", px+"px");
            }
        }

        this.next = function() { return this.showPanel(current_panel+1, true); };
        this.prev = function() { return this.showPanel(current_panel-1, true); };

        function handleHammer(ev) {
            // console.log(ev);
            // disable browser scrolling
            ev.gesture.preventDefault();
            switch(ev.type) {
                case 'dragdown':
                case 'dragup':
                    // stick to the finger
                    var panel_offset = -(100/panel_count)*current_panel;
                    var drag_offset = ((100/panel_height)*ev.gesture.deltaY) / panel_count;
                    // slow down at the first and last panel
                    if((current_panel == 0 && ev.gesture.direction == Hammer.DIRECTION_DOWN) ||
                        (current_panel == panel_count-1 && ev.gesture.direction == Hammer.DIRECTION_UP)) {
                        drag_offset *= .4;
                    }
                    setContainerOffset(drag_offset + panel_offset);
                    break;
                case 'swipeup':
                    self.next();
                    ev.gesture.stopDetect();
                    break;
                case 'swipedown':
                    self.prev();
                    ev.gesture.stopDetect();
                    break;
                case 'release':
                    // more then 50% moved, navigate
                    if(Math.abs(ev.gesture.deltaY) > panel_height/2) {
                        if(ev.gesture.direction == 'up') {
                            self.next();
                        } else {
                            self.prev();
                        }
                    }
                    else {
                        self.showPanel(current_panel, true);
                    }
                    break;
            }
        }

        element.hammer({ drag_lock_to_axis: true, stop_browser_behavior: false }) // stop_browser_behavior: false to enable text selection
            .on("release dragdown dragup swipedown swipeup", handleHammer);
    }

    // prevent overscrolling on iOS
	$(document).on('touchmove',function(e){
		e.preventDefault();
	});

    function panelChanged(index) {
    	var currPanel = $('.panel:eq('+index+')');

    	// change bg color
    	changeBgColor(index);

		// set current bullet
    	$('#panel-nav li').removeClass('on');
		$('#panel-nav li:eq('+index+')').addClass('on');

		// set slide progress
		setSliderProgress(currPanel);

		// check if panel has dark bg
		if ( $(currPanel).hasClass('dark') ) {
			$('body').addClass('invert');
		} else {
			$('body').removeClass('invert');
		}

		// hide slider control cursors
		if (isFirefox) {
			$('.slider-next, .slider-prev, .panel-next, .panel-prev').find('span').css('opacity', 0);
		}

	    // delay to ensure smooth scrolling
	    setTimeout(function () {
	    	var prev = index-1;
	    	var next = index+1;
	    	// for looping back to top panel
	    	if (next == panelCount)
	    		next = 0;
	    	// add class 'visible-panel' class to current and prev/next panels
	    	$('.visible-panel').removeClass('visible-panel');
	    	$('.panel:eq('+index+'), .panel:eq('+prev+'), .panel:eq('+next+')').addClass('visible-panel');
		    // setup new slider
			mySwipe.kill();
			initSlider('#panel_'+index+' .slider');
			// add class to current panel - after slider init to prevent glitches on iOS
            $('.current-panel').removeClass('current-panel');
            $(currPanel).addClass('current-panel');
			// lazy load images
			$('.current-panel img').trigger('unveil');
			// pause video if playing
	    	pauseVideo();
	    	// cursor positioning
	    	if (isFirefox) {
		    	$('.slider-next, .slider-prev, .panel-next, .panel-prev').find('span').css('opacity', 1);
	   			var $arrow = $('.hover-slider-controls').find('span');
	   			var offset = $('.hover-slider-controls').offset();
	   			$arrow.css({
	   				'opacity':0,
	            	'left': mousePosX - offset.left,
	            	'top': mousePosY - offset.top
	            })
	            .show()
	            .animate({opacity:1},500);
            }
		}, 300);
	}

	// next panel controls
	$('.panel-next').click(function(e){
		if (carousel.current_panel != (carousel.panel_count - 1)) {
			carousel.next();
		} else {
			carousel.showPanel(0, true);
		}
	});

	// prev panel controls
	$('.panel-prev').click(function(e){
		if (carousel.current_panel != 0) {
			carousel.prev();
		} else {
			carousel.showPanel((panelCount-1), true);
		}
	});

	/* ==========================================================================
	MouseWheel Triggers
	========================================================================== */
	
	var scroll_up_timer = 0;
	var scroll_down_timer = 0;
	var scroll_count = 0;

	$('.panel').mousewheel(function(event, delta, deltaX, deltaY) {
	    event.preventDefault();
	    scroll_count++; // to creat a scroll buffer
	    if (scroll_count >= 10) {
	        if (deltaY > 0) { // scroll up
	            if (scroll_up_timer == 0) {
	                mouseWheelUp();
	                // start timer to stop calls from continuous scrolling
	                setTimeout(function () {
	                    scroll_up_timer = 0;
	                    scroll_count = 0;
	                }, 1000);
	                scroll_up_timer = 1;
	            }
	        } else { // scroll down
	            if (scroll_down_timer == 0) {
	                mouseWheelDown();
	                // start timer to stop calls from continuous scrolling
	                setTimeout(function () {
	                    scroll_down_timer = 0;
	                    scroll_count = 0;
	                }, 1000);
	                scroll_down_timer = 1;
	            }   
	        }
	        scroll_count = 0;
	    }
	    return false;
	});

	function mouseWheelUp() {
		carousel.prev();
	}

	function mouseWheelDown() {
		carousel.next();
	}

    /* ==========================================================================
	Resizing
	========================================================================== */

	$(window).resize(function() {
		// run functions when resize stops
		clearTimeout(this.id);
    	this.id = setTimeout(doneResizing, 500);
	});

	function doneResizing(){
		setContentSize();

		$('.slider').each(function() {
			alignVideoControl($(this).parent());
			alignProjectLink($(this).parent());
		});
	}

    /* ==========================================================================
	Modal
	========================================================================== */

	$('.modal-link').click(function(e){
		var modal = $(this).attr('href');
		var modalOn = $(modal).hasClass('on');
		$('.modal').removeClass('on'); // clear all on states since there are multiple elements
		$('.modal-link').removeClass('on');
		$(modal).toggleClass('on', !modalOn); // if modal is not on, toggle, else, it was just turned off
		$(this).toggleClass('on', !modalOn);
		$('body').toggleClass('modal-on', !modalOn);
		// pause any videos playing
		pauseVideo();
		e.preventDefault();
	});

	/* ==========================================================================
	Panel Content Size
	========================================================================== */

	function setContentSize() {
		panelHeight = $(window).height();
 		// set panels to window size and constrain slide-content
		var windowWidth = $(window).width();
		var contentMaxWidth;
		var contentHeight = panelHeight - (marginHeight * panelHeight); 
		var panelSpacingCalculated = panelSpacing * panelHeight;
		// calculate whether the slide-content is too tall for the space
		if ( (windowWidth - (windowWidth * marginWidth)) * proportionalHeight > contentHeight ) {
			contentMaxWidth = contentHeight * proportionalWidth + 'px'; // must include 'px' here because slideMaxWidth has it included 
		} else {
			contentMaxWidth = slideMaxWidth;
		}
		// resize slide-content and panel
	    $('.slide-content:not(.info)').css({'max-height':contentHeight + 'px'}); // not .info fix for Firefox
	    $('.slide-content-wrapper').css({'max-width':contentMaxWidth});
	}

	/* ==========================================================================
	Background Colors
	========================================================================== */
	
    // Get color values from CSS
    function getColors() { 
    	if (Modernizr.csstransitions) {
	    	// var splitColorsRGB = /rgb\((\d{1,3}), (\d{1,3}), (\d{1,3})\)/; // regex for CSS RGB value
			var i = panelCount;
			while (i--) { 
				var panel = '#panel_' + i;
				var cssColor = $(panel).css('background-color');
				$(panel).css('background-color', 'transparent'); // clear CSS color since it's no longer needed
				panelColor[i] = cssColor;
			}
			// set first panel color
			$('#bg-1').css('background-color', panelColor[0]);
		}
	}

	function changeBgColor(panel) {
		if (Modernizr.csstransitions) {
	    	if ($('#bg-1').hasClass('bg-off')) {
				$('#bg-1').css('background-color', panelColor[panel]);
				var newBgOpacity = 1;
			} else {
				$('#bg-2').css('background-color', panelColor[panel]);
				var newBgOpacity = 0;
			}
			$('#bg-1').toggleClass('bg-off');
		}
	}

	/* ==========================================================================
	Panel Nav
	========================================================================== */

	function createPanelNav() {
		// create bullets
		$('#panel-nav').append('<ul></ul>');
		// var bullet_container = $('#panel-nav ul');
		var i = panelCount;
		while (i--) {
			var panelHeadline = $('.panel:eq('+i+')').find('h1:eq(0)');
	    	$('#panel-nav ul').prepend('<li><span class="label">' + $(panelHeadline).data('short') + '</span><span class="marker"></span></li>');
		}
		// set current bullet
		$('#panel-nav li:eq(0)').addClass('on');
	}

	$('#panel-nav li').click(function(e){
		if ($(window).width() > 600) { // not on phones
			var i = $(this).index();
			if (carousel.current_panel != i) {
				// make sure the first current slide is visible when you get there
				$('.panel:eq('+i+')').addClass('visible-panel');
				// go to panel
				carousel.showPanel(i, true);
			}
		}
	});

	/* ==========================================================================
	Project Links
	========================================================================== */

	function prepProjectLinks() {
		if (!Modernizr.touch) {
			$('.project-link').each(function(){
				var parentPanel = $(this).parents(".panel");
				var href = $(parentPanel).find('.project-link').attr('href');
			 	$(parentPanel).find('nav').append('<a class="project-link-trigger" target="_blank" href="'+ href +'"></a>');
			});
		}
    }

    // sets position and size of Video Control to match video
	function alignProjectLink(parent, prevnext) {
		if (!Modernizr.touch) {
			var linkTrigger = $(parent).find('.project-link-trigger.visible');
			if ( $(linkTrigger).length ) { // only run if video is visible
			    var projectLink = $(parent).find('.project-link');
			    if (prevnext) { projectLink = $(parent).find('.current-slide').find('.project-link'); } // fix for two bullet sliders
			    var vidPos = $(projectLink).offset();
		  		var vidWidth = $(projectLink).outerWidth();
		  		var vidHeight = $(projectLink).outerHeight();
		  		// set video control position and dimensions
		  		$(linkTrigger).offset({ top: vidPos.top, left: vidPos.left })
		  			.width(vidWidth)
		  			.height(vidHeight);
	  		}
  		}
	}

	$('.project-link-trigger').hover(function(){
		$(this).parents('.panel').find('.project-link').toggleClass('hover');
	});

	/* ==========================================================================
	Swipe Slider
	========================================================================== */

	var move_to_next_panel;
	var move_to_prev_panel;

	var mousePosX;
	var mousePosY;

	// var hoverElem = null;
	// $('.slider-next, .slider-prev, .panel-next, .panel-prev').on('mouseenter', function() { hoverElem = this; });

	function createSliderElements() {
		// add slide classes
		$('.swipe-wrap').children('div').addClass('slide');
		$('.slider').each(function( index ) {
			// create slider and panel prev/next nav
			if (isFirefox) {
				$(this).siblings('nav').append(
					'<div class="slider-prev-next-wrap"><div class="slider-prev"><span class="slider-prev-cursor"></span></div><div class="slider-next"><span class="slider-next-cursor"></span></div></div>'
					+ '<div class="panel-prev-next-wrap"><div class="panel-prev"><span class="panel-prev-cursor"></span></div><div class="panel-next"><span class="panel-next-cursor"></span></div></div>'
				);
			} else {
				$(this).siblings('nav').append(
					'<div class="slider-prev-next-wrap"><div class="slider-prev"></div><div class="slider-next"></div></div>'
					+ '<div class="panel-prev-next-wrap"><div class="panel-prev"></div><div class="panel-next"></div></div>'
				);
			}
			// set current slide
        	$(this).find('.slide:eq('+slideStart+')').addClass('current-slide');
		});

		// set slide progress
		setSliderProgress( $('.panel:eq(0)') );
	}

	function initSlider(obj) {
		var currSlide = $(obj).find('.current-slide');
		var start = $(currSlide).index();

		// hide prev slide control on first slide on first panel
		if ($(obj).parent().index() == 0 && start == 0) {
			$('.slider-prev').hide(0);
		} else {
			$('.slider-prev').show(0);
		}

		// swipe.js needs this when referencing by class
		obj = $(obj).get(0); 
		// video controls
      	if ( $(currSlide).find('.portfolio-video').length ) {
      		$(obj).parent().find('.video-controller').addClass('visible');
      		alignVideoControl($(obj).parent(), true);
      	}
      	// project link trigger
      	if ( $(currSlide).find('.project-link').length ) {
      		$(obj).parent().find('.project-link-trigger').addClass('visible');
      		alignProjectLink($(obj).parent(), true);
      	}
		window.mySwipe = Swipe(obj, {
			startSlide: start, //slideStart,
			continuous: false,
		    callback: function(pos, elem) {
		    	// add class to current slide
		      	$(elem).siblings().removeClass('current-slide');
		      	$(elem).addClass('current-slide');
		      	// hide video control before transition
		      	$(obj).parent().find('.video-controller').removeClass('visible');
		      	// hide project link trigger
		      	$(obj).parent().find('.project-link-trigger').removeClass('visible');
		      	// reset move to next variable if not on last slide
		      	if (mySwipe.getPos() != mySwipe.getNumSlides() - 1) {
		      		move_to_next_panel = null;
		      	}
		      	// reset move to next variable if not on last slide
		      	if (mySwipe.getPos() != 0) {
		      		move_to_prev_panel = null;
		      	}
		      	// slide progress bar
		      	setSliderProgress( $('.current-panel') );

		      	// hide prev slide control on first slide on first panel
				if ($('.current-panel').index() == 0) {
					if (pos == 0) {
						$('.current-panel .slider-prev').hide(0);
					} else {
						$('.current-panel .slider-prev').show(0);
						$('.current-panel .slider-next').hide(0).show(0); // force update of cursor
					}
				}
			},
			transitionEnd: function(pos, elem) {
				// video controls
		      	if ( $(elem).find('.portfolio-video').length ) {
		      		$(obj).parent().find('.video-controller').addClass('visible');
		      		alignVideoControl($(obj).parent(), true);
		      	}
		      	// pause video if playing
				pauseVideo();
				// project link trigger
		      	if ( $(elem).find('.project-link').length ) {
		      		$(obj).parent().find('.project-link-trigger').addClass('visible');
		      		alignProjectLink($(obj).parent(), true);
		      	}
			}
		});
		// reset for moving to next panel
		move_to_next_panel = null;
		moveToNextPanel();
		// reset for moving to prev panel
		move_to_prev_panel = null;
		moveToPrevPanel();
	}

	// move to next panel if trying to progress on the last slide
	function moveToNextPanel() {
		if (mySwipe.getPos() == mySwipe.getNumSlides() - 1) {
			if (move_to_next_panel) {
				move_to_next_panel = null;
				// reset current-slide to first
				$('.current-panel .current-slide').removeClass('current-slide');
				$('.current-panel .slide:eq('+slideStart+')').addClass('current-slide');
				if (carousel.current_panel != (carousel.panel_count - 1)) {
					carousel.next();
				} else {
					carousel.showPanel(0, true);
				}
			} else {
				move_to_next_panel = true;
			}
		}
	}

	// move to next panel if trying to progress on the last slide
	function moveToPrevPanel() {
		if (mySwipe.getPos() == 0) {
			if (move_to_prev_panel) {
				move_to_prev_panel = null;
				carousel.prev();
			} else {
				move_to_prev_panel = true;
			}
		}
	}

	// next button controls
	$('.slider-next').click(function() {
		mySwipe.next();
		moveToNextPanel();
	});

	// prev button controls
	$('.slider-prev').click(function() {
		mySwipe.prev();
		moveToPrevPanel();
	});
	
	// capture swipes to the next slide
	$('#container').hammer({ swipe_velocity: 0.3 }).on("swipeleft", moveToNextPanel);

	// progress bar
	function setSliderProgress(currentPanel) {
		var currSlideIndex = $(currentPanel).find('.current-slide').index();
		var slideCount = $(currentPanel).find('.slide').length;
		var sliderProgress = (currSlideIndex + 1) / slideCount * 100;
		var time = 200;
		$('#slider-progress').transition({ x: sliderProgress + '%' }, time, 'cubic-bezier(0.165, 0.84, 0.44, 1)');
		// delay text count update to ensure speed on iOS
		window.setTimeout(function () {
		    $('#slider-progress').text((currSlideIndex + 1) + '/' + slideCount);
		}, time);
		if (slideCount == 1) {
			$('#slider-progress-wrap').addClass('one-slide');
		} else {
			$('#slider-progress-wrap').removeClass('one-slide');
		}
	}

	// show progress bar on click
	$('#slider-progress-wrap').click(function(event){
	    $(this).toggleClass('show');
		window.setTimeout(function () {
		    $('#slider-progress-wrap').removeClass('show');
		}, 1000);
	});


	// set cursor image position
	// taken from http://studiompls.com
	if (isFirefox) {
		$('.slider-next, .slider-prev, .panel-next, .panel-prev').bind('mousemove', function(e) {
	        var $this = $(this);
	        var $arrow = $this.find('span');
	        var offset = $this.offset();
	        mousePosX = e.pageX;
	        mousePosY = e.pageY;
	        $arrow.css({
	        	'left': e.pageX - offset.left,
	        	'top': e.pageY - offset.top
	        });
	    });

	    $('.slider-next, .slider-prev, .panel-next, .panel-prev').hover(function(){
			$(this).toggleClass('hover-slider-controls');
		});
	}

	/* ==========================================================================
	Videos
	========================================================================== */

    // sets position and size of Video Control to match video
	function alignVideoControl(parent, prevnext) {
		if (!Modernizr.touch) {
			var vidControl = $(parent).find('.video-controller.visible');
			if ( $(vidControl).length ) { // only run if video is visible
			    var vidContainer = $(parent).find('.portfolio-video');
			    if (prevnext) { vidContainer = $(parent).find('.current-slide').find('.portfolio-video'); } // fix for two bullet sliders
			    var vidPos = $(vidContainer).offset();
		  		var vidWidth = $(vidContainer).width();
		  		var vidHeight = $(vidContainer).outerHeight();
		  		// set video control position and dimensions
		  		$(vidControl).offset({ top: vidPos.top, left: vidPos.left })
		  			.width(vidWidth)
		  			.height(vidHeight);
	  		}
  		}
	}

	function prepVideoPlayers() {
		$('.portfolio-video').find('iframe').each(function(){
			// add ID
			var parentPanel = $(this).parents(".panel");
			var vidID = $(parentPanel).attr('id') + '-player';
			$(this).attr('id', vidID);
			// add API info to src
			var vidSRC = $(this).attr('src');
			$(this).attr('src', vidSRC + '&api=1&player_id=' + vidID);
			// initialize Vimeo API
			var player = Froogaloop(this);
			player.addEvent('ready', function() {
				// player.addEvent('pause', onVideoPause);
			    player.addEvent('finish', onVideoFinish);
			});
			// create necessary video controls and align to visible videos
			if (!Modernizr.touch) {
			 	$(parentPanel).find('nav').append('<div class="video-controller"></div>');
		    	if ( $(this).parents('.slide-content-wrapper').parent().index() == slideStart ) {
		    		$(parentPanel).find('.video-controller').addClass('visible');
				}
			}
		});
    }

	function onVideoFinish(id) {
		$('.playing').removeClass('playing');
	}

	function pauseVideo() {
		// pause video if playing
		if ($(".playing").length) {
			var playingContainerID = $(".playing").attr('id');
			Froogaloop(playingContainerID + "-player").api('pause');
			$('.playing').removeClass('playing');
		}
	}

	function playPauseVideo(elem) {
		// set parent panel ID for use especially in the vimeo calls
		var currentContainerID = $(elem).parents(".panel").attr('id');

		// pause other playing video
		if ($(".playing").length) {
			var playingContainerID = $(".playing").attr('id');
			if (playingContainerID != currentContainerID) {
				Froogaloop(playingContainerID + "-player").api('pause');
				$(".playing").toggleClass("playing");
			}
		}

		// play or pause video appropriately
		var currentContainerElem = $("#" + currentContainerID);
		$(currentContainerElem).toggleClass("playing");
		if (currentContainerElem.hasClass("playing")) {
			Froogaloop(currentContainerID + "-player").api('play');
		} else {
			Froogaloop(currentContainerID + "-player").api('pause');
		}
	}
    
	// Video controller
	$('.video-controller').click(function(e){
		playPauseVideo($(this));
	});

	$('.portfolio-video').click(function(e){
		playPauseVideo($(this));
	});

	$('.video-controller').hover(function(){
		$(this).parents('.panel').find('.portfolio-video').toggleClass('hover');
	});

});
