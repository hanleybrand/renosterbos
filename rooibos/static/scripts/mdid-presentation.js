/**
 * Created by hanley on 11/3/13.
 */

    mdid.generateLightTable =function() {

        // set up a deferred object for controlling execution
        var dfd = $.Deferred();

        if (mdid.debug === true) console.log('generating light table');
        if (mdid.debug === true) console.log($("#items"));

		var unsaved_changes = false;
		$(window).bind('beforeunload', function() {
            if (mdid.debug === true) console.log('bind presentation before_unload check');

			if (unsaved_changes)
				return 'You made changes to your presentation slides that will be lost if you continue.';
		});
		function mark_unsaved_changes(saved) {
                        if (mdid.debug === true) console.log('mark_unsaved_changes');

			unsaved_changes = (saved != 'saved');
			$('#update-items').css('font-weight', unsaved_changes ? 'bolder' : '');
		}

           $("#items tbody tr").each(function(i, e) {

                var inputs = $(".thumbnail-col", e).children().not('a');
                var thumbnail = $(".thumbnail-col a", e).children();
                var title = $("<div class='title'>").html($(".title-col", e).html());
                var order = $(".order-col", e).children().hide();
                var controls = $(".controls", e).children().hide();
                var annotation = $(".annotation-col", e).children().hide();
                $("#lighttable").append($("<div class='slide' id='slide" + i + "'>")
                        .append(inputs, thumbnail, title, order, annotation, controls));
           });

            $("#lighttable-buttons").show().children("button").attr('disabled', true);


        $("#duplicate-button").click(function(e) {
            var selected_items = $("#lighttable div.slide.selected");
            var insert_after = selected_items.last();
            selected_items.each(function(i, e) {
                var idx = parseInt($("#id_form-TOTAL_FORMS").val());
                $("#id_form-TOTAL_FORMS").val(idx + 1);
                var copy = $(e).clone();
                copy.attr('id', 'slide' + idx).removeClass('selected');
                $("input,textarea", copy).each(function(i, e) {
                    var input = $(e);
                    var name = input.attr('name', input.attr('name').replace(/[0-9]+/, idx)).attr('id', 'id_' + input.attr('name')).attr('name');
                    if (name.match(/-id$/)) input.val('');
                });
                $("div.title a", copy).bind('click', bind_preview_dialog);
                insert_after.after(copy);
                insert_after = copy;
            });
            $(".orderinput input").each(function(i, e) { $(e).val(i); });
            e.preventDefault();
            add_metadata_popup($("#lighttable"));
			mark_unsaved_changes();
        });

        $("#delete-button").click(function(e) {
            $("#lighttable div.slide.selected").each(function(i, e) {
                $(e).removeClass('selected').hide(200);
                $("input[id$=DELETE]", e).attr('checked', true);
            });
            $("#lighttable-buttons button").attr('disabled', true);
            e.preventDefault();
			mark_unsaved_changes();
        });

		$("#select-button").click(function(e) {
			var ids = [];
            $("#lighttable div.slide.selected").each(function(i, e) {
				ids.push($("input[name$=-record]", e).val());
            });
			recordSelection(ids, true);
            e.preventDefault();
        });

        function markHidden() {
            $("#lighttable div.slide").removeClass('hidden').has("input[id$=hidden]:checked").addClass('hidden');
        }
        markHidden();

        function showHide(hide) {
            $("#lighttable div.slide.selected").each(function(i, e) {
                $("input[id$=hidden]", e).attr('checked', hide);
            });
            markHidden();
			mark_unsaved_changes();
        }

        $("#show-button").click(function(e) { showHide(false); e.preventDefault(); });
        $("#hide-button").click(function(e) { showHide(true); e.preventDefault(); });

		$("#lighttable-annotation textarea").change(function() {
			mark_unsaved_changes();
		})

        var last_selected;

        function selectionChanged() {
            selected = $("#lighttable div.slide.selected");
            $("#lighttable-buttons button").attr('disabled', selected.length == 0);
            if (last_selected) {
                $("textarea", last_selected).val($("#lighttable-annotation textarea").val());
            }
            if (selected.length == 1) {
                last_selected = selected;
                $("#lighttable-annotation textarea").val($("textarea", last_selected).val()).attr('disabled', false);
                $("#customize-link").empty().append($("a.customize", last_selected).clone().show());
            } else {
                last_selected = null;
                $("#lighttable-annotation textarea").val('').attr('disabled', true);
                 $("#customize-link").empty();
            }
        }

        $("#items-form").submit(function() {
			selectionChanged();
			mark_unsaved_changes('saved');
		});

        var firstselection;

        function select_slide(e) {
            $("#lighttable div.slide").removeClass('selected');
            var self = $(this);
            if (!e.shiftKey || !firstselection) {
                firstselection = self;
            } else if (firstselection.attr('id') != self.attr('id')) {
                var id = "[id=" + firstselection.attr("id") + "]";
                (self.nextAll(id).length ? self.nextUntil(id) : self.prevUntil(id)).add(firstselection).addClass('selected');
            }
            self.addClass('selected');
            selectionChanged();
            e.stopPropagation();
        }

		function convert_to_slide(item) {
			var record_url = item.attr('href');
			var image = item.children('img');
			var id = image.attr("id");
			id = id.substring(id.lastIndexOf('-') + 1);
			recordSelection(id, false);
			var title = image.attr("alt");
			var idx = parseInt($("#id_form-TOTAL_FORMS").val());
			$("#id_form-TOTAL_FORMS").val(idx + 1);
			var copy = $("#lighttable div.slide").eq(0).clone();
			copy.attr('id', 'slide' + idx).removeClass('selected');
			// fix customize link
			customize_url = $("a.customize", copy).attr('href');
			// TODO: this relies on specific URLs, should not be hardcoded
			customize_url = customize_url.substring(customize_url.indexOf('/edit/') + 1)
			$("a.customize", copy).attr('href', record_url + customize_url);
			// fix title
			$("div.title a", copy).attr('href', record_url).text(title).bind('click', bind_preview_dialog);
			// fix thumbnail
			$("img", copy).attr('alt', title).attr('src', image.attr('src')).attr('id', 'item-' + idx + image.attr('id').substring(6));
			// fix form inputs
			$("input,textarea", copy).each(function(i, e) {
				var input = $(e);
				var name = input.attr('name', input.attr('name').replace(/[0-9]+/, idx)).attr('id', 'id_' + input.attr('name')).attr('name');
				if (name.match(/-id$/)) input.val('');
				else if (name.match(/-record$/)) input.val(id);
				else if (name.match(/-annotation$/)) input.val('');
				else if (name.match(/-hidden$/)) input.attr('checked', false);
				else if (name.match(/-DELETE$/)) input.attr('checked', false);
			});
			item.replaceWith(copy);
			copy.show();
		}

        var selected_elements;

        $("#lighttable div.slide").disableSelection().live('click', select_slide).css('cursor', 'move');
        $("#lighttable").append(
            "<br style='clear: both;'>"
        ).click(function(e) {
            if (!e.shiftKey) {
                $("#lighttable div.slide").removeClass('selected');
                firstselection = null;
                selectionChanged();
            }
        }).sortable({
            containment: '#lighttable',
            tolerance: 'pointer',
            placeholder: 'lighttable-placeholder',
            delay: 50,
            distance: 5,
            update: function(event, ui) {
                var before = true;
                var insert_after = ui.item;
                var id = ui.item.attr('id');
                selected_elements.each(function(i, e) {
                    if ($(e).attr('id') == id) before = false;
                    else if (before) ui.item.before(e);
                    else {
                        insert_after.after(e);
                        insert_after = $(e);
                    }
                });
                $(".orderinput input").each(function(i, e) { $(e).val(i); });
                ui.item.unbind('click').one("click", function (e) {
                    e.stopImmediatePropagation(); $(this).click(select_slide);
                });
				mark_unsaved_changes();
				selectionChanged();
            },
			receive: function(event, ui) {
				// received a dragged item from the basket
				convert_to_slide($("#lighttable a.ui-draggable"));
				// fix in case slide got dropped behind trailing <br> element
				$("#lighttable>br").appendTo($("#lighttable"));
			},
            start: function(event, ui) {
                if (!ui.item.hasClass('selected')) {
                    $("#lighttable div.slide").removeClass('selected');
                    ui.item.addClass('selected');
                    ui.helper.addClass('selected');
                    firstselection = ui.item;
                }
                selected_elements = $("#lighttable div.slide.selected");
                selected_elements.not(ui.item).hide(100);
            },
            stop: function(event, ui) {
                selected_elements.not(ui.item).show(100);
				selectionChanged();
            }
            }).show();

		$("#basket-thumbs").bind('update', function() {
			$("#basket-thumbs a").draggable({
				scroll: true,
				helper: 'clone',
				revert: 'invalid',
				appendTo: 'body',
				cursor: 'move',
				cursorAt: {left: 50, top: 50},
				connectToSortable: '#lighttable'
			});
			$("#lighttable").sortable('refresh');
		}).trigger('update');

        $("#lighttable-annotation").show().children().attr('disabled', true);

        if (window.location.hash && window.location.hash.match(/^#s/)) {
            $("#lighttable div.slide").has("input[id$=-id][value=" + window.location.hash.substring(2) + "]").addClass('selected');
            selectionChanged();
        }

		$("#presentation_sidebar_actions a").each(function() {
			addCopyLinkIcon($(this));
		});

		var bind_preview_dialog = function(e) {
			var a = $(this);
			var img = $("img.record-anchor", a.parent().parent());
			var prev = function() { return a.parents("div.slide").prev("div.slide").children("div.title").children("a") };
			var next = function() { return a.parents("div.slide").next("div.slide").children("div.title").children("a") };
			preview_dialog(a, img, prev, next)
			e.preventDefault();
		}

		$("#lighttable div.slide div.title a").bind('click', bind_preview_dialog);

		keepAtTop($("#lighttable-actionbar"), $("#lighttable"));
		keepAtTop($("#lighttable-annotation"), $("#lighttable"));

        // notify calling function that we're done
        dfd.resolve();
    }

// TODO: is a check/deferral needed here?  The table should always load, but this is what isn't executing on some pages


